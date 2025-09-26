import axios from 'axios';

// Create axios instance with base URL and default headers
const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // Update with your API base URL
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Maximum number of retry attempts for failed requests
const MAX_RETRIES = 3;
// Base delay between retries in milliseconds
const RETRY_DELAY = 1000;

/**
 * Makes an API request with retry logic
 * @param {Function} requestFn - Function that returns a promise (axios request)
 * @param {number} retries - Number of retry attempts remaining
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise} - Promise that resolves with the response or rejects with an error
 */
const requestWithRetry = async (requestFn, retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  try {
    return await requestFn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    // Only retry on network errors or 5xx server errors
    const isNetworkError = !error.response;
    const isServerError = error.response && error.response.status >= 500;
    
    if (!isNetworkError && !isServerError) {
      throw error;
    }

    // Exponential backoff: 1s, 2s, 4s, etc.
    const backoffDelay = delay * (2 ** (MAX_RETRIES - retries));
    
    // Wait for the backoff delay before retrying
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
    
    return requestWithRetry(requestFn, retries - 1, delay);
  }
};

// Request interceptor for adding auth token, loading state, etc.
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens or other headers here
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    // Set loading state to true when request starts
    if (typeof document !== 'undefined') {
      document.documentElement.style.cursor = 'wait';
    }
    
    return config;
  },
  (error) => {
    // Reset loading state on request error
    if (typeof document !== 'undefined') {
      document.documentElement.style.cursor = '';
    }
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and resetting loading state
apiClient.interceptors.response.use(
  (response) => {
    // Reset loading state when response is received
    if (typeof document !== 'undefined') {
      document.documentElement.style.cursor = '';
    }
    return response;
  },
  (error) => {
    // Reset loading state on response error
    if (typeof document !== 'undefined') {
      document.documentElement.style.cursor = '';
    }
    
    // Handle specific error status codes
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return Promise.reject(new Error(data.message || 'Bad request'));
        case 401:
          // Handle unauthorized (e.g., redirect to login)
          // window.location.href = '/login';
          return Promise.reject(new Error('Unauthorized'));
        case 403:
          return Promise.reject(new Error('Forbidden'));
        case 404:
          return Promise.reject(new Error('Resource not found'));
        case 500:
          return Promise.reject(new Error('Internal server error'));
        default:
          return Promise.reject(new Error(data.message || 'An error occurred'));
      }
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Something happened in setting up the request
      return Promise.reject(new Error('Request error: ' + error.message));
    }
  }
);

/**
 * Uploads a document for processing
 * @param {FormData} formData - FormData containing the file to upload
 * @param {string} step - Processing step ('full', 'ocr', 'normalize', 'classify')
 * @returns {Promise<Object>} - The parsed document data
 */
const uploadDocument = async (formData, step = 'full') => {
  try {
    const response = await requestWithRetry(
      () => apiClient.post('/api/parse', formData, {
        params: { step },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    );
    return response.data;
  } catch (error) {
    console.error('Document upload failed:', error);
    throw error;
  }
};

/**
 * Checks the health status of the API
 * @returns {Promise<Object>} - Health status object
 */
const healthCheck = async () => {
  try {
    const response = await requestWithRetry(
      () => apiClient.get('/health')
    );
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

/**
 * Parses text content
 * @param {string} text - The text content to parse
 * @param {string} step - Processing step ('full', 'normalize', 'classify')
 * @returns {Promise<Object>} - The parsed data
 */
const parseTextContent = async (text, step = 'full') => {
  try {
    const response = await requestWithRetry(
      () => apiClient.post(
        '/api/parse',
        { text },
        { params: { step } }
      )
    );
    return response.data;
  } catch (error) {
    console.error('Text parsing failed:', error);
    throw error;
  }
};

export { uploadDocument, healthCheck, parseTextContent };

// Example usage in a React component:
/*
import { useState } from 'react';
import { uploadDocument, healthCheck, parseTextContent } from './services/apiService';

function ExampleComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Example: Upload document
  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const data = await uploadDocument(formData, 'full');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Example: Parse text
  const handleParseText = async (text) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await parseTextContent(text, 'full');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Example: Check health
  const checkHealth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await healthCheck();
      console.log('API Health:', status);
    } catch (err) {
      setError('API is not available');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
*/
