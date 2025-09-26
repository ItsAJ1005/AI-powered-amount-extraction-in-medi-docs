import React, { useState } from 'react';
import axios from 'axios';
import { Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import AmountDetectForm from './components/AmountDetectForm';
import ResultsDisplay from './components/ResultsDisplay';

function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

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

  return (
    <Container className="my-5">
      <h1 className="text-center mb-5">Medical Bill Parser</h1>
      
      <Row className="justify-content-center">
        <Col md={8}>
          <AmountDetectForm 
            onSubmit={handleParseSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
          
          <ResultsDisplay 
            result={result}
            error={error}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
