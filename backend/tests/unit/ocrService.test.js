const { extractNumericTokens } = require('../../src/services/ocrService');
const { cleanInput, ocrCorruptedInput } = require('../test-utils/testData');

describe('OCR Service', () => {
  describe('extractNumericTokens', () => {
    it('should extract numeric tokens from clean text', async () => {
      const result = await extractNumericTokens(cleanInput.text);
      
      expect(result).toHaveProperty('raw_tokens');
      expect(result.raw_tokens).toContain('100');
      expect(result.raw_tokens).toContain('50');
      expect(result.raw_tokens).toContain('150');
      expect(result).toHaveProperty('currency_hint', 'USD');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle OCR-corrupted text', async () => {
      const result = await extractNumericTokens(ocrCorruptedInput.text);
      
      expect(result.raw_tokens).toContain('l00'); // Will be normalized later
      expect(result.raw_tokens).toContain('5O');
      expect(result.raw_tokens).toContain('l5O');
      expect(result.confidence).toBeLessThan(0.7); // Lower confidence for corrupted text
    });

    it('should return empty tokens for text with no numbers', async () => {
      const result = await extractNumericTokens('This text has no numbers');
      
      expect(result.raw_tokens).toHaveLength(0);
      expect(result.currency_hint).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should handle empty string input', async () => {
      const result = await extractNumericTokens('');
      
      expect(result.raw_tokens).toHaveLength(0);
      expect(result.currency_hint).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });
});
