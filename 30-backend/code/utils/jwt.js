/**
 * JWT 工具
 * 用于生成和验证认证令牌
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * 生成 JWT Token
 * @param {object} payload - 载荷数据
 * @returns {string} - JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

/**
 * 验证 JWT Token
 * @param {string} token - JWT Token
 * @returns {object|null} - 解码后的载荷，无效时返回 null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

/**
 * 从请求头提取 Token
 * @param {object} req - Express 请求对象
 * @returns {string|null} - Token 或 null
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

module.exports = { generateToken, verifyToken, extractToken };