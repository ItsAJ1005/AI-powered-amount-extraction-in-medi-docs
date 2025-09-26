const PipelineService = require('../../src/services/pipelineService');
const OCRService = require('../../src/services/ocrService');
const NormalizationService = require('../../src/services/normalizationService');
const ClassificationService = require('../../src/services/classificationService');

// Mock dependencies
jest.mock('../../src/services/ocrService');
jest.mock('../../src/services/normalizationService');
jest.mock('../../src/services/classificationService');

describe('Pipeline Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('processDocument', () => {
    it('should process text through the full pipeline', async () => {
      // Mock the OCR service
      OCRService.extractNumericTokens.mockResolvedValue({
        raw_tokens: ['1200', '1000', '200'],
        currency_hint: 'INR',
        confidence: 0.9,
        status: 'success'
      });

      // Mock the normalization service
      NormalizationService.normalizeTokens.mockReturnValue({
        normalized_amounts: [1200, 1000, 200],
        normalization_confidence: 0.95,
        substitutions: []
      });

      // Mock the classification service
      ClassificationService.classifyAmounts.mockReturnValue({
        amounts: [
          { type: 'total_bill', value: 1200, confidence: 0.9, provenance: 'text: Total: INR 1200' },
          { type: 'paid', value: 1000, confidence: 0.85, provenance: 'text: Paid: 1000' },
          { type: 'due', value: 200, confidence: 0.88, provenance: 'text: Due: 200' }
        ],
        confidence: 0.88
      });

      const result = await PipelineService.processDocument('Total: INR 1200 | Paid: 1000 | Due: 200');

      // Verify the final output
      expect(result).toHaveProperty('currency', 'INR');
      expect(result.amounts).toHaveLength(3);
      expect(result.amounts[0]).toMatchObject({
        type: 'total_bill',
        value: 1200,
        source: expect.any(String)
      });
      expect(result).toHaveProperty('status', 'ok');

      // Verify service calls
      expect(OCRService.extractNumericTokens).toHaveBeenCalledTimes(1);
      expect(NormalizationService.normalizeTokens).toHaveBeenCalledWith(['1200', '1000', '200']);
      expect(ClassificationService.classifyAmounts).toHaveBeenCalled();
    });

    it('should handle OCR no amounts found', async () => {
      console.log('Setting up mock for extractNumericTokens');
      const mockOCRResult = {
        status: 'no_amounts_found',
        reason: 'No text found in document',
        raw_tokens: [],
        confidence: 0
      };
      OCRService.extractNumericTokens.mockResolvedValue(mockOCRResult);
      console.log('Mock set up:', mockOCRResult);

      console.log('Calling processDocument');
      const result = await PipelineService.processDocument('No amounts here');
      console.log('Result from processDocument:', JSON.stringify(result, null, 2));
      
      // Debug: Check what properties exist on the result
      console.log('Result keys:', Object.keys(result));
      
      // Check each expectation separately to see which one fails
      console.log('Checking status...');
      expect(result).toHaveProperty('status');
      console.log('Status:', result.status);
      expect(result.status).toBe('error');
      
      console.log('Checking error message...');
      expect(result).toHaveProperty('error');
      console.log('Error:', result.error);
      expect(result.error).toBe('No amounts found in document');
      
      console.log('Checking amounts array...');
      expect(result).toHaveProperty('amounts');
      console.log('Amounts:', result.amounts);
      expect(Array.isArray(result.amounts)).toBe(true);
      expect(result.amounts).toHaveLength(0);
    });

    it('should handle normalization with no valid amounts', async () => {
      OCRService.extractNumericTokens.mockResolvedValue({
        raw_tokens: ['invalid'],
        currency_hint: 'INR',
        confidence: 0.9,
        status: 'success'
      });

      NormalizationService.normalizeTokens.mockReturnValue({
        normalized_amounts: [],
        normalization_confidence: 0,
        substitutions: []
      });

      const result = await PipelineService.processDocument('Invalid amount: invalid');
      
      expect(result).toHaveProperty('status', 'error');
      expect(result).toHaveProperty('error', 'No valid amounts found after normalization');
      expect(result.amounts).toHaveLength(0);
    });

    it('should handle image input without text for classification', async () => {
      const mockImageBuffer = Buffer.from('mock image');
      
      OCRService.extractNumericTokens.mockResolvedValue({
        raw_tokens: ['1200', '1000'],
        currency_hint: 'USD',
        confidence: 0.85,
        status: 'success'
      });

      NormalizationService.normalizeTokens.mockReturnValue({
        normalized_amounts: [1200, 1000],
        normalization_confidence: 0.9,
        substitutions: []
      });

      const result = await PipelineService.processDocument(mockImageBuffer);
      
      expect(result).toHaveProperty('currency', 'USD');
      expect(result.amounts.length).toBe(2);
      expect(result.amounts[0]).toMatchObject({
        type: 'total_bill',
        value: 1200,
        source: 'No text context available for classification'
      });
      expect(result).toHaveProperty('status', 'ok');
    });
  });

  describe('formatOutput', () => {
    it('should format output with valid amounts', () => {
      const amounts = [
        { type: 'total_bill', value: 1200, confidence: 0.9, provenance: 'test' },
        { type: 'paid', value: 1000, confidence: 0.8, provenance: 'test' },
        { type: 'due', value: 200, confidence: 0.7, provenance: 'test' }
      ];
      
      const result = PipelineService.formatOutput('INR', amounts, {
        ocr_confidence: 0.9,
        normalization_confidence: 0.95,
        classification_confidence: 0.8
      });
      
      expect(result).toHaveProperty('currency', 'INR');
      expect(result.amounts).toHaveLength(3);
      expect(result.amounts[0]).toMatchObject({
        type: 'total_bill',
        value: 1200,
        source: 'test'
      });
      expect(result).toHaveProperty('status', 'ok');
    });

    it('should filter out low confidence amounts', () => {
      const amounts = [
        { type: 'total_bill', value: 1200, confidence: 0.9, provenance: 'test' },
        { type: 'paid', value: 1000, confidence: 0.4, provenance: 'test' } // Low confidence
      ];
      
      const result = PipelineService.formatOutput('INR', amounts);
      
      expect(result.amounts).toHaveLength(1);
      expect(result.amounts[0]).toMatchObject({
        type: 'total_bill',
        value: 1200
      });
      expect(result).toHaveProperty('status', 'warning');
      expect(result._warnings).toContain('Some amounts were filtered out');
    });
  });

  describe('getFallbackType', () => {
    it('should return total_bill for first item', () => {
      expect(PipelineService.getFallbackType(0, 3)).toBe('total_bill');
    });

    it('should return paid for second item with multiple items', () => {
      expect(PipelineService.getFallbackType(1, 3)).toBe('paid');
    });

    it('should return due for last item', () => {
      expect(PipelineService.getFallbackType(2, 3)).toBe('due');
    });

    it('should return other for other positions', () => {
      expect(PipelineService.getFallbackType(1, 2)).toBe('other');
    });
  });
});
