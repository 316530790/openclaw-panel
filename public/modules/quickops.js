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
    </div>`;
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

function quickStart() {
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

function quickUpdate() {
  toast('正在检查更新...', 'info');
  const resultCard = document.getElementById('doctorResultCard');
  const doctorOut = document.getElementById('doctorOut');
  if (resultCard) resultCard.style.display = 'block';
  if (doctorOut) doctorOut.textContent = '正在查询 NPM 仓库...\n';
  api('POST', '/api/cmd/upgrade').then(data => {
    if (data.success) {
      if (doctorOut) doctorOut.textContent = data.stdout || `当前: ${data.current}\n最新: ${data.latest}`;
      toast(data.needsUpdate ? '发现新版本可升级' : '已是最新版本', data.needsUpdate ? 'warn' : 'success');
    } else {
      if (doctorOut) doctorOut.textContent = '检查失败: ' + (data.error || '');
      toast('版本检查失败', 'error');
    }
  }).catch(e => {
    if (doctorOut) doctorOut.textContent = '请求失败: ' + e.message;
    toast('版本检查请求失败: ' + e.message, 'error');
  });
}

