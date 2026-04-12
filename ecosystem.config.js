module.exports = {
  apps: [
    {
      name: 'openclaw-panel',
      script: 'server.js',

      // 崩溃后自动重启
      autorestart: true,
      // 最多重试 10 次，防止崩溃循环
      max_restarts: 10,
      // 两次重启之间最少间隔 3 秒
      min_uptime: '3s',
      restart_delay: 3000,

      // 日志
      out_file: './logs/panel-out.log',
      error_file: './logs/panel-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 单个日志文件超过 10MB 自动轮转
      max_size: '10M',
      retain: 7,

      // 环境变量（可在 .env 文件中覆盖）
      env: {
        NODE_ENV: 'production',
        PORT: 19030,
      },
    },
  ],
};
