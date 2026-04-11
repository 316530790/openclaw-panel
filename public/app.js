'use strict';

// ─────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────
const I18N = {
  zh: {
    nav_monitor: '监控', nav_config: '配置', nav_ops: '运维',
    nav_overview: '概览', nav_logs: '日志', nav_providers: '供应商',
    nav_agents: 'Agent', nav_channels: '渠道', nav_tools: '工具',
    nav_skills: '技能 & 插件', nav_cron: '定时任务', nav_settings: '设置', nav_quickops: '快捷操作',
    nav_mcp: 'MCP 服务', nav_sandbox: '沙盒', nav_memory: '记忆', nav_hooks: 'Hooks', nav_webui: '打开 WebUI',
    gw_online: 'Gateway 在线', gw_offline: 'Gateway 离线', gw_checking: '检测中...',
    save: '保存', cancel: '取消', delete: '删除', edit: '编辑', add: '新增',
    confirm: '确认', test: '测试', enable: '启用', disable: '禁用',
    saving: '保存中...', loading: '加载中...', testing: '测试中...',
    save_ok: '保存成功', save_fail: '保存失败', delete_ok: '删除成功',
    op_ok: '操作成功', op_fail: '操作失败',
    required_field: '此字段必填',
    restart_confirm_title: '确认重启 Gateway',
    restart_confirm_msg: '修改 gateway 或 plugins 配置需要重启 Gateway（约 5 秒断开）。确认继续？',
    restart_ok: '重启命令已发送',
    page_overview: '概览', page_logs: '日志', page_providers: '供应商',
    page_agents: 'Agent 管理', page_channels: '渠道配置', page_tools: '工具配置',
    page_skills: '技能 & 插件', page_cron: '定时任务', page_settings: '系统设置', page_quickops: '快捷操作',
    page_mcp: 'MCP 服务器', page_sandbox: '沙盒配置', page_memory: '记忆系统', page_hooks: 'Hooks 配置',
    cpu: 'CPU 使用率', mem: '内存占用', disk: '磁盘占用', uptime: 'OpenClaw 运行时长',
    gateway: 'Gateway', online: '在线', offline: '离线',
    agent_matrix: 'Agent 矩阵', agent_status: '状态', active_sessions: '活跃会话',
    working: '工作中', idle: '空闲',
    provider_name: '供应商 ID', provider_baseurl: 'Base URL', provider_apikey: 'API Key',
    provider_auth: '认证方式', provider_models: '模型列表 (JSON)',
    add_provider: '添加供应商', preset_providers: '预设供应商', custom_provider: '自定义供应商',
    test_conn: '测试连通', conn_ok: '连通成功', conn_fail: '连通失败',
    agent_id: 'Agent ID', agent_name: '显示名称', agent_workspace: '工作目录',
    agent_model: '主模型', agent_skills: '技能列表',
    agent_defaults: '全局默认', agent_list: 'Agent 列表',
    add_agent: '新增 Agent', agent_id_hint: '建议小写字母和连字符，如 coding-bot',
    channel_enabled: '已启用', channel_disabled: '已禁用',
    channel_token: 'Bot Token', channel_dm_policy: 'DM 策略',
    channel_allow_from: '允许用户 (逗号分隔 ID)',
    channel_advanced: '高级配置 (JSON)',
    tools_media: '媒体工具', tools_exec: '执行工具',
    tools_image: '图像理解', tools_audio: '语音转录', tools_video: '视频理解',
    skills_bundled: '内置技能', plugins_title: '插件',
    cron_add: '新增任务', cron_id: '任务 ID', cron_name: '任务名称',
    cron_schedule: '调度', cron_payload: '执行内容',
    cron_type_at: '指定时间', cron_type_every: '间隔执行', cron_type_cron: 'Cron 表达式',
    cron_payload_system: '系统事件', cron_payload_agent: 'Agent 消息',
    cron_enabled: '已启用', cron_disabled: '已禁用',
    settings_gateway: 'Gateway 设置', settings_session: '会话策略',
    settings_restart_warn: '修改 Gateway 配置将触发重启',
    gw_port: '端口', gw_auth: '认证模式',
    session_scope: '会话范围', session_dm_scope: 'DM 范围',
    doctor_run: '运行诊断', doctor_running: '诊断中...',
    logs_select_agent: '选择 Agent', logs_connecting: '连接日志流...',
    no_data: '暂无数据',
  },
  en: {
    nav_monitor: 'Monitor', nav_config: 'Config', nav_ops: 'Operations',
    nav_overview: 'Overview', nav_logs: 'Logs', nav_providers: 'Providers',
    nav_agents: 'Agents', nav_channels: 'Channels', nav_tools: 'Tools',
    nav_skills: 'Skills & Plugins', nav_cron: 'Cron Jobs', nav_settings: 'Settings', nav_quickops: 'Quick Ops',
    nav_mcp: 'MCP Servers', nav_sandbox: 'Sandbox', nav_memory: 'Memory', nav_hooks: 'Hooks', nav_webui: 'Open WebUI',
    gw_online: 'Gateway Online', gw_offline: 'Gateway Offline', gw_checking: 'Checking...',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add',
    confirm: 'Confirm', test: 'Test', enable: 'Enable', disable: 'Disable',
    saving: 'Saving...', loading: 'Loading...', testing: 'Testing...',
    save_ok: 'Saved', save_fail: 'Save failed', delete_ok: 'Deleted',
    op_ok: 'Success', op_fail: 'Failed',
    required_field: 'This field is required',
    restart_confirm_title: 'Confirm Gateway Restart',
    restart_confirm_msg: 'Modifying gateway or plugins config requires a Gateway restart (~5s downtime). Continue?',
    restart_ok: 'Restart command sent',
    page_overview: 'Overview', page_logs: 'Logs', page_providers: 'Providers',
    page_agents: 'Agents', page_channels: 'Channels', page_tools: 'Tools',
    page_skills: 'Skills & Plugins', page_cron: 'Cron Jobs', page_settings: 'Settings', page_quickops: 'Quick Ops',
    page_mcp: 'MCP Servers', page_sandbox: 'Sandbox', page_memory: 'Memory System', page_hooks: 'Hooks Config',
    cpu: 'CPU Usage', mem: 'Memory', disk: 'Disk', uptime: 'OpenClaw Uptime',
    gateway: 'Gateway', online: 'Online', offline: 'Offline',
    agent_matrix: 'Agent Matrix', agent_status: 'Status', active_sessions: 'Sessions',
    working: 'Working', idle: 'Idle',
    provider_name: 'Provider ID', provider_baseurl: 'Base URL', provider_apikey: 'API Key',
    provider_auth: 'Auth Mode', provider_models: 'Models (JSON)',
    add_provider: 'Add Provider', preset_providers: 'Presets', custom_provider: 'Custom',
    test_conn: 'Test', conn_ok: 'Connected', conn_fail: 'Failed',
    agent_id: 'Agent ID', agent_name: 'Display Name', agent_workspace: 'Workspace',
    agent_model: 'Primary Model', agent_skills: 'Skills',
    agent_defaults: 'Defaults', agent_list: 'Agent List',
    add_agent: 'Add Agent', agent_id_hint: 'Lowercase letters and hyphens, e.g. coding-bot',
    channel_enabled: 'Enabled', channel_disabled: 'Disabled',
    channel_token: 'Bot Token', channel_dm_policy: 'DM Policy',
    channel_allow_from: 'Allow From (comma-separated IDs)',
    channel_advanced: 'Advanced Config (JSON)',
    tools_media: 'Media Tools', tools_exec: 'Exec Tools',
    tools_image: 'Image Understanding', tools_audio: 'Audio Transcription', tools_video: 'Video Understanding',
    skills_bundled: 'Built-in Skills', plugins_title: 'Plugins',
    cron_add: 'Add Job', cron_id: 'Job ID', cron_name: 'Job Name',
    cron_schedule: 'Schedule', cron_payload: 'Payload',
    cron_type_at: 'At Time', cron_type_every: 'Every N ms', cron_type_cron: 'Cron Expr',
    cron_payload_system: 'System Event', cron_payload_agent: 'Agent Message',
    cron_enabled: 'Enabled', cron_disabled: 'Disabled',
    settings_gateway: 'Gateway Settings', settings_session: 'Session Policy',
    settings_restart_warn: 'Modifying Gateway config will trigger a restart',
    gw_port: 'Port', gw_auth: 'Auth Mode',
    session_scope: 'Session Scope', session_dm_scope: 'DM Scope',
    doctor_run: 'Run Doctor', doctor_running: 'Running...',
    logs_select_agent: 'Select Agent', logs_connecting: 'Connecting to log stream...',
    no_data: 'No data',
  },
};

// ─────────────────────────────────────────────
// 全局状态
// ─────────────────────────────────────────────
let lang = localStorage.getItem('panel_lang') || 'zh';
let theme = localStorage.getItem('panel_theme') || 'light';
let currentPage = '';
let cachedConfig = null;
let healthTimer = null;
let logEventSource = null;

function t(key) { return (I18N[lang] && I18N[lang][key]) || I18N.zh[key] || key; }

// ─────────────────────────────────────────────
// 主题
// ─────────────────────────────────────────────
function applyTheme() {
  document.body.classList.toggle('dark', theme === 'dark');
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = theme === 'dark'
    ? '<svg width="15" height="15"><use href="#ico-sun"/></svg>'
    : '<svg width="15" height="15"><use href="#ico-moon"/></svg>';
}

document.getElementById('themeBtn').addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('panel_theme', theme);
  applyTheme();
});

// ─────────────────────────────────────────────
// 语言切换
// ─────────────────────────────────────────────
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) el.textContent = val;
  });
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = lang === 'zh' ? 'EN' : '中文';
}

document.getElementById('langBtn').addEventListener('click', () => {
  lang = lang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('panel_lang', lang);
  applyI18n();
  navigate(currentPage); // 重渲染当前页
});

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3000) {
  const icons = {
    success: '<svg width="14" height="14" style="color:var(--green)"><use href="#ico-check"/></svg>',
    error:   '<svg width="14" height="14" style="color:var(--red)"><use href="#ico-x"/></svg>',
    info:    '<svg width="14" height="14" style="color:var(--brand)"><use href="#ico-info"/></svg>',
    warn:    '<svg width="14" height="14" style="color:var(--yellow)"><use href="#ico-warning"/></svg>',
  };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${esc(msg)}</span>`;
  const container = document.getElementById('toastContainer');
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, duration);
}

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────
function openModal(html, onClose) {
  const container = document.getElementById('modalContainer');
  container.innerHTML = `<div class="modal-overlay" id="modalOverlay">${html}</div>`;
  const overlay = document.getElementById('modalOverlay');
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  if (onClose) overlay._onClose = onClose;
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    if (overlay._onClose) overlay._onClose();
    overlay.remove();
  }
}

// 确认对话框
function confirmDialog(title, msg, onConfirm, danger = false) {
  const iconHtml = danger
    ? '<svg width="20" height="20"><use href="#ico-warning"/></svg>'
    : '<svg width="20" height="20"><use href="#ico-info"/></svg>';
  openModal(`
    <div class="confirm-dialog">
      <div class="confirm-icon-wrap ${danger ? 'danger' : 'info'}">${iconHtml}</div>
      <div class="confirm-title">${esc(title)}</div>
      <div class="confirm-msg">${esc(msg)}</div>
      <div class="confirm-actions">
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmOkBtn">${t('confirm')}</button>
        <button class="btn" onclick="closeModal()">${t('cancel')}</button>
      </div>
    </div>
  `);
  document.getElementById('confirmOkBtn').addEventListener('click', () => { closeModal(); onConfirm(); });
}

// ─────────────────────────────────────────────
// API 工具
// ─────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const d = await res.json(); msg = d.error || msg; } catch {}
    throw new Error(msg);
  }
  if (res.headers.get('content-type')?.includes('application/json')) return res.json();
  return res.text();
}

async function getConfig() {
  if (!cachedConfig) cachedConfig = await api('GET', '/api/config');
  return cachedConfig || {};
}

function invalidateConfig() { cachedConfig = null; }

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatBytes(b) {
  if (b == null) return '--';
  if (b < 1024) return b + ' B';
  if (b < 1024 ** 2) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1024 ** 3) return (b / 1024 ** 2).toFixed(1) + ' MB';
  return (b / 1024 ** 3).toFixed(1) + ' GB';
}

function formatUptime(s) {
  if (s == null) return '--';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}天 ${h}时`;
  if (h > 0) return `${h}时 ${m}分`;
  return `${m}分`;
}

function isRedacted(val) {
  return typeof val === 'string' && val === '__OPENCLAW_REDACTED__';
}

// Secret 字段渲染：已设置的显示徽章，未设置的显示输入框
function secretInput(id, val, placeholder = '') {
  if (val && typeof val === 'object' && isRedacted(val.id)) {
    return `
      <div class="secret-field" id="${id}_wrap">
        <div class="secret-badge" onclick="revealSecret('${id}')"><svg width="13" height="13" style="flex-shrink:0"><use href="#ico-lock"/></svg> 已设置 · 点击修改</div>
        <input type="password" id="${id}" class="form-input" style="display:none" placeholder="${esc(placeholder)}" data-original-secret="true" />
      </div>`;
  }
  return `<input type="password" id="${id}" class="form-input" value="${esc(typeof val === 'string' ? val : '')}" placeholder="${esc(placeholder)}" />`;
}

function revealSecret(id) {
  const wrap = document.getElementById(id + '_wrap');
  if (!wrap) return;
  const badge = wrap.querySelector('.secret-badge');
  const input = document.getElementById(id);
  if (badge) badge.style.display = 'none';
  if (input) { input.style.display = 'block'; input.focus(); }
}

// 从供应商配置聚合模型列表（用于 Agent 模型下拉框）
async function getModelOptions() {
  try {
    const providers = await api('GET', '/api/providers');
    const options = [''];
    for (const [pid, prov] of Object.entries(providers || {})) {
      if (prov && Array.isArray(prov.models)) {
        for (const m of prov.models) {
          if (m && m.id) options.push(`${pid}/${m.id}`);
        }
      }
    }
    return options;
  } catch { return ['']; }
}

// ─────────────────────────────────────────────
// 路由
// ─────────────────────────────────────────────
const PAGE_TITLES = {
  overview: 'page_overview', logs: 'page_logs', providers: 'page_providers',
  agents: 'page_agents', channels: 'page_channels', tools: 'page_tools',
  skills: 'page_skills', cron: 'page_cron', settings: 'page_settings',
  quickops: 'page_quickops', mcp: 'page_mcp', sandbox: 'page_sandbox',
  memory: 'page_memory', hooks: 'page_hooks',
};

const PAGES = {};

function registerPages() {
  PAGES.overview = renderOverview;
  PAGES.logs = renderLogs;
  PAGES.providers = renderProviders;
  PAGES.agents = renderAgents;
  PAGES.channels = renderChannels;
  PAGES.tools = renderTools;
  PAGES.skills = renderSkills;
  PAGES.cron = renderCron;
  PAGES.settings = renderSettings;
  PAGES.quickops = renderQuickOps;
  PAGES.mcp = renderMcp;
  PAGES.sandbox = renderSandbox;
  PAGES.memory = renderMemory;
  PAGES.hooks = renderHooksPage;
}

async function navigate(page) {
  if (!page || !PAGES[page]) page = 'overview';

  // 停止日志流（如果切换离开日志页）
  if (page !== 'logs' && logEventSource) {
    logEventSource.close();
    logEventSource = null;
  }

  currentPage = page;

  // 更新侧边栏高亮
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // 更新页面标题
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = t(PAGE_TITLES[page] || page);

  // 渲染内容
  const content = document.getElementById('content');
  content.innerHTML = `<div class="empty-state"><div class="spinner"></div><div class="empty-title">${t('loading')}</div></div>`;

  try {
    await PAGES[page](content);
  } catch (e) {
    content.innerHTML = `<div class="empty-state"><svg class="empty-icon"><use href="#ico-warning"/></svg><div class="empty-title">加载失败</div><div class="empty-desc">${esc(e.message)}</div></div>`;
  }
}

// 监听 hash 变化
window.addEventListener('hashchange', () => {
  const page = location.hash.slice(1) || 'overview';
  navigate(page);
});

// 侧边栏点击
document.querySelectorAll('.nav-item[data-page]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const page = el.dataset.page;
    location.hash = page;
  });
});

// ─────────────────────────────────────────────
// Gateway 状态轮询
// ─────────────────────────────────────────────
let _gwPort = null;

async function pollHealth() {
  try {
    const data = await api('GET', '/api/sys-health');
    const dot = document.getElementById('gwDot');
    const status = document.getElementById('gwStatus');
    if (dot && status) {
      if (data && data.gateway && data.gateway.alive) {
        dot.className = 'status-dot dot-online';
        _gwPort = data.gateway.port || 18789;
        status.textContent = t('gw_online') + ' · ' + _gwPort;
      } else {
        dot.className = 'status-dot dot-offline';
        status.textContent = t('gw_offline');
        _gwPort = null;
      }
    }
    // 如果在概览页，刷新数据
    if (currentPage === 'overview') {
      updateOverviewStats(data);
    }
  } catch {}
}

// 打开 OpenClaw 内置 WebUI（自动带 token 免登录）
async function openWebUI() {
  const port = _gwPort || 18789;
  let url = `http://localhost:${port}`;
  try {
    const data = await api('GET', '/api/gateway-token');
    if (data && data.token) {
      url += `#token=${encodeURIComponent(data.token)}`;
    }
  } catch {}
  window.open(url, '_blank');
}


// ─────────────────────────────────────────────
// 初始化 (由最后加载的 script 调用)
// ─────────────────────────────────────────────
function init() {
  registerPages();
  applyTheme();
  applyI18n();
  const initPage = location.hash.slice(1) || 'overview';
  navigate(initPage);
  pollHealth();
  healthTimer = setInterval(pollHealth, 10000);
}
