from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.services.firestore_service import save_delta_keys, get_delta_keys
from app.services.delta_client import DeltaClient
from pydantic import BaseModel
import httpx

router = APIRouter()

class ConnectRequest(BaseModel):
    api_key: str
    api_secret: str

@router.post('/connect')
def connect_delta(req: ConnectRequest, user=Depends(get_current_user)):
    """Save encrypted Delta API keys to Firestore"""
    uid = user['uid']
    
    # Test the keys first
    try:
        client = DeltaClient(req.api_key, req.api_secret)
        
        # Add detailed logging for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Testing Delta connection for user {uid}")
        logger.info(f"Using base URL: {client.base_url}")
        
        wallet = client.get('/v2/wallet/balances')
        
        if not wallet.get('success'):
            raise HTTPException(400, 'Invalid Delta API credentials')
        
        # Save keys
        save_delta_keys(uid, req.api_key, req.api_secret)
        
        return {
            'message': 'Delta Exchange connected successfully',
            'wallet': wallet.get('result', [])
        }
    except httpx.HTTPStatusError as e:
        # More detailed error for HTTP errors
        error_detail = f'Delta API error: {e.response.status_code} - {e.response.text}'
        raise HTTPException(400, error_detail)
    except Exception as e:
        raise HTTPException(400, f'Failed to connect Delta Exchange: {str(e)}')

@router.get('/test')
def test_delta(user=Depends(get_current_user)):
    """Test Delta connection - fetch wallet balance"""
    uid = user['uid']
    
    try:
        api_key, api_secret = get_delta_keys(uid)
        client = DeltaClient(api_key, api_secret)
        
        wallet = client.get('/v2/wallet/balances')
        
        return {
            'success': True,
            'wallet': wallet.get('result', [])
        }
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f'Delta API error: {str(e)}')

@router.get('/products')
def get_products(user=Depends(get_current_user)):
    """Get available trading products from Delta"""
    uid = user['uid']
    
    try:
        api_key, api_secret = get_delta_keys(uid)
        client = DeltaClient(api_key, api_secret)
        
        products = client.get('/v2/products')
        
        return products.get('result', [])
    except Exception as e:
        raise HTTPException(500, f'Failed to fetch products: {str(e)}')
