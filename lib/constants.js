'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── 加载 .env ──────────────────────────────
const envPath = path.join(__dirname, '..', '.env');
try {
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
} catch {}

// ─── 常量 ────────────────────────────────────
const PORT = parseInt(process.env.PORT || '19030', 10);
// 默认仅监听本机，如需局域网访问可设置环境变量 PANEL_HOST=0.0.0.0
const HOST = process.env.PANEL_HOST || '127.0.0.1';
const HOME_DIR = os.homedir();
const OPENCLAW_HOME = process.env.OPENCLAW_HOME || path.join(HOME_DIR, '.openclaw');
const CONFIG_PATH = path.join(OPENCLAW_HOME, 'openclaw.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ─── 跨平台 PATH 注入 ──────────────────────
(function injectPath() {
  const nodeBinDir = path.dirname(process.execPath);
  const extra = os.platform() === 'win32'
    ? [
        path.join(process.env.APPDATA || '', 'npm'),
        path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'npm'),
      ]
    : [
        path.join(HOME_DIR, '.local', 'bin'),
        path.join(HOME_DIR, '.npm-global', 'bin'),
        '/opt/homebrew/bin',
        '/usr/local/bin',
        '/usr/bin',
      ];
  const all = [nodeBinDir, ...extra].filter(p => p && fs.existsSync(p));
  const existing = (process.env.PATH || '').split(path.delimiter);
  process.env.PATH = [...new Set([...all, ...existing])].join(path.delimiter);
  process.env.OPENCLAW_HOME = OPENCLAW_HOME;
  process.env.OPENCLAW_STATE_DIR = OPENCLAW_HOME;
})();

module.exports = { PORT, HOST, HOME_DIR, OPENCLAW_HOME, CONFIG_PATH, PUBLIC_DIR };
