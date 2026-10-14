const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const menuRoutes = require('./menuRoutes');
const orderRoutes = require('./orderRoutes');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
