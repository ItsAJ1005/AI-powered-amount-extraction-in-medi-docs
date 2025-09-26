# Amount Detect Service

A focused Node.js service for extracting and classifying monetary amounts from medical bills and receipts.

## Problem Statement

Medical billing often involves processing various documents with monetary amounts in different formats and contexts. This service provides a streamlined pipeline to accurately detect, extract, and classify these amounts for further processing.

## Features

- **OCR Processing**: Extracts text from medical bill/receipt images
- **Amount Normalization**: Standardizes different currency formats
- **Amount Classification**: Categorizes amounts (e.g., total, tax, insurance)
- **REST API**: Simple HTTP endpoints for integration

## Tech Stack

- Node.js 18+
- Express.js
- Tesseract.js (OCR)
- Sharp (Image processing)
- Jest (Testing)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Start the server: `npm run dev`

## API Endpoints

- `POST /api/process` - Process a medical bill/receipt image

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## Environment Variables

See `.env.example` for required environment variables.

## License

ISC
