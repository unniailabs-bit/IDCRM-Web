# Swagger API Documentation Setup

This document explains how to set up and use Swagger API documentation for the ID CRM backend.

## Installation

The Swagger dependencies have been added to `package.json`. Install them by running:

```bash
npm install
```

Or install them manually:

```bash
npm install swagger-ui-express swagger-jsdoc --save
```

## Accessing Swagger UI

Once the backend server is running, you can access the Swagger documentation at:

**Local Development:**
- http://localhost:5000/api-docs

**Production:**
- https://your-domain.com/api-docs

## Features

The Swagger documentation includes:

1. **Complete API Reference** - All endpoints documented with:
   - Request/Response schemas
   - Authentication requirements
   - Parameter descriptions
   - Example values

2. **Interactive Testing** - Test API endpoints directly from the Swagger UI:
   - Try out endpoints
   - See request/response examples
   - Test authentication flows

3. **Organized by Tags**:
   - Authentication
   - Super Admin
   - Trust
   - School
   - Class
   - Teacher
   - Student
   - Student Forms
   - Form Links
   - Digital Forms
   - Student ID

## Authentication

Most endpoints require JWT authentication. To use protected endpoints:

1. First, login using one of the authentication endpoints:
   - `/api/superadmin/login`
   - `/api/trust/auth/login`
   - `/api/school/auth/login`
   - `/api/teacher/auth/login`

2. Copy the `token` from the response

3. Click the "Authorize" button at the top of the Swagger UI

4. Enter: `Bearer <your-token>` (include the word "Bearer" followed by a space)

5. Click "Authorize" and "Close"

Now you can test protected endpoints!

## File Structure

```
backend/
├── config/
│   └── swagger.js          # Swagger configuration
├── swagger-docs.js         # API endpoint documentation
└── server.js               # Swagger UI integration
```

## Adding New Endpoints

To document a new endpoint:

1. Add the Swagger JSDoc comment in the route file or in `swagger-docs.js`
2. Follow the existing pattern:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [Your Tag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success response
 */
```

## Customization

You can customize the Swagger UI by modifying `config/swagger.js`:

- Change the API title, version, and description
- Add more servers/environments
- Modify schemas and components
- Customize the UI appearance

## Troubleshooting

### Swagger UI not loading
- Ensure dependencies are installed: `npm install`
- Check that the server is running
- Verify the route `/api-docs` is accessible

### Endpoints not showing
- Check that `swagger-docs.js` is included in the `apis` array in `config/swagger.js`
- Verify JSDoc comments are properly formatted
- Check server logs for parsing errors

### Authentication not working
- Ensure you're using the correct format: `Bearer <token>`
- Check that the token hasn't expired
- Verify the endpoint requires authentication

## Exporting Documentation

You can export the OpenAPI specification:

1. Access: `http://localhost:5000/api-docs/swagger.json`
2. Save the JSON file
3. Import into tools like Postman, Insomnia, or other API clients

## Additional Resources

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express Documentation](https://github.com/scottie1984/swagger-ui-express)

