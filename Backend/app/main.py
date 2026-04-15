from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.firebase_init import init_firebase
from app.routers import auth, delta, algos, ai_trader, trades, dashboard
from app.config import config

app = FastAPI(
    title='CryptoAlgo API',
    version='2.0',
    description='Crypto Algorithmic Trading Platform with AI'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

@app.on_event('startup')
async def startup():
    try:
        init_firebase()
        print("✓ Firebase initialized")
    except Exception as e:
        print(f"⚠ Firebase initialization failed: {e}")

@app.get('/')
def root():
    return {
        'name': 'CryptoAlgo API',
        'version': '2.0',
        'status': 'running'
    }

@app.get('/health')
def health():
    return {'status': 'healthy'}

# Include routers
app.include_router(auth.router, prefix='/api/auth', tags=['Authentication'])
app.include_router(delta.router, prefix='/api/delta', tags=['Delta Exchange'])
app.include_router(dashboard.router, prefix='/api/dashboard', tags=['Dashboard'])
app.include_router(algos.router, prefix='/api/algos', tags=['Algorithms'])
app.include_router(ai_trader.router, prefix='/api/ai', tags=['AI Trader'])
app.include_router(trades.router, prefix='/api/trades', tags=['Trades'])
