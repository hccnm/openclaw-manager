/**
 * 应用配置
 * 敏感信息应通过环境变量设置
 */

module.exports = {
  // 服务端口
  port: process.env.PORT || 3000,
  
  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'openclaw-manager-jwt-secret-key-change-in-production',
    expiresIn: '30m'
  },
  
  // 管理员账号（MVP 阶段硬编码，生产环境应使用数据库）
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  },
  
  // 数据库配置
  database: {
    path: process.env.DB_PATH || './data/openclaw.db'
  },
  
  // SSH 连接配置
  ssh: {
    timeout: 30000,        // 命令执行超时（毫秒）
    readyTimeout: 10000   // 连接建立超时（毫秒）
  },
  
  // 加密密钥（生产环境必须修改）
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'openclaw-manager-enc-key-32byte!!'
  }
};