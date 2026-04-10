#!/usr/bin/env node
'use strict';

const cp = require('child_process');
const path = require('path');
const net = require('net');
const os = require('os');

const serverPath = path.join(__dirname, '..', 'server.js');
const PORT = parseInt(process.env.PORT || '19030', 10);

// 加载 .env 文件（Node 20.6+ 原生支持）
const envPath = path.join(__dirname, '..', '.env');
try {
  if (require('fs').existsSync(envPath)) {
    if (process.loadEnvFile) {
      process.loadEnvFile(envPath);
    }
  }
} catch {}

function openBrowser(url) {
  const platform = os.platform();
  const cmd = platform === 'win32' ? `start "" "${url}"`
    : platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  cp.exec(cmd, () => {});
}

function spawnDaemon() {
  const env = {
    ...process.env,
    OPENCLAW_HOME: process.env.OPENCLAW_HOME || path.join(os.homedir(), '.openclaw'),
    OPENCLAW_STATE_DIR: process.env.OPENCLAW_HOME || path.join(os.homedir(), '.openclaw'),
  };

  const child = cp.spawn(process.execPath, [serverPath], {
    detached: true,
    stdio: 'ignore',
    env,
  });
  child.unref();

  console.log('✅ OpenClaw Panel 已在后台启动');
  console.log(`🔗 请访问: http://localhost:${PORT}`);
  process.exit(0);
}

// 检查端口是否已被占用
const check = net.createServer();

check.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`ℹ️  OpenClaw Panel 已在运行（端口 ${PORT}）`);
    console.log(`🔗 正在打开: http://localhost:${PORT}`);
    openBrowser(`http://localhost:${PORT}`);
    process.exit(0);
  } else {
    console.error('启动检查失败:', err.message);
    process.exit(1);
  }
});

check.once('listening', () => {
  check.close(() => spawnDaemon());
});

check.listen(PORT, '127.0.0.1');
