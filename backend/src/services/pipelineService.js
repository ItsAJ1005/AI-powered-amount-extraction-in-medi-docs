const OCRService = require('./ocrService');
const NormalizationService = require('./normalizationService');
const ClassificationService = require('./classificationService');

class PipelineService {
  /**
   * Process document through the complete pipeline
   * @param {Buffer|string} input - Image buffer or text string
   * @returns {Promise<Object>} - Final processed result
   */
  static async processDocument(input) {
    try {
      // 1. OCR Extraction
      const { raw_tokens, currency_hint, confidence: ocrConfidence } = 
        await OCRService.extractNumericTokens(input);
      
      // 2. Normalization
      const { normalized_amounts, normalization_confidence } = 
        NormalizationService.normalizeTokens(raw_tokens);
      
      // 3. Classification
      const text = Buffer.isBuffer(input) ? null : input;
      const { amounts, confidence: classification_confidence } = 
        ClassificationService.classifyAmounts(text, normalized_amounts);
      
      // Calculate overall confidence
      const overall_confidence = this.calculateOverallConfidence(
        ocrConfidence,
        normalization_confidence,
        classification_confidence
      );

      // 4. Format final output
      return {
        success: true,
        currency: currency_hint,
        amounts,
        metadata: {
          raw_tokens,
          normalized_amounts,
          confidence: {
            ocr: ocrConfidence,
            normalization: normalization_confidence,
            classification: classification_confidence,
            overall: overall_confidence
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Pipeline processing error:', error);
      return {
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  static calculateOverallConfidence(ocrConfidence, normConfidence, classConfidence) {
    // Weighted average based on importance of each step
    const weights = {
      ocr: 0.4,      // OCR is most critical
      normalization: 0.3,
      classification: 0.3
    };

    const weightedSum = (
      (ocrConfidence * weights.ocr) +
      (normConfidence * weights.normalization) +
      (classConfidence * weights.classification)
    );

    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    return parseFloat((weightedSum / totalWeight).toFixed(2));
  }
}

module.exports = PipelineService;
