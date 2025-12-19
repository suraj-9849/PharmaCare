import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DrugDesk API',
      version: '1.0.0',
      description:
        'Professional Pharmacy Management System API - Complete API documentation for managing drugs, inventory, sales, customers, and suppliers.',
      contact: {
        name: 'API Support',
        email: 'support@DrugDesk.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.DrugDesk.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            username: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'PHARMACIST', 'CASHIER'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Drug: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            brandName: {
              type: 'string',
            },
            genericName: {
              type: 'string',
            },
            category: {
              type: 'string',
            },
            manufacturer: {
              type: 'string',
            },
            requiresPrescription: {
              type: 'boolean',
            },
            reorderLevel: {
              type: 'number',
            },
            sku: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        InventoryBatch: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            drugId: {
              type: 'string',
              format: 'uuid',
            },
            supplierId: {
              type: 'string',
              format: 'uuid',
            },
            batchNumber: {
              type: 'string',
            },
            quantity: {
              type: 'number',
            },
            costPrice: {
              type: 'number',
            },
            sellPrice: {
              type: 'number',
            },
            expiryDate: {
              type: 'string',
              format: 'date',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Sale: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            totalAmount: {
              type: 'number',
            },
            paymentMethod: {
              type: 'string',
              enum: ['CASH', 'CARD', 'UPI', 'CREDIT'],
            },
            status: {
              type: 'string',
              enum: ['COMPLETED', 'CANCELLED'],
            },
            saleDate: {
              type: 'string',
              format: 'date-time',
            },
            notes: {
              type: 'string',
            },
          },
        },
        SaleItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            saleId: {
              type: 'string',
              format: 'uuid',
            },
            drugId: {
              type: 'string',
              format: 'uuid',
            },
            batchId: {
              type: 'string',
              format: 'uuid',
            },
            quantity: {
              type: 'number',
            },
            unitPrice: {
              type: 'number',
            },
            subtotal: {
              type: 'number',
            },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            address: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            age: {
              type: 'number',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Supplier: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            contactPerson: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            phone: {
              type: 'string',
            },
            address: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
            },
            statusCode: {
              type: 'number',
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
            },
            limit: {
              type: 'number',
            },
            total: {
              type: 'number',
            },
            pages: {
              type: 'number',
            },
            hasNextPage: {
              type: 'boolean',
            },
            hasPreviousPage: {
              type: 'boolean',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@DrugDesk.com',
            },
            password: {
              type: 'string',
              example: 'password123',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            token: {
              type: 'string',
              description: 'JWT Token',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/swagger.docs.ts',
    './src/routes/auth.routes.ts',
    './src/routes/drug.routes.ts',
    './src/routes/inventory.routes.ts',
    './src/routes/sale.routes.ts',
    './src/routes/customer.routes.ts',
    './src/routes/supplier.routes.ts',
    './src/routes/dashboard.routes.ts',
  ],
};

export const specs = swaggerJsdoc(options);
