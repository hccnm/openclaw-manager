/**
 * 日志工具
 */

const fs = require('fs');
const path = require('path');

// 日志目录
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'app.log');

/**
 * 写入日志
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {object} data - 附加数据
 */
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };
  
  // 写入文件
  fs.appendFile(logFile, JSON.stringify(logEntry) + '\n', (err) => {
    if (err) console.error('Log write error:', err);
  });
  
  // 控制台输出（开发环境）
  if (process.env.NODE_ENV !== 'production') {
    const prefix = {
      INFO: '\x1b[32m[INFO]\x1b[0m',
      WARN: '\x1b[33m[WARN]\x1b[0m',
      ERROR: '\x1b[31m[ERROR]\x1b[0m'
    }[level] || '[LOG]';
    
    console.log(`${prefix} ${message}`, Object.keys(data).length ? data : '');
  }
}

module.exports = {
  log,
  info: (message, data) => log('INFO', message, data),
  warn: (message, data) => log('WARN', message, data),
  error: (message, data) => log('ERROR', message, data)
};