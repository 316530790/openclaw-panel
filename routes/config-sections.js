'use strict';

const fs = require('fs');
const path = require('path');
const { OPENCLAW_HOME } = require('../lib/constants');
const { readConfig, patchConfig, writeConfig, redactConfig, restoreRedacted } = require('../lib/config');
const { readBody, sendJson, sendError } = require('../lib/http-utils');

// ─── MCP 服务器管理 ──────────────────────────

function handleGetMcp(req, res) {
  const cfg = readConfig();
  sendJson(res, (cfg && cfg.mcp && cfg.mcp.servers) || {});
}

async function handleSaveMcpServer(req, res) {
  const body = await readBody(req);
  const { id, config: srvCfg } = body;
  if (!id) return sendError(res, 'id 是必填项', 400);
  try {
    patchConfig(['mcp', 'servers', id], srvCfg || {});
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleDeleteMcpServer(req, res, id) {
  try {
    const cfg = readConfig() || {};
    if (cfg.mcp && cfg.mcp.servers && cfg.mcp.servers[id]) {
      delete cfg.mcp.servers[id];
      writeConfig(cfg);
    }
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─── Sandbox 配置 ────────────────────────────

function handleGetSandbox(req, res) {
  const cfg = readConfig();
  sendJson(res, redactConfig((cfg && cfg.sandbox) || {}));
}

async function handleSaveSandbox(req, res) {
  const body = await readBody(req);
  try {
    const cfg = readConfig() || {};
    patchConfig(['sandbox'], restoreRedacted(cfg.sandbox || {}, body));
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─── Hooks 配置 ──────────────────────────────

function handleGetHooks(req, res) {
  const cfg = readConfig();
  sendJson(res, redactConfig((cfg && cfg.hooks) || {}));
}

async function handleSaveHooks(req, res) {
  const body = await readBody(req);
  try {
    const cfg = readConfig() || {};
    patchConfig(['hooks'], restoreRedacted(cfg.hooks || {}, body));
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─── Memory 配置 ─────────────────────────────

function handleGetMemory(req, res) {
  const cfg = readConfig();
  sendJson(res, (cfg && cfg.memory) || {});
}

async function handleSaveMemory(req, res) {
  const body = await readBody(req);
  try {
    patchConfig(['memory'], body);
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─── Memory 文件管理 ─────────────────────────

function handleGetMemoryFiles(req, res) {
  const memoryDirs = [
    path.join(OPENCLAW_HOME, 'memory'),
    path.join(OPENCLAW_HOME, 'agents', 'main', 'memory'),
  ];
  const cfg = readConfig();
  const agentList = (cfg && cfg.agents && cfg.agents.list) || [];
  for (const a of agentList) {
    memoryDirs.push(path.join(OPENCLAW_HOME, 'agents', a.id, 'memory'));
    if (a.agentDir) memoryDirs.push(path.join(a.agentDir, 'memory'));
  }

  const specialFiles = [
    path.join(OPENCLAW_HOME, 'MEMORY.md'),
    path.join(OPENCLAW_HOME, 'USER.md'),
    path.join(OPENCLAW_HOME, 'IDENTITY.md'),
  ];

  const files = [];
  const seen = new Set();

  for (const dir of memoryDirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      const entries = fs.readdirSync(dir);
      for (const e of entries) {
        if (!/\.(md|txt|markdown)$/i.test(e)) continue;
        const fp = path.join(dir, e);
        if (seen.has(fp)) continue;
        seen.add(fp);
        try {
          const stat = fs.statSync(fp);
          const content = fs.readFileSync(fp, 'utf-8');
          files.push({
            name: e, path: fp, dir, size: stat.size,
            lastModified: new Date(stat.mtimeMs).toISOString(),
            excerpt: content.slice(0, 300).replace(/\n/g, ' ').trim(),
          });
        } catch {}
      }
    } catch {}
  }

  for (const fp of specialFiles) {
    if (seen.has(fp)) continue;
    try {
      if (!fs.existsSync(fp)) continue;
      seen.add(fp);
      const stat = fs.statSync(fp);
      const content = fs.readFileSync(fp, 'utf-8');
      files.push({
        name: path.basename(fp), path: fp, dir: path.dirname(fp), size: stat.size,
        lastModified: new Date(stat.mtimeMs).toISOString(),
        excerpt: content.slice(0, 300).replace(/\n/g, ' ').trim(),
        special: true,
      });
    } catch {}
  }

  files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  sendJson(res, files);
}

function handleGetMemoryFile(req, res, name) {
  // 拒绝绝对路径和路径穿越
  if (!name || path.isAbsolute(name) || name.includes('..') || name.includes('\0')) {
    return sendError(res, 'Invalid file name', 400);
  }
  const resolvedHome = path.resolve(OPENCLAW_HOME);
  const candidates = [
    path.join(OPENCLAW_HOME, 'memory', name),
    path.join(OPENCLAW_HOME, name),
  ];
  for (const fp of candidates) {
    const resolved = path.resolve(fp);
    if (!resolved.startsWith(resolvedHome + path.sep) && resolved !== resolvedHome) continue;
    try {
      if (fs.existsSync(resolved)) {
        const content = fs.readFileSync(resolved, 'utf-8');
        const stat = fs.statSync(resolved);
        return sendJson(res, { name: path.basename(resolved), path: resolved, content, size: stat.size, lastModified: new Date(stat.mtimeMs).toISOString() });
      }
    } catch {}
  }
  sendError(res, 'File not found', 404);
}

async function handleSaveMemoryFile(req, res, name) {
  const body = await readBody(req);
  if (!body.content && body.content !== '') return sendError(res, 'content is required', 400);
  const fp = path.resolve(body.path || path.join(OPENCLAW_HOME, 'memory', name));
  const resolvedHome = path.resolve(OPENCLAW_HOME);
  if (!fp.startsWith(resolvedHome + path.sep) && fp !== resolvedHome) return sendError(res, 'Access denied', 403);
  try {
    const dir = path.dirname(fp);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fp, body.content, 'utf-8');
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─── Tools 高级配置 ──────────────────────────

function handleGetToolsAdvanced(req, res) {
  const cfg = readConfig();
  const tools = (cfg && cfg.tools) || {};
  sendJson(res, redactConfig({
    exec: tools.exec || {}, web: tools.web || {}, fs: tools.fs || {},
    elevated: tools.elevated || {}, loopDetection: tools.loopDetection || {},
    profile: tools.profile || '', allow: tools.allow || [], deny: tools.deny || [],
  }));
}

async function handleSaveToolsAdvanced(req, res) {
  const body = await readBody(req);
  try {
    const { section, value } = body;
    if (!section) return sendError(res, 'section 是必填项', 400);
    const cfg = readConfig() || {};
    patchConfig(['tools', section], restoreRedacted((cfg.tools && cfg.tools[section]) || {}, value));
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─── 用量统计 ────────────────────────────────

function handleGetUsage(req, res) {
  const cfg = readConfig();
  const agentList = (cfg && cfg.agents && cfg.agents.list) || [{ id: 'main' }];
  const { findSessionDir } = require('../lib/session-utils');
  const byAgent = {};
  const byModel = {};
  const daily = {};
  let totalIn = 0, totalOut = 0;

  for (const agent of agentList) {
    const sessionDir = findSessionDir(agent.id, agent);
    if (!sessionDir) continue;
    byAgent[agent.id] = { name: agent.name || agent.id, inputTokens: 0, outputTokens: 0, sessions: 0 };

    try {
      const files = fs.readdirSync(sessionDir).filter(f => f.endsWith('.jsonl') && !f.endsWith('.lock'));
      byAgent[agent.id].sessions = files.length;

      const sorted = files.map(f => ({ name: f, mtime: fs.statSync(path.join(sessionDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime).slice(0, 100);

      for (const { name: f, mtime } of sorted) {
        const fp = path.join(sessionDir, f);
        try {
          const raw = fs.readFileSync(fp, 'utf-8');
          const day = new Date(mtime).toISOString().slice(0, 10);
          for (const line of raw.split('\n')) {
            if (!line.trim()) continue;
            try {
              const obj = JSON.parse(line);
              if (obj.usage) {
                const inT = obj.usage.input_tokens || obj.usage.prompt_tokens || 0;
                const outT = obj.usage.output_tokens || obj.usage.completion_tokens || 0;
                byAgent[agent.id].inputTokens += inT;
                byAgent[agent.id].outputTokens += outT;
                totalIn += inT; totalOut += outT;
                const m = obj.model || 'unknown';
                if (!byModel[m]) byModel[m] = { inputTokens: 0, outputTokens: 0 };
                byModel[m].inputTokens += inT; byModel[m].outputTokens += outT;
                if (!daily[day]) daily[day] = { inputTokens: 0, outputTokens: 0 };
                daily[day].inputTokens += inT; daily[day].outputTokens += outT;
              }
            } catch {}
          }
        } catch {}
      }
    } catch {}
  }

  const dailyArr = Object.entries(daily)
    .map(([date, d]) => ({ date, ...d, totalTokens: d.inputTokens + d.outputTokens }))
    .sort((a, b) => a.date.localeCompare(b.date)).slice(-14);

  sendJson(res, {
    totals: { inputTokens: totalIn, outputTokens: totalOut, totalTokens: totalIn + totalOut },
    byAgent: Object.entries(byAgent).map(([id, d]) => ({ agentId: id, ...d, totalTokens: d.inputTokens + d.outputTokens })).sort((a, b) => b.totalTokens - a.totalTokens),
    byModel: Object.entries(byModel).map(([model, d]) => ({ model, ...d, totalTokens: d.inputTokens + d.outputTokens })).sort((a, b) => b.totalTokens - a.totalTokens),
    daily: dailyArr,
  });
}

module.exports = {
  handleGetMcp, handleSaveMcpServer, handleDeleteMcpServer,
  handleGetSandbox, handleSaveSandbox,
  handleGetHooks, handleSaveHooks,
  handleGetMemory, handleSaveMemory,
  handleGetMemoryFiles, handleGetMemoryFile, handleSaveMemoryFile,
  handleGetToolsAdvanced, handleSaveToolsAdvanced,
  handleGetUsage,
};
