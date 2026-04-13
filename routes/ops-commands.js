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

function findGatewayPids(callback) {
  const platform = os.platform();
  if (platform === 'win32') {
    // 使用 PowerShell CimInstance（兼容 Windows 10/11，替代废弃的 wmic）
    const psCmd = `Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -like '*openclaw*gateway*' -and $_.CommandLine -notlike '*server.js*' } | Select-Object -ExpandProperty ProcessId`;
    exec(psCmd, { shell: 'powershell', windowsHide: true, timeout: 8000 }, (err, stdout) => {
      if (err || !stdout) return callback([]);
      const pids = stdout.split('\n').map(s => s.trim()).filter(s => /^\d+$/.test(s));
      callback(pids);
    });
  } else {
    exec('ps -ef | grep "[o]penclaw.*gateway" | awk \'{print $2}\'', { timeout: 5000 }, (err, stdout) => {
      if (err || !stdout) return callback([]);
      callback(stdout.split('\n').map(s => s.trim()).filter(Boolean));
    });
  }
}

function killPids(pids, lines) {
  pids.forEach(pid => {
    try {
      process.kill(parseInt(pid));
      lines.push(`[${ts()}] 已停止进程 PID ${pid}`);
    } catch (e) {
      if (os.platform() === 'win32') {
        try { exec(`taskkill /F /PID ${pid}`, { windowsHide: true }); } catch {}
      }
      lines.push(`[${ts()}] 强制终止进程 PID ${pid}`);
    }
  });
}

// ─── 运维命令 Handler ────────────────────────

function handleCmdRestart(req, res) {
  const lines = [];
  lines.push(`[${ts()}] 正在查找 Gateway 进程...`);
  findGatewayPids(pids => {
    if (pids.length > 0) {
      lines.push(`[${ts()}] 找到进程 PID: ${pids.join(', ')}`);
      killPids(pids, lines);
    } else {
      lines.push(`[${ts()}] 未找到运行中的进程，直接启动`);
    }
    lines.push(`[${ts()}] 等待进程退出...`);
    // 等待 2s 确保进程完全退出（原 500ms 在高负载机器上不够）
    setTimeout(() => {
      try {
        const { cmd, shell } = getOcCmd('gateway run');
        lines.push(`[${ts()}] 正在启动新实例...`);
        const oc = exec(cmd, { detached: true, stdio: 'ignore', windowsHide: true, shell });
        try { oc.unref(); } catch {}
        lines.push(`[${ts()}] Gateway 已启动 (PID: ${oc.pid || '未知'})`);
        sendJson(res, { success: true, message: 'Gateway 重启完成', output: lines.join('\n') });
      } catch (e) {
        lines.push(`[${ts()}] 启动失败: ${e.message}`);
        sendJson(res, { success: false, error: e.message, output: lines.join('\n') });
      }
    }, 2000);
  });
}

function handleCmdStop(req, res) {
  const lines = [];
  lines.push(`[${ts()}] 正在查找 Gateway 进程...`);
  findGatewayPids(pids => {
    if (pids.length === 0) {
      lines.push(`[${ts()}] 未找到运行中的 Gateway 进程`);
      return sendJson(res, { success: true, message: '未找到 Gateway 进程', output: lines.join('\n') });
    }
    lines.push(`[${ts()}] 找到进程 PID: ${pids.join(', ')}`);
    killPids(pids, lines);
    lines.push(`[${ts()}] Gateway 已停止`);
    sendJson(res, { success: true, message: 'Gateway 已停止', output: lines.join('\n') });
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
  exec('npm view openclaw version', { timeout: 15000, shell }, (err, stdout) => {
    if (err) return sendJson(res, { success: false, error: err.message });
    const latestVer = (stdout || '').trim();
    const verCmd = isWin ? 'openclaw.cmd --version' : 'openclaw --version';
    exec(verCmd, { timeout: 10000, shell }, (err2, stdout2) => {
      const currentVer = cleanVersion(stdout2);
      const needsUpdate = latestVer && currentVer && latestVer !== currentVer;
      sendJson(res, {
        success: true, latest: latestVer, current: currentVer, needsUpdate,
        stdout: `Current: ${currentVer || 'unknown'}\nLatest: ${latestVer || 'unknown'}\n${needsUpdate ? 'Update available: npm update -g openclaw' : 'Already up to date'}`,
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
