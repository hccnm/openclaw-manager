/**
 * 认证服务
 */

const config = require('../config/config');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {{success: boolean, token?: string, error?: string}}
 */
function login(username, password) {
  // MVP 阶段：硬编码管理员账号
  if (username === config.admin.username && 
      password === config.admin.password) {
    
    const token = generateToken({ 
      username,
      role: 'admin',
      loginTime: Date.now()
    });
    
    logger.info('User logged in', { username });
    
    return {
      success: true,
      token,
      expiresIn: 1800 // 30 分钟（秒）
    };
  }
  
  logger.warn('Login failed', { username, reason: 'invalid_credentials' });
  
  return {
    success: false,
    error: 'INVALID_CREDENTIALS',
    message: '用户名或密码错误'
  };
}

/**
 * 验证用户权限
 * @param {object} user - 从 Token 解析的用户信息
 * @returns {boolean}
 */
function validateUser(user) {
  return user && user.username && user.role === 'admin';
}

module.exports = {
  login,
  validateUser
};