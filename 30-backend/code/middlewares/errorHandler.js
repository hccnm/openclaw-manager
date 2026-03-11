/**
 * 错误处理中间件
 */

const logger = require('../utils/logger');

/**
 * 自定义错误类
 */
class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志
  logger.error('Request error', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack
  });
  
  // 自定义错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }
  
  // SSH 连接错误
  if (err.message.includes('SSH')) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SSH_CONNECTION_FAILED',
        message: err.message
      }
    });
  }
  
  // 数据库错误
  if (err.code && err.code.startsWith('SQLITE')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: '数据库操作失败'
      }
    });
  }
  
  // 默认服务器错误
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? '服务器内部错误' 
        : err.message
    }
  });
}

/**
 * 404 处理
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路径 ${req.method} ${req.path} 不存在`
    }
  });
}

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler
};