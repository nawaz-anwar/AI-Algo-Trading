#!/bin/bash

echo "🚀 Switching to Delta Exchange Production"
echo "=========================================="

# Update backend .env
echo "Updating .env..."
sed -i '' 's|https://cdn-ind.testnet.deltaex.org|https://api.india.delta.exchange|g' .env

# Update frontend .env
echo "Updating Frontend/.env..."
sed -i '' 's|wss://cdn-ind.testnet.deltaex.org/live|wss://socket.india.delta.exchange|g' Frontend/.env

echo ""
echo "✅ Configuration updated to production URLs:"
echo "   Backend: https://api.india.delta.exchange"
echo "   WebSocket: wss://socket.india.delta.exchange"
echo ""
echo "⚠️  IMPORTANT: You need to use PRODUCTION API keys!"
echo "   Get them from: https://delta.exchange"
echo ""
echo "⚠️  WARNING: This will use REAL MONEY!"
echo "   Make sure you've tested everything on testnet first."
echo ""
echo "Services will auto-reload with new configuration."
