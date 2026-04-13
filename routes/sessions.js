'use strict';

const fs = require('fs');
const path = require('path');
const { readConfig } = require('../lib/config');
const { readBody, sendJson, sendError } = require('../lib/http-utils');
const { findSessionDir } = require('../lib/session-utils');

// ─── Sessions API ────────────────────────────

function handleGetSessions(req, res) {
  const cfg = readConfig();
  const list = (cfg && cfg.agents && cfg.agents.list) || [{ id: 'main' }];
  const sessions = [];
  for (const agent of list) {
    const sessionDir = findSessionDir(agent.id, agent);
    if (!sessionDir) continue;
    try {
      const files = fs.readdirSync(sessionDir);
      const jsonls = files.filter(f => f.endsWith('.jsonl') && !f.endsWith('.lock'));
      const locks = files.filter(f => f.endsWith('.lock'));
      for (const f of jsonls.slice(0, 5)) {
        const fp = path.join(sessionDir, f);
        const stat = fs.statSync(fp);
        sessions.push({
          agentId: agent.id,
          agentName: agent.name || agent.id,
          sessionId: f.replace('.jsonl', ''),
          active: locks.some(l => l.startsWith(f.replace('.jsonl', ''))),
          lastActivity: new Date(stat.mtimeMs).toISOString(),
          sizeBytes: stat.size,
        });
      }
    } catch {}
  }
  sessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  sendJson(res, sessions);
}

// ─── 会话消息查看 ─────────────────────────────

function handleGetSessionMessages(req, res, sessionKey, params) {
  const limit = Math.min(parseInt(params.get('limit') || '200', 10), 500);
  const cfg = readConfig();
  const agentList = (cfg && cfg.agents && cfg.agents.list) || [{ id: 'main' }];

  let filePath = null;
  let agentId = null;
  for (const agent of agentList) {
    const sessionDir = findSessionDir(agent.id, agent);
    if (!sessionDir) continue;
    const fp = path.join(sessionDir, sessionKey + '.jsonl');
    try { if (fs.existsSync(fp)) { filePath = fp; agentId = agent.id; break; } } catch {}
  }
  if (!filePath) return sendError(res, 'Session not found', 404);

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.split('\n').filter(l => l.trim());
    const messages = [];
    let totalIn = 0, totalOut = 0;
    let model = null;

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        const msg = {
          role: obj.role || obj.type || 'unknown',
          content: '',
          timestamp: obj.timestamp || obj.created_at || null,
          toolCalls: null,
          toolName: null,
          model: null,
        };

        if (typeof obj.content === 'string') {
          msg.content = obj.content;
        } else if (Array.isArray(obj.content)) {
          msg.content = obj.content
            .filter(c => c.type === 'text' || c.type === 'output_text')
            .map(c => c.text || c.content || '').join('\n');
        } else if (obj.output && typeof obj.output === 'string') {
          msg.content = obj.output;
        } else if (obj.message && typeof obj.message === 'string') {
          msg.content = obj.message;
        }

        if (obj.tool_calls && Array.isArray(obj.tool_calls)) {
          msg.toolCalls = obj.tool_calls.map(tc => ({
            name: tc.function?.name || tc.name || 'unknown',
            args: tc.function?.arguments || tc.input || '',
          }));
        }
        if (obj.name) msg.toolName = obj.name;
        if (obj.role === 'tool') msg.role = 'tool';
        if (obj.model) { msg.model = obj.model; model = obj.model; }
        if (obj.usage) {
          totalIn += obj.usage.input_tokens || obj.usage.prompt_tokens || 0;
          totalOut += obj.usage.output_tokens || obj.usage.completion_tokens || 0;
        }
        if (msg.content || msg.toolCalls || msg.role === 'tool') {
          messages.push(msg);
        }
      } catch {}
    }

    const stat = fs.statSync(filePath);
    sendJson(res, {
      sessionKey, agentId, model,
      messageCount: messages.length,
      messages: messages.slice(-limit),
      usage: { inputTokens: totalIn, outputTokens: totalOut, totalTokens: totalIn + totalOut },
      sizeBytes: stat.size,
      lastModified: new Date(stat.mtimeMs).toISOString(),
    });
  } catch (e) { sendError(res, e.message); }
}

module.exports = { handleGetSessions, handleGetSessionMessages };
