'use strict';
// ─────────────────────────────────────────────
// 页面：日志
// ─────────────────────────────────────────────
let logsAgentId = 'main';
let logLevelFilter = 'all';
let logSearch = '';

async function renderLogs(container) {
  let agents = { list: [] };
  try { agents = await api('GET', '/api/agents') || { list: [] }; } catch {}
  const list = agents.list || [];

  container.innerHTML = `
    <div class="card">
      <div class="card-header" style="flex-wrap:wrap;gap:10px">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-logs"/></svg>实时日志流</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="logAgentSelect" class="form-select" style="width:auto;min-width:140px" onchange="switchLogAgent(this.value)">
            ${list.length ? list.map(a=>`<option value="${esc(a.id)}" ${a.id===logsAgentId?'selected':''}>${esc(a.name||a.id)}</option>`).join('')
              : '<option value="main">main</option>'}
          </select>
          <select id="logLevelSelect" class="form-select" style="width:auto;min-width:110px" onchange="setLogLevel(this.value)">
            <option value="all" ${logLevelFilter==='all'?'selected':''}>全部级别</option>
            <option value="user" ${logLevelFilter==='user'?'selected':''}>👤 User</option>
            <option value="assistant" ${logLevelFilter==='assistant'?'selected':''}>🤖 Assistant</option>
            <option value="tool" ${logLevelFilter==='tool'?'selected':''}>🔧 Tool</option>
            <option value="error" ${logLevelFilter==='error'?'selected':''}>❌ Error</option>
          </select>
          <div style="position:relative">
            <input id="logSearchInput" class="form-input" style="width:180px;padding-left:30px;height:32px;font-size:12px" placeholder="搜索日志..." value="${esc(logSearch)}" oninput="setLogSearch(this.value)" />
            <svg width="14" height="14" style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--text-muted);pointer-events:none"><use href="#ico-search"/></svg>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="exportLogs()" title="导出日志"><svg width="14" height="14"><use href="#ico-external"/></svg></button>
          <button class="btn btn-sm" onclick="clearLogDisplay()">清空</button>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div id="logStream" class="log-stream" style="max-height:calc(100vh - 220px);overflow-y:auto;padding:14px;font-family:'SF Mono','Fira Code',monospace;font-size:12px;line-height:1.7">${t('logs_connecting')}</div>
      </div>
      <div class="card-body" style="padding:8px 14px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span id="logCount" style="font-size:11px;color:var(--text-muted)">0 条日志</span>
        <span id="logStatus" style="font-size:11px;color:var(--text-muted)">连接中...</span>
      </div>
    </div>`;

  startLogStream(logsAgentId);
}

function clearLogDisplay() {
  const el = document.getElementById('logStream');
  if (el) el.innerHTML = '';
  updateLogCount();
}

function switchLogAgent(id) {
  logsAgentId = id;
  if (logEventSource) { logEventSource.close(); logEventSource = null; }
  startLogStream(id);
}

function setLogLevel(level) {
  logLevelFilter = level;
  filterLogs();
}

function setLogSearch(q) {
  logSearch = q.toLowerCase();
  filterLogs();
}

function filterLogs() {
  const el = document.getElementById('logStream');
  if (!el) return;
  const lines = el.querySelectorAll('.log-line');
  let visible = 0;
  lines.forEach(line => {
    let show = true;
    if (logLevelFilter !== 'all') {
      show = line.classList.contains('role-' + logLevelFilter);
    }
    if (show && logSearch) {
      show = line.textContent.toLowerCase().includes(logSearch);
    }
    line.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  updateLogCount(visible, lines.length);
}

function updateLogCount(visible, total) {
  const el = document.getElementById('logCount');
  if (!el) return;
  const stream = document.getElementById('logStream');
  if (!stream) return;
  const lines = stream.querySelectorAll('.log-line');
  total = total || lines.length;
  visible = visible !== undefined ? visible : total;
  el.textContent = visible === total ? `${total} 条日志` : `${visible}/${total} 条日志`;
}

function exportLogs() {
  const el = document.getElementById('logStream');
  if (!el) return;
  const lines = el.querySelectorAll('.log-line');
  const text = Array.from(lines).map(l => l.textContent).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `openclaw-logs-${logsAgentId}-${new Date().toISOString().slice(0,16)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast('日志已导出', 'success');
}

function startLogStream(agentId) {
  if (logEventSource) { logEventSource.close(); }
  const el = document.getElementById('logStream');
  const statusEl = document.getElementById('logStatus');
  if (!el) return;
  el.innerHTML = t('logs_connecting');
  if (statusEl) statusEl.textContent = '连接中...';

  logEventSource = new EventSource(`/api/logs/stream?agent=${encodeURIComponent(agentId)}`);

  logEventSource.onopen = () => {
    if (statusEl) { statusEl.textContent = '已连接'; statusEl.style.color = 'var(--green)'; }
  };

  logEventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === 'error') { appendLog(el, '[ERR] ' + (data.message || ''), 'role-error'); return; }
      if (data.type === 'line' && data.data) {
        const entry = data.data;
        const role = entry.role || entry.type || '';
        let text = '';
        const ts = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() + ' ' : '';
        if (entry.type === 'message' || entry.role) {
          const content = entry.content || (entry.message && entry.message.content);
          if (typeof content === 'string') text = content.slice(0, 300);
          else if (Array.isArray(content)) text = content.filter(c=>c.type==='text').map(c=>c.text).join(' ').slice(0,300);
        } else if (entry.type === 'toolResult') {
          text = `[工具: ${entry.toolName || '?'}]`;
        } else if (entry.type === 'model_change') {
          text = `[模型: ${entry.provider}/${entry.modelId}]`;
        } else {
          text = JSON.stringify(entry).slice(0, 150);
        }
        if (text) {
          const roleClass = role === 'user' ? 'user' : role === 'assistant' ? 'assistant' : 'tool';
          appendLog(el, ts + text, 'role-' + roleClass);
        }
      } else if (data.type === 'raw') {
        appendLog(el, data.text || '', '');
      }
    } catch {}
  };

  logEventSource.onerror = () => {
    if (statusEl) { statusEl.textContent = '已断开，3秒后重连...'; statusEl.style.color = 'var(--red)'; }
    if (el) appendLog(el, '[断开] 日志流连接断开，3秒后重连...', 'role-error');
    setTimeout(() => { if (currentPage === 'logs') startLogStream(agentId); }, 3000);
  };
}

function appendLog(el, text, cls) {
  if (!el) return;
  // 首次连接的占位文字清除
  if (el.children.length === 0 || (el.children.length === 1 && !el.querySelector('.log-line'))) {
    el.innerHTML = '';
  }
  const line = document.createElement('div');
  line.className = 'log-line ' + (cls || '');
  line.textContent = text;
  // 应用当前过滤
  if (logLevelFilter !== 'all' && !line.classList.contains('role-' + logLevelFilter)) {
    line.style.display = 'none';
  }
  if (logSearch && !text.toLowerCase().includes(logSearch)) {
    line.style.display = 'none';
  }
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
  while (el.children.length > 1000) el.removeChild(el.firstChild);
  updateLogCount();
}
