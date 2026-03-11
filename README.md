# OpenClaw Manager

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## English

### Overview

OpenClaw Manager is a web-based management system for centralized monitoring and control of OpenClaw instances across multiple servers. This MVP version provides essential features for managing OpenClaw deployments.

### Features

- 🔐 **Authentication** - JWT-based login (default: admin/admin123)
- 🖥️ **Server Management** - Add/remove servers with SSH credentials
- 📊 **Status Monitoring** - Real-time instance status (online/offline/unknown)
- ⚡ **Remote Operations** - Start/stop/restart OpenClaw gateway
- 🔒 **Security** - SSH credentials encrypted with AES-256-GCM

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Pure HTML + CSS + JavaScript (SPA) |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Communication | SSH (ssh2) |

### Quick Start

```bash
# Clone the repository
git clone https://github.com/hccnm/openclaw-manager.git
cd openclaw-manager/30-backend/code

# Install dependencies
npm install

# Start the server
npm start

# Access the application
# http://localhost:3000
# Login: admin / admin123
```

### Project Structure

```
openclaw-manager/
├── 00-overview/              # Project overview
├── 10-pm/                    # Product requirements
│   └── PRD.md
├── 20-frontend/              # Frontend architecture
│   └── ARCHITECTURE.md
├── 30-backend/               # Backend
│   ├── ARCHITECTURE.md       # Backend architecture
│   └── code/
│       ├── server.js         # Entry point
│       ├── config/           # Configuration
│       ├── controllers/      # Request handlers
│       ├── services/         # Business logic
│       ├── routes/           # API routes
│       ├── middlewares/      # Auth, error handling
│       ├── db/               # Database
│       ├── utils/            # Utilities
│       └── public/           # Frontend files
└── 40-qa/                    # Testing
    ├── TEST_PLAN.md
    ├── TEST_CASES.md
    └── TEST_REPORT.md
```

### API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/logout | User logout |
| GET | /api/auth/me | Get current user |
| GET | /api/servers | List all servers |
| POST | /api/servers | Add a server |
| DELETE | /api/servers/:id | Delete a server |
| GET | /api/servers/:id/status | Get server status |
| POST | /api/servers/:id/start | Start OpenClaw |
| POST | /api/servers/:id/stop | Stop OpenClaw |
| POST | /api/servers/:id/restart | Restart OpenClaw |

### Security

- Passwords hashed with bcrypt
- SSH credentials encrypted with AES-256-GCM
- JWT token authentication (30 min expiry)
- Session-based access control

### Requirements

- Node.js >= 16
- SSH access to target servers
- `openclaw` CLI installed on target servers

### License

MIT

---

<a name="中文"></a>

## 中文

### 项目概述

OpenClaw Manager 是一个 Web 管理系统，用于集中查看和管理多台服务器上的 OpenClaw 实例。本版本为 MVP（最小可运行版本），提供基础的实例管理功能。

### 功能特性

- 🔐 **登录认证** - JWT Token 认证（默认账号：admin/admin123）
- 🖥️ **服务器管理** - 添加/删除服务器，支持密码和私钥认证
- 📊 **状态监控** - 实时查看实例状态（在线/离线/未知）
- ⚡ **远程操作** - 启动/停止/重启 OpenClaw 网关
- 🔒 **安全存储** - SSH 凭据使用 AES-256-GCM 加密

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 纯 HTML + CSS + JavaScript（单页面应用） |
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 通信 | SSH 远程命令 (ssh2) |

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/hccnm/openclaw-manager.git
cd openclaw-manager/30-backend/code

# 安装依赖
npm install

# 启动服务
npm start

# 访问应用
# http://localhost:3000
# 登录账号：admin / admin123
```

### 项目结构

```
openclaw-manager/
├── 00-overview/              # 项目概述
├── 10-pm/                    # 产品需求文档
│   └── PRD.md
├── 20-frontend/              # 前端架构文档
│   └── ARCHITECTURE.md
├── 30-backend/               # 后端代码
│   ├── ARCHITECTURE.md       # 后端架构文档
│   └── code/
│       ├── server.js         # 服务入口
│       ├── config/           # 配置
│       ├── controllers/      # 控制器
│       ├── services/         # 服务层
│       ├── routes/           # 路由
│       ├── middlewares/      # 中间件
│       ├── db/               # 数据库
│       ├── utils/            # 工具函数
│       └── public/           # 前端文件
└── 40-qa/                    # 测试文档
    ├── TEST_PLAN.md          # 测试计划
    ├── TEST_CASES.md         # 测试用例
    └── TEST_REPORT.md        # 测试报告
```

### API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 用户登出 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/servers | 获取服务器列表 |
| POST | /api/servers | 添加服务器 |
| DELETE | /api/servers/:id | 删除服务器 |
| GET | /api/servers/:id/status | 获取服务器状态 |
| POST | /api/servers/:id/start | 启动 OpenClaw |
| POST | /api/servers/:id/stop | 停止 OpenClaw |
| POST | /api/servers/:id/restart | 重启 OpenClaw |

### 安全特性

- 密码使用 bcrypt 哈希存储
- SSH 凭据使用 AES-256-GCM 加密
- JWT Token 认证（有效期 30 分钟）
- 基于 Session 的访问控制

### 环境要求

- Node.js >= 16
- 目标服务器需要 SSH 访问权限
- 目标服务器已安装 `openclaw` 命令行工具

### 许可证

MIT