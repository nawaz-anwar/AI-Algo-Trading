#!/bin/bash

echo "🔄 Switching to Delta Exchange Testnet"
echo "======================================"

# Update backend .env
echo "Updating .env..."
sed -i '' 's|https://api.india.delta.exchange|https://cdn-ind.testnet.deltaex.org|g' .env

# Update frontend .env
echo "Updating Frontend/.env..."
sed -i '' 's|wss://socket.india.delta.exchange|wss://cdn-ind.testnet.deltaex.org/live|g' Frontend/.env

echo ""
echo "✅ Configuration updated to testnet URLs:"
echo "   Backend: https://cdn-ind.testnet.deltaex.org"
echo "   WebSocket: wss://cdn-ind.testnet.deltaex.org/live"
echo ""
echo "⚠️  IMPORTANT: You need to use TESTNET API keys!"
echo "   Get them from: https://testnet.delta.exchange"
echo ""
echo "Services will auto-reload with new configuration."
