import React, { Component } from 'react';
import { Alert, Button, Container, Row, Col } from 'react-bootstrap';
import { ExclamationTriangle, ArrowRepeat } from 'react-bootstrap-icons';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ 
      error,
      errorInfo,
      hasError: true 
    });
    
    // Log error to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    });
    
    // Optional: Reset app state here if needed
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Alert variant="danger" className="shadow">
                <div className="d-flex align-items-center mb-3">
                  <ExclamationTriangle size={24} className="me-2" />
                  <h4 className="mb-0">Something went wrong</h4>
                </div>
                
                <p className="mb-3">
                  {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
                </p>
                
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={this.handleReset}
                    className="d-flex align-items-center"
                  >
                    <ArrowRepeat className="me-1" /> Try Again
                  </Button>
                  
                  {this.state.error && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={this.toggleDetails}
                      className="text-decoration-none"
                    >
                      {this.state.showDetails ? 'Hide' : 'Show'} Details
                    </Button>
                  )}
                </div>
                
                {this.state.showDetails && this.state.error && (
                  <div className="mt-3 p-3 bg-dark text-white rounded small">
                    <div className="mb-2 fw-bold">
                      {this.state.error.toString()}
                    </div>
                    <pre className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
              </Alert>
              
              {this.props.showHomeButton && (
                <div className="text-center mt-4">
                  <Button 
                    variant="primary" 
                    onClick={() => window.location.href = '/'}
                  >
                    Return to Home
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
