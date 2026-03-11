/**
 * 认证中间件
 */

const { verifyToken, extractToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * JWT 认证中间件
 */
function authMiddleware(req, res, next) {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_MISSING',
        message: '未提供认证令牌'
      }
    });
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: '令牌无效或已过期'
      }
    });
  }
  
  // 将用户信息附加到请求对象
  req.user = decoded;
  next();
}

/**
 * 可选认证中间件（有 token 则验证，无 token 则跳过）
 */
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
}

module.exports = {
  authMiddleware,
  optionalAuth
};