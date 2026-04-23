'use strict';

/** 返回当前本地时间字符串，用于日志前缀 */
function ts() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

module.exports = { ts };
