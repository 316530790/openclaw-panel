'use strict';

const os = require('os');
const { exec } = require('child_process');
const { readConfig } = require('../lib/config');
const { readBody, sendJson, sendError } = require('../lib/http-utils');
const { getOcCmd } = require('../lib/openclaw-bin');

function ts() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

// ─── 进程管理 ────────────────────────────────

// ─── Windows：用 PowerShell CimInstance 查进程 ──────────────────
function findGatewayPidsWin(callback) {
  const parse = out => out.split('\n').map(s => s.trim()).filter(s => /^\d+$/.test(s));
  const strict = `Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -like '*openclaw*gateway*' -and $_.CommandLine -notlike '*openclaw-panel*' -and $_.CommandLine -notlike '*server.js*' } | Select-Object -ExpandProperty ProcessId`;
  const loose  = `Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -like '*openclaw*' -and $_.CommandLine -notlike '*openclaw-panel*' -and $_.CommandLine -notlike '*server.js*' } | Select-Object -ExpandProperty ProcessId`;
  exec(strict, { shell: 'powershell', windowsHide: true, timeout: 5000 }, (err, stdout) => {
    const pids = (!err && stdout) ? parse(stdout) : [];
    if (pids.length > 0) return callback(pids);
    exec(loose, { shell: 'powershell', windowsHide: true, timeout: 5000 }, (err2, stdout2) => {
      callback((!err2 && stdout2) ? parse(stdout2) : []);
    });
  });
}

// ─── macOS：优先查占用 gateway 端口的进程，最准确 ──────────────
function findGatewayPidsMac(callback) {
  const selfPid = process.pid;
  const parse = out => out.split('\n').map(s => s.trim()).filter(s => /^\d+$/.test(s) && parseInt(s) !== selfPid);

  // 从配置读 gateway 端口，默认 18789
  let gwPort = 18789;
  try { const cfg = readConfig(); gwPort = (cfg && cfg.gateway && cfg.gateway.port) || 18789; } catch {}

  // 第一优先：lsof 查端口占用 —— 谁在监听端口谁就是 gateway，不靠进程名猜
  exec(`lsof -ti :${gwPort}`, { timeout: 3000 }, (err, stdout) => {
    const portPids = (!err && stdout) ? parse(stdout) : [];
    if (portPids.length > 0) return callback(portPids);

    // 第二：pgrep 按进程名，严格→宽松降级
    exec(`pgrep -f "openclaw.*gateway"`, { timeout: 3000 }, (err2, stdout2) => {
      const pids2 = (!err2 && stdout2) ? parse(stdout2) : [];
      if (pids2.length > 0) return callback(pids2);
      exec(`pgrep -f openclaw`, { timeout: 3000 }, (err3, stdout3) => {
        callback((!err3 && stdout3) ? parse(stdout3) : []);
      });
    });
  });
}

function findGatewayPids(callback) {
  if (os.platform() === 'win32') {
    findGatewayPidsWin(callback);
  } else {
    findGatewayPidsMac(callback);
  }
}

// ─── Windows：taskkill /F 强制终止 ──────────────────────────────
function killPidsWin(pids, lines) {
  const { execSync } = require('child_process');
  pids.forEach(pid => {
    const pidInt = parseInt(pid);
    try {
      // process.kill 在 Windows 上直接调用 TerminateProcess
      process.kill(pidInt);
      lines.push(`[${ts()}] 已停止进程 PID ${pid}`);
    } catch (e) {
      // 降级：execSync 确保 taskkill 同步完成再继续
      try {
        execSync(`taskkill /F /PID ${pidInt}`, { windowsHide: true, timeout: 3000 });
        lines.push(`[${ts()}] 强制终止进程 PID ${pid}`);
      } catch (e2) {
        lines.push(`[${ts()}] 终止进程 PID ${pid} 失败: ${e2.message}`);
      }
    }
  });
}

// ─── macOS：先 SIGTERM，1s 后若仍存活则 SIGKILL ─────────────────
function killPidsMac(pids, lines, done) {
  const { execSync } = require('child_process');
  // 先全部发 SIGTERM
  pids.forEach(pid => {
    try { process.kill(parseInt(pid), 'SIGTERM'); } catch {}
  });
  // 等 1s，检查哪些还活着，对它们补发 SIGKILL
  setTimeout(() => {
    pids.forEach(pid => {
      const pidInt = parseInt(pid);
      let alive = false;
      try { process.kill(pidInt, 0); alive = true; } catch {}  // signal 0 仅探活不发信号
      if (alive) {
        try {
          process.kill(pidInt, 'SIGKILL');
          lines.push(`[${ts()}] 强制终止进程 PID ${pid} (SIGKILL)`);
        } catch (e) {
          lines.push(`[${ts()}] 终止进程 PID ${pid} 失败: ${e.message}`);
        }
      } else {
        lines.push(`[${ts()}] 已停止进程 PID ${pid}`);
      }
    });
    done();
  }, 1000);
}

function killPids(pids, lines, done) {
  if (os.platform() === 'win32') {
    killPidsWin(pids, lines);
    done();
  } else {
    killPidsMac(pids, lines, done);
  }
}

// ─── 运维命令 Handler ────────────────────────

// 防止重复响应的工具函数
function makeResponder(res, lines, timeoutMs = 20000) {
  let done = false;
  const timer = setTimeout(() => {
    if (done) return;
    done = true;
    lines.push(`[${ts()}] 操作超时，请检查 Gateway 状态`);
    sendJson(res, { success: false, error: '操作超时', output: lines.join('\n') });
  }, timeoutMs);
  return function respond(data) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    sendJson(res, data);
  };
}

function handleCmdRestart(req, res) {
  const lines = [];
  lines.push(`[${ts()}] 正在查找 Gateway 进程...`);
  const respond = makeResponder(res, lines);
  findGatewayPids(pids => {
    if (pids.length > 0) {
      lines.push(`[${ts()}] 找到进程 PID: ${pids.join(', ')}`);
    } else {
      lines.push(`[${ts()}] 未找到运行中的进程，直接启动`);
    }
    const doStart = () => {
      lines.push(`[${ts()}] 等待进程退出...`);
      setTimeout(() => {
        try {
          const { cmd, shell } = getOcCmd('gateway run');
          lines.push(`[${ts()}] 正在启动新实例...`);
          const oc = exec(cmd, { detached: true, stdio: 'ignore', windowsHide: true, shell });
          try { oc.unref(); } catch {}
          lines.push(`[${ts()}] Gateway 已启动 (PID: ${oc.pid || '未知'})`);
          respond({ success: true, message: 'Gateway 重启完成', output: lines.join('\n') });
        } catch (e) {
          lines.push(`[${ts()}] 启动失败: ${e.message}`);
          respond({ success: false, error: e.message, output: lines.join('\n') });
        }
      }, 2000);
    };
    if (pids.length > 0) {
      killPids(pids, lines, doStart);
    } else {
      doStart();
    }
  });
}

function handleCmdStop(req, res) {
  const lines = [];
  lines.push(`[${ts()}] 正在查找 Gateway 进程...`);
  const respond = makeResponder(res, lines);
  findGatewayPids(pids => {
    if (pids.length === 0) {
      lines.push(`[${ts()}] 未找到运行中的 Gateway 进程`);
      return respond({ success: true, message: '未找到 Gateway 进程', output: lines.join('\n') });
    }
    lines.push(`[${ts()}] 找到进程 PID: ${pids.join(', ')}`);
    killPids(pids, lines, () => {
      lines.push(`[${ts()}] Gateway 已停止`);
      respond({ success: true, message: 'Gateway 已停止', output: lines.join('\n') });
    });
  });
}

function handleCmdStart(req, res) {
  const lines = [];
  lines.push(`[${ts()}] 正在启动 Gateway...`);
  try {
    const { cmd, shell } = getOcCmd('gateway run');
    lines.push(`[${ts()}] 执行: openclaw gateway run`);
    const oc = exec(cmd, { detached: true, stdio: 'ignore', windowsHide: true, shell });
    try { oc.unref(); } catch {}
    lines.push(`[${ts()}] 进程已启动 (PID: ${oc.pid || '未知'})`);
    sendJson(res, { success: true, message: 'Gateway 启动命令已发送', output: lines.join('\n') });
  } catch (e) {
    lines.push(`[${ts()}] 启动失败: ${e.message}`);
    sendJson(res, { success: false, error: e.message, output: lines.join('\n') });
  }
}

function handleCmdDoctor(req, res) {
  const { cmd, shell } = getOcCmd('doctor --fix');
  exec(cmd, { timeout: 30000, shell }, (err, stdout, stderr) => {
    sendJson(res, {
      success: !err,
      stdout: stdout || '',
      stderr: stderr || '',
      error: err ? err.message : undefined,
    });
  });
}

function cleanVersion(raw) {
  const s = (raw || '').trim();
  const m = s.match(/(\d+\.\d+\.\d+(?:[-.]\w+)*)/);
  return m ? m[1] : s;
}

function handleCmdUpgrade(req, res) {
  const isWin = os.platform() === 'win32';
  const shell = isWin ? 'powershell' : true;
  const verCmd = isWin ? 'openclaw.cmd --version' : 'openclaw --version';

  // 先取本地版本
  exec(verCmd, { timeout: 10000, shell }, (err2, stdout2) => {
    const currentVer = cleanVersion(stdout2);

    // 再查 npm registry 最新版（若包未发布到 npm 则跳过，仅返回本地版本）
    exec('npm view openclaw version', { timeout: 15000, shell }, (err, stdout) => {
      if (err) {
        // npm 查询失败（未发布或无网络）：只返回本地版本，不报错
        return sendJson(res, {
          success: true, latest: null, current: currentVer, needsUpdate: false,
          stdout: `当前版本: ${currentVer || '未知'}\n最新版本: 无法从 npm 获取（${err.message.split('\n')[0]}）`,
        });
      }
      const latestVer = (stdout || '').trim();
      const needsUpdate = !!(latestVer && currentVer && latestVer !== currentVer);
      sendJson(res, {
        success: true, latest: latestVer, current: currentVer, needsUpdate,
        stdout: `当前版本: ${currentVer || '未知'}\n最新版本: ${latestVer || '未知'}\n${needsUpdate ? '⬆ 发现新版本' : '✓ 已是最新版本'}`,
      });
    });
  });
}

function handleCmdDoUpgrade(req, res) {
  readBody(req).then(body => {
    const isWin = os.platform() === 'win32';
    const shell = isWin ? 'powershell' : true;
    const targetVer = (body && body.version) ? body.version : 'latest';
    const installCmd = `npm install -g openclaw@${targetVer}`;
    exec(installCmd, { timeout: 120000, shell }, (err, stdout, stderr) => {
      if (err) return sendJson(res, { success: false, error: err.message, stdout: stdout || '', stderr: stderr || '' });
      const verCmd = isWin ? 'openclaw.cmd --version' : 'openclaw --version';
      exec(verCmd, { timeout: 10000, shell }, (err2, stdout2) => {
        sendJson(res, { success: true, newVersion: cleanVersion(stdout2), stdout: stdout || '', stderr: stderr || '' });
      });
    });
  }).catch(e => sendError(res, e.message, 400));
}

module.exports = {
  handleCmdRestart, handleCmdStop, handleCmdStart,
  handleCmdDoctor, handleCmdUpgrade, handleCmdDoUpgrade,
};
