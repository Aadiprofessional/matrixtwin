#!/bin/bash

# Exit on any error
set -e

echo "📦 Building the React application..."
npm run build

echo "🧹 Cleaning up previous deployment folders..."
rm -rf deployment
mkdir -p deployment

echo "📋 Copying necessary files to deployment folder..."
cp -r build deployment/
cp server.js deployment/
cp package.json deployment/
cp package-lock.json deployment/

echo "📝 Creating .env file with production settings..."
echo "# Production environment settings" > deployment/.env
echo "PORT=8080" >> deployment/.env

echo "📦 Installing production dependencies..."
cd deployment
npm install --production

echo "✅ Deployment package prepared!"
echo ""
echo "To run the server, use: cd deployment && npm run start-prod"
echo "OR: node deployment/server.js"
echo ""
echo "The server will run on port 8080 by default." 