const OCRService = require('../ocrService');

describe('OCRService', () => {
  describe('extractNumericTokens', () => {
    it('should extract numeric tokens from text input', async () => {
      const sample = "Total: INR 1,200 | Paid: 1000 | Due: 200 | Discount: 10%";
      const result = await OCRService.extractNumericTokens(sample);
      
      expect(result).toMatchObject({
        status: 'success',
        raw_tokens: expect.arrayContaining(['1200', '1000', '200', '10%']),
        currency_hint: 'INR',
        confidence: expect.any(Number)
      });
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle different currency symbols', async () => {
      const samples = [
        { input: "Total: $1,200", expected: 'USD' },
        { input: "Total: ₹1,200", expected: 'INR' },
        { input: "Total: 1,200 INR", expected: 'INR' },
        { input: "Total: Rs. 1,200", expected: 'INR' },
        { input: "Total: €1,200", expected: 'EUR' },
        { input: "Total: £1,200", expected: 'GBP' },
        { input: "Total: ¥1,200", expected: 'JPY' }
      ];

      for (const { input, expected } of samples) {
        const result = await OCRService.extractNumericTokens(input);
        expect(result.currency_hint).toBe(expected);
      }
    });

    it('should handle decimal numbers', async () => {
      const sample = "Amount: 1,234.56 | Tax: 123.45";
      const result = await OCRService.extractNumericTokens(sample);
      
      expect(result.raw_tokens).toEqual(expect.arrayContaining(['1234.56', '123.45']));
    });

    it('should return error for insufficient tokens', async () => {
      const sample = "Total: $100"; // Only one amount
      const result = await OCRService.extractNumericTokens(sample);
      
      expect(result).toEqual({
        status: 'no_amounts_found',
        reason: 'document too noisy',
        raw_tokens: [],
        currency_hint: 'USD',
        confidence: 0
      });
    });
  });

  describe('extractNumericStrings', () => {
    it('should extract numbers with various formats', () => {
      const text = "100 1,000 10.5 1,000.50 50% 1.2.3";
      const result = OCRService.extractNumericStrings(text);
      
      expect(result).toEqual(['100', '1000', '10.5', '1000.50', '50%', '1.2.3']);
    });
  });

  describe('detectCurrency', () => {
    const testCases = [
      { input: "Total: $100", expected: 'USD' },
      { input: "Total: ₹100", expected: 'INR' },
      { input: "Total: INR 100", expected: 'INR' },
      { input: "Total: Rs. 100", expected: 'INR' },
      { input: "Total: €100", expected: 'EUR' },
      { input: "Total: £100", expected: 'GBP' },
      { input: "Total: ¥100", expected: 'JPY' },
      { input: "Total: 100", expected: null },
      { input: "", expected: null }
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should detect ${expected || 'no currency'} in "${input}"`, () => {
        expect(OCRService.detectCurrency(input)).toBe(expected);
      });
    });
  });
});
