/**
 * Swagger configuration
 */
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Amount Detect API',
      version: '1.0.0',
      description: 'API for extracting and classifying monetary amounts from medical bills and receipts',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
              enum: ['error', 'no_amounts_found']
            },
            reason: {
              type: 'string',
              example: 'document too noisy',
              description: 'Reason for the error or status. Possible values: "document too noisy", "no text content"',
              enum: ['document too noisy', 'no text content'],
              nullable: true
            },
            message: {
              type: 'string',
              example: 'Error message description',
              nullable: true
            },
            currency: {
              type: 'string',
              example: 'INR',
              description: 'Default currency used when no amounts are found',
              nullable: true
            },
            amounts: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Empty array when no amounts are found',
              nullable: true
            }
          }
        },
        Amount: {
          type: 'object',
          properties: {
            value: {
              type: 'number',
              format: 'float',
              example: 1500.75
            },
            currency: {
              type: 'string',
              example: 'INR'
            },
            type: {
              type: 'string',
              enum: ['total', 'subtotal', 'tax', 'discount', 'other'],
              example: 'total'
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              example: 0.95
            },
            context: {
              type: 'string',
              example: 'Total amount due'
            }
          }
        },
        ParseResponse: {
          type: 'object',
          properties: {
            currency: {
              type: 'string',
              example: 'INR'
            },
            amounts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Amount'
              }
            },
            status: {
              type: 'string',
              enum: ['success', 'error'],
              example: 'success'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2023-10-01T12:00:00Z'
            },
            processingTimeMs: {
              type: 'integer',
              example: 1250
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // Path to the API docs
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../routes/api/*.js')
  ]
};

const specs = swaggerJsdoc(options);

module.exports = { specs };
