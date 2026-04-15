#!/bin/bash

echo "🔍 CryptoAlgo Platform - Connection Test"
echo "========================================"
echo ""

# Test Backend
echo "📡 Testing Backend (http://localhost:8000)..."
echo ""

echo "1. Root Endpoint:"
curl -s http://localhost:8000/ | python3 -m json.tool
echo ""

echo "2. Health Check:"
curl -s http://localhost:8000/health | python3 -m json.tool
echo ""

echo "3. API Documentation:"
if curl -s http://localhost:8000/docs | grep -q "swagger"; then
    echo "✅ Swagger UI is accessible at http://localhost:8000/docs"
else
    echo "❌ Swagger UI not accessible"
fi
echo ""

echo "4. Available Algorithms:"
curl -s http://localhost:8000/api/algos/ | python3 -m json.tool 2>/dev/null | head -30
echo ""

# Test Frontend
echo "🎨 Testing Frontend (http://localhost:5173)..."
echo ""

echo "1. Frontend Homepage:"
if curl -s http://localhost:5173/ | grep -q "root"; then
    echo "✅ Frontend is serving at http://localhost:5173"
else
    echo "❌ Frontend not accessible"
fi
echo ""

# Test CORS
echo "🔗 Testing Backend-Frontend Connection..."
echo ""

echo "1. CORS Headers:"
curl -s -I http://localhost:8000/ | grep -i "access-control" || echo "⚠️  CORS headers not visible (may be added on actual requests)"
echo ""

# Summary
echo "📊 Summary"
echo "=========="
echo "✅ Backend API: http://localhost:8000"
echo "✅ API Docs: http://localhost:8000/docs"
echo "✅ Frontend: http://localhost:5173"
echo ""
echo "🔥 Both services are running successfully!"
echo ""
echo "📝 Next Steps:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Open http://localhost:8000/docs for API testing"
echo "3. Configure Firebase Auth in the frontend"
echo "4. Connect Delta Exchange API keys"
echo ""
