'use strict';
// ─────────────────────────────────────────────
// 页面：工具
// ─────────────────────────────────────────────
async function renderTools(container) {
  let cfg = {};
  try { cfg = await getConfig(); } catch {}
  const tools = cfg.tools || {};
  const media = tools.media || {};
  const exec = tools.exec || {};
  const web = tools.web_search || tools.webSearch || {};
  const webFetch = tools.web_fetch || tools.webFetch || {};
  const fsTools = tools.fs || {};

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-tools"/></svg>${t('tools_media')}</div>
      </div>
      <div class="card-body" id="toolsMediaBody">
        ${renderMediaTools(media)}
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title">⚡ 命令执行策略</div></div>
      <div class="card-body">
        <div class="config-section">
          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-name">Shell 命令执行</div>
              <div class="toggle-desc">允许 Agent 执行系统命令 (<code>exec</code>)</div>
            </div>
            <label class="toggle"><input type="checkbox" ${exec.enabled !== false ? 'checked' : ''} onchange="saveToolToggle('exec.enabled', this.checked)" /><span class="toggle-track"></span></label>
          </div>
          <div class="form-group" style="margin-top:12px">
            <label class="form-label">允许的命令 (逗号分隔，留空=全部允许)</label>
            <input class="form-input" id="exec_allowlist" value="${esc((exec.allowlist || []).join(', '))}" placeholder="git, npm, node, python" />
          </div>
          <div class="form-group">
            <label class="form-label">禁止的命令 (逗号分隔)</label>
            <input class="form-input" id="exec_denylist" value="${esc((exec.denylist || []).join(', '))}" placeholder="rm, shutdown, reboot" />
          </div>
          <div class="form-group">
            <label class="form-label">超时 (秒)</label>
            <input class="form-input" type="number" id="exec_timeout" value="${exec.timeout || 30}" />
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:8px">
            <button class="btn btn-primary btn-sm" onclick="saveExecConfig()">保存执行策略</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title">🌐 Web 搜索 & 抓取</div></div>
      <div class="card-body">
        <div class="config-section">
          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-name">Web 搜索</div>
              <div class="toggle-desc">允许 Agent 搜索互联网获取信息</div>
            </div>
            <label class="toggle"><input type="checkbox" ${web.enabled !== false ? 'checked' : ''} onchange="saveToolToggle('web_search.enabled', this.checked)" /><span class="toggle-track"></span></label>
          </div>
          <div class="form-group" style="margin-top:12px">
            <label class="form-label">搜索引擎</label>
            <select class="form-input" id="web_engine">
              <option value="google" ${(web.engine || 'google') === 'google' ? 'selected' : ''}>Google</option>
              <option value="bing" ${web.engine === 'bing' ? 'selected' : ''}>Bing</option>
              <option value="duckduckgo" ${web.engine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
              <option value="searxng" ${web.engine === 'searxng' ? 'selected' : ''}>SearXNG (自建)</option>
            </select>
          </div>
          <div class="toggle-row" style="margin-top:8px">
            <div class="toggle-info">
              <div class="toggle-name">Web 抓取</div>
              <div class="toggle-desc">允许 Agent 抓取和解析网页内容</div>
            </div>
            <label class="toggle"><input type="checkbox" ${webFetch.enabled !== false ? 'checked' : ''} onchange="saveToolToggle('web_fetch.enabled', this.checked)" /><span class="toggle-track"></span></label>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:8px">
            <button class="btn btn-primary btn-sm" onclick="saveWebConfig()">保存搜索配置</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title">📁 文件系统限制</div></div>
      <div class="card-body">
        <div class="config-section">
          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-name">文件系统访问</div>
              <div class="toggle-desc">允许 Agent 读写文件系统</div>
            </div>
            <label class="toggle"><input type="checkbox" ${fsTools.enabled !== false ? 'checked' : ''} onchange="saveToolToggle('fs.enabled', this.checked)" /><span class="toggle-track"></span></label>
          </div>
          <div class="form-group" style="margin-top:12px">
            <label class="form-label">允许的路径 (逗号分隔，留空=全部允许)</label>
            <input class="form-input" id="fs_allowpaths" value="${esc((fsTools.allowPaths || []).join(', '))}" placeholder="/home/user/projects, /tmp" />
          </div>
          <div class="form-group">
            <label class="form-label">禁止的路径 (逗号分隔)</label>
            <input class="form-input" id="fs_denypaths" value="${esc((fsTools.denyPaths || []).join(', '))}" placeholder="/etc, /root, /var" />
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:8px">
            <button class="btn btn-primary btn-sm" onclick="saveFsConfig()">保存文件系统策略</button>
          </div>
        </div>
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

function parseCommaSplit(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

async function saveExecConfig() {
  const exec = {
    enabled: document.querySelector('#toolsMediaBody')?.closest('.page-content')?.querySelector('[onchange*="exec.enabled"]')?.checked !== false,
    allowlist: parseCommaSplit(document.getElementById('exec_allowlist')?.value || ''),
    denylist: parseCommaSplit(document.getElementById('exec_denylist')?.value || ''),
    timeout: parseInt(document.getElementById('exec_timeout')?.value) || 30,
  };
  try {
    await api('POST', '/api/config/patch', { path: ['tools', 'exec'], value: exec });
    invalidateConfig();
    toast(t('save_ok'), 'success');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function saveWebConfig() {
  const webSearch = {
    engine: document.getElementById('web_engine')?.value || 'google',
  };
  try {
    await api('POST', '/api/config/patch', { path: ['tools', 'web_search'], value: webSearch });
    invalidateConfig();
    toast(t('save_ok'), 'success');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function saveFsConfig() {
  const fs = {
    allowPaths: parseCommaSplit(document.getElementById('fs_allowpaths')?.value || ''),
    denyPaths: parseCommaSplit(document.getElementById('fs_denypaths')?.value || ''),
  };
  try {
    await api('POST', '/api/config/patch', { path: ['tools', 'fs'], value: fs });
    invalidateConfig();
    toast(t('save_ok'), 'success');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}
