const express = require('express');
const router = express.Router();
const apiRoutes = require('./api');

// Mount API routes at root since they're already prefixed with /api in app.js
router.use('/', apiRoutes);

// Legacy endpoint (for backward compatibility)
router.post('/process', (req, res) => {
  res.status(410).json({
    status: 'deprecated',
    message: 'This endpoint is deprecated. Please use /api/parse instead.',
    info: 'Use POST /api/parse with either a file or text input'
  });
});

// 404 handler for undefined routes
router.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Route Error:', err);
  
  res.status(err.status || 500).json({
    status: 'error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

module.exports = router;
