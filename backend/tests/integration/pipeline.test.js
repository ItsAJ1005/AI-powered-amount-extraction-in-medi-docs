const { processPipeline } = require('../../src/services/pipelineService');
const { cleanInput, ocrCorruptedInput, noisyInput, emptyInput } = require('../test-utils/testData');

// Mock the OCR service to avoid actual file I/O in tests
jest.mock('../../src/services/ocrService', () => ({
  extractNumericTokens: jest.fn().mockImplementation((text) => {
    // Return mock data based on input
    if (text === cleanInput.text) {
      return Promise.resolve({
        raw_tokens: ['100', '50', '150', '100', '50'],
        currency_hint: 'USD',
        confidence: 0.9
      });
    } else if (text === ocrCorruptedInput.text) {
      return Promise.resolve({
        raw_tokens: ['l00', '5O', 'l5O', 'lOO', '5O'],
        currency_hint: 'USD',
        confidence: 0.6
      });
    } else {
      return Promise.resolve({
        raw_tokens: [],
        currency_hint: null,
        confidence: 0
      });
    }
  })
}));

describe('Pipeline Integration', () => {
  it('should process clean input correctly', async () => {
    const result = await processPipeline(cleanInput.text);
    
    expect(result.status).toBe('ok');
    expect(result.currency).toBe('USD');
    expect(result.amounts).toHaveLength(5);
    
    // Check for specific amount types
    const total = result.amounts.find(a => a.type === 'total_bill');
    expect(total).toBeDefined();
    expect(total.value).toBe(150);
    
    // Check provenance contains the original text
    expect(total.source).toContain('Total: $150');
  });

  it('should handle OCR-corrupted input', async () => {
    const result = await processPipeline(ocrCorruptedInput.text);
    
    expect(result.status).toBe('ok');
    expect(result.amounts).toHaveLength(5);
    
    // Check that corrupted values were normalized
    const amounts = result.amounts.map(a => a.value);
    expect(amounts).toContain(100);
    expect(amounts).toContain(50);
    expect(amounts).toContain(150);
  });

  it('should return guardrail for noisy input', async () => {
    const result = await processPipeline(noisyInput.text);
    
    expect(result.status).toBe('no_amounts_found');
    expect(result.reason).toBe('document too noisy');
    expect(result.amounts).toBeUndefined();
  });

  it('should return guardrail for empty input', async () => {
    const result = await processPipeline(emptyInput.text);
    
    expect(result.status).toBe('no_amounts_found');
    expect(result.reason).toBe('document too noisy');
    expect(result.amounts).toBeUndefined();
  });

  it('should handle low confidence results', async () => {
    // Mock low confidence OCR result
    const lowConfidenceText = 'Total: 100 (low confidence)';
    const mockOCR = require('../../src/services/ocrService');
    mockOCR.extractNumericTokens.mockResolvedValueOnce({
      raw_tokens: ['100'],
      currency_hint: 'USD',
      confidence: 0.4 // Low confidence
    });
    
    const result = await processPipeline(lowConfidenceText);
    
    expect(result.status).toBe('low_confidence');
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.amounts).toBeDefined();
  });
});
