'use strict';

const fs = require('fs');
const path = require('path');
const { readConfig } = require('../lib/config');
const { findSessionDir } = require('../lib/session-utils');

// ─── 日志 SSE 流 ─────────────────────────────

function handleLogsStream(req, res, params) {
  const agentId = params.get('agent') || 'main';
  const cfg = readConfig();
  const agentCfg = cfg && cfg.agents && cfg.agents.list && cfg.agents.list.find(a => a.id === agentId);
  const sessionDir = findSessionDir(agentId, agentCfg);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  function send(data) {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {}
  }

  if (!sessionDir) {
    send({ type: 'error', message: `Agent "${agentId}" 的 session 目录未找到` });
    return res.end();
  }

  function getLatestJSONL() {
    try {
      const files = fs.readdirSync(sessionDir).filter(f => f.endsWith('.jsonl') && !f.endsWith('.lock'));
      if (!files.length) return null;
      return path.join(sessionDir, files.sort((a, b) =>
        fs.statSync(path.join(sessionDir, b)).mtimeMs - fs.statSync(path.join(sessionDir, a)).mtimeMs
      )[0]);
    } catch { return null; }
  }

  let currentFile = null;
  let offset = 0;
  let watcher = null;

  function readNew() {
    const latest = getLatestJSONL();
    if (!latest) return;
    if (latest !== currentFile) { currentFile = latest; offset = 0; }
    try {
      const stat = fs.statSync(currentFile);
      if (stat.size <= offset) return;
      const fd = fs.openSync(currentFile, 'r');
      const buf = Buffer.alloc(stat.size - offset);
      fs.readSync(fd, buf, 0, buf.length, offset);
      fs.closeSync(fd);
      offset = stat.size;
      const lines = buf.toString('utf-8').split('\n').filter(l => l.trim());
      for (const line of lines) {
        try { send({ type: 'line', data: JSON.parse(line) }); } catch { send({ type: 'raw', text: line }); }
      }
    } catch {}
  }

  // 初始读取最后 50 行
  const initialFile = getLatestJSONL();
  if (initialFile) {
    currentFile = initialFile;
    try {
      const raw = fs.readFileSync(initialFile, 'utf-8');
      const lines = raw.split('\n').filter(l => l.trim());
      const last50 = lines.slice(-50);
      offset = Buffer.byteLength(raw, 'utf-8');
      for (const line of last50) {
        try { send({ type: 'line', data: JSON.parse(line) }); } catch { send({ type: 'raw', text: line }); }
      }
    } catch {}
  }

  try { watcher = fs.watch(sessionDir, { persistent: false }, () => readNew()); } catch {}

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch {}
    readNew();
  }, 3000);

  req.on('close', () => {
    clearInterval(heartbeat);
    try { watcher && watcher.close(); } catch {}
  });
}

module.exports = { handleLogsStream };
