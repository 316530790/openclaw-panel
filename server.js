'use strict';

// ─────────────────────────────────────────────
// 依赖
// ─────────────────────────────────────────────
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const { execFile, exec } = require('child_process');
const { URL } = require('url');

// json5 解析（openclaw.json 是 JSON5 格式）
let JSON5;
try { JSON5 = require('json5'); } catch { JSON5 = null; }

// ─────────────────────────────────────────────
// 路径 & 端口
// ─────────────────────────────────────────────
// 加载 .env
const envPath = path.join(__dirname, '.env');
try {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
} catch {}

const PORT = parseInt(process.env.PORT || '19030', 10);
const HOME_DIR = os.homedir();
const OPENCLAW_HOME = process.env.OPENCLAW_HOME || path.join(HOME_DIR, '.openclaw');
const CONFIG_PATH = path.join(OPENCLAW_HOME, 'openclaw.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ─────────────────────────────────────────────
// 跨平台 PATH 注入（确保能找到 openclaw 二进制）
// ─────────────────────────────────────────────
(function injectPath() {
  const nodeBinDir = path.dirname(process.execPath);
  const extra = os.platform() === 'win32'
    ? [
        path.join(process.env.APPDATA || '', 'npm'),
        path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'npm'),
      ]
    : [
        path.join(HOME_DIR, '.local', 'bin'),
        path.join(HOME_DIR, '.npm-global', 'bin'),
        '/opt/homebrew/bin',
        '/usr/local/bin',
        '/usr/bin',
      ];
  const all = [nodeBinDir, ...extra].filter(p => p && fs.existsSync(p));
  const existing = (process.env.PATH || '').split(path.delimiter);
  process.env.PATH = [...new Set([...all, ...existing])].join(path.delimiter);
  process.env.OPENCLAW_HOME = OPENCLAW_HOME;
  process.env.OPENCLAW_STATE_DIR = OPENCLAW_HOME;
})();

// ─────────────────────────────────────────────
// openclaw 二进制查找（Windows .cmd / 多路径）
// ─────────────────────────────────────────────
function getOpenClawBinary() {
  const isWin = os.platform() === 'win32';
  const names = isWin ? ['openclaw.cmd', 'openclaw'] : ['openclaw'];
  for (const name of names) {
    const candidates = [
      path.join(path.dirname(process.execPath), name),
      path.join(HOME_DIR, '.local', 'bin', name),
      path.join(HOME_DIR, '.npm-global', 'bin', name),
      isWin ? path.join(process.env.APPDATA || '', 'npm', name) : '',
      isWin ? path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'npm', name) : '',
      '/opt/homebrew/bin/' + name,
      '/usr/local/bin/' + name,
    ].filter(Boolean);
    for (const c of candidates) {
      try { if (fs.existsSync(c)) return c; } catch {}
    }
  }
  return os.platform() === 'win32' ? 'openclaw.cmd' : 'openclaw';
}

function runOpenclaw(args) {
  return new Promise((resolve, reject) => {
    const bin = getOpenClawBinary();
    execFile(bin, args, { env: process.env, timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        // Windows "not recognized" 错误也归类为 ENOENT
        const msg = (err.message || '') + (stderr || '');
        if (err.code === 'ENOENT' || /not recognized|cannot find/i.test(msg)) {
          return reject(new Error('openclaw 命令未找到，请确保已安装 OpenClaw'));
        }
        return reject(err);
      }
      resolve(stdout);
    });
  });
}

// ─────────────────────────────────────────────
// 配置读写工具
// ─────────────────────────────────────────────
function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    try { return JSON.parse(raw); } catch {
      if (JSON5) return JSON5.parse(raw);
      throw new Error('配置文件解析失败（JSON5 格式需要安装 json5 包）');
    }
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

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

function patchConfig(pathArr, value) {
  // 写入前备份
  try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
  const cfg = readConfig() || {};
  setNestedValue(cfg, pathArr, value);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
  return cfg;
}

// Secret 遮码：识别 { source, id } 结构的 SecretRef
function redactConfig(val) {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(redactConfig);
  // SecretRef 特征：有 source 和 id 字段
  if ('source' in val && 'id' in val && typeof val.source === 'string') {
    return { ...val, id: '__OPENCLAW_REDACTED__' };
  }
  const out = {};
  for (const k of Object.keys(val)) out[k] = redactConfig(val[k]);
  return out;
}

// 写入时保留遮码字段（不用新值覆盖原始 Secret）
function restoreRedacted(original, submitted) {
  if (submitted === null || typeof submitted !== 'object') return submitted;
  if (Array.isArray(submitted)) {
    return submitted.map((item, i) => restoreRedacted(Array.isArray(original) ? original[i] : undefined, item));
  }
  // 检测到遮码 SecretRef → 恢复原值
  if ('source' in submitted && submitted.id === '__OPENCLAW_REDACTED__') {
    return original || submitted;
  }
  const out = {};
  for (const k of Object.keys(submitted)) {
    out[k] = restoreRedacted(original && original[k], submitted[k]);
  }
  return out;
}

// ─────────────────────────────────────────────
// Session 路径发现（多路径 fallback）
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// HTTP 工具
// ─────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

function sendError(res, msg, status = 500) {
  sendJson(res, { error: msg }, status);
}

// 静态文件服务
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

function serveStatic(req, res) {
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? '/index.html' : req.url);
  // 防止路径穿越
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // fallback 到 index.html（SPA）
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ─────────────────────────────────────────────
// API 路由分发
// ─────────────────────────────────────────────
async function handleApi(req, res, pathname, params) {
  // ── 系统健康 ──────────────────────────────
  if (req.method === 'GET' && pathname === '/api/sys-health') {
    return handleSysHealth(req, res);
  }

  // ── 配置 ──────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/config') {
    const cfg = readConfig();
    if (!cfg) return sendJson(res, null);
    return sendJson(res, redactConfig(cfg));
  }
  if (req.method === 'POST' && pathname === '/api/config/patch') {
    const body = await readBody(req);
    const { path: p, value } = body;
    if (!Array.isArray(p)) return sendError(res, 'path 必须是数组', 400);
    try {
      // 恢复可能被遮码的 secret 字段
      const originalCfg = readConfig() || {};
      const originalVal = getNestedValue(originalCfg, p);
      const safeVal = restoreRedacted(originalVal, value);
      patchConfig(p, safeVal);
      sendJson(res, { ok: true });
    } catch (e) { sendError(res, e.message); }
    return;
  }

  // ── 供应商 ────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/providers') {
    return handleGetProviders(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/providers') {
    return handleCreateProvider(req, res);
  }
  if (req.method === 'PUT' && pathname.startsWith('/api/providers/') && !pathname.endsWith('/test')) {
    const id = decodeURIComponent(pathname.slice('/api/providers/'.length));
    return handleUpdateProvider(req, res, id);
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/providers/')) {
    const id = decodeURIComponent(pathname.slice('/api/providers/'.length));
    return handleDeleteProvider(req, res, id);
  }
  if (req.method === 'POST' && pathname.startsWith('/api/providers/') && pathname.endsWith('/test')) {
    const id = decodeURIComponent(pathname.slice('/api/providers/'.length, -'/test'.length));
    return handleTestProvider(req, res, id);
  }

  // ── Agent ─────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/agents') {
    return handleGetAgents(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/agents') {
    return handleCreateAgent(req, res);
  }
  if (req.method === 'PUT' && pathname.startsWith('/api/agents/')) {
    const id = decodeURIComponent(pathname.slice('/api/agents/'.length));
    return handleUpdateAgent(req, res, id);
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/agents/')) {
    const id = decodeURIComponent(pathname.slice('/api/agents/'.length));
    return handleDeleteAgent(req, res, id);
  }

  // ── 渠道 ──────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/channels') {
    return handleGetChannels(req, res);
  }
  if (req.method === 'PUT' && pathname.startsWith('/api/channels/')) {
    const name = decodeURIComponent(pathname.slice('/api/channels/'.length));
    return handleUpdateChannel(req, res, name);
  }

  // ── Cron ──────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/cron') {
    return handleGetCron(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/cron') {
    return handleCreateCron(req, res);
  }
  if (req.method === 'PUT' && pathname.startsWith('/api/cron/')) {
    const id = decodeURIComponent(pathname.slice('/api/cron/'.length));
    return handleUpdateCron(req, res, id);
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/cron/')) {
    const id = decodeURIComponent(pathname.slice('/api/cron/'.length));
    return handleDeleteCron(req, res, id);
  }

  // ── Skills ────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/skills') {
    return handleGetSkills(req, res);
  }
  if (req.method === 'POST' && pathname.startsWith('/api/skills/') && pathname.endsWith('/toggle')) {
    const id = decodeURIComponent(pathname.slice('/api/skills/'.length, -'/toggle'.length));
    return handleToggleSkill(req, res, id);
  }

  // ── Plugins ───────────────────────────────
  if (req.method === 'GET' && pathname === '/api/plugins') {
    return handleGetPlugins(req, res);
  }
  if (req.method === 'POST' && pathname.startsWith('/api/plugins/') && pathname.endsWith('/toggle')) {
    const id = decodeURIComponent(pathname.slice('/api/plugins/'.length, -'/toggle'.length));
    return handleTogglePlugin(req, res, id);
  }

  // ── Sessions ──────────────────────────────
  if (req.method === 'GET' && pathname === '/api/sessions') {
    return handleGetSessions(req, res);
  }

  // ── 日志 SSE ──────────────────────────────
  if (req.method === 'GET' && pathname === '/api/logs/stream') {
    return handleLogsStream(req, res, params);
  }

  // ── 运维命令 ──────────────────────────────
  if (req.method === 'POST' && pathname === '/api/cmd/restart') {
    return handleCmdRestart(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/cmd/doctor') {
    return handleCmdDoctor(req, res);
  }

  sendError(res, '接口不存在', 404);
}

// ─────────────────────────────────────────────
// API 实现 — 系统健康
// ─────────────────────────────────────────────
async function handleSysHealth(req, res) {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsedPct = Math.round((1 - freeMem / totalMem) * 100);

  // CPU 使用率（取两次快照之差）
  function getCpuUsage() {
    return new Promise(resolve => {
      const s1 = os.cpus().map(c => ({ idle: c.times.idle, total: Object.values(c.times).reduce((a, b) => a + b, 0) }));
      setTimeout(() => {
        const s2 = os.cpus().map(c => ({ idle: c.times.idle, total: Object.values(c.times).reduce((a, b) => a + b, 0) }));
        const usages = s1.map((c, i) => {
          const dIdle = s2[i].idle - c.idle;
          const dTotal = s2[i].total - c.total;
          return dTotal > 0 ? Math.round((1 - dIdle / dTotal) * 100) : 0;
        });
        resolve(Math.round(usages.reduce((a, b) => a + b, 0) / usages.length));
      }, 500);
    });
  }

  // 磁盘使用（跨平台）
  function getDiskUsage() {
    return new Promise(resolve => {
      const isWin = os.platform() === 'win32';
      const cmd = isWin
        ? `wmic logicaldisk where "DeviceID='C:'" get Size,FreeSpace /format:csv`
        : `df -k "${OPENCLAW_HOME}" | tail -1`;
      exec(cmd, { timeout: 5000 }, (err, stdout) => {
        if (err || !stdout) return resolve(null);
        try {
          if (isWin) {
            const lines = stdout.trim().split('\n').filter(l => l.includes(','));
            const parts = lines[lines.length - 1].split(',');
            const free = parseInt(parts[1]);
            const total = parseInt(parts[2]);
            if (total > 0) return resolve({ usedPct: Math.round((1 - free / total) * 100), total, free });
          } else {
            const parts = stdout.trim().split(/\s+/);
            const total = parseInt(parts[1]) * 1024;
            const used = parseInt(parts[2]) * 1024;
            const usedPct = parseInt(parts[4]);
            return resolve({ usedPct, total, free: total - used });
          }
        } catch {}
        resolve(null);
      });
    });
  }

  // Gateway 端口探测
  function probeGateway(port) {
    return new Promise(resolve => {
      const cfg = readConfig();
      const gwPort = port || (cfg && cfg.gateway && cfg.gateway.port) || 18789;
      const sock = new net.Socket();
      sock.setTimeout(800);
      sock.once('connect', () => { sock.destroy(); resolve({ alive: true, port: gwPort }); });
      sock.once('timeout', () => { sock.destroy(); resolve({ alive: false, port: gwPort }); });
      sock.once('error', () => { sock.destroy(); resolve({ alive: false, port: gwPort }); });
      sock.connect(gwPort, '127.0.0.1');
    });
  }

  // OpenClaw 进程运行时长（查找 openclaw 关键字进程的启动时间）
  function getOpenClawUptime() {
    return new Promise(resolve => {
      const isWin = os.platform() === 'win32';
      if (isWin) {
        // Windows: wmic 查找含 openclaw 字样的 node 进程
        const cmd = `wmic process where "commandline like '%openclaw%' and name='node.exe'" get CreationDate /format:csv`;
        exec(cmd, { timeout: 5000 }, (err, stdout) => {
          if (err || !stdout) return resolve(null);
          try {
            const lines = stdout.trim().split('\n').filter(l => l.match(/\d{14}/));
            if (!lines.length) return resolve(null);
            // CreationDate 格式: 20250410160000.000000+480
            const raw = lines[0].split(',').find(p => /\d{14}/.test(p));
            if (!raw) return resolve(null);
            const m = raw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
            if (!m) return resolve(null);
            const startTime = new Date(
              `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`
            ).getTime();
            const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
            resolve(uptimeSec > 0 ? uptimeSec : null);
          } catch { resolve(null); }
        });
      } else {
        // Linux/Mac: 通过 pgrep 找到 openclaw 进程的启动时间
        exec(`pgrep -f "openclaw" | head -1`, { timeout: 3000 }, (err, pidRaw) => {
          const pid = (pidRaw || '').trim();
          if (err || !pid) return resolve(null);
          exec(`ps -o lstart= -p ${pid}`, { timeout: 3000 }, (err2, lstart) => {
            if (err2 || !lstart) return resolve(null);
            try {
              const startTime = new Date(lstart.trim()).getTime();
              const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
              resolve(uptimeSec > 0 ? uptimeSec : null);
            } catch { resolve(null); }
          });
        });
      }
    });
  }

  try {
    const [cpuPct, disk, gw, openclawUptime] = await Promise.all([
      getCpuUsage(), getDiskUsage(), probeGateway(), getOpenClawUptime()
    ]);
    sendJson(res, {
      cpu: cpuPct,
      memUsedPct,
      memTotal: totalMem,
      memFree: freeMem,
      disk,
      uptime: os.uptime(),
      openclawUptime,          // null = 未运行，>0 = OpenClaw 运行秒数
      platform: os.platform(),
      gateway: gw,
    });
  } catch (e) {
    sendError(res, e.message);
  }
}

// ─────────────────────────────────────────────
// API 实现 — 供应商
// ─────────────────────────────────────────────
function handleGetProviders(req, res) {
  const cfg = readConfig();
  const providers = (cfg && cfg.models && cfg.models.providers) || {};
  sendJson(res, redactConfig(providers));
}

async function handleCreateProvider(req, res) {
  const body = await readBody(req);
  const { id, config: provCfg } = body;
  if (!id || !provCfg) return sendError(res, 'id 和 config 是必填项', 400);
  try {
    patchConfig(['models', 'providers', id], provCfg);
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleUpdateProvider(req, res, id) {
  const body = await readBody(req);
  const cfg = readConfig() || {};
  const original = (cfg.models && cfg.models.providers && cfg.models.providers[id]) || {};
  try {
    patchConfig(['models', 'providers', id], restoreRedacted(original, body));
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleDeleteProvider(req, res, id) {
  try {
    const cfg = readConfig() || {};
    if (cfg.models && cfg.models.providers) {
      delete cfg.models.providers[id];
      try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
    }
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleTestProvider(req, res, id) {
  const cfg = readConfig();
  const prov = cfg && cfg.models && cfg.models.providers && cfg.models.providers[id];
  if (!prov) return sendError(res, '供应商不存在', 404);
  const baseUrl = (prov.baseUrl || '').replace(/\/$/, '');
  if (!baseUrl) return sendError(res, 'baseUrl 未配置', 400);

  // 尝试 GET {baseUrl}/models
  const testUrl = `${baseUrl}/models`;
  const apiKey = prov.apiKey;
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey && typeof apiKey === 'string' && !apiKey.includes('REDACTED')) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    // 使用内置 https/http 模块
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

// ─────────────────────────────────────────────
// API 实现 — Agent
// ─────────────────────────────────────────────
function handleGetAgents(req, res) {
  const cfg = readConfig();
  if (!cfg) return sendJson(res, { defaults: {}, list: [] });

  const defaults = (cfg.agents && cfg.agents.defaults) || {};
  let list = (cfg.agents && cfg.agents.list) || [];

  // 补充运行时状态
  list = list.map(agent => {
    const a = { ...agent };
    a._status = 'idle';
    a._session = null;
    a._lastActivity = null;
    try {
      const sessionDir = findSessionDir(a.id, a);
      if (sessionDir) {
        const files = fs.readdirSync(sessionDir);
        const locks = files.filter(f => f.endsWith('.lock'));
        if (locks.length > 0) {
          a._status = 'working';
          a._session = locks[0].replace('.jsonl.lock', '');
        }
        const jsonls = files.filter(f => f.endsWith('.jsonl') && !f.endsWith('.lock'));
        if (jsonls.length > 0) {
          const latest = jsonls.sort((a, b) =>
            fs.statSync(path.join(sessionDir, b)).mtimeMs - fs.statSync(path.join(sessionDir, a)).mtimeMs
          )[0];
          a._lastActivity = new Date(fs.statSync(path.join(sessionDir, latest)).mtimeMs).toISOString();
          if (!a._session) a._session = latest.replace('.jsonl', '');
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
    try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
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
    try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleDeleteAgent(req, res, id) {
  try {
    const cfg = readConfig() || {};
    if (cfg.agents && cfg.agents.list) {
      cfg.agents.list = cfg.agents.list.filter(a => a.id !== id);
      try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
    }
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─────────────────────────────────────────────
// API 实现 — 渠道
// ─────────────────────────────────────────────
const KNOWN_CHANNELS = ['telegram', 'discord', 'slack', 'whatsapp', 'signal', 'imessage', 'feishu', 'matrix', 'mattermost', 'irc', 'xmpp', 'email', 'webhook'];

function handleGetChannels(req, res) {
  const cfg = readConfig();
  const channels = (cfg && cfg.channels) || {};
  // 补充已知渠道（即使未配置也列出来）
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

// ─────────────────────────────────────────────
// API 实现 — Cron
// ─────────────────────────────────────────────
function handleGetCron(req, res) {
  const cfg = readConfig();
  const jobs = (cfg && cfg.cron && cfg.cron.jobs) || [];
  sendJson(res, jobs);
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
    try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
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
    try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

async function handleDeleteCron(req, res, id) {
  try {
    const cfg = readConfig() || {};
    if (cfg.cron && cfg.cron.jobs) {
      cfg.cron.jobs = cfg.cron.jobs.filter(j => j.id !== id);
      try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
    }
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─────────────────────────────────────────────
// API 实现 — Skills / Plugins
// ─────────────────────────────────────────────
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
    try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
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
    try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─────────────────────────────────────────────
// API 实现 — Sessions
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// API 实现 — 日志 SSE
// ─────────────────────────────────────────────
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

  // 找最新 JSONL 文件
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
    if (latest !== currentFile) {
      currentFile = latest;
      offset = 0;
    }
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

  // 监听目录变化，检测新内容
  try {
    watcher = fs.watch(sessionDir, { persistent: false }, () => readNew());
  } catch {}

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch {}
    readNew();
  }, 3000);

  req.on('close', () => {
    clearInterval(heartbeat);
    try { watcher && watcher.close(); } catch {}
  });
}

// ─────────────────────────────────────────────
// API 实现 — 运维命令
// ─────────────────────────────────────────────
async function handleCmdRestart(req, res) {
  try {
    const bin = getOpenClawBinary();
    exec(`${bin} gateway restart`, { timeout: 15000, env: process.env }, (err) => {
      if (err && err.code !== 0) {
        // Gateway 重启会断开连接，这里 err 不一定代表失败
      }
    });
    sendJson(res, { ok: true, message: 'Gateway 重启命令已发送' });
  } catch (e) {
    sendError(res, e.message);
  }
}

async function handleCmdDoctor(req, res) {
  try {
    const stdout = await runOpenclaw(['doctor', '--json']);
    let result;
    try { result = JSON.parse(stdout); } catch { result = { raw: stdout }; }
    sendJson(res, { ok: true, result });
  } catch (e) {
    sendJson(res, { ok: false, error: e.message });
  }
}

// ─────────────────────────────────────────────
// HTTP 服务器主入口
// ─────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  let pathname, params;
  try {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    pathname = u.pathname;
    params = u.searchParams;
  } catch {
    pathname = req.url.split('?')[0];
    params = new URLSearchParams(req.url.includes('?') ? req.url.split('?')[1] : '');
  }

  if (pathname.startsWith('/api/')) {
    try {
      await handleApi(req, res, pathname, params);
    } catch (e) {
      if (!res.headersSent) sendError(res, e.message);
    }
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[openclaw-panel] 服务已启动: http://localhost:${PORT}`);
  console.log(`[openclaw-panel] OPENCLAW_HOME: ${OPENCLAW_HOME}`);
  console.log(`[openclaw-panel] 配置文件: ${CONFIG_PATH}`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`[openclaw-panel] 端口 ${PORT} 已被占用，请检查是否已有实例运行`);
  } else {
    console.error('[openclaw-panel] 服务器错误:', e.message);
  }
  process.exit(1);
});
