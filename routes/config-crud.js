'use strict';

const { readConfig, patchConfig, writeConfig, redactConfig, restoreRedacted } = require('../lib/config');
const { readBody, sendJson, sendError } = require('../lib/http-utils');

// ─── 渠道 ────────────────────────────────────
const KNOWN_CHANNELS = ['telegram', 'discord', 'slack', 'whatsapp', 'signal', 'imessage', 'feishu', 'matrix', 'mattermost', 'irc', 'xmpp', 'email', 'webhook'];

function handleGetChannels(req, res) {
  const cfg = readConfig();
  const channels = (cfg && cfg.channels) || {};
  const result = {};
  const allKeys = new Set([...KNOWN_CHANNELS, ...Object.keys(channels)]);
  for (const key of allKeys) {
    result[key] = redactConfig(channels[key] || { enabled: false });
  }
  sendJson(res, result);
}

async function handleUpdateChannel(req, res, name) {
  const body = await readBody(req);
  try {
    const cfg = readConfig() || {};
    const original = (cfg.channels && cfg.channels[name]) || {};
    patchConfig(['channels', name], restoreRedacted(original, body));
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─── Cron ────────────────────────────────────
function handleGetCron(req, res) {
  const cfg = readConfig();
  sendJson(res, (cfg && cfg.cron && cfg.cron.jobs) || []);
}

async function handleCreateCron(req, res) {
  const body = await readBody(req);
  if (!body.id || !body.name) return sendError(res, 'id 和 name 是必填项', 400);
  try {
    const cfg = readConfig() || {};
    if (!cfg.cron) cfg.cron = {};
    if (!cfg.cron.jobs) cfg.cron.jobs = [];
    if (cfg.cron.jobs.find(j => j.id === body.id)) return sendError(res, `Cron id "${body.id}" 已存在`, 409);
    body.createdAtMs = Date.now();
    body.updatedAtMs = Date.now();
    cfg.cron.jobs.push(body);
    writeConfig(cfg);
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleUpdateCron(req, res, id) {
  const body = await readBody(req);
  try {
    const cfg = readConfig() || {};
    if (!cfg.cron || !cfg.cron.jobs) return sendError(res, 'Cron 不存在', 404);
    const idx = cfg.cron.jobs.findIndex(j => j.id === id);
    if (idx === -1) return sendError(res, 'Cron 不存在', 404);
    cfg.cron.jobs[idx] = { ...cfg.cron.jobs[idx], ...body, id, updatedAtMs: Date.now() };
    writeConfig(cfg);
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleDeleteCron(req, res, id) {
  try {
    const cfg = readConfig() || {};
    if (cfg.cron && cfg.cron.jobs) {
      cfg.cron.jobs = cfg.cron.jobs.filter(j => j.id !== id);
      writeConfig(cfg);
    }
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─── Skills / Plugins ────────────────────────
function handleGetSkills(req, res) {
  const cfg = readConfig();
  const entries = (cfg && cfg.skills && cfg.skills.entries) || {};
  const allowed = (cfg && cfg.skills && cfg.skills.allowBundled) || [];
  sendJson(res, { entries, allowBundled: allowed });
}

async function handleToggleSkill(req, res, id) {
  const body = await readBody(req);
  try {
    const cfg = readConfig() || {};
    if (!cfg.skills) cfg.skills = {};
    if (!cfg.skills.entries) cfg.skills.entries = {};
    if (!cfg.skills.entries[id]) cfg.skills.entries[id] = {};
    cfg.skills.entries[id].enabled = body.enabled !== false;
    writeConfig(cfg);
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

function handleGetPlugins(req, res) {
  const cfg = readConfig();
  const entries = (cfg && cfg.plugins && cfg.plugins.entries) || {};
  const enabled = (cfg && cfg.plugins && cfg.plugins.enabled) !== false;
  sendJson(res, { entries, enabled });
}

async function handleTogglePlugin(req, res, id) {
  const body = await readBody(req);
  try {
    const cfg = readConfig() || {};
    if (!cfg.plugins) cfg.plugins = {};
    if (!cfg.plugins.entries) cfg.plugins.entries = {};
    if (!cfg.plugins.entries[id]) cfg.plugins.entries[id] = {};
    cfg.plugins.entries[id].enabled = body.enabled !== false;
    writeConfig(cfg);
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

module.exports = {
  handleGetChannels, handleUpdateChannel,
  handleGetCron, handleCreateCron, handleUpdateCron, handleDeleteCron,
  handleGetSkills, handleToggleSkill,
  handleGetPlugins, handleTogglePlugin,
};
