import React from 'react';
import { Button, Alert, Badge } from 'react-bootstrap';
import { Activity, CheckCircle, XCircle, Clock } from 'react-bootstrap-icons';

/**
 * HealthCheck Component
 * 
 * Props:
 * - onHealthCheck: Function to trigger health check API call
 * - healthCheckResult: Object containing health check response or null
 * - error: String containing error message or null
 * - isLoading: Boolean indicating if health check is in progress
 */
const HealthCheck = ({ onHealthCheck, healthCheckResult, error, isLoading }) => {
  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <Badge bg="warning" className="d-inline-flex align-items-center">
          <Clock size={14} className="me-1" />
          Checking...
        </Badge>
      );
    }
    
    if (error) {
      return (
        <Badge bg="danger" className="d-inline-flex align-items-center">
          <XCircle size={14} className="me-1" />
          Offline
        </Badge>
      );
    }
    
    return (
      <Badge bg="success" className="d-inline-flex align-items-center">
        <CheckCircle size={14} className="me-1" />
        Online
      </Badge>
    );
  };

  const getUptime = (seconds) => {
    if (!seconds) return null;
    
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || 'Less than a minute';
  };

  return (
    <div className="health-check">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Backend Status</h5>
        {getStatusBadge()}
      </div>
      
      <Button 
        variant="outline-primary" 
        onClick={onHealthCheck}
        disabled={isLoading}
        size="sm"
        className="w-100 mb-3 d-flex align-items-center justify-content-center"
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Checking...
          </>
        ) : (
          <>
            <Activity className="me-2" />
            Check Status
          </>
        )}
      </Button>
      
      {healthCheckResult && (
        <div className="status-details">
          <div className="d-flex justify-content-between py-2 border-bottom">
            <span className="text-muted">Version:</span>
            <span className="fw-medium">{healthCheckResult.version || 'N/A'}</span>
          </div>
          {healthCheckResult.uptime && (
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Uptime:</span>
              <span className="fw-medium">{getUptime(healthCheckResult.uptime)}</span>
            </div>
          )}
          <div className="d-flex justify-content-between py-2">
            <span className="text-muted">Last checked:</span>
            <span className="fw-medium">
              {new Date(healthCheckResult.timestamp || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="danger" className="mt-3 mb-0">
          <Alert.Heading className="h6">Connection Error</Alert.Heading>
          <p className="mb-0 small">{error}</p>
        </Alert>
      )}
    </div>
  );
};

export default HealthCheck;
