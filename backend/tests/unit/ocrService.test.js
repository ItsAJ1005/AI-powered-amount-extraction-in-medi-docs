const OCRService = require('../../src/services/ocrService');

// Mock Tesseract.js and sharp
jest.mock('tesseract.js');
jest.mock('sharp');

describe('OCR Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractNumericTokens', () => {
    it('should extract numeric tokens from clean text', async () => {
      const text = 'Total: INR 1200 | Paid: 1000 | Due: 200 | Discount: 10%';
      
      const result = await OCRService.extractNumericTokens(text);
      
      expect(result).toHaveProperty('status', 'success');
      expect(result.raw_tokens).toContain('1200');
      expect(result.raw_tokens).toContain('1000');
      expect(result.raw_tokens).toContain('200');
      expect(result.raw_tokens).toContain('10%');
      expect(result.currency_hint).toBe('INR');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle OCR-corrupted text', async () => {
      const text = 'T0tal: Rs l200 | Pald: 1000 | Due: 200';
      
      const result = await OCRService.extractNumericTokens(text);
      
      expect(result.status).toBe('success');
      expect(result.raw_tokens).toContain('l200');
      expect(result.raw_tokens).toContain('1000');
      expect(result.raw_tokens).toContain('200');
      expect(result.currency_hint).toBe('INR');
    });

    it('should return no_amounts_found for text with insufficient numbers', async () => {
      const result = await OCRService.extractNumericTokens('This text has only 1 number');
      
      expect(result.status).toBe('no_amounts_found');
      expect(result.reason).toBe('document too noisy');
      expect(result.raw_tokens).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle empty string input', async () => {
      const result = await OCRService.extractNumericTokens('');
      
      expect(result.status).toBe('no_amounts_found');
      expect(result.raw_tokens).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle image buffer input', async () => {
      // Mock sharp to return a buffer
      const mockSharp = {
        grayscale: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        normalize: jest.fn().mockReturnThis(),
        sharpen: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock'))
      };
      sharp.mockReturnValue(mockSharp);

      // Mock Tesseract.recognize
      Tesseract.recognize.mockResolvedValue({
        data: {
          text: 'Total: INR 1200',
          confidence: 90
        }
      });

      const result = await OCRService.extractNumericTokens(Buffer.from('mock'));
      
      expect(result.status).toBe('success');
      expect(result.raw_tokens).toContain('1200');
      expect(sharp).toHaveBeenCalled();
      expect(Tesseract.recognize).toHaveBeenCalled();
    });
  });

  describe('extractNumericStrings', () => {
    it('should extract numbers with various formats', () => {
      const text = 'Amount: 1,000.50, Price: ₹500, 25% off';
      const result = OCRService.extractNumericStrings(text);
      
      expect(result).toContain('1000.50');
      expect(result).toContain('500');
      expect(result).toContain('25%');
    });
  });

  describe('detectCurrency', () => {
    it('should detect INR currency', () => {
      expect(OCRService.detectCurrency('Total: ₹1200')).toBe('INR');
      expect(OCRService.detectCurrency('Rs. 500')).toBe('INR');
      expect(OCRService.detectCurrency('INR 2000')).toBe('INR');
    });

    it('should detect USD currency', () => {
      expect(OCRService.detectCurrency('$100')).toBe('USD');
      expect(OCRService.detectCurrency('USD 50')).toBe('USD');
    });

    it('should return null for unknown currency', () => {
      expect(OCRService.detectCurrency('100')).toBeNull();
    });
  });
});
