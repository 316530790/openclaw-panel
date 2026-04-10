'use strict';
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
      <div class="modal-header"><div class="modal-title">${name} 高级配置</div><button class="modal-close" onclick="closeModal()" title="关闭"><svg width="16" height="16"><use href="#ico-x"/></svg></button></div>
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

