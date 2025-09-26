import React, { useState, useRef } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import { BsTextParagraph, BsImage } from 'react-icons/bs';

/**
 * AmountDetectForm Component
 * 
 * Props:
 * - onSubmit: Function to handle form submission
 * - isSubmitting: Boolean indicating if form is being submitted
 * - error: String containing error message or null
 */
const AmountDetectForm = ({ onSubmit, isSubmitting, error }) => {
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'file'
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [step, setStep] = useState('full');
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    if (inputMode === 'text') {
      formData.append('text', text);
    } else {
      if (!selectedFile) {
        alert('Please select a file');
        return;
      }
      formData.append('file', selectedFile);
    }
    formData.append('step', step);
    
    onSubmit(formData);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleModeChange = (mode) => {
    setInputMode(mode);
    setText('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 border rounded-3 bg-light">
      <h2 className="mb-4">Extract Amounts</h2>
      
      <Form onSubmit={handleSubmit}>
        {/* Input Mode Toggle */}
        <Form.Group className="mb-4">
          <Form.Label className="d-block">Input Mode</Form.Label>
          <ToggleButtonGroup
            type="radio"
            name="inputMode"
            value={inputMode}
            onChange={handleModeChange}
          >
            <ToggleButton
              id="text-mode"
              value="text"
              variant={inputMode === 'text' ? 'primary' : 'outline-secondary'}
            >
              <BsTextParagraph className="me-2" />
              Text Input
            </ToggleButton>
            <ToggleButton
              id="file-mode"
              value="file"
              variant={inputMode === 'file' ? 'primary' : 'outline-secondary'}
            >
              <BsImage className="me-2" />
              File Upload
            </ToggleButton>
          </ToggleButtonGroup>
        </Form.Group>

        {/* Text Input */}
        {inputMode === 'text' ? (
          <Form.Group className="mb-4">
            <Form.Label>Medical Bill Text</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required={inputMode === 'text'}
              placeholder="Paste your medical bill text here..."
            />
          </Form.Group>
        ) : (
          /* File Upload */
          <Form.Group className="mb-4">
            <Form.Label>Upload Document</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              ref={fileInputRef}
              required={inputMode === 'file'}
            />
            <Form.Text className="text-muted">
              Supported formats: JPG, PNG, PDF
            </Form.Text>
          </Form.Group>
        )}

        {/* Step Selection */}
        <Form.Group className="mb-4">
          <Form.Label>Processing Step</Form.Label>
          <Form.Select
            value={step}
            onChange={(e) => setStep(e.target.value)}
          >
            <option value="full">Full Pipeline</option>
            <option value="ocr">OCR Step</option>
            <option value="normalize">Normalization Step</option>
            <option value="classify">Classification Step</option>
          </Form.Select>
          <Form.Text className="text-muted">
            Select which step of the pipeline to execute
          </Form.Text>
        </Form.Group>

        {/* Submit Button */}
        <div className="d-grid gap-2">
          <Button
            variant="primary"
            type="submit"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Extract Amounts'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
      </Form>
    </div>
  );
};

export default AmountDetectForm;
