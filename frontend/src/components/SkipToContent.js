import React from 'react';
import { Link } from 'react-router-dom';

/**
 * SkipToContent - Provides keyboard-accessible skip links for better navigation
 */
const SkipToContent = () => {
  return (
    <div className="skip-links" aria-label="Skip links">
      <Link 
        to="#main-content" 
        className="btn btn-primary position-absolute top-0 start-0 m-2 p-2 visually-hidden-focusable"
        style={{
          transform: 'translateY(-100%)',
          transition: 'transform 0.3s',
          zIndex: 1070,
          left: '1rem',
          borderRadius: '0 0 0.25rem 0.25rem'
        }}
        onFocus={(e) => {
          e.target.style.transform = 'translateY(0)';
        }}
        onBlur={(e) => {
          e.target.style.transform = 'translateY(-100%)';
        }}
      >
        Skip to main content
      </Link>
    </div>
  );
};

export default SkipToContent;
