const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PipelineService = require('../services/pipelineService');

const router = express.Router();

// Configure multer for file uploads with error handling
const upload = multer({
  dest: 'uploads/',
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/jpg', 
      'application/pdf',
      'image/webp',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type');
      error.code = 'INVALID_FILE_TYPE';
      error.message = 'Only JPEG, PNG, WebP images, PDF, and text files are allowed';
      cb(error, false);
    }
  }
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    code: err.code
  });

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      currency: 'INR',
      amounts: [],
      status: 'error'
    });
  }

  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(415).json({
      currency: 'INR',
      amounts: [],
      status: 'error'
    });
  }

  // Handle other errors
  res.status(500).json({
    currency: 'INR',
    amounts: [],
    status: 'error'
  });
};

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: amount-detect-api
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'amount-detect-api',
    version: '1.0.0'
  });
});

/**
 * @swagger
 * /api/parse:
 *   post:
 *     summary: Parse a document for monetary amounts
 *     description: Extract and classify monetary amounts from an uploaded document or text
 *     tags: [Parse]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to process (JPEG, PNG, WebP, PDF, or TXT)
 *               text:
 *                 type: string
 *                 description: Direct text input as an alternative to file upload
 *     responses:
 *       200:
 *         description: >
 *           Success response. Possible scenarios:
 *           - Successfully processed the document (status: 'ok')
 *           - No text content found in the document (status: 'no_amounts_found')
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ParseResponse'
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: ['no_amounts_found']
 *                       example: 'no_amounts_found'
 *                     reason:
 *                       type: string
 *                       example: 'no text content'
 *       400:
 *         description: Bad request - neither file nor text provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       413:
 *         description: File too large (max 10MB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       415:
 *         description: Unsupported media type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/parse', upload.single('file'), async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    // Check if either file or text is provided
    if (!req.file && !req.body?.text) {
      return res.status(400).json({
        currency: 'INR',
        amounts: [],
        status: 'error'
      });
    }

    try {
      let result;
      const startTime = Date.now();
      
      if (req.file) {
        // Process file upload
        const fileContent = fs.readFileSync(req.file.path);
        result = await PipelineService.process(fileContent);
        
        // Clean up the uploaded file
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.warn('Failed to delete uploaded file:', e);
        }
      } else {
        // Process direct text input
        result = await PipelineService.process(req.body.text);
      }

      // Remove any timing or temporary fields before sending response
      const { processingTimeMs, timestamp, ...responseData } = result;
      res.json(responseData);
      
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({
        currency: 'INR',
        amounts: [],
        status: 'error'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Register error handling middleware
router.use(errorHandler);

module.exports = router;
