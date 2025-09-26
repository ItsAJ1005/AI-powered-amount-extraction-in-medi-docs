const ClassificationService = require('../classificationService');

describe('ClassificationService', () => {
  describe('classifyAmounts', () => {
    it('should classify amounts based on context keywords', () => {
      const sampleText = "Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%";
      const amounts = [1200, 1000, 200, 10];
      
      const result = ClassificationService.classifyAmounts(sampleText, amounts);
      
      // Verify the classified amounts
      expect(result.amounts).toHaveLength(4);
      
      // Check each amount's classification
      const amountMap = {};
      result.amounts.forEach(amt => {
        amountMap[amt.value] = amt;
      });
      
      // Verify classifications (should match the keywords in the text)
      expect(amountMap[1200].type).toBe('total_bill');
      expect(amountMap[1000].type).toBe('paid');
      expect(amountMap[200].type).toBe('due');
      expect(amountMap[10].type).toBe('discount');
      
      // Verify confidence scores
      result.amounts.forEach(amt => {
        expect(amt.confidence).toBeGreaterThan(0.5);
        expect(amt.confidence).toBeLessThanOrEqual(1.0);
        expect(amt.provenance).toContain('text:');
      });
      
      // Verify overall confidence
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    it('should handle partial matches and fallbacks', () => {
      const sampleText = "Amount to pay: 1500 | Deposit made: 500 | Balance: 1000";
      const amounts = [1500, 500, 1000];
      
      const result = ClassificationService.classifyAmounts(sampleText, amounts);
      
      // Should still make reasonable classifications based on partial matches
      const amountMap = {};
      result.amounts.forEach(amt => {
        amountMap[amt.value] = amt;
      });
      
      expect(amountMap[1500].type).toBe('total_bill');  // "Amount to pay"
      expect(amountMap[500].type).toBe('paid');         // "Deposit made"
      expect(amountMap[1000].type).toBe('due');         // "Balance"
    });

    it('should handle missing context gracefully', () => {
      const sampleText = "1200 1000 200"; // No context
      const amounts = [1200, 1000, 200];
      
      const result = ClassificationService.classifyAmounts(sampleText, amounts);
      
      // Should fall back to 'other' type with lower confidence
      result.amounts.forEach(amt => {
        expect(amt.type).toBe('other');
        expect(amt.confidence).toBeLessThan(0.6);
      });
    });
  });

  describe('findBestMatch', () => {
    it('should prioritize exact matches over partial matches', () => {
      const contextWords = ['total', 'payment', 'discount'];
      const result = ClassificationService.findBestMatch(contextWords);
      
      expect(result.type).toBe('total_bill');
      expect(result.confidence).toBe(1.0); // Exact match should have full weight
      expect(result.match).toContain('Exact match');
    });

    it('should handle partial matches', () => {
      const contextWords = ['totally', 'paying', 'discounted'];
      const result = ClassificationService.findBestMatch(contextWords);
      
      // Should match 'totally' as a partial match for 'total'
      expect(result.type).toBe('total_bill');
      expect(result.confidence).toBe(0.8); // Partial match should have 0.8 weight
      expect(result.match).toContain('Partial match');
    });
  });

  describe('calculateOverallConfidence', () => {
    it('should calculate weighted average confidence', () => {
      const classifiedAmounts = [
        { type: 'total_bill', value: 1200, confidence: 0.9 },
        { type: 'paid', value: 1000, confidence: 0.8 },
        { type: 'due', value: 200, confidence: 0.7 }
      ];
      
      const confidence = ClassificationService.calculateOverallConfidence(classifiedAmounts);
      
      // Should be weighted average considering both confidence and type importance
      expect(confidence).toBeGreaterThan(0.7);
      expect(confidence).toBeLessThan(1.0);
    });
  });
});
