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

    <div class="overview-quick-strip" id="agentStripCard">
      <div class="overview-strip-row">
        <div class="overview-strip-left">
          <svg width="16" height="16" style="opacity:0.6"><use href="#ico-agents"/></svg>
          <span class="overview-strip-label" id="agentStripSummary">加载中...</span>
        </div>
        <a href="#agents" onclick="navigate('agents');return false" class="overview-strip-link">查看详情 →</a>
      </div>
      <div id="agentStripDots" class="overview-strip-dots"></div>
    </div>

    <div class="overview-quick-strip" id="quickLinksCard">
      <div class="overview-strip-row" style="flex-wrap:wrap;gap:8px">
        <button class="overview-quick-btn" onclick="navigate('quickops')">
          <svg width="14" height="14"><use href="#ico-quickops"/></svg> 快捷操作
        </button>
        <button class="overview-quick-btn" onclick="navigate('providers')">
          <svg width="14" height="14"><use href="#ico-provider"/></svg> 供应商
        </button>
        <button class="overview-quick-btn" onclick="navigate('logs')">
          <svg width="14" height="14"><use href="#ico-logs"/></svg> 日志
        </button>
        <button class="overview-quick-btn" onclick="navigate('settings')">
          <svg width="14" height="14"><use href="#ico-settings"/></svg> 设置
        </button>
      </div>
    </div>

    <style>
      .overview-quick-strip {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px 18px;
        margin-bottom: 14px;
      }
      .overview-strip-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .overview-strip-left {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .overview-strip-label {
        font-size: 13.5px;
        color: var(--text-secondary);
        font-weight: 500;
      }
      .overview-strip-link {
        font-size: 12.5px;
        color: var(--brand);
        text-decoration: none;
        white-space: nowrap;
        font-weight: 500;
      }
      .overview-strip-link:hover { text-decoration: underline; }
      .overview-strip-dots {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
        flex-wrap: wrap;
      }
      .overview-agent-dot {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px 4px 8px;
        border-radius: 20px;
        font-size: 12.5px;
        font-weight: 500;
        background: var(--bg-secondary);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
      }
      .overview-agent-dot:hover {
        border-color: var(--border-brand);
        background: var(--bg-hover);
      }
      .overview-agent-dot-status {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .overview-agent-dot-status.is-working { background: var(--green); box-shadow: 0 0 6px var(--green); }
      .overview-agent-dot-status.is-idle { background: var(--text-muted); opacity: 0.5; }
      .overview-quick-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .overview-quick-btn:hover {
        background: var(--bg-hover);
        border-color: var(--border-brand);
        color: var(--brand);
      }
    </style>`;

  // 拉取数据
  const [health, agents] = await Promise.allSettled([
    api('GET', '/api/sys-health'),
    api('GET', '/api/agents'),
  ]);

  if (health.status === 'fulfilled') updateOverviewStats(health.value);
  if (agents.status === 'fulfilled') renderAgentStrip(agents.value);
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

// 概览页 Agent 摘要条：精简显示 + 点击跳转
function renderAgentStrip(agents) {
  const summaryEl = document.getElementById('agentStripSummary');
  const dotsEl = document.getElementById('agentStripDots');
  if (!summaryEl || !dotsEl) return;

  const list = (agents && agents.list) || [];
  if (!list.length) {
    summaryEl.textContent = '暂无 Agent';
    dotsEl.innerHTML = '';
    return;
  }

  const working = list.filter(a => a._status === 'working').length;
  const totalSessions = list.reduce((sum, a) => sum + (a._sessionCount || 0), 0);

  summaryEl.innerHTML = `<strong>${list.length}</strong> 个 Agent` +
    (working > 0 ? ` · <span style="color:var(--green)">${working} 个运行中</span>` : ' · 全部空闲') +
    ` · ${totalSessions} 个会话`;

  dotsEl.innerHTML = list.map(a => {
    const avatar = typeof getAgentAvatar === 'function' ? getAgentAvatar(a.id) : null;
    const emoji = avatar ? avatar.emoji : '🤖';
    const isWorking = a._status === 'working';
    return `<div class="overview-agent-dot" onclick="navigate('agents')" title="${esc(a.id)}: ${isWorking ? '运行中' : '空闲'}${a._sessionCount ? ' · ' + a._sessionCount + ' 个会话' : ''}">
      <span class="overview-agent-dot-status ${isWorking ? 'is-working' : 'is-idle'}"></span>
      <span>${emoji}</span>
      <span>${esc(a.name || a.id)}</span>
    </div>`;
  }).join('');
}
