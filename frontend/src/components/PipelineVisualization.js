import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  ProgressBar, 
  OverlayTrigger, 
  Tooltip,
  Badge
} from 'react-bootstrap';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Image, 
  ArrowRight, 
  Sliders, 
  Tags, 
  Check2Circle,
  InfoCircle
} from 'react-bootstrap-icons';

const STEP_ICONS = {
  ocr: <Image className="fs-4" />,
  normalize: <Sliders className="fs-4" />,
  classify: <Tags className="fs-4" />,
  results: <Check2Circle className="fs-4" />
};

const STEP_LABELS = {
  ocr: 'OCR',
  normalize: 'Normalize',
  classify: 'Classify',
  results: 'Results'
};

const STATUS_CONFIG = {
  pending: {
    icon: <Clock className="text-muted" />,
    variant: 'secondary',
    label: 'Pending'
  },
  processing: {
    icon: <div className="spinner-border spinner-border-sm text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>,
    variant: 'primary',
    label: 'Processing'
  },
  completed: {
    icon: <CheckCircle className="text-success" />,
    variant: 'success',
    label: 'Completed'
  },
  error: {
    icon: <XCircle className="text-danger" />,
    variant: 'danger',
    label: 'Error'
  }
};

const PipelineVisualization = ({ 
  steps = ['ocr', 'normalize', 'classify', 'results'],
  currentStep = 'ocr',
  status = {}, // e.g., { ocr: 'completed', normalize: 'processing' }
  confidence = {}, // e.g., { ocr: 0.95, normalize: 0.87 }
  onStepClick,
  showConfidence = true,
  className = ''
}) => {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Update active step when currentStep prop changes
  useEffect(() => {
    setActiveStep(currentStep);
  }, [currentStep]);

  // Animate progress when steps update
  useEffect(() => {
    const completedSteps = Object.values(status).filter(s => s === 'completed').length;
    const totalSteps = steps.length;
    const targetProgress = (completedSteps / totalSteps) * 100;
    
    setIsAnimating(true);
    const interval = setInterval(() => {
      setProgress(prev => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 1) {
          clearInterval(interval);
          setIsAnimating(false);
          return targetProgress;
        }
        return prev + (diff * 0.1); // Smooth animation
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [status, steps.length]);

  const getStepStatus = (step) => {
    return status[step] || 'pending';
  };

  const handleStepClick = (step) => {
    if (onStepClick) {
      onStepClick(step);
    }
    setActiveStep(step);
  };

  const renderStep = (step, index) => {
    const stepStatus = getStepStatus(step);
    const config = STATUS_CONFIG[stepStatus] || STATUS_CONFIG.pending;
    const isActive = activeStep === step;
    const stepConfidence = confidence[step];
    const showArrow = index < steps.length - 1;

    return (
      <React.Fragment key={step}>
        <Col 
          xs="auto" 
          className="d-flex flex-column align-items-center position-relative"
          style={{ zIndex: 2 }}
        >
          <div 
            className={`d-flex flex-column align-items-center ${onStepClick ? 'cursor-pointer' : ''}`}
            onClick={() => handleStepClick(step)}
            style={{ position: 'relative' }}
          >
            <div 
              className={`d-flex align-items-center justify-content-center rounded-circle mb-1
                ${isActive ? 'bg-primary bg-opacity-10' : ''}`}
              style={{
                width: '50px',
                height: '50px',
                border: `2px solid var(--bs-${config.variant})`,
                transition: 'all 0.3s ease'
              }}
            >
              <div className={`text-${config.variant}`}>
                {config.icon}
              </div>
            </div>
            
            <div className="text-center">
              <div className="fw-medium">{STEP_LABELS[step] || step}</div>
              {showConfidence && stepConfidence !== undefined && (
                <div className="small">
                  <Badge 
                    bg={stepConfidence > 0.7 ? 'success' : stepConfidence > 0.4 ? 'warning' : 'danger'}
                    className="mt-1"
                  >
                    {Math.round(stepConfidence * 100)}%
                  </Badge>
                </div>
              )}
            </div>
            
            {stepStatus === 'processing' && (
              <div className="position-absolute top-0 end-0">
                <span className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </span>
              </div>
            )}
          </div>
        </Col>
        
        {showArrow && (
          <Col xs="auto" className="d-flex align-items-center">
            <div className="position-relative" style={{ width: '30px' }}>
              <div className="progress" style={{ height: '2px' }}>
                <div 
                  className={`progress-bar bg-${config.variant}`}
                  style={{ width: stepStatus === 'completed' ? '100%' : '0%' }}
                />
              </div>
              <ArrowRight className="position-absolute top-50 start-50 translate-middle bg-white px-1" />
            </div>
          </Col>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className={`pipeline-visualization ${className}`}>
      <div className="position-relative mb-4">
        <div className="progress" style={{ height: '4px' }}>
          <ProgressBar 
            now={progress} 
            variant="primary" 
            animated={isAnimating}
            style={{ transition: 'width 0.5s ease-out' }}
          />
        </div>
      </div>
      
      <Row className="justify-content-center align-items-center g-0">
        {steps.map((step, index) => renderStep(step, index))}
      </Row>
      
      {activeStep && (
        <div className="mt-4 p-3 bg-light rounded">
          <div className="d-flex align-items-center mb-2">
            <h6 className="mb-0 me-2">{STEP_LABELS[activeStep] || activeStep}</h6>
            <Badge bg={STATUS_CONFIG[getStepStatus(activeStep)]?.variant || 'secondary'}>
              {STATUS_CONFIG[getStepStatus(activeStep)]?.label}
            </Badge>
          </div>
          
          {confidence[activeStep] !== undefined && (
            <div className="mb-2">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Confidence:</span>
                <span>{Math.round(confidence[activeStep] * 100)}%</span>
              </div>
              <ProgressBar 
                now={confidence[activeStep] * 100} 
                variant={
                  confidence[activeStep] > 0.7 ? 'success' : 
                  confidence[activeStep] > 0.4 ? 'warning' : 'danger'
                }
                style={{ height: '6px' }}
              />
            </div>
          )}
          
          {status[activeStep] === 'error' && (
            <div className="text-danger small">
              <InfoCircle className="me-1" />
              An error occurred during this step
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PipelineVisualization;
