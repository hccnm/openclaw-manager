/**
 * 模态框组件
 */

const Modal = {
  overlay: null,
  modal: null,
  isOpen: false,
  onClose: null,

  /**
   * 初始化模态框
   */
  init() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title"></h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer"></div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // 点击背景关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // 点击关闭按钮
    this.overlay.querySelector('.modal-close').addEventListener('click', () => {
      this.close();
    });

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  },

  /**
   * 打开模态框
   * @param {object} options - 配置选项
   * @param {string} options.title - 标题
   * @param {string} options.content - 内容 HTML
   * @param {Array} options.buttons - 按钮配置
   * @param {Function} options.onClose - 关闭回调
   * @param {boolean} options.closable - 是否可关闭（点击背景）
   */
  open(options = {}) {
    this.init();

    const { title = '', content = '', buttons = [], onClose = null, closable = true } = options;

    // 设置标题
    this.overlay.querySelector('.modal-title').textContent = title;

    // 设置内容
    this.overlay.querySelector('.modal-body').innerHTML = content;

    // 设置按钮
    const footer = this.overlay.querySelector('.modal-footer');
    footer.innerHTML = '';

    if (buttons.length === 0) {
      footer.style.display = 'none';
    } else {
      footer.style.display = 'flex';
      buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `btn ${btn.class || 'btn-secondary'}`;
        button.textContent = btn.text;
        button.disabled = btn.disabled;

        button.addEventListener('click', () => {
          if (btn.onClick) {
            btn.onClick();
          }
          if (btn.closeOnClick !== false) {
            this.close();
          }
        });

        footer.appendChild(button);
      });
    }

    // 设置是否可关闭
    this.overlay.style.pointerEvents = closable ? 'auto' : 'none';
    this.overlay.querySelector('.modal').style.pointerEvents = 'auto';

    // 保存关闭回调
    this.onClose = onClose;

    // 显示
    this.overlay.classList.add('active');
    this.isOpen = true;

    // 聚焦到第一个输入框
    setTimeout(() => {
      const input = this.overlay.querySelector('input, textarea');
      if (input) input.focus();
    }, 100);
  },

  /**
   * 关闭模态框
   */
  close() {
    if (!this.overlay) return;

    this.overlay.classList.remove('active');
    this.isOpen = false;

    if (this.onClose) {
      this.onClose();
      this.onClose = null;
    }
  },

  /**
   * 获取模态框中的元素
   * @param {string} selector - 选择器
   * @returns {HTMLElement}
   */
  query(selector) {
    return this.overlay?.querySelector(selector);
  },

  /**
   * 设置按钮状态
   * @param {number} index - 按钮索引
   * @param {boolean} disabled - 是否禁用
   */
  setButtonState(index, disabled) {
    const buttons = this.overlay?.querySelectorAll('.modal-footer .btn');
    if (buttons && buttons[index]) {
      buttons[index].disabled = disabled;
    }
  }
};

// 导出（挂载到 window）
window.Modal = Modal;