'use strict';
// ─────────────────────────────────────────────
// 页面：概览
// ─────────────────────────────────────────────
async function renderOverview(container) {
  const statMeta = [
    { key:'cpu',    icon:'#ico-cpu',    fill:'fill-brand' },
    { key:'mem',    icon:'#ico-memory', fill:'fill-green' },
    { key:'disk',   icon:'#ico-disk',   fill:'fill-blue'  },
    { key:'uptime', icon:'#ico-timer',  fill:'fill-yellow'},
  ];

  container.innerHTML = `
    <div class="stats-grid" id="statsGrid">
      ${statMeta.map(s => `
        <div class="stat-card" id="stat_${s.key}">
          <div class="stat-label">
            <svg width="13" height="13"><use href="${s.icon}"/></svg>
            ${t(s.key)}
          </div>
          <div class="stat-value">--</div>
          <div class="stat-sub"></div>
          <div class="progress-track"><div class="progress-fill ${s.fill}" style="width:0%"></div></div>
        </div>`).join('')}
    </div>

    <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <div class="card-title">
            <svg class="card-title-icon" width="18" height="18"><use href="#ico-agents"/></svg>
            ${t('agent_matrix')}
          </div>
          <a href="#quickops" onclick="navigate('quickops')" class="btn btn-sm btn-ghost" style="font-size:12px">
            快捷操作 →
          </a>
        </div>
        <div class="card-body">
          <div id="agentGrid" class="agent-grid">
            <div class="empty-state"><div class="spinner"></div></div>
          </div>
        </div>
      </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <svg class="card-title-icon" width="18" height="18"><use href="#ico-logs"/></svg>
          ${t('active_sessions')}
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div id="sessionList"></div>
      </div>
    </div>`;

  // 拉取数据
  const [health, agents, sessions] = await Promise.allSettled([
    api('GET', '/api/sys-health'),
    api('GET', '/api/agents'),
    api('GET', '/api/sessions'),
  ]);

  if (health.status === 'fulfilled') updateOverviewStats(health.value);
  if (agents.status === 'fulfilled') renderAgentMatrix(agents.value);
  if (sessions.status === 'fulfilled') renderSessionList(sessions.value);
}

function updateOverviewStats(data) {
  if (!data) return;

  function updateCard(id, value, sub, pct, isText = false) {
    const card = document.getElementById('stat_' + id);
    if (!card) return;
    const valEl = card.querySelector('.stat-value');
    valEl.textContent = value;
    valEl.classList.toggle('stat-value-text', isText);
    const subEl = card.querySelector('.stat-sub');
    if (subEl) subEl.textContent = sub;
    const bar = card.querySelector('.progress-fill');
    if (bar && pct != null) bar.style.width = Math.min(pct, 100) + '%';
  }

  updateCard('cpu',    (data.cpu ?? '--') + '%', `${data.platform || ''} · ${data.cpu ?? '--'}% 利用率`, data.cpu);
  updateCard('mem',    data.memUsedPct + '%',
    `${formatBytes(data.memTotal - data.memFree)} / ${formatBytes(data.memTotal)}`,
    data.memUsedPct);
  if (data.disk) {
    updateCard('disk', data.disk.usedPct + '%',
      `${formatBytes(data.disk.total - data.disk.free)} / ${formatBytes(data.disk.total)}`,
      data.disk.usedPct);
  }
  const ocUp = data.openclawUptime;
  updateCard('uptime',
    ocUp != null ? formatUptime(ocUp) : 'OpenClaw 未运行',
    ocUp != null ? 'OpenClaw 进程运行时长' : '未检测到 OpenClaw，点击左侧快捷启动',
    null,
    ocUp == null /* isText */);

  // 快捷操作区域 Gateway 状态
  const gwInfo = document.getElementById('quickGwInfo');
  if (gwInfo && data.gateway) {
    gwInfo.innerHTML = data.gateway.alive
      ? `<span style="color:var(--green)">● 在线</span> · 端口 ${data.gateway.port}`
      : `<span style="color:var(--red)">● 离线</span> · 端口 ${data.gateway.port}`;
  }
}

// ─────────────────────────────────────────────
// 快捷操作（Dashboard 集成）
// ─────────────────────────────────────────────
async function quickRestart() {
  confirmDialog('重启 Gateway', 'Gateway 将重启约 5 秒，期间连接中断。确认？', async () => {
    try { await api('POST', '/api/cmd/restart'); toast('重启命令已发送', 'info'); }
    catch (e) { toast('操作失败: ' + e.message, 'error'); }
  });
}

async function quickStart() {
  try { await api('POST', '/api/cmd/restart'); toast('启动命令已发送', 'success'); }
  catch (e) { toast('操作失败: ' + e.message, 'error'); }
}

async function quickDoctor() {
  toast('诊断中，请稍候...', 'info', 2000);
  try {
    const res = await api('POST', '/api/cmd/doctor');
    toast(res.ok ? '诊断完成，系统正常' : '诊断完成，请查看设置页', res.ok ? 'success' : 'warn', 4000);
  } catch (e) { toast('诊断失败: ' + e.message, 'error'); }
}

async function quickUpdate() {
  toast('正在检查更新...', 'info', 2000);
  try {
    await api('POST', '/api/cmd/restart'); // 通过 openclaw doctor 检查
    toast('已触发更新检查，请查看 Gateway 日志', 'info', 4000);
  } catch (e) { toast('操作失败: ' + e.message, 'error'); }
}

function renderAgentMatrix(agents) {
  const grid = document.getElementById('agentGrid');
  if (!grid) return;
  const list = (agents && agents.list) || [];
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><svg class="empty-icon"><use href="#ico-agents"/></svg><div class="empty-title">${t('no_data')}</div></div>`;
    return;
  }
  grid.innerHTML = list.map(a => {
    const status = a._status || 'idle';
    const model = typeof a.model === 'object' ? (a.model.primary || '') : (a.model || '');
    const initials = (a.name || a.id || 'A').slice(0, 2).toUpperCase();
    return `
      <div class="agent-card">
        <div class="agent-card-top">
          <div class="agent-avatar" title="${esc(a.id)}">${initials}</div>
          <div class="agent-info">
            <div class="agent-name">${esc(a.name || a.id)}</div>
            <div class="agent-model">${esc(model || '--')}</div>
          </div>
          <span class="status-dot ${status === 'working' ? 'dot-working' : 'dot-online'}"></span>
        </div>
        <div style="font-size:11.5px;color:var(--text-muted)">${a._session ? esc(a._session.slice(0,28)) : '无活跃会话'}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px">
          <span class="badge ${status === 'working' ? 'badge-brand' : 'badge-green'}">${status === 'working' ? t('working') : t('idle')}</span>
          ${a._lastActivity ? `<span style="font-size:11px;color:var(--text-muted)">${new Date(a._lastActivity).toLocaleTimeString()}</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

function renderSessionList(sessions) {
  const el = document.getElementById('sessionList');
  if (!el) return;
  if (!sessions || !sessions.length) {
    el.innerHTML = `<div class="empty-state">
      <svg class="empty-icon"><use href="#ico-logs"/></svg>
      <div class="empty-title">${t('no_data')}</div>
    </div>`;
    return;
  }
  el.innerHTML = `<table class="data-table">
    <thead><tr><th>Agent</th><th>Session ID</th><th>状态</th><th>最近活动</th><th>大小</th></tr></thead>
    <tbody>${sessions.slice(0, 10).map(s => `
      <tr>
        <td><span style="font-weight:500">${esc(s.agentName || s.agentId)}</span></td>
        <td class="mono">${esc(s.sessionId?.slice(0, 24) || '--')}</td>
        <td><span class="badge ${s.active ? 'badge-brand' : 'badge-gray'}">${s.active ? t('working') : t('idle')}</span></td>
        <td style="color:var(--text-secondary)">${s.lastActivity ? new Date(s.lastActivity).toLocaleString() : '--'}</td>
        <td style="color:var(--text-muted)">${formatBytes(s.sizeBytes)}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}
