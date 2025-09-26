import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Toast, ToastContainer, Button, Spinner, ProgressBar } from 'react-bootstrap';
import { 
  CheckCircle, 
  XCircle, 
  ExclamationTriangle, 
  InfoCircle,
  X,
  Clock,
  CloudUpload,
  FileEarmarkText
} from 'react-bootstrap-icons';

// Context for toast notifications
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastProvider = ({ children, position = 'top-end', containerStyle = { position: 'fixed', zIndex: 11 } }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback(({ 
    title, 
    message, 
    variant = 'info', 
    duration = 5000, 
    showProgress = true,
    action,
    icon: Icon,
    autoDismiss = true,
    isLoading = false
  }) => {
    const id = toastIdCounter.current++;
    const newToast = { 
      id, 
      title, 
      message, 
      variant, 
      showProgress: showProgress && autoDismiss,
      progress: 100,
      action,
      icon: Icon,
      autoDismiss,
      isLoading
    };

    setToasts(prevToasts => [...prevToasts, newToast]);

    // Auto-dismiss if enabled
    if (autoDismiss) {
      const interval = 50; // ms
      const steps = duration / interval;
      let step = 0;

      const timer = setInterval(() => {
        step += 1;
        const progress = 100 - (step / steps) * 100;
        
        setToasts(prevToasts => 
          prevToasts.map(toast => 
            toast.id === id ? { ...toast, progress } : toast
          )
        );

        if (step >= steps) {
          clearInterval(timer);
          removeToast(id);
        }
      }, interval);

      // Return cleanup function
      return () => clearInterval(timer);
    }

    return () => removeToast(id);
  }, [removeToast]);

  // Predefined toast types
  const toast = useCallback({
    success: (title, message, options = {}) => 
      addToast({ 
        title, 
        message, 
        variant: 'success', 
        icon: CheckCircle,
        ...options 
      }),
      
    error: (title, message, options = {}) => 
      addToast({ 
        title, 
        message, 
        variant: 'danger', 
        icon: XCircle,
        autoDismiss: false, // Don't auto-dismiss errors
        ...options 
      }),
      
    warning: (title, message, options = {}) => 
      addToast({ 
        title, 
        message, 
        variant: 'warning', 
        icon: ExclamationTriangle,
        ...options 
      }),
      
    info: (title, message, options = {}) => 
      addToast({ 
        title, 
        message, 
        variant: 'info', 
        icon: InfoCircle,
        ...options 
      }),
      
    loading: (title, message = 'Please wait...', options = {}) =>
      addToast({
        title,
        message,
        variant: 'info',
        icon: ({ className }) => <Spinner animation="border" size="sm" className={className} />,
        autoDismiss: false,
        showProgress: false,
        isLoading: true,
        ...options
      }),
      
    uploadProgress: (title, progress, options = {}) => {
      const id = toastIdCounter.current;
      
      setToasts(prevToasts => {
        const exists = prevToasts.some(t => t.id === id && t.title === title);
        
        if (!exists) {
          toastIdCounter.current++;
          return [
            ...prevToasts,
            {
              id,
              title,
              message: 'Uploading...',
              variant: 'info',
              icon: CloudUpload,
              showProgress: true,
              progress: 0,
              autoDismiss: false,
              ...options
            }
          ];
        }
        
        return prevToasts.map(t => 
          t.id === id && t.title === title 
            ? { 
                ...t, 
                progress,
                message: progress >= 100 ? 'Processing...' : 'Uploading...',
                variant: progress >= 100 ? 'success' : 'info'
              } 
            : t
        );
      });
      
      return () => removeToast(id);
    }
  }, [addToast]);

  // Handle API errors consistently
  const handleApiError = useCallback((error, defaultMessage = 'An error occurred') => {
    console.error('API Error:', error);
    
    let title = 'Error';
    let message = defaultMessage;
    
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      const { status, data } = error.response;
      
      if (status === 400) {
        title = 'Invalid Request';
        message = data?.message || 'The request was invalid. Please check your input.';
      } else if (status === 401) {
        title = 'Unauthorized';
        message = 'Please log in to continue.';
      } else if (status === 403) {
        title = 'Access Denied';
        message = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        title = 'Not Found';
        message = 'The requested resource was not found.';
      } else if (status >= 500) {
        title = 'Server Error';
        message = 'Something went wrong on our end. Please try again later.';
      }
    } else if (error.request) {
      // Request was made but no response received
      title = 'Network Error';
      message = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.message) {
      // Something happened in setting up the request
      message = error.message;
    }
    
    toast.error(title, message);
    return { title, message };
  }, [toast]);

  // Handle file validation errors
  const handleFileError = useCallback((error) => {
    if (error.name === 'FileTypeError') {
      toast.error(
        'Invalid File Type',
        error.message || 'Please upload a valid file type (PDF, JPG, PNG, etc.)'
      );
    } else if (error.name === 'FileSizeError') {
      toast.error(
        'File Too Large',
        error.message || 'The file is too large. Maximum size is 10MB.'
      );
    } else if (error.name === 'NoAmountsDetectedError') {
      toast.warning(
        'No Amounts Found',
        'We couldn\'t detect any monetary amounts in the document.'
      );
    } else if (error.name === 'LowConfidenceError') {
      toast.warning(
        'Low Confidence Results',
        'The detected amounts have low confidence. Please verify the results.'
      );
    } else {
      handleApiError(error, 'An error occurred while processing the file');
    }
  }, [toast, handleApiError]);

  const value = {
    toasts,
    addToast,
    removeToast,
    toast,
    handleApiError,
    handleFileError
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer 
        position={position} 
        className="p-3" 
        style={containerStyle}
      >
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            bg={toast.variant}
            show={true}
            onClose={() => removeToast(toast.id)}
            className="mb-2"
            animation={true}
            autohide={false}
          >
            <Toast.Header closeButton={!toast.isLoading} className={`bg-${toast.variant} bg-opacity-10 text-${toast.variant}`}>
              <div className="d-flex align-items-center me-2">
                {toast.isLoading ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : toast.icon ? (
                  <toast.icon className="me-2" />
                ) : null}
                <strong className="me-auto">{toast.title}</strong>
              </div>
              {!toast.autoDismiss && !toast.isLoading && (
                <small className="text-muted">
                  <Clock size={12} className="me-1" />
                  Just now
                </small>
              )}
            </Toast.Header>
            <Toast.Body className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {toast.message}
                  {toast.action && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 ms-2 align-baseline text-decoration-none"
                      onClick={() => {
                        toast.action.onClick();
                        if (toast.action.dismissOnClick) {
                          removeToast(toast.id);
                        }
                      }}
                    >
                      {toast.action.label}
                    </Button>
                  )}
                </div>
                {toast.isLoading && (
                  <Spinner animation="border" size="sm" className="ms-2" />
                )}
              </div>
              {toast.showProgress && (
                <ProgressBar 
                  variant={toast.variant}
                  now={toast.progress} 
                  className="mt-2" 
                  style={{ height: '2px' }}
                />
              )}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

// Hook for common error scenarios
export const useErrorHandling = () => {
  const { handleApiError, handleFileError } = useToast();
  
  const handleError = useCallback((error, context = {}) => {
    console.error(`Error in ${context.component || 'unknown component'}:`, error);
    
    // Handle specific error types
    if (error instanceof TypeError && error.message.includes('NetworkError')) {
      return handleApiError({ request: true }, 'Network connection failed');
    }
    
    if (error.name === 'AbortError') {
      // Request was cancelled, no need to show error
      return null;
    }
    
    // Handle file-related errors
    if (['FileTypeError', 'FileSizeError', 'NoAmountsDetectedError', 'LowConfidenceError'].includes(error.name)) {
      return handleFileError(error);
    }
    
    // Default to API error handling
    return handleApiError(error, context.defaultMessage || 'An unexpected error occurred');
  }, [handleApiError, handleFileError]);
  
  // Handle empty states
  const renderEmptyState = useCallback(({ 
    title = 'No Data', 
    message = 'There is no data to display.', 
    icon: Icon = FileEarmarkText,
    action 
  }) => (
    <div className="text-center py-5">
      <div className="mb-3">
        <Icon size={48} className="text-muted" />
      </div>
      <h5 className="text-muted">{title}</h5>
      <p className="text-muted mb-4">{message}</p>
      {action && (
        <Button 
          variant={action.variant || 'primary'} 
          onClick={action.onClick}
          disabled={action.isLoading}
        >
          {action.isLoading && <Spinner animation="border" size="sm" className="me-2" />}
          {action.label}
        </Button>
      )}
    </div>
  ), []);
  
  // Handle loading states
  const renderLoadingState = useCallback(({ message = 'Loading...' } = {}) => (
    <div className="text-center py-5">
      <Spinner animation="border" role="status" className="mb-3">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="text-muted">{message}</p>
    </div>
  ), []);
  
  return {
    handleError,
    renderEmptyState,
    renderLoadingState,
    handleApiError,
    handleFileError
  };
};

export default ToastProvider;

// Example usage:
/*
// In your App.js or root component:
import { ToastProvider } from './components/ToastNotifications';

function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  );
}

// In any component:
import { useToast, useErrorHandling } from './components/ToastNotifications';

function YourComponent() {
  const { toast } = useToast();
  const { handleError } = useErrorHandling();
  
  // Example usage:
  const handleSomething = async () => {
    try {
      // Show loading state
      const loadingToast = toast.loading('Processing...');
      
      // Your async operation
      const result = await someApiCall();
      
      // Success
      toast.success('Success', 'Operation completed successfully!');
      
      return result;
    } catch (error) {
      // Handle error
      handleError(error, { 
        component: 'YourComponent',
        defaultMessage: 'Failed to perform operation'
      });
      throw error;
    }
  };
  
  // Example file upload with progress
  const uploadFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Show upload progress
      const updateProgress = (progress) => {
        toast.uploadProgress('Uploading file', progress);
      };
      
      const response = await api.uploadFile(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          updateProgress(progress);
        }
      });
      
      toast.success('Upload Complete', 'File uploaded successfully!');
      return response;
      
    } catch (error) {
      handleError(error);
      throw error;
    }
  };
}
*/
