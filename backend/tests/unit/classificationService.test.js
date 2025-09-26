const { classifyAmounts } = require('../../src/services/classificationService');
const { cleanInput } = require('../test-utils/testData');

describe('Classification Service', () => {
  describe('classifyAmounts', () => {
    it('should classify amounts based on context', () => {
      const amounts = [100, 50, 150, 100, 50];
      const text = cleanInput.text;
      
      const result = classifyAmounts(amounts, text);
      
      // Check the structure of the result
      expect(Array.isArray(result.classified_amounts)).toBe(true);
      expect(result.classified_amounts.length).toBe(amounts.length);
      
      // Check that each amount is classified with a type and source
      result.classified_amounts.forEach(item => {
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('source');
        expect(typeof item.source).toBe('string');
      });
      
      // Check specific classifications
      const total = result.classified_amounts.find(a => a.type === 'total_bill');
      expect(total).toBeDefined();
      expect(total.value).toBe(150);
      
      const paid = result.classified_amounts.find(a => a.type === 'paid');
      expect(paid).toBeDefined();
      expect(paid.value).toBe(100);
      
      const due = result.classified_amounts.find(a => a.type === 'due');
      expect(due).toBeDefined();
      expect(due.value).toBe(50);
    });

    it('should handle unknown amount types', () => {
      const amounts = [75];
      const text = 'Some random amount: 75';
      
      const result = classifyAmounts(amounts, text);
      
      expect(result.classified_amounts[0].type).toBe('other');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle empty input', () => {
      const result = classifyAmounts([], '');
      
      expect(result.classified_amounts).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });
  });
});
