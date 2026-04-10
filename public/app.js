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
        <button class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmOkBtn">${t('confirm')}</button>
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
  quickops: 'page_quickops',
};

const PAGES = {
  overview: renderOverview,
  logs: renderLogs,
  providers: renderProviders,
  agents: renderAgents,
  channels: renderChannels,
  tools: renderTools,
  skills: renderSkills,
  cron: renderCron,
  settings: renderSettings,
  quickops: renderQuickOps,
};

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
async function pollHealth() {
  try {
    const data = await api('GET', '/api/sys-health');
    const dot = document.getElementById('gwDot');
    const status = document.getElementById('gwStatus');
    if (dot && status) {
      if (data && data.gateway && data.gateway.alive) {
        dot.className = 'status-dot online';
        status.textContent = t('gw_online') + ' :' + (data.gateway.port || '');
      } else {
        dot.className = 'status-dot offline';
        status.textContent = t('gw_offline');
      }
    }
    // 如果在概览页，刷新数据
    if (currentPage === 'overview') {
      updateOverviewStats(data);
    }
  } catch {}
}

// ─────────────────────────────────────────────
// 页面：概览
// ─────────────────────────────────────────────
async function renderOverview(container) {
  const statMeta = [
    { key:'cpu',    icon:'#ico-cpu',    fill:'fill-brand' },
    { key:'mem',    icon:'#ico-memory', fill:'fill-green' },
    { key:'disk',   icon:'#ico-disk',   fill:'fill-blue'  },
    { key:'uptime', icon:'#ico-timer',  fill:'fill-yellow'},
  ];

  container.innerHTML = `
    <div class="stats-grid" id="statsGrid">
      ${statMeta.map(s => `
        <div class="stat-card" id="stat_${s.key}">
          <div class="stat-label">
            <svg width="13" height="13"><use href="${s.icon}"/></svg>
            ${t(s.key)}
          </div>
          <div class="stat-value">--</div>
          <div class="stat-sub"></div>
          <div class="progress-track"><div class="progress-fill ${s.fill}" style="width:0%"></div></div>
        </div>`).join('')}
    </div>

    <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <div class="card-title">
            <svg class="card-title-icon" width="18" height="18"><use href="#ico-agents"/></svg>
            ${t('agent_matrix')}
          </div>
          <a href="#quickops" onclick="navigate('quickops')" class="btn btn-sm btn-ghost" style="font-size:12px">
            快捷操作 →
          </a>
        </div>
        <div class="card-body">
          <div id="agentGrid" class="agent-grid">
            <div class="empty-state"><div class="spinner"></div></div>
          </div>
        </div>
      </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <svg class="card-title-icon" width="18" height="18"><use href="#ico-logs"/></svg>
          ${t('active_sessions')}
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div id="sessionList"></div>
      </div>
    </div>`;

  // 拉取数据
  const [health, agents, sessions] = await Promise.allSettled([
    api('GET', '/api/sys-health'),
    api('GET', '/api/agents'),
    api('GET', '/api/sessions'),
  ]);

  if (health.status === 'fulfilled') updateOverviewStats(health.value);
  if (agents.status === 'fulfilled') renderAgentMatrix(agents.value);
  if (sessions.status === 'fulfilled') renderSessionList(sessions.value);
}

function updateOverviewStats(data) {
  if (!data) return;

  function updateCard(id, value, sub, pct, isText = false) {
    const card = document.getElementById('stat_' + id);
    if (!card) return;
    const valEl = card.querySelector('.stat-value');
    valEl.textContent = value;
    valEl.classList.toggle('stat-value-text', isText);
    const subEl = card.querySelector('.stat-sub');
    if (subEl) subEl.textContent = sub;
    const bar = card.querySelector('.progress-fill');
    if (bar && pct != null) bar.style.width = Math.min(pct, 100) + '%';
  }

  updateCard('cpu',    (data.cpu ?? '--') + '%', `${data.platform || ''} · ${data.cpu ?? '--'}% 利用率`, data.cpu);
  updateCard('mem',    data.memUsedPct + '%',
    `${formatBytes(data.memTotal - data.memFree)} / ${formatBytes(data.memTotal)}`,
    data.memUsedPct);
  if (data.disk) {
    updateCard('disk', data.disk.usedPct + '%',
      `${formatBytes(data.disk.total - data.disk.free)} / ${formatBytes(data.disk.total)}`,
      data.disk.usedPct);
  }
  const ocUp = data.openclawUptime;
  updateCard('uptime',
    ocUp != null ? formatUptime(ocUp) : 'OpenClaw 未运行',
    ocUp != null ? 'OpenClaw 进程运行时长' : '未检测到 OpenClaw，点击左侧快捷启动',
    null,
    ocUp == null /* isText */);

  // 快捷操作区域 Gateway 状态
  const gwInfo = document.getElementById('quickGwInfo');
  if (gwInfo && data.gateway) {
    gwInfo.innerHTML = data.gateway.alive
      ? `<span style="color:var(--green)">● 在线</span> · 端口 ${data.gateway.port}`
      : `<span style="color:var(--red)">● 离线</span> · 端口 ${data.gateway.port}`;
  }
}

// ─────────────────────────────────────────────
// 快捷操作（Dashboard 集成）
// ─────────────────────────────────────────────
async function quickRestart() {
  confirmDialog('重启 Gateway', 'Gateway 将重启约 5 秒，期间连接中断。确认？', async () => {
    try { await api('POST', '/api/cmd/restart'); toast('重启命令已发送', 'info'); }
    catch (e) { toast('操作失败: ' + e.message, 'error'); }
  });
}

async function quickStart() {
  try { await api('POST', '/api/cmd/restart'); toast('启动命令已发送', 'success'); }
  catch (e) { toast('操作失败: ' + e.message, 'error'); }
}

async function quickDoctor() {
  toast('诊断中，请稍候...', 'info', 2000);
  try {
    const res = await api('POST', '/api/cmd/doctor');
    toast(res.ok ? '诊断完成，系统正常' : '诊断完成，请查看设置页', res.ok ? 'success' : 'warn', 4000);
  } catch (e) { toast('诊断失败: ' + e.message, 'error'); }
}

async function quickUpdate() {
  toast('正在检查更新...', 'info', 2000);
  try {
    await api('POST', '/api/cmd/restart'); // 通过 openclaw doctor 检查
    toast('已触发更新检查，请查看 Gateway 日志', 'info', 4000);
  } catch (e) { toast('操作失败: ' + e.message, 'error'); }
}

function renderAgentMatrix(agents) {
  const grid = document.getElementById('agentGrid');
  if (!grid) return;
  const list = (agents && agents.list) || [];
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><svg class="empty-icon"><use href="#ico-agents"/></svg><div class="empty-title">${t('no_data')}</div></div>`;
    return;
  }
  grid.innerHTML = list.map(a => {
    const status = a._status || 'idle';
    const model = typeof a.model === 'object' ? (a.model.primary || '') : (a.model || '');
    const initials = (a.name || a.id || 'A').slice(0, 2).toUpperCase();
    return `
      <div class="agent-card">
        <div class="agent-card-top">
          <div class="agent-avatar" title="${esc(a.id)}">${initials}</div>
          <div class="agent-info">
            <div class="agent-name">${esc(a.name || a.id)}</div>
            <div class="agent-model">${esc(model || '--')}</div>
          </div>
          <span class="status-dot ${status === 'working' ? 'dot-working' : 'dot-online'}"></span>
        </div>
        <div style="font-size:11.5px;color:var(--text-muted)">${a._session ? esc(a._session.slice(0,28)) : '无活跃会话'}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px">
          <span class="badge ${status === 'working' ? 'badge-brand' : 'badge-green'}">${status === 'working' ? t('working') : t('idle')}</span>
          ${a._lastActivity ? `<span style="font-size:11px;color:var(--text-muted)">${new Date(a._lastActivity).toLocaleTimeString()}</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

function renderSessionList(sessions) {
  const el = document.getElementById('sessionList');
  if (!el) return;
  if (!sessions || !sessions.length) {
    el.innerHTML = `<div class="empty-state">
      <svg class="empty-icon"><use href="#ico-logs"/></svg>
      <div class="empty-title">${t('no_data')}</div>
    </div>`;
    return;
  }
  el.innerHTML = `<table class="data-table">
    <thead><tr><th>Agent</th><th>Session ID</th><th>状态</th><th>最近活动</th><th>大小</th></tr></thead>
    <tbody>${sessions.slice(0, 10).map(s => `
      <tr>
        <td><span style="font-weight:500">${esc(s.agentName || s.agentId)}</span></td>
        <td class="mono">${esc(s.sessionId?.slice(0, 24) || '--')}</td>
        <td><span class="badge ${s.active ? 'badge-brand' : 'badge-gray'}">${s.active ? t('working') : t('idle')}</span></td>
        <td style="color:var(--text-secondary)">${s.lastActivity ? new Date(s.lastActivity).toLocaleString() : '--'}</td>
        <td style="color:var(--text-muted)">${formatBytes(s.sizeBytes)}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

// ─────────────────────────────────────────────
// 页面：供应商
// ─────────────────────────────────────────────

// 预设供应商配置
const PROVIDER_PRESETS = {
  anthropic: {
    name: 'Anthropic', icon: 'AN', color: '#D97757',
    baseUrl: 'https://api.anthropic.com/v1',
    auth: 'api-key',
    apiKeyHeader: 'x-api-key',
    models: [
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', reasoning: true, input: ['text','image'], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 200000, maxTokens: 32000 },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', reasoning: false, input: ['text','image'], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 200000, maxTokens: 16000 },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', reasoning: false, input: ['text','image'], cost: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 }, contextWindow: 200000, maxTokens: 8192 },
    ],
  },
  openai: {
    name: 'OpenAI', icon: 'OA', color: '#10A37F',
    baseUrl: 'https://api.openai.com/v1',
    auth: 'api-key',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', reasoning: false, input: ['text','image'], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 16384 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', reasoning: false, input: ['text','image'], cost: { input: 0.15, output: 0.6, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 16384 },
      { id: 'o1', name: 'O1', reasoning: true, input: ['text'], cost: { input: 15, output: 60, cacheRead: 7.5, cacheWrite: 0 }, contextWindow: 200000, maxTokens: 100000 },
    ],
  },
  google: {
    name: 'Google Gemini', icon: 'GG', color: '#4285F4',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    auth: 'api-key',
    api: 'google-generative-ai',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', reasoning: false, input: ['text','image'], cost: { input: 0.1, output: 0.4, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 8192 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', reasoning: true, input: ['text','image'], cost: { input: 1.25, output: 10, cacheRead: 0.31, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 },
    ],
  },
  ollama: {
    name: 'Ollama (本地)', icon: 'OL', color: '#333333',
    baseUrl: 'http://localhost:11434/v1',
    auth: 'api-key',
    api: 'ollama',
    models: [
      { id: 'llama3.2', name: 'Llama 3.2', reasoning: false, input: ['text'], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 4096 },
    ],
  },
  openrouter: {
    name: 'OpenRouter', icon: 'OR', color: '#6366F1',
    baseUrl: 'https://openrouter.ai/api/v1',
    auth: 'api-key',
    models: [],
  },
};

async function renderProviders(container) {
  let providers = {};
  try { providers = await api('GET', '/api/providers') || {}; } catch {}

  container.innerHTML = `
    <div class="card" style="margin-bottom:24px">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-providers"/></svg>${t('preset_providers')}</div>
      </div>
      <div class="card-body">
        <div class="preset-grid">
          ${Object.entries(PROVIDER_PRESETS).map(([id, p]) => {
            const configured = Object.keys(providers).includes(id);
            return `
            <div class="preset-card" onclick="addPresetProvider('${id}')" style="${configured ? 'border-color:var(--border-brand)' : ''}">
              <div class="preset-icon" style="background:${p.color}20;color:${p.color};font-size:13px;font-weight:700;letter-spacing:0.02em;border-radius:8px">${p.icon}</div>
              <div class="preset-name">${p.name}</div>
              <div class="preset-sub" style="color:${configured ? 'var(--green)' : 'var(--text-muted)'}">${configured ? '✓ 已配置' : '点击配置'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-logs"/></svg>已配置供应商</div>
        <button class="btn btn-primary btn-sm" onclick="openAddProviderModal()">+ ${t('add_provider')}</button>
      </div>
      <div id="providerTable" class="card-body">
        ${renderProviderTable(providers)}
      </div>
    </div>`;
}

function renderProviderTable(providers) {
  const entries = Object.entries(providers || {});
  if (!entries.length) return `<div class="empty-state"><svg class="empty-icon"><use href="#ico-providers"/></svg><div class="empty-title">${t('no_data')}</div><div class="empty-desc">点击上方预设或"新增供应商"按钮添加</div></div>`;
  return `<table class="data-table">
    <thead><tr><th>ID</th><th>Base URL</th><th>模型数</th><th>操作</th></tr></thead>
    <tbody>${entries.map(([id, prov]) => `
      <tr>
        <td class="mono">${esc(id)}</td>
        <td class="mono" style="max-width:260px;overflow:hidden;text-overflow:ellipsis">${esc(prov.baseUrl || '--')}</td>
        <td><span class="badge badge-blue">${Array.isArray(prov.models) ? prov.models.length : 0} 个</span></td>
        <td>
          <button class="btn btn-sm" onclick="openEditProviderModal('${esc(id)}')"><svg width="13" height="13" style="flex-shrink:0"><use href="#ico-edit"/></svg></button>
          <button class="btn btn-sm" onclick="testProvider('${esc(id)}', this)"><svg width="13" height="13" style="flex-shrink:0"><use href="#ico-zap"/></svg></button>
          <button class="btn btn-sm btn-danger" onclick="deleteProvider('${esc(id)}')"><svg width="13" height="13" style="flex-shrink:0"><use href="#ico-trash"/></svg></button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function providerFormHtml(id, prov) {
  prov = prov || {};
  const modelsJson = JSON.stringify(prov.models || [], null, 2);
  return `
    <div class="form-group">
      <label class="form-label">${t('provider_name')} <span class="required">*</span></label>
      <input type="text" id="prov_id" class="form-input mono" value="${esc(id || '')}" placeholder="anthropic" ${id ? 'readonly' : ''} />
      ${!id ? '<div class="form-hint">建议小写字母、数字、连字符</div>' : ''}
    </div>
    <div class="form-group">
      <label class="form-label">${t('provider_baseurl')} <span class="required">*</span></label>
      <input type="url" id="prov_baseUrl" class="form-input mono" value="${esc(prov.baseUrl || '')}" placeholder="https://api.openai.com/v1" />
    </div>
    <div class="form-group">
      <label class="form-label">${t('provider_apikey')}</label>
      ${secretInput('prov_apiKey', prov.apiKey, 'sk-...')}
    </div>
    <div class="form-group">
      <label class="form-label">${t('provider_auth')}</label>
      <select id="prov_auth" class="form-select">
        ${['api-key','aws-sdk','oauth','token'].map(v => `<option value="${v}" ${(prov.auth||'api-key')===v?'selected':''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">${t('provider_models')}</label>
      <textarea id="prov_models" class="form-textarea mono" rows="8" placeholder='[]'>${esc(modelsJson)}</textarea>
      <div class="form-hint">JSON 数组，每个模型需要: id, name, reasoning, input, cost, contextWindow, maxTokens</div>
    </div>`;
}

function openAddProviderModal() {
  openModal(`
    <div class="modal">
      <div class="modal-header"><div class="modal-title">新增供应商</div><button class="modal-close" onclick="closeModal()"><svg width="12" height="12"><use href="#ico-x"/></svg></button></div>
      <div class="modal-body">${providerFormHtml('', null)}</div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn btn-primary" onclick="saveProvider(null)">${t('save')}</button>
      </div>
    </div>`);
}

async function openEditProviderModal(id) {
  let prov = {};
  try {
    const providers = await api('GET', '/api/providers');
    prov = (providers && providers[id]) || {};
  } catch {}
  openModal(`
    <div class="modal modal-lg">
      <div class="modal-header"><div class="modal-title">编辑供应商: ${esc(id)}</div><button class="modal-close" onclick="closeModal()"><svg width="12" height="12"><use href="#ico-x"/></svg></button></div>
      <div class="modal-body">${providerFormHtml(id, prov)}</div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn btn-primary" onclick="saveProvider('${esc(id)}')">${t('save')}</button>
      </div>
    </div>`);
}

async function addPresetProvider(presetId) {
  const preset = PROVIDER_PRESETS[presetId];
  if (!preset) return;
  // 检查是否已存在
  try {
    const providers = await api('GET', '/api/providers');
    if (providers && providers[presetId]) {
      openEditProviderModal(presetId);
      return;
    }
  } catch {}
  // 直接用预设填充表单
  const provConfig = { baseUrl: preset.baseUrl, auth: preset.auth || 'api-key', models: preset.models };
  if (preset.api) provConfig.api = preset.api;
  openModal(`
    <div class="modal modal-lg">
      <div class="modal-header"><div class="modal-title">添加 ${preset.name}</div><button class="modal-close" onclick="closeModal()"><svg width="12" height="12"><use href="#ico-x"/></svg></button></div>
      <div class="modal-body">${providerFormHtml(presetId, provConfig)}</div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn btn-primary" onclick="saveProvider(null)">${t('save')}</button>
      </div>
    </div>`);
}

async function saveProvider(existingId) {
  const id = existingId || (document.getElementById('prov_id')?.value || '').trim();
  if (!id) { toast(t('required_field') + ': ID', 'error'); return; }
  const baseUrl = document.getElementById('prov_baseUrl')?.value?.trim() || '';
  if (!baseUrl) { toast(t('required_field') + ': Base URL', 'error'); return; }

  const apiKeyEl = document.getElementById('prov_apiKey');
  let apiKey;
  if (apiKeyEl && apiKeyEl.dataset.originalSecret) {
    apiKey = { source: 'env', id: '__OPENCLAW_REDACTED__' }; // 保留原值
  } else if (apiKeyEl && apiKeyEl.value) {
    apiKey = apiKeyEl.value;
  }

  let models = [];
  const modelsEl = document.getElementById('prov_models');
  if (modelsEl && modelsEl.value.trim()) {
    try { models = JSON.parse(modelsEl.value); }
    catch { toast('模型列表 JSON 格式错误', 'error'); return; }
  }

  const config = { baseUrl, auth: document.getElementById('prov_auth')?.value || 'api-key', models };
  if (apiKey !== undefined) config.apiKey = apiKey;

  try {
    if (existingId) {
      await api('PUT', `/api/providers/${encodeURIComponent(existingId)}`, config);
    } else {
      await api('POST', '/api/providers', { id, config });
    }
    invalidateConfig();
    toast(t('save_ok'), 'success');
    closeModal();
    navigate('providers');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function deleteProvider(id) {
  confirmDialog('删除供应商', `确认删除供应商 "${id}"？`, async () => {
    try {
      await api('DELETE', `/api/providers/${encodeURIComponent(id)}`);
      invalidateConfig();
      toast(t('delete_ok'), 'success');
      navigate('providers');
    } catch (e) { toast(t('op_fail') + ': ' + e.message, 'error'); }
  }, true);
}

async function testProvider(id, btn) {
  const orig = btn.textContent;
  btn.textContent = t('testing');
  btn.disabled = true;
  try {
    const res = await api('POST', `/api/providers/${encodeURIComponent(id)}/test`);
    if (res && res.ok) toast(`${id}: ${t('conn_ok')} (HTTP ${res.status})`, 'success');
    else toast(`${id}: ${t('conn_fail')} - ${res.error || ''}`, 'error');
  } catch (e) { toast(`${t('conn_fail')}: ${e.message}`, 'error'); }
  finally { btn.textContent = orig; btn.disabled = false; }
}

// ─────────────────────────────────────────────
// 页面：Agent
// ─────────────────────────────────────────────
let agentTab = 'list';

async function renderAgents(container) {
  let agentsData = { defaults: {}, list: [] };
  try { agentsData = await api('GET', '/api/agents') || { defaults: {}, list: [] }; } catch {}

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-agents"/></svg>${t('page_agents')}</div>
        <button class="btn btn-primary btn-sm" onclick="openAddAgentModal()">${t('add_agent')}</button>
      </div>
      <div class="card-body">
        <div class="tabs">
          <button class="tab ${agentTab==='list'?'active':''}" onclick="switchAgentTab('list')">${t('agent_list')}</button>
          <button class="tab ${agentTab==='defaults'?'active':''}" onclick="switchAgentTab('defaults')">${t('agent_defaults')}</button>
        </div>
        <div id="agentTabContent"></div>
      </div>
    </div>`;

  window._agentsData = agentsData;
  renderAgentTab();
}

function switchAgentTab(tab) {
  agentTab = tab;
  document.querySelectorAll('.tab').forEach(el => el.classList.toggle('active', el.textContent.includes(tab === 'list' ? t('agent_list').slice(0,2) : t('agent_defaults').slice(0,2))));
  // 用按钮 index 更简单
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((el, i) => el.classList.toggle('active', (tab === 'list' && i === 0) || (tab === 'defaults' && i === 1)));
  renderAgentTab();
}

function renderAgentTab() {
  const el = document.getElementById('agentTabContent');
  if (!el) return;
  const data = window._agentsData || { defaults: {}, list: [] };
  if (agentTab === 'list') {
    el.innerHTML = renderAgentList(data.list || []);
  } else {
    el.innerHTML = renderAgentDefaults(data.defaults || {});
  }
}

function renderAgentList(list) {
  if (!list.length) return `<div class="empty-state"><svg class="empty-icon"><use href="#ico-agents"/></svg><div class="empty-title">${t('no_data')}</div><div class="empty-desc">点击右上角"新增 Agent"</div></div>`;
  return `<table class="data-table">
    <thead><tr><th>ID</th><th>名称</th><th>模型</th><th>状态</th><th>操作</th></tr></thead>
    <tbody>${list.map(a => {
      const model = typeof a.model === 'object' ? (a.model.primary || '--') : (a.model || '--');
      return `<tr>
        <td class="mono">${esc(a.id)}</td>
        <td>${esc(a.name || a.id)}</td>
        <td class="mono" style="font-size:0.8rem">${esc(model)}</td>
        <td><span class="badge ${a._status==='working'?'badge-blue':'badge-green'}">${a._status==='working'?t('working'):t('idle')}</span></td>
        <td>
          <button class="btn btn-sm" onclick="openEditAgentModal('${esc(a.id)}')"><svg width="13" height="13" style="flex-shrink:0"><use href="#ico-edit"/></svg></button>
          <button class="btn btn-sm btn-danger" onclick="deleteAgent('${esc(a.id)}')"><svg width="13" height="13" style="flex-shrink:0"><use href="#ico-trash"/></svg></button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

function renderAgentDefaults(defaults) {
  const model = typeof defaults.model === 'object' ? (defaults.model.primary || '') : (defaults.model || '');
  const fallbacks = typeof defaults.model === 'object' ? (defaults.model.fallbacks || []).join(', ') : '';
  const workspace = defaults.workspace || '';
  const skills = (defaults.skills || []).join(', ');
  return `
    <div class="form-group">
      <label class="form-label">主模型</label>
      <input type="text" id="def_model" class="form-input mono" value="${esc(model)}" placeholder="anthropic/claude-sonnet-4-5" />
    </div>
    <div class="form-group">
      <label class="form-label">备用模型 (逗号分隔)</label>
      <input type="text" id="def_fallbacks" class="form-input mono" value="${esc(fallbacks)}" placeholder="openai/gpt-4o" />
    </div>
    <div class="form-group">
      <label class="form-label">工作目录</label>
      <input type="text" id="def_workspace" class="form-input mono" value="${esc(workspace)}" placeholder="~/.openclaw/workspace" />
    </div>
    <div class="form-group">
      <label class="form-label">默认技能 (逗号分隔)</label>
      <input type="text" id="def_skills" class="form-input" value="${esc(skills)}" placeholder="memory, web_search" />
    </div>
    <div style="margin-top:16px">
      <button class="btn btn-primary" onclick="saveAgentDefaults()">${t('save')}</button>
    </div>`;
}

async function saveAgentDefaults() {
  const primary = document.getElementById('def_model')?.value?.trim();
  const fallbacksRaw = document.getElementById('def_fallbacks')?.value?.trim();
  const workspace = document.getElementById('def_workspace')?.value?.trim();
  const skillsRaw = document.getElementById('def_skills')?.value?.trim();

  const defaults = {};
  if (primary) {
    const fallbacks = fallbacksRaw ? fallbacksRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
    defaults.model = fallbacks.length ? { primary, fallbacks } : primary;
  }
  if (workspace) defaults.workspace = workspace;
  if (skillsRaw) defaults.skills = skillsRaw.split(',').map(s=>s.trim()).filter(Boolean);

  try {
    await api('POST', '/api/config/patch', { path: ['agents', 'defaults'], value: defaults });
    invalidateConfig();
    toast(t('save_ok'), 'success');
    navigate('agents');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function openAddAgentModal() {
  const modelOpts = await getModelOptions();
  openModal(`
    <div class="modal">
      <div class="modal-header"><div class="modal-title">新增 Agent</div><button class="modal-close" onclick="closeModal()"><svg width="12" height="12"><use href="#ico-x"/></svg></button></div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">${t('agent_id')} <span class="required">*</span></label>
          <input type="text" id="ag_id" class="form-input mono" placeholder="coding-bot" />
          <div class="form-hint">${t('agent_id_hint')}</div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('agent_name')}</label>
          <input type="text" id="ag_name" class="form-input" placeholder="代码助手" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('agent_model')}</label>
          <select id="ag_model" class="form-select">
            ${modelOpts.map(m => `<option value="${esc(m)}">${esc(m || '(继承默认)')}</option>`).join('')}
          </select>
          <div class="form-hint">留空则继承 defaults.model</div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('agent_workspace')}</label>
          <input type="text" id="ag_workspace" class="form-input mono" placeholder="~/.openclaw/workspace" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('agent_skills')} (逗号分隔)</label>
          <input type="text" id="ag_skills" class="form-input" placeholder="memory, web_search" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn btn-primary" onclick="saveAgent(null)">${t('save')}</button>
      </div>
    </div>`);
}

async function openEditAgentModal(id) {
  const data = window._agentsData || { list: [] };
  const agent = data.list.find(a => a.id === id) || {};
  const modelOpts = await getModelOptions();
  const currentModel = typeof agent.model === 'object' ? (agent.model.primary || '') : (agent.model || '');
  openModal(`
    <div class="modal">
      <div class="modal-header"><div class="modal-title">编辑 Agent: ${esc(id)}</div><button class="modal-close" onclick="closeModal()"><svg width="12" height="12"><use href="#ico-x"/></svg></button></div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">${t('agent_name')}</label>
          <input type="text" id="ag_name" class="form-input" value="${esc(agent.name || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('agent_model')}</label>
          <select id="ag_model" class="form-select">
            ${modelOpts.map(m => `<option value="${esc(m)}" ${m===currentModel?'selected':''}>${esc(m || '(继承默认)')}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('agent_workspace')}</label>
          <input type="text" id="ag_workspace" class="form-input mono" value="${esc(agent.workspace || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('agent_skills')} (逗号分隔)</label>
          <input type="text" id="ag_skills" class="form-input" value="${esc((agent.skills||[]).join(', '))}" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn btn-primary" onclick="saveAgent('${esc(id)}')">${t('save')}</button>
      </div>
    </div>`);
}

async function saveAgent(existingId) {
  const id = existingId || document.getElementById('ag_id')?.value?.trim();
  if (!id) { toast(t('required_field') + ': ID', 'error'); return; }
  const name = document.getElementById('ag_name')?.value?.trim();
  const model = document.getElementById('ag_model')?.value?.trim();
  const workspace = document.getElementById('ag_workspace')?.value?.trim();
  const skillsRaw = document.getElementById('ag_skills')?.value?.trim();

  const body = { id };
  if (name) body.name = name;
  if (model) body.model = model;
  if (workspace) body.workspace = workspace;
  if (skillsRaw) body.skills = skillsRaw.split(',').map(s=>s.trim()).filter(Boolean);

  try {
    if (existingId) await api('PUT', `/api/agents/${encodeURIComponent(existingId)}`, body);
    else await api('POST', '/api/agents', body);
    invalidateConfig();
    toast(t('save_ok'), 'success');
    closeModal();
    navigate('agents');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function deleteAgent(id) {
  confirmDialog('删除 Agent', `确认删除 Agent "${id}"？此操作不可恢复。`, async () => {
    try {
      await api('DELETE', `/api/agents/${encodeURIComponent(id)}`);
      invalidateConfig();
      toast(t('delete_ok'), 'success');
      navigate('agents');
    } catch (e) { toast(t('op_fail') + ': ' + e.message, 'error'); }
  }, true);
}

// ─────────────────────────────────────────────
// 页面：渠道
// ─────────────────────────────────────────────
async function renderChannels(container) {
  let channels = {};
  try { channels = await api('GET', '/api/channels') || {}; } catch {}

  const channelNames = Object.keys(channels);
  const primary = ['telegram', 'discord', 'slack'];
  const others = channelNames.filter(n => !primary.includes(n));

  container.innerHTML = `
    <div class="card" style="margin-bottom:24px">
      <div class="card-header"><div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-channels"/></svg>主要渠道</div></div>
      <div class="card-body">
        ${primary.map(name => renderChannelCard(name, channels[name] || {})).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-channels"/></svg>其他渠道</div></div>
      <div class="card-body">
        ${others.map(name => renderOtherChannelCard(name, channels[name] || {})).join('')}
      </div>
    </div>`;
}

function renderChannelCard(name, cfg) {
  const enabled = cfg.enabled !== false;
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  return `
    <details style="margin-bottom:4px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden" ${enabled?'open':''}>
      <summary style="cursor:pointer;padding:12px 16px;font-size:13.5px;font-weight:600;display:flex;align-items:center;gap:10px;list-style:none;background:var(--bg-surface);user-select:none">
        <svg width="15" height="15" style="color:var(--brand);flex-shrink:0"><use href="#ico-channels"/></svg>
        <span style="flex:1">${label}</span>
        <span class="badge ${enabled?'badge-green':'badge-gray'}">${enabled?t('channel_enabled'):t('channel_disabled')}</span>
      </summary>
      <div style="padding:16px;border-top:1px solid var(--border);background:var(--bg-surface)">
        ${renderChannelForm(name, cfg)}
      </div>
    </details>`;
}

function renderChannelForm(name, cfg) {
  const dmPolicyOptions = ['pairing','allowlist','open','disabled'];
  const allowFrom = Array.isArray(cfg.allowFrom) ? cfg.allowFrom.join(', ') : (cfg.allowFrom || '');
  const advancedJson = JSON.stringify(cfg, null, 2);

  let tokenField = '';
  if (name === 'telegram') {
    tokenField = `<div class="form-group"><label class="form-label">${t('channel_token')}</label>${secretInput(`ch_${name}_token`, cfg.botToken, '1234:abcdef...')}</div>`;
  } else if (name === 'discord') {
    tokenField = `<div class="form-group"><label class="form-label">${t('channel_token')}</label>${secretInput(`ch_${name}_token`, cfg.token, 'MTAxNDg...')}</div>`;
  } else if (name === 'slack') {
    tokenField = `
      <div class="form-group"><label class="form-label">Bot Token</label>${secretInput(`ch_${name}_bot`, cfg.botToken, 'xoxb-...')}</div>
      <div class="form-group"><label class="form-label">App Token</label>${secretInput(`ch_${name}_app`, cfg.appToken, 'xapp-...')}</div>
      <div class="form-group"><label class="form-label">Signing Secret</label>${secretInput(`ch_${name}_signing`, cfg.signingSecret, '')}</div>`;
  }

  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">启用</label>
        <select id="ch_${name}_enabled" class="form-select">
          <option value="true" ${cfg.enabled!==false?'selected':''}>启用</option>
          <option value="false" ${cfg.enabled===false?'selected':''}>禁用</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${t('channel_dm_policy')}</label>
        <select id="ch_${name}_dmPolicy" class="form-select">
          ${dmPolicyOptions.map(v=>`<option value="${v}" ${(cfg.dmPolicy||'pairing')===v?'selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    ${tokenField}
    <div class="form-group">
      <label class="form-label">${t('channel_allow_from')}</label>
      <input type="text" id="ch_${name}_allowFrom" class="form-input" value="${esc(allowFrom)}" placeholder="123456, 789012" />
    </div>
    <details style="margin-top:12px">
      <summary style="cursor:pointer;font-size:0.82rem;color:var(--text-muted)">${t('channel_advanced')}</summary>
      <textarea id="ch_${name}_advanced" class="form-textarea mono" rows="8" style="margin-top:8px">${esc(advancedJson)}</textarea>
      <div class="form-hint">直接编辑完整配置 JSON（高级用法）</div>
    </details>
    <div style="margin-top:14px">
      <button class="btn btn-primary btn-sm" onclick="saveChannel('${name}')">${t('save')}</button>
    </div>`;
}

function renderOtherChannelCard(name, cfg) {
  const enabled = cfg.enabled !== false;
  return `
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-name">${name}</div>
        <div class="toggle-desc"><span class="badge ${enabled?'badge-green':'badge-gray'}">${enabled?t('channel_enabled'):t('channel_disabled')}</span></div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <label class="toggle">
          <input type="checkbox" ${enabled?'checked':''} onchange="toggleChannel('${esc(name)}', this.checked)" />
          <span class="toggle-track"></span>
        </label>
        <button class="btn btn-sm btn-icon" onclick="openChannelJsonEditor('${esc(name)}')" title="高级配置"><svg width="13" height="13" style="flex-shrink:0"><use href="#ico-settings"/></svg></button>
      </div>
    </div>`;
}

async function toggleChannel(name, enabled) {
  try {
    const channels = await api('GET', '/api/channels');
    const current = (channels && channels[name]) || {};
    await api('PUT', `/api/channels/${encodeURIComponent(name)}`, { ...current, enabled });
    invalidateConfig();
    toast(t('save_ok'), 'success');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function openChannelJsonEditor(name) {
  let channels = {};
  try { channels = await api('GET', '/api/channels'); } catch {}
  const cfg = channels[name] || {};
  openModal(`
    <div class="modal modal-lg">
      <div class="modal-header"><div class="modal-title">${name} 高级配置</div><button class="modal-close" onclick="closeModal()"><svg width="12" height="12"><use href="#ico-x"/></svg></button></div>
      <div class="modal-body">
        <textarea id="chJson_${name}" class="form-textarea mono" rows="16">${esc(JSON.stringify(cfg, null, 2))}</textarea>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn btn-primary" onclick="saveChannelJson('${esc(name)}')">${t('save')}</button>
      </div>
    </div>`);
}

async function saveChannelJson(name) {
  const el = document.getElementById('chJson_' + name);
  if (!el) return;
  let parsed;
  try { parsed = JSON.parse(el.value); } catch { toast('JSON 格式错误', 'error'); return; }
  try {
    await api('PUT', `/api/channels/${encodeURIComponent(name)}`, parsed);
    invalidateConfig();
    toast(t('save_ok'), 'success');
    closeModal();
    navigate('channels');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function saveChannel(name) {
  const enabledEl = document.getElementById(`ch_${name}_enabled`);
  const dmPolicyEl = document.getElementById(`ch_${name}_dmPolicy`);
  const allowFromEl = document.getElementById(`ch_${name}_allowFrom`);
  const advancedEl = document.getElementById(`ch_${name}_advanced`);

  // 先尝试从高级 JSON 编辑器读取
  let base = {};
  if (advancedEl && advancedEl.value.trim()) {
    try { base = JSON.parse(advancedEl.value); } catch { toast('高级配置 JSON 格式错误', 'error'); return; }
  }

  // 用基础字段覆盖
  if (enabledEl) base.enabled = enabledEl.value === 'true';
  if (dmPolicyEl && dmPolicyEl.value) base.dmPolicy = dmPolicyEl.value;
  if (allowFromEl) {
    const ids = allowFromEl.value.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length) base.allowFrom = ids;
  }

  // 处理 token 字段
  const tokenMap = { telegram: 'botToken', discord: 'token', slack: null };
  if (name === 'telegram' || name === 'discord') {
    const key = tokenMap[name];
    const tokenEl = document.getElementById(`ch_${name}_token`);
    if (tokenEl && tokenEl.value && !tokenEl.dataset.originalSecret) base[key] = tokenEl.value;
  } else if (name === 'slack') {
    const botEl = document.getElementById(`ch_slack_bot`);
    const appEl = document.getElementById(`ch_slack_app`);
    const sigEl = document.getElementById(`ch_slack_signing`);
    if (botEl && botEl.value && !botEl.dataset.originalSecret) base.botToken = botEl.value;
    if (appEl && appEl.value && !appEl.dataset.originalSecret) base.appToken = appEl.value;
    if (sigEl && sigEl.value && !sigEl.dataset.originalSecret) base.signingSecret = sigEl.value;
  }

  try {
    await api('PUT', `/api/channels/${encodeURIComponent(name)}`, base);
    invalidateConfig();
    toast(t('save_ok'), 'success');
    navigate('channels');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

// ─────────────────────────────────────────────
// 页面：工具
// ─────────────────────────────────────────────
async function renderTools(container) {
  let cfg = {};
  try { cfg = await getConfig(); } catch {}
  const tools = cfg.tools || {};
  const media = tools.media || {};

  container.innerHTML = `
    <div class="card" style="margin-bottom:24px">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-tools"/></svg>${t('tools_media')}</div>
      </div>
      <div class="card-body" id="toolsMediaBody">
        ${renderMediaTools(media)}
      </div>
    </div>`;
}

function renderMediaTools(media) {
  const mediaTypes = [
    { key: 'image', label: t('tools_image'), icon: 'IMG' },
    { key: 'audio', label: t('tools_audio'), icon: 'MIC' },
    { key: 'video', label: t('tools_video'), icon: 'VID' },
  ];
  return mediaTypes.map(mt => {
    const cfg = media[mt.key] || {};
    const enabled = cfg.enabled !== false;
    return `
      <div class="toggle-row">
        <div class="toggle-info">
          <div class="toggle-name">${mt.icon} ${mt.label}</div>
          <div class="toggle-desc">${Array.isArray(cfg.models) ? cfg.models.map(m=>`${m.provider}/${m.model}`).join(', ') : '--'}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${enabled?'checked':''} onchange="saveToolToggle('media.${mt.key}.enabled', this.checked)" />
          <span class="toggle-track"></span>
        </label>
      </div>`;
  }).join('');
}

async function saveToolToggle(dotPath, value) {
  const pathArr = ['tools', ...dotPath.split('.')];
  try {
    await api('POST', '/api/config/patch', { path: pathArr, value });
    invalidateConfig();
    toast(t('save_ok'), 'success');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

// ─────────────────────────────────────────────
// 页面：技能 & 插件
// ─────────────────────────────────────────────
async function renderSkills(container) {
  let skillsData = { entries: {}, allowBundled: [] };
  let pluginsData = { entries: {}, enabled: true };
  try {
    [skillsData, pluginsData] = await Promise.all([
      api('GET', '/api/skills'),
      api('GET', '/api/plugins'),
    ]);
  } catch {}

  container.innerHTML = `
    <div class="card" style="margin-bottom:24px">
      <div class="card-header"><div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-skills"/></svg>${t('skills_bundled')}</div></div>
      <div class="card-body">
        ${renderSkillsBody(skillsData)}
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-providers"/></svg>${t('plugins_title')}</div>
        <label class="toggle" title="全局启用/禁用插件系统">
          <input type="checkbox" ${pluginsData.enabled?'checked':''} onchange="togglePluginsGlobal(this.checked)" />
          <span class="toggle-track"></span>
        </label>
      </div>
      <div class="card-body">
        ${renderPluginsBody(pluginsData)}
      </div>
    </div>`;
}

function renderSkillsBody(data) {
  const entries = Object.entries(data.entries || {});
  if (!entries.length) return `<div class="empty-state"><svg class="empty-icon"><use href="#ico-skills"/></svg><div class="empty-title">${t('no_data')}</div></div>`;
  return entries.map(([id, cfg]) => `
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-name">${esc(id)}</div>
        <div class="toggle-desc">${cfg.config ? JSON.stringify(cfg.config).slice(0, 60) : ''}</div>
      </div>
      <label class="toggle">
        <input type="checkbox" ${cfg.enabled!==false?'checked':''} onchange="toggleSkill('${esc(id)}', this.checked)" />
        <span class="toggle-track"></span>
      </label>
    </div>`).join('');
}

function renderPluginsBody(data) {
  const entries = Object.entries(data.entries || {});
  if (!entries.length) return `<div class="empty-state"><svg class="empty-icon"><use href="#ico-providers"/></svg><div class="empty-title">${t('no_data')}</div></div>`;
  return entries.map(([id, cfg]) => `
    <div class="toggle-row">
      <div class="toggle-info">
        <div class="toggle-name">${esc(id)}</div>
        <div class="toggle-desc">${cfg.enabled !== false ? '已启用' : '已禁用'}</div>
      </div>
      <label class="toggle">
        <input type="checkbox" ${cfg.enabled!==false?'checked':''} onchange="togglePlugin('${esc(id)}', this.checked)" />
        <span class="toggle-track"></span>
      </label>
    </div>`).join('');
}

async function toggleSkill(id, enabled) {
  try {
    await api('POST', `/api/skills/${encodeURIComponent(id)}/toggle`, { enabled });
    invalidateConfig();
    toast(t('save_ok'), 'success');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function togglePlugin(id, enabled) {
  confirmDialog(
    enabled ? '启用插件' : '禁用插件',
    `${enabled ? '启用' : '禁用'}插件 "${id}" 需要重启 Gateway 生效。`,
    async () => {
      try {
        await api('POST', `/api/plugins/${encodeURIComponent(id)}/toggle`, { enabled });
        invalidateConfig();
        toast(t('save_ok'), 'success');
        navigate('skills');
      } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
    }
  );
}

async function togglePluginsGlobal(enabled) {
  try {
    await api('POST', '/api/config/patch', { path: ['plugins', 'enabled'], value: enabled });
    invalidateConfig();
    toast(t('save_ok'), 'success');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

// ─────────────────────────────────────────────
// 页面：Cron
// ─────────────────────────────────────────────
async function renderCron(container) {
  let jobs = [];
  try { jobs = await api('GET', '/api/cron') || []; } catch {}

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-cron"/></svg>${t('page_cron')}</div>
        <button class="btn btn-primary btn-sm" onclick="openAddCronModal()">${t('cron_add')}</button>
      </div>
      <div class="card-body">
        ${renderCronTable(jobs)}
      </div>
    </div>`;
}

function renderCronTable(jobs) {
  if (!jobs.length) return `<div class="empty-state"><div class="empty-icon">⏰</div><div class="empty-title">${t('no_data')}</div><div class="empty-desc">点击右上角新增定时任务</div></div>`;
  return `<table class="data-table">
    <thead><tr><th>ID</th><th>名称</th><th>调度</th><th>状态</th><th>上次运行</th><th>操作</th></tr></thead>
    <tbody>${jobs.map(j => {
      const sched = j.schedule ? (j.schedule.expr || j.schedule.kind + ':' + (j.schedule.everyMs||j.schedule.at||'')) : '--';
      const state = j.state || {};
      return `<tr>
        <td class="mono">${esc(j.id)}</td>
        <td>${esc(j.name)}</td>
        <td class="mono" style="font-size:0.78rem">${esc(sched)}</td>
        <td><span class="badge ${j.enabled?'badge-green':'badge-gray'}">${j.enabled?t('cron_enabled'):t('cron_disabled')}</span></td>
        <td style="font-size:0.78rem">${state.lastRunAtMs ? new Date(state.lastRunAtMs).toLocaleString() : '--'}</td>
        <td>
          <button class="btn btn-sm" onclick="toggleCronEnabled('${esc(j.id)}', ${!j.enabled})">${j.enabled?'暂停':'启用'}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCron('${esc(j.id)}')"><svg width="13" height="13" style="flex-shrink:0"><use href="#ico-trash"/></svg></button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

function openAddCronModal() {
  openModal(`
    <div class="modal modal-lg">
      <div class="modal-header"><div class="modal-title">新增定时任务</div><button class="modal-close" onclick="closeModal()"><svg width="12" height="12"><use href="#ico-x"/></svg></button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">${t('cron_id')} <span class="required">*</span></label>
            <input type="text" id="cron_id" class="form-input mono" placeholder="daily-summary" />
          </div>
          <div class="form-group">
            <label class="form-label">${t('cron_name')} <span class="required">*</span></label>
            <input type="text" id="cron_name" class="form-input" placeholder="每日摘要" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('cron_schedule')}</label>
          <div class="radio-group" id="schedKindGroup">
            <label class="radio-option"><input type="radio" name="schedKind" value="cron" checked onchange="updateCronScheduleForm()"> ${t('cron_type_cron')}</label>
            <label class="radio-option"><input type="radio" name="schedKind" value="every" onchange="updateCronScheduleForm()"> ${t('cron_type_every')}</label>
            <label class="radio-option"><input type="radio" name="schedKind" value="at" onchange="updateCronScheduleForm()"> ${t('cron_type_at')}</label>
          </div>
          <div id="schedSubForm" style="margin-top:10px">
            <input type="text" id="cron_expr" class="form-input mono" placeholder="0 9 * * *（每天9点）" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('cron_payload')}</label>
          <div class="radio-group">
            <label class="radio-option"><input type="radio" name="payloadKind" value="agentTurn" checked onchange="updateCronPayloadForm()"> ${t('cron_payload_agent')}</label>
            <label class="radio-option"><input type="radio" name="payloadKind" value="systemEvent" onchange="updateCronPayloadForm()"> ${t('cron_payload_system')}</label>
          </div>
          <div id="payloadSubForm" style="margin-top:10px">
            <textarea id="cron_message" class="form-textarea" placeholder="请你总结今日工作内容..." rows="3"></textarea>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Session 目标</label>
            <select id="cron_sessionTarget" class="form-select">
              <option value="main">main（主会话）</option>
              <option value="isolated">isolated（独立会话）</option>
              <option value="current">current（当前会话）</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <select id="cron_enabled" class="form-select">
              <option value="true">启用</option>
              <option value="false">禁用</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn btn-primary" onclick="saveCron()">${t('save')}</button>
      </div>
    </div>`);
}

function updateCronScheduleForm() {
  const kind = document.querySelector('input[name="schedKind"]:checked')?.value || 'cron';
  const sub = document.getElementById('schedSubForm');
  if (!sub) return;
  if (kind === 'cron') sub.innerHTML = `<input type="text" id="cron_expr" class="form-input mono" placeholder="0 9 * * *" />`;
  else if (kind === 'every') sub.innerHTML = `<input type="number" id="cron_everyMs" class="form-input" placeholder="3600000（1小时）" />`;
  else sub.innerHTML = `<input type="datetime-local" id="cron_at" class="form-input" />`;
}

function updateCronPayloadForm() {
  const kind = document.querySelector('input[name="payloadKind"]:checked')?.value || 'agentTurn';
  const sub = document.getElementById('payloadSubForm');
  if (!sub) return;
  if (kind === 'agentTurn') sub.innerHTML = `<textarea id="cron_message" class="form-textarea" placeholder="请你总结今日工作内容..." rows="3"></textarea>`;
  else sub.innerHTML = `<input type="text" id="cron_sysText" class="form-input" placeholder="heartbeat" />`;
}

async function saveCron() {
  const id = document.getElementById('cron_id')?.value?.trim();
  const name = document.getElementById('cron_name')?.value?.trim();
  if (!id || !name) { toast(t('required_field'), 'error'); return; }

  const kind = document.querySelector('input[name="schedKind"]:checked')?.value || 'cron';
  let schedule;
  if (kind === 'cron') schedule = { kind: 'cron', expr: document.getElementById('cron_expr')?.value || '' };
  else if (kind === 'every') schedule = { kind: 'every', everyMs: parseInt(document.getElementById('cron_everyMs')?.value || '0') };
  else schedule = { kind: 'at', at: document.getElementById('cron_at')?.value || '' };

  const payloadKind = document.querySelector('input[name="payloadKind"]:checked')?.value || 'agentTurn';
  let payload;
  if (payloadKind === 'agentTurn') payload = { kind: 'agentTurn', message: document.getElementById('cron_message')?.value || '' };
  else payload = { kind: 'systemEvent', text: document.getElementById('cron_sysText')?.value || '' };

  const body = {
    id, name,
    enabled: document.getElementById('cron_enabled')?.value !== 'false',
    schedule,
    sessionTarget: document.getElementById('cron_sessionTarget')?.value || 'main',
    wakeMode: 'next-heartbeat',
    payload,
  };

  try {
    await api('POST', '/api/cron', body);
    toast(t('save_ok'), 'success');
    closeModal();
    navigate('cron');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function toggleCronEnabled(id, enabled) {
  try {
    await api('PUT', `/api/cron/${encodeURIComponent(id)}`, { enabled });
    toast(t('save_ok'), 'success');
    navigate('cron');
  } catch (e) { toast(t('op_fail') + ': ' + e.message, 'error'); }
}

async function deleteCron(id) {
  confirmDialog('删除定时任务', `确认删除任务 "${id}"？`, async () => {
    try {
      await api('DELETE', `/api/cron/${encodeURIComponent(id)}`);
      toast(t('delete_ok'), 'success');
      navigate('cron');
    } catch (e) { toast(t('op_fail') + ': ' + e.message, 'error'); }
  }, true);
}

// ─────────────────────────────────────────────
// 页面：日志
// ─────────────────────────────────────────────
let logsAgentId = 'main';

async function renderLogs(container) {
  let agents = { list: [] };
  try { agents = await api('GET', '/api/agents') || { list: [] }; } catch {}
  const list = agents.list || [];

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-logs"/></svg>实时日志流</div>
        <div style="display:flex;gap:8px;align-items:center">
          <select id="logAgentSelect" class="form-select" style="width:auto;min-width:160px" onchange="switchLogAgent(this.value)">
            ${list.length ? list.map(a=>`<option value="${esc(a.id)}" ${a.id===logsAgentId?'selected':''}>${esc(a.name||a.id)}</option>`).join('')
              : '<option value="main">main</option>'}
          </select>
          <button class="btn btn-sm" onclick="clearLogDisplay()">清空</button>
        </div>
      </div>
      <div class="card-body" style="padding:14px">
        <div id="logStream" class="log-stream">${t('logs_connecting')}</div>
      </div>
    </div>`;

  startLogStream(logsAgentId);
}

function clearLogDisplay() {
  const el = document.getElementById('logStream');
  if (el) el.innerHTML = '';
}

function switchLogAgent(id) {
  logsAgentId = id;
  if (logEventSource) { logEventSource.close(); logEventSource = null; }
  startLogStream(id);
}

function startLogStream(agentId) {
  if (logEventSource) { logEventSource.close(); }
  const el = document.getElementById('logStream');
  if (!el) return;
  el.innerHTML = t('logs_connecting');

  logEventSource = new EventSource(`/api/logs/stream?agent=${encodeURIComponent(agentId)}`);

  logEventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === 'error') { appendLog(el, '[ERR] ' + (data.message || ''), 'role-error'); return; }
      if (data.type === 'line' && data.data) {
        const entry = data.data;
        const role = entry.role || entry.type || '';
        let text = '';
        if (entry.type === 'message' || entry.role) {
          const content = entry.content || (entry.message && entry.message.content);
          if (typeof content === 'string') text = content.slice(0, 200);
          else if (Array.isArray(content)) text = content.filter(c=>c.type==='text').map(c=>c.text).join(' ').slice(0,200);
        } else if (entry.type === 'toolResult') {
          text = `[工具: ${entry.toolName || '?'}]`;
        } else if (entry.type === 'model_change') {
          text = `[模型: ${entry.provider}/${entry.modelId}]`;
        } else {
          text = JSON.stringify(entry).slice(0, 120);
        }
        if (text) appendLog(el, text, 'role-' + (role === 'user' ? 'user' : role === 'assistant' ? 'assistant' : 'tool'));
      } else if (data.type === 'raw') {
        appendLog(el, data.text || '', '');
      }
    } catch {}
  };

  logEventSource.onerror = () => {
    if (el) appendLog(el, '[断开] 日志流连接断开，3秒后重连...', 'role-error');
    setTimeout(() => { if (currentPage === 'logs') startLogStream(agentId); }, 3000);
  };
}

function appendLog(el, text, cls) {
  if (!el) return;
  const line = document.createElement('div');
  line.className = 'log-line ' + (cls || '');
  line.textContent = text;
  el.appendChild(line);
  // 自动滚动到底部
  el.scrollTop = el.scrollHeight;
  // 最多保留 500 行
  while (el.children.length > 500) el.removeChild(el.firstChild);
}

// ─────────────────────────────────────────────
// 页面：设置
// ─────────────────────────────────────────────
async function renderSettings(container) {
  let cfg = {};
  try { cfg = await getConfig(); } catch {}
  const gw = cfg.gateway || {};
  const sess = cfg.session || {};

  container.innerHTML = `
    <div class="card" style="margin-bottom:24px">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-settings"/></svg>${t('settings_gateway')}</div>
      </div>
      <div class="card-body">
        <div class="form-hint" style="margin-bottom:16px;padding:10px 14px;background:rgba(245,158,11,0.1);border-radius:9px;border:1px solid rgba(245,158,11,0.2)">
          ${t('settings_restart_warn')}
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">${t('gw_port')}</label>
            <input type="number" id="gw_port" class="form-input" value="${esc(String(gw.port || 18789))}" min="1024" max="65535" />
          </div>
          <div class="form-group">
            <label class="form-label">${t('gw_auth')} (UI)</label>
            <select id="gw_authMode" class="form-select">
              ${['none','token','basic'].map(v=>`<option value="${v}" ${(gw.auth&&gw.auth.mode||'none')===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveGatewaySettings()">${t('save')}</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:24px">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-channels"/></svg>${t('settings_session')}</div>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">${t('session_scope')}</label>
            <select id="sess_scope" class="form-select">
              ${['per-sender','global'].map(v=>`<option value="${v}" ${(sess.scope||'per-sender')===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('session_dm_scope')}</label>
            <select id="sess_dmScope" class="form-select">
              ${['main','per-peer','per-channel-peer','per-account-channel-peer'].map(v=>`<option value="${v}" ${(sess.dmScope||'per-channel-peer')===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveSessionSettings()">${t('save')}</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-tools"/></svg>运维操作</div></div>
      <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn" onclick="doRestart()" id="restartBtn"><svg width="14" height="14" style="flex-shrink:0"><use href="#ico-refresh"/></svg> 重启 Gateway</button>
        <button class="btn" onclick="doDoctor()" id="doctorBtn"><svg width="14" height="14" style="flex-shrink:0"><use href="#ico-heart"/></svg> ${t('doctor_run')}</button>
      </div>
      <div id="doctorResult" style="padding:0 20px 16px;display:none">
        <pre style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:var(--text-secondary);white-space:pre-wrap"></pre>
      </div>
    </div>`;
}

async function saveGatewaySettings() {
  const port = parseInt(document.getElementById('gw_port')?.value || '18789');
  const authMode = document.getElementById('gw_authMode')?.value || 'none';
  confirmDialog(t('restart_confirm_title'), t('restart_confirm_msg'), async () => {
    try {
      await api('POST', '/api/config/patch', { path: ['gateway', 'port'], value: port });
      await api('POST', '/api/config/patch', { path: ['gateway', 'auth', 'mode'], value: authMode });
      invalidateConfig();
      toast(t('save_ok'), 'success');
    } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
  });
}

async function saveSessionSettings() {
  const scope = document.getElementById('sess_scope')?.value;
  const dmScope = document.getElementById('sess_dmScope')?.value;
  try {
    if (scope) await api('POST', '/api/config/patch', { path: ['session', 'scope'], value: scope });
    if (dmScope) await api('POST', '/api/config/patch', { path: ['session', 'dmScope'], value: dmScope });
    invalidateConfig();
    toast(t('save_ok'), 'success');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function doRestart() {
  confirmDialog(t('restart_confirm_title'), t('restart_confirm_msg'), async () => {
    const btn = document.getElementById('restartBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<svg width="14" height="14" style="flex-shrink:0"><use href="#ico-refresh"/></svg> 重启中...'; }
    try {
      await api('POST', '/api/cmd/restart');
      toast(t('restart_ok'), 'info');
    } catch (e) { toast(t('op_fail') + ': ' + e.message, 'error'); }
    finally { if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" style="flex-shrink:0"><use href="#ico-refresh"/></svg> 重启 Gateway'; } }
  });
}

async function doDoctor() {
  const btn = document.getElementById('doctorBtn');
  const resultDiv = document.getElementById('doctorResult');
  if (btn) { btn.disabled = true; btn.textContent = t('doctor_running'); }
  try {
    const res = await api('POST', '/api/cmd/doctor');
    const card = document.getElementById('doctorResultCard');
    const pre = document.getElementById('doctorOut');
    if (card && pre) {
      card.style.display = 'block';
      pre.textContent = res.result ? JSON.stringify(res.result, null, 2) : (res.error || '诊断完成，系统正常');
    }
    toast(t('op_ok'), 'success');
  } catch (e) {
    toast(t('op_fail') + ': ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" style="flex-shrink:0"><use href="#ico-heart"/></svg> ' + t('doctor_run'); }
  }
}


// ─────────────────────────────────────────────
// 页面：快捷操作
// ─────────────────────────────────────────────
async function renderQuickOps(container) {
  let health = {};
  try { health = await api('GET', '/api/sys-health') || {}; } catch {}
  const gw = health.gateway || {};
  const gwAlive = gw.alive;

  container.innerHTML = `
    <div class="card mb-4">
      <div class="card-body" style="padding:20px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:48px;height:48px;border-radius:var(--radius-md);background:${gwAlive ? 'var(--green-bg)' : 'var(--bg-subtle)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span class="status-dot ${gwAlive ? 'dot-online' : 'dot-offline'}" style="width:10px;height:10px"></span>
          </div>
          <div style="flex:1">
            <div style="font-size:15px;font-weight:650;margin-bottom:3px">${gwAlive ? 'Gateway 运行中' : 'Gateway 离线'}</div>
            <div style="font-size:12.5px;color:var(--text-muted)">
              ${gwAlive ? `端口 ${gw.port || 18789} · 可执行操作命令` : '请先启动 OpenClaw Gateway'}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
      <div class="card" style="cursor:pointer;transition:all 0.15s" onclick="quickRestart()" onmouseenter="this.style.borderColor='var(--brand-border)';this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.borderColor='';this.style.boxShadow=''">
        <div class="card-body" style="padding:20px">
          <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--brand-light);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
            <svg width="20" height="20" style="color:var(--brand)"><use href="#ico-refresh"/></svg>
          </div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">重启 Gateway</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.5">应用配置变更并重新加载</div>
        </div>
      </div>

      <div class="card" style="cursor:pointer;transition:all 0.15s" onclick="quickStart()" onmouseenter="this.style.borderColor='rgba(30,138,76,0.28)';this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.borderColor='';this.style.boxShadow=''">
        <div class="card-body" style="padding:20px">
          <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--green-bg);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
            <svg width="20" height="20" style="color:var(--green)"><use href="#ico-zap"/></svg>
          </div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">启动 Gateway</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.5">初次启动或重新开启服务</div>
        </div>
      </div>

      <div class="card" style="cursor:pointer;transition:all 0.15s" onclick="quickDoctor()" onmouseenter="this.style.borderColor='rgba(29,95,166,0.28)';this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.borderColor='';this.style.boxShadow=''">
        <div class="card-body" style="padding:20px">
          <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--blue-bg);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
            <svg width="20" height="20" style="color:var(--blue)"><use href="#ico-heart"/></svg>
          </div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">诊断修复</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.5">自动检查并修复常见问题</div>
        </div>
      </div>

      <div class="card" style="cursor:pointer;transition:all 0.15s" onclick="quickUpdate()" onmouseenter="this.style.borderColor='var(--border-strong)';this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.borderColor='';this.style.boxShadow=''">
        <div class="card-body" style="padding:20px">
          <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
            <svg width="20" height="20" style="color:var(--text-secondary)"><use href="#ico-overview"/></svg>
          </div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">检查更新</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.5">获取 OpenClaw 最新版本</div>
        </div>
      </div>
    </div>

    <div class="card" id="doctorResultCard" style="margin-top:16px;display:none">
      <div class="card-header"><div class="card-title">
        <svg class="card-title-icon" width="18" height="18"><use href="#ico-heart"/></svg>
        诊断结果
      </div></div>
      <div class="card-body">
        <pre id="doctorOut" style="font-family:'SF Mono','Fira Code',monospace;font-size:12px;color:var(--text-secondary);white-space:pre-wrap;line-height:1.6"></pre>
      </div>
    </div>`;
}
// ─────────────────────────────────────────────
// 初始化
// ─────────────────────────────────────────────
function init() {
  applyTheme();
  applyI18n();

  // 初始页面
  const initPage = location.hash.slice(1) || 'overview';
  navigate(initPage);

  // Gateway 状态轮询（每 10 秒）
  pollHealth();
  healthTimer = setInterval(pollHealth, 10000);
}

init();
