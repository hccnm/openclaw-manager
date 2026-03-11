/**
 * 路由管理
 */

const Router = {
  routes: {
    '/login': LoginPage,
    '/': DashboardPage
  },

  currentPage: null,

  /**
   * 初始化路由
   */
  init() {
    // 监听 hash 变化
    window.addEventListener('hashchange', () => this.handleRoute());

    // 监听认证登出事件
    window.addEventListener('auth:logout', () => {
      this.navigate('/login');
    });

    // 初始路由
    this.handleRoute();
  },

  /**
   * 处理路由
   */
  handleRoute() {
    // 获取 hash 路径
    let path = window.location.hash.slice(1) || '/';

    // 检查认证
    if (!State.isLoggedIn() && path !== '/login') {
      this.navigate('/login');
      return;
    }

    // 已登录时访问登录页，重定向到主页
    if (State.isLoggedIn() && path === '/login') {
      this.navigate('/');
      return;
    }

    // 获取页面组件
    const page = this.routes[path];

    if (!page) {
      // 未知路由，重定向到主页
      this.navigate('/');
      return;
    }

    // 销毁当前页面
    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }

    // 渲染新页面
    const app = document.getElementById('app');
    app.innerHTML = page.render();

    // 绑定事件
    if (page.bindEvents) {
      page.bindEvents();
    }

    // 初始化
    if (page.init) {
      page.init();
    }

    this.currentPage = page;
  },

  /**
   * 导航到指定路径
   * @param {string} path - 目标路径
   */
  navigate(path) {
    window.location.hash = path;
  },

  /**
   * 获取当前路径
   * @returns {string}
   */
  getPath() {
    return window.location.hash.slice(1) || '/';
  }
};

// 导出（挂载到 window）
window.Router = Router;