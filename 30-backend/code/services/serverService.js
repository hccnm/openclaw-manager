/**
 * 服务器服务
 */

const { db } = require('../db/database');
const { encrypt } = require('../utils/crypto');
const sshService = require('./sshService');
const logger = require('../utils/logger');

/**
 * 获取所有服务器列表
 * @returns {Array} 服务器列表（不含敏感信息）
 */
function getServers() {
  const servers = db.prepare(`
    SELECT id, name, ip, ssh_port, status, version, last_check_time, created_at, updated_at
    FROM servers
    ORDER BY created_at DESC
  `).all();
  
  return servers;
}

/**
 * 获取单个服务器（含敏感信息，用于内部操作）
 * @param {number} id - 服务器 ID
 * @returns {object|null}
 */
function getServerById(id) {
  return db.prepare('SELECT * FROM servers WHERE id = ?').get(id);
}

/**
 * 添加服务器
 * @param {object} data - 服务器信息
 * @returns {object} 新创建的服务器
 */
function addServer(data) {
  const { name, ip, ssh_port, ssh_user, ssh_auth_type, ssh_password, ssh_private_key } = data;
  
  // 加密敏感信息
  const encryptedPassword = ssh_password ? encrypt(ssh_password) : null;
  const encryptedKey = ssh_private_key ? encrypt(ssh_private_key) : null;
  
  try {
    const result = db.prepare(`
      INSERT INTO servers (name, ip, ssh_port, ssh_user, ssh_auth_type, ssh_password, ssh_private_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, ip, ssh_port || 22, ssh_user, ssh_auth_type, encryptedPassword, encryptedKey);
    
    logger.info('Server added', { id: result.lastInsertRowid, name, ip });
    
    return {
      id: result.lastInsertRowid,
      name,
      ip,
      ssh_port: ssh_port || 22,
      status: 'unknown'
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('该 IP 地址已存在');
    }
    throw error;
  }
}

/**
 * 删除服务器
 * @param {number} id - 服务器 ID
 * @returns {boolean} 是否删除成功
 */
function deleteServer(id) {
  const server = getServerById(id);
  if (!server) {
    return false;
  }
  
  db.prepare('DELETE FROM servers WHERE id = ?').run(id);
  db.prepare('DELETE FROM operation_logs WHERE server_id = ?').run(id);
  
  logger.info('Server deleted', { id, name: server.name });
  
  return true;
}

/**
 * 更新服务器状态
 * @param {number} id - 服务器 ID
 * @param {string} status - 状态
 * @param {string} version - 版本
 */
function updateServerStatus(id, status, version) {
  db.prepare(`
    UPDATE servers 
    SET status = ?, version = ?, last_check_time = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(status, version, id);
}

/**
 * 刷新单个服务器状态
 * @param {number} id - 服务器 ID
 * @returns {object} 更新后的状态
 */
async function refreshServerStatus(id) {
  const server = getServerById(id);
  if (!server) {
    throw new Error('服务器不存在');
  }
  
  const { status, version } = await sshService.getStatus(server);
  updateServerStatus(id, status, version);
  
  // 记录操作日志
  logOperation(id, 'refresh', status);
  
  return { id, status, version };
}

/**
 * 刷新所有服务器状态
 * @returns {Array} 所有服务器的最新状态
 */
async function refreshAllServers() {
  const servers = db.prepare('SELECT * FROM servers').all();
  
  // 并发刷新所有服务器
  const results = await Promise.all(
    servers.map(async (server) => {
      try {
        const { status, version } = await sshService.getStatus(server);
        updateServerStatus(server.id, status, version);
        return { id: server.id, status, version, error: null };
      } catch (error) {
        updateServerStatus(server.id, 'unknown', null);
        return { id: server.id, status: 'unknown', version: null, error: error.message };
      }
    })
  );
  
  logger.info('All servers refreshed', { count: servers.length });
  
  return results;
}

/**
 * 执行服务器控制操作
 * @param {number} id - 服务器 ID
 * @param {string} action - 操作：start/stop/restart
 * @returns {object} 操作结果
 */
async function controlServer(id, action) {
  const server = getServerById(id);
  if (!server) {
    throw new Error('服务器不存在');
  }
  
  try {
    const result = await sshService.control(server, action);
    
    // 更新状态
    updateServerStatus(id, result.status, result.version);
    
    // 记录操作日志
    logOperation(id, action, result.status);
    
    return result;
  } catch (error) {
    // 标记为未知状态
    updateServerStatus(id, 'unknown', null);
    
    // 记录失败日志
    logOperation(id, action, `failed: ${error.message}`);
    
    throw error;
  }
}

/**
 * 记录操作日志
 * @param {number} serverId - 服务器 ID
 * @param {string} action - 操作
 * @param {string} result - 结果
 */
function logOperation(serverId, action, result) {
  try {
    db.prepare(`
      INSERT INTO operation_logs (server_id, action, result, operator, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(serverId, action, result, 'admin');
  } catch (error) {
    logger.error('Failed to log operation', { serverId, action, error: error.message });
  }
}

module.exports = {
  getServers,
  getServerById,
  addServer,
  deleteServer,
  updateServerStatus,
  refreshServerStatus,
  refreshAllServers,
  controlServer
};