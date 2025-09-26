import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Container, 
  Navbar, 
  Nav,
  Button,
  NavDropdown,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { 
  House, 
  FileEarmarkText, 
  ClockHistory, 
  Sun, 
  Moon,
  List,
  X,
  Accessibility,
  QuestionCircle,
  ArrowUpCircle,
  Github,
  InfoCircle
} from 'react-bootstrap-icons';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import ThemeToggle from './theme/ThemeToggle';
import SkipToContent from './components/SkipToContent';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import Home from './pages/Home';
import Results from './pages/Results';

// Accessibility menu component
const AccessibilityMenu = () => {
  const [show, setShow] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  
  const increaseFontSize = () => {
    const newSize = Math.min(150, fontSize + 10);
    setFontSize(newSize);
    document.documentElement.style.setProperty('--font-size-scale', `${newSize}%`);  
  };
  
  const decreaseFontSize = () => {
    const newSize = Math.max(80, fontSize - 10);
    setFontSize(newSize);
    document.documentElement.style.setProperty('--font-size-scale', `${newSize}%`);
  };
  
  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    document.documentElement.setAttribute('data-high-contrast', newValue);
  };
  
  return (
    <>
      <OverlayTrigger
        placement="left"
        overlay={<Tooltip id="accessibility-tooltip">Accessibility Options</Tooltip>}
      >
        <Button 
          variant="outline-primary" 
          onClick={handleShow}
          className="position-fixed"
          style={{
            bottom: '1rem',
            right: '1rem',
            zIndex: 999,
            borderRadius: '50%',
            width: '3rem',
            height: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
          aria-label="Accessibility options"
        >
          <Accessibility size={20} />
        </Button>
      </OverlayTrigger>
      
      <div className={`offcanvas offcanvas-end ${show ? 'show' : ''}`} tabIndex="-1" id="accessibilityMenu" style={{
        visibility: show ? 'visible' : 'hidden',
        display: show ? 'block' : 'none'
      }}>
        <div className="offcanvas-header border-bottom">
          <h2 className="offcanvas-title">Accessibility</h2>
          <Button 
            type="button" 
            className="btn-close" 
            onClick={handleClose}
            aria-label="Close accessibility menu"
          ></Button>
        </div>
        <div className="offcanvas-body p-4">
          <div className="mb-4">
            <h3>Text Size</h3>
            <div className="d-flex align-items-center gap-2">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={decreaseFontSize}
                aria-label="Decrease text size"
              >
                A-
              </Button>
              <div className="text-center" style={{ minWidth: '3rem' }}>
                {fontSize}%
              </div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={increaseFontSize}
                aria-label="Increase text size"
              >
                A+
              </Button>
            </div>
          </div>
          
          <div className="mb-4">
            <h3>High Contrast</h3>
            <Button 
              variant={highContrast ? 'primary' : 'outline-secondary'}
              onClick={toggleHighContrast}
              aria-pressed={highContrast}
              aria-label="Toggle high contrast mode"
            >
              {highContrast ? 'On' : 'Off'}
            </Button>
          </div>
          
          <div className="mb-4">
            <h3>Keyboard Navigation</h3>
            <p className="small text-muted">
              Use Tab to navigate, Enter to select, and Esc to close menus.
            </p>
          </div>
          
          <div className="mb-4">
            <h3>Need Help?</h3>
            <p className="small text-muted">
              Contact support if you need additional accessibility assistance.
            </p>
          </div>
        </div>
      </div>
      {show && (
        <div 
          className="offcanvas-backdrop fade show" 
          onClick={handleClose}
          style={{ zIndex: 1000 }}
        ></div>
      )}
    </>
  );
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Back to top button
const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <OverlayTrigger
      placement="left"
      overlay={<Tooltip id="back-to-top-tooltip">Back to top</Tooltip>}
    >
      <Button
        onClick={scrollToTop}
        className={`back-to-top ${isVisible ? 'show' : ''}`}
        variant="primary"
        aria-label="Back to top"
        style={{
          position: 'fixed',
          bottom: '5rem',
          right: '1rem',
          borderRadius: '50%',
          width: '3rem',
          height: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isVisible ? 1 : 0,
          visibility: isVisible ? 'visible' : 'hidden',
          transition: 'all 0.3s ease-in-out',
          zIndex: 1000,
        }}
      >
        <ArrowUpCircle size={24} />
      </Button>
    </OverlayTrigger>
  );
};

// Main App component
function App() {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useTheme();
  
  return (
    <Router>
      <div className={`app-container d-flex flex-column min-vh-100 ${theme}`}>
        <SkipToContent />
        <ScrollToTop />
        
        <header>
          <Navbar 
            bg="primary" 
            variant="dark" 
            expand="lg" 
            className="shadow-sm"
            aria-label="Main navigation"
          >
            <Container>
              <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
                <FileEarmarkText className="me-2" />
                <span>Amount Detection</span>
              </Navbar.Brand>
              
              <div className="d-flex align-items-center gap-2">
                <ThemeToggle className="d-none d-md-flex" />
                
                <Navbar.Toggle 
                  aria-controls="main-nav" 
                  aria-expanded={expanded}
                  onClick={() => setExpanded(!expanded)}
                  aria-label="Toggle navigation"
                >
                  {expanded ? <X size={24} /> : <List size={24} />}
                </Navbar.Toggle>
              </div>
              
              <Navbar.Collapse id="main-nav">
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/" onClick={() => setExpanded(false)}>
                    <House className="me-1" /> Home
                  </Nav.Link>
                  <Nav.Link as={Link} to="/history" onClick={() => setExpanded(false)}>
                    <ClockHistory className="me-1" /> History
                  </Nav.Link>
                  <Nav.Link href="#" onClick={() => setExpanded(false)}>
                    <QuestionCircle className="me-1" /> Help
                  </Nav.Link>
                </Nav>
                
                <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
                  <ThemeToggle className="d-md-none" />
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip id="github-tooltip">View on GitHub</Tooltip>}
                  >
                    <Button 
                      as="a" 
                      href="https://github.com/yourusername/amount-detection" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      variant="outline-light"
                      size="sm"
                      className="d-flex align-items-center gap-1"
                      aria-label="View project on GitHub"
                    >
                      <Github /> <span className="d-none d-md-inline">GitHub</span>
                    </Button>
                  </OverlayTrigger>
                </div>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        </header>

        <main id="main-content" className="flex-grow-1 py-4">
          <Container>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/results" element={<Results />} />
              <Route 
                path="*" 
                element={
                  <div className="text-center py-5">
                    <h2>404 - Page Not Found</h2>
                    <p className="lead">The page you're looking for doesn't exist.</p>
                    <Link to="/" className="btn btn-primary mt-3">
                      Go to Home
                    </Link>
                  </div>
                } 
              />
            </Routes>
          </Container>
        </main>

        <footer className="bg-light py-4 border-top mt-auto">
          <Container>
            <div className="row">
              <div className="col-lg-6 mb-4 mb-lg-0">
                <div className="d-flex align-items-center mb-3">
                  <FileEarmarkText size={24} className="text-primary me-2" />
                  <h5 className="mb-0">Amount Detection</h5>
                </div>
                <p className="text-muted mb-3">
                  Extract and analyze monetary amounts from your documents with AI-powered precision.
                </p>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    as="a" 
                    href="#"
                    className="d-flex align-items-center"
                  >
                    <InfoCircle className="me-1" /> About
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    as="a" 
                    href="#"
                    className="d-flex align-items-center"
                  >
                    <QuestionCircle className="me-1" /> Help
                  </Button>
                </div>
              </div>
              <div className="col-md-4 col-lg-3 mb-4 mb-md-0">
                <h6 className="text-uppercase">Resources</h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <a href="#" className="text-decoration-none text-muted">Documentation</a>
                  </li>
                  <li className="mb-2">
                    <a href="#" className="text-decoration-none text-muted">API Reference</a>
                  </li>
                  <li className="mb-2">
                    <a href="#" className="text-decoration-none text-muted">Tutorials</a>
                  </li>
                  <li>
                    <a href="#" className="text-decoration-none text-muted">Blog</a>
                  </li>
                </ul>
              </div>
              <div className="col-md-4 col-lg-3">
                <h6 className="text-uppercase">Legal</h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <a href="#" className="text-decoration-none text-muted">Privacy Policy</a>
                  </li>
                  <li className="mb-2">
                    <a href="#" className="text-decoration-none text-muted">Terms of Service</a>
                  </li>
                  <li>
                    <a href="#" className="text-decoration-none text-muted">Cookie Policy</a>
                  </li>
                </ul>
              </div>
            </div>
            <hr className="my-4" />
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
              <p className="text-muted mb-2 mb-md-0">
                &copy; {new Date().getFullYear()} Amount Detection. All rights reserved.
              </p>
              <div className="d-flex gap-3">
                <a href="#" className="text-muted text-decoration-none" aria-label="Twitter">
                  <i className="bi bi-twitter"></i>
                </a>
                <a href="#" className="text-muted text-decoration-none" aria-label="LinkedIn">
                  <i className="bi bi-linkedin"></i>
                </a>
                <a href="#" className="text-muted text-decoration-none" aria-label="GitHub">
                  <i className="bi bi-github"></i>
                </a>
              </div>
            </div>
          </Container>
        </footer>
        
        <BackToTop />
        <AccessibilityMenu />
      </div>
    </Router>
  );
}

// Wrap the App with ThemeProvider
const ThemedApp = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default ThemedApp;
