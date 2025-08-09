#!/bin/bash

# Build script for Vercel deployment
echo "Building UTHINK platform for Vercel..."

# Install and build client
echo "Building client..."
cd client
npm install
npm run build
cd ..

# Build server
echo "Building server..."
cd server  
npm install
npx tsc
cd ..

echo "Build complete!"