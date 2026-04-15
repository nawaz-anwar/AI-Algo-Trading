import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Delta Exchange
    DELTA_BASE_URL = os.getenv('DELTA_BASE_URL', 'https://cdn-ind.testnet.deltaex.org')
    
    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')
    
    # Encryption
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', '')
    
    # Firebase (backend uses service account)
    FIREBASE_SERVICE_ACCOUNT = 'serviceAccountKey.json'
    
    # API Settings
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://yourdomain.com'
    ]

config = Config()
