const NormalizationService = require('../normalizationService');

describe('NormalizationService', () => {
  describe('normalizeTokens', () => {
    it('should normalize tokens with OCR errors', () => {
      const input = ["l200", "1000", "200", "10%"];
      const result = NormalizationService.normalizeTokens(input);
      
      expect(result.normalized_amounts).toEqual([1200, 1000, 200]);
      expect(result.normalization_confidence).toBeLessThanOrEqual(1.0);
      expect(result.normalization_confidence).toBeGreaterThan(0);
      
      // Should have one substitution (l200 → 1200)
      expect(result.substitutions).toHaveLength(1);
      expect(result.substitutions[0]).toEqual({
        original: 'l200',
        normalized: '1200',
        changes: 1
      });
    });

    it('should handle various number formats and currencies', () => {
      const input = [
        "Rs.1,234.56",
        "INR 2,000",
        "$3,000.50",
        "4O0O", // Common OCR errors (O instead of 0)
        "1l00",  // Common OCR errors (l instead of 1)
        "5%"     // Should be ignored
      ];
      
      const result = NormalizationService.normalizeTokens(input);
      
      expect(result.normalized_amounts).toEqual([
        1234.56,
        2000,
        3000.50,
        4000,
        1100
      ]);
      
      // Should have substitutions for the problematic tokens
      expect(result.substitutions.length).toBeGreaterThan(0);
    });

    it('should handle empty or invalid input', () => {
      expect(NormalizationService.normalizeTokens([])).toEqual({
        normalized_amounts: [],
        normalization_confidence: 0,
        substitutions: []
      });

      expect(NormalizationService.normalizeTokens(["", " ", "abc"])).toEqual({
        normalized_amounts: [],
        normalization_confidence: 1.0,
        substitutions: []
      });
    });
  });

  describe('normalizeToken', () => {
    const testCases = [
      { input: "l200", expected: 1200, changes: 1 },      // l→1
      { input: "O500", expected: 500, changes: 1 },       // O→0
      { input: "1,234.56", expected: 1234.56, changes: 0 },
      { input: "Rs.1,000", expected: 1000, changes: 0 },
      { input: "INR 2000", expected: 2000, changes: 0 },
      { input: "$3000.50", expected: 3000.50, changes: 0 },
      { input: "4O0O", expected: 4000, changes: 2 },      // O→0 (2 changes)
      { input: "1l00", expected: 1100, changes: 1 },      // l→1
      { input: "10%", expected: null, changes: 0 },       // Percentage (should be filtered out)
      { input: "abc", expected: null, changes: 0 }        // Invalid number
    ];

    testCases.forEach(({ input, expected, changes }) => {
      it(`should normalize "${input}" to ${expected} with ${changes} changes`, () => {
        const result = NormalizationService.normalizeToken(input);
        if (expected === null) {
          expect(result).toBeNull();
        } else {
          expect(result).toEqual({
            value: expected,
            changes: changes
          });
        }
      });
    });
  });
});
