import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import HealthCheck from './components/HealthCheck';
import AmountDetectForm from './components/AmountDetectForm';
import ResultsDisplay from './components/ResultsDisplay';

function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);

  const checkHealth = async () => {
    setIsHealthLoading(true);
    setHealthError(null);
    
    try {
      const response = await axios.get('http://localhost:3000/health');
      setHealthStatus(response.data);
    } catch (err) {
      setHealthError(err.response?.data?.message || 'Failed to check backend health');
      console.error('Health check failed:', err);
    } finally {
      setIsHealthLoading(false);
    }
  };

  const handleParseSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:3000/api/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process document');
      console.error('Parsing failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check backend health on component mount
  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="bg-primary text-white py-4 mb-4 shadow">
        <Container>
          <h1 className="text-center mb-0">Amount Detection Service</h1>
        </Container>
      </header>

      <Container className="mb-5">
        <Row className="g-4">
          {/* Health Check Section */}
          <Col lg={4}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Service Status</h5>
              </Card.Header>
              <Card.Body>
                <HealthCheck 
                  onHealthCheck={checkHealth}
                  healthCheckResult={healthStatus}
                  error={healthError}
                  isLoading={isHealthLoading}
                />
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={8}>
            {/* Form Section */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Document Processing</h5>
              </Card.Header>
              <Card.Body>
                <AmountDetectForm 
                  onSubmit={handleParseSubmit}
                  isSubmitting={isSubmitting}
                  error={error}
                />
              </Card.Body>
            </Card>

            {/* Results Section */}
            {(result || error) && (
              <Card className="shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Processing Results</h5>
                </Card.Header>
                <Card.Body>
                  <ResultsDisplay 
                    result={result}
                    error={error}
                  />
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <footer className="bg-light py-3 mt-auto border-top">
        <Container>
          <p className="text-center text-muted mb-0">
            Amount Detection Service &copy; {new Date().getFullYear()}
          </p>
        </Container>
      </footer>
    </div>
  );
}

export default App;
