# CryptoAlgo Platform - AI-Powered Algorithmic Trading

A production-ready cryptocurrency algorithmic trading platform with AI-powered trading engine, built with Firebase, Delta Exchange India API, FastAPI, and React.

![Platform Version](https://img.shields.io/badge/version-2.0-blue)
![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 Features

### ✅ Implemented & Working

- **Firebase Authentication** - Secure email/password authentication
- **Delta Exchange Integration** - Connect production/testnet API keys
- **Real-time Dashboard** - Live wallet balances and portfolio tracking
- **Encrypted Key Storage** - AES-256 encryption for API secrets
- **User Management** - Profile creation and management in Firestore
- **Responsive UI** - Modern dark theme with Tailwind CSS + shadcn/ui
- **Auto-refresh** - Dashboard updates every 30 seconds

### 🔄 In Development

- **Algorithm Trading** - EMA Crossover, RSI, MACD strategies
- **AI Trading Engine** - XGBoost ML model with 14 technical indicators
- **WebSocket Feeds** - Real-time price updates
- **Order Execution** - Market and bracket orders with stop-loss/take-profit
- **Trade History** - Complete P&L tracking and analytics

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Firebase Admin SDK** - Authentication and Firestore database
- **Delta Exchange API** - Crypto derivatives trading
- **XGBoost** - Machine learning for AI trading
- **Celery + Redis** - Background task processing (planned)
- **httpx** - Async HTTP client

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Navigation
- **Firebase JS SDK** - Client-side authentication

### Infrastructure
- **Firestore** - NoSQL database
- **Firebase Auth** - User authentication
- **Docker** - Containerization (configured)
- **Nginx** - Reverse proxy (configured)

---

## 📁 Project Structure

```
cryptoalgo/
├── Backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application
│   │   ├── config.py               # Configuration
│   │   ├── firebase_init.py        # Firebase initialization
│   │   ├── routers/
│   │   │   ├── auth.py            # Authentication endpoints
│   │   │   ├── delta.py           # Delta Exchange endpoints
│   │   │   ├── dashboard.py       # Dashboard data endpoint
│   │   │   ├── algos.py           # Algorithm trading
│   │   │   ├── ai_trader.py       # AI trading engine
│   │   │   └── trades.py          # Trade history
│   │   └── services/
│   │       ├── firestore_service.py  # Database operations
│   │       ├── delta_client.py       # Delta API client
│   │       ├── ai_engine.py          # ML trading engine
│   │       └── algo_engine.py        # Trading strategies
│   ├── requirements.txt
│   ├── serviceAccountKey.json     # Firebase credentials
│   └── Dockerfile
├── Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── ConnectDelta.tsx
│   │   │   │   ├── Algorithms.tsx
│   │   │   │   ├── AITrader.tsx
│   │   │   │   └── TradeHistory.tsx
│   │   │   └── components/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── usePriceFeed.ts
│   │   ├── api/index.ts
│   │   └── firebase.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** (tested on 3.14)
- **Node.js 18+** and npm
- **Firebase Project** with Firestore and Authentication enabled
- **Delta Exchange Account** (testnet or production)

### 1. Clone Repository

```bash
git clone <repository-url>
cd cryptoalgo
```

### 2. Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Add Firebase service account key
# Download from Firebase Console → Project Settings → Service Accounts
# Save as Backend/serviceAccountKey.json
```

### 3. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install
```

### 4. Environment Configuration

**Root `.env`:**
```bash
# Delta Exchange
DELTA_BASE_URL=https://api.india.delta.exchange  # Production
# DELTA_BASE_URL=https://cdn-ind.testnet.deltaex.org  # Testnet

# Redis (for Celery)
REDIS_URL=redis://redis:6379/0

# Encryption key for API secrets
ENCRYPTION_KEY=<generate-with-fernet>
```

**Frontend `.env`:**
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Backend API
VITE_API_URL=http://localhost:8000
VITE_WS_URL=wss://socket.india.delta.exchange
```

### 5. Generate Encryption Key

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the output to `ENCRYPTION_KEY` in `.env`

### 6. Start Services

**Terminal 1 - Backend:**
```bash
cd Backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

### 7. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📖 Usage Guide

### 1. Create Account

1. Navigate to http://localhost:5173
2. Click "Sign Up"
3. Enter email and password
4. Account created in Firebase Authentication

### 2. Connect Delta Exchange

1. Get API keys from Delta Exchange:
   - **Testnet**: https://testnet.delta.exchange
   - **Production**: https://delta.exchange
2. Go to Settings → API Management
3. Create New API Key with **Read** and **Trade** permissions
4. **Important**: Whitelist your IP address or disable IP whitelist
5. In the app, navigate to "Connect Delta"
6. Follow the 3-step wizard
7. Enter API Key and Secret
8. Click "Connect & Verify"

### 3. View Dashboard

- Real-time wallet balance
- Asset holdings (BTC, ETH, USD, etc.)
- Active algorithms (when running)
- Open positions (when trading)
- Auto-refreshes every 30 seconds

### 4. Start Trading (Coming Soon)

- Navigate to "Algorithms" page
- Choose a strategy (EMA, RSI, MACD)
- Configure parameters
- Start algorithm
- Monitor in Dashboard

---

## 🔐 Security

### Implemented Security Features

- ✅ **Firebase JWT Authentication** - All API endpoints protected
- ✅ **AES-256 Encryption** - API secrets encrypted before storage
- ✅ **HMAC-SHA256 Signatures** - Delta API request signing
- ✅ **Environment Variables** - Sensitive data not in code
- ✅ **CORS Configuration** - Restricted origins
- ✅ **IP Whitelisting** - Delta API key protection

### Security Best Practices

1. **Never commit** `.env` or `serviceAccountKey.json` to git
2. **Use testnet** for development and testing
3. **Whitelist IPs** for Delta API keys in production
4. **Rotate keys** regularly
5. **Set Firestore security rules** in production
6. **Enable HTTPS** in production with SSL certificates

---

## 🧪 Testing

### Test Backend Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Test Delta connection (requires authentication)
curl -X GET http://localhost:8000/api/delta/test \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

# Get dashboard data
curl -X GET http://localhost:8000/api/dashboard/data \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Test Scripts

```bash
# Test Delta authentication
python test_delta_auth.py YOUR_API_KEY YOUR_API_SECRET

# Test all endpoints
./test_connection.sh

# Test Delta endpoints
./test_delta_endpoint.sh
```

### Switch Between Testnet and Production

```bash
# Switch to testnet (recommended for testing)
./switch_to_testnet.sh

# Switch to production (real money!)
./switch_to_production.sh
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Firebase token and create user
- `GET /api/auth/profile` - Get user profile

### Delta Exchange
- `POST /api/delta/connect` - Connect API keys
- `GET /api/delta/test` - Test connection
- `GET /api/delta/products` - Get trading products

### Dashboard
- `GET /api/dashboard/data` - Get wallet, positions, algos

### Algorithms (In Development)
- `GET /api/algos` - List strategies
- `POST /api/algos/start` - Start algorithm
- `POST /api/algos/stop` - Stop algorithm

### AI Trader (In Development)
- `POST /api/ai/start` - Start AI trader
- `POST /api/ai/stop` - Stop AI trader
- `POST /api/ai/train` - Train model

### Trades (In Development)
- `GET /api/trades/history` - Trade history
- `GET /api/trades/stats` - Statistics

---

## 🗄️ Database Schema

### Firestore Collections

**users**
```javascript
{
  uid: "firebase_user_uid",
  email: "user@example.com",
  full_name: "User Name",
  delta_api_key: "plain_text",
  delta_api_secret_enc: "AES256_encrypted",
  delta_connected: true,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**trades**
```javascript
{
  userId: "firebase_user_uid",
  symbol: "BTCUSD",
  product_id: 27,
  side: "buy" | "sell",
  size: 1,
  entry_price: 68000.0,
  exit_price: 69500.0,
  pnl_usdt: 21.50,
  pnl_percent: 2.17,
  algo_name: "EMA Crossover",
  status: "open" | "closed",
  opened_at: Timestamp,
  closed_at: Timestamp
}
```

**algo_runs**
```javascript
{
  userId: "firebase_user_uid",
  algo_name: "EMA Crossover",
  symbol: "BTCUSD",
  params: { fast_period: 9, slow_period: 21 },
  status: "running" | "stopped",
  started_at: Timestamp
}
```

**ai_sessions**
```javascript
{
  userId: "firebase_user_uid",
  symbol: "BTCUSD",
  confidence_threshold: 0.70,
  max_daily_trades: 10,
  trades_today: 3,
  status: "active" | "stopped",
  started_at: Timestamp
}
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Delta API error: 401 Unauthorized"**
- Check if using correct API keys (testnet vs production)
- Verify IP is whitelisted in Delta Exchange settings
- Ensure API key has Read + Trade permissions

**2. "Firebase initialization failed"**
- Verify `serviceAccountKey.json` exists in Backend folder
- Check Firebase project settings
- Ensure Firestore is enabled

**3. "CORS error"**
- Check `VITE_API_URL` in Frontend/.env
- Verify backend CORS settings in `config.py`
- Ensure backend is running on port 8000

**4. "Module not found" errors**
- Backend: `pip install -r requirements.txt`
- Frontend: `npm install`
- Check Python version (3.11+)

**5. Dashboard not loading**
- Check if Delta is connected (Connect Delta page)
- Verify backend is running
- Check browser console for errors
- Try refreshing the page

---

## 🚀 Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Checklist

- [ ] Switch to production Delta URL
- [ ] Set strong encryption key
- [ ] Configure Firestore security rules
- [ ] Enable HTTPS with SSL certificate
- [ ] Whitelist server IP on Delta API keys
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Test all features on testnet first
- [ ] Start with small trade sizes
- [ ] Set up deadman switch for safety

---

## 📈 Roadmap

### Phase 1: Core Platform ✅ (Complete)
- [x] Firebase Authentication
- [x] Delta Exchange Integration
- [x] Dashboard with real data
- [x] Encrypted key storage
- [x] User management

### Phase 2: Trading Features 🔄 (In Progress)
- [ ] Order execution (market, limit, bracket)
- [ ] Algorithm trading (EMA, RSI, MACD)
- [ ] Position management
- [ ] Trade history and P&L tracking

### Phase 3: AI Trading Engine 📋 (Planned)
- [ ] XGBoost model training
- [ ] 14 technical indicators
- [ ] Live signal generation
- [ ] Risk management
- [ ] Auto-retraining

### Phase 4: Advanced Features 📋 (Planned)
- [ ] WebSocket live price feeds
- [ ] Real-time portfolio tracking
- [ ] Performance analytics
- [ ] Backtesting engine
- [ ] Strategy optimization
- [ ] Mobile app

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## ⚠️ Disclaimer

**This software is for educational purposes only.**

- Cryptocurrency trading involves substantial risk of loss
- Past performance does not guarantee future results
- The developers are not responsible for any financial losses
- Always test on testnet before using real money
- Start with small amounts and strict risk management
- Never invest more than you can afford to lose

---

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review API documentation at http://localhost:8000/docs
- Check Firebase Console for authentication issues
- Verify Delta Exchange API status

---

## 🎯 Current Status

**Version**: 2.0  
**Status**: Active Development  
**Last Updated**: April 15, 2026

### What's Working
✅ Authentication and user management  
✅ Delta Exchange connection  
✅ Real-time dashboard  
✅ Wallet balance tracking  
✅ Encrypted key storage  

### In Development
🔄 Algorithm trading execution  
🔄 AI trading engine  
🔄 WebSocket price feeds  
🔄 Trade history and analytics  

---

**Built with ❤️ for algorithmic traders**
