/**
 * SSH 服务
 * 用于远程执行 OpenClaw 命令
 */

const { Client } = require('ssh2');
const config = require('../config/config');
const { decrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

/**
 * 执行远程 SSH 命令
 * @param {object} server - 服务器信息
 * @param {string} command - 要执行的命令
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function execute(server, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';
    let timeoutId;
    
    // 设置超时
    timeoutId = setTimeout(() => {
      conn.end();
      reject(new Error('SSH 连接超时'));
    }, config.ssh.timeout);
    
    // 连接就绪
    conn.on('ready', () => {
      logger.info('SSH connected', { ip: server.ip, command });
      
      conn.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timeoutId);
          conn.end();
          return reject(err);
        }
        
        stream.on('data', (data) => {
          stdout += data.toString();
        });
        
        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        stream.on('close', (code) => {
          clearTimeout(timeoutId);
          conn.end();
          
          if (code !== 0 && !stdout) {
            reject(new Error(stderr || `命令执行失败，退出码: ${code}`));
          } else {
            resolve({ stdout, stderr, code });
          }
        });
      });
    });
    
    // 连接错误
    conn.on('error', (err) => {
      clearTimeout(timeoutId);
      logger.error('SSH connection error', { ip: server.ip, error: err.message });
      reject(new Error(`SSH 连接失败: ${err.message}`));
    });
    
    // 构建 SSH 连接配置
    const connConfig = {
      host: server.ip,
      port: server.ssh_port || 22,
      username: server.ssh_user,
      readyTimeout: config.ssh.readyTimeout
    };
    
    // 根据认证方式设置凭据
    if (server.ssh_auth_type === 'password') {
      const password = decrypt(server.ssh_password);
      if (!password) {
        return reject(new Error('SSH 密码解密失败'));
      }
      connConfig.password = password;
    } else {
      const privateKey = decrypt(server.ssh_private_key);
      if (!privateKey) {
        return reject(new Error('SSH 私钥解密失败'));
      }
      connConfig.privateKey = privateKey;
    }
    
    // 发起连接
    try {
      conn.connect(connConfig);
    } catch (err) {
      clearTimeout(timeoutId);
      reject(new Error(`SSH 连接配置错误: ${err.message}`));
    }
  });
}

/**
 * 获取 OpenClaw 实例状态
 * @param {object} server - 服务器信息
 * @returns {Promise<{status: string, version: string|null}>}
 */
async function getStatus(server) {
  try {
    const { stdout } = await execute(server, 'openclaw status');
    return parseStatusOutput(stdout);
  } catch (error) {
    logger.error('Get status failed', { 
      serverId: server.id, 
      ip: server.ip, 
      error: error.message 
    });
    return { status: 'unknown', version: null };
  }
}

/**
 * 解析 openclaw status 命令输出
 * @param {string} output - 命令输出
 * @returns {{status: string, version: string|null}}
 */
function parseStatusOutput(output) {
  // 匹配版本号：OpenClaw v1.2.3 或 OpenClaw 1.2.3
  const versionMatch = output.match(/OpenClaw\s+v?([\d.]+)/i);
  const version = versionMatch ? `v${versionMatch[1]}` : null;
  
  // 匹配状态：Status: running / Status: stopped
  const statusMatch = output.match(/Status:\s*(\w+)/i);
  
  if (!statusMatch) {
    // 如果找不到 Status 字段，尝试其他格式
    if (output.toLowerCase().includes('running')) {
      return { status: 'online', version };
    }
    if (output.toLowerCase().includes('stopped')) {
      return { status: 'offline', version };
    }
    return { status: 'unknown', version };
  }
  
  const statusText = statusMatch[1].toLowerCase();
  const status = statusText === 'running' ? 'online' : 
                 statusText === 'stopped' ? 'offline' : 'unknown';
  
  return { status, version };
}

/**
 * 执行 OpenClaw 控制命令（start/stop/restart）
 * @param {object} server - 服务器信息
 * @param {string} action - 操作类型：start/stop/restart
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function control(server, action) {
  const validActions = ['start', 'stop', 'restart'];
  if (!validActions.includes(action)) {
    throw new Error(`无效的操作: ${action}`);
  }
  
  try {
    const { stdout, stderr } = await execute(server, `openclaw ${action}`);
    logger.info('Control command executed', { 
      serverId: server.id, 
      action, 
      stdout: stdout.trim() 
    });
    
    // 获取最新状态
    const { status, version } = await getStatus(server);
    
    return {
      success: true,
      message: `实例${getActionText(action)}成功`,
      status,
      version
    };
  } catch (error) {
    logger.error('Control command failed', { 
      serverId: server.id, 
      action, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * 获取操作的中文名称
 */
function getActionText(action) {
  const texts = {
    start: '启动',
    stop: '停止',
    restart: '重启'
  };
  return texts[action] || action;
}

module.exports = {
  execute,
  getStatus,
  parseStatusOutput,
  control
};