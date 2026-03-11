/**
 * 工具函数
 */

const Utils = {
  /**
   * 格式化日期时间
   * @param {string|Date} date - 日期
   * @returns {string} 格式化后的字符串
   */
  formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  },

  /**
   * 格式化相对时间
   * @param {string|Date} date - 日期
   * @returns {string} 相对时间描述
   */
  formatRelativeTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const now = new Date();
    const diff = now - d;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return this.formatDateTime(date);
  },

  /**
   * 验证 IP 地址格式
   * @param {string} ip - IP 地址
   * @returns {boolean}
   */
  isValidIP(ip) {
    const regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!regex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  },

  /**
   * 验证端口号
   * @param {number} port - 端口号
   * @returns {boolean}
   */
  isValidPort(port) {
    const num = parseInt(port);
    return !isNaN(num) && num >= 1 && num <= 65535;
  },

  /**
   * 转义 HTML
   * @param {string} text - 原始文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * 防抖函数
   * @param {Function} fn - 要执行的函数
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Function}
   */
  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * 获取状态显示信息
   * @param {string} status - 状态值
   * @returns {{text: string, class: string, icon: string}}
   */
  getStatusInfo(status) {
    const statusMap = {
      online: { text: '在线', class: 'online', icon: '🟢' },
      offline: { text: '离线', class: 'offline', icon: '🔴' },
      unknown: { text: '未知', class: 'unknown', icon: '⚪' }
    };
    return statusMap[status] || statusMap.unknown;
  }
};

// 导出（挂载到 window）
window.Utils = Utils;