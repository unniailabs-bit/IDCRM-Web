# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using npm install to handle package.json updates
RUN npm install --only=production || npm install

# Copy application code
COPY . .

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy application files and node_modules from the builder stage.
# This eliminates npm cache and any temporary build files, significantly reducing image size.
COPY --from=builder /app .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
