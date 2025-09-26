import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument, parseTextContent } from '../services/apiService';
import { 
  Form, 
  Button, 
  ToggleButton, 
  ToggleButtonGroup, 
  ProgressBar,
  Alert,
  Card,
  Image,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { 
  BsTextParagraph, 
  BsImage, 
  BsUpload, 
  BsInfoCircle,
  BsXCircle,
  BsFileEarmarkPdf,
  BsFileImage,
  BsFileEarmarkText
} from 'react-icons/bs';
import { FaFileUpload, FaTrashAlt } from 'react-icons/fa';

/**
 * AmountDetectForm Component
 * 
 * Props:
 * - onSubmit: Function to handle form submission
 * - isSubmitting: Boolean indicating if form is being submitted
 * - error: String containing error message or null
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

const FilePreview = ({ file, onRemove }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return;
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [file]);

  const getFileIcon = () => {
    if (file.type === 'application/pdf') {
      return <BsFileEarmarkPdf size={48} className="text-danger" />;
    } else if (file.type.startsWith('image/')) {
      return <BsFileImage size={48} className="text-primary" />;
    }
    return <BsFileEarmarkText size={48} className="text-secondary" />;
  };

  return (
    <Card className="mb-3">
      <Card.Body className="p-3">
        <div className="d-flex align-items-center">
          <div className="me-3">
            {preview ? (
              <Image 
                src={preview} 
                alt="Preview" 
                style={{ height: '60px', width: 'auto', maxWidth: '80px', objectFit: 'cover' }} 
                className="rounded"
              />
            ) : (
              <div className="text-center" style={{ width: '80px' }}>
                {getFileIcon()}
              </div>
            )}
          </div>
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 text-truncate" style={{ maxWidth: '200px' }} title={file.name}>
                  {file.name}
                </h6>
                <small className="text-muted">
                  {(file.size / 1024).toFixed(1)} KB • {file.type}
                </small>
              </div>
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={onRemove}
                title="Remove file"
              >
                <FaTrashAlt />
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const AmountDetectForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [inputMode, setInputMode] = useState('text');
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [step, setStep] = useState('full');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (inputMode === 'file' && !selectedFile) {
      setValidationError('Please select a file');
      return;
    }
    
    if (inputMode === 'text' && !text.trim()) {
      setValidationError('Please enter some text');
      return;
    }
    
    setUploadProgress(0);
    setIsSubmitting(true);
    setError(null);
    
    try {
      let response;
      
      if (inputMode === 'file') {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // Track upload progress
        const config = {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress > 90 ? 90 : progress); // Cap at 90% until complete
          },
          params: { step }
        };
        
        response = await uploadDocument(formData, step, config);
      } else {
        // For text input
        response = await parseTextContent(text, step);
      }
      
      // Complete the progress
      setUploadProgress(100);
      
      // Navigate to results page with the response data
      navigate('/results', { state: { result: response } });
      
    } catch (err) {
      console.error('Error processing request:', err);
      setError(err.message || 'An error occurred while processing your request');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
      
      // Reset progress after a short delay
      if (uploadProgress === 100) {
        setTimeout(() => setUploadProgress(0), 1000);
      }
    }
  };

  const validateFile = (file) => {
    if (!file) {
      setValidationError('Please select a file');
      return false;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setValidationError('Invalid file type. Please upload a JPG, PNG, or PDF file.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError('File size exceeds 5MB limit');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (validateFile(file)) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        if (fileInputRef.current) {
          // Create a new DataTransfer to set the file
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
        }
      }
    }
  }, []);

  const removeFile = () => {
    setSelectedFile(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            className="w-100"
          >
            <ToggleButton
              id="text-mode"
              value="text"
              variant={inputMode === 'text' ? 'primary' : 'outline-secondary'}
              className="flex-grow-1"
            >
              <BsTextParagraph className="me-2" />
              Text Input
            </ToggleButton>
            <ToggleButton
              id="file-mode"
              value="file"
              variant={inputMode === 'file' ? 'primary' : 'outline-secondary'}
              className="flex-grow-1"
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
              onChange={(e) => {
                setText(e.target.value);
                setValidationError('');
              }}
              required={inputMode === 'text'}
              placeholder="Paste your medical bill text here..."
              className={validationError && !text.trim() ? 'is-invalid' : ''}
            />
            <Form.Text className="text-muted">
              Enter the text content you want to analyze
            </Form.Text>
          </Form.Group>
        ) : (
          /* File Upload */
          <>
            <Form.Group className="mb-4">
              <div className="d-flex align-items-center mb-2">
                <Form.Label className="mb-0 me-2">Document Upload</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id="upload-tooltip">
                      Drag & drop or click to upload a file
                    </Tooltip>
                  }
                >
                  <span className="text-muted">
                    <BsInfoCircle size={16} />
                  </span>
                </OverlayTrigger>
              </div>
              
              {/* File Preview */}
              {selectedFile && (
                <div className="mb-3">
                  <FilePreview file={selectedFile} onRemove={removeFile} />
                </div>
              )}
              
              {/* Drag & Drop Area */}
              <div 
                ref={dropRef}
                className={`border-2 border-dashed rounded p-5 text-center ${
                  dragActive ? 'border-primary bg-light' : 'border-secondary'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                <div className="mb-3">
                  <FaFileUpload size={32} className="text-muted" />
                </div>
                <h5>Drag & drop your file here</h5>
                <p className="text-muted mb-0">or click to browse</p>
                <p className="small text-muted mt-2">
                  Supported formats: JPG, PNG, PDF (Max 5MB)
                </p>
                
                <Form.Control
                  type="file"
                  onChange={handleFileChange}
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  ref={fileInputRef}
                  className="d-none"
                  required={inputMode === 'file' && !selectedFile}
                />
              </div>
              
              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small>Uploading...</small>
                    <small>{uploadProgress}%</small>
                  </div>
                  <ProgressBar 
                    now={uploadProgress} 
                    animated 
                    variant="primary" 
                    style={{ height: '6px' }}
                  />
                </div>
              )}
              
              {/* Validation Error */}
              {validationError && (
                <div className="text-danger small mt-2">
                  <BsXCircle className="me-1" />
                  {validationError}
                </div>
              )}
            </Form.Group>

            {/* Processing Step Selection */}
            <Form.Group className="mb-4">
              <div className="d-flex align-items-center mb-2">
                <Form.Label className="mb-0 me-2">Processing Step</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id="step-tooltip">
                      Choose which part of the processing pipeline to execute
                    </Tooltip>
                  }
                >
                  <span className="text-muted">
                    <BsInfoCircle size={16} />
                  </span>
                </OverlayTrigger>
              </div>
              
              <Form.Select
                value={step}
                onChange={(e) => setStep(e.target.value)}
                className="mb-2"
              >
                <option value="full">Full Pipeline (Recommended)</option>
                <option value="ocr">OCR Step Only</option>
                <option value="normalize">Normalization Step Only</option>
                <option value="classify">Classification Step Only</option>
              </Form.Select>
              
              <Form.Text className="text-muted">
                {step === 'full' && 'Complete processing: OCR → Normalization → Classification'}
                {step === 'ocr' && 'Extract text from images/PDFs only'}
                {step === 'normalize' && 'Normalize amounts from text only'}
                {step === 'classify' && 'Classify amounts from pre-normalized data only'}
              </Form.Text>
            </Form.Group>
          </>
        )}

        {/* Submit Button */}
        <div className="d-grid gap-2">
          <Button
            variant="primary"
            type="submit"
            size="lg"
            disabled={isSubmitting || (inputMode === 'file' && !selectedFile) || (inputMode === 'text' && !text.trim())}
            className="position-relative overflow-hidden"
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              <>
                <BsUpload className="me-2" />
                {inputMode === 'file' ? 'Upload & Process' : 'Process Text'}
              </>
            )}
            
            {/* Progress indicator on button */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div 
                className="position-absolute top-0 start-0 h-100 bg-primary bg-opacity-25"
                style={{ width: `${uploadProgress}%` }}
              />
            )}
          </Button>
          
          {inputMode === 'file' && selectedFile && (
            <div className="text-center mt-2">
              <small className="text-muted">
                Ready to process: <span className="fw-bold">{selectedFile.name}</span>
              </small>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="danger" className="mt-3 d-flex align-items-center">
            <BsXCircle className="me-2 flex-shrink-0" />
            <div>{error}</div>
          </Alert>
        )}
      </Form>
    </div>
  );
};

export default AmountDetectForm;
