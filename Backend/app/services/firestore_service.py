from google.cloud.firestore_v1 import SERVER_TIMESTAMP, Increment
from app.firebase_init import get_db
from cryptography.fernet import Fernet
import os

encryption_key = os.getenv('ENCRYPTION_KEY')
if not encryption_key:
    encryption_key = Fernet.generate_key().decode()
cipher = Fernet(encryption_key.encode())

# ── Users ────────────────────────────────────────────────
def save_user_profile(uid: str, data: dict):
    get_db().collection('users').document(uid).set({
        **data,
        'created_at': SERVER_TIMESTAMP,
        'updated_at': SERVER_TIMESTAMP
    })

def get_user_profile(uid: str) -> dict:
    doc = get_db().collection('users').document(uid).get()
    return doc.to_dict() if doc.exists else None

def save_delta_keys(uid: str, api_key: str, api_secret: str):
    enc_secret = cipher.encrypt(api_secret.encode()).decode()
    get_db().collection('users').document(uid).update({
        'delta_api_key': api_key,
        'delta_api_secret_enc': enc_secret,
        'delta_connected': True,
        'updated_at': SERVER_TIMESTAMP
    })

def get_delta_keys(uid: str) -> tuple:
    doc = get_db().collection('users').document(uid).get()
    data = doc.to_dict()
    if not data or 'delta_api_key' not in data:
        raise ValueError("Delta API keys not configured")
    key = data['delta_api_key']
    sec = cipher.decrypt(data['delta_api_secret_enc'].encode()).decode()
    return key, sec

# ── Trades ───────────────────────────────────────────────
def save_trade(uid: str, trade: dict) -> str:
    ref = get_db().collection('trades').add({
        **trade,
        'userId': uid,
        'status': 'open',
        'opened_at': SERVER_TIMESTAMP
    })
    return ref[1].id

def close_trade(trade_id: str, exit_price: float, pnl_usdt: float, pnl_pct: float):
    get_db().collection('trades').document(trade_id).update({
        'exit_price': exit_price,
        'pnl_usdt': pnl_usdt,
        'pnl_percent': pnl_pct,
        'status': 'closed',
        'closed_at': SERVER_TIMESTAMP
    })

def get_trades(uid: str, limit=50) -> list:
    """
    Get trades for a user. 
    Note: We fetch all and sort in Python to avoid Firestore composite index requirement.
    For production with many trades, create the composite index instead.
    """
    try:
        # Fetch without ordering (no index required)
        docs = (get_db().collection('trades')
                .where('userId', '==', uid)
                .limit(1000)  # Get more to allow sorting
                .stream())
        
        # Convert to list and sort in Python
        trades = [{'id': d.id, **d.to_dict()} for d in docs]
        
        # Sort by opened_at in descending order
        trades.sort(key=lambda x: x.get('opened_at', 0), reverse=True)
        
        # Apply limit
        return trades[:limit]
    except Exception as e:
        print(f"Error fetching trades: {e}")
        return []

# ── Algo Runs ────────────────────────────────────────────
def create_algo_run(uid: str, data: dict) -> str:
    ref = get_db().collection('algo_runs').add({
        **data, 'userId': uid,
        'status': 'running', 'started_at': SERVER_TIMESTAMP
    })
    return ref[1].id

def update_algo_run(run_id: str, updates: dict):
    get_db().collection('algo_runs').document(run_id).update(updates)

def stop_algo_run(run_id: str):
    get_db().collection('algo_runs').document(run_id).update({
        'status': 'stopped', 'stopped_at': SERVER_TIMESTAMP
    })

def get_active_algo_runs(uid: str) -> list:
    docs = (get_db().collection('algo_runs')
            .where('userId', '==', uid)
            .where('status', '==', 'running').stream())
    return [{'id': d.id, **d.to_dict()} for d in docs]

def get_algo_run(run_id: str) -> dict:
    doc = get_db().collection('algo_runs').document(run_id).get()
    return {'id': doc.id, **doc.to_dict()} if doc.exists else None

# ── AI Sessions ──────────────────────────────────────────
def create_ai_session(uid: str, data: dict) -> str:
    ref = get_db().collection('ai_sessions').add({
        **data, 'userId': uid, 'trades_today': 0,
        'status': 'active', 'started_at': SERVER_TIMESTAMP
    })
    return ref[1].id

def update_ai_session(session_id: str, updates: dict):
    get_db().collection('ai_sessions').document(session_id).update(updates)

def stop_ai_session(session_id: str):
    get_db().collection('ai_sessions').document(session_id).update({
        'status': 'stopped', 'stopped_at': SERVER_TIMESTAMP
    })

def get_ai_session(session_id: str) -> dict:
    doc = get_db().collection('ai_sessions').document(session_id).get()
    return {'id': doc.id, **doc.to_dict()} if doc.exists else None
