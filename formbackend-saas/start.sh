#!/bin/bash

echo "======================================"
echo "FormBackend SaaS - Starting Application"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "❌ backend/.env not found!"
    echo "Run './setup.sh' first and configure your .env file"
    exit 1
fi

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT TERM

# Start backend
echo "🚀 Starting backend server..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🚀 Starting frontend development server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "======================================"
echo "✅ Application is running!"
echo "======================================"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Wait for background processes
wait
