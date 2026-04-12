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

    <div class="ov-row">
      <div class="ov-col ov-col-main">
        <div class="card ov-agent-card" id="ovAgentCard">
          <div class="card-header">
            <div class="card-title">
              <svg class="card-title-icon" width="18" height="18"><use href="#ico-agents"/></svg>
              Agent 概况
            </div>
            <a href="#agents" onclick="navigate('agents');return false" class="ov-link">管理 →</a>
          </div>
          <div class="card-body" id="ovAgentBody">
            <div class="empty-state" style="padding:24px"><div class="spinner"></div></div>
          </div>
        </div>

        <div class="card ov-gateway-card" id="ovGatewayCard">
          <div class="card-header">
            <div class="card-title">
              <svg class="card-title-icon" width="18" height="18"><use href="#ico-timer"/></svg>
              Gateway 状态
            </div>
          </div>
          <div class="card-body" id="ovGatewayBody">
            <div class="ov-gw-grid" id="ovGatewayGrid">
              <div class="ov-gw-item">
                <span class="ov-gw-label">状态</span>
                <span class="ov-gw-value" id="ovGwStatus">检测中...</span>
              </div>
              <div class="ov-gw-item">
                <span class="ov-gw-label">端口</span>
                <span class="ov-gw-value" id="ovGwPort">--</span>
              </div>
              <div class="ov-gw-item">
                <span class="ov-gw-label">平台</span>
                <span class="ov-gw-value" id="ovGwPlatform">--</span>
              </div>
              <div class="ov-gw-item">
                <span class="ov-gw-label">版本</span>
                <span class="ov-gw-value" id="ovGwVersion">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ov-col ov-col-side">
        <div class="card ov-quick-card">
          <div class="card-header">
            <div class="card-title">
              <svg class="card-title-icon" width="18" height="18"><use href="#ico-zap"/></svg>
              快速入口
            </div>
          </div>
          <div class="card-body" style="padding:12px 16px">
            <div class="ov-quick-grid">
              <a class="ov-quick-item" href="#quickops" onclick="navigate('quickops');return false">
                <div class="ov-quick-icon" style="background:#fff0e6">⚡</div>
                <span>快捷操作</span>
              </a>
              <a class="ov-quick-item" href="#providers" onclick="navigate('providers');return false">
                <div class="ov-quick-icon" style="background:#e8f5e9">🔑</div>
                <span>供应商</span>
              </a>
              <a class="ov-quick-item" href="#logs" onclick="navigate('logs');return false">
                <div class="ov-quick-icon" style="background:#e3f2fd">📋</div>
                <span>日志</span>
              </a>
              <a class="ov-quick-item" href="#tools" onclick="navigate('tools');return false">
                <div class="ov-quick-icon" style="background:#fff3e0">🔧</div>
                <span>工具</span>
              </a>
              <a class="ov-quick-item" href="#settings" onclick="navigate('settings');return false">
                <div class="ov-quick-icon" style="background:#f3e5f5">⚙️</div>
                <span>设置</span>
              </a>
              <a class="ov-quick-item" href="#mcp" onclick="navigate('mcp');return false">
                <div class="ov-quick-icon" style="background:#e0f2f1">🧩</div>
                <span>MCP</span>
              </a>
            </div>
          </div>
        </div>

        <div class="card ov-session-card">
          <div class="card-header">
            <div class="card-title">
              <svg class="card-title-icon" width="18" height="18"><use href="#ico-logs"/></svg>
              最近会话
            </div>
            <a href="#agents" onclick="navigate('agents');return false" class="ov-link">全部 →</a>
          </div>
          <div class="card-body" style="padding:0" id="ovSessionBody">
            <div class="empty-state" style="padding:20px"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .ov-row {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 16px;
        align-items: start;
      }
      @media (max-width: 960px) {
        .ov-row { grid-template-columns: 1fr; }
      }
      .ov-col { display: flex; flex-direction: column; gap: 16px; }
      .ov-link {
        font-size: 12.5px;
        color: var(--brand);
        text-decoration: none;
        font-weight: 500;
        white-space: nowrap;
      }
      .ov-link:hover { text-decoration: underline; }

      /* Agent 概况卡 */
      .ov-agent-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .ov-agent-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        border-radius: 10px;
        background: var(--bg-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
      }
      .ov-agent-item:hover {
        border-color: var(--border-brand);
        background: var(--bg-hover);
        transform: translateX(2px);
      }
      .ov-agent-avatar {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
        position: relative;
      }
      .ov-agent-dot {
        position: absolute;
        bottom: -1px;
        right: -1px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid var(--bg-card);
      }
      .ov-agent-dot.is-working { background: var(--green); box-shadow: 0 0 6px var(--green); }
      .ov-agent-dot.is-idle { background: #ccc; }
      .ov-agent-meta { flex: 1; min-width: 0; }
      .ov-agent-name { font-weight: 600; font-size: 14px; color: var(--text-primary); }
      .ov-agent-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center; gap: 8px; }
      .ov-agent-stats { display: flex; gap: 8px; flex-shrink: 0; }
      .ov-agent-stat {
        text-align: center;
        padding: 4px 10px;
        border-radius: 6px;
        background: var(--bg-card);
      }
      .ov-agent-stat-val { font-size: 16px; font-weight: 700; color: var(--text-primary); }
      .ov-agent-stat-label { font-size: 10px; color: var(--text-muted); margin-top: 1px; }

      /* Gateway 状态 */
      .ov-gw-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .ov-gw-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px 14px;
        border-radius: 8px;
        background: var(--bg-secondary);
      }
      .ov-gw-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
      .ov-gw-value { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }

      /* 快速入口 */
      .ov-quick-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
      }
      .ov-quick-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px 6px;
        border-radius: 10px;
        text-decoration: none;
        color: var(--text-secondary);
        font-size: 12px;
        font-weight: 500;
        transition: all 0.15s ease;
        border: 1px solid transparent;
      }
      .ov-quick-item:hover {
        background: var(--bg-secondary);
        border-color: var(--border);
        color: var(--text-primary);
        transform: translateY(-1px);
      }
      .ov-quick-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        line-height: 1;
      }

      /* 最近会话 */
      .ov-session-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        border-bottom: 1px solid var(--border);
        font-size: 13px;
      }
      .ov-session-item:last-child { border-bottom: none; }
      .ov-session-agent { font-weight: 600; color: var(--text-primary); min-width: 48px; }
      .ov-session-id { flex: 1; color: var(--text-muted); font-family: var(--font-mono); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ov-session-time { font-size: 11.5px; color: var(--text-muted); white-space: nowrap; }

      .ov-empty-hint {
        padding: 20px 16px;
        text-align: center;
        color: var(--text-muted);
        font-size: 13px;
      }
    </style>`;

  // 拉取数据
  const [health, agents, sessions] = await Promise.allSettled([
    api('GET', '/api/sys-health'),
    api('GET', '/api/agents'),
    api('GET', '/api/sessions'),
  ]);

  if (health.status === 'fulfilled') updateOverviewStats(health.value);
  if (agents.status === 'fulfilled') renderOvAgents(agents.value);
  if (sessions.status === 'fulfilled') renderOvSessions(sessions.value);
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

  updateCard('cpu', (data.cpu ?? '--') + '%', `${data.platform || ''} · ${data.cpu ?? '--'}% 利用率`, data.cpu);
  updateCard('mem', data.memUsedPct + '%',
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
    ocUp != null ? 'OpenClaw 进程运行时长' : '未检测到 OpenClaw',
    null,
    ocUp == null);

  // Gateway 信息
  if (data.gateway) {
    const statusEl = document.getElementById('ovGwStatus');
    if (statusEl) {
      statusEl.innerHTML = data.gateway.alive
        ? '<span style="color:var(--green)">● 在线</span>'
        : '<span style="color:var(--red)">● 离线</span>';
    }
    const portEl = document.getElementById('ovGwPort');
    if (portEl) portEl.textContent = data.gateway.port || '--';
  }
  const platEl = document.getElementById('ovGwPlatform');
  if (platEl) platEl.textContent = data.platform || os.platform?.() || '--';
  const verEl = document.getElementById('ovGwVersion');
  if (verEl && data.openclawVersion) verEl.textContent = data.openclawVersion;

  // 兼容侧边栏 Gateway
  const gwInfo = document.getElementById('quickGwInfo');
  if (gwInfo && data.gateway) {
    gwInfo.innerHTML = data.gateway.alive
      ? `<span style="color:var(--green)">● 在线</span> · 端口 ${data.gateway.port}`
      : `<span style="color:var(--red)">● 离线</span> · 端口 ${data.gateway.port}`;
  }
}

// Agent 概况（精简版，不重复 Agent 页面的完整卡片）
function renderOvAgents(agents) {
  const body = document.getElementById('ovAgentBody');
  if (!body) return;
  const list = (agents && agents.list) || [];

  if (!list.length) {
    body.innerHTML = '<div class="ov-empty-hint">暂未发现 Agent · <a href="#agents" onclick="navigate(\'agents\');return false" style="color:var(--brand)">前往配置</a></div>';
    return;
  }

  body.innerHTML = `<div class="ov-agent-list">${list.map(a => {
    const avatar = typeof getAgentAvatar === 'function' ? getAgentAvatar(a.id) : { emoji: '🤖', accent: '#8aa7ff' };
    const isWorking = a._status === 'working';
    const model = a.model
      ? (typeof a.model === 'object' ? a.model.primary : a.model)
      : (agents.defaults?.model ? (typeof agents.defaults.model === 'object' ? agents.defaults.model.primary : agents.defaults.model) : null);
    const modelShort = model ? model.split('/').pop() : null;
    const lastAct = a._lastActivity && typeof timeAgo === 'function' ? timeAgo(a._lastActivity) : null;

    return `
    <div class="ov-agent-item" onclick="navigate('agents')">
      <div class="ov-agent-avatar" style="background:${avatar.accent}20;border:1px solid ${avatar.accent}30">
        ${avatar.emoji}
        <div class="ov-agent-dot ${isWorking ? 'is-working' : 'is-idle'}"></div>
      </div>
      <div class="ov-agent-meta">
        <div class="ov-agent-name">${esc(a.name || a.id)}</div>
        <div class="ov-agent-sub">
          ${modelShort ? `<span class="badge badge-blue mono" style="font-size:10.5px;padding:1px 6px">${esc(modelShort)}</span>` : ''}
          ${a._lastChannel ? `<span>${esc(a._lastChannel)}</span>` : ''}
          ${lastAct ? `<span>${lastAct}</span>` : ''}
        </div>
      </div>
      <div class="ov-agent-stats">
        <div class="ov-agent-stat">
          <div class="ov-agent-stat-val">${a._sessionCount || 0}</div>
          <div class="ov-agent-stat-label">会话</div>
        </div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

// 最近会话（右侧紧凑列表，最多5条）
function renderOvSessions(sessions) {
  const body = document.getElementById('ovSessionBody');
  if (!body) return;

  if (!sessions || !sessions.length) {
    body.innerHTML = '<div class="ov-empty-hint">暂无会话记录</div>';
    return;
  }

  body.innerHTML = sessions.slice(0, 5).map(s => {
    const t = s.lastActivity && typeof timeAgo === 'function' ? timeAgo(s.lastActivity) : '--';
    return `
    <div class="ov-session-item">
      <span class="ov-session-agent">${esc(s.agentName || s.agentId || '--')}</span>
      <span class="ov-session-id">${esc(s.sessionId?.slice(0, 20) || '--')}</span>
      <span class="badge ${s.active ? 'badge-brand' : 'badge-gray'}" style="font-size:10.5px">${s.active ? '运行' : '空闲'}</span>
      <span class="ov-session-time">${t}</span>
    </div>`;
  }).join('');
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
