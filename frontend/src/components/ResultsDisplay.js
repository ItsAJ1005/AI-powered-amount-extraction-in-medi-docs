import React, { useState } from 'react';
import { 
  Card, 
  Badge, 
  Alert, 
  ProgressBar, 
  Button, 
  ButtonGroup,
  OverlayTrigger,
  Tooltip,
  Row,
  Col
} from 'react-bootstrap';
import { 
  Download, 
  Code, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight,
  InfoCircle
} from 'react-bootstrap-icons';

/**
 * ResultsDisplay Component
 * 
 * Props:
 * - result: The parsing result object to display
 * - error: Error message if any occurred during parsing
 */
const ResultsDisplay = ({ result, error }) => {
  const [showRawJson, setShowRawJson] = useState(false);
  
  const getAmountColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'due':
        return 'danger';
      case 'total':
        return 'primary';
      default:
        return 'secondary';
    }
  };
  
  const downloadJson = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportName = `amounts_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };
  
  const renderProcessSteps = () => {
    const steps = [
      { id: 'ocr', label: 'OCR', status: result.metadata?.ocrStatus },
      { id: 'normalize', label: 'Normalize', status: result.metadata?.normalizeStatus },
      { id: 'classify', label: 'Classify', status: result.metadata?.classifyStatus }
    ];
    
    return (
      <div className="mb-4">
        <h6>Processing Steps</h6>
        <div className="d-flex align-items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="text-center">
                <div className={`d-flex justify-content-center align-items-center mx-2 rounded-circle ${getStepStatusClass(step.status)}`} 
                     style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                  {getStepStatusIcon(step.status)}
                </div>
                <div className="small mt-1">{step.label}</div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-grow-1 mx-2">
                  <hr style={{ borderTop: '2px solid #dee2e6' }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  const getStepStatusClass = (status) => {
    switch(status) {
      case 'completed':
        return 'bg-success text-white';
      case 'failed':
        return 'bg-danger text-white';
      case 'processing':
        return 'bg-warning text-dark';
      default:
        return 'bg-light';
    }
  };
  
  const getStepStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircle />;
      case 'failed':
        return <XCircle />;
      case 'processing':
        return <Clock />;
      default:
        return <InfoCircle />;
    }
  };
  if (error) {
    return (
      <Alert variant="danger" className="mt-4">
        <Alert.Heading>Error Processing Document</Alert.Heading>
        <p className="mb-0">{error}</p>
      </Alert>
    );
  }

  if (!result) {
    return null; // Don't render anything if there's no result
  }
  
  // Group amounts by type for summary display
  const amountSummary = {};
  if (result.amounts) {
    result.amounts.forEach(amount => {
      if (!amount.type) return;
      const type = amount.type.toLowerCase();
      if (!amountSummary[type]) {
        amountSummary[type] = {
          total: 0,
          count: 0,
          highestConfidence: 0,
          source: amount.source
        };
      }
      amountSummary[type].total += parseFloat(amount.value || 0);
      amountSummary[type].count += 1;
      if (amount.confidence > amountSummary[type].highestConfidence) {
        amountSummary[type].highestConfidence = amount.confidence;
      }
    });
  }

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return value.toString();
  };

  return (
    <Card className="mt-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <span className="h5 mb-0">Parsing Results</span>
          {result.timestamp && (
            <small className="text-muted ms-2">
              {new Date(result.timestamp).toLocaleString()}
            </small>
          )}
        </div>
        <ButtonGroup size="sm">
          <Button 
            variant={showRawJson ? 'outline-secondary' : 'outline-primary'}
            onClick={() => setShowRawJson(false)}
          >
            Formatted View
          </Button>
          <Button 
            variant={showRawJson ? 'primary' : 'outline-secondary'}
            onClick={() => setShowRawJson(true)}
          >
            <Code className="me-1" /> Raw JSON
          </Button>
          <Button 
            variant="outline-success" 
            onClick={downloadJson}
            title="Download JSON"
          >
            <Download />
          </Button>
        </ButtonGroup>
      </Card.Header>
      <Card.Body>
        {showRawJson ? (
          <pre className="bg-light p-3 rounded" style={{ maxHeight: '500px', overflow: 'auto' }}>
            <code>{JSON.stringify(result, null, 2)}</code>
          </pre>
        ) : (
          <>
            {result.metadata && renderProcessSteps()}
            
            {/* Amount Summary */}
            {Object.keys(amountSummary).length > 0 && (
              <div className="mb-4">
                <h6>Amount Summary</h6>
                <div className="d-flex flex-wrap gap-3">
                  {Object.entries(amountSummary).map(([type, data]) => (
                    <Card key={type} className="flex-grow-1" style={{ minWidth: '200px' }}>
                      <Card.Body className="text-center">
                        <div className="text-uppercase small text-muted">{type}</div>
                        <div className="h4 mb-1" style={{ color: `var(--bs-${getAmountColor(type)})` }}>
                          {result.currency} {data.total.toFixed(2)}
                        </div>
                        <div className="small text-muted">
                          {data.count} item{data.count !== 1 ? 's' : ''}
                          {data.highestConfidence > 0 && (
                            <div className="mt-1">
                              <small className="text-muted">Confidence:</small>
                              <ProgressBar 
                                now={data.highestConfidence * 100} 
                                variant={data.highestConfidence > 0.7 ? 'success' : 'warning'}
                                className="mt-1"
                                style={{ height: '6px' }}
                              />
                              <small className="text-muted">
                                {(data.highestConfidence * 100).toFixed(1)}%
                              </small>
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </div>
            )}
        {result.currency && !showRawJson && (
          <div className="mb-3">
            <h6>Currency</h6>
            <Badge bg="info">{result.currency}</Badge>
          </div>
        )}

        {result.amounts && result.amounts.length > 0 ? (
          <div className="mb-3">
            <h6>Extracted Amounts</h6>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Confidence</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {result.amounts.map((amount, index) => (
                    <tr key={index}>
                      <td>
                        <Badge bg="primary">
                          {amount.type || 'unknown'}
                        </Badge>
                      </td>
                      <td>{amount.value}</td>
                      <td>
                        {amount.confidence ? (
                          <div>
                            <ProgressBar 
                              now={amount.confidence * 100} 
                              variant={amount.confidence > 0.7 ? 'success' : 'warning'}
                              style={{ height: '6px', width: '60px' }}
                              className="mb-1"
                            />
                            <span className={amount.confidence > 0.7 ? 'text-success' : 'text-warning'}>
                              {(amount.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td>
                        {amount.source ? (
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip id={`source-${index}`}>{amount.source}</Tooltip>}
                          >
                            <span className="text-muted" style={{ cursor: 'help', borderBottom: '1px dotted #999' }}>
                              View Source
                            </span>
                          </OverlayTrigger>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Alert variant="info">No amounts were extracted from the document.</Alert>
        )}

        {result.metadata && (
          <div className="mt-4">
            <h6>Processing Details</h6>
            <div className="table-responsive">
              <table className="table table-sm">
                <tbody>
                  {result.metadata && Object.entries(result.metadata).map(([key, value]) => (
                    <tr key={key}>
                      <th className="text-nowrap" style={{ width: '30%' }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </th>
                      <td>
                        {typeof value === 'object' ? (
                          <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result.warnings && result.warnings.length > 0 && (
          <Alert variant="warning" className="mt-3">
            <Alert.Heading>Warnings</Alert.Heading>
            <ul className="mb-0">
              {result.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </Alert>
        )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ResultsDisplay;
