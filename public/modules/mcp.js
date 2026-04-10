'use strict';
// ─────────────────────────────────────────────
// 页面：MCP 服务器管理
// ─────────────────────────────────────────────
async function renderMcp(container) {
  let servers = {};
  try { const cfg = await getConfig(); servers = (cfg && cfg.mcp && cfg.mcp.servers) || {}; } catch {}
  const ids = Object.keys(servers);
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-mcp"/></svg> ${t('page_mcp')}</div>
        <button class="btn btn-primary btn-sm" onclick="openMcpEditor()"><svg width="13" height="13"><use href="#ico-plus"/></svg> ${t('add')}</button>
      </div>
      <div class="card-body" id="mcpList">
        ${ids.length === 0 ? `<div class="empty-state"><div class="empty-title">${t('no_data')}</div><div class="empty-desc">尚未配置 MCP 服务器</div></div>` :
          ids.map(id => renderMcpCard(id, servers[id])).join('')}
      </div>
    </div>`;
}

function renderMcpCard(id, cfg) {
  const transport = cfg.type || (cfg.command ? 'stdio' : cfg.url ? (cfg.url.includes('/sse') ? 'sse' : 'http') : 'unknown');
  const badge = transport === 'stdio' ? 'badge-green' : transport === 'http' ? 'badge-blue' : 'badge-yellow';
  return `<div class="mcp-server-card" style="border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px">
        <strong style="font-size:14px">${esc(id)}</strong>
        <span class="badge ${badge}">${transport}</span>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" onclick="openMcpEditor('${esc(id)}')"><svg width="13" height="13"><use href="#ico-edit"/></svg></button>
        <button class="btn btn-ghost btn-sm" onclick="deleteMcpServer('${esc(id)}')"><svg width="13" height="13" style="color:var(--red)"><use href="#ico-trash"/></svg></button>
      </div>
    </div>
    <div class="info-grid" style="font-size:12px;color:var(--text-muted)">
      ${cfg.command ? `<div>命令: <code>${esc(cfg.command)}</code></div>` : ''}
      ${cfg.url ? `<div>URL: <code>${esc(cfg.url)}</code></div>` : ''}
      ${cfg.args ? `<div>参数: <code>${esc(JSON.stringify(cfg.args))}</code></div>` : ''}
    </div>
  </div>`;
}

function openMcpEditor(editId) {
  const isEdit = !!editId;
  const title = isEdit ? `编辑 MCP: ${editId}` : '添加 MCP 服务器';
  getConfig().then(cfg => {
    const servers = (cfg && cfg.mcp && cfg.mcp.servers) || {};
    const existing = isEdit ? (servers[editId] || {}) : {};
    const transport = existing.type || (existing.command ? 'stdio' : existing.url ? 'http' : 'stdio');
    openModal(`<div class="modal-card" style="max-width:540px">
      <div class="modal-header">${title}</div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">服务器 ID</label>
          <input class="form-input" id="mcp_id" value="${esc(editId || '')}" ${isEdit ? 'disabled' : ''} placeholder="my-mcp-server" /></div>
        <div class="form-group"><label class="form-label">传输类型</label>
          <select class="form-input" id="mcp_transport" onchange="toggleMcpFields()">
            <option value="stdio" ${transport==='stdio'?'selected':''}>stdio</option>
            <option value="http" ${transport==='http'?'selected':''}>http / streamable-http</option>
            <option value="sse" ${transport==='sse'?'selected':''}>SSE</option>
          </select></div>
        <div id="mcp_stdio_fields" style="display:${transport==='stdio'?'block':'none'}">
          <div class="form-group"><label class="form-label">Command</label>
            <input class="form-input" id="mcp_command" value="${esc(existing.command || '')}" placeholder="npx -y @some/mcp-server" /></div>
          <div class="form-group"><label class="form-label">Args (JSON 数组)</label>
            <input class="form-input" id="mcp_args" value="${esc(existing.args ? JSON.stringify(existing.args) : '')}" placeholder='["--port","3000"]' /></div>
        </div>
        <div id="mcp_http_fields" style="display:${transport!=='stdio'?'block':'none'}">
          <div class="form-group"><label class="form-label">URL</label>
            <input class="form-input" id="mcp_url" value="${esc(existing.url || '')}" placeholder="http://localhost:3001/sse" /></div>
        </div>
        <div class="form-group"><label class="form-label">环境变量 (JSON 对象, 可选)</label>
          <input class="form-input" id="mcp_env" value="${esc(existing.env ? JSON.stringify(existing.env) : '')}" placeholder='{"API_KEY":"..."}' /></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn btn-primary" onclick="saveMcpServer(${isEdit ? `'${esc(editId)}'` : 'null'})">${t('save')}</button>
      </div>
    </div>`);
  });
}

function toggleMcpFields() {
  const t = document.getElementById('mcp_transport').value;
  document.getElementById('mcp_stdio_fields').style.display = t === 'stdio' ? 'block' : 'none';
  document.getElementById('mcp_http_fields').style.display = t !== 'stdio' ? 'block' : 'none';
}

async function saveMcpServer(editId) {
  const id = editId || document.getElementById('mcp_id').value.trim();
  if (!id) { toast('请输入服务器 ID', 'error'); return; }
  const transport = document.getElementById('mcp_transport').value;
  const serverCfg = {};
  if (transport === 'stdio') {
    serverCfg.command = document.getElementById('mcp_command').value.trim();
    const argsStr = document.getElementById('mcp_args').value.trim();
    if (argsStr) try { serverCfg.args = JSON.parse(argsStr); } catch { toast('Args JSON 格式错误', 'error'); return; }
  } else {
    serverCfg.url = document.getElementById('mcp_url').value.trim();
    serverCfg.type = transport;
  }
  const envStr = document.getElementById('mcp_env').value.trim();
  if (envStr) try { serverCfg.env = JSON.parse(envStr); } catch { toast('环境变量 JSON 格式错误', 'error'); return; }
  try {
    await api('POST', '/api/mcp', { id, config: serverCfg });
    invalidateConfig();
    closeModal();
    toast(t('save_ok'), 'success');
    navigate('mcp');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function deleteMcpServer(id) {
  confirmDialog('删除 MCP 服务器', `确定删除 "${id}" 吗？`, async () => {
    try {
      await api('DELETE', '/api/mcp/' + encodeURIComponent(id));
      invalidateConfig();
      toast(t('delete_ok'), 'success');
      navigate('mcp');
    } catch (e) { toast(t('op_fail') + ': ' + e.message, 'error'); }
  }, true);
}

