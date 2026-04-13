'use strict';

// ─────────────────────────────────────────────
// OpenClaw Panel — 入口
// ─────────────────────────────────────────────

const http = require('http');
const { URL } = require('url');

// ── Lib ──────────────────────────────────────
const { PORT, HOST, OPENCLAW_HOME, CONFIG_PATH } = require('./lib/constants');
const { readConfig, getNestedValue, redactConfig, restoreRedacted, patchConfig } = require('./lib/config');
const { readBody, sendJson, sendError, serveStatic } = require('./lib/http-utils');

// ── Routes ───────────────────────────────────
const { handleSysHealth } = require('./routes/sys-health');
const { handleGetProviders, handleCreateProvider, handleUpdateProvider, handleDeleteProvider, handleTestProvider } = require('./routes/providers');
const { handleGetAgents, handleCreateAgent, handleUpdateAgent, handleDeleteAgent } = require('./routes/agents');
const {
  handleGetChannels, handleUpdateChannel,
  handleGetCron, handleCreateCron, handleUpdateCron, handleDeleteCron,
  handleGetSkills, handleToggleSkill,
  handleGetPlugins, handleTogglePlugin,
} = require('./routes/config-crud');
const { handleGetSessions, handleGetSessionMessages } = require('./routes/sessions');
const { handleLogsStream } = require('./routes/logs-stream');
const { handleCmdRestart, handleCmdStop, handleCmdStart, handleCmdDoctor, handleCmdUpgrade, handleCmdDoUpgrade } = require('./routes/ops-commands');
const {
  handleGetMcp, handleSaveMcpServer, handleDeleteMcpServer,
  handleGetSandbox, handleSaveSandbox,
  handleGetHooks, handleSaveHooks,
  handleGetMemory, handleSaveMemory,
  handleGetMemoryFiles, handleGetMemoryFile, handleSaveMemoryFile,
  handleGetToolsAdvanced, handleSaveToolsAdvanced,
  handleGetUsage,
} = require('./routes/config-sections');
const { loadWatchdogConfig, startWatchdog, getWatchdogConfig, handleGetWatchdog, handleSaveWatchdog, handleGetGatewayToken } = require('./routes/watchdog');

// ─────────────────────────────────────────────
// API 路由分发
// ─────────────────────────────────────────────
async function handleApi(req, res, pathname, params) {
  // ── 系统健康 ──
  if (req.method === 'GET' && pathname === '/api/sys-health') return handleSysHealth(req, res);
  if (req.method === 'GET' && pathname === '/api/gateway-token') return handleGetGatewayToken(req, res);

  // ── 配置 ──
  if (req.method === 'GET' && pathname === '/api/config') {
    const cfg = readConfig();
    return sendJson(res, cfg ? redactConfig(cfg) : null);
  }
  if (req.method === 'POST' && pathname === '/api/config/patch') {
    const body = await require('./lib/http-utils').readBody(req);
    const { path: p, value } = body;
    if (!Array.isArray(p)) return sendError(res, 'path 必须是数组', 400);
    try {
      const originalCfg = readConfig() || {};
      const originalVal = getNestedValue(originalCfg, p);
      patchConfig(p, restoreRedacted(originalVal, value));
      return sendJson(res, { ok: true });
    } catch (e) { return sendError(res, e.message); }
  }

  // ── 供应商 ──
  if (req.method === 'GET' && pathname === '/api/providers') return handleGetProviders(req, res);
  if (req.method === 'POST' && pathname === '/api/providers') return handleCreateProvider(req, res);
  if (req.method === 'PUT' && pathname.startsWith('/api/providers/') && !pathname.endsWith('/test')) {
    return handleUpdateProvider(req, res, decodeURIComponent(pathname.slice('/api/providers/'.length)));
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/providers/')) {
    return handleDeleteProvider(req, res, decodeURIComponent(pathname.slice('/api/providers/'.length)));
  }
  if (req.method === 'POST' && pathname.startsWith('/api/providers/') && pathname.endsWith('/test')) {
    return handleTestProvider(req, res, decodeURIComponent(pathname.slice('/api/providers/'.length, -'/test'.length)));
  }

  // ── Agent ──
  if (req.method === 'GET' && pathname === '/api/agents') return handleGetAgents(req, res);
  if (req.method === 'POST' && pathname === '/api/agents') return handleCreateAgent(req, res);
  if (req.method === 'PUT' && pathname.startsWith('/api/agents/')) {
    return handleUpdateAgent(req, res, decodeURIComponent(pathname.slice('/api/agents/'.length)));
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/agents/')) {
    return handleDeleteAgent(req, res, decodeURIComponent(pathname.slice('/api/agents/'.length)));
  }

  // ── 渠道 ──
  if (req.method === 'GET' && pathname === '/api/channels') return handleGetChannels(req, res);
  if (req.method === 'PUT' && pathname.startsWith('/api/channels/')) {
    return handleUpdateChannel(req, res, decodeURIComponent(pathname.slice('/api/channels/'.length)));
  }

  // ── Cron ──
  if (req.method === 'GET' && pathname === '/api/cron') return handleGetCron(req, res);
  if (req.method === 'POST' && pathname === '/api/cron') return handleCreateCron(req, res);
  if (req.method === 'PUT' && pathname.startsWith('/api/cron/')) {
    return handleUpdateCron(req, res, decodeURIComponent(pathname.slice('/api/cron/'.length)));
  }
  if (req.method === 'DELETE' && pathname.startsWith('/api/cron/')) {
    return handleDeleteCron(req, res, decodeURIComponent(pathname.slice('/api/cron/'.length)));
  }

  // ── Skills / Plugins ──
  if (req.method === 'GET' && pathname === '/api/skills') return handleGetSkills(req, res);
  if (req.method === 'POST' && pathname.startsWith('/api/skills/') && pathname.endsWith('/toggle')) {
    return handleToggleSkill(req, res, decodeURIComponent(pathname.slice('/api/skills/'.length, -'/toggle'.length)));
  }
  if (req.method === 'GET' && pathname === '/api/plugins') return handleGetPlugins(req, res);
  if (req.method === 'POST' && pathname.startsWith('/api/plugins/') && pathname.endsWith('/toggle')) {
    return handleTogglePlugin(req, res, decodeURIComponent(pathname.slice('/api/plugins/'.length, -'/toggle'.length)));
  }

  // ── Sessions ──
  if (req.method === 'GET' && pathname === '/api/sessions') return handleGetSessions(req, res);
  if (req.method === 'GET' && pathname.startsWith('/api/sessions/') && pathname.endsWith('/messages')) {
    return handleGetSessionMessages(req, res, decodeURIComponent(pathname.slice('/api/sessions/'.length, -'/messages'.length)), params);
  }

  // ── 日志 SSE ──
  if (req.method === 'GET' && pathname === '/api/logs/stream') return handleLogsStream(req, res, params);

  // ── 运维命令 ──
  if (req.method === 'POST' && pathname === '/api/cmd/restart') return handleCmdRestart(req, res);
  if (req.method === 'POST' && pathname === '/api/cmd/stop') return handleCmdStop(req, res);
  if (req.method === 'POST' && pathname === '/api/cmd/start') return handleCmdStart(req, res);
  if (req.method === 'POST' && pathname === '/api/cmd/doctor') return handleCmdDoctor(req, res);
  if (req.method === 'POST' && pathname === '/api/cmd/upgrade') return handleCmdUpgrade(req, res);
  if (req.method === 'POST' && pathname === '/api/cmd/do-upgrade') return handleCmdDoUpgrade(req, res);

  // ── MCP ──
  if (req.method === 'GET' && pathname === '/api/mcp') return handleGetMcp(req, res);
  if (req.method === 'POST' && pathname === '/api/mcp') return handleSaveMcpServer(req, res);
  if (req.method === 'DELETE' && pathname.startsWith('/api/mcp/')) {
    return handleDeleteMcpServer(req, res, decodeURIComponent(pathname.slice('/api/mcp/'.length)));
  }

  // ── 配置子模块 ──
  if (req.method === 'GET' && pathname === '/api/sandbox') return handleGetSandbox(req, res);
  if (req.method === 'POST' && pathname === '/api/sandbox') return handleSaveSandbox(req, res);
  if (req.method === 'GET' && pathname === '/api/hooks') return handleGetHooks(req, res);
  if (req.method === 'POST' && pathname === '/api/hooks') return handleSaveHooks(req, res);
  if (req.method === 'GET' && pathname === '/api/memory') return handleGetMemory(req, res);
  if (req.method === 'POST' && pathname === '/api/memory') return handleSaveMemory(req, res);
  if (req.method === 'GET' && pathname === '/api/memory/files') return handleGetMemoryFiles(req, res);
  if (req.method === 'GET' && pathname.startsWith('/api/memory/files/')) {
    return handleGetMemoryFile(req, res, decodeURIComponent(pathname.slice('/api/memory/files/'.length)));
  }
  if (req.method === 'PUT' && pathname.startsWith('/api/memory/files/')) {
    return handleSaveMemoryFile(req, res, decodeURIComponent(pathname.slice('/api/memory/files/'.length)));
  }
  if (req.method === 'GET' && pathname === '/api/usage') return handleGetUsage(req, res);
  if (req.method === 'GET' && pathname === '/api/tools/advanced') return handleGetToolsAdvanced(req, res);
  if (req.method === 'POST' && pathname === '/api/tools/advanced') return handleSaveToolsAdvanced(req, res);

  // ── 看门狗 ──
  if (req.method === 'GET' && pathname === '/api/watchdog') return handleGetWatchdog(req, res);
  if (req.method === 'POST' && pathname === '/api/watchdog') return handleSaveWatchdog(req, res);

  sendError(res, '接口不存在', 404);
}

// ─────────────────────────────────────────────
// HTTP 服务器
// ─────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
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
    try { await handleApi(req, res, pathname, params); }
    catch (e) { if (!res.headersSent) sendError(res, e.message); }
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`[openclaw-panel] 服务已启动: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`[openclaw-panel] OPENCLAW_HOME: ${OPENCLAW_HOME}`);
  console.log(`[openclaw-panel] 配置文件: ${CONFIG_PATH}`);
  loadWatchdogConfig();
  const wdCfg = getWatchdogConfig();
  if (wdCfg.enabled) {
    console.log(`[openclaw-panel] 看门狗已启用，间隔 ${wdCfg.interval}s`);
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
