'use strict';
// ─────────────────────────────────────────────
// 页面：快捷操作
// ─────────────────────────────────────────────
async function renderQuickOps(container) {
  let health = {};
  try { health = await api('GET', '/api/sys-health') || {}; } catch {}
  const gw = health.gateway || {};
  const gwAlive = gw.alive;

  container.innerHTML = `
    <div class="card mb-4">
      <div class="card-body" style="padding:20px">
        <div style="display:flex;align-items:center;gap:12px">
          <div id="qopsStatusIcon" style="width:48px;height:48px;border-radius:var(--radius-md);background:${gwAlive ? 'var(--green-bg)' : 'var(--bg-subtle)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span id="qopsStatusDot" class="status-dot ${gwAlive ? 'dot-online' : 'dot-offline'}" style="width:10px;height:10px"></span>
          </div>
          <div style="flex:1">
            <div id="qopsStatusTitle" style="font-size:15px;font-weight:650;margin-bottom:3px">${gwAlive ? 'Gateway 运行中' : 'Gateway 离线'}</div>
            <div id="qopsStatusDesc" style="font-size:12.5px;color:var(--text-muted)">
              ${gwAlive ? `端口 ${gw.port || 18789} · 可执行操作命令` : '请先启动 OpenClaw Gateway'}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
      <div class="card" style="cursor:pointer;transition:all 0.15s" onclick="quickRestart()" onmouseenter="this.style.borderColor='var(--brand-border)';this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.borderColor='';this.style.boxShadow=''">
        <div class="card-body" style="padding:20px">
          <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--brand-light);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
            <svg width="20" height="20" style="color:var(--brand)"><use href="#ico-refresh"/></svg>
          </div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">重启 Gateway</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.5">应用配置变更并重新加载</div>
        </div>
      </div>

      <div class="card" style="cursor:pointer;transition:all 0.15s" onclick="quickStop()" onmouseenter="this.style.borderColor='rgba(220,53,69,0.28)';this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.borderColor='';this.style.boxShadow=''">
        <div class="card-body" style="padding:20px">
          <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--red-bg);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
            <svg width="20" height="20" style="color:var(--red)"><use href="#ico-warning"/></svg>
          </div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">停止 Gateway</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.5">完全关闭网关进程</div>
        </div>
      </div>

      <div class="card" style="cursor:pointer;transition:all 0.15s" onclick="quickStart()" onmouseenter="this.style.borderColor='rgba(30,138,76,0.28)';this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.borderColor='';this.style.boxShadow=''">
        <div class="card-body" style="padding:20px">
          <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--green-bg);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
            <svg width="20" height="20" style="color:var(--green)"><use href="#ico-zap"/></svg>
          </div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">启动 Gateway</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.5">初次启动或重新开启服务</div>
        </div>
      </div>

      <div class="card" style="cursor:pointer;transition:all 0.15s" onclick="quickDoctor()" onmouseenter="this.style.borderColor='rgba(29,95,166,0.28)';this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.borderColor='';this.style.boxShadow=''">
        <div class="card-body" style="padding:20px">
          <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--blue-bg);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
            <svg width="20" height="20" style="color:var(--blue)"><use href="#ico-heart"/></svg>
          </div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">诊断修复</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.5">自动检查并修复常见问题</div>
        </div>
      </div>

      <div class="card" style="cursor:pointer;transition:all 0.15s" onclick="quickUpdate()" onmouseenter="this.style.borderColor='var(--border-strong)';this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.borderColor='';this.style.boxShadow=''">
        <div class="card-body" style="padding:20px">
          <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;margin-bottom:14px">
            <svg width="20" height="20" style="color:var(--text-secondary)"><use href="#ico-overview"/></svg>
          </div>
          <div style="font-size:14px;font-weight:600;margin-bottom:4px">检查更新</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.5">获取 OpenClaw 最新版本</div>
        </div>
      </div>
    </div>

    <div class="card" id="doctorResultCard" style="margin-top:16px;display:none">
      <div class="card-header"><div class="card-title">
        <svg class="card-title-icon" width="18" height="18" id="opsOutputIcon"><use href="#ico-heart"/></svg>
        <span id="opsOutputTitle">操作日志</span>
      </div></div>
      <div class="card-body">
        <pre id="doctorOut" style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);white-space:pre-wrap;line-height:1.7"></pre>
      </div>
    </div>

    <div class="card" id="watchdogCard" style="margin-top:16px">
      <div class="card-header">
        <div class="card-title">
          <svg class="card-title-icon" width="18" height="18"><use href="#ico-zap"/></svg>
          <span>看门狗</span>
        </div>
        <span style="font-size:12px;color:var(--text-muted)">离线 2 次自动重启</span>
      </div>
      <div class="card-body" style="padding:20px">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:10px">
            <label class="toggle" style="margin-left:0">
              <input type="checkbox" id="watchdogToggle">
              <span class="toggle-track"></span>
            </label>
            <span style="font-size:13px;font-weight:600">启用守护</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-left:auto">
            <span style="font-size:13px;color:var(--text-muted)">间隔</span>
            <input type="number" id="watchdogInterval" class="form-input" style="width:72px;text-align:center" min="10" max="3600" value="60">
            <span style="font-size:13px;color:var(--text-muted)">秒</span>
            <button class="btn btn-primary btn-sm" onclick="saveWatchdogSettings()">保存</button>
          </div>
        </div>
        <div style="display:flex;gap:24px;padding:12px;background:var(--bg-subtle);border-radius:var(--radius-sm);margin-bottom:12px">
          <div>
            <div style="font-size:10.5px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:3px">下次检测</div>
            <div id="watchdogCountdown" style="font-family:var(--font-mono);font-size:13px;font-weight:600">—</div>
          </div>
          <div>
            <div style="font-size:10.5px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:3px">连续离线</div>
            <div id="watchdogMisses" style="font-family:var(--font-mono);font-size:13px;font-weight:600">0</div>
          </div>
          <div>
            <div style="font-size:10.5px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:3px">上次检测</div>
            <div id="watchdogLastCheck" style="font-family:var(--font-mono);font-size:13px">从未</div>
          </div>
        </div>
        <pre id="watchdogLog" style="font-family:var(--font-mono);font-size:11.5px;color:var(--text-secondary);white-space:pre-wrap;line-height:1.7;max-height:220px;overflow-y:auto;padding:8px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);margin:0">（暂无日志）</pre>
      </div>
    </div>`;

  initWatchdog();
}

function showOpsOutput(icon, title, content) {
  const card = document.getElementById('doctorResultCard');
  const out = document.getElementById('doctorOut');
  const titleEl = document.getElementById('opsOutputTitle');
  const iconEl = document.getElementById('opsOutputIcon');
  if (!card) return;
  if (titleEl) titleEl.textContent = title;
  if (iconEl) iconEl.querySelector('use').setAttribute('href', `#ico-${icon}`);
  card.style.display = 'block';
  if (out) out.textContent = content;
}

async function refreshQuickOpsStatus() {
  let health = {};
  try { health = await api('GET', '/api/sys-health') || {}; } catch {}
  const gw = health.gateway || {};
  const gwAlive = gw.alive;

  const icon = document.getElementById('qopsStatusIcon');
  const dot = document.getElementById('qopsStatusDot');
  const title = document.getElementById('qopsStatusTitle');
  const desc = document.getElementById('qopsStatusDesc');
  if (!icon) return false;

  icon.style.background = gwAlive ? 'var(--green-bg)' : 'var(--bg-subtle)';
  dot.className = `status-dot ${gwAlive ? 'dot-online' : 'dot-offline'}`;
  title.textContent = gwAlive ? 'Gateway 运行中' : 'Gateway 离线';
  desc.textContent = gwAlive ? `端口 ${gw.port || 18789} · 可执行操作命令` : '请先启动 OpenClaw Gateway';

  if (typeof pollHealth === 'function') pollHealth();
  return gwAlive;
}

// 轮询直到 gateway 达到期望状态（alive=true 或 alive=false），最多等 15s
function pollUntilGateway(expectAlive, interval = 1000, maxAttempts = 15) {
  let attempts = 0;
  const check = async () => {
    const alive = await refreshQuickOpsStatus();
    if (alive === expectAlive) return; // 达到目标，停止
    attempts++;
    if (attempts < maxAttempts) setTimeout(check, interval);
  };
  setTimeout(check, interval);
}

function quickRestart() {
  confirmDialog('重启 Gateway', '确定平滑重启 OpenClaw 网关主进程吗？', async () => {
    toast('正在重启 Gateway...', 'info');
    showOpsOutput('refresh', '重启日志', '正在执行...');
    try {
      const data = await api('POST', '/api/cmd/restart');
      showOpsOutput('refresh', '重启日志', data.output || data.message || '');
      if (data.success) {
        toast(data.message || '重启完成', 'success');
        pollUntilGateway(true);
      } else {
        toast('重启失败: ' + (data.error || '未知错误'), 'error');
      }
    } catch (e) { toast('重启请求失败: ' + e.message, 'error'); }
  }, true);
}

function quickStop() {
  confirmDialog('停止 Gateway', '确定停止 OpenClaw 网关进程吗？停止后所有服务将不可用。', async () => {
    toast('正在停止 Gateway...', 'info');
    showOpsOutput('warning', '停止日志', '正在执行...');
    try {
      const data = await api('POST', '/api/cmd/stop');
      showOpsOutput('warning', '停止日志', data.output || data.message || '');
      if (data.success) {
        toast(data.message || 'Gateway 已停止', 'success');
        pollUntilGateway(false, 500);
      } else {
        toast('停止失败: ' + (data.error || '未知错误'), 'error');
      }
    } catch (e) { toast('停止请求失败: ' + e.message, 'error'); }
  }, true);
}

async function quickStart() {
  // 先检查当前状态，已在运行则提示，不重复启动
  let health = {};
  try { health = await api('GET', '/api/sys-health') || {}; } catch {}
  if (health.gateway && health.gateway.alive) {
    toast('Gateway 已在运行中，无需重复启动', 'info');
    return;
  }
  confirmDialog('启动 Gateway', '确定启动 OpenClaw 网关核心吗？', async () => {
    toast('正在启动 Gateway...', 'info');
    showOpsOutput('zap', '启动日志', '正在执行...');
    try {
      const data = await api('POST', '/api/cmd/start');
      showOpsOutput('zap', '启动日志', data.output || data.message || '');
      if (data.success) {
        toast(data.message || '启动命令已发送', 'success');
        pollUntilGateway(true);
      } else {
        toast('启动失败: ' + (data.error || '未知错误'), 'error');
      }
    } catch (e) { toast('启动请求失败: ' + e.message, 'error'); }
  });
}

function quickDoctor() {
  confirmDialog('诊断修复', '确定执行 openclaw doctor --fix 进行配置修复吗？', async () => {
    toast('正在执行诊断...', 'info');
    const resultCard = document.getElementById('doctorResultCard');
    const doctorOut = document.getElementById('doctorOut');
    if (resultCard) resultCard.style.display = 'block';
    if (doctorOut) doctorOut.textContent = t('doctor_running') + '\n';
    try {
      const data = await api('POST', '/api/cmd/doctor');
      const output = [];
      if (data.stdout) output.push(data.stdout);
      if (data.stderr) output.push(data.stderr);
      if (data.error) output.push('Error: ' + data.error);
      if (doctorOut) doctorOut.textContent = output.join('\n') || '(无输出)';
      toast(data.success ? '诊断完成' : '诊断发现问题', data.success ? 'success' : 'warn');
    } catch (e) {
      if (doctorOut) doctorOut.textContent = '请求失败: ' + e.message;
      toast('诊断请求失败: ' + e.message, 'error');
    }
  });
}

// 持久化保存升级前版本号, 刷新页面后仍可回退
function _getPreUpgradeVersion() {
  try { return localStorage.getItem('openclaw_pre_upgrade_ver') || null; } catch { return null; }
}
function _setPreUpgradeVersion(ver) {
  try { if (ver) localStorage.setItem('openclaw_pre_upgrade_ver', ver); else localStorage.removeItem('openclaw_pre_upgrade_ver'); } catch {}
}

function quickUpdate() {
  toast('正在检查更新...', 'info');
  showOpsOutput('overview', '版本检查', '正在查询 NPM 仓库...\n');
  api('POST', '/api/cmd/upgrade').then(data => {
    if (data.success) {
      _setPreUpgradeVersion(data.current || null);
      let content = `当前版本: ${data.current || '未知'}\n最新版本: ${data.latest || '未知'}\n`;
      if (data.needsUpdate) {
        content += '\n⬆ 发现新版本！';
        toast('发现新版本可升级', 'warn');
      } else {
        content += '\n✓ 已是最新版本';
        toast('已是最新版本', 'success');
      }
      showOpsOutput('overview', '版本检查', content);
      // 显示操作按钮
      const savedPrev = _getPreUpgradeVersion();
      if (data.needsUpdate) {
        showUpgradeFooter(`将执行 npm install -g openclaw@latest`,
          `<button class="btn btn-primary btn-sm" id="doUpgradeBtn" onclick="doUpgrade()">一键升级</button>`);
      } else if (savedPrev && savedPrev !== data.current) {
        // 已升级过但还能回退
        showUpgradeFooter(`当前: ${data.current}  ←  旧版: ${savedPrev}`,
          `<button class="btn btn-sm" id="doRollbackBtn" onclick="doRollback('${savedPrev}')">回退到 ${savedPrev}</button>`);
      }
    } else {
      showOpsOutput('overview', '版本检查', '检查失败: ' + (data.error || ''));
      toast('版本检查失败', 'error');
    }
  }).catch(e => {
    showOpsOutput('overview', '版本检查', '请求失败: ' + e.message);
    toast('版本检查请求失败: ' + e.message, 'error');
  });
}

function showUpgradeFooter(hint, buttonsHtml) {
  const card = document.getElementById('doctorResultCard');
  if (!card) return;
  const oldFooter = card.querySelector('.upgrade-footer');
  if (oldFooter) oldFooter.remove();
  const footer = document.createElement('div');
  footer.className = 'upgrade-footer';
  footer.style.cssText = 'padding:12px 16px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap';
  footer.innerHTML = `<span style="font-size:12.5px;color:var(--text-muted)">${hint}</span><div style="display:flex;gap:8px">${buttonsHtml}</div>`;
  card.appendChild(footer);
}

async function doUpgrade() {
  const btn = document.getElementById('doUpgradeBtn');
  if (btn) { btn.disabled = true; btn.textContent = '升级中...'; }
  showOpsOutput('overview', '正在升级', '执行 npm install -g openclaw@latest ...\n请耐心等待，可能需要 1-2 分钟\n');
  toast('正在执行升级...', 'info');
  try {
    const data = await api('POST', '/api/cmd/do-upgrade', { version: 'latest' });
    let output = '';
    if (data.stdout) output += data.stdout + '\n';
    if (data.stderr) output += data.stderr + '\n';
    if (data.success) {
      output += `\n✓ 升级完成！新版本: ${data.newVersion || '未知'}`;
      toast('升级完成！建议重启 Gateway', 'success');
      showOpsOutput('overview', '升级结果', output);
      // 显示回退按钮
      const rollbackBtns = _getPreUpgradeVersion()
        ? `<button class="btn btn-sm" id="doRollbackBtn" onclick="doRollback('${_getPreUpgradeVersion()}')">回退到 ${_getPreUpgradeVersion()}</button>`
        : '';
      showUpgradeFooter(`当前: ${data.newVersion || '?'}  ←  旧版: ${_getPreUpgradeVersion() || '?'}`, rollbackBtns);
    } else {
      output += `\n✗ 升级失败: ${data.error || '未知错误'}`;
      toast('升级失败', 'error');
      showOpsOutput('overview', '升级结果', output);
      // 失败也显示回退和重试
      const btns = [
        `<button class="btn btn-primary btn-sm" id="doUpgradeBtn" onclick="doUpgrade()">重试</button>`,
        _getPreUpgradeVersion() ? `<button class="btn btn-sm" id="doRollbackBtn" onclick="doRollback('${_getPreUpgradeVersion()}')">回退到 ${_getPreUpgradeVersion()}</button>` : '',
      ].filter(Boolean).join('');
      showUpgradeFooter('升级失败', btns);
    }
  } catch (e) {
    showOpsOutput('overview', '升级结果', '请求失败: ' + e.message);
    toast('升级请求失败: ' + e.message, 'error');
  }
}

async function doRollback(version) {
  confirmDialog('回退版本', `确定回退到 openclaw@${version} 吗？`, async () => {
    const btn = document.getElementById('doRollbackBtn');
    if (btn) { btn.disabled = true; btn.textContent = '回退中...'; }
    showOpsOutput('overview', '正在回退', `执行 npm install -g openclaw@${version} ...\n请耐心等待\n`);
    toast('正在回退版本...', 'info');
    try {
      const data = await api('POST', '/api/cmd/do-upgrade', { version });
      let output = '';
      if (data.stdout) output += data.stdout + '\n';
      if (data.stderr) output += data.stderr + '\n';
      if (data.success) {
        output += `\n✓ 回退完成！当前版本: ${data.newVersion || '未知'}`;
        toast('回退完成！建议重启 Gateway', 'success');
        showOpsOutput('overview', '回退结果', output);
        _setPreUpgradeVersion(null); // 清除记录
        showUpgradeFooter(`已回退到 ${data.newVersion || version}`, '');
      } else {
        output += `\n✗ 回退失败: ${data.error || '未知错误'}`;
        toast('回退失败', 'error');
        showOpsOutput('overview', '回退结果', output);
        if (btn) { btn.disabled = false; btn.textContent = `回退到 ${version}`; }
      }
    } catch (e) {
      showOpsOutput('overview', '回退结果', '请求失败: ' + e.message);
      toast('回退请求失败: ' + e.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = `回退到 ${version}`; }
    }
  });
}

// ─────────────────────────────────────────────
// 看门狗前端逻辑
// ─────────────────────────────────────────────
let _wdCdTimer = null;
let _wdPollTimer = null;
let _wdLastAutoStart = null;
let _statusRefreshTimer = null;

async function initWatchdog() {
  // 页面重进时清理旧计时器
  if (_wdCdTimer) { clearInterval(_wdCdTimer); _wdCdTimer = null; }
  if (_wdPollTimer) { clearInterval(_wdPollTimer); _wdPollTimer = null; }
  if (_statusRefreshTimer) { clearInterval(_statusRefreshTimer); _statusRefreshTimer = null; }

  // 常规状态刷新：每 8 秒刷新 Gateway 状态卡片（不依赖看门狗是否启用）
  _statusRefreshTimer = setInterval(() => {
    if (location.hash !== '#quickops') {
      clearInterval(_statusRefreshTimer); _statusRefreshTimer = null; return;
    }
    if (typeof refreshQuickOpsStatus === 'function') refreshQuickOpsStatus();
  }, 8000);

  // 离开页面时立即停止所有计时器（一次性监听）
  function onLeave() {
    if (_wdCdTimer) { clearInterval(_wdCdTimer); _wdCdTimer = null; }
    if (_wdPollTimer) { clearInterval(_wdPollTimer); _wdPollTimer = null; }
    if (_statusRefreshTimer) { clearInterval(_statusRefreshTimer); _statusRefreshTimer = null; }
    window.removeEventListener('hashchange', onLeave);
  }
  window.addEventListener('hashchange', onLeave);

  try {
    const data = await api('GET', '/api/watchdog');
    applyWatchdogData(data);
    if (data.enabled) startWatchdogPolling();
  } catch {}
}

function applyWatchdogData(data) {
  if (!data) return;
  // autoStartedAt 变化 → 看门狗刚触发了自动启动，立即高频轮询直到确认上线
  if (data.autoStartedAt && data.autoStartedAt !== _wdLastAutoStart) {
    _wdLastAutoStart = data.autoStartedAt;
    if (typeof pollUntilGateway === 'function') pollUntilGateway(true);
  }
  // miss 计数变化时立即同步顶部 Gateway 状态卡片
  const prevMisses = parseInt(document.getElementById('watchdogMisses')?.textContent) || 0;
  if (prevMisses !== (data.consecutiveMisses || 0)) {
    if (typeof refreshQuickOpsStatus === 'function') refreshQuickOpsStatus();
  }
  const toggle = document.getElementById('watchdogToggle');
  const intInput = document.getElementById('watchdogInterval');
  const missesEl = document.getElementById('watchdogMisses');
  const lastEl = document.getElementById('watchdogLastCheck');
  const logEl = document.getElementById('watchdogLog');
  if (toggle) toggle.checked = !!data.enabled;
  if (intInput && document.activeElement !== intInput) intInput.value = data.interval || 60;
  if (missesEl) {
    missesEl.textContent = data.consecutiveMisses || 0;
    missesEl.style.color = (data.consecutiveMisses > 0) ? 'var(--red)' : 'var(--text-primary)';
  }
  if (lastEl) lastEl.textContent = data.lastCheck
    ? new Date(data.lastCheck).toLocaleTimeString('zh-CN', { hour12: false })
    : '从未';
  if (logEl) {
    logEl.textContent = (data.log || []).join('\n') || '（暂无日志）';
    logEl.scrollTop = logEl.scrollHeight;
  }
  updateWatchdogCountdown(data.nextCheckAt);
}

function updateWatchdogCountdown(nextCheckAt) {
  if (_wdCdTimer) { clearInterval(_wdCdTimer); _wdCdTimer = null; }
  const el = document.getElementById('watchdogCountdown');
  if (!el) return;
  if (!nextCheckAt) { el.textContent = '—'; return; }
  const target = new Date(nextCheckAt).getTime();
  function tick() {
    if (location.hash !== '#quickops') { clearInterval(_wdCdTimer); _wdCdTimer = null; return; }
    const cdEl = document.getElementById('watchdogCountdown');
    if (!cdEl) { clearInterval(_wdCdTimer); _wdCdTimer = null; return; }
    const rem = Math.max(0, Math.floor((target - Date.now()) / 1000));
    cdEl.textContent = rem > 0 ? `${rem}s` : '检测中...';
    if (rem <= 0) { clearInterval(_wdCdTimer); _wdCdTimer = null; }
  }
  tick();
  _wdCdTimer = setInterval(tick, 1000);
}

function startWatchdogPolling() {
  if (_wdPollTimer) clearInterval(_wdPollTimer);
  // 轮询间隔自适应：取后端检测间隔的一半，最少 5 秒
  const intEl = document.getElementById('watchdogInterval');
  const backendInterval = parseInt(intEl?.value) || 60;
  const pollMs = Math.max(5, Math.floor(backendInterval / 2)) * 1000;
  _wdPollTimer = setInterval(async () => {
    if (location.hash !== '#quickops') {
      clearInterval(_wdPollTimer); _wdPollTimer = null; return;
    }
    try {
      const data = await api('GET', '/api/watchdog');
      applyWatchdogData(data);
    } catch {}
  }, pollMs);
}

async function saveWatchdogSettings() {
  const toggle = document.getElementById('watchdogToggle');
  const intInput = document.getElementById('watchdogInterval');
  if (!toggle || !intInput) return;
  const enabled = toggle.checked;
  const interval = Math.max(10, parseInt(intInput.value) || 60);
  intInput.value = interval;
  try {
    await api('POST', '/api/watchdog', { enabled, interval });
    const data = await api('GET', '/api/watchdog');
    applyWatchdogData(data);
    if (enabled) {
      startWatchdogPolling();
    } else {
      if (_wdPollTimer) { clearInterval(_wdPollTimer); _wdPollTimer = null; }
    }
    toast(enabled ? '看门狗已启用' : '看门狗已停用', 'success');
  } catch (e) {
    toast('保存失败: ' + e.message, 'error');
  }
}

