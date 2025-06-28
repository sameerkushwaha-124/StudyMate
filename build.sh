#!/bin/bash

# Build script for deployment
echo "Starting build process..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install

# Build the React app
echo "Building React app..."
npm run build

echo "Build completed successfully!"
