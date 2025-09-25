#!/bin/bash

echo "🎯 Starting Planning Poker Application..."
echo "======================================"

# Function to cleanup background processes
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

# Start backend
echo "🚀 Starting backend (Spring Boot)..."
cd backend
mvn spring-boot:run &
BACKEND_PID=$!

# Wait for backend to start
sleep 10

# Start frontend
echo "⚡ Starting frontend (React + Vite)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Application started!"
echo "Backend API: http://localhost:8080"
echo "Swagger UI: http://localhost:8080/swagger-ui.html"
echo "Frontend: http://localhost:5173"
echo "H2 Console: http://localhost:8080/h2-console"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
