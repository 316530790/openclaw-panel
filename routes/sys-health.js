'use strict';

const os = require('os');
const net = require('net');
const { exec } = require('child_process');
const { readConfig } = require('../lib/config');
const { sendJson, sendError } = require('../lib/http-utils');

// ─── 后台 CPU 采样缓存 ──────────────────────
let _cachedCpuPct = 0;
(function bgCpuSample() {
  const s1 = os.cpus().map(c => ({ idle: c.times.idle, total: Object.values(c.times).reduce((a, b) => a + b, 0) }));
  setTimeout(() => {
    const s2 = os.cpus().map(c => ({ idle: c.times.idle, total: Object.values(c.times).reduce((a, b) => a + b, 0) }));
    const usages = s1.map((c, i) => {
      const dIdle = s2[i].idle - c.idle;
      const dTotal = s2[i].total - c.total;
      return dTotal > 0 ? Math.round((1 - dIdle / dTotal) * 100) : 0;
    });
    _cachedCpuPct = Math.round(usages.reduce((a, b) => a + b, 0) / usages.length);
    setTimeout(bgCpuSample, 5000);
  }, 500);
})();

// ─── 系统健康 API ────────────────────────────
async function handleSysHealth(req, res) {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsedPct = Math.round((1 - freeMem / totalMem) * 100);

  function getCpuUsage() {
    return Promise.resolve(_cachedCpuPct);
  }

  // 磁盘使用（跨平台）
  function getDiskUsage() {
    return new Promise(resolve => {
      const isWin = os.platform() === 'win32';
      if (isWin) {
        // PowerShell CimInstance 替代废弃的 wmic
        const psCmd = `$d=Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"; "$($d.FreeSpace),$($d.Size)"`;
        exec(psCmd, { shell: 'powershell', timeout: 5000, windowsHide: true }, (err, stdout) => {
          if (err || !stdout) return resolve(null);
          try {
            const parts = stdout.trim().split(',');
            const free = parseInt(parts[0]);
            const total = parseInt(parts[1]);
            if (total > 0) return resolve({ usedPct: Math.round((1 - free / total) * 100), total, free });
          } catch {}
          resolve(null);
        });
      } else {
        exec(`df -k / | tail -1`, { timeout: 5000 }, (err, stdout) => {
          if (err || !stdout) return resolve(null);
          try {
            const parts = stdout.trim().split(/\s+/);
            const total = parseInt(parts[1]) * 1024;
            const used = parseInt(parts[2]) * 1024;
            const usedPct = parseInt(parts[4]);
            return resolve({ usedPct, total, free: total - used });
          } catch {}
          resolve(null);
        });
      }
    });
  }

  // Gateway 探活
  function probeGateway() {
    return new Promise(resolve => {
      const cfg = readConfig();
      const gwPort = (cfg && cfg.gateway && cfg.gateway.port) || 18789;
      const sock = new net.Socket();
      sock.setTimeout(800);
      sock.once('connect', () => { sock.destroy(); resolve({ alive: true, port: gwPort }); });
      sock.once('timeout', () => { sock.destroy(); resolve({ alive: false, port: gwPort }); });
      sock.once('error', () => { sock.destroy(); resolve({ alive: false, port: gwPort }); });
      sock.connect(gwPort, '127.0.0.1');
    });
  }

  // OpenClaw 运行时长
  function getOpenClawUptime() {
    return new Promise(resolve => {
      const isWin = os.platform() === 'win32';
      if (isWin) {
        // PowerShell CimInstance 替代废弃的 wmic，输出 Unix 时间戳（秒）
        const psCmd = `$p=Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -like '*openclaw*' } | Sort-Object CreationDate | Select-Object -First 1; if($p){ [int64]($p.CreationDate.ToUniversalTime() - [datetime]'1970-01-01 00:00:00').TotalSeconds }`;
        exec(psCmd, { shell: 'powershell', timeout: 5000, windowsHide: true }, (err, stdout) => {
          if (err || !stdout) return resolve(null);
          try {
            const unixSec = parseInt(stdout.trim());
            if (isNaN(unixSec) || unixSec <= 0) return resolve(null);
            const uptimeSec = Math.floor(Date.now() / 1000) - unixSec;
            resolve(uptimeSec > 0 ? uptimeSec : null);
          } catch { resolve(null); }
        });
      } else {
        exec(`pgrep -f "openclaw" | head -1`, { timeout: 3000 }, (err, pidRaw) => {
          const pid = (pidRaw || '').trim();
          if (err || !pid) return resolve(null);
          exec(`ps -o lstart= -p ${pid}`, { timeout: 3000 }, (err2, lstart) => {
            if (err2 || !lstart) return resolve(null);
            try {
              const startTime = new Date(lstart.trim()).getTime();
              const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
              resolve(uptimeSec > 0 ? uptimeSec : null);
            } catch { resolve(null); }
          });
        });
      }
    });
  }

  try {
    const [cpuPct, disk, gw, openclawUptime] = await Promise.all([
      getCpuUsage(), getDiskUsage(), probeGateway(), getOpenClawUptime()
    ]);
    sendJson(res, {
      cpu: cpuPct,
      memUsedPct,
      memTotal: totalMem,
      memFree: freeMem,
      disk,
      uptime: os.uptime(),
      openclawUptime,
      platform: os.platform(),
      gateway: gw,
    });
  } catch (e) {
    sendError(res, e.message);
  }
}

module.exports = { handleSysHealth };
