#!/bin/bash

# EstiMate API - Newman Test Runner Script
# This script runs the complete Newman test suite for the EstiMate backend

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   EstiMate API - Newman Test Suite Runner              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if backend is running
echo -e "${YELLOW}[1/5]${NC} Checking if backend server is running..."
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend server is running on port 8080"
else
    echo -e "${RED}✗${NC} Backend server is not running!"
    echo -e "${YELLOW}Please start the backend server first:${NC}"
    echo -e "  cd ../backend"
    echo -e "  export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64"
    echo -e "  mvn spring-boot:run"
    exit 1
fi

# Check if newman is installed
echo -e "${YELLOW}[2/5]${NC} Checking if Newman is installed..."
if ! command -v newman &> /dev/null; then
    echo -e "${RED}✗${NC} Newman is not installed!"
    echo -e "${YELLOW}Installing Newman globally...${NC}"
    npm install -g newman newman-reporter-html
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Newman installed successfully"
    else
        echo -e "${RED}✗${NC} Failed to install Newman"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Newman is installed"
fi

# Create reports directory if it doesn't exist
echo -e "${YELLOW}[3/5]${NC} Creating reports directory..."
mkdir -p reports
echo -e "${GREEN}✓${NC} Reports directory ready"

# Run the tests
echo -e "${YELLOW}[4/5]${NC} Running Newman test suite..."
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

newman run planning-poker-api.postman_collection.json \
    -e environment.json \
    --reporters cli,html,json \
    --reporter-html-export ./reports/test-report.html \
    --reporter-json-export ./reports/test-report.json \
    --color on

TEST_EXIT_CODE=$?

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Check test results
echo -e "${YELLOW}[5/5]${NC} Test execution completed"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✓ ALL TESTS PASSED! 🎉                    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "📊 Test Reports:"
    echo -e "   HTML: ${BLUE}$(pwd)/reports/test-report.html${NC}"
    echo -e "   JSON: ${BLUE}$(pwd)/reports/test-report.json${NC}"
    echo ""
    echo -e "Open HTML report in browser:"
    echo -e "   ${YELLOW}xdg-open reports/test-report.html${NC}"
    echo ""
    echo -e "✅ ${GREEN}Backend is fully validated and ready for UI development!${NC}"
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ✗ SOME TESTS FAILED                       ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "📊 Check detailed reports:"
    echo -e "   HTML: ${BLUE}$(pwd)/reports/test-report.html${NC}"
    echo -e "   JSON: ${BLUE}$(pwd)/reports/test-report.json${NC}"
    echo ""
    echo -e "🔍 Troubleshooting:"
    echo -e "   1. Check backend logs for errors"
    echo -e "   2. Review failed test details in HTML report"
    echo -e "   3. Verify H2 database state: ${BLUE}http://localhost:8080/h2-console${NC}"
    echo -e "   4. Check Swagger UI: ${BLUE}http://localhost:8080/swagger-ui.html${NC}"
fi

echo ""
exit $TEST_EXIT_CODE
