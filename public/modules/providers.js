'use strict';

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
    <thead><tr><th>ID</th><th>信息</th><th>认证</th><th>操作</th></tr></thead>
    <tbody>${entries.map(([id, prov]) => {
      const isAuthProfile = prov._source === 'auth.profiles';
      const info = isAuthProfile
        ? (prov.mode || '--')
        : (prov.baseUrl || '--');
      const authBadge = isAuthProfile
        ? `<span class="badge badge-green">${prov.mode || 'oauth'}</span>`
        : `<span class="badge badge-blue">${Array.isArray(prov.models) ? prov.models.length + ' 模型' : prov.auth || '--'}</span>`;
      const actions = isAuthProfile
        ? `<button class="btn btn-sm" onclick="openEditProviderModal('${esc(id)}')" title="查看"><svg width="13" height="13"><use href="#ico-info"/></svg></button>`
        : `<button class="btn btn-sm" onclick="openEditProviderModal('${esc(id)}')"><svg width="13" height="13"><use href="#ico-edit"/></svg></button>
           <button class="btn btn-sm" onclick="testProvider('${esc(id)}', this)"><svg width="13" height="13"><use href="#ico-zap"/></svg></button>
           <button class="btn btn-sm btn-danger" onclick="deleteProvider('${esc(id)}')"><svg width="13" height="13"><use href="#ico-trash"/></svg></button>`;
      return `
      <tr>
        <td class="mono">${esc(id)}</td>
        <td class="mono" style="max-width:260px;overflow:hidden;text-overflow:ellipsis">${esc(info)}</td>
        <td>${authBadge}</td>
        <td>${actions}</td>
      </tr>`;
    }).join('')}
    </tbody>
  </table>`;
}

function providerFormHtml(id, prov) {
  prov = prov || {};
  const isAuthProfile = prov._source === 'auth.profiles';

  if (isAuthProfile) {
    // auth.profiles 供应商：简洁表单
    return `
    <div class="form-group">
      <label class="form-label">${t('provider_name')}</label>
      <input type="text" id="prov_id" class="form-input mono" value="${esc(id || '')}" readonly />
    </div>
    <div class="form-group">
      <label class="form-label">认证模式</label>
      <select id="prov_mode" class="form-select">
        ${['oauth','api-key','token','aws-sdk'].map(v => `<option value="${v}" ${(prov.mode||'oauth')===v?'selected':''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Base URL (可选)</label>
      <input type="url" id="prov_baseUrl" class="form-input mono" value="${esc(prov.baseUrl || '')}" placeholder="留空使用默认" />
    </div>
    <div class="form-group">
      <label class="form-label">API Key (可选)</label>
      ${secretInput('prov_apiKey', prov.apiKey, 'sk-...')}
      <div class="form-hint">OAuth 模式无需填写 API Key</div>
    </div>
    <input type="hidden" id="prov_source" value="auth" />
    <input type="hidden" id="prov_profileKey" value="${esc(prov._profileKey || '')}" />`;
  }

  // models.providers 供应商：完整表单
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
    </div>
    <input type="hidden" id="prov_source" value="models" />`;
}

function openAddProviderModal() {
  openModal(`
    <div class="modal">
      <div class="modal-header"><div class="modal-title">新增供应商</div><button class="modal-close" onclick="closeModal()" title="关闭"><svg width="16" height="16"><use href="#ico-x"/></svg></button></div>
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
      <div class="modal-header"><div class="modal-title">编辑供应商: ${esc(id)}</div><button class="modal-close" onclick="closeModal()" title="关闭"><svg width="16" height="16"><use href="#ico-x"/></svg></button></div>
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
      <div class="modal-header"><div class="modal-title">添加 ${preset.name}</div><button class="modal-close" onclick="closeModal()" title="关闭"><svg width="16" height="16"><use href="#ico-x"/></svg></button></div>
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

  const source = document.getElementById('prov_source')?.value || 'models';

  const apiKeyEl = document.getElementById('prov_apiKey');
  let apiKey;
  if (apiKeyEl && apiKeyEl.dataset.originalSecret) {
    apiKey = { source: 'env', id: '__OPENCLAW_REDACTED__' };
  } else if (apiKeyEl && apiKeyEl.value) {
    apiKey = apiKeyEl.value;
  }

  let config;
  if (source === 'auth') {
    // auth.profiles 供应商
    config = {
      provider: id,
      mode: document.getElementById('prov_mode')?.value || 'oauth',
    };
    const baseUrl = document.getElementById('prov_baseUrl')?.value?.trim();
    if (baseUrl) config.baseUrl = baseUrl;
    if (apiKey !== undefined) config.apiKey = apiKey;
  } else {
    // models.providers 供应商
    const baseUrl = document.getElementById('prov_baseUrl')?.value?.trim() || '';
    if (!baseUrl) { toast(t('required_field') + ': Base URL', 'error'); return; }

    let models = [];
    const modelsEl = document.getElementById('prov_models');
    if (modelsEl && modelsEl.value.trim()) {
      try { models = JSON.parse(modelsEl.value); }
      catch { toast('模型列表 JSON 格式错误', 'error'); return; }
    }

    config = { baseUrl, auth: document.getElementById('prov_auth')?.value || 'api-key', models };
    if (apiKey !== undefined) config.apiKey = apiKey;
  }

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

