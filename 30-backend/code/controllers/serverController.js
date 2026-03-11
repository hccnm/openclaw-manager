/**
 * 服务器控制器
 */

const serverService = require('../services/serverService');
const logger = require('../utils/logger');

/**
 * 获取服务器列表
 * GET /api/servers
 */
async function getServers(req, res, next) {
  try {
    const servers = serverService.getServers();
    
    res.json({
      success: true,
      data: { servers }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 添加服务器
 * POST /api/servers
 */
async function addServer(req, res, next) {
  try {
    const { name, ip, ssh_port, ssh_user, ssh_auth_type, ssh_password, ssh_private_key } = req.body;
    
    // 参数验证
    if (!name || !ip || !ssh_user || !ssh_auth_type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '缺少必填字段：name, ip, ssh_user, ssh_auth_type'
        }
      });
    }
    
    // 认证类型验证
    if (!['password', 'key'].includes(ssh_auth_type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ssh_auth_type 必须是 password 或 key'
        }
      });
    }
    
    // 密码认证时验证密码
    if (ssh_auth_type === 'password' && !ssh_password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '密码认证需要提供 ssh_password'
        }
      });
    }
    
    // 私钥认证时验证私钥
    if (ssh_auth_type === 'key' && !ssh_private_key) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '私钥认证需要提供 ssh_private_key'
        }
      });
    }
    
    // IP 格式验证（简单验证）
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'IP 地址格式不正确'
        }
      });
    }
    
    // SSH 端口验证
    const port = ssh_port || 22;
    if (port < 1 || port > 65535) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'SSH 端口必须在 1-65535 范围内'
        }
      });
    }
    
    const server = serverService.addServer({
      name,
      ip,
      ssh_port: port,
      ssh_user,
      ssh_auth_type,
      ssh_password,
      ssh_private_key
    });
    
    res.status(201).json({
      success: true,
      data: server
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 删除服务器
 * DELETE /api/servers/:id
 */
async function deleteServer(req, res, next) {
  try {
    const { id } = req.params;
    
    const deleted = serverService.deleteServer(parseInt(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SERVER_NOT_FOUND',
          message: '服务器不存在'
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * 刷新单个服务器状态
 * POST /api/servers/:id/refresh
 */
async function refreshServer(req, res, next) {
  try {
    const { id } = req.params;
    
    const result = await serverService.refreshServerStatus(parseInt(id));
    
    res.json({
      success: true,
      data: {
        id: result.id,
        status: result.status,
        version: result.version,
        last_check_time: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error.message === '服务器不存在') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SERVER_NOT_FOUND',
          message: error.message
        }
      });
    }
    next(error);
  }
}

/**
 * 启动实例
 * POST /api/servers/:id/start
 */
async function startServer(req, res, next) {
  try {
    const { id } = req.params;
    
    const result = await serverService.controlServer(parseInt(id), 'start');
    
    res.json({
      success: true,
      data: {
        message: result.message,
        status: result.status
      }
    });
  } catch (error) {
    handleControlError(error, res, next);
  }
}

/**
 * 停止实例
 * POST /api/servers/:id/stop
 */
async function stopServer(req, res, next) {
  try {
    const { id } = req.params;
    
    const result = await serverService.controlServer(parseInt(id), 'stop');
    
    res.json({
      success: true,
      data: {
        message: result.message,
        status: result.status
      }
    });
  } catch (error) {
    handleControlError(error, res, next);
  }
}

/**
 * 重启实例
 * POST /api/servers/:id/restart
 */
async function restartServer(req, res, next) {
  try {
    const { id } = req.params;
    
    const result = await serverService.controlServer(parseInt(id), 'restart');
    
    res.json({
      success: true,
      data: {
        message: result.message,
        status: result.status
      }
    });
  } catch (error) {
    handleControlError(error, res, next);
  }
}

/**
 * 刷新所有服务器状态
 * POST /api/servers/refresh-all
 */
async function refreshAll(req, res, next) {
  try {
    const results = await serverService.refreshAllServers();
    
    res.json({
      success: true,
      data: { servers: results }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 统一处理控制操作错误
 */
function handleControlError(error, res, next) {
  if (error.message === '服务器不存在') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'SERVER_NOT_FOUND',
        message: error.message
      }
    });
  }
  
  if (error.message.includes('SSH')) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SSH_COMMAND_FAILED',
        message: error.message
      }
    });
  }
  
  next(error);
}

module.exports = {
  getServers,
  addServer,
  deleteServer,
  refreshServer,
  startServer,
  stopServer,
  restartServer,
  refreshAll
};