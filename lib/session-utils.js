'use strict';

const fs = require('fs');
const path = require('path');
const { OPENCLAW_HOME } = require('./constants');

// ─── Session 路径发现（多路径 fallback）──────
function findSessionDir(agentId, agentCfg) {
  const candidates = [];
  if (agentCfg && agentCfg.agentDir) {
    const base = agentCfg.agentDir.endsWith(path.sep + 'agent')
      ? path.dirname(agentCfg.agentDir)
      : agentCfg.agentDir;
    candidates.push(path.join(base, 'sessions'));
    candidates.push(path.join(agentCfg.agentDir, 'sessions'));
  }
  candidates.push(path.join(OPENCLAW_HOME, 'agents', agentId, 'sessions'));
  candidates.push(path.join(OPENCLAW_HOME, `workspace-${agentId}`, 'agent', 'sessions'));
  if (agentId === 'main') {
    candidates.push(path.join(OPENCLAW_HOME, 'workspace', 'sessions'));
  }
  for (const dir of candidates) {
    try { if (fs.existsSync(dir)) return dir; } catch {}
  }
  return null;
}

module.exports = { findSessionDir };
