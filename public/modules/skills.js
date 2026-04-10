'use strict';
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

