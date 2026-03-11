/**
 * API 请求封装
 */

const API = {
  baseURL: '/api',

  /**
   * 获取存储的 Token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * 保存 Token
   * @param {string} token
   */
  setToken(token) {
    localStorage.setItem('token', token);
  },

  /**
   * 清除 Token
   */
  clearToken() {
    localStorage.removeItem('token');
  },

  /**
   * 发送请求
   * @param {string} method - HTTP 方法
   * @param {string} path - API 路径
   * @param {object} data - 请求数据
   * @returns {Promise<object>}
   */
  async request(method, path, data = null) {
    const url = this.baseURL + path;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // 添加认证 Token
    const token = this.getToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // 添加请求体
    if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      // 处理认证失败
      if (response.status === 401) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error(result.error?.message || '认证失败，请重新登录');
      }

      // 处理其他错误
      if (!response.ok) {
        throw new Error(result.error?.message || `请求失败: ${response.status}`);
      }

      return result;
    } catch (error) {
      // 网络错误
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络');
      }
      throw error;
    }
  },

  // =====================
  // 认证接口
  // =====================

  /**
   * 用户登录
   * @param {string} username
   * @param {string} password
   * @returns {Promise<object>}
   */
  async login(username, password) {
    const result = await this.request('POST', '/auth/login', { username, password });
    if (result.success && result.data.token) {
      this.setToken(result.data.token);
    }
    return result;
  },

  /**
   * 用户登出
   * @returns {Promise<object>}
   */
  async logout() {
    try {
      await this.request('POST', '/auth/logout');
    } finally {
      this.clearToken();
    }
  },

  /**
   * 获取当前用户信息
   * @returns {Promise<object>}
   */
  async getMe() {
    return this.request('GET', '/auth/me');
  },

  // =====================
  // 服务器接口
  // =====================

  /**
   * 获取服务器列表
   * @returns {Promise<object>}
   */
  async getServers() {
    return this.request('GET', '/servers');
  },

  /**
   * 添加服务器
   * @param {object} data - 服务器信息
   * @returns {Promise<object>}
   */
  async addServer(data) {
    return this.request('POST', '/servers', data);
  },

  /**
   * 删除服务器
   * @param {number} id - 服务器 ID
   * @returns {Promise<object>}
   */
  async deleteServer(id) {
    return this.request('DELETE', `/servers/${id}`);
  },

  /**
   * 刷新单个服务器状态
   * @param {number} id - 服务器 ID
   * @returns {Promise<object>}
   */
  async refreshServer(id) {
    return this.request('POST', `/servers/${id}/refresh`);
  },

  /**
   * 启动服务器
   * @param {number} id - 服务器 ID
   * @returns {Promise<object>}
   */
  async startServer(id) {
    return this.request('POST', `/servers/${id}/start`);
  },

  /**
   * 停止服务器
   * @param {number} id - 服务器 ID
   * @returns {Promise<object>}
   */
  async stopServer(id) {
    return this.request('POST', `/servers/${id}/stop`);
  },

  /**
   * 重启服务器
   * @param {number} id - 服务器 ID
   * @returns {Promise<object>}
   */
  async restartServer(id) {
    return this.request('POST', `/servers/${id}/restart`);
  },

  /**
   * 刷新所有服务器状态
   * @returns {Promise<object>}
   */
  async refreshAll() {
    return this.request('POST', '/servers/refresh-all');
  }
};

// 导出（挂载到 window）
window.API = API;