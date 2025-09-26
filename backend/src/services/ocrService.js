const Tesseract = require('tesseract.js');

class OCRService {
  /**
   * Extract raw numeric tokens from text or image
   * @param {Buffer|string} input - Image buffer or text string
   * @returns {Promise<{raw_tokens: string[], currency_hint: string, confidence: number}>}
   */
  static async extractNumericTokens(input) {
    try {
      if (Buffer.isBuffer(input)) {
        // Process image with Tesseract
        const { data } = await Tesseract.recognize(
          input,
          'eng+script/Devanagari', // Support for English and Hindi numbers
          {
            logger: m => console.log(m.status)
          }
        );
        
        return {
          raw_tokens: this.extractNumericStrings(data.text),
          currency_hint: this.detectCurrency(data.text) || 'INR',
          confidence: data.confidence / 100 // Normalize to 0-1 range
        };
      } else if (typeof input === 'string') {
        // Process text input
        return {
          raw_tokens: this.extractNumericStrings(input),
          currency_hint: this.detectCurrency(input) || 'INR',
          confidence: 1.0
        };
      }
      
      throw new Error('Unsupported input type');
    } catch (error) {
      console.error('OCR Processing Error:', error);
      throw new Error('Failed to extract numeric tokens');
    }
  }

  static extractNumericStrings(text) {
    // Match numbers with optional currency symbols, commas, and decimals
    return text.match(/[\u20B9₹$€£¥]?\s*\d[\d,.]*\b/g) || [];
  }

  static detectCurrency(text) {
    const currencyMap = {
      '₹': 'INR',
      '\u20B9': 'INR',
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      'Rs': 'INR',
      'INR': 'INR',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP',
      'JPY': 'JPY'
    };

    for (const [symbol, code] of Object.entries(currencyMap)) {
      if (text.includes(symbol)) {
        return code;
      }
    }
    return null;
  }
}

module.exports = OCRService;
