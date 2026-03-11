/**
 * 登录页组件
 */

const LoginPage = {
  /**
   * 渲染页面
   * @returns {string}
   */
  render() {
    return `
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">
            <h1>🦞 OpenClaw Manager</h1>
            <p>OpenClaw 实例管理系统</p>
          </div>
          <form class="login-form" id="login-form">
            <div class="form-group">
              <label for="username">用户名</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                class="form-control" 
                placeholder="请输入用户名"
                autocomplete="username"
                required
              >
            </div>
            <div class="form-group">
              <label for="password">密码</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                class="form-control" 
                placeholder="请输入密码"
                autocomplete="current-password"
                required
              >
            </div>
            <button type="submit" class="btn btn-primary" id="login-btn">
              登 录
            </button>
          </form>
        </div>
      </div>
    `;
  },

  /**
   * 绑定事件
   */
  bindEvents() {
    const form = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');

    // 表单提交
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!username || !password) {
        Toast.error('请输入用户名和密码');
        return;
      }

      // 禁用按钮
      loginBtn.disabled = true;
      loginBtn.textContent = '登录中...';

      try {
        const result = await API.login(username, password);

        if (result.success) {
          Toast.success('登录成功');
          // 跳转到主页
          setTimeout(() => {
            Router.navigate('/');
          }, 500);
        } else {
          Toast.error(result.error?.message || '登录失败');
          loginBtn.disabled = false;
          loginBtn.textContent = '登 录';
        }
      } catch (error) {
        Toast.error(error.message);
        loginBtn.disabled = false;
        loginBtn.textContent = '登 录';
      }
    });

    // 聚焦到用户名输入框
    usernameInput.focus();
  },

  /**
   * 页面销毁
   */
  destroy() {
    // 清理工作
  }
};

// 导出（挂载到 window）
window.LoginPage = LoginPage;