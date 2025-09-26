# Medical Bill Amount Detection Service

A high-performance Node.js service designed to accurately extract and classify monetary amounts from medical bills and receipts using AI and OCR technologies.

## 📋 Problem Statement

Processing medical billing documents involves handling various formats, layouts, and terminologies. This service automates the extraction of financial information, reducing manual effort and improving accuracy in medical billing workflows.

## ✨ Features

- **Multi-format Support**: Process images (JPG, PNG) and PDF documents
- **AI-Powered Extraction**: Advanced pattern recognition for accurate amount detection
- **Smart Classification**: Automatically categorizes amounts (total, subtotal, tax, insurance, etc.)
- **Currency Handling**: Supports multiple currencies with automatic detection
- **RESTful API**: Easy integration with any frontend or system
- **Scalable Architecture**: Built to handle high volumes of document processing

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Web Framework**: Express.js
- **OCR**: Tesseract.js
- **Image Processing**: Sharp
- **AI/ML**: Google Gemini API
- **Testing**: Jest
- **Logging**: Winston
- **Validation**: Joi

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Tesseract.js dependencies (installed automatically)
- Google Gemini API key (for AI processing)

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd amount-detect-service
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables
   ```bash
   cp .env.example .env
   # Update the .env file with your configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 📡 API Endpoints

### Health Check

```http
GET /health
```

Check if the service is running.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-09-26T18:26:30.123Z"
}
```

### Process Document

```http
POST /api/parse
Content-Type: multipart/form-data
```

Extract and classify amounts from a medical bill or receipt.

**Request Body (multipart/form-data):**
- `file`: (File) The document to process (image or PDF)
- `text`: (String, optional) Direct text input as an alternative to file upload

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "currency": "USD",
    "amounts": [
      {
        "type": "total_bill",
        "value": 2034.5,
        "source": "TOTAL $2,034.50"
      },
      {
        "type": "tax",
        "value": 162.76,
        "source": "Tax: $162.76"
      },
      {
        "type": "subtotal",
        "value": 1871.74,
        "source": "Subtotal: $1,871.74"
      }
    ],
    "metadata": {
      "processingTime": 2450,
      "documentType": "receipt",
      "confidence": 0.95
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "No valid input provided. Please provide either a file or text input.",
    "details": {}
  }
}
```

### Get Processing History

```http
GET /api/history
```

Retrieve a list of previously processed documents.

**Query Parameters:**
- `limit`: (Number) Number of items to return (default: 10)
- `offset`: (Number) Number of items to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_123",
      "timestamp": "2025-09-26T18:26:30.123Z",
      "documentType": "receipt",
      "totalAmount": 2034.5,
      "currency": "USD"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to run the server | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `MAX_FILE_SIZE` | Maximum file size in bytes | `5242880` (5MB) |
| `ALLOWED_FILE_TYPES` | Comma-separated list of allowed MIME types | `image/jpeg,image/png,application/pdf` |

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Using PM2 (recommended for production)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/index.js --name "amount-detect-service"

# Save the process list
pm2 save

# Set up startup script
pm2 startup
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Testing with Postman

Postman is a popular API testing tool that provides a user-friendly interface for testing API endpoints. Here's how to test the `/api/parse` endpoint using Postman:

### Prerequisites
1. [Download and install Postman](https://www.postman.com/downloads/)
2. Ensure your backend server is running (default: `http://localhost:3000`)

### Testing the Parse Endpoint

1. **Create a New Request**
   - Open Postman
   - Click "New" > "Request"
   - Name it "Parse Document" and save to a collection

2. **Configure the Request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/parse`
   - Go to the "Headers" tab and add:
     - `Content-Type`: `multipart/form-data`

3. **Set Up Request Body**
   - Go to the "Body" tab
   - Select `form-data`
   - Add a key named `file`
   - Hover over the key and change the type to "File"
   - Click "Select Files" and choose a medical bill/receipt image

4. **Send the Request**
   - Click the "Send" button
   - Wait for the response

### Example Successful Response
```json
{
  "success": true,
  "data": {
    "currency": "USD",
    "amounts": [
      {
        "type": "total_bill",
        "value": 2034.5,
        "source": "TOTAL $2,034.50"
      },
      {
        "type": "tax",
        "value": 162.76,
        "source": "Tax: $162.76"
      }
    ]
  }
}
```

### Testing with Text Input
If you want to test with direct text input instead of a file:
1. In the "Body" tab, add a new key `text`
2. Enter your text in the value field
3. Remove the `file` key if you added it
4. Send the request

### Environment Variables in Postman
1. Click on the gear icon ⚙️ > "Manage Environments"
2. Click "Add" to create a new environment (e.g., "Local Dev")
3. Add variables:
   ```
   base_url = http://localhost:3000
   api_key = your_api_key
   ```
4. Save and select this environment
5. Now you can use `{{base_url}}` in your request URLs

### Saving Requests
1. Click "Save" after testing
2. Choose a collection to save to
3. Add a name and description
4. Click "Save"

### Running Collections
1. Click on "Collections" in the sidebar
2. Click the "Run" button (play icon) next to your collection
3. Select the requests to run
4. Click "Run Collection"

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

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

## 🧪 Testing with Thunder Client

Thunder Client is a lightweight REST API Client Extension for VS Code. Here's how to use it to test the API:

### Prerequisites
1. Install the [Thunder Client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client) extension in VS Code
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Type "Thunder Client" and select "Thunder Client: New Request"

### Testing the Health Check

1. **Request**
   - Method: `GET`
   - URL: `http://localhost:3000/health`

2. **Expected Response**
   ```json
   {
     "status": "ok",
     "version": "1.0.0",
     "timestamp": "2025-09-26T18:30:45.000Z"
   }
   ```

### Testing Document Processing

1. **Request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/parse`
   - Headers:
     - `Content-Type`: `multipart/form-data`
   - Body (form-data):
     - Key: `file` (File type)
       - Select a medical bill/receipt image
     - (Optional) Key: `text` (Text type)
       - Value: `Your text content here`

2. **Example Successful Response**
   ```json
   {
     "success": true,
     "data": {
       "currency": "USD",
       "amounts": [
         {
           "type": "total_bill",
           "value": 2034.5,
           "source": "TOTAL $2,034.50"
         }
       ]
     }
   }
   ```

### Testing Error Cases

1. **No File or Text Provided**
   - Method: `POST`
   - URL: `http://localhost:3000/api/parse`
   - Headers:
     - `Content-Type`: `multipart/form-data`
   - Body: (leave empty)

   **Expected Error Response**
   ```json
   {
     "success": false,
     "error": {
       "code": "INVALID_INPUT",
       "message": "No valid input provided. Please provide either a file or text input."
     }
   }
   ```

### Using Environment Variables in Thunder Client

1. Click on the Thunder Client icon in the sidebar
2. Go to the "Env" tab
3. Click "New Environment" and name it (e.g., "Local Dev")
4. Add variables:
   ```
   base_url = http://localhost:3000
   api_key = your_api_key_here
   ```
5. Save and select this environment
6. Now you can use `{{base_url}}` in your URLs (e.g., `{{base_url}}/api/parse`)

### Saving Requests

1. After testing a request, click the "Save" button
2. Create a new collection (e.g., "Medical Bill API")
3. Give your request a name (e.g., "Process Document")
4. Save to easily run the same request later

## 📄 License

ISC
