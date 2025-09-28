#!/bin/bash

# Nationwide Toll Hub - Launch Script
# This script starts all the necessary services for local development

echo "🚀 Nationwide Toll Hub - Launch Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "Waiting for $service_name to start"
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "\n${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "\n${RED}❌ $service_name failed to start${NC}"
    return 1
}

# Kill existing processes on ports 3000 and 3001
echo "🧹 Cleaning up existing processes..."
if check_port 3000; then
    echo "Killing process on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

if check_port 3001; then
    echo "Killing process on port 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

sleep 2

# Start API Server
echo ""
echo "🔧 Starting API Server on port 3001..."
cd "$(dirname "$0")"
node server.js &
API_PID=$!

# Wait for API server to be ready
if wait_for_service "http://localhost:3001/api/health" "API Server"; then
    echo "📍 API Server: http://localhost:3001"
    echo "🔗 API Health: http://localhost:3001/api/health"
else
    echo "${RED}❌ Failed to start API Server${NC}"
    exit 1
fi

# Start Web Application
echo ""
echo "🌐 Starting Web Application on port 3000..."
cd "$(dirname "$0")/apps/web"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing web app dependencies..."
    npm install
fi

# Start Next.js development server
npm run dev &
WEB_PID=$!

# Wait for web app to be ready
if wait_for_service "http://localhost:3000" "Web Application"; then
    echo "📍 Web App: http://localhost:3000"
else
    echo "${RED}❌ Failed to start Web Application${NC}"
    echo "Check the terminal output for errors"
fi

# Display final status
echo ""
echo "🎉 Nationwide Toll Hub is now running!"
echo "======================================"
echo ""
echo "${GREEN}✅ API Server:${NC} http://localhost:3001"
echo "${GREEN}✅ Web App:${NC} http://localhost:3000"
echo "${GREEN}✅ Demo Dashboard:${NC} http://localhost:3001"
echo ""
echo "🔐 Demo Credentials:"
echo "   Email: demo@example.com"
echo "   Password: demo123"
echo ""
echo "📋 Available Features:"
echo "   • Toll event management"
echo "   • Statement viewing"
echo "   • Payment processing"
echo "   • Dashboard analytics"
echo "   • User authentication"
echo ""
echo "🛑 To stop all services, press Ctrl+C"
echo ""

# Keep script running and handle cleanup
trap 'echo ""; echo "🛑 Stopping services..."; kill $API_PID $WEB_PID 2>/dev/null; echo "✅ Services stopped"; exit 0' INT

# Wait for user to stop
wait
