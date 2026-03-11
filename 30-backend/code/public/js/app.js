/**
 * OpenClaw Manager - 应用入口
 * 
 * 一个轻量级的 OpenClaw 实例管理系统
 * MVP 版本 - 2026-03-11
 */

(function() {
  'use strict';

  /**
   * 应用初始化
   */
  function init() {
    console.log('OpenClaw Manager initializing...');

    // 隐藏加载屏幕
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }

    // 初始化路由
    Router.init();
  }

  /**
   * DOM 加载完成后初始化应用
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();