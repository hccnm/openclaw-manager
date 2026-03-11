/**
 * 主页面组件
 */

const DashboardPage = {
  /**
   * 渲染页面
   * @returns {string}
   */
  render() {
    const servers = State.get('servers');
    const loading = State.get('loading');
    const lastUpdate = State.get('lastUpdate');

    return `
      <div class="dashboard-page">
        <!-- 顶部导航 -->
        <nav class="navbar">
          <div class="navbar-brand">🦞 OpenClaw Manager</div>
          <div class="navbar-actions">
            <button class="btn btn-secondary" id="refresh-all-btn" ${loading ? 'disabled' : ''}>
              ${loading ? '刷新中...' : '刷新全部'}
            </button>
            <button class="btn btn-primary" id="add-server-btn">
              + 添加服务器
            </button>
            <button class="btn btn-outline" id="logout-btn">
              登出
            </button>
          </div>
        </nav>

        <!-- 主内容区 -->
        <main class="main-content">
          <div class="server-table-container">
            <div class="table-header">
              <h2 class="table-title">服务器列表</h2>
            </div>
            
            ${servers.length === 0 ? this.renderEmpty() : this.renderTable(servers)}
          </div>

          ${lastUpdate ? `
            <div class="last-update">
              最后更新: ${Utils.formatDateTime(lastUpdate)}
            </div>
          ` : ''}
        </main>
      </div>
    `;
  },

  /**
   * 渲染表格
   * @param {Array} servers - 服务器列表
   * @returns {string}
   */
  renderTable(servers) {
    return `
      <table class="server-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>IP 地址</th>
            <th>状态</th>
            <th>版本</th>
            <th>最后检查</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${servers.map(server => this.renderRow(server)).join('')}
        </tbody>
      </table>
    `;
  },

  /**
   * 渲染表格行
   * @param {object} server - 服务器信息
   * @returns {string}
   */
  renderRow(server) {
    const statusInfo = Utils.getStatusInfo(server.status);
    const lastCheck = server.last_check_time 
      ? Utils.formatRelativeTime(server.last_check_time) 
      : '-';

    return `
      <tr data-id="${server.id}">
        <td><strong>${Utils.escapeHtml(server.name)}</strong></td>
        <td>${Utils.escapeHtml(server.ip)}</td>
        <td>
          <span class="status-badge ${statusInfo.class}">
            ${statusInfo.icon} ${statusInfo.text}
          </span>
        </td>
        <td>${server.version || '-'}</td>
        <td>${lastCheck}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn start" data-action="start" data-id="${server.id}" 
              ${server.status === 'online' ? 'disabled' : ''} title="启动">
              启动
            </button>
            <button class="action-btn stop" data-action="stop" data-id="${server.id}"
              ${server.status !== 'online' ? 'disabled' : ''} title="停止">
              停止
            </button>
            <button class="action-btn restart" data-action="restart" data-id="${server.id}"
              ${server.status !== 'online' ? 'disabled' : ''} title="重启">
              重启
            </button>
            <button class="action-btn delete" data-action="delete" data-id="${server.id}" 
              data-name="${Utils.escapeHtml(server.name)}" title="删除">
              删除
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  /**
   * 渲染空状态
   * @returns {string}
   */
  renderEmpty() {
    return `
      <div class="empty-state">
        <p>📦</p>
        <p>暂无服务器，点击"添加服务器"开始管理</p>
      </div>
    `;
  },

  /**
   * 绑定事件
   */
  bindEvents() {
    // 登出按钮
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.handleLogout();
    });

    // 刷新全部按钮
    document.getElementById('refresh-all-btn').addEventListener('click', () => {
      State.refreshAllServers();
    });

    // 添加服务器按钮
    document.getElementById('add-server-btn').addEventListener('click', () => {
      this.showAddModal();
    });

    // 操作按钮事件委托
    document.querySelector('.server-table-container').addEventListener('click', (e) => {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = parseInt(btn.dataset.id);
      const name = btn.dataset.name;

      this.handleAction(action, id, name);
    });

    // 订阅状态变化
    State.subscribe(() => {
      this.refresh();
    });
  },

  /**
   * 刷新页面
   */
  refresh() {
    const container = document.querySelector('.dashboard-page');
    if (container) {
      container.outerHTML = this.render();
      this.bindEvents();
    }
  },

  /**
   * 处理登出
   */
  async handleLogout() {
    try {
      await API.logout();
      Toast.success('已登出');
      Router.navigate('/login');
    } catch (error) {
      Toast.error(error.message);
    }
  },

  /**
   * 处理操作
   * @param {string} action - 操作类型
   * @param {number} id - 服务器 ID
   * @param {string} name - 服务器名称
   */
  async handleAction(action, id, name) {
    // 删除操作
    if (action === 'delete') {
      const confirmed = await Confirm.delete(name);
      if (confirmed) {
        await State.deleteServer(id);
      }
      return;
    }

    // 启动/停止/重启操作
    const confirmed = await Confirm.action(action, name);
    if (confirmed) {
      await State.controlServer(id, action);
    }
  },

  /**
   * 显示添加服务器模态框
   */
  showAddModal() {
    Modal.open({
      title: '添加服务器',
      content: `
        <form id="add-server-form">
          <div class="form-group">
            <label for="server-name">服务器名称 <span class="required">*</span></label>
            <input type="text" id="server-name" name="name" class="form-control" 
              placeholder="例如：生产服务器1" required>
          </div>
          
          <div class="form-group">
            <label for="server-ip">IP 地址 <span class="required">*</span></label>
            <input type="text" id="server-ip" name="ip" class="form-control" 
              placeholder="例如：192.168.1.100" required>
          </div>
          
          <div class="form-group">
            <label for="server-port">SSH 端口</label>
            <input type="number" id="server-port" name="ssh_port" class="form-control" 
              value="22" min="1" max="65535">
          </div>
          
          <div class="form-group">
            <label for="server-user">SSH 用户名 <span class="required">*</span></label>
            <input type="text" id="server-user" name="ssh_user" class="form-control" 
              placeholder="例如：root" required>
          </div>
          
          <div class="form-group">
            <label>SSH 认证方式 <span class="required">*</span></label>
            <div class="radio-group">
              <label class="radio-item">
                <input type="radio" name="ssh_auth_type" value="password" checked>
                密码认证
              </label>
              <label class="radio-item">
                <input type="radio" name="ssh_auth_type" value="key">
                私钥认证
              </label>
            </div>
          </div>
          
          <div class="form-group" id="password-group">
            <label for="server-password">SSH 密码 <span class="required">*</span></label>
            <input type="password" id="server-password" name="ssh_password" class="form-control" 
              placeholder="请输入 SSH 密码">
          </div>
          
          <div class="form-group hidden" id="key-group">
            <label for="server-key">SSH 私钥 <span class="required">*</span></label>
            <textarea id="server-key" name="ssh_private_key" class="form-control" 
              rows="5" placeholder="请粘贴 SSH 私钥内容"></textarea>
            <p class="form-hint">支持 RSA/ED25519 格式的私钥</p>
          </div>
        </form>
      `,
      buttons: [
        {
          text: '取消',
          class: 'btn-secondary'
        },
        {
          text: '添加',
          class: 'btn-primary',
          onClick: () => this.handleAddServer(),
          closeOnClick: false
        }
      ]
    });

    // 绑定认证方式切换
    const authRadios = document.querySelectorAll('input[name="ssh_auth_type"]');
    const passwordGroup = document.getElementById('password-group');
    const keyGroup = document.getElementById('key-group');

    authRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.value === 'password') {
          passwordGroup.classList.remove('hidden');
          keyGroup.classList.add('hidden');
        } else {
          passwordGroup.classList.add('hidden');
          keyGroup.classList.remove('hidden');
        }
      });
    });
  },

  /**
   * 处理添加服务器
   */
  async handleAddServer() {
    const form = document.getElementById('add-server-form');
    const formData = new FormData(form);

    const data = {
      name: formData.get('name').trim(),
      ip: formData.get('ip').trim(),
      ssh_port: parseInt(formData.get('ssh_port')) || 22,
      ssh_user: formData.get('ssh_user').trim(),
      ssh_auth_type: formData.get('ssh_auth_type'),
      ssh_password: formData.get('ssh_password'),
      ssh_private_key: formData.get('ssh_private_key')
    };

    // 验证
    if (!data.name) {
      Toast.error('请输入服务器名称');
      return;
    }

    if (!Utils.isValidIP(data.ip)) {
      Toast.error('请输入正确的 IP 地址');
      return;
    }

    if (!data.ssh_user) {
      Toast.error('请输入 SSH 用户名');
      return;
    }

    if (data.ssh_auth_type === 'password' && !data.ssh_password) {
      Toast.error('请输入 SSH 密码');
      return;
    }

    if (data.ssh_auth_type === 'key' && !data.ssh_private_key) {
      Toast.error('请输入 SSH 私钥');
      return;
    }

    // 禁用按钮
    Modal.setButtonState(1, true);

    // 添加服务器
    const success = await State.addServer(data);

    if (success) {
      Modal.close();
    } else {
      Modal.setButtonState(1, false);
    }
  },

  /**
   * 页面初始化
   */
  async init() {
    // 加载服务器列表
    await State.loadServers();
  },

  /**
   * 页面销毁
   */
  destroy() {
    // 清理工作
  }
};

// 导出（挂载到 window）
window.DashboardPage = DashboardPage;