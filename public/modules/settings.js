'use strict';
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


