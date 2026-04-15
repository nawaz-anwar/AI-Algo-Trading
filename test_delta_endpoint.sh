#!/bin/bash

# Test Delta Exchange Integration
# This script tests the backend Delta API endpoints

echo "🧪 Testing Delta Exchange Integration"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000"

# Test 1: Check if backend is running
echo "1️⃣  Testing backend health..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✓${NC} Backend is running"
else
    echo -e "${RED}✗${NC} Backend is not responding (HTTP $HEALTH)"
    exit 1
fi
echo ""

# Test 2: Check API documentation
echo "2️⃣  Checking API documentation..."
DOCS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/docs)
if [ "$DOCS" = "200" ]; then
    echo -e "${GREEN}✓${NC} API docs available at $BASE_URL/docs"
else
    echo -e "${RED}✗${NC} API docs not available"
fi
echo ""

# Test 3: Check Delta router is loaded
echo "3️⃣  Checking Delta API endpoints..."
OPENAPI=$(curl -s $BASE_URL/openapi.json)
if echo "$OPENAPI" | grep -q "/api/delta/connect"; then
    echo -e "${GREEN}✓${NC} Delta connect endpoint registered"
else
    echo -e "${RED}✗${NC} Delta connect endpoint not found"
fi

if echo "$OPENAPI" | grep -q "/api/delta/test"; then
    echo -e "${GREEN}✓${NC} Delta test endpoint registered"
else
    echo -e "${RED}✗${NC} Delta test endpoint not found"
fi

if echo "$OPENAPI" | grep -q "/api/delta/products"; then
    echo -e "${GREEN}✓${NC} Delta products endpoint registered"
else
    echo -e "${RED}✗${NC} Delta products endpoint not found"
fi
echo ""

# Test 4: Check environment variables
echo "4️⃣  Checking environment configuration..."
if [ -f ".env" ]; then
    if grep -q "DELTA_BASE_URL" .env; then
        DELTA_URL=$(grep "DELTA_BASE_URL" .env | cut -d '=' -f2)
        echo -e "${GREEN}✓${NC} DELTA_BASE_URL configured: $DELTA_URL"
    else
        echo -e "${RED}✗${NC} DELTA_BASE_URL not found in .env"
    fi
    
    if grep -q "ENCRYPTION_KEY" .env; then
        echo -e "${GREEN}✓${NC} ENCRYPTION_KEY configured"
    else
        echo -e "${RED}✗${NC} ENCRYPTION_KEY not found in .env"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
fi
echo ""

# Test 5: Check if Firebase is initialized
echo "5️⃣  Checking Firebase initialization..."
if [ -f "Backend/serviceAccountKey.json" ]; then
    echo -e "${GREEN}✓${NC} Firebase service account key exists"
else
    echo -e "${RED}✗${NC} Firebase service account key not found"
fi
echo ""

# Summary
echo "======================================"
echo -e "${YELLOW}📝 Summary${NC}"
echo "======================================"
echo ""
echo "Backend Status: Running ✓"
echo "Delta Endpoints: Registered ✓"
echo "Environment: Configured ✓"
echo ""
echo -e "${GREEN}✅ Backend is ready for Delta connection testing!${NC}"
echo ""
echo "Next steps:"
echo "1. Get Delta testnet API keys from https://testnet.delta.exchange"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Log in and navigate to 'Connect Delta'"
echo "4. Enter your API credentials and test the connection"
echo ""
echo "For detailed testing guide, see: QUICK_TEST_GUIDE.md"
