'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile, exec } = require('child_process');
const { HOME_DIR } = require('./constants');

// ─── openclaw 二进制查找 ─────────────────────
function getOpenClawBinary() {
  const isWin = os.platform() === 'win32';
  const names = isWin ? ['openclaw.cmd', 'openclaw'] : ['openclaw'];
  for (const name of names) {
    const candidates = [
      path.join(path.dirname(process.execPath), name),
      path.join(HOME_DIR, '.local', 'bin', name),
      path.join(HOME_DIR, '.npm-global', 'bin', name),
      isWin ? path.join(process.env.APPDATA || '', 'npm', name) : '',
      isWin ? path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'npm', name) : '',
      '/opt/homebrew/bin/' + name,
      '/usr/local/bin/' + name,
    ].filter(Boolean);
    for (const c of candidates) {
      try { if (fs.existsSync(c)) return c; } catch {}
    }
  }
  return os.platform() === 'win32' ? 'openclaw.cmd' : 'openclaw';
}

function runOpenclaw(args) {
  return new Promise((resolve, reject) => {
    const bin = getOpenClawBinary();
    execFile(bin, args, { env: process.env, timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        const msg = (err.message || '') + (stderr || '');
        if (err.code === 'ENOENT' || /not recognized|cannot find/i.test(msg)) {
          return reject(new Error('openclaw 命令未找到，请确保已安装 OpenClaw'));
        }
        return reject(err);
      }
      resolve(stdout);
    });
  });
}

function getOcCmd(sub) {
  const isWin = os.platform() === 'win32';
  const bin = isWin ? 'openclaw.cmd' : 'openclaw';
  return { cmd: `${bin} ${sub}`, shell: isWin ? 'powershell' : true };
}

module.exports = { getOpenClawBinary, runOpenclaw, getOcCmd };
