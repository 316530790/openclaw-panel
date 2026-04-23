'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { readBody, sendJson } = require('../lib/http-utils');
const { getOcCmd } = require('../lib/openclaw-bin');
const { ts } = require('../lib/time-utils');
const { probeGateway } = require('../lib/gateway-probe');

const WATCHDOG_CONFIG_PATH = path.join(__dirname, '..', '.panel-watchdog.json');

let _watchdog = { enabled: false, interval: 60 };
let _watchdogState = { consecutiveMisses: 0, lastCheck: null, nextCheckAt: null, log: [], autoStartedAt: null, lastAutoStartMs: 0 };
let _watchdogTimer = null;

function loadWatchdogConfig() {
  try {
    if (fs.existsSync(WATCHDOG_CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(WATCHDOG_CONFIG_PATH, 'utf-8'));
      if (typeof parsed.enabled === 'boolean') _watchdog.enabled = parsed.enabled;
      if (parsed.interval) _watchdog.interval = Math.max(10, parseInt(parsed.interval) || 60);
    }
  } catch {}
}

function saveWatchdogConfig() {
  try {
    fs.writeFileSync(WATCHDOG_CONFIG_PATH, JSON.stringify(_watchdog, null, 2), 'utf-8');
  } catch (e) { console.error('[watchdog] config write failed:', e.message); }
}

function watchdogAddLog(msg) {
  const entry = `[${ts()}] ${msg}`;
  _watchdogState.log.push(entry);
  if (_watchdogState.log.length > 50) _watchdogState.log.shift();
  console.log('[watchdog]', msg);
}

async function runWatchdogTick() {
  if (!_watchdog.enabled) return;
  _watchdogState.lastCheck = new Date().toISOString();
  const { alive } = await probeGateway();
  if (alive) {
    if (_watchdogState.consecutiveMisses > 0) {
      watchdogAddLog(`Gateway 恢复正常，计数清零`);
    }
    _watchdogState.consecutiveMisses = 0;
  } else {
    _watchdogState.consecutiveMisses++;
    watchdogAddLog(`Gateway 离线（连续第 ${_watchdogState.consecutiveMisses} 次）`);
    if (_watchdogState.consecutiveMisses >= 2) {
      const cooldownMs = _watchdog.interval * 3 * 1000;
      const elapsed = Date.now() - _watchdogState.lastAutoStartMs;
      if (_watchdogState.lastAutoStartMs > 0 && elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
        watchdogAddLog(`冷却中（${remaining}s 后才可再次启动）`);
      } else {
        watchdogAddLog(`连续离线 ${_watchdogState.consecutiveMisses} 次，自动启动...`);
        try {
          const { cmd, shell } = getOcCmd('gateway run');
          const oc = exec(cmd, { detached: true, stdio: 'ignore', windowsHide: true, shell });
          try { oc.unref(); } catch {}
          watchdogAddLog(`已发送启动命令 (PID: ${oc.pid || '未知'})`);
          // 仅启动成功才重置计数，失败时保留计数以便下次继续触发
          _watchdogState.consecutiveMisses = 0;
          _watchdogState.lastAutoStartMs = Date.now();
          _watchdogState.autoStartedAt = new Date().toISOString();
        } catch (e) {
          watchdogAddLog(`自动启动失败: ${e.message}`);
          // 启动失败：不重置计数，下次仍可立即重试（跳过冷却）
          _watchdogState.lastAutoStartMs = 0;
        }
      }
    }
  }
  scheduleWatchdog();
}

function scheduleWatchdog() {
  if (_watchdogTimer) clearTimeout(_watchdogTimer);
  if (!_watchdog.enabled) { _watchdogState.nextCheckAt = null; return; }
  _watchdogState.nextCheckAt = new Date(Date.now() + _watchdog.interval * 1000).toISOString();
  _watchdogTimer = setTimeout(runWatchdogTick, _watchdog.interval * 1000);
}

function startWatchdog() {
  if (_watchdogTimer) clearTimeout(_watchdogTimer);
  _watchdogState.consecutiveMisses = 0;
  watchdogAddLog(`守护已启用，间隔 ${_watchdog.interval}s`);
  scheduleWatchdog();
}

function stopWatchdog() {
  if (_watchdogTimer) { clearTimeout(_watchdogTimer); _watchdogTimer = null; }
  _watchdogState.nextCheckAt = null;
  watchdogAddLog(`守护已停用`);
}

// ─── HTTP Handlers ───────────────────────────

function handleGetWatchdog(req, res) {
  sendJson(res, {
    enabled: _watchdog.enabled, interval: _watchdog.interval,
    consecutiveMisses: _watchdogState.consecutiveMisses,
    lastCheck: _watchdogState.lastCheck,
    nextCheckAt: _watchdogState.nextCheckAt,
    log: _watchdogState.log.slice(-20),
    autoStartedAt: _watchdogState.autoStartedAt,
  });
}

async function handleSaveWatchdog(req, res) {
  const body = await readBody(req);
  const wasEnabled = _watchdog.enabled;
  if (typeof body.enabled === 'boolean') _watchdog.enabled = body.enabled;
  if (body.interval != null) _watchdog.interval = Math.max(10, parseInt(body.interval) || 60);
  saveWatchdogConfig();
  if (_watchdog.enabled && !wasEnabled) startWatchdog();
  else if (!_watchdog.enabled && wasEnabled) stopWatchdog();
  else if (_watchdog.enabled) scheduleWatchdog();
  sendJson(res, { ok: true, enabled: _watchdog.enabled, interval: _watchdog.interval });
}

// ─── Gateway Token ───────────────────────────

function resolveTokenValue(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    const m = val.match(/^\$\{([A-Z_][A-Z0-9_]*)\}$/);
    if (m) return process.env[m[1]] || null;
    return val;
  }
  if (typeof val === 'object' && val.source === 'env' && val.id) {
    return process.env[val.id] || null;
  }
  return null;
}

function handleGetGatewayToken(req, res) {
  const cfg = readConfig();
  const auth = (cfg && cfg.gateway && cfg.gateway.auth) || {};
  sendJson(res, { mode: auth.mode || 'none', token: resolveTokenValue(auth.token) });
}

module.exports = {
  loadWatchdogConfig, startWatchdog, getWatchdogConfig: () => _watchdog,
  handleGetWatchdog, handleSaveWatchdog,
  handleGetGatewayToken,
};
