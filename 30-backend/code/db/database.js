/**
 * 数据库初始化和连接
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// 确保数据目录存在
const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(config.database.path);

// 初始化表结构
function initDatabase() {
  db.exec(`
    -- 服务器表
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip TEXT NOT NULL UNIQUE,
      ssh_port INTEGER DEFAULT 22,
      ssh_user TEXT NOT NULL,
      ssh_auth_type TEXT NOT NULL CHECK(ssh_auth_type IN ('password', 'key')),
      ssh_password TEXT,
      ssh_private_key TEXT,
      status TEXT DEFAULT 'unknown' CHECK(status IN ('online', 'offline', 'unknown')),
      version TEXT,
      last_check_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_servers_ip ON servers(ip);
    CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
    
    -- 操作日志表（用于审计）
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      action TEXT NOT NULL,
      result TEXT,
      operator TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id)
    );
  `);
  
  console.log('Database initialized successfully');
}

// 导出数据库实例和初始化函数
module.exports = {
  db,
  initDatabase
};