#!/bin/bash

# Script to install Swagger dependencies
echo "Installing Swagger dependencies..."

cd "$(dirname "$0")"

# Try to fix npm permissions if needed
if [ -d "$HOME/.npm" ] && [ ! -w "$HOME/.npm" ]; then
    echo "Fixing npm permissions..."
    sudo chown -R $(whoami) "$HOME/.npm"
fi

# Install dependencies
npm install swagger-ui-express swagger-jsdoc --save

if [ $? -eq 0 ]; then
    echo "✅ Swagger dependencies installed successfully!"
    echo ""
    echo "To use Swagger documentation:"
    echo "1. Start the backend server: npm start"
    echo "2. Access Swagger UI at: http://localhost:5000/api-docs"
else
    echo "❌ Installation failed. Please install manually:"
    echo "   npm install swagger-ui-express swagger-jsdoc --save"
fi

