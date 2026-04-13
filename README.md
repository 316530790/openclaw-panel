# OpenClaw Panel

OpenClaw 的 Web 管理面板，提供可视化配置和管理界面。

## 功能特性

- 📊 **系统监控** — 实时查看 CPU、内存、磁盘使用情况和 Gateway 状态
- 🤖 **Agent 矩阵** — 可视化配置和管理 OpenClaw Agents，展示会话记录
- 🔌 **供应商配置** — 快速添加和管理 AI 模型供应商（Anthropic、OpenAI、Gemini 等）
- 📡 **渠道管理** — 配置 Telegram、Discord、Slack 等通信渠道
- 🛠️ **工具 & 插件** — 启用/禁用工具和插件
- ⏰ **定时任务** — 管理 Cron 定时任务
- 📝 **实时日志** — SSE 流式日志查看
- ⚡ **快捷操作** — 一键启动/停止/重启 Gateway
- 🐕 **看门狗** — 自动监控 Gateway 状态，离线时自动拉起
- 🌐 **WebUI 直达** — 一键打开 Gateway WebUI，自动填入 Token 免登录

## 前置要求

- Node.js >= 18（[下载地址](https://nodejs.org)）
- 已安装并配置好 OpenClaw

---

## 安装

### 第一步：下载源码

**方式 A：使用 Git 克隆（推荐）**

```bash
git clone https://github.com/316530790/openclaw-panel.git
cd openclaw-panel
```

**方式 B：下载 ZIP**

前往 [GitHub 仓库页面](https://github.com/316530790/openclaw-panel)，点击绿色 **Code** 按钮 → **Download ZIP**，解压后进入目录：

```bash
cd openclaw-panel
```

### 第二步：安装依赖

```bash
npm install
```

### 第三步：启动

```bash
node server.js
```

启动后在浏览器打开 `http://localhost:19030` 即可使用。

> 按 `Ctrl+C` 停止服务。

---

## 正式部署

生产环境推荐使用 [PM2](https://pm2.keymetrics.io/) 管理进程，支持**开机自启**和**崩溃自动恢复**。

### 第一步：安装 PM2

```bash
npm install -g pm2
```

### 第二步：启动服务并注册开机自启

在 `openclaw-panel` 目录下执行：

```bash
npm run pm2:setup
```

这一条命令会完成：启动服务 → 保存进程列表 → 注册开机自启。

> **macOS / Linux**：执行完会输出一条 `sudo env PATH=... pm2 startup ...` 命令，复制后在终端手动运行一次，完成系统级开机自启注册。
>
> **Windows**：自动注册为系统启动任务，无需额外操作。

### 日常管理

```bash
npm run pm2:status    # 查看运行状态
npm run pm2:logs      # 查看实时日志
npm run pm2:restart   # 重启服务
npm run pm2:stop      # 停止服务
```

### 更新

```bash
git pull              # 拉取最新代码
npm install           # 更新依赖（如有变动）
npm run pm2:restart   # 重启生效
```

---

## 配置

面板通过直接读写 `~/.openclaw/openclaw.json` 来管理 OpenClaw，通常无需额外配置。

如需自定义，在项目根目录新建 `.env` 文件：

```bash
# 面板端口（默认 19030）
PORT=19030

# 监听地址（默认 127.0.0.1 仅本机访问；改为 0.0.0.0 可局域网访问）
PANEL_HOST=127.0.0.1

# OpenClaw 主目录（默认 ~/.openclaw）
# OPENCLAW_HOME=/custom/path/.openclaw
```

---

## 技术栈

- **后端**：Node.js（纯 http 模块，无框架依赖）
- **前端**：原生 JavaScript（无框架，无构建步骤）
- **依赖**：json5（解析 JSON5 格式配置）

## 许可证

MIT
