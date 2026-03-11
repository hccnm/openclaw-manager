# OpenClaw Manager MVP

OpenClaw 实例 Web 管理系统

## 快速开始

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

- 用户名: `admin`
- 密码: `admin123`

## 功能列表

### MVP 功能

- [x] 用户登录/登出
- [x] 服务器列表查看
- [x] 添加服务器（支持密码/私钥认证）
- [x] 删除服务器
- [x] 查看实例状态（在线/离线/未知）
- [x] 查看实例版本
- [x] 启动/停止/重启实例
- [x] 刷新全部状态

## 技术架构

### 前端
- 纯 HTML + CSS + JavaScript
- 单页面应用（SPA）
- 无框架依赖

### 后端
- Node.js + Express
- SQLite (better-sqlite3)
- SSH 远程执行 (ssh2)
- JWT 认证

## 目录结构

```
30-backend/code/
├── server.js            # 服务入口
├── package.json         # 依赖配置
├── config/
│   └── config.js        # 配置管理
├── db/
│   └── database.js      # 数据库初始化
├── middlewares/
│   ├── auth.js          # 认证中间件
│   └── errorHandler.js  # 错误处理
├── routes/
│   ├── index.js         # 路由入口
│   ├── auth.js          # 认证路由
│   └── servers.js       # 服务器路由
├── controllers/
│   ├── authController.js
│   └── serverController.js
├── services/
│   ├── authService.js
│   ├── serverService.js
│   └── sshService.js
├── utils/
│   ├── crypto.js        # 加密工具
│   ├── jwt.js           # JWT 工具
│   └── logger.js        # 日志工具
├── public/              # 前端静态文件
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── api.js
│       ├── state.js
│       ├── router.js
│       ├── utils.js
│       ├── components/
│       └── pages/
├── data/                # 数据库文件目录
└── logs/                # 日志目录
```

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 获取当前用户信息 |

### 服务器

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/servers | 获取服务器列表 |
| POST | /api/servers | 添加服务器 |
| DELETE | /api/servers/:id | 删除服务器 |
| POST | /api/servers/:id/refresh | 刷新单个服务器状态 |
| POST | /api/servers/:id/start | 启动实例 |
| POST | /api/servers/:id/stop | 停止实例 |
| POST | /api/servers/:id/restart | 重启实例 |
| POST | /api/servers/refresh-all | 刷新所有服务器状态 |

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 3000 | 服务端口 |
| JWT_SECRET | openclaw-manager-jwt-secret-key-change-in-production | JWT 密钥 |
| ADMIN_USERNAME | admin | 管理员用户名 |
| ADMIN_PASSWORD | admin123 | 管理员密码 |
| DB_PATH | ./data/openclaw.db | 数据库路径 |
| ENCRYPTION_KEY | openclaw-manager-enc-key-32byte!! | 加密密钥 |

## 安全注意事项

1. **生产环境必须修改**:
   - JWT_SECRET
   - ADMIN_PASSWORD
   - ENCRYPTION_KEY

2. **SSH 凭据加密**:
   - 密码和私钥使用 AES-256-GCM 加密存储
   - 密钥应通过环境变量配置

3. **HTTPS**:
   - 生产环境建议使用 HTTPS
   - 可通过 Nginx 反向代理实现

## 开发

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev
```

## License

MIT