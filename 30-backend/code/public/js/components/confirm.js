/**
 * 确认框组件
 */

const Confirm = {
  /**
   * 显示确认框
   * @param {object} options - 配置选项
   * @returns {Promise<boolean>}
   */
  show(options = {}) {
    const {
      title = '确认操作',
      message = '',
      confirmText = '确认',
      cancelText = '取消',
      type = 'warning' // warning, danger
    } = options;

    const icons = {
      warning: '⚠️',
      danger: '⚠️'
    };

    return new Promise((resolve) => {
      Modal.open({
        title,
        content: `
          <div class="confirm-dialog">
            <div class="confirm-icon">${icons[type]}</div>
            <div class="confirm-message">${Utils.escapeHtml(message)}</div>
          </div>
        `,
        buttons: [
          {
            text: cancelText,
            class: 'btn-secondary',
            onClick: () => resolve(false)
          },
          {
            text: confirmText,
            class: type === 'danger' ? 'btn-danger' : 'btn-primary',
            onClick: () => resolve(true)
          }
        ],
        closable: true,
        onClose: () => resolve(false)
      });
    });
  },

  /**
   * 删除确认
   * @param {string} name - 服务器名称
   * @returns {Promise<boolean>}
   */
  async delete(name) {
    return this.show({
      title: '删除确认',
      message: `确定要删除服务器 "${name}" 吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger'
    });
  },

  /**
   * 操作确认
   * @param {string} action - 操作名称
   * @param {string} name - 服务器名称
   * @returns {Promise<boolean>}
   */
  async action(action, name) {
    const actionNames = {
      start: '启动',
      stop: '停止',
      restart: '重启'
    };

    return this.show({
      title: '操作确认',
      message: `确定要${actionNames[action]}服务器 "${name}" 的 OpenClaw 实例吗？`,
      confirmText: actionNames[action],
      cancelText: '取消',
      type: 'warning'
    });
  }
};

// 导出（挂载到 window）
window.Confirm = Confirm;