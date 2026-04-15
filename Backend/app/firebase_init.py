import firebase_admin
from firebase_admin import credentials, firestore, auth

_app = None
_db = None

def init_firebase():
    global _app, _db
    if not _app:
        cred = credentials.Certificate('serviceAccountKey.json')
        _app = firebase_admin.initialize_app(cred)
        _db = firestore.client()
    return _db

def get_db():
    if _db is None:
        init_firebase()
    return _db

def verify_token(id_token: str) -> dict:
    """Verify Firebase ID token from frontend. Returns decoded claims."""
    try:
        return auth.verify_id_token(id_token)
    except Exception as e:
        raise ValueError(f"Invalid token: {str(e)}")
