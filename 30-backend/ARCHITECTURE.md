# 后端架构设计

## 1. 架构概览

采用经典的 MVC 架构，基于 Express 框架。

```
┌─────────────────────────────────────────────────────────┐
│                     Express App                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │                 Middlewares                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │ CORS     │ │ JSON     │ │ Auth     │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                   Routes                         │   │
│  │  /api/auth/*  │  /api/servers/*                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                Controllers                       │   │
│  │  ┌──────────┐ ┌──────────┐                     │   │
│  │  │ AuthCtrl │ │ ServerCtrl│                    │   │
│  │  └──────────┘ └──────────┘                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                Services                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │ AuthService│ │ServerService│ │ SSHService │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                   Models                         │   │
│  │  ┌──────────────────────────────────────────┐  │   │
│  │  │           SQLite Database                 │  │   │
│  │  │         ┌────────────────┐               │  │   │
│  │  │         │    servers     │               │  │   │
│  │  │         └────────────────┘               │  │   │
│  │  └──────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 2. 文件结构

```
code/
├── server.js            # 服务入口
├── config/
│   └── config.js        # 配置管理
├── db/
│   ├── database.js      # 数据库连接
│   └── schema.sql       # 表结构
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
└── package.json
```

## 3. 核心模块设计

### 3.1 配置管理 (config.js)

```javascript
module.exports = {
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'openclaw-manager-secret-key',
    expiresIn: '30m'
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123' // 生产环境应使用环境变量
  },
  database: {
    path: process.env.DB_PATH || './data/openclaw.db'
  },
  ssh: {
    timeout: 10000,  // 10秒超时
    readyTimeout: 10000
  }
};
```

### 3.2 数据库设计 (database.js)

使用 better-sqlite3：

```javascript
const Database = require('better-sqlite3');
const db = new Database(config.database.path);

// 初始化表
db.exec(`
  CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ip TEXT NOT NULL UNIQUE,
    ssh_port INTEGER DEFAULT 22,
    ssh_user TEXT NOT NULL,
    ssh_auth_type TEXT NOT NULL CHECK(ssh_auth_type IN ('password', 'key')),
    ssh_password TEXT,
    ssh_private_key TEXT,
    status TEXT DEFAULT 'unknown',
    version TEXT,
    last_check_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_servers_ip ON servers(ip);
  CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
`);

module.exports = db;
```

### 3.3 SSH 服务 (sshService.js)

使用 ssh2 库：

```javascript
const { Client } = require('ssh2');

class SSHService {
  // 执行远程命令
  async execute(server, command) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const timeout = setTimeout(() => {
        conn.end();
        reject(new Error('SSH连接超时'));
      }, config.ssh.timeout);
      
      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) return reject(err);
          
          let output = '';
          stream.on('data', (data) => {
            output += data.toString();
          });
          
          stream.on('close', () => {
            clearTimeout(timeout);
            conn.end();
            resolve(output);
          });
        });
      });
      
      conn.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      
      // 根据认证方式连接
      const connConfig = {
        host: server.ip,
        port: server.ssh_port,
        username: server.ssh_user,
        readyTimeout: config.ssh.readyTimeout
      };
      
      if (server.ssh_auth_type === 'password') {
        connConfig.password = decrypt(server.ssh_password);
      } else {
        connConfig.privateKey = decrypt(server.ssh_private_key);
      }
      
      conn.connect(connConfig);
    });
  }
  
  // 获取状态
  async getStatus(server) {
    try {
      const output = await this.execute(server, 'openclaw status');
      return this.parseStatus(output);
    } catch (error) {
      return { status: 'unknown', version: null };
    }
  }
  
  // 解析状态
  parseStatus(output) {
    const versionMatch = output.match(/OpenClaw\s+v?([\d.]+)/i);
    const statusMatch = output.match(/Status:\s*(\w+)/i);
    
    return {
      status: statusMatch ? 
        (statusMatch[1].toLowerCase() === 'running' ? 'online' : 'offline') : 
        'unknown',
      version: versionMatch ? `v${versionMatch[1]}` : null
    };
  }
}

module.exports = new SSHService();
```

### 3.4 加密工具 (crypto.js)

```javascript
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || 
  'openclaw-manager-encryption-key-32b', 'utf8').slice(0, 32);

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encrypted) {
  if (!encrypted) return null;
  const [ivHex, authTagHex, data] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
```

### 3.5 JWT 工具 (jwt.js)

使用 jsonwebtoken：

```javascript
const jwt = require('jsonwebtoken');
const config = require('../config/config');

function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
```

## 4. API 接口实现

### 4.1 认证接口

```javascript
// POST /api/auth/login
async function login(req, res) {
  const { username, password } = req.body;
  
  if (username === config.admin.username && 
      password === config.admin.password) {
    const token = generateToken({ username });
    res.json({
      success: true,
      data: { token, expiresIn: 1800 }
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: '用户名或密码错误'
      }
    });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  res.json({ success: true });
}
```

### 4.2 服务器接口

```javascript
// GET /api/servers
async function getServers(req, res) {
  const servers = db.prepare('SELECT * FROM servers ORDER BY created_at DESC').all();
  // 过滤敏感信息
  const result = servers.map(s => ({
    id: s.id,
    name: s.name,
    ip: s.ip,
    ssh_port: s.ssh_port,
    status: s.status,
    version: s.version,
    last_check_time: s.last_check_time,
    created_at: s.created_at
  }));
  res.json({ success: true, data: { servers: result } });
}

// POST /api/servers
async function addServer(req, res) {
  const { name, ip, ssh_port, ssh_user, ssh_auth_type, ssh_password, ssh_private_key } = req.body;
  
  // 加密敏感信息
  const encryptedPassword = ssh_password ? encrypt(ssh_password) : null;
  const encryptedKey = ssh_private_key ? encrypt(ssh_private_key) : null;
  
  try {
    const result = db.prepare(`
      INSERT INTO servers (name, ip, ssh_port, ssh_user, ssh_auth_type, ssh_password, ssh_private_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, ip, ssh_port || 22, ssh_user, ssh_auth_type, encryptedPassword, encryptedKey);
    
    res.json({
      success: true,
      data: { id: result.lastInsertRowid, name, ip, ssh_port: ssh_port || 22 }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.message }
    });
  }
}

// DELETE /api/servers/:id
async function deleteServer(req, res) {
  const { id } = req.params;
  db.prepare('DELETE FROM servers WHERE id = ?').run(id);
  res.json({ success: true });
}

// POST /api/servers/:id/refresh
async function refreshServer(req, res) {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);
  if (!server) {
    return res.status(404).json({
      success: false,
      error: { code: 'SERVER_NOT_FOUND', message: '服务器不存在' }
    });
  }
  
  const { status, version } = await sshService.getStatus(server);
  
  db.prepare(`
    UPDATE servers SET status = ?, version = ?, last_check_time = datetime('now')
    WHERE id = ?
  `).run(status, version, req.params.id);
  
  res.json({
    success: true,
    data: { id: parseInt(req.params.id), status, version }
  });
}

// POST /api/servers/:id/start|stop|restart
async function controlServer(req, res) {
  const { action } = req.params; // start, stop, restart
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);
  
  if (!server) {
    return res.status(404).json({
      success: false,
      error: { code: 'SERVER_NOT_FOUND', message: '服务器不存在' }
    });
  }
  
  try {
    await sshService.execute(server, `openclaw ${action}`);
    const { status, version } = await sshService.getStatus(server);
    
    db.prepare(`
      UPDATE servers SET status = ?, version = ?, last_check_time = datetime('now')
      WHERE id = ?
    `).run(status, version, req.params.id);
    
    res.json({
      success: true,
      data: { message: `实例${action === 'start' ? '启动' : action === 'stop' ? '停止' : '重启'}成功`, status }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SSH_COMMAND_FAILED', message: error.message }
    });
  }
}

// POST /api/servers/refresh-all
async function refreshAll(req, res) {
  const servers = db.prepare('SELECT * FROM servers').all();
  
  const results = await Promise.all(
    servers.map(async (server) => {
      const { status, version } = await sshService.getStatus(server);
      db.prepare(`
        UPDATE servers SET status = ?, version = ?, last_check_time = datetime('now')
        WHERE id = ?
      `).run(status, version, server.id);
      return { id: server.id, status, version };
    })
  );
  
  res.json({ success: true, data: { servers: results } });
}
```

## 5. 中间件设计

### 5.1 认证中间件

```javascript
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_INVALID', message: '未提供认证令牌' }
    });
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: '令牌已过期' }
    });
  }
  
  req.user = decoded;
  next();
}
```

### 5.2 错误处理中间件

```javascript
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || '服务器内部错误'
    }
  });
}
```

## 6. 日志系统

```javascript
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/app.log');

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logLine = JSON.stringify({ timestamp, level, message, ...data }) + '\n';
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) console.error('Log write error:', err);
  });
  
  // 开发环境同时输出到控制台
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${timestamp}] [${level}] ${message}`, data);
  }
}

module.exports = { log, info: (m, d) => log('INFO', m, d), error: (m, d) => log('ERROR', m, d) };
```

## 7. 启动流程

```javascript
// server.js
const express = require('express');
const config = require('./config/config');
const { initDatabase } = require('./db/database');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

// 初始化数据库
initDatabase();

const app = express();

// 中间件
app.use(express.json());
app.use(express.static('public')); // 静态文件

// CORS（开发环境）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});

// 路由
app.use('/api', routes);

// 错误处理
app.use(errorHandler);

// 启动
app.listen(config.port, () => {
  console.log(`OpenClaw Manager running on http://localhost:${config.port}`);
});
```

## 8. 依赖清单

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "ssh2": "^1.15.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```