/**
 * OpenClaw Manager - 服务入口
 * 
 * 一个轻量级的 OpenClaw 实例管理系统
 * 提供 Web 界面进行远程监控和操作
 */

const express = require('express');
const path = require('path');
const config = require('./config/config');
const { initDatabase } = require('./db/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// 初始化数据库
initDatabase();

// 创建 Express 应用
const app = express();

// =====================
// 中间件配置
// =====================

// JSON 解析
app.use(express.json());

// URL 编码解析
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（前端页面）
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// CORS 配置（开发环境）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 请求直接返回
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// =====================
// 路由配置
// =====================

// API 路由
app.use('/api', routes);

// SPA 路由回退（所有非 API 请求返回 index.html）
app.get('*', (req, res) => {
  // 如果是 API 请求但路由不存在，交给 404 处理
  if (req.path.startsWith('/api')) {
    return notFoundHandler(req, res);
  }
  
  // 否则返回前端页面
  res.sendFile(path.join(publicDir, 'index.html'));
});

// =====================
// 错误处理
// =====================

app.use(errorHandler);

// =====================
// 启动服务
// =====================

const server = app.listen(config.port, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║       OpenClaw Manager Started             ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  URL:  http://localhost:${config.port.toString().padEnd(20)}║`);
  console.log(`║  Time: ${new Date().toISOString().padEnd(30)}║`);
  console.log('╠════════════════════════════════════════════╣');
  console.log('║  Default credentials:                      ║');
  console.log('║  Username: admin                           ║');
  console.log('║  Password: admin123                        ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;