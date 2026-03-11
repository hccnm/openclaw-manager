/**
 * 应用状态管理
 */

const State = {
  // 状态数据
  data: {
    // 当前用户
    user: null,
    // 服务器列表
    servers: [],
    // 加载状态
    loading: false,
    // 最后更新时间
    lastUpdate: null
  },

  // 监听器列表
  listeners: [],

  /**
   * 获取状态
   * @param {string} key - 状态键名
   * @returns {*}
   */
  get(key) {
    return key ? this.data[key] : this.data;
  },

  /**
   * 设置状态
   * @param {object} updates - 要更新的状态
   */
  set(updates) {
    Object.assign(this.data, updates);
    this.notify();
  },

  /**
   * 订阅状态变化
   * @param {Function} listener - 监听函数
   * @returns {Function} 取消订阅函数
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  },

  /**
   * 通知所有监听器
   */
  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.data);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  },

  /**
   * 检查是否已登录
   * @returns {boolean}
   */
  isLoggedIn() {
    return !!API.getToken();
  },

  /**
   * 加载服务器列表
   */
  async loadServers() {
    this.set({ loading: true });
    try {
      const result = await API.getServers();
      if (result.success) {
        this.set({
          servers: result.data.servers,
          lastUpdate: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Load servers error:', error);
      Toast.error('加载服务器列表失败: ' + error.message);
    } finally {
      this.set({ loading: false });
    }
  },

  /**
   * 刷新单个服务器状态
   * @param {number} id - 服务器 ID
   */
  async refreshServer(id) {
    try {
      const result = await API.refreshServer(id);
      if (result.success) {
        // 更新本地状态
        const servers = this.data.servers.map(s => {
          if (s.id === id) {
            return {
              ...s,
              status: result.data.status,
              version: result.data.version,
              last_check_time: result.data.last_check_time
            };
          }
          return s;
        });
        this.set({ servers });
        Toast.success('状态刷新成功');
      }
    } catch (error) {
      Toast.error('刷新失败: ' + error.message);
    }
  },

  /**
   * 刷新所有服务器状态
   */
  async refreshAllServers() {
    this.set({ loading: true });
    try {
      const result = await API.refreshAll();
      if (result.success) {
        // 更新本地状态
        const updates = result.data.servers;
        const servers = this.data.servers.map(s => {
          const update = updates.find(u => u.id === s.id);
          if (update) {
            return {
              ...s,
              status: update.status,
              version: update.version,
              last_check_time: new Date().toISOString()
            };
          }
          return s;
        });
        this.set({
          servers,
          lastUpdate: new Date().toISOString()
        });
        Toast.success('全部刷新成功');
      }
    } catch (error) {
      Toast.error('刷新失败: ' + error.message);
    } finally {
      this.set({ loading: false });
    }
  },

  /**
   * 添加服务器
   * @param {object} data - 服务器数据
   */
  async addServer(data) {
    try {
      const result = await API.addServer(data);
      if (result.success) {
        await this.loadServers();
        Toast.success('服务器添加成功');
        return true;
      }
    } catch (error) {
      Toast.error('添加失败: ' + error.message);
    }
    return false;
  },

  /**
   * 删除服务器
   * @param {number} id - 服务器 ID
   */
  async deleteServer(id) {
    try {
      const result = await API.deleteServer(id);
      if (result.success) {
        // 从本地状态移除
        const servers = this.data.servers.filter(s => s.id !== id);
        this.set({ servers });
        Toast.success('服务器已删除');
        return true;
      }
    } catch (error) {
      Toast.error('删除失败: ' + error.message);
    }
    return false;
  },

  /**
   * 执行服务器控制操作
   * @param {number} id - 服务器 ID
   * @param {string} action - 操作类型
   */
  async controlServer(id, action) {
    try {
      let result;
      switch (action) {
        case 'start':
          result = await API.startServer(id);
          break;
        case 'stop':
          result = await API.stopServer(id);
          break;
        case 'restart':
          result = await API.restartServer(id);
          break;
        default:
          throw new Error('未知操作');
      }

      if (result.success) {
        // 更新本地状态
        const servers = this.data.servers.map(s => {
          if (s.id === id) {
            return {
              ...s,
              status: result.data.status,
              last_check_time: new Date().toISOString()
            };
          }
          return s;
        });
        this.set({ servers });
        Toast.success(result.data.message);
        return true;
      }
    } catch (error) {
      Toast.error('操作失败: ' + error.message);
    }
    return false;
  }
};

// 导出（挂载到 window）
window.State = State;