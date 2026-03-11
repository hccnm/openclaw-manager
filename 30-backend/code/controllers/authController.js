/**
 * 认证控制器
 */

const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * 用户登录
 * POST /api/auth/login
 */
function login(req, res, next) {
  try {
    const { username, password } = req.body;
    
    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '用户名和密码不能为空'
        }
      });
    }
    
    const result = authService.login(username, password);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          token: result.token,
          expiresIn: result.expiresIn
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: {
          code: result.error,
          message: result.message
        }
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 用户登出
 * POST /api/auth/logout
 */
function logout(req, res, next) {
  try {
    // JWT 无状态，登出只需客户端删除 token
    // 可以在这里实现 token 黑名单（MVP 阶段暂不实现）
    
    logger.info('User logged out', { username: req.user?.username });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
function me(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
  me
};