# OpenClaw Manager MVP

## 项目概述

OpenClaw Manager 是一个轻量级 Web 管理系统，用于集中管理多台服务器上的 OpenClaw 实例。

## 目录结构

```
openclaw-manager/
├── 00-overview/          # 项目概述
├── 10-pm/                # 产品需求文档
├── 20-frontend/          # 前端设计和代码
│   └── code/             # 前端源码
├── 30-backend/           # 后端设计和代码
│   └── code/             # 后端源码
├── 40-qa/                # 测试文档
└── 90-release/           # 发布说明
```

## 技术栈

- **前端**: 纯 HTML + CSS + JavaScript（单页面应用）
- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **通信**: SSH 远程执行命令 (ssh2)

## MVP 功能

1. 登录认证（默认 admin/admin123）
2. 服务器列表管理（添加/删除）
3. 实例状态查看（在线/离线、版本）
4. 启动/停止/重启操作

## 项目状态

**MVP 开发完成** ✅
**QA 验证通过** ✅ (2026-03-11)

### 已完成功能
- [x] 用户登录/登出（默认 admin/admin123）
- [x] 服务器列表管理（添加/删除）
- [x] 实例状态查看（在线/离线/未知、版本）
- [x] 启动/停止/重启操作
- [x] 刷新全部状态
- [x] SSH 密码/私钥认证
- [x] JWT 认证
- [x] SSH 凭据加密存储

### 验收标准验证

| 标准 | 状态 |
|------|------|
| 项目可以本地启动运行 | ✅ 通过 |
| 前后端可以正常通信 | ✅ 通过 |
| 页面可以展示基础数据 | ✅ 通过 |
| 具备简单的数据模型和接口 | ✅ 通过 |

### 技术文档
- `20-frontend/ARCHITECTURE.md` - 前端架构设计
- `30-backend/ARCHITECTURE.md` - 后端架构设计
- `30-backend/code/README.md` - 部署说明

### 测试文档
- `40-qa/TEST_PLAN.md` - 测试计划
- `40-qa/TEST_CASES.md` - 测试用例（31 项，100% 通过）
- `40-qa/TEST_REPORT.md` - 测试报告

## 快速启动

```bash
# 进入后端目录
cd 30-backend/code

# 安装依赖
npm install

# 启动服务
npm start

# 访问
open http://localhost:3000
```

## 默认账号

- 用户名: admin
- 密码: admin123

## 生产部署

⚠️ **生产环境必须修改以下配置**：

```bash
# 环境变量
export JWT_SECRET="your-random-secret-key-here"
export ADMIN_PASSWORD="your-strong-password-here"
export ENCRYPTION_KEY="your-32-byte-encryption-key!!"
export PORT=3000
```

## 技术栈

- 前端：HTML + CSS + JavaScript（无框架）
- 后端：Node.js + Express
- 数据库：SQLite (better-sqlite3)
- 认证：JWT
- 加密：AES-256-GCM