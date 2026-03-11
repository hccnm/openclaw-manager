/**
 * Toast 提示组件
 */

const Toast = {
  container: null,

  /**
   * 初始化 Toast 容器
   */
  init() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  /**
   * 显示 Toast
   * @param {string} type - 类型：success/error/warning
   * @param {string} message - 消息内容
   * @param {number} duration - 显示时长（毫秒）
   */
  show(type, message, duration = 3000) {
    this.init();

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${Utils.escapeHtml(message)}</span>
      <button class="toast-close">&times;</button>
    `;

    // 关闭按钮事件
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.remove(toast);
    });

    this.container.appendChild(toast);

    // 自动消失
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }
  },

  /**
   * 移除 Toast
   * @param {HTMLElement} toast
   */
  remove(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  },

  /**
   * 成功提示
   * @param {string} message
   */
  success(message) {
    this.show('success', message);
  },

  /**
   * 错误提示
   * @param {string} message
   */
  error(message) {
    this.show('error', message, 5000);
  },

  /**
   * 警告提示
   * @param {string} message
   */
  warning(message) {
    this.show('warning', message);
  }
};

// 导出（挂载到 window）
window.Toast = Toast;