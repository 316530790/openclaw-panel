'use strict';

const fs = require('fs');
const path = require('path');
const { OPENCLAW_HOME } = require('../lib/constants');
const { readConfig, writeConfig, redactConfig } = require('../lib/config');
const { readBody, sendJson, sendError } = require('../lib/http-utils');

// ─── Agent API ───────────────────────────────

function handleGetAgents(req, res) {
  const cfg = readConfig() || {};
  const defaults = (cfg.agents && cfg.agents.defaults) || {};
  let list = (cfg.agents && cfg.agents.list) || [];

  // 从磁盘 ~/.openclaw/agents/ 发现 agent
  const agentsDir = path.join(OPENCLAW_HOME, 'agents');
  try {
    if (fs.existsSync(agentsDir)) {
      const dirs = fs.readdirSync(agentsDir, { withFileTypes: true })
        .filter(d => d.isDirectory()).map(d => d.name);
      for (const dirName of dirs) {
        if (list.find(a => a.id === dirName)) continue;
        const agentMeta = { id: dirName, name: dirName, _source: 'disk' };
        try {
          const modelsPath = path.join(agentsDir, dirName, 'agent', 'models.json');
          if (fs.existsSync(modelsPath)) {
            const m = JSON.parse(fs.readFileSync(modelsPath, 'utf-8'));
            agentMeta._providers = m.providers ? Object.keys(m.providers) : [];
          }
        } catch {}
        list.push(agentMeta);
      }
    }
  } catch {}

  // 补充运行时状态
  list = list.map(agent => {
    const a = { ...agent };
    a._status = 'idle';
    a._session = null;
    a._lastActivity = null;
    a._sessionCount = 0;
    try {
      const sessionDir = path.join(agentsDir, a.id, 'sessions');
      if (fs.existsSync(sessionDir)) {
        const sessionsJsonPath = path.join(sessionDir, 'sessions.json');
        let sessionsMap = {};
        try {
          if (fs.existsSync(sessionsJsonPath)) {
            sessionsMap = JSON.parse(fs.readFileSync(sessionsJsonPath, 'utf-8')) || {};
          }
        } catch {}

        const sessionEntries = Object.entries(sessionsMap);
        a._sessionCount = sessionEntries.length;

        if (sessionEntries.length > 0) {
          const sorted = sessionEntries.sort(([, v1], [, v2]) =>
            ((v2 && v2.updatedAt) || 0) - ((v1 && v1.updatedAt) || 0)
          );
          const [latestKey, latestSession] = sorted[0];
          if (latestSession) {
            a._lastActivity = latestSession.updatedAt
              ? new Date(latestSession.updatedAt).toISOString() : null;
            a._session = latestSession.sessionId || latestKey;
            a._lastChannel = latestSession.lastChannel || latestSession.origin?.channel || null;
            a._chatType = latestSession.chatType || null;
          }
        }

        const files = fs.readdirSync(sessionDir);
        const locks = files.filter(f => f.endsWith('.lock'));
        if (locks.length > 0) {
          a._status = 'working';
          a._session = locks[0].replace(/\.jsonl\.lock$/, '').replace(/\.lock$/, '');
        }
      }
    } catch {}
    return a;
  });

  sendJson(res, { defaults: redactConfig(defaults), list });
}

async function handleCreateAgent(req, res) {
  const body = await readBody(req);
  if (!body.id) return sendError(res, 'id 是必填项', 400);
  try {
    const cfg = readConfig() || {};
    if (!cfg.agents) cfg.agents = {};
    if (!cfg.agents.list) cfg.agents.list = [];
    if (cfg.agents.list.find(a => a.id === body.id)) {
      return sendError(res, `Agent id "${body.id}" 已存在`, 409);
    }
    cfg.agents.list.push(body);
    writeConfig(cfg);
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleUpdateAgent(req, res, id) {
  const body = await readBody(req);
  try {
    const cfg = readConfig() || {};
    if (!cfg.agents || !cfg.agents.list) return sendError(res, 'Agent 不存在', 404);
    const idx = cfg.agents.list.findIndex(a => a.id === id);
    if (idx === -1) return sendError(res, 'Agent 不存在', 404);
    cfg.agents.list[idx] = { ...cfg.agents.list[idx], ...body, id };
    writeConfig(cfg);
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleDeleteAgent(req, res, id) {
  try {
    const cfg = readConfig() || {};
    if (cfg.agents && cfg.agents.list) {
      cfg.agents.list = cfg.agents.list.filter(a => a.id !== id);
      writeConfig(cfg);
    }
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

module.exports = { handleGetAgents, handleCreateAgent, handleUpdateAgent, handleDeleteAgent };
