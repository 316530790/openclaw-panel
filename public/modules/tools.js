'use strict';
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

