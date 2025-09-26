import React from 'react';
import { Container, Button, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import AmountService from '../../services/amountService';
import { formatDate } from '../../utils/formatters';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result } = location.state || {};

  if (!result) {
    return (
      <Container className="py-5 text-center">
        <h3>No results found</h3>
        <p className="text-muted">Please process a document first</p>
        <Button 
          variant="primary" 
          onClick={() => navigate('/')}
          className="mt-3"
        >
          <ArrowLeft className="me-2" />
          Back to Home
        </Button>
      </Container>
    );
  }

  const { amounts = [], currency = 'USD', metadata = {} } = result;

  const getStatusBadge = (status) => {
    const statusMap = {
      success: 'success',
      warning: 'warning',
      error: 'danger',
      processing: 'info',
    };

    return (
      <Badge bg={statusMap[status] || 'secondary'} className="text-capitalize">
        {status || 'unknown'}
      </Badge>
    );
  };

  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="me-2" />
        Back
      </Button>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Processing Results</h5>
          {result.status && getStatusBadge(result.status)}
        </Card.Header>
        <Card.Body>
          {amounts.length > 0 ? (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Confidence</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {amounts.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <Badge bg="primary" className="text-capitalize">
                          {item.type || 'unknown'}
                        </Badge>
                      </td>
                      <td>
                        {AmountService.formatCurrency(item.value, currency)}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div 
                            className="progress flex-grow-1 me-2" 
                            style={{ height: '6px' }}
                          >
                            <div 
                              className="progress-bar bg-success" 
                              role="progressbar" 
                              style={{ width: `${(item.confidence || 0) * 100}%` }}
                              aria-valuenow={(item.confidence || 0) * 100}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <small className="text-muted">
                            {Math.round((item.confidence || 0) * 100)}%
                          </small>
                        </div>
                      </td>
                      <td className="text-truncate" style={{ maxWidth: '200px' }} title={item.source}>
                        {item.source || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="warning" className="mb-0">
              No amounts were detected in the document.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {metadata && (
        <Card className="shadow-sm">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Processing Details</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <dl className="row mb-0">
                  <dt className="col-sm-5">Currency:</dt>
                  <dd className="col-sm-7">{currency || 'N/A'}</dd>

                  <dt className="col-sm-5">Processing Time:</dt>
                  <dd className="col-sm-7">
                    {metadata.processing_time ? `${metadata.processing_time.toFixed(2)}s` : 'N/A'}
                  </dd>

                  <dt className="col-sm-5">Model Version:</dt>
                  <dd className="col-sm-7">{metadata.model_version || 'N/A'}</dd>
                </dl>
              </Col>
              <Col md={6}>
                <dl className="row mb-0">
                  <dt className="col-sm-5">Document Type:</dt>
                  <dd className="col-sm-7">{metadata.document_type || 'N/A'}</dd>

                  <dt className="col-sm-5">Pages Processed:</dt>
                  <dd className="col-sm-7">{metadata.pages_processed || 'N/A'}</dd>

                  <dt className="col-sm-5">Processed At:</dt>
                  <dd className="col-sm-7">
                    {metadata.timestamp ? formatDate(metadata.timestamp) : 'N/A'}
                  </dd>
                </dl>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Results;
