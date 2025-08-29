# Multi-stage Dockerfile for Full Stack Application

# Stage 1: Build the React frontend
FROM node:18-alpine as frontend-build
WORKDIR /app

# Copy frontend package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY index.html ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY src/ ./src/
COPY public/ ./public/

# Build the frontend
RUN npm run build

# Stage 2: Setup the backend with built frontend
FROM node:18-alpine as production

# Set working directory
WORKDIR /app

# Copy backend package files
COPY server/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY server/ ./

# Copy built frontend from stage 1
COPY --from=frontend-build /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
