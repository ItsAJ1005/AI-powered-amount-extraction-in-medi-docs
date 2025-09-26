const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, query, validationResult } = require('express-validator');
const OCRService = require('../services/ocrService');
const NormalizationService = require('../services/normalizationService');
const ClassificationService = require('../services/classificationService');
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
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type');
      error.code = 'INVALID_FILE_TYPE';
      error.message = 'Only JPEG, PNG, WebP images and PDF files are allowed';
      cb(error, false);
    }
  }
});

// Input validation middleware
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      status: 'error',
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'amount-detect-api',
    version: '1.0.0'
  });
});

// Main parse endpoint with validation
router.post('/parse', 
  upload.single('file'),
  [
    query('step')
      .optional()
      .isIn(['ocr', 'normalize', 'classify', 'full'])
      .withMessage('Invalid step parameter'),
    body('text')
      .if((value, { req }) => !req.file)
      .notEmpty()
      .withMessage('Either file or text input is required')
      .isString()
      .withMessage('Text must be a string')
      .isLength({ max: 10000 })
      .withMessage('Text too long (max 10000 characters)'),
    body('amounts')
      .if((value, { req }) => req.query.step === 'classify')
      .isArray({ min: 1 })
      .withMessage('Amounts array is required for classification')
      .custom(amounts => 
        amounts.every(amount => 
          typeof amount === 'number' && !isNaN(amount) && isFinite(amount)
        )
      )
      .withMessage('All amounts must be valid numbers')
  ],
  validateInput,
  async (req, res, next) => {
    try {
      const { step = 'full' } = req.query;
      let input, isText = false;
      
      // Handle file upload or text input
      if (req.file) {
        try {
          input = fs.readFileSync(req.file.path);
          // Clean up the uploaded file
          fs.unlinkSync(req.file.path);
        } catch (fileError) {
          console.error('File processing error:', fileError);
          throw new Error('Failed to process uploaded file');
        }
      } else {
        input = req.body.text;
        isText = true;
      }

      // Process based on requested step
      let result;
      try {
        switch (step) {
          case 'ocr':
            result = await processOCR(input, isText);
            break;
          case 'normalize':
            const ocrResult = await processOCR(input, isText);
            result = await processNormalize(ocrResult);
            break;
          case 'classify':
            result = await processClassify(input, req.body.amounts);
            break;
          case 'full':
          default:
            result = await processFullPipeline(input, isText);
            break;
        }
      } catch (processError) {
        console.error('Processing error:', processError);
        throw new Error('Failed to process document');
      }

      // Handle guardrail responses
      if (result.status === 'no_amounts_found') {
        return res.status(200).json({
          status: 'no_amounts_found',
          reason: 'document too noisy'
        });
      }

      // Handle low confidence results
      if (result.confidence !== undefined && result.confidence < 0.5) {
        return res.status(200).json({
          status: 'low_confidence',
          reason: 'low confidence in extracted amounts',
          confidence: result.confidence,
          ...(result.amounts && { amounts: result.amounts })
        });
      }

      // Successful response
      res.json({
        status: 'ok',
        ...result
      });

    } catch (error) {
      console.error('API Error:', error);
      next(error);
    }
  }
);

// Helper functions for each processing step
async function processOCR(input, isText) {
  try {
    const result = await OCRService.extractNumericTokens(input);
    
    // Handle guardrail responses from OCR
    if (result.status === 'no_amounts_found') {
      return {
        status: 'no_amounts_found',
        reason: 'document too noisy'
      };
    }
    
    return result;
  } catch (error) {
    console.error('OCR Processing Error:', error);
    throw new Error('Failed to process document with OCR');
  }
}

async function processNormalize(ocrResult) {
  try {
    // If OCR already returned a guardrail response, pass it through
    if (ocrResult.status === 'no_amounts_found') {
      return ocrResult;
    }
    
    const normResult = NormalizationService.normalizeTokens(ocrResult.raw_tokens || []);
    
    // Check if normalization produced any valid amounts
    if (!normResult.normalized_amounts || normResult.normalized_amounts.length === 0) {
      return {
        status: 'no_amounts_found',
        reason: 'no valid amounts found after normalization'
      };
    }
    
    return {
      currency: ocrResult.currency_hint || 'INR',
      raw_tokens: ocrResult.raw_tokens,
      normalized_amounts: normResult.normalized_amounts,
      confidence: normResult.normalization_confidence
    };
  } catch (error) {
    console.error('Normalization Error:', error);
    throw new Error('Failed to normalize amounts');
  }
}

async function processClassify(text, amounts) {
  try {
    const classificationResult = ClassificationService.classifyAmounts(text, amounts);
    
    return {
      amounts: classificationResult.amounts.map(amt => ({
        type: amt.type,
        value: amt.value,
        source: amt.provenance
      })),
      confidence: classificationResult.confidence
    };
  } catch (error) {
    console.error('Classification Error:', error);
    throw new Error('Failed to classify amounts');
  }
}

async function processFullPipeline(input, isText) {
  try {
    const result = await PipelineService.processDocument(input);
    
    // Handle guardrail responses from pipeline
    if (result.status === 'error' || result.status === 'no_amounts_found') {
      return {
        status: 'no_amounts_found',
        reason: result.error || 'No amounts found in document'
      };
    }
    
    return {
      currency: result.currency || 'INR',
      amounts: result.amounts || [],
      confidence: result.confidence,
      ...(result._warnings && { _warnings: result._warnings })
    };
  } catch (error) {
    console.error('Pipeline Error:', error);
    throw new Error('Failed to process document');
  }
}

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('API Error:', {
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      status: 'error',
      error: 'File too large. Maximum size is 10MB.'
    });
  }
  
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      status: 'error',
      error: err.message || 'Invalid file type'
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError' || err.name === 'SyntaxError') {
    return res.status(400).json({
      status: 'error',
      error: 'Invalid request data',
      details: err.message
    });
  }
  
  // Handle guardrail responses
  if (err.status === 'no_amounts_found') {
    return res.status(200).json({
      status: 'no_amounts_found',
      reason: err.reason || 'No amounts found in document'
    });
  }
  
  // Default error response
  const errorResponse = {
    status: 'error',
    error: 'Internal server error'
  };
  
  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(500).json(errorResponse);
});

module.exports = router;
