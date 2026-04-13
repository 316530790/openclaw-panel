'use strict';
// ─────────────────────────────────────────────
// 页面：Agent 矩阵
// ─────────────────────────────────────────────

// Agent 头像颜色方案（参考 control-center 的 avatar catalog）
const AGENT_AVATARS = [
  { keywords: ['main', 'lion'], emoji: '🦁', accent: '#ff9966', bg: 'linear-gradient(135deg,#ff996620,#ff660015)' },
  { keywords: ['coder', 'dev', 'code'], emoji: '🦊', accent: '#ffb16e', bg: 'linear-gradient(135deg,#ffb16e20,#ff8c0015)' },
  { keywords: ['planner', 'plan'], emoji: '🦉', accent: '#c6b7ff', bg: 'linear-gradient(135deg,#c6b7ff20,#9b87ff15)' },
  { keywords: ['review', 'test'], emoji: '🐼', accent: '#9df2ff', bg: 'linear-gradient(135deg,#9df2ff20,#5ee6ff15)' },
  { keywords: ['manager', 'admin'], emoji: '🐯', accent: '#ff8a7d', bg: 'linear-gradient(135deg,#ff8a7d20,#ff5c5015)' },
  { keywords: ['writer', 'doc'], emoji: '🐬', accent: '#73d4ff', bg: 'linear-gradient(135deg,#73d4ff20,#3ab8ff15)' },
  { keywords: ['monkey'], emoji: '🐒', accent: '#f4c542', bg: 'linear-gradient(135deg,#f4c54220,#e6b00015)' },
];
const AGENT_AVATAR_FALLBACK = { emoji: '🤖', accent: '#8aa7ff', bg: 'linear-gradient(135deg,#8aa7ff20,#5c7eff15)' };

function getAgentAvatar(id) {
  const lower = (id || '').toLowerCase();
  for (const entry of AGENT_AVATARS) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry;
  }
  // 稳定哈希选颜色
  let hash = 0;
  for (let i = 0; i < lower.length; i++) hash = (hash * 33 + lower.charCodeAt(i)) >>> 0;
  return AGENT_AVATARS[hash % AGENT_AVATARS.length] || AGENT_AVATAR_FALLBACK;
}

let agentTab = 'list';

async function renderAgents(container) {
  let agentsData = { defaults: {}, list: [] };
  try { agentsData = await api('GET', '/api/agents') || { defaults: {}, list: [] }; } catch {}

  let sessionsData = [];
  try { sessionsData = await api('GET', '/api/sessions') || []; } catch {}

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-agents"/></svg>${t('page_agents')}</div>
        <div class="tabs" style="margin:0">
          <button class="tab ${agentTab==='list'?'active':''}" onclick="switchAgentTab('list')">${t('agent_list')}</button>
          <button class="tab ${agentTab==='defaults'?'active':''}" onclick="switchAgentTab('defaults')">${t('agent_defaults')}</button>
        </div>
      </div>
      <div id="agentTabContent" class="card-body" style="padding:0"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <svg class="card-title-icon" width="18" height="18"><use href="#ico-logs"/></svg>
          会话记录
        </div>
        <span style="font-size:12px;color:var(--text-muted)">${sessionsData.length} 个会话</span>
      </div>
      <div class="card-body" style="padding:0">
        <div id="agentSessionList"></div>
      </div>
    </div>`;

  window._agentsData = agentsData;
  renderAgentTab();
  renderAgentSessions(sessionsData);
}

function switchAgentTab(tab) {
  agentTab = tab;
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((el, i) => el.classList.toggle('active', (tab === 'list' && i === 0) || (tab === 'defaults' && i === 1)));
  renderAgentTab();
}

function renderAgentTab() {
  const el = document.getElementById('agentTabContent');
  if (!el) return;
  const data = window._agentsData || { defaults: {}, list: [] };
  if (agentTab === 'list') {
    el.style.padding = '0';
    el.innerHTML = renderAgentCards(data.list || [], data.defaults || {});
  } else {
    el.style.padding = '20px';
    el.innerHTML = renderAgentDefaults(data.defaults || {});
  }
}

function renderAgentCards(list, defaults) {
  if (!list.length) {
    return `<div class="empty-state" style="padding:48px 20px">
      <svg class="empty-icon"><use href="#ico-agents"/></svg>
      <div class="empty-title">${t('no_data')}</div>
      <div class="empty-desc">暂未发现任何 Agent</div>
    </div>`;
  }

  // Inject agent card styles once via ensureStyle (dedup)
  ensureStyle('agent-card-css', `.agent-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:20px}.agent-card{border:1px solid var(--border);border-radius:12px;padding:20px;cursor:pointer;transition:all .2s ease;position:relative}.agent-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08);border-color:var(--border-brand)}.agent-card-header{display:flex;align-items:center;gap:14px;margin-bottom:16px}.agent-avatar{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;position:relative;flex-shrink:0}.agent-avatar-emoji{line-height:1}.agent-status-dot{position:absolute;bottom:-2px;right:-2px;font-size:10px;line-height:1}.agent-card-meta{min-width:0}.agent-card-name{font-weight:600;font-size:15px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.agent-card-id{font-size:12px;color:var(--text-muted);margin-top:2px}.agent-card-body{display:flex;flex-direction:column;gap:8px}.agent-card-row{display:flex;align-items:center;justify-content:space-between;gap:8px}.agent-card-label{font-size:12px;color:var(--text-muted);flex-shrink:0}.agent-card-footer{margin-top:16px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}.agent-status-badge{font-size:12px;font-weight:500;padding:3px 10px;border-radius:20px}.agent-status--working{background:var(--green);color:#fff}.agent-status--idle{background:var(--bg-secondary);color:var(--text-muted)}`);

  const html = `<div class="agent-grid">${list.map(a => {
    const avatar = getAgentAvatar(a.id);
    const statusClass = a._status === 'working' ? 'agent-status--working' : 'agent-status--idle';
    const statusText = a._status === 'working' ? '运行中' : '空闲';
    const statusDot = a._status === 'working' ? '🟢' : '⚪';

    const modelShort = resolveModelShort(a, defaults);

    // 最后活跃时间
    const lastActivity = a._lastActivity ? timeAgo(a._lastActivity) : null;

    // 供应商
    const providers = a._providers && a._providers.length ? a._providers : [];

    return `
    <div class="agent-card" style="background:${avatar.bg};border-color:${avatar.accent}30" onclick="showAgentDetail('${esc(a.id)}')">
      <div class="agent-card-header">
        <div class="agent-avatar" style="background:${avatar.accent}25;color:${avatar.accent};border:2px solid ${avatar.accent}40">
          <span class="agent-avatar-emoji">${avatar.emoji}</span>
          <span class="agent-status-dot ${statusClass}" title="${statusText}">${statusDot}</span>
        </div>
        <div class="agent-card-meta">
          <div class="agent-card-name">${esc(a.name || a.id)}</div>
          <div class="agent-card-id mono">${esc(a.id)}</div>
        </div>
      </div>

      <div class="agent-card-body">
        ${modelShort ? `<div class="agent-card-row"><span class="agent-card-label">模型</span><span class="badge badge-blue mono" style="font-size:11px">${esc(modelShort)}</span></div>` : ''}
        ${providers.length ? `<div class="agent-card-row"><span class="agent-card-label">供应商</span><span class="mono" style="font-size:11.5px;color:var(--text-muted)">${providers.map(p => esc(p)).join(', ')}</span></div>` : ''}
        <div class="agent-card-row"><span class="agent-card-label">会话</span><span class="mono" style="font-size:12px">${a._sessionCount || 0} 个</span></div>
        ${a._lastChannel ? `<div class="agent-card-row"><span class="agent-card-label">渠道</span><span class="badge" style="font-size:11px">${esc(a._lastChannel)}</span></div>` : ''}
        ${lastActivity ? `<div class="agent-card-row"><span class="agent-card-label">最近活跃</span><span style="font-size:12px;color:var(--text-muted)">${lastActivity}</span></div>` : ''}
      </div>

      <div class="agent-card-footer">
        <span class="agent-status-badge ${statusClass}">${statusText}</span>
        ${a._source === 'disk' ? '<span class="badge" style="font-size:10px">本地</span>' : ''}
      </div>
    </div>`;
  }).join('')}</div>`;

  return html;
}

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  if (diff < 0) return '刚刚';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(isoStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function showAgentDetail(id) {
  const data = window._agentsData || { list: [], defaults: {} };
  const agent = data.list.find(a => a.id === id);
  if (!agent) return;
  const avatar = getAgentAvatar(agent.id);
  const model = resolveModelName(agent, data.defaults) || '--';
  const providers = agent._providers && agent._providers.length ? agent._providers.join(', ') : '--';

  openModal(`
    <div class="modal modal-lg">
      <div class="modal-header">
        <div class="modal-title" style="display:flex;align-items:center;gap:12px">
          <span style="font-size:28px">${avatar.emoji}</span>
          <div>
            <div>${esc(agent.name || agent.id)}</div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:400" class="mono">${esc(agent.id)}</div>
          </div>
        </div>
        <button class="modal-close" onclick="closeModal()" title="关闭"><svg width="16" height="16"><use href="#ico-x"/></svg></button>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
          <div class="agent-detail-stat">
            <div class="agent-detail-stat-label">状态</div>
            <div class="agent-detail-stat-value"><span class="agent-status-badge ${agent._status === 'working' ? 'agent-status--working' : 'agent-status--idle'}">${agent._status === 'working' ? '运行中' : '空闲'}</span></div>
          </div>
          <div class="agent-detail-stat">
            <div class="agent-detail-stat-label">会话数</div>
            <div class="agent-detail-stat-value" style="font-size:24px;font-weight:700">${agent._sessionCount || 0}</div>
          </div>
          <div class="agent-detail-stat">
            <div class="agent-detail-stat-label">模型</div>
            <div class="agent-detail-stat-value mono" style="font-size:13px">${esc(model)}</div>
          </div>
          <div class="agent-detail-stat">
            <div class="agent-detail-stat-label">供应商</div>
            <div class="agent-detail-stat-value mono" style="font-size:13px">${esc(providers)}</div>
          </div>
          ${agent._lastChannel ? `
          <div class="agent-detail-stat">
            <div class="agent-detail-stat-label">最近渠道</div>
            <div class="agent-detail-stat-value">${esc(agent._lastChannel)}</div>
          </div>` : ''}
          ${agent._lastActivity ? `
          <div class="agent-detail-stat">
            <div class="agent-detail-stat-label">最近活跃</div>
            <div class="agent-detail-stat-value">${timeAgo(agent._lastActivity)}</div>
          </div>` : ''}
        </div>
        ${agent._session ? `
        <div style="padding:12px 16px;background:var(--bg-secondary);border-radius:8px;margin-bottom:16px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">当前/最近会话 ID</div>
          <div class="mono" style="font-size:12px;word-break:break-all">${esc(agent._session)}</div>
        </div>` : ''}
      </div>
    </div>
    <style>
      .agent-detail-stat {
        padding: 14px 16px;
        background: var(--bg-secondary);
        border-radius: 10px;
      }
      .agent-detail-stat-label {
        font-size: 12px;
        color: var(--text-muted);
        margin-bottom: 6px;
      }
      .agent-detail-stat-value {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
      }
    </style>`);
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
      <div class="modal-header"><div class="modal-title">新增 Agent</div><button class="modal-close" onclick="closeModal()" title="关闭"><svg width="16" height="16"><use href="#ico-x"/></svg></button></div>
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
      <div class="modal-header"><div class="modal-title">编辑 Agent: ${esc(id)}</div><button class="modal-close" onclick="closeModal()" title="关闭"><svg width="16" height="16"><use href="#ico-x"/></svg></button></div>
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

function renderAgentSessions(sessions) {
  const el = document.getElementById('agentSessionList');
  if (!el) return;
  if (!sessions || !sessions.length) {
    el.innerHTML = `<div class="empty-state" style="padding:32px">
      <svg class="empty-icon"><use href="#ico-logs"/></svg>
      <div class="empty-title">${t('no_data')}</div>
      <div class="empty-desc">暂无会话记录</div>
    </div>`;
    return;
  }
  ensureStyle('agent-card-styles', `.data-table { width: 100%; border-collapse: collapse; } .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border); }`);
  el.innerHTML = `<table class="data-table">
    <thead><tr><th>Agent</th><th>Session ID</th><th>状态</th><th>最近活动</th><th>大小</th></tr></thead>
    <tbody>${sessions.slice(0, 20).map(s => `
      <tr style="cursor:pointer" onclick="openSessionViewer('${esc(s.sessionId)}')">
        <td><span style="font-weight:500">${esc(s.agentName || s.agentId || '--')}</span></td>
        <td class="mono" style="font-size:12px;color:var(--brand)">${esc(s.sessionId?.slice(0, 24) || '--')}…</td>
        <td><span class="badge ${s.active ? 'badge-brand' : 'badge-gray'}">${s.active ? '运行中' : '空闲'}</span></td>
        <td style="color:var(--text-secondary);font-size:13px">${s.lastActivity ? timeAgo(s.lastActivity) : '--'}</td>
        <td style="color:var(--text-muted);font-size:13px">${typeof formatBytes === 'function' ? formatBytes(s.sizeBytes) : (s.sizeBytes || '--')}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

// ─────────────────────────────────────────────
// 会话对话查看器 Modal
// ─────────────────────────────────────────────
async function openSessionViewer(sessionKey) {
  // 创建模态层
  let overlay = document.getElementById('session-viewer-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'session-viewer-overlay';
  overlay.innerHTML = `
    <style>
      #session-viewer-overlay {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        animation: svFadeIn 0.2s ease;
      }
      @keyframes svFadeIn { from { opacity: 0 } to { opacity: 1 } }
      .sv-dialog {
        width: min(92vw, 860px); max-height: 88vh;
        background: var(--surface); border-radius: 16px;
        box-shadow: 0 24px 64px rgba(0,0,0,0.25);
        display: flex; flex-direction: column; overflow: hidden;
        animation: svSlide 0.25s ease;
      }
      @keyframes svSlide { from { transform: translateY(24px); opacity: 0 } }
      .sv-header {
        padding: 16px 20px; border-bottom: 1px solid var(--border);
        display: flex; align-items: center; gap: 12px; flex-shrink: 0;
      }
      .sv-header-info { flex: 1; min-width: 0; }
      .sv-header-title { font-weight: 600; font-size: 15px; color: var(--text); }
      .sv-header-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; display: flex; gap: 12px; flex-wrap: wrap; }
      .sv-header-meta span { display: inline-flex; align-items: center; gap: 4px; }
      .sv-close { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; color: var(--text-secondary); }
      .sv-close:hover { background: var(--hover-bg); }
      .sv-search {
        padding: 8px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0;
      }
      .sv-search input {
        width: 100%; padding: 7px 12px; border: 1px solid var(--border);
        border-radius: 8px; font-size: 13px; background: var(--bg);
        color: var(--text); outline: none;
      }
      .sv-search input:focus { border-color: var(--brand); }
      .sv-body {
        flex: 1; overflow-y: auto; padding: 16px 20px;
        display: flex; flex-direction: column; gap: 8px;
      }
      .sv-msg { max-width: 88%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.6; word-break: break-word; }
      .sv-msg--user { align-self: flex-end; background: var(--brand); color: #fff; border-bottom-right-radius: 4px; }
      .sv-msg--assistant { align-self: flex-start; background: var(--surface-raised, #f5f5f5); color: var(--text); border-bottom-left-radius: 4px; border: 1px solid var(--border); }
      .sv-msg--tool { align-self: center; background: #f0f4ff; color: #555; font-size: 12px; border-radius: 8px; max-width: 94%; font-family: var(--font-mono, monospace); border: 1px dashed #c8d6e5; }
      .sv-msg--system { align-self: center; color: var(--text-muted); font-size: 11px; font-style: italic; }
      .sv-msg pre { margin: 6px 0 0; padding: 8px; background: rgba(0,0,0,0.06); border-radius: 6px; font-size: 12px; overflow-x: auto; white-space: pre-wrap; }
      .sv-msg--user pre { background: rgba(255,255,255,0.15); }
      .sv-tool-tag { display: inline-block; padding: 2px 8px; background: #e8f0fe; color: #1a56db; border-radius: 4px; font-size: 11px; font-weight: 500; margin-bottom: 4px; }
      .sv-stats { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; gap: 16px; font-size: 12px; color: var(--text-muted); flex-shrink: 0; flex-wrap: wrap; }
      .sv-stats span { display: inline-flex; align-items: center; gap: 4px; }
      .sv-loading { text-align: center; padding: 48px; color: var(--text-muted); }
      .sv-highlight { background: #ffeb3b; color: #000; border-radius: 2px; padding: 0 2px; }
    </style>
    <div class="sv-dialog">
      <div class="sv-header">
        <div class="sv-header-info">
          <div class="sv-header-title">📝 会话详情</div>
          <div class="sv-header-meta" id="sv-meta"><span>加载中...</span></div>
        </div>
        <button class="sv-close" onclick="closeSessionViewer()" title="关闭">
          <svg width="20" height="20"><use href="#ico-x"/></svg>
        </button>
      </div>
      <div class="sv-search">
        <input type="text" id="sv-search-input" placeholder="搜索消息内容..." oninput="filterSessionMessages(this.value)" />
      </div>
      <div class="sv-body" id="sv-messages">
        <div class="sv-loading">⏳ 加载会话消息中...</div>
      </div>
      <div class="sv-stats" id="sv-stats"></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeSessionViewer(); });
  document.addEventListener('keydown', _svEscHandler);

  // 请求数据
  try {
    const data = await api('GET', `/api/sessions/${encodeURIComponent(sessionKey)}/messages`);
    window._svMessages = data.messages || [];
    window._svData = data;
    renderSessionViewerContent(data);
  } catch (e) {
    const el = document.getElementById('sv-messages');
    if (el) el.innerHTML = `<div class="sv-loading" style="color:#e74c3c">❌ 加载失败: ${esc(e.message)}</div>`;
  }
}

function _svEscHandler(e) {
  if (e.key === 'Escape') closeSessionViewer();
}

function closeSessionViewer() {
  const overlay = document.getElementById('session-viewer-overlay');
  if (overlay) overlay.remove();
  document.removeEventListener('keydown', _svEscHandler);
  window._svMessages = null;
  window._svData = null;
}

function renderSessionViewerContent(data) {
  // 头部信息
  const metaEl = document.getElementById('sv-meta');
  if (metaEl) {
    metaEl.innerHTML = `
      <span>🤖 ${esc(data.agentId || '--')}</span>
      <span>🧠 ${esc(data.model || '--')}</span>
      <span>💬 ${data.messageCount || 0} 条消息</span>
      <span>📄 ${typeof formatBytes === 'function' ? formatBytes(data.sizeBytes) : data.sizeBytes}</span>
    `;
  }

  // 消息列表
  const bodyEl = document.getElementById('sv-messages');
  if (bodyEl) {
    if (!data.messages || !data.messages.length) {
      bodyEl.innerHTML = `<div class="sv-loading">📭 此会话暂无可显示的消息</div>`;
    } else {
      bodyEl.innerHTML = data.messages.map(m => renderSvMessage(m)).join('');
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }
  }

  // 底部统计
  const statsEl = document.getElementById('sv-stats');
  if (statsEl && data.usage) {
    const u = data.usage;
    statsEl.innerHTML = `
      <span>📥 输入: ${formatTokens(u.inputTokens)}</span>
      <span>📤 输出: ${formatTokens(u.outputTokens)}</span>
      <span>📊 合计: ${formatTokens(u.totalTokens)}</span>
      <span>💰 估算: $${estimateCostUnified(u.inputTokens, u.outputTokens, data.model)}</span>
    `;
  }
}

function renderSvMessage(msg) {
  const role = (msg.role || '').toLowerCase();

  if (role === 'user') {
    return `<div class="sv-msg sv-msg--user">${formatMsgContent(msg.content)}</div>`;
  }
  if (role === 'tool') {
    const toolLabel = msg.toolName ? `<div class="sv-tool-tag">🔧 ${esc(msg.toolName)}</div>` : '';
    const content = msg.content ? `<pre>${esc(msg.content.slice(0, 500))}${msg.content.length > 500 ? '...' : ''}</pre>` : '';
    return `<div class="sv-msg sv-msg--tool">${toolLabel}${content}</div>`;
  }
  if (role === 'assistant') {
    let toolHtml = '';
    if (msg.toolCalls && msg.toolCalls.length) {
      toolHtml = msg.toolCalls.map(tc =>
        `<div class="sv-tool-tag">🔧 ${esc(tc.name)}</div>`
      ).join('');
    }
    return `<div class="sv-msg sv-msg--assistant">${toolHtml}${formatMsgContent(msg.content)}</div>`;
  }
  if (role === 'system') {
    return `<div class="sv-msg sv-msg--system">⚙️ ${esc((msg.content || '').slice(0, 200))}</div>`;
  }
  return `<div class="sv-msg sv-msg--assistant">${formatMsgContent(msg.content)}</div>`;
}

function formatMsgContent(content) {
  if (!content) return '<em style="opacity:0.5">(空)</em>';
  // 简单 markdown 渲染
  let html = esc(content);
  // code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
  // inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>');
  // bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // newlines
  html = html.replace(/\n/g, '<br>');
  return html;
}

function filterSessionMessages(query) {
  const messages = window._svMessages;
  if (!messages) return;
  const bodyEl = document.getElementById('sv-messages');
  if (!bodyEl) return;

  if (!query.trim()) {
    bodyEl.innerHTML = messages.map(m => renderSvMessage(m)).join('');
    return;
  }

  const q = query.toLowerCase();
  const filtered = messages.filter(m =>
    (m.content || '').toLowerCase().includes(q) ||
    (m.toolName || '').toLowerCase().includes(q) ||
    (m.toolCalls || []).some(tc => tc.name.toLowerCase().includes(q))
  );
  bodyEl.innerHTML = filtered.length
    ? filtered.map(m => renderSvMessage(m)).join('')
    : `<div class="sv-loading">🔍 未找到匹配消息</div>`;
}

function formatTokens(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// estimateCost is now provided by estimateCostUnified in app.js
