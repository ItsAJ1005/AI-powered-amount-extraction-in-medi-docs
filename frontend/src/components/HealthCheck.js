import React from 'react';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

/**
 * HealthCheck Component
 * 
 * Props:
 * - onHealthCheck: Function to trigger health check API call
 * - healthCheckResult: Object containing health check response or null
 * - error: String containing error message or null
 */
const HealthCheck = ({ onHealthCheck, healthCheckResult, error }) => {
  return (
    <div className="mb-4">
      <h2>Backend Health Check</h2>
      <Button 
        variant="primary" 
        onClick={onHealthCheck}
        className="mb-3"
      >
        Check Backend Status
      </Button>
      
      {healthCheckResult && (
        <Alert variant="success">
          <p className="mb-0">Backend is running! Status: {healthCheckResult.status}</p>
          {healthCheckResult.timestamp && (
            <p className="mb-0">Last checked: {new Date(healthCheckResult.timestamp).toLocaleString()}</p>
          )}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger">
          Error: {error}
        </Alert>
      )}
    </div>
  );
};

export default HealthCheck;
