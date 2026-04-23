'use strict';

const net = require('net');
const { readConfig } = require('./config');

/**
 * TCP 探活 Gateway 端口，返回 { alive: bool, port: number }
 * 两处重复逻辑（sys-health + watchdog）统一使用此函数
 */
function probeGateway() {
  return new Promise(resolve => {
    const cfg = readConfig();
    const gwPort = (cfg && cfg.gateway && cfg.gateway.port) || 18789;
    const sock = new net.Socket();
    sock.setTimeout(800);
    sock.once('connect', () => { sock.destroy(); resolve({ alive: true, port: gwPort }); });
    sock.once('timeout', () => { sock.destroy(); resolve({ alive: false, port: gwPort }); });
    sock.once('error',   () => { sock.destroy(); resolve({ alive: false, port: gwPort }); });
    sock.connect(gwPort, '127.0.0.1');
  });
}

module.exports = { probeGateway };
