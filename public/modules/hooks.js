'use strict';
// ─────────────────────────────────────────────
// 页面：Hooks 配置
// ─────────────────────────────────────────────
async function renderHooksPage(container) {
  let hooks = {};
  try { const cfg = await getConfig(); hooks = (cfg && cfg.hooks) || {}; } catch {}
  container.innerHTML = `
    <div class="card">
      <div class="card-header"><div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-hooks"/></svg> ${t('page_hooks')}</div></div>
      <div class="card-body">
        <div class="form-group"><label class="form-label">Hooks 配置 (JSON)</label>
          <textarea class="form-input" id="hooks_json" rows="18" style="font-family:'SF Mono','Fira Code',monospace;font-size:12px">${esc(JSON.stringify(hooks, null, 2))}</textarea></div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
      <button class="btn btn-primary" onclick="saveHooksJson()">${t('save')}</button>
    </div>`;
}

async function saveHooksJson() {
  const el = document.getElementById('hooks_json');
  if (!el) return;
  let parsed;
  try { parsed = JSON.parse(el.value); } catch { toast('JSON 格式错误', 'error'); return; }
  try {
    await api('POST', '/api/hooks', parsed);
    invalidateConfig();
    toast(t('save_ok'), 'success');
    navigate('hooks');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}
