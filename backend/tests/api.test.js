const request = require('supertest');
const app = require('../src/app');
const { cleanInput } = require('./test-utils/testData');

// Mock the pipeline service
jest.mock('../src/services/pipelineService', () => ({
  processPipeline: jest.fn().mockImplementation((text) => {
    if (text === cleanInput.text) {
      return Promise.resolve({
        status: 'ok',
        currency: 'USD',
        amounts: [
          { type: 'consultation', value: 100, source: 'text: \'Consultation: $100\'' },
          { type: 'medicines', value: 50, source: 'text: \'Medicines: $50\'' },
          { type: 'total_bill', value: 150, source: 'text: \'Total: $150\'' },
          { type: 'paid', value: 100, source: 'text: \'Paid: $100\'' },
          { type: 'due', value: 50, source: 'text: \'Due: $50\'' }
        ]
      });
    } else if (text === '') {
      return Promise.resolve({
        status: 'no_amounts_found',
        reason: 'document too noisy'
      });
    } else {
      return Promise.reject(new Error('Processing error'));
    }
  })
}));

describe('API Endpoints', () => {
  describe('POST /api/parse', () => {
    it('should process text input and return amounts', async () => {
      const response = await request(app)
        .post('/api/parse')
        .send({ text: cleanInput.text });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.amounts).toHaveLength(5);
    });

    it('should handle empty text input', async () => {
      const response = await request(app)
        .post('/api/parse')
        .send({ text: '' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('no_amounts_found');
      expect(response.body.reason).toBe('document too noisy');
    });

    it('should validate input', async () => {
      const response = await request(app)
        .post('/api/parse')
        .send({}); // Missing text field
      
      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.details).toBeDefined();
    });

    it('should handle processing errors', async () => {
      const response = await request(app)
        .post('/api/parse')
        .send({ text: 'This will cause an error' });
      
      expect(response.statusCode).toBe(500);
      expect(response.body.status).toBe('error');
      expect(response.body.error).toBe('Failed to process document');
    });
  });

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const response = await request(app).get('/health');
      
      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});
