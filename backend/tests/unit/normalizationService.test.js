const { normalizeTokens } = require('../../src/services/normalizationService');

describe('Normalization Service', () => {
  describe('normalizeTokens', () => {
    it('should normalize clean tokens', () => {
      const tokens = ['100', '50', '150'];
      const result = normalizeTokens(tokens);
      
      expect(result.normalized_amounts).toHaveLength(3);
      expect(result.normalized_amounts).toContain(100);
      expect(result.normalized_amounts).toContain(50);
      expect(result.normalized_amounts).toContain(150);
      expect(result.confidence).toBe(1.0);
    });

    it('should fix OCR errors in tokens', () => {
      const tokens = ['l00', '5O', 'l5O'];
      const result = normalizeTokens(tokens);
      
      expect(result.normalized_amounts).toContain(100);
      expect(result.normalized_amounts).toContain(50);
      expect(result.normalized_amounts).toContain(150);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should handle currency symbols and separators', () => {
      const tokens = ['$1,000.50', 'INR500', '€ 250.75'];
      const result = normalizeTokens(tokens);
      
      expect(result.normalized_amounts).toContain(1000.5);
      expect(result.normalized_amounts).toContain(500);
      expect(result.normalized_amounts).toContain(250.75);
    });

    it('should filter out percentages', () => {
      const tokens = ['100', '50%', '200'];
      const result = normalizeTokens(tokens);
      
      expect(result.normalized_amounts).toContain(100);
      expect(result.normalized_amounts).toContain(200);
      expect(result.normalized_amounts).not.toContain(50);
    });

    it('should handle empty input', () => {
      const result = normalizeTokens([]);
      
      expect(result.normalized_amounts).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });
});
