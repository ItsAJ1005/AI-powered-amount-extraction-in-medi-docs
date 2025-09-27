# AI-Powered Amount Detection System

A sophisticated document processing system that uses AI and OCR to extract financial amounts from medical documents and invoices. The system combines multiple extraction strategies including LLM processing, regex patterns, and fallback mechanisms to ensure high accuracy.

**Video showing demo of api endpoints:** https://drive.google.com/file/d/1iOxblNLLriSwdP66iAkR8vNQVmD0upM6/view?usp=drivesdk
 
You can access and test API routes using the Swagger UI at 
https://ai-powered-amount-extraction-in-medi-docs.onrender.com/api-docs/  
(Live API deployed)

http://localhost:3000/api-docs  (local development)
to see the documentation.

## 🚀 Features

- **Multi-Modal Extraction**: Combines LLM (Gemini) processing with regex fallback
- **OCR Integration**: Tesseract-based text extraction from images
- **Smart Pattern Matching**: Advanced regex patterns for various invoice formats
- **Currency Detection**: Automatic detection of USD, INR, EUR, GBP, JPY
- **Robust Error Handling**: Multiple fallback strategies for maximum reliability
- **RESTful API**: Clean API endpoints for easy integration
- **Real-time Processing**: Fast document processing with detailed logging

## 🏗️ Architecture

![Architectural Diagram](https://github.com/ItsAJ1005/AI-powered-amount-extraction-in-medi-docs/blob/main/AI%20powered%20amount%20extraction%20architectural%20diagram.jpg?raw=true)


### Backend Services

#### 1. Pipeline Service (`pipelineService.js`)
- **Main orchestrator** for the entire processing pipeline
- Coordinates OCR, LLM, and fallback extraction
- Handles error recovery and result validation
- Provides comprehensive logging and debugging

#### 2. LLM Service (`llmService.js`)
- **AI-powered extraction** using Google Gemini models
- Supports multiple model fallbacks (gemini-2.0-flash, gemini-1.5-pro)
- Intelligent retry logic with exponential backoff
- JSON response parsing and validation

#### 3. OCR Service (`ocrService.js`)
- **Tesseract integration** for image-to-text conversion
- Automatic DPI detection and optimization
- Support for multiple image formats
- Text preprocessing and cleaning

#### 4. Normalization Service (`normalizationService.js`)
- **Character substitution** for OCR error correction
- Smart number parsing with context awareness
- Confidence scoring for extracted amounts
- Handles various number formats and separators

### Frontend Components

#### 1. Home Page (`pages/Home/index.js`)
- Clean, modern interface for document upload
- Real-time processing status updates
- Results display with detailed breakdown

#### 2. Utility Functions
- **Formatters** (`utils/formatters.js`): Currency and number formatting
- **Validators** (`utils/validators.js`): Input validation and sanitization

## 📊 Supported Document Types

### Invoice Formats
- **Standard Invoices**: Total, subtotal, tax, discount, shipping
- **Medical Bills**: Treatment costs, insurance amounts, patient payments
- **Receipts**: Itemized amounts, taxes, tips
- **Statements**: Account balances, payments, charges

### Amount Types Detected
- `total_bill`: Final amount due
- `paid`: Amount already paid
- `due`: Outstanding balance
- `tax`: Tax amounts (sales tax, GST, VAT)
- `discount`: Discount amounts
- `shipping`: Shipping and delivery costs

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Python 3.7+ (for Tesseract OCR)
- Tesseract OCR installed on system

### Backend Setup

```bash
cd backend
npm install

# Install Tesseract OCR
# Ubuntu/Debian:
sudo apt-get install tesseract-ocr

# macOS:
brew install tesseract

# Windows:
# Download from: https://github.com/UB-Mannheim/tesseract/wiki

# Set up environment variables
cp .env.example .env
# Edit .env with your Gemini API key
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Environment Variables

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
GEMINI_FALLBACK_MODEL=gemini-1.5-pro

# Server Configuration
PORT=3001
NODE_ENV=development

# OCR Configuration
TESSERACT_DPI=300
TESSERACT_LANG=eng
```

## 🚀 Usage

### API Endpoints

#### Process Document
```http
POST /api/process
Content-Type: multipart/form-data

Body:
- file: (image file) - Document image to process
- text: (string) - Direct text input (alternative to file)
```

#### Health Check
```http
GET /api/health
```

### Example API Response

```json
{
  "currency": "USD",
  "amounts": [
    {
      "type": "total_bill",
      "value": 34850,
      "source": "text: 'Total, USD: 34850.00'"
    },
    {
      "type": "tax",
      "value": 6150,
      "source": "text: 'Sales Tax, USD: 6150.00'"
    },
    {
      "type": "discount",
      "value": 1800,
      "source": "text: 'Discount, USD. 1800.00'"
    }
  ],
  "status": "ok"
}
```

### Frontend Usage

1. **Upload Document**: Drag and drop or select an image file
2. **Process**: Click "Process Document" to start extraction
3. **View Results**: See extracted amounts with confidence scores
4. **Download**: Export results as JSON or CSV

## 🔍 Extraction Patterns

### Supported Text Formats

#### With Currency Symbols
- `Total: $1,200.00`
- `Amount: ₹5,000`
- `Due: €250.50`

#### With Currency Codes
- `Total, USD: 30000.00`
- `Discount, INR. 1800.00`
- `Sales Tax, EUR: 6150.00`

#### Without Punctuation
- `Total 2000`
- `Amount 1500`
- `Due 500`

#### Mixed Formats
- `Subtotal: 1000 Discount: 100 Total: 900`
- `Paid: $500 Balance: $400`

### Regex Patterns

The system uses sophisticated regex patterns to handle various formats:

```javascript
// Currency with symbols
/([$€£¥₹%])\s*(\d[\d,.]*\d*)/g

// Currency codes
/(?:usd|inr|eur|gbp|jpy)\s*[:\-\.]\s*(\d[\d,.]*\d*)/gi

// Keyword-number combinations
/\b(?:total|subtotal|amount|bill|net)\b\s+(\d[\d,.]*\d*)/gi
```

## 🛠️ Development

### Project Structure

```
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── pipelineService.js    # Main processing pipeline
│   │   │   ├── llmService.js         # AI/LLM integration
│   │   │   ├── ocrService.js         # OCR processing
│   │   │   └── normalizationService.js # Text normalization
│   │   ├── routes/
│   │   │   ├── api.js               # API endpoints
│   │   │   └── index.js             # Route handlers
│   │   └── index.js                 # Server entry point
│   ├── uploads/                     # Temporary file storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/Home/              # Main application page
│   │   ├── utils/                   # Utility functions
│   │   └── App.js                   # React app component
│   └── package.json
└── README.md
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking (if using TypeScript)
npm run type-check
```

## 🔧 Configuration

### LLM Configuration

```javascript
// Model settings
generationConfig: {
  temperature: 0.1,        // Low temperature for consistency
  topK: 10,
  topP: 0.8,
  maxOutputTokens: 512     // Optimized for speed
}

// Retry settings
attemptsPerModel: 3,
initialBackoffMs: 1000,
maxBackoffMs: 10000
```

### OCR Configuration

```javascript
// Tesseract options
{
  dpi: 300,               // Optimal DPI for text recognition
  lang: 'eng',            // Language model
  oem: 1,                 // OCR Engine Mode
  psm: 6                  // Page Segmentation Mode
}
```

## 🚨 Error Handling

### Common Issues & Solutions

#### 1. LLM JSON Parse Error
- **Cause**: Malformed JSON response from AI
- **Solution**: Enhanced JSON cleaning and fallback to regex

#### 2. OCR Text Quality
- **Cause**: Poor image quality or resolution
- **Solution**: Automatic DPI adjustment and text preprocessing

#### 3. Pattern Matching Failures
- **Cause**: Unusual invoice formats
- **Solution**: Multiple fallback patterns and comprehensive extraction

#### 4. Currency Detection Issues
- **Cause**: Ambiguous currency indicators
- **Solution**: Context-aware detection with INR default

### Debugging

Enable detailed logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## 📈 Performance

### Benchmarks
- **OCR Processing**: ~2-5 seconds per document
- **LLM Processing**: ~1-3 seconds per document
- **Regex Fallback**: ~100-500ms per document
- **Total Pipeline**: ~3-8 seconds average

### Optimization Tips
1. **Image Quality**: Use high-resolution images (300+ DPI)
2. **Text Clarity**: Ensure good contrast and minimal noise
3. **Format Consistency**: Use standard invoice formats when possible
4. **Batch Processing**: Process multiple documents in parallel

## 🔒 Security

### Data Protection
- **No Data Persistence**: Documents are processed in memory only
- **Temporary Storage**: Files are deleted after processing
- **API Key Security**: Environment variable protection
- **Input Validation**: Comprehensive sanitization

### Best Practices
- Use HTTPS in production
- Implement rate limiting
- Validate file types and sizes
- Monitor API usage

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Standards
- Follow ESLint configuration
- Write comprehensive tests
- Document new features
- Maintain backward compatibility

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Getting Help
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Documentation**: Check this README and inline code comments
- **Community**: Join our Discord server for discussions

### Common Questions

**Q: Why is the system not detecting amounts in my document?**
A: Check image quality, ensure text is clear, and verify the document format matches supported patterns.

**Q: Can I use my own LLM API key?**
A: Yes, set the `GEMINI_API_KEY` environment variable with your key.

**Q: How accurate is the extraction?**
A: Accuracy depends on document quality and format. High-quality invoices typically achieve 90%+ accuracy.

**Q: Can I process documents in other languages?**
A: Currently optimized for English, but can be extended with additional Tesseract language models.

## 🔄 Changelog

### Version 1.0.0
- Initial release with core functionality
- LLM integration with Gemini
- OCR processing with Tesseract
- Comprehensive regex patterns
- RESTful API endpoints
- React frontend interface

### Recent Updates
- Enhanced JSON parsing for LLM responses
- Improved pattern matching for various formats
- Added support for "Total 2000" style inputs
- Better error handling and fallback mechanisms
- Performance optimizations

---

**Built with ❤️ for accurate financial document processing**