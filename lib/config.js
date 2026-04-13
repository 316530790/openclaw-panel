'use strict';

const fs = require('fs');
const path = require('path');
const { CONFIG_PATH } = require('./constants');

// json5 解析（openclaw.json 是 JSON5 格式）
let JSON5;
try { JSON5 = require('json5'); } catch { JSON5 = null; }

// ─── 配置缓存 ────────────────────────────────
let _configCache = null;
let _configMtimeMs = 0;

function readConfig() {
  try {
    const stat = fs.statSync(CONFIG_PATH);
    if (_configCache && stat.mtimeMs === _configMtimeMs) return _configCache;
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    let parsed;
    try { parsed = JSON.parse(raw); } catch {
      if (JSON5) parsed = JSON5.parse(raw);
      else throw new Error('配置文件解析失败（JSON5 格式需要安装 json5 包）');
    }
    _configCache = parsed;
    _configMtimeMs = stat.mtimeMs;
    return parsed;
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

// ─── 嵌套值操作 ──────────────────────────────
function setNestedValue(obj, pathArr, value) {
  let cur = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    const key = pathArr[i];
    if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {};
    cur = cur[key];
  }
  cur[pathArr[pathArr.length - 1]] = value;
}

function getNestedValue(obj, pathArr) {
  let cur = obj;
  for (const key of pathArr) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

function deleteNestedValue(obj, pathArr) {
  let cur = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    if (cur == null) return;
    cur = cur[pathArr[i]];
  }
  if (cur != null) delete cur[pathArr[pathArr.length - 1]];
}

// ─── 统一写入（先写 .tmp 再 rename，保证原子性）────
function writeConfig(cfg) {
  const tmpPath = CONFIG_PATH + '.tmp';
  const json = JSON.stringify(cfg, null, 2);
  // 先写临时文件，确保内容完整再覆盖原文件
  fs.writeFileSync(tmpPath, json, 'utf-8');
  // 备份当前配置
  try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
  // 原子替换（Windows 上 renameSync 目标存在时会失败，做降级处理）
  try {
    fs.renameSync(tmpPath, CONFIG_PATH);
  } catch {
    fs.copyFileSync(tmpPath, CONFIG_PATH);
    try { fs.unlinkSync(tmpPath); } catch {}
  }
  _configCache = null;
  _configMtimeMs = 0;
}

function patchConfig(pathArr, value) {
  const cfg = readConfig() || {};
  setNestedValue(cfg, pathArr, value);
  writeConfig(cfg);
  return cfg;
}

// ─── Secret 遮码 ─────────────────────────────
function redactConfig(val) {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(redactConfig);
  if ('source' in val && 'id' in val && typeof val.source === 'string') {
    return { ...val, id: '__OPENCLAW_REDACTED__' };
  }
  const out = {};
  for (const k of Object.keys(val)) out[k] = redactConfig(val[k]);
  return out;
}

function restoreRedacted(original, submitted) {
  if (submitted === null || typeof submitted !== 'object') return submitted;
  if (Array.isArray(submitted)) {
    return submitted.map((item, i) => restoreRedacted(Array.isArray(original) ? original[i] : undefined, item));
  }
  if ('source' in submitted && submitted.id === '__OPENCLAW_REDACTED__') {
    return original || submitted;
  }
  const out = {};
  for (const k of Object.keys(submitted)) {
    out[k] = restoreRedacted(original && original[k], submitted[k]);
  }
  return out;
}

module.exports = {
  readConfig, writeConfig, patchConfig,
  setNestedValue, getNestedValue, deleteNestedValue,
  redactConfig, restoreRedacted,
};
