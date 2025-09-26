import React from 'react';
import { Card, Badge, Alert } from 'react-bootstrap';

/**
 * ResultsDisplay Component
 * 
 * Props:
 * - result: The parsing result object to display
 * - error: Error message if any occurred during parsing
 */
const ResultsDisplay = ({ result, error }) => {
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

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return value.toString();
  };

  return (
    <Card className="mt-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>Parsing Results</span>
        {result.status && (
          <Badge bg={result.status === 'success' ? 'success' : 'warning'}>
            {result.status.toUpperCase()}
          </Badge>
        )}
      </Card.Header>
      <Card.Body>
        {result.currency && (
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
                          <span className={amount.confidence > 0.7 ? 'text-success' : 'text-warning'}>
                            {(amount.confidence * 100).toFixed(1)}%
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td>
                        <small className="text-muted">
                          {amount.source || 'N/A'}
                        </small>
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
            <h6>Processing Metadata</h6>
            <pre className="bg-light p-3 rounded" style={{ maxHeight: '200px', overflow: 'auto' }}>
              {JSON.stringify(result.metadata, null, 2)}
            </pre>
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
      </Card.Body>
      {result.timestamp && (
        <Card.Footer className="text-muted small">
          Processed at: {new Date(result.timestamp).toLocaleString()}
        </Card.Footer>
      )}
    </Card>
  );
};

export default ResultsDisplay;
