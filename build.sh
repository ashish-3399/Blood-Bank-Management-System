#!/bin/bash

echo "🏗️ Building Blood Bank Management System for Railway..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Build frontend
echo "🎨 Building frontend..."
npm run build:client

# Install server dependencies
echo "🖥️ Installing server dependencies..."
cd server
npm install --only=production

echo "✅ Build completed successfully!"
