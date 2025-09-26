# API Documentation

This document provides information about the Amount Detect API, which is used for extracting and classifying monetary amounts from medical bills and receipts.

## Table of Contents

- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)
- [Development](#development)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check

```
GET /api/health
```

Check if the API is running.

### Parse Document

```
POST /api/parse
```

Extract and classify monetary amounts from a document or text.

**Request Body (multipart/form-data):**
- `file`: (optional) The file to process (JPEG, PNG, WebP, PDF, or TXT)
- `text`: (optional) Direct text input as an alternative to file upload

**Responses:**
- `200`: Successfully processed the document
- `400`: Bad request - neither file nor text provided
- `413`: File too large (max 10MB)
- `415`: Unsupported media type
- `500`: Internal server error

## Authentication

This API uses JWT for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_token_here>
```

## Error Handling

All error responses follow this format:

```json
{
  "status": "error",
  "error": "Error message",
  "message": "User-friendly error message"
}
```

## Rate Limiting

The API is rate limited to 100 requests per minute per IP address.

## Examples

### cURL Example

```bash
curl -X POST http://localhost:3000/api/parse \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/your/document.jpg"
```

### JavaScript Example

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/parse', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_token_here'
  },
  body: formData
});

const data = await response.json();
console.log(data);
```

## Development

### Running the Server

```bash
# Development mode with hot-reload
npm run dev

# Production mode
npm start
```

### Viewing API Documentation

1. Start the server
2. Open http://localhost:3000/api-docs in your browser

### Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## License

ISC
