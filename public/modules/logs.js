'use strict';
// ─────────────────────────────────────────────
// 页面：日志
// ─────────────────────────────────────────────
let logsAgentId = 'main';

async function renderLogs(container) {
  let agents = { list: [] };
  try { agents = await api('GET', '/api/agents') || { list: [] }; } catch {}
  const list = agents.list || [];

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-logs"/></svg>实时日志流</div>
        <div style="display:flex;gap:8px;align-items:center">
          <select id="logAgentSelect" class="form-select" style="width:auto;min-width:160px" onchange="switchLogAgent(this.value)">
            ${list.length ? list.map(a=>`<option value="${esc(a.id)}" ${a.id===logsAgentId?'selected':''}>${esc(a.name||a.id)}</option>`).join('')
              : '<option value="main">main</option>'}
          </select>
          <button class="btn btn-sm" onclick="clearLogDisplay()">清空</button>
        </div>
      </div>
      <div class="card-body" style="padding:14px">
        <div id="logStream" class="log-stream">${t('logs_connecting')}</div>
      </div>
    </div>`;

  startLogStream(logsAgentId);
}

function clearLogDisplay() {
  const el = document.getElementById('logStream');
  if (el) el.innerHTML = '';
}

function switchLogAgent(id) {
  logsAgentId = id;
  if (logEventSource) { logEventSource.close(); logEventSource = null; }
  startLogStream(id);
}

function startLogStream(agentId) {
  if (logEventSource) { logEventSource.close(); }
  const el = document.getElementById('logStream');
  if (!el) return;
  el.innerHTML = t('logs_connecting');

  logEventSource = new EventSource(`/api/logs/stream?agent=${encodeURIComponent(agentId)}`);

  logEventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === 'error') { appendLog(el, '[ERR] ' + (data.message || ''), 'role-error'); return; }
      if (data.type === 'line' && data.data) {
        const entry = data.data;
        const role = entry.role || entry.type || '';
        let text = '';
        if (entry.type === 'message' || entry.role) {
          const content = entry.content || (entry.message && entry.message.content);
          if (typeof content === 'string') text = content.slice(0, 200);
          else if (Array.isArray(content)) text = content.filter(c=>c.type==='text').map(c=>c.text).join(' ').slice(0,200);
        } else if (entry.type === 'toolResult') {
          text = `[工具: ${entry.toolName || '?'}]`;
        } else if (entry.type === 'model_change') {
          text = `[模型: ${entry.provider}/${entry.modelId}]`;
        } else {
          text = JSON.stringify(entry).slice(0, 120);
        }
        if (text) appendLog(el, text, 'role-' + (role === 'user' ? 'user' : role === 'assistant' ? 'assistant' : 'tool'));
      } else if (data.type === 'raw') {
        appendLog(el, data.text || '', '');
      }
    } catch {}
  };

  logEventSource.onerror = () => {
    if (el) appendLog(el, '[断开] 日志流连接断开，3秒后重连...', 'role-error');
    setTimeout(() => { if (currentPage === 'logs') startLogStream(agentId); }, 3000);
  };
}

function appendLog(el, text, cls) {
  if (!el) return;
  const line = document.createElement('div');
  line.className = 'log-line ' + (cls || '');
  line.textContent = text;
  el.appendChild(line);
  // 自动滚动到底部
  el.scrollTop = el.scrollHeight;
  // 最多保留 500 行
  while (el.children.length > 500) el.removeChild(el.firstChild);
}

