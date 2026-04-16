const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbLabels = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbLabels[dbStatus] || 'unknown',
      connected: dbStatus === 1,
    },
    services: {
      ai: !!process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('xxxx'),
      email: !!process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your.email'),
    },
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
