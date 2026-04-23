'use strict';

const fs = require('fs');
const path = require('path');
const { readConfig } = require('../lib/config');
const { findSessionDir } = require('../lib/session-utils');

// ─── 日志 SSE 流 ─────────────────────────────

function handleLogsStream(req, res, params) {
  const agentId = params.get('agent') || 'main';
  // 只允许字母、数字、连字符、下划线，防止路径穿越
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(agentId)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Invalid agentId');
  }
  const cfg = readConfig();
  const agentCfg = cfg && cfg.agents && cfg.agents.list && cfg.agents.list.find(a => a.id === agentId);
  const sessionDir = findSessionDir(agentId, agentCfg);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  // 立即 flush 头部，确保浏览器马上收到 200 并触发 EventSource.onopen
  res.flushHeaders();

  function send(data) {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {}
  }

  // 发一条 connected 事件，让前端马上知道连接已建立
  send({ type: 'connected', agentId });

  if (!sessionDir) {
    // session 目录找不到时保持连接，每 10s 重试一次（Windows 路径可能有延迟）
    send({ type: 'warn', message: `未找到 Agent "${agentId}" 的 session 目录，等待中...` });
    const retryTimer = setInterval(() => {
      const cfg2 = readConfig();
      const agentCfg2 = cfg2 && cfg2.agents && cfg2.agents.list && cfg2.agents.list.find(a => a.id === agentId);
      const dir2 = findSessionDir(agentId, agentCfg2);
      if (dir2) {
        clearInterval(retryTimer);
        send({ type: 'info', message: `已找到 session 目录，开始读取日志...` });
        startWatching(dir2);
      } else {
        try { res.write(': heartbeat\n\n'); } catch { clearInterval(retryTimer); }
      }
    }, 10000);
    req.on('close', () => clearInterval(retryTimer));
    return;
  }

  function startWatching(dir) {
    function getLatestJSONL() {
      try {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl') && !f.endsWith('.lock'));
        if (!files.length) return null;
        return path.join(dir, files.sort((a, b) =>
          fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs
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
    } else {
      send({ type: 'info', message: '暂无日志，等待新会话...' });
    }

    try { watcher = fs.watch(dir, { persistent: false }, () => readNew()); } catch {}

    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n'); } catch {}
      readNew();
    }, 3000);

    req.on('close', () => {
      clearInterval(heartbeat);
      try { watcher && watcher.close(); } catch {}
    });
  }

  startWatching(sessionDir);
}

module.exports = { handleLogsStream };
