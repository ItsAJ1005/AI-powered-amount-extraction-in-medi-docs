const ClassificationService = require('../../src/services/classificationService');

describe('Classification Service', () => {
  describe('classifyAmounts', () => {
    it('should classify amounts based on context', () => {
      const text = 'Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%';
      const amounts = [1200, 1000, 200, 10];
      
      const result = ClassificationService.classifyAmounts(text, amounts);
      
      // Check the structure of the result
      expect(Array.isArray(result.amounts)).toBe(true);
      expect(result.amounts.length).toBe(amounts.length);
      
      // Check that each amount is classified with a type and provenance
      result.amounts.forEach(item => {
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('confidence');
        expect(item).toHaveProperty('provenance');
        expect(typeof item.provenance).toBe('string');
      });
      
      // Check specific classifications
      const total = result.amounts.find(a => a.type === 'total_bill');
      expect(total).toBeDefined();
      expect(total.value).toBe(1200);
      expect(total.confidence).toBeGreaterThan(0.8);
      
      const paid = result.amounts.find(a => a.type === 'paid');
      expect(paid).toBeDefined();
      expect(paid.value).toBe(1000);
      expect(paid.confidence).toBeGreaterThan(0.8);
      
      const due = result.amounts.find(a => a.type === 'due');
      expect(due).toBeDefined();
      expect(due.value).toBe(200);
      expect(due.confidence).toBeGreaterThan(0.8);
      
      // Check overall confidence
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle unknown amount types', () => {
      const text = 'Some random amount: 75';
      const amounts = [75];
      
      const result = ClassificationService.classifyAmounts(text, amounts);
      
      expect(result.amounts[0].type).toBe('other');
      expect(result.amounts[0].confidence).toBe(0.5);
      expect(result.confidence).toBeLessThan(0.6);
    });

    it('should handle empty input', () => {
      const result = ClassificationService.classifyAmounts('', []);
      
      expect(result.amounts).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle partial matches', () => {
      const text = 'The total amount is 1000 and payment is 800';
      const amounts = [1000, 800];
      
      const result = ClassificationService.classifyAmounts(text, amounts);
      
      const total = result.amounts.find(a => a.value === 1000);
      expect(total.type).toBe('total_bill');
      expect(total.confidence).toBeGreaterThan(0.7);
      
      const paid = result.amounts.find(a => a.value === 800);
      expect(paid.type).toBe('paid');
      expect(paid.confidence).toBeGreaterThan(0.7);
    });

    it('should handle multiple occurrences of the same amount', () => {
      const text = 'Total: 1000, Paid: 1000';
      const amounts = [1000, 1000];
      
      const result = ClassificationService.classifyAmounts(text, amounts);
      
      // Both amounts should be classified, possibly with different types
      expect(result.amounts.length).toBe(2);
      expect(result.amounts.some(a => a.type === 'total_bill')).toBe(true);
      expect(result.amounts.some(a => a.type === 'paid')).toBe(true);
    });
  });

  describe('findBestMatch', () => {
    it('should find exact matches', () => {
      const contextWords = ['total', 'amount', 'payment'];
      const result = ClassificationService.findBestMatch(contextWords);
      
      expect(result.type).toBe('total_bill');
      expect(result.confidence).toBe(1.0);
      expect(result.match).toContain('Exact match');
    });

    it('should find partial matches', () => {
      const contextWords = ['payment', 'discounted', 'totaled'];
      const result = ClassificationService.findBestMatch(contextWords);
      
      expect(['paid', 'discount', 'total_bill']).toContain(result.type);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.match).toContain('Partial match');
    });

    it('should return other type with default confidence when no matches', () => {
      const contextWords = ['random', 'words', 'no', 'matches'];
      const result = ClassificationService.findBestMatch(contextWords);
      
      expect(result.type).toBe('other');
      expect(result.confidence).toBe(0.5);
    });
  });
});
