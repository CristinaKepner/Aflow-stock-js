#!/bin/bash

echo "🚀 Deploying AFlow Stock Analysis System..."

echo "📦 Installing dependencies..."
npm install

echo "🔧 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "🏗️ Building frontend..."
cd frontend && npm run build && cd ..

echo "📁 Creating storage directory..."
mkdir -p storage/cache

echo "✅ Deployment completed!"
echo ""
echo "🎯 To start the system:"
echo "   npm run full"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo ""
echo "📝 Don't forget to configure your .env file!"
