# OpenClaw Panel

OpenClaw 的 Web 管理面板，提供可视化配置和管理界面。

## 功能特性

- 📊 **系统监控** — 实时查看 CPU、内存、磁盘使用情况和 Gateway 状态
- 🤖 **Agent 矩阵** — 可视化配置和管理 OpenClaw Agents，展示会话记录
- 🔌 **供应商配置** — 快速添加和管理 AI 模型供应商（Anthropic、OpenAI、Gemini 等），兼容新旧配置结构
- 📡 **渠道管理** — 配置 Telegram、Discord、Slack 等通信渠道
- 🛠️ **工具 & 插件** — 启用/禁用工具和插件
- ⏰ **定时任务** — 管理 Cron 定时任务
- 📝 **实时日志** — SSE 流式日志查看
- ⚡ **快捷操作** — 一键启动/停止/重启 Gateway，并实时显示操作日志
- 🐕 **看门狗** — 自动监控 Gateway 状态，离线时自动拉起
- 🌐 **WebUI 直达** — 侧边栏一键打开 Gateway WebUI，自动填入 Token 免登录

## 安装

```bash
npm install -g openclaw-panel
```

## 使用

### 开发 / 临时启动

```bash
openclaw-panel
# 或
npm start
```

面板将在 `http://localhost:19030` 后台运行，同时自动打开浏览器。

### 正式部署（推荐）

使用 [PM2](https://pm2.keymetrics.io/) 管理进程，支持**开机自启**和**崩溃自恢复**，适用于 Linux、Windows、macOS。

**1. 安装 PM2（全局，只需一次）**

```bash
npm install -g pm2
```

**2. 启动并设置开机自启**

```bash
npm run pm2:setup
```

> Linux / macOS：执行完会提示一条 `sudo env ...` 命令，复制后手动运行即可完成开机自启注册。  
> Windows：自动注册为系统启动任务，无需额外操作。

**日常管理命令**

```bash
npm run pm2:status    # 查看运行状态
npm run pm2:logs      # 查看日志
npm run pm2:restart   # 重启服务
npm run pm2:stop      # 停止服务
```

## 配置

面板通过直接读写 `~/.openclaw/openclaw.json` 配置文件来管理 OpenClaw。

**环境变量**（可在项目根目录新建 `.env` 文件）：

```bash
# 面板端口（默认 19030）
PORT=19030

# OpenClaw 主目录（默认 ~/.openclaw）
# OPENCLAW_HOME=/path/to/.openclaw
```

## 技术栈

- **后端**: Node.js（纯 http 模块，无框架依赖）
- **前端**: 原生 JavaScript（无框架，无构建步骤）
- **字体**: Inter + JetBrains Mono
- **依赖**: json5（解析 JSON5 格式配置）

## 开发

```bash
git clone https://github.com/316530790/openclaw-panel.git
cd openclaw-panel
npm install
node server.js
```

## 许可证

MIT
