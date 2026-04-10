'use strict';
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

