const Tesseract = require('tesseract.js');
const sharp = require('sharp');

class OCRService {
  /**
   * Extract raw numeric tokens from text or image
   * @param {Buffer|string} input - Image buffer or text string
   * @returns {Promise<Object>} - {raw_tokens: string[], currency_hint: string, confidence: number, status: string, reason?: string}
   */
  static async extractNumericTokens(input) {
    try {
      let text = '';
      let confidence = 1.0;

      if (Buffer.isBuffer(input)) {
        // Preprocess image with sharp
        const processedImage = await sharp(input)
          .grayscale()
          .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
          .normalize()
          .sharpen()
          .toBuffer();

        // Process image with Tesseract
        const { data } = await Tesseract.recognize(
          processedImage,
          'eng',
          {
            logger: m => console.log(m.status),
            tessedit_char_whitelist: '0123456789.,%$€£¥₹RsINRUSD ',
            preserve_interword_spaces: '1'
          }
        );
        
        text = data.text;
        confidence = data.confidence / 100; // Normalize to 0-1 range
      } else if (typeof input === 'string') {
        text = input;
      } else {
        throw new Error('Unsupported input type');
      }

      // Extract numeric patterns
      const raw_tokens = this.extractNumericStrings(text);
      const currency_hint = this.detectCurrency(text) || 'INR';

      // Apply guardrail for insufficient tokens
      if (raw_tokens.length < 2) {
        return {
          status: 'no_amounts_found',
          reason: 'document too noisy',
          raw_tokens: [],
          currency_hint,
          confidence: 0
        };
      }

      return {
        status: 'success',
        raw_tokens,
        currency_hint,
        confidence: this.calculateConfidence(confidence, raw_tokens.length)
      };
    } catch (error) {
      console.error('OCR Processing Error:', error);
      return {
        status: 'error',
        reason: error.message,
        raw_tokens: [],
        currency_hint: 'INR',
        confidence: 0
      };
    }
  }

  /**
   * Extract numeric strings including percentages and decimals
   * @param {string} text - Input text
   * @returns {string[]} - Array of matched numeric strings
   */
  static extractNumericStrings(text) {
    // Match numbers with optional decimals, percentages, and currency symbols
    return (text.match(/\d+[.,]?\d*%?/g) || []).map(token => 
      token.replace(/,/g, '') // Remove thousand separators
    );
  }

  /**
   * Detect currency from text
   * @param {string} text - Input text
   * @returns {string|null} - Detected currency code or null
   */
  static detectCurrency(text) {
    const currencyPatterns = [
      { pattern: /(?:Rs\.?|INR|₹|\u20B9)/, code: 'INR' },
      { pattern: /(?:USD|\$)/, code: 'USD' },
      { pattern: /(?:EUR|€)/, code: 'EUR' },
      { pattern: /(?:GBP|£)/, code: 'GBP' },
      { pattern: /(?:JPY|¥)/, code: 'JPY' }
    ];

    for (const { pattern, code } of currencyPatterns) {
      if (pattern.test(text)) {
        return code;
      }
    }
    return null;
  }

  /**
   * Calculate confidence score based on OCR confidence and token count
   * @param {number} ocrConfidence - Confidence from OCR (0-1)
   * @param {number} tokenCount - Number of tokens found
   * @returns {number} - Combined confidence score (0-1)
   */
  static calculateConfidence(ocrConfidence, tokenCount) {
    // Base confidence is OCR confidence
    let confidence = ocrConfidence;
    
    // Adjust based on token count (more tokens = higher confidence)
    const tokenFactor = Math.min(tokenCount / 10, 1); // Cap at 1.0
    confidence = (confidence * 0.8) + (tokenFactor * 0.2);
    
    // Round to 2 decimal places
    return parseFloat(confidence.toFixed(2));
  }
}

// Test with the sample input
async function test() {
  const sample = "Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%";
  const result = await OCRService.extractNumericTokens(sample);
  console.log('Test Result:', JSON.stringify(result, null, 2));
  // Expected: {raw_tokens: ["1200","1000","200","10%"], currency_hint: "INR", confidence: 0.74}
}

// Uncomment to run test
// test().catch(console.error);

module.exports = OCRService;
