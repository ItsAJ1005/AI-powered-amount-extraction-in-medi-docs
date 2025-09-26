const PipelineService = require('../pipelineService');

describe('PipelineService', () => {
  describe('processDocument', () => {
    it('should process a document with all required fields', async () => {
      const sampleText = "Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%";
      
      const result = await PipelineService.processDocument(sampleText);
      
      // Basic structure validation
      expect(result).toHaveProperty('currency', 'INR');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('amounts');
      
      // Check amounts array
      expect(Array.isArray(result.amounts)).toBe(true);
      expect(result.amounts.length).toBeGreaterThan(0);
      
      // Check each amount object
      result.amounts.forEach(amount => {
        expect(amount).toHaveProperty('type');
        expect(amount).toHaveProperty('value');
        expect(amount).toHaveProperty('source');
        expect(typeof amount.value).toBe('number');
        expect(amount.source).toContain('text:');
      });
      
      // Check specific amounts (order may vary based on classification)
      const amountMap = {};
      result.amounts.forEach(amt => {
        amountMap[amt.type] = amt.value;
      });
      
      expect(amountMap['total_bill']).toBe(1200);
      expect(amountMap['paid']).toBe(1000);
      expect(amountMap['due']).toBe(200);
      expect(amountMap['discount']).toBe(10);
    });

    it('should handle image input with OCR', async () => {
      // Mock an image buffer (in a real test, you'd use a real image)
      const mockImageBuffer = Buffer.from('mock image data');
      
      // Mock the OCR service to return test data
      jest.mock('../../services/ocrService', () => ({
        extractNumericTokens: jest.fn().mockResolvedValue({
          status: 'success',
          raw_tokens: ['1200', '1000', '200'],
          currency_hint: 'INR',
          confidence: 0.9
        })
      }));
      
      const result = await PipelineService.processDocument(mockImageBuffer);
      
      // Should still return a valid result even without text for classification
      expect(result).toHaveProperty('currency', 'INR');
      expect(result.amounts.length).toBeGreaterThan(0);
    });

    it('should handle documents with no amounts found', async () => {
      const sampleText = "This is a test document with no amounts";
      
      const result = await PipelineService.processDocument(sampleText);
      
      expect(result.status).toBe('error');
      expect(result.amounts).toHaveLength(0);
      expect(result.error).toBeDefined();
    });

    it('should handle documents with low confidence amounts', async () => {
      // Mock low confidence OCR result
      jest.mock('../../services/ocrService', () => ({
        extractNumericTokens: jest.fn().mockResolvedValue({
          status: 'success',
          raw_tokens: ['1200?', '1000?'],
          currency_hint: 'INR',
          confidence: 0.4
        })
      }));
      
      const result = await PipelineService.processDocument("Low confidence amounts: 1200?, 1000?");
      
      expect(result.status).toBe('warning');
      expect(result._warnings).toContain('Low confidence in extraction');
    });
  });

  describe('formatOutput', () => {
    it('should format output according to the required schema', () => {
      const mockAmounts = [
        { type: 'total_bill', value: 1200, confidence: 0.9, provenance: 'text: Total: 1200' },
        { type: 'paid', value: 1000, confidence: 0.8, provenance: 'text: Paid: 1000' },
        { type: 'due', value: 200, confidence: 0.7, provenance: 'text: Due: 200' }
      ];
      
      const result = PipelineService.formatOutput('INR', mockAmounts, {
        ocr_confidence: 0.9,
        normalization_confidence: 0.8,
        classification_confidence: 0.85
      });
      
      // Check basic structure
      expect(result).toEqual({
        currency: 'INR',
        status: 'ok',
        amounts: [
          { type: 'total_bill', value: 1200, source: 'text: Total: 1200' },
          { type: 'paid', value: 1000, source: 'text: Paid: 1000' },
          { type: 'due', value: 200, source: 'text: Due: 200' }
        ]
      });
    });

    it('should filter out low confidence amounts', () => {
      const mockAmounts = [
        { type: 'total_bill', value: 1200, confidence: 0.9, provenance: 'text: Total: 1200' },
        { type: 'paid', value: 1000, confidence: 0.4, provenance: 'text: Paid: 1000' }, // Low confidence
        { type: 'due', value: 200, confidence: 0.7, provenance: 'text: Due: 200' }
      ];
      
      const result = PipelineService.formatOutput('INR', mockAmounts);
      
      expect(result.amounts).toHaveLength(2);
      expect(result.amounts.some(a => a.type === 'paid')).toBe(false);
      expect(result.status).toBe('warning');
      expect(result._warnings).toContain('Some amounts were filtered out');
    });
  });

  describe('getFallbackType', () => {
    it('should return appropriate types based on position', () => {
      expect(PipelineService.getFallbackType(0, 3)).toBe('total_bill');
      expect(PipelineService.getFallbackType(1, 3)).toBe('paid');
      expect(PipelineService.getFallbackType(2, 3)).toBe('due');
      expect(PipelineService.getFallbackType(3, 5)).toBe('other');
    });
  });
});
