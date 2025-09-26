const NormalizationService = require('../../src/services/normalizationService');

describe('Normalization Service', () => {
  describe('normalizeTokens', () => {
    it('should normalize clean tokens', () => {
      const tokens = ['100', '50', '150'];
      const result = NormalizationService.normalizeTokens(tokens);
      
      expect(result.normalized_amounts).toHaveLength(3);
      expect(result.normalized_amounts).toContain(100);
      expect(result.normalized_amounts).toContain(50);
      expect(result.normalized_amounts).toContain(150);
      expect(result.normalization_confidence).toBe(1.0);
    });

    it('should fix OCR errors in tokens', () => {
      const tokens = ['l00', '5O', 'l5O'];
      const result = NormalizationService.normalizeTokens(tokens);
      
      expect(result.normalized_amounts).toContain(100);
      expect(result.normalized_amounts).toContain(50);
      expect(result.normalized_amounts).toContain(150);
      expect(result.normalization_confidence).toBeLessThan(1.0);
      expect(result.substitutions.length).toBeGreaterThan(0);
    });

    it('should handle currency symbols and separators', () => {
      const tokens = ['$1,000.50', 'INR500', '€ 250.75'];
      const result = NormalizationService.normalizeTokens(tokens);
      
      expect(result.normalized_amounts).toContain(1000.5);
      expect(result.normalized_amounts).toContain(500);
      expect(result.normalized_amounts).toContain(250.75);
      expect(result.normalization_confidence).toBe(1.0);
    });

    it('should filter out percentages', () => {
      const tokens = ['100', '50%', '200'];
      const result = NormalizationService.normalizeTokens(tokens);
      
      expect(result.normalized_amounts).toContain(100);
      expect(result.normalized_amounts).toContain(200);
      expect(result.normalized_amounts).not.toContain(50);
    });

    it('should handle empty input', () => {
      const result = NormalizationService.normalizeTokens([]);
      
      expect(result.normalized_amounts).toHaveLength(0);
      expect(result.normalization_confidence).toBe(0);
    });

    it('should handle null or undefined input', () => {
      const result1 = NormalizationService.normalizeTokens(null);
      const result2 = NormalizationService.normalizeTokens(undefined);
      
      expect(result1.normalized_amounts).toHaveLength(0);
      expect(result2.normalized_amounts).toHaveLength(0);
      expect(result1.normalization_confidence).toBe(0);
      expect(result2.normalization_confidence).toBe(0);
    });
  });
});
