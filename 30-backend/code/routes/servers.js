/**
 * 服务器路由
 */

const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const { authMiddleware } = require('../middlewares/auth');

// 所有路由需要认证
router.use(authMiddleware);

// 服务器列表
router.get('/', serverController.getServers);

// 添加服务器
router.post('/', serverController.addServer);

// 删除服务器
router.delete('/:id', serverController.deleteServer);

// 刷新状态
router.post('/:id/refresh', serverController.refreshServer);

// 控制操作
router.post('/:id/start', serverController.startServer);
router.post('/:id/stop', serverController.stopServer);
router.post('/:id/restart', serverController.restartServer);

// 批量刷新
router.post('/refresh-all', serverController.refreshAll);

module.exports = router;