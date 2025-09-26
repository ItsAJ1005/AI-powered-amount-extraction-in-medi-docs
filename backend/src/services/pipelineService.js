const OCRService = require('./ocrService');
const NormalizationService = require('./normalizationService');
const ClassificationService = require('./classificationService');

class PipelineService {
  /**
   * Process document through the complete pipeline
   * @param {Buffer|string} input - Image buffer or text string
   * @returns {Promise<Object>} - Final processed result matching the required format
   */
  static async processDocument(input) {
    try {
      // 1. OCR Extraction
      const ocrResult = await OCRService.extractNumericTokens(input);
      
      // Check OCR guardrail
      if (ocrResult.status === 'no_amounts_found') {
        return {
          currency: 'INR',
          amounts: [],
          status: 'error',
          error: ocrResult.reason || 'No amounts found in document'
        };
      }

      // 2. Normalization
      const normResult = NormalizationService.normalizeTokens(ocrResult.raw_tokens);
      
      // Check normalization guardrail
      if (normResult.normalized_amounts.length === 0) {
        return {
          currency: ocrResult.currency_hint || 'INR',
          amounts: [],
          status: 'error',
          error: 'No valid amounts found after normalization'
        };
      }

      // 3. Classification (only if we have text input)
      const text = Buffer.isBuffer(input) ? null : input;
      let classificationResult;
      
      if (text) {
        classificationResult = ClassificationService.classifyAmounts(
          text,
          normResult.normalized_amounts
        );
      } else {
        // Fallback: assign default types if we can't classify (e.g., for image input without OCR text)
        classificationResult = {
          amounts: normResult.normalized_amounts.map((amount, index) => ({
            type: this.getFallbackType(index, normResult.normalized_amounts.length),
            value: amount,
            confidence: 0.7,
            provenance: 'No text context available for classification'
          })),
          confidence: 0.7
        };
      }

      // 4. Format final output
      return this.formatOutput(
        ocrResult.currency_hint || 'INR',
        classificationResult.amounts,
        {
          ocr_confidence: ocrResult.confidence,
          normalization_confidence: normResult.normalization_confidence,
          classification_confidence: classificationResult.confidence
        }
      );
      
    } catch (error) {
      console.error('Pipeline processing error:', error);
      return {
        currency: 'INR',
        amounts: [],
        status: 'error',
        error: error.message || 'Failed to process document'
      };
    }
  }

  /**
   * Format the final output according to the required schema
   */
  static formatOutput(currency, amounts, confidenceScores = {}) {
    // Filter out low confidence amounts (below 0.5)
    const validAmounts = amounts.filter(amt => amt.confidence >= 0.5);
    
    // Sort by type priority for consistent output
    const typePriority = {
      'total_bill': 1,
      'paid': 2,
      'due': 3,
      'tax': 4,
      'discount': 5,
      'other': 6
    };
    
    const sortedAmounts = [...validAmounts].sort((a, b) => {
      const priorityA = typePriority[a.type] || 99;
      const priorityB = typePriority[b.type] || 99;
      return priorityA - priorityB || b.value - a.value; // Then sort by value desc
    });

    // Calculate overall confidence (weighted average)
    const weights = {
      ocr_confidence: 0.4,
      normalization_confidence: 0.3,
      classification_confidence: 0.3
    };
    
    const overallConfidence = Object.entries(confidenceScores).reduce(
      (sum, [key, score]) => sum + (score * (weights[key] || 0)),
      0
    );

    // Format the amounts array
    const formattedAmounts = sortedAmounts.map(amt => ({
      type: amt.type,
      value: amt.value,
      source: amt.provenance || 'Unknown source'
    }));

    // Determine status based on confidence and number of amounts
    let status = 'ok';
    if (validAmounts.length === 0) {
      status = 'error';
    } else if (overallConfidence < 0.6 || validAmounts.length < amounts.length) {
      status = 'warning';
    }

    return {
      currency: currency || 'INR',
      amounts: formattedAmounts,
      status: status,
      ...(status !== 'ok' ? { 
        _warnings: [
          ...(overallConfidence < 0.6 ? ['Low confidence in extraction'] : []),
          ...(validAmounts.length < amounts.length ? ['Some amounts were filtered out'] : [])
        ]
      } : {})
    };
  }

  /**
   * Get fallback type based on position (used when classification isn't possible)
   */
  static getFallbackType(index, total) {
    if (index === 0 && total > 1) return 'total_bill';
    if (index === 1 && total > 2) return 'paid';
    if (index === total - 1) return 'due';
    return 'other';
  }
}

// Test with sample input
async function test() {
  const sampleText = "Total: INR 1200 | Paid: 1000 | Due: 200";
  
  console.log('Testing with sample text:');
  const result = await PipelineService.processDocument(sampleText);
  console.log(JSON.stringify(result, null, 2));
  
  /* Expected output:
  {
    "currency": "INR",
    "amounts": [
      {"type": "total_bill", "value": 1200, "source": "text: 'Total: INR 1200'"},
      {"type": "paid", "value": 1000, "source": "text: 'Paid: 1000'"},
      {"type": "due", "value": 200, "source": "text: 'Due: 200'"}
    ],
    "status": "ok"
  }
  */
}

// Uncomment to run test
// test().catch(console.error);

module.exports = PipelineService;
