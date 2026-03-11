/**
 * 路由入口
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const serverRoutes = require('./servers');

// API 路由
router.use('/auth', authRoutes);
router.use('/servers', serverRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    } 
  });
});

module.exports = router;