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

# Wait for backend to be ready (health-check loop instead of blind sleep)
echo "⏳ Waiting for backend to be ready..."
for i in $(seq 1 60); do
    if curl -sf http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "✅ Backend is ready (after ${i}s)"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Backend did not start within 60 seconds. Check logs above."
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

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
