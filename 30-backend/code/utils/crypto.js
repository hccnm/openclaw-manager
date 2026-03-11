/**
 * 加密工具
 * 用于加密存储 SSH 密码和私钥
 */

const crypto = require('crypto');
const config = require('../config/config');

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(config.encryption.key, 'utf8').slice(0, 32);

/**
 * 加密文本
 * @param {string} text - 要加密的文本
 * @returns {string|null} - 加密后的字符串（格式：iv:authTag:encrypted）
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

/**
 * 解密文本
 * @param {string} encrypted - 加密的字符串（格式：iv:authTag:encrypted）
 * @returns {string|null} - 解密后的原始文本
 */
function decrypt(encrypted) {
  if (!encrypted) return null;
  
  try {
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, data] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

module.exports = { encrypt, decrypt };