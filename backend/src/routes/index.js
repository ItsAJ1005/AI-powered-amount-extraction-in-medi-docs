const express = require('express');
const router = express.Router();

// Process medical bill/receipt
router.post('/process', async (req, res, next) => {
  try {
    // TODO: Implement image processing pipeline
    res.status(200).json({
      success: true,
      message: 'Processing endpoint is working',
      data: {
        // Will contain processed amounts
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
