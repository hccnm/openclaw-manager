# 前端架构设计

## 1. 架构概览

采用单页面应用（SPA）架构，纯 HTML + CSS + JavaScript 实现，无框架依赖。

```
┌─────────────────────────────────────────────────────────┐
│                    index.html                           │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Router    │  │   State     │  │    API      │    │
│  │   (路由)    │  │  (状态管理) │  │   (请求)    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Components (组件)                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │ LoginPage│ │ Dashboard│ │  Modal   │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │ Toast    │ │ ServerRow│ │ ConfirmDlg│      │   │
│  │  └──────────┘ └──────────┘ └──────────┘       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 2. 文件结构

```
code/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── app.js          # 应用入口
│   ├── router.js       # 路由管理
│   ├── state.js        # 状态管理
│   ├── api.js          # API 请求封装
│   ├── auth.js         # 认证模块
│   ├── components/
│   │   ├── login.js    # 登录页组件
│   │   ├── dashboard.js # 主页组件
│   │   ├── modal.js    # 模态框组件
│   │   ├── toast.js    # 提示组件
│   │   └── confirm.js  # 确认框组件
│   └── utils/
│       ├── dom.js      # DOM 操作工具
│       └── format.js   # 格式化工具
└── assets/
    └── favicon.ico     # 图标
```

## 3. 核心模块设计

### 3.1 路由模块 (router.js)

```javascript
// 简单的 hash 路由
const routes = {
  '/login': LoginPage,
  '/': Dashboard
};

function navigate(path) {
  window.location.hash = path;
}

function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
```

### 3.2 状态管理 (state.js)

```javascript
// 简单的响应式状态
const state = {
  user: null,
  servers: [],
  loading: false,
  
  setState(newState) {
    Object.assign(this, newState);
    this.notify();
  },
  
  subscribe(listener) {
    this.listeners.push(listener);
  },
  
  notify() {
    this.listeners.forEach(l => l(this));
  }
};
```

### 3.3 API 模块 (api.js)

```javascript
// API 请求封装
const API = {
  baseURL: '/api',
  
  async request(method, path, data) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    };
    if (data) options.body = JSON.stringify(data);
    
    const res = await fetch(this.baseURL + path, options);
    return res.json();
  },
  
  // 认证
  login: (data) => API.request('POST', '/auth/login', data),
  logout: () => API.request('POST', '/auth/logout'),
  
  // 服务器
  getServers: () => API.request('GET', '/servers'),
  addServer: (data) => API.request('POST', '/servers', data),
  deleteServer: (id) => API.request('DELETE', `/servers/${id}`),
  refreshServer: (id) => API.request('POST', `/servers/${id}/refresh`),
  startServer: (id) => API.request('POST', `/servers/${id}/start`),
  stopServer: (id) => API.request('POST', `/servers/${id}/stop`),
  restartServer: (id) => API.request('POST', `/servers/${id}/restart`),
  refreshAll: () => API.request('POST', '/servers/refresh-all')
};
```

### 3.4 组件系统

采用函数式组件 + 模板字符串方式：

```javascript
// 组件基类
function Component(props) {
  this.props = props;
  this.el = null;
}

Component.prototype = {
  render() {
    return '<div></div>';
  },
  
  mount(container) {
    container.innerHTML = this.render();
    this.el = container.firstElementChild;
    this.bindEvents();
  },
  
  bindEvents() {
    // 绑定事件
  },
  
  update(newProps) {
    this.props = { ...this.props, ...newProps };
    this.mount(this.el.parentElement);
  }
};
```

## 4. 页面组件设计

### 4.1 登录页 (LoginPage)

```
┌─────────────────────────────────────┐
│          OpenClaw Manager           │
│                                     │
│    ┌─────────────────────────┐     │
│    │ 用户名                  │     │
│    │ [___________________]   │     │
│    │                         │     │
│    │ 密码                    │     │
│    │ [___________________]   │     │
│    │                         │     │
│    │     [    登 录    ]     │     │
│    └─────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

功能：
- 表单验证
- 回车提交
- Loading 状态
- 错误提示

### 4.2 主页 (Dashboard)

```
┌─────────────────────────────────────────────────────────────────┐
│ OpenClaw Manager              [刷新全部] [添加服务器] [登出]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 名称      │ IP           │ 状态  │ 版本   │ 操作        │ │
│  ├───────────┼──────────────┼───────┼────────┼─────────────┤ │
│  │ 服务器1   │ 192.168.1.100│ 🟢在线│ v1.2.3 │启 停 重 删 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  最后更新: 2026-03-11 10:30:00                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

功能：
- 服务器列表展示
- 状态颜色区分
- 操作按钮
- 刷新全部

### 4.3 模态框 (Modal)

统一的模态框容器，支持：
- 添加服务器表单
- 操作确认对话框
- 点击背景关闭
- ESC 键关闭

## 5. 样式设计

### 5.1 颜色规范

```css
:root {
  --primary: #3498db;      /* 主色调 */
  --success: #27ae60;      /* 成功/在线 */
  --danger: #e74c3c;        /* 危险/离线 */
  --warning: #f39c12;      /* 警告 */
  --gray: #95a5a6;         /* 未知状态 */
  --bg: #f5f6fa;           /* 背景色 */
  --card: #ffffff;         /* 卡片背景 */
  --text: #2c3e50;         /* 文字颜色 */
  --border: #dcdde1;       /* 边框颜色 */
}
```

### 5.2 响应式断点

```css
/* 桌面端 */
@media (min-width: 1280px) { ... }

/* 平板 */
@media (min-width: 768px) and (max-width: 1279px) { ... }
```

## 6. 交互设计

### 6.1 Toast 提示

```javascript
// 成功提示
toast.success('操作成功');

// 错误提示
toast.error('操作失败：网络错误');

// 自动消失（3秒）
```

### 6.2 确认对话框

```javascript
const result = await confirm.show({
  title: '确认操作',
  message: '确定要重启该实例吗？',
  confirmText: '确认',
  cancelText: '取消'
});
```

### 6.3 Loading 状态

- 按钮点击后显示 loading spinner
- 禁用重复点击
- API 返回后恢复

## 7. 安全设计

### 7.1 Token 管理

```javascript
// 存储
localStorage.setItem('token', token);

// 读取
function getToken() {
  return localStorage.getItem('token');
}

// 清除
function clearToken() {
  localStorage.removeItem('token');
}
```

### 7.2 认证拦截

```javascript
// 路由守卫
function requireAuth() {
  if (!getToken()) {
    navigate('/login');
    return false;
  }
  return true;
}

// API 拦截
async function request(method, path, data) {
  // 401 自动跳转登录
  if (res.status === 401) {
    clearToken();
    navigate('/login');
  }
}
```

## 8. 性能优化

1. **最小化 DOM 操作**: 使用 innerHTML 批量更新
2. **事件委托**: 列表使用事件委托
3. **防抖**: 刷新按钮添加防抖
4. **并发请求**: 刷新全部使用 Promise.all