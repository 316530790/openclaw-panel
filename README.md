# OpenClaw Panel

OpenClaw 的 Web 管理面板，提供可视化配置和管理界面。

## 功能特性

- 📊 **系统监控** - 实时查看 CPU、内存、磁盘使用情况和 Gateway 状态
- 🤖 **Agent 管理** - 可视化配置和管理 OpenClaw Agents
- 🔌 **供应商配置** - 快速添加和管理 AI 模型供应商（Anthropic、OpenAI、Gemini 等）
- 📡 **渠道管理** - 配置 Telegram、Discord、Slack 等通信渠道
- 🛠️ **工具 & 插件** - 启用/禁用工具和插件
- ⏰ **定时任务** - 管理 Cron 定时任务
- 📝 **实时日志** - SSE 流式日志查看
- ⚡ **快捷操作** - 一键重启、启动、诊断、更新 Gateway

## 安装

```bash
npm install -g openclaw-panel
```

## 使用

启动面板：

```bash
openclaw-panel
```

面板将在 `http://localhost:19030` 启动并自动打开浏览器。

## 配置

面板通过直接读写 `~/.openclaw/openclaw.json` 配置文件来管理 OpenClaw。

环境变量（可选）：

```bash
# 面板端口（默认 19030）
PORT=19030

# OpenClaw 配置文件路径（默认 ~/.openclaw/openclaw.json）
OPENCLAW_CONFIG_PATH=/path/to/openclaw.json
```

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 JavaScript（无框架）
- **设计**: Claude Design Language
- **依赖**: json5（解析 JSON5 格式配置）

## 开发

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/openclaw-panel.git
cd openclaw-panel

# 安装依赖
npm install

# 启动开发服务器
node bin/start.js
```

## 许可证

MIT
