'use strict';

const fs = require('fs');
const path = require('path');
const { PUBLIC_DIR } = require('./constants');

// ─── HTTP 工具 ───────────────────────────────
function readBody(req, maxBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', c => {
      total += c.length;
      if (total > maxBytes) {
        req.destroy(new Error('请求体过大（最大 2MB）'));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

function sendError(res, msg, status = 500) {
  sendJson(res, { error: msg }, status);
}

// ─── 静态文件服务 ─────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

function serveStatic(req, res, pathname) {
  const rawPath = pathname || (req.url === '/' ? '/index.html' : req.url.split('?')[0]);
  // 规范化并校验路径，防止 ../.. 穿越（path.normalize 消除 . 和 ..）
  const normalized = path.normalize(rawPath === '/' ? '/index.html' : rawPath);
  if (normalized.includes('..')) { res.writeHead(403); return res.end(); }
  let filePath = path.join(PUBLIC_DIR, normalized);
  // 双重校验：确保最终路径仍在 PUBLIC_DIR 内
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    res.writeHead(403); return res.end();
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // fallback 到 index.html（SPA）
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(filePath);
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    // 开发模式：JS/CSS 不缓存
    if (ext === '.js' || ext === '.css') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}

module.exports = { readBody, sendJson, sendError, serveStatic };
