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
// 配置读写工具（带缓存）
// ─────────────────────────────────────────────
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
  // 清除缓存以确保下次读取最新
  _configCache = null;
  _configMtimeMs = 0;
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

function serveStatic(req, res, pathname) {
  const safePath = pathname || (req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  let filePath = path.join(PUBLIC_DIR, safePath === '/' ? '/index.html' : safePath);
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
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    // 开发模式：JS/CSS 不缓存，确保每次都加载最新代码
    if (ext === '.js' || ext === '.css') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
    }
    res.writeHead(200, headers);
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

  // ── Gateway Token（用于 WebUI 自动登录）────
  if (req.method === 'GET' && pathname === '/api/gateway-token') {
    return handleGetGatewayToken(req, res);
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
  // ── 通用配置 patch ──────────────────────────
  if (req.method === 'POST' && pathname === '/api/config/patch') {
    return handleConfigPatch(req, res);
  }

  // ── 运维命令 ──────────────────────────────
  if (req.method === 'POST' && pathname === '/api/cmd/restart') {
    return handleCmdRestart(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/cmd/stop') {
    return handleCmdStop(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/cmd/start') {
    return handleCmdStart(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/cmd/doctor') {
    return handleCmdDoctor(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/cmd/upgrade') {
    return handleCmdUpgrade(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/cmd/do-upgrade') {
    return handleCmdDoUpgrade(req, res);
  }

  // ── MCP 服务器管理 ────────────────────────
  if (req.method === 'GET' && pathname === '/api/mcp') {
    return handleGetMcp(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/mcp') {
    return handleSaveMcpServer(req, res);
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/mcp/')) {
    const id = decodeURIComponent(pathname.slice('/api/mcp/'.length));
    return handleDeleteMcpServer(req, res, id);
  }

  // ── Sandbox 配置 ──────────────────────────
  if (req.method === 'GET' && pathname === '/api/sandbox') {
    return handleGetSandbox(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/sandbox') {
    return handleSaveSandbox(req, res);
  }

  // ── Hooks 配置 ────────────────────────────
  if (req.method === 'GET' && pathname === '/api/hooks') {
    return handleGetHooks(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/hooks') {
    return handleSaveHooks(req, res);
  }

  // ── Memory 配置 ───────────────────────────
  if (req.method === 'GET' && pathname === '/api/memory') {
    return handleGetMemory(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/memory') {
    return handleSaveMemory(req, res);
  }

  // ── Tools 高级配置 ────────────────────────
  if (req.method === 'GET' && pathname === '/api/tools/advanced') {
    return handleGetToolsAdvanced(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/tools/advanced') {
    return handleSaveToolsAdvanced(req, res);
  }

  // ── 看门狗 ────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/watchdog') {
    return handleGetWatchdog(req, res);
  }
  if (req.method === 'POST' && pathname === '/api/watchdog') {
    return handleSaveWatchdog(req, res);
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
  const cfg = readConfig() || {};
  // 兼容两种配置结构：models.providers（旧）和 auth.profiles（新）
  const modelsProviders = (cfg.models && cfg.models.providers) || {};
  const authProfiles = (cfg.auth && cfg.auth.profiles) || {};
  // 合并：auth.profiles 优先显示
  const merged = { ...modelsProviders };
  for (const [key, profile] of Object.entries(authProfiles)) {
    // auth.profiles 的 key 格式: "provider-name:profile-name"
    const providerId = profile.provider || key.split(':')[0] || key;
    if (!merged[providerId]) {
      merged[providerId] = {
        ...profile,
        _source: 'auth.profiles',
        _profileKey: key,
      };
    }
  }
  sendJson(res, redactConfig(merged));
}

// 辅助：定位供应商实际存储路径
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
      try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
      _configCache = null; _configMtimeMs = 0;
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

// ─────────────────────────────────────────────
// API 实现 — Agent
// ─────────────────────────────────────────────
function handleGetAgents(req, res) {
  const cfg = readConfig() || {};
  const defaults = (cfg.agents && cfg.agents.defaults) || {};

  // 从配置中的 agents.list 读取（旧模式）
  let list = (cfg.agents && cfg.agents.list) || [];

  // 从磁盘 ~/.openclaw/agents/ 目录发现 agent（新模式）
  const agentsDir = path.join(OPENCLAW_HOME, 'agents');
  try {
    if (fs.existsSync(agentsDir)) {
      const dirs = fs.readdirSync(agentsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      for (const dirName of dirs) {
        // 跳过已在 list 中的
        if (list.find(a => a.id === dirName)) continue;
        const agentMeta = { id: dirName, name: dirName, _source: 'disk' };
        // 尝试读取 agent 目录下的元信息
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
        // 读取 sessions.json 获取详细元数据（同 control-center 做法）
        const sessionsJsonPath = path.join(sessionDir, 'sessions.json');
        let sessionsMap = {};
        try {
          if (fs.existsSync(sessionsJsonPath)) {
            sessionsMap = JSON.parse(fs.readFileSync(sessionsJsonPath, 'utf-8')) || {};
          }
        } catch {}

        const sessionEntries = Object.entries(sessionsMap);
        a._sessionCount = sessionEntries.length;

        // 找到最近活跃的会话
        if (sessionEntries.length > 0) {
          const sorted = sessionEntries.sort(([, v1], [, v2]) =>
            ((v2 && v2.updatedAt) || 0) - ((v1 && v1.updatedAt) || 0)
          );
          const [latestKey, latestSession] = sorted[0];
          if (latestSession) {
            a._lastActivity = latestSession.updatedAt
              ? new Date(latestSession.updatedAt).toISOString()
              : null;
            a._session = latestSession.sessionId || latestKey;
            a._lastChannel = latestSession.lastChannel || latestSession.origin?.channel || null;
            a._chatType = latestSession.chatType || null;
          }
        }

        // 检查锁文件判断是否正在运行
        const files = fs.readdirSync(sessionDir);
        const locks = files.filter(f => f.endsWith('.lock'));
        if (locks.length > 0) {
          a._status = 'working';
          a._session = locks[0].replace('.jsonl.lock', '');
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
// API 实现 — 通用配置 patch
// ─────────────────────────────────────────────
async function handleConfigPatch(req, res) {
  try {
    const body = await readBody(req);
    if (!body.path || !Array.isArray(body.path)) {
      return sendError(res, 'path must be an array', 400);
    }
    patchConfig(body.path, body.value);
    sendJson(res, { ok: true });
  } catch (e) {
    sendError(res, e.message, 500);
  }
}

// ─────────────────────────────────────────────
// API 实现 — 运维命令
// ─────────────────────────────────────────────
function getOcCmd(sub) {
  const isWin = os.platform() === 'win32';
  const bin = isWin ? 'openclaw.cmd' : 'openclaw';
  return { cmd: `${bin} ${sub}`, shell: isWin ? 'powershell' : true };
}

// 查找 openclaw gateway 进程的 PID（不包含自身 panel server）
function findGatewayPids(callback) {
  const platform = os.platform();
  if (platform === 'win32') {
    // tasklist 比 wmic 快 10 倍
    exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH', { windowsHide: true, timeout: 5000 }, (err, stdout) => {
      if (err) return callback([]);
      // 用 wmic 获取带命令行的进程 (仅做 PID 匹配)
      exec('wmic process where "name like \'%node%\'" get processid,commandline /format:csv', { windowsHide: true, timeout: 8000 }, (e2, out2) => {
        if (e2 || !out2) return callback([]);
        const pids = [];
        out2.split('\n').forEach(line => {
          if (line.includes('openclaw') && line.includes('gateway') && !line.includes('server.js')) {
            const m = line.match(/(\d+)\s*$/);
            if (m) pids.push(m[1]);
          }
        });
        callback(pids);
      });
    });
  } else {
    exec('ps -ef | grep "[o]penclaw.*gateway" | awk \'{print $2}\'', { timeout: 5000 }, (err, stdout) => {
      if (err || !stdout) return callback([]);
      callback(stdout.split('\n').map(s => s.trim()).filter(Boolean));
    });
  }
}

function ts() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

function killPids(pids, lines) {
  pids.forEach(pid => {
    try {
      process.kill(parseInt(pid));
      lines.push(`[${ts()}] 已停止进程 PID ${pid}`);
    } catch (e) {
      if (os.platform() === 'win32') {
        try { exec(`taskkill /F /PID ${pid}`, { windowsHide: true }); } catch {}
      }
      lines.push(`[${ts()}] 强制终止进程 PID ${pid}`);
    }
  });
}

function handleCmdRestart(req, res) {
  const lines = [];
  lines.push(`[${ts()}] 正在查找 Gateway 进程...`);
  findGatewayPids(pids => {
    if (pids.length > 0) {
      lines.push(`[${ts()}] 找到进程 PID: ${pids.join(', ')}`);
      killPids(pids, lines);
    } else {
      lines.push(`[${ts()}] 未找到运行中的进程，直接启动`);
    }
    lines.push(`[${ts()}] 等待进程退出...`);
    setTimeout(() => {
      try {
        const { cmd, shell } = getOcCmd('gateway run');
        lines.push(`[${ts()}] 正在启动新实例...`);
        const oc = exec(cmd, { detached: true, stdio: 'ignore', windowsHide: true, shell });
        try { oc.unref(); } catch {}
        lines.push(`[${ts()}] Gateway 已启动 (PID: ${oc.pid || '未知'})`);
        sendJson(res, { success: true, message: 'Gateway 重启完成', output: lines.join('\n') });
      } catch (e) {
        lines.push(`[${ts()}] 启动失败: ${e.message}`);
        sendJson(res, { success: false, error: e.message, output: lines.join('\n') });
      }
    }, 500);
  });
}

function handleCmdStop(req, res) {
  const lines = [];
  lines.push(`[${ts()}] 正在查找 Gateway 进程...`);
  findGatewayPids(pids => {
    if (pids.length === 0) {
      lines.push(`[${ts()}] 未找到运行中的 Gateway 进程`);
      return sendJson(res, { success: true, message: '未找到 Gateway 进程', output: lines.join('\n') });
    }
    lines.push(`[${ts()}] 找到进程 PID: ${pids.join(', ')}`);
    killPids(pids, lines);
    lines.push(`[${ts()}] Gateway 已停止`);
    sendJson(res, { success: true, message: 'Gateway 已停止', output: lines.join('\n') });
  });
}

function handleCmdStart(req, res) {
  const lines = [];
  lines.push(`[${ts()}] 正在启动 Gateway...`);
  try {
    const { cmd, shell } = getOcCmd('gateway run');
    lines.push(`[${ts()}] 执行: openclaw gateway run`);
    const oc = exec(cmd, { detached: true, stdio: 'ignore', windowsHide: true, shell });
    try { oc.unref(); } catch {}
    lines.push(`[${ts()}] 进程已启动 (PID: ${oc.pid || '未知'})`);
    sendJson(res, { success: true, message: 'Gateway 启动命令已发送', output: lines.join('\n') });
  } catch (e) {
    lines.push(`[${ts()}] 启动失败: ${e.message}`);
    sendJson(res, { success: false, error: e.message, output: lines.join('\n') });
  }
}

function handleCmdDoctor(req, res) {
  const { cmd, shell } = getOcCmd('doctor --fix');
  exec(cmd, { timeout: 30000, shell }, (err, stdout, stderr) => {
    sendJson(res, {
      success: !err,
      stdout: stdout || '',
      stderr: stderr || '',
      error: err ? err.message : undefined,
    });
  });
}

// 从 "OpenClaw 2026.3.13 (61d171a)" 中提取纯版本号 "2026.3.13"
function cleanVersion(raw) {
  const s = (raw || '').trim();
  const m = s.match(/(\d+\.\d+\.\d+(?:[-.][\w.]+)*)/);
  return m ? m[1] : s;
}

function handleCmdUpgrade(req, res) {
  const isWin = os.platform() === 'win32';
  const shell = isWin ? 'powershell' : true;
  exec('npm view openclaw version', { timeout: 15000, shell }, (err, stdout) => {
    if (err) {
      return sendJson(res, { success: false, error: err.message });
    }
    const latestVer = (stdout || '').trim();
    const verCmd = isWin ? 'openclaw.cmd --version' : 'openclaw --version';
    exec(verCmd, { timeout: 10000, shell }, (err2, stdout2) => {
      const currentVer = cleanVersion(stdout2);
      const needsUpdate = latestVer && currentVer && latestVer !== currentVer;
      sendJson(res, {
        success: true,
        latest: latestVer,
        current: currentVer,
        needsUpdate,
        stdout: `Current: ${currentVer || 'unknown'}\nLatest: ${latestVer || 'unknown'}\n${needsUpdate ? 'Update available: npm update -g openclaw' : 'Already up to date'}`,
      });
    });
  });
}

function handleCmdDoUpgrade(req, res) {
  readBody(req).then(body => {
    const isWin = os.platform() === 'win32';
    const shell = isWin ? 'powershell' : true;
    const targetVer = (body && body.version) ? body.version : 'latest';
    const installCmd = `npm install -g openclaw@${targetVer}`;
    exec(installCmd, { timeout: 120000, shell }, (err, stdout, stderr) => {
      if (err) {
        return sendJson(res, {
          success: false,
          error: err.message,
          stdout: stdout || '',
          stderr: stderr || '',
        });
      }
      const verCmd = isWin ? 'openclaw.cmd --version' : 'openclaw --version';
      exec(verCmd, { timeout: 10000, shell }, (err2, stdout2) => {
        sendJson(res, {
          success: true,
          newVersion: cleanVersion(stdout2),
          stdout: stdout || '',
          stderr: stderr || '',
        });
      });
    });
  }).catch(e => sendError(res, e.message, 400));
}

// ─────────────────────────────────────────────
// API 实现 — MCP 服务器管理
// ─────────────────────────────────────────────
function handleGetMcp(req, res) {
  const cfg = readConfig();
  const servers = (cfg && cfg.mcp && cfg.mcp.servers) || {};
  sendJson(res, servers);
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
      try { fs.copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak'); } catch {}
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
      _configCache = null; _configMtimeMs = 0;
    }
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─────────────────────────────────────────────
// API 实现 — Sandbox 配置
// ─────────────────────────────────────────────
function handleGetSandbox(req, res) {
  const cfg = readConfig();
  sendJson(res, redactConfig((cfg && cfg.sandbox) || {}));
}

async function handleSaveSandbox(req, res) {
  const body = await readBody(req);
  try {
    const cfg = readConfig() || {};
    const original = cfg.sandbox || {};
    patchConfig(['sandbox'], restoreRedacted(original, body));
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─────────────────────────────────────────────
// API 实现 — Hooks 配置
// ─────────────────────────────────────────────
function handleGetHooks(req, res) {
  const cfg = readConfig();
  sendJson(res, redactConfig((cfg && cfg.hooks) || {}));
}

async function handleSaveHooks(req, res) {
  const body = await readBody(req);
  try {
    const cfg = readConfig() || {};
    const original = cfg.hooks || {};
    patchConfig(['hooks'], restoreRedacted(original, body));
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
}

// ─────────────────────────────────────────────
// API 实现 — Memory 配置
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// API 实现 — Tools 高级配置
// ─────────────────────────────────────────────
function handleGetToolsAdvanced(req, res) {
  const cfg = readConfig();
  const tools = (cfg && cfg.tools) || {};
  sendJson(res, redactConfig({
    exec: tools.exec || {},
    web: tools.web || {},
    fs: tools.fs || {},
    elevated: tools.elevated || {},
    loopDetection: tools.loopDetection || {},
    profile: tools.profile || '',
    allow: tools.allow || [],
    deny: tools.deny || [],
  }));
}

async function handleSaveToolsAdvanced(req, res) {
  const body = await readBody(req);
  try {
    const { section, value } = body;
    if (!section) return sendError(res, 'section 是必填项', 400);
    const cfg = readConfig() || {};
    const original = (cfg.tools && cfg.tools[section]) || {};
    patchConfig(['tools', section], restoreRedacted(original, value));
    sendJson(res, { ok: true });
  } catch (e) { sendError(res, e.message); }
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

  serveStatic(req, res, pathname);
});

// ─────────────────────────────────────────────
// API 实现 — Gateway Token 解析（用于 WebUI 自动登录）
// ─────────────────────────────────────────────
function resolveTokenValue(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    // 支持 "${VAR_NAME}" 模板格式
    const m = val.match(/^\$\{([A-Z_][A-Z0-9_]*)\}$/);
    if (m) return process.env[m[1]] || null;
    return val;
  }
  // SecretRef: { source: 'env', id: 'VAR_NAME' }
  if (typeof val === 'object' && val.source === 'env' && val.id) {
    return process.env[val.id] || null;
  }
  return null;
}

function handleGetGatewayToken(req, res) {
  const cfg = readConfig();
  const auth = (cfg && cfg.gateway && cfg.gateway.auth) || {};
  const mode = auth.mode || 'none';
  const token = resolveTokenValue(auth.token);
  sendJson(res, { mode, token });
}

// ─────────────────────────────────────────────
// 看门狗 — 自动守护 Gateway
// ─────────────────────────────────────────────
const WATCHDOG_CONFIG_PATH = path.join(__dirname, '.panel-watchdog.json');

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

function probeGatewayPort() {
  return new Promise(resolve => {
    const cfg = readConfig();
    const gwPort = (cfg && cfg.gateway && cfg.gateway.port) || 18789;
    const sock = new net.Socket();
    sock.setTimeout(800);
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
    sock.once('error', () => { sock.destroy(); resolve(false); });
    sock.connect(gwPort, '127.0.0.1');
  });
}

async function runWatchdogTick() {
  if (!_watchdog.enabled) return;
  _watchdogState.lastCheck = new Date().toISOString();
  const alive = await probeGatewayPort();
  if (alive) {
    // 只在状态从离线恢复时记录，正常运行不重复写日志
    if (_watchdogState.consecutiveMisses > 0) {
      watchdogAddLog(`Gateway 恢复正常，计数清零`);
    }
    _watchdogState.consecutiveMisses = 0;
  } else {
    _watchdogState.consecutiveMisses++;
    watchdogAddLog(`Gateway 离线（连续第 ${_watchdogState.consecutiveMisses} 次）`);
    if (_watchdogState.consecutiveMisses >= 2) {
      // Anti-Flapping: 自动启动后至少等 3 个 tick 的冷却期
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
          _watchdogState.consecutiveMisses = 0;
          _watchdogState.lastAutoStartMs = Date.now();
          _watchdogState.autoStartedAt = new Date().toISOString();
        } catch (e) {
          watchdogAddLog(`自动启动失败: ${e.message}`);
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

function handleGetWatchdog(req, res) {
  sendJson(res, {
    enabled: _watchdog.enabled,
    interval: _watchdog.interval,
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
  if (_watchdog.enabled && !wasEnabled) {
    startWatchdog();
  } else if (!_watchdog.enabled && wasEnabled) {
    stopWatchdog();
  } else if (_watchdog.enabled) {
    scheduleWatchdog();
  }
  sendJson(res, { ok: true, enabled: _watchdog.enabled, interval: _watchdog.interval });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[openclaw-panel] 服务已启动: http://localhost:${PORT}`);
  console.log(`[openclaw-panel] OPENCLAW_HOME: ${OPENCLAW_HOME}`);
  console.log(`[openclaw-panel] 配置文件: ${CONFIG_PATH}`);
  loadWatchdogConfig();
  if (_watchdog.enabled) {
    console.log(`[openclaw-panel] 看门狗已启用，间隔 ${_watchdog.interval}s`);
    startWatchdog();
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`[openclaw-panel] 端口 ${PORT} 已被占用，请检查是否已有实例运行`);
  } else {
    console.error('[openclaw-panel] 服务器错误:', e.message);
  }
  process.exit(1);
});
