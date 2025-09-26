import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { Upload, Clock } from 'react-bootstrap-icons';
import AmountDetectForm from '../../components/AmountDetectForm';
import HealthCheck from '../../components/HealthCheck';
import HistoryPanel from '../../components/HistoryPanel';
import AmountService from '../../services/amountService';
import { formatDate } from '../../utils/formatters';

const Home = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  const checkHealth = async () => {
    setIsHealthLoading(true);
    setHealthError(null);
    
    try {
      const status = await AmountService.checkHealth();
      setHealthStatus(status);
    } catch (err) {
      setHealthError(err.message || 'Failed to check backend health');
      console.error('Health check failed:', err);
    } finally {
      setIsHealthLoading(false);
    }
  };

  const handleParseSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await AmountService.processDocument(formData);
      setResult(response);
      
      // Add to history
      const historyItem = {
        filename: formData.get('file')?.name || 'text-input.txt',
        fileType: formData.get('file')?.type || 'text/plain',
        metadata: {
          text: formData.get('text') || '',
          timestamp: new Date().toISOString(),
          result: response
        },
        status: 'completed'
      };
      
      // This will be handled by the HistoryPanel's addToHistory
      return historyItem;
    } catch (err) {
      setError(err.message || 'Failed to process document');
      console.error('Parsing failed:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReprocess = useCallback((item) => {
    // Set the form data from history item
    const formData = new FormData();
    if (item.metadata?.text) {
      formData.append('text', item.metadata.text);
    }
    // For file reprocessing, we'd need to handle file upload again
    
    // Set the active tab to upload
    setActiveTab('upload');
    
    // You can pass this to the form or handle it as needed
    console.log('Reprocessing item:', item);
  }, []);

  return (
    <Container className="py-4">
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
        id="home-tabs"
      >
        <Tab eventKey="upload" title={
          <span><Upload className="me-1" /> Upload Document</span>
        }>
          <Row className="g-4 mt-2">
            {/* Health Check Section */}
            <Col lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Service Status</h5>
            </Card.Header>
            <Card.Body>
              <HealthCheck 
                onHealthCheck={checkHealth}
                error={healthError}
                isLoading={isHealthLoading}
              />
            </Card.Body>
          </Card>
            </Col>

            {/* Document Processing Section */}
            <Col lg={8}>
              <Card className="shadow-sm">
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
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="history" title={
          <span><Clock className="me-1" /> History</span>
        }>
          <div className="mt-3">
            <HistoryPanel 
              onReprocess={handleReprocess}
              className="mt-3"
            />
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Home;
