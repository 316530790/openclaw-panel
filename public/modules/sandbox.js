'use strict';
// ─────────────────────────────────────────────
// 页面：Sandbox 配置
// ─────────────────────────────────────────────
async function renderSandbox(container) {
  let sandbox = {};
  try { const cfg = await getConfig(); sandbox = (cfg && cfg.sandbox) || {}; } catch {}
  const docker = sandbox.docker || {};
  const browser = sandbox.browser || {};
  const ssh = sandbox.ssh || {};
  container.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-sandbox"/></svg> Docker 沙盒</div></div>
      <div class="card-body">
        <div class="config-section">
          <div class="form-group"><label class="form-label">启用 Docker 沙盒</label>
            <select class="form-input" id="sb_docker_enabled"><option value="true" ${docker.enabled !== false ? 'selected' : ''}>启用</option><option value="false" ${docker.enabled === false ? 'selected' : ''}>禁用</option></select></div>
          <div class="form-group"><label class="form-label">Docker 镜像</label>
            <input class="form-input" id="sb_docker_image" value="${esc(docker.image || '')}" placeholder="openclaw/sandbox:latest" /></div>
          <div class="form-group"><label class="form-label">内存限制</label>
            <input class="form-input" id="sb_docker_memory" value="${esc(docker.memory || '')}" placeholder="512m" /></div>
          <div class="form-group"><label class="form-label">CPU 限制</label>
            <input class="form-input" id="sb_docker_cpus" value="${esc(docker.cpus || '')}" placeholder="1" /></div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title">Browser 沙盒</div></div>
      <div class="card-body"><div class="config-section">
        <div class="form-group"><label class="form-label">启用浏览器沙盒</label>
          <select class="form-input" id="sb_browser_enabled"><option value="true" ${browser.enabled !== false ? 'selected' : ''}>启用</option><option value="false" ${browser.enabled === false ? 'selected' : ''}>禁用</option></select></div>
        <div class="form-group"><label class="form-label">超时 (秒)</label>
          <input class="form-input" id="sb_browser_timeout" type="number" value="${browser.timeout || 30}" /></div>
      </div></div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title">SSH 远程执行</div></div>
      <div class="card-body"><div class="config-section">
        <div class="form-group"><label class="form-label">启用 SSH</label>
          <select class="form-input" id="sb_ssh_enabled"><option value="true" ${ssh.enabled ? 'selected' : ''}>启用</option><option value="false" ${!ssh.enabled ? 'selected' : ''}>禁用</option></select></div>
        <div class="form-group"><label class="form-label">主机</label>
          <input class="form-input" id="sb_ssh_host" value="${esc(ssh.host || '')}" placeholder="192.168.1.100" /></div>
        <div class="form-group"><label class="form-label">端口</label>
          <input class="form-input" id="sb_ssh_port" type="number" value="${ssh.port || 22}" /></div>
      </div></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button class="btn btn-primary" onclick="saveSandbox()">${t('save')}</button>
    </div>`;
}

async function saveSandbox() {
  const sandbox = {
    docker: {
      enabled: document.getElementById('sb_docker_enabled').value === 'true',
      image: document.getElementById('sb_docker_image').value.trim() || undefined,
      memory: document.getElementById('sb_docker_memory').value.trim() || undefined,
      cpus: document.getElementById('sb_docker_cpus').value.trim() || undefined,
    },
    browser: {
      enabled: document.getElementById('sb_browser_enabled').value === 'true',
      timeout: parseInt(document.getElementById('sb_browser_timeout').value) || 30,
    },
    ssh: {
      enabled: document.getElementById('sb_ssh_enabled').value === 'true',
      host: document.getElementById('sb_ssh_host').value.trim() || undefined,
      port: parseInt(document.getElementById('sb_ssh_port').value) || 22,
    },
  };
  try {
    await api('POST', '/api/sandbox', sandbox);
    invalidateConfig();
    toast(t('save_ok'), 'success');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

