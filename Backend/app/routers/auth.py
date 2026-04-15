from fastapi import APIRouter, Depends, HTTPException, Header
from app.firebase_init import verify_token
from app.services.firestore_service import save_user_profile, get_user_profile
from pydantic import BaseModel

router = APIRouter()

def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Extracts and verifies Firebase ID token from Authorization header.
    Frontend must send: Authorization: Bearer <firebase_id_token>
    """
    if not authorization.startswith('Bearer '):
        raise HTTPException(401, 'Invalid auth header')
    
    token = authorization.split(' ')[1]
    
    try:
        decoded = verify_token(token)
        return decoded  # contains: uid, email, etc.
    except Exception as e:
        raise HTTPException(401, f'Invalid or expired token: {str(e)}')

class VerifyRequest(BaseModel):
    email: str
    full_name: str = ""

@router.post('/verify')
def verify_user(req: VerifyRequest, user=Depends(get_current_user)):
    """Verify Firebase token and create/update user profile"""
    uid = user['uid']
    
    # Check if user exists
    profile = get_user_profile(uid)
    
    if not profile:
        # Create new user profile
        save_user_profile(uid, {
            'uid': uid,
            'email': req.email,
            'full_name': req.full_name,
            'delta_connected': False
        })
        return {'message': 'User profile created', 'uid': uid}
    
    return {'message': 'User verified', 'uid': uid, 'profile': profile}

@router.get('/profile')
def get_profile(user=Depends(get_current_user)):
    """Get current user profile"""
    uid = user['uid']
    profile = get_user_profile(uid)
    
    if not profile:
        raise HTTPException(404, 'User profile not found')
    
    return profile
