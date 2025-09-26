const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OCRService = require('../services/ocrService');
const NormalizationService = require('../services/normalizationService');
const ClassificationService = require('../services/classificationService');
const PipelineService = require('../services/pipelineService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'amount-detect-api',
    version: '1.0.0'
  });
});

// Main parse endpoint
router.post('/parse', upload.single('file'), async (req, res, next) => {
  try {
    const { step = 'full' } = req.query;
    const validSteps = ['ocr', 'normalize', 'classify', 'full'];
    
    // Validate step parameter
    if (!validSteps.includes(step)) {
      return res.status(400).json({
        status: 'error',
        error: `Invalid step. Must be one of: ${validSteps.join(', ')}`
      });
    }

    let input, isText = false;
    
    // Handle file upload or text input
    if (req.file) {
      // Read the uploaded file
      input = fs.readFileSync(req.file.path);
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
    } else if (req.body.text) {
      // Use text input
      input = req.body.text;
      isText = true;
    } else {
      return res.status(400).json({
        status: 'error',
        error: 'Either a file or text must be provided'
      });
    }

    // Process based on requested step
    let result;
    switch (step) {
      case 'ocr':
        result = await processOCR(input, isText);
        break;
      case 'normalize':
        const ocrResult = await processOCR(input, isText);
        result = await processNormalize(ocrResult);
        break;
      case 'classify':
        if (!isText) {
          return res.status(400).json({
            status: 'error',
            error: 'Text input is required for classification step'
          });
        }
        result = await processClassify(input, req.body.amounts);
        break;
      case 'full':
      default:
        result = await processFullPipeline(input, isText);
        break;
    }

    res.json({
      status: 'ok',
      ...result
    });

  } catch (error) {
    console.error('API Error:', error);
    next(error);
  }
});

// Helper functions for each processing step
async function processOCR(input, isText) {
  if (isText) {
    return OCRService.extractNumericTokens(input);
  } else {
    return OCRService.extractNumericTokens(input);
  }
}

async function processNormalize(ocrResult) {
  if (ocrResult.status === 'no_amounts_found') {
    return {
      status: 'error',
      error: 'No amounts found in the document',
      ...ocrResult
    };
  }
  
  const normResult = NormalizationService.normalizeTokens(ocrResult.raw_tokens);
  
  return {
    currency: ocrResult.currency_hint || 'INR',
    raw_tokens: ocrResult.raw_tokens,
    normalized_amounts: normResult.normalized_amounts,
    confidence: normResult.normalization_confidence
  };
}

async function processClassify(text, amounts) {
  if (!amounts || !Array.isArray(amounts)) {
    return {
      status: 'error',
      error: 'Amounts array is required for classification'
    };
  }
  
  const classificationResult = ClassificationService.classifyAmounts(text, amounts);
  
  return {
    amounts: classificationResult.amounts.map(amt => ({
      type: amt.type,
      value: amt.value,
      source: amt.provenance
    })),
    confidence: classificationResult.confidence
  };
}

async function processFullPipeline(input, isText) {
  // Use the pipeline service for end-to-end processing
  const result = await PipelineService.processDocument(input);
  
  // Format the result to match the required output
  return {
    currency: result.currency,
    amounts: result.amounts,
    status: result.status,
    ...(result._warnings && { _warnings: result._warnings })
  };
}

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      status: 'error',
      error: 'File too large. Maximum size is 10MB.'
    });
  }
  
  // Handle other errors
  res.status(500).json({
    status: 'error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

module.exports = router;
