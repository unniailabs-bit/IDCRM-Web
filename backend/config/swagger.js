const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ID CRM API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for ID CRM system - A platform for managing trusts, schools, teachers, students, and digital forms',
      contact: {
        name: 'API Support',
        email: 'support@idcrm.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://crm.mydigiinfocard.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoints',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message description',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
          },
        },
        // Authentication Schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
        // Trust Schemas
        Trust: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TrustCreate: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'ABC Trust' },
            email: { type: 'string', format: 'email', example: 'trust@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' },
            phone: { type: 'string', example: '+1234567890' },
            address: { type: 'string', example: '123 Main St' },
          },
        },
        // School Schemas
        School: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            trust_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SchoolCreate: {
          type: 'object',
          required: ['name', 'email', 'password', 'trust_id'],
          properties: {
            name: { type: 'string', example: 'ABC School' },
            email: { type: 'string', format: 'email', example: 'school@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' },
            phone: { type: 'string', example: '+1234567890' },
            address: { type: 'string', example: '123 School St' },
            trust_id: { type: 'integer', example: 1 },
          },
        },
        // Class Schemas
        Class: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            class_name: { type: 'string', example: 'Class 1' },
            school_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ClassCreate: {
          type: 'object',
          required: ['class_name'],
          properties: {
            class_name: { type: 'string', example: 'Class 1' },
          },
        },
        Division: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            division_name: { type: 'string', example: 'A' },
            class_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        DivisionCreate: {
          type: 'object',
          required: ['division_name', 'class_id'],
          properties: {
            division_name: { type: 'string', example: 'A' },
            class_id: { type: 'integer', example: 1 },
          },
        },
        // Student Schemas
        Student: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            roll_number: { type: 'string' },
            class_id: { type: 'integer' },
            division_id: { type: 'integer' },
            school_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        StudentCreate: {
          type: 'object',
          required: ['first_name', 'last_name', 'roll_number', 'class_id', 'division_id'],
          properties: {
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            roll_number: { type: 'string', example: '001' },
            class_id: { type: 'integer', example: 1 },
            division_id: { type: 'integer', example: 1 },
          },
        },
        // Teacher Schemas
        Teacher: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            school_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TeacherCreate: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', format: 'email', example: 'teacher@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' },
            phone: { type: 'string', example: '+1234567890' },
          },
        },
        // Student Form Schemas
        StudentForm: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            roll_number: { type: 'string' },
            class_id: { type: 'integer' },
            division_id: { type: 'integer' },
            school_id: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            photo: { type: 'string', format: 'uri' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        StudentFormSubmit: {
          type: 'object',
          required: ['first_name', 'last_name', 'roll_number', 'class_id', 'division_id'],
          properties: {
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            roll_number: { type: 'string', example: '001' },
            class_id: { type: 'integer', example: 1 },
            division_id: { type: 'integer', example: 1 },
            photo: { type: 'string', format: 'binary', description: 'Student photo (image file)' },
          },
        },
        FormStatusUpdate: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['approved', 'rejected'],
              example: 'approved',
            },
          },
        },
        // Form Link Schemas
        FormLink: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            token: { type: 'string' },
            class_id: { type: 'integer' },
            division_id: { type: 'integer' },
            teacher_id: { type: 'integer' },
            is_active: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        FormLinkCreate: {
          type: 'object',
          required: ['class_id', 'division_id'],
          properties: {
            class_id: { type: 'integer', example: 1 },
            division_id: { type: 'integer', example: 1 },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server.js', './swagger-docs.js', './backend-*/routes/*.js'], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};

