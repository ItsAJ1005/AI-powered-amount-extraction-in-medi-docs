import api from './api';

const AmountService = {
  /**
   * Check backend health status
   * @returns {Promise<Object>} Health check response
   */
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  /**
   * Process document to extract amounts
   * @param {FormData} formData - Form data containing the document
   * @returns {Promise<Object>} Processing results
   */
  processDocument: async (formData) => {
    try {
      const response = await api.post('/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  },

  /**
   * Format currency amount
   * @param {number} amount - The amount to format
   * @param {string} currency - Currency code (e.g., 'USD', 'EUR')
   * @returns {string} Formatted currency string
   */
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },
};

export default AmountService;
