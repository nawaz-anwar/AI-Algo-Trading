#!/bin/bash

echo "🚀 CryptoAlgo Platform - Quick Start"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating from template..."
    cp .env.example .env
    echo "✅ Created .env - Please edit it with your credentials"
    echo ""
fi

# Check if Frontend/.env exists
if [ ! -f Frontend/.env ]; then
    echo "⚠️  Frontend/.env file not found!"
    echo "📝 Creating from template..."
    cp Frontend/.env.example Frontend/.env
    echo "✅ Created Frontend/.env - Please edit it with your Firebase config"
    echo ""
fi

# Check if serviceAccountKey.json exists
if [ ! -f Backend/serviceAccountKey.json ]; then
    echo "⚠️  Backend/serviceAccountKey.json not found!"
    echo "📝 Please download from Firebase Console and save as Backend/serviceAccountKey.json"
    echo "   See SETUP.md for detailed instructions"
    echo ""
    read -p "Press Enter when ready to continue..."
fi

echo "🔧 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found! Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found! Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

echo "🏗️  Building and starting services..."
echo "This may take a few minutes on first run..."
echo ""

docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "✅ Services started!"
echo ""
echo "📍 Access points:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📋 View logs:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
echo "📖 Next steps:"
echo "   1. Open http://localhost:5173"
echo "   2. Create an account"
echo "   3. Connect your Delta Exchange testnet keys"
echo "   4. Start trading!"
echo ""
echo "📚 For detailed setup instructions, see SETUP.md"
echo ""
