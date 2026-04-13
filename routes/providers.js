'use strict';

const { URL } = require('url');
const { readConfig, patchConfig, deleteNestedValue, redactConfig, restoreRedacted, writeConfig } = require('../lib/config');
const { readBody, sendJson, sendError } = require('../lib/http-utils');

// ─── 供应商 API ──────────────────────────────

function locateProvider(cfg, id) {
  if (cfg.models && cfg.models.providers && cfg.models.providers[id]) {
    return { source: 'models', path: ['models', 'providers', id], data: cfg.models.providers[id] };
  }
  if (cfg.auth && cfg.auth.profiles) {
    for (const [key, profile] of Object.entries(cfg.auth.profiles)) {
      const providerId = profile.provider || key.split(':')[0];
      if (providerId === id) {
        return { source: 'auth', path: ['auth', 'profiles', key], data: profile, profileKey: key };
      }
    }
  }
  return null;
}

function handleGetProviders(req, res) {
  const cfg = readConfig() || {};
  const modelsProviders = (cfg.models && cfg.models.providers) || {};
  const authProfiles = (cfg.auth && cfg.auth.profiles) || {};
  const merged = { ...modelsProviders };
  for (const [key, profile] of Object.entries(authProfiles)) {
    const providerId = profile.provider || key.split(':')[0] || key;
    if (!merged[providerId]) {
      merged[providerId] = { ...profile, _source: 'auth.profiles', _profileKey: key };
    }
  }
  sendJson(res, redactConfig(merged));
}

async function handleCreateProvider(req, res) {
  const body = await readBody(req);
  const { id, config: provCfg } = body;
  if (!id || !provCfg) return sendError(res, 'id 和 config 是必填项', 400);
  try {
    if (provCfg.baseUrl) {
      patchConfig(['models', 'providers', id], provCfg);
    } else {
      const profileKey = `${id}:default`;
      patchConfig(['auth', 'profiles', profileKey], { provider: id, ...provCfg });
    }
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleUpdateProvider(req, res, id) {
  const body = await readBody(req);
  const cfg = readConfig() || {};
  const loc = locateProvider(cfg, id);
  try {
    if (loc) {
      const merged = restoreRedacted(loc.data, body);
      patchConfig(loc.path, merged);
    } else {
      patchConfig(['models', 'providers', id], body);
    }
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleDeleteProvider(req, res, id) {
  try {
    const cfg = readConfig() || {};
    const loc = locateProvider(cfg, id);
    if (loc) {
      deleteNestedValue(cfg, loc.path);
      writeConfig(cfg);
    }
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleTestProvider(req, res, id) {
  const cfg = readConfig() || {};
  const loc = locateProvider(cfg, id);
  const prov = loc ? loc.data : null;
  if (!prov) return sendError(res, '供应商不存在', 404);

  if (loc.source === 'auth' && !prov.baseUrl) {
    return sendJson(res, { ok: true, status: 0, message: 'OAuth 供应商，无需连通测试' });
  }

  const baseUrl = (prov.baseUrl || '').replace(/\/$/, '');
  if (!baseUrl) return sendError(res, 'baseUrl 未配置', 400);

  const testUrl = `${baseUrl}/models`;
  const apiKey = prov.apiKey;
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey && typeof apiKey === 'string' && !apiKey.includes('REDACTED')) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const mod = testUrl.startsWith('https') ? require('https') : require('http');
    const urlObj = new URL(testUrl);
    const options = { hostname: urlObj.hostname, port: urlObj.port || (testUrl.startsWith('https') ? 443 : 80), path: urlObj.pathname + urlObj.search, method: 'GET', headers, timeout: 8000 };
    const result = await new Promise((resolve, reject) => {
      const r = mod.request(options, resp => { resolve({ status: resp.statusCode }); resp.resume(); });
      r.on('error', reject);
      r.on('timeout', () => { r.destroy(); reject(new Error('连接超时')); });
      r.end();
    });
    sendJson(res, { ok: result.status < 500, status: result.status });
  } catch (e) {
    sendJson(res, { ok: false, error: e.message });
  }
}

module.exports = {
  handleGetProviders, handleCreateProvider,
  handleUpdateProvider, handleDeleteProvider, handleTestProvider,
};
