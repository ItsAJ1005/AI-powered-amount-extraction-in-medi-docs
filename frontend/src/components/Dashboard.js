import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  ProgressBar, 
  Badge,
  ListGroup,
  Button,
  Spinner
} from 'react-bootstrap';
import { 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Activity,
  FileEarmarkText,
  FileEarmarkPdf,
  FileEarmarkImage,
  ArrowRepeat
} from 'react-bootstrap-icons';
import AmountDetectForm from './AmountDetectForm';

// Sample data for demo
const sampleStats = {
  totalProcessed: 124,
  successRate: 92.5,
  avgConfidence: 88.3,
  lastUpdated: '2023-11-15T14:30:00Z'
};

const recentActivities = [
  { 
    id: 1, 
    type: 'upload', 
    filename: 'medical_bill_oct.pdf', 
    status: 'completed',
    timestamp: '2023-11-15T14:25:00Z',
    confidence: 95.2
  },
  { 
    id: 2, 
    type: 'upload', 
    filename: 'prescription.jpg', 
    status: 'completed',
    timestamp: '2023-11-15T13:42:00Z',
    confidence: 87.6
  },
  { 
    id: 3, 
    type: 'error', 
    filename: 'receipt.pdf', 
    status: 'failed',
    timestamp: '2023-11-15T12:15:00Z',
    error: 'Low image quality'
  },
];

const pipelineStatus = {
  ocr: { status: 'operational', lastChecked: '2023-11-15T14:25:00Z' },
  processing: { status: 'operational', lastChecked: '2023-11-15T14:25:00Z' },
  storage: { status: 'operational', lastChecked: '2023-11-15T14:25:00Z' },
  api: { status: 'degraded', lastChecked: '2023-11-15T13:50:00Z', message: 'Higher than normal latency' }
};

const Dashboard = () => {
  const [stats, setStats] = useState(sampleStats);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');

  const handleFileUpload = async (formData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In a real app, this would be an actual API call
      // const response = await apiService.uploadDocument(formData);
      // Update stats and recent activities
      return { success: true };
    } catch (error) {
      console.error('Upload failed:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const renderFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch(ext) {
      case 'pdf':
        return <FileEarmarkPdf className="text-danger me-2" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileEarmarkImage className="text-primary me-2" />;
      default:
        return <FileEarmarkText className="text-secondary me-2" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <Badge bg="success" className="ms-2">Completed</Badge>;
      case 'processing':
        return <Badge bg="warning" className="ms-2">Processing</Badge>;
      case 'failed':
        return <Badge bg="danger" className="ms-2">Failed</Badge>;
      default:
        return <Badge bg="secondary" className="ms-2">Pending</Badge>;
    }
  };

  const getPipelineStatusBadge = (status) => {
    switch(status) {
      case 'operational':
        return <Badge bg="success">Operational</Badge>;
      case 'degraded':
        return <Badge bg="warning">Degraded</Badge>;
      case 'outage':
        return <Badge bg="danger">Outage</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col lg={8} className="mb-4 mb-lg-0">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Document Upload</h5>
            </Card.Header>
            <Card.Body>
              <AmountDetectForm onSubmit={handleFileUpload} isSubmitting={isLoading} />
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Quick Stats</h5>
              <Button variant="outline-secondary" size="sm" onClick={() => window.location.reload()}>
                <ArrowRepeat size={14} />
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Total Processed</span>
                  <strong>{stats.totalProcessed}</strong>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Success Rate</span>
                  <strong>{stats.successRate}%</strong>
                </div>
                <ProgressBar now={stats.successRate} variant="success" style={{ height: '6px' }} />
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Avg. Confidence</span>
                  <strong>{stats.avgConfidence}%</strong>
                </div>
                <ProgressBar now={stats.avgConfidence} variant="info" style={{ height: '6px' }} />
              </div>
              
              <div className="text-muted small mt-3">
                <Clock size={12} className="me-1" /> 
                Updated {formatDate(stats.lastUpdated)}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Activity</h5>
                <div>
                  <Button 
                    variant={activeTab === 'recent' ? 'primary' : 'outline-secondary'} 
                    size="sm" 
                    className="me-2"
                    onClick={() => setActiveTab('recent')}
                  >
                    Recent
                  </Button>
                  <Button 
                    variant={activeTab === 'pipeline' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setActiveTab('pipeline')}
                  >
                    Pipeline Status
                  </Button>
                </div>
              </div>
            </Card.Header>
            
            <Card.Body>
              {activeTab === 'recent' ? (
                <ListGroup variant="flush">
                  {recentActivities.map(activity => (
                    <ListGroup.Item key={activity.id} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        {activity.status === 'completed' ? (
                          <CheckCircle className="text-success me-2" />
                        ) : activity.status === 'failed' ? (
                          <XCircle className="text-danger me-2" />
                        ) : (
                          <Activity className="text-warning me-2" />
                        )}
                        <div>
                          <div className="fw-bold">
                            {renderFileIcon(activity.filename)}
                            {activity.filename}
                            {getStatusBadge(activity.status)}
                          </div>
                          <div className="text-muted small">
                            {formatDate(activity.timestamp)}
                            {activity.confidence && (
                              <span className="ms-2">
                                Confidence: <strong>{activity.confidence}%</strong>
                              </span>
                            )}
                            {activity.error && (
                              <span className="text-danger ms-2">
                                Error: {activity.error}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline-primary" size="sm">
                        View Details
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div>
                  <h6 className="mb-3">System Status</h6>
                  <ListGroup variant="flush">
                    {Object.entries(pipelineStatus).map(([service, data]) => (
                      <ListGroup.Item key={service} className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="text-capitalize fw-bold">{service}</span>
                          {data.message && (
                            <div className="text-muted small">{data.message}</div>
                          )}
                        </div>
                        <div>
                          {getPipelineStatusBadge(data.status)}
                          <div className="text-muted small text-end">
                            {formatDate(data.lastChecked)}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
            </Card.Body>
            
            <Card.Footer className="text-center">
              <Button variant="outline-primary" size="sm">
                View All Activity
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
