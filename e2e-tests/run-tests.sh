#!/bin/bash

# Planning Poker E2E Test Runner
# This script runs the Playwright end-to-end tests

set -e

echo "==============================================="
echo "Planning Poker - E2E Tests (Playwright)"
echo "==============================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "🎭 Installing Playwright browsers..."
    npx playwright install
    echo ""
fi

# Check if frontend is running
echo "🔍 Checking if frontend is running on http://localhost:5173..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Warning: Frontend doesn't appear to be running on http://localhost:5173"
    echo "   Please start the frontend with: cd ../frontend && npm run dev"
    echo ""
fi

# Check if backend is running
echo "🔍 Checking if backend is running on http://localhost:8080..."
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️  Warning: Backend doesn't appear to be running on http://localhost:8080"
    echo "   Please start the backend"
    echo ""
fi

echo ""
echo "🧪 Running Playwright tests..."
echo ""

# Run tests with proper reporter
npm test -- "$@"

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
    echo ""
    echo "📊 To view the detailed HTML report, run:"
    echo "   npm run test:report"
else
    echo ""
    echo "❌ Some tests failed!"
    echo ""
    echo "📊 To view the detailed HTML report, run:"
    echo "   npm run test:report"
    exit 1
fi
