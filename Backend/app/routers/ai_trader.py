from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.services.firestore_service import (
    create_ai_session, stop_ai_session, get_ai_session, update_ai_session
)
from app.services.ai_engine import train_model
from pydantic import BaseModel
import os

router = APIRouter()

class StartAIRequest(BaseModel):
    symbol: str
    product_id: int
    order_size: int
    confidence_threshold: float = 0.68
    max_daily_trades: int = 10

class TrainRequest(BaseModel):
    symbol: str

@router.post('/start')
def start_ai_trader(req: StartAIRequest, user=Depends(get_current_user)):
    """Start AI trader - train model if needed, start Celery task"""
    uid = user['uid']
    
    # Check if model exists, train if not
    model_path = f'models/{req.symbol}_xgb.pkl'
    model_accuracy = None
    
    if not os.path.exists(model_path):
        try:
            result = train_model(req.symbol)
            model_accuracy = result['accuracy']
        except Exception as e:
            raise HTTPException(500, f'Model training failed: {str(e)}')
    
    # Create AI session
    session_id = create_ai_session(uid, {
        'symbol': req.symbol,
        'product_id': req.product_id,
        'order_size': req.order_size,
        'confidence_threshold': req.confidence_threshold,
        'max_daily_trades': req.max_daily_trades,
        'model_version': f'xgb_{req.symbol}_v1',
        'last_signal': 'hold',
        'last_confidence': 0,
        'celery_task_id': 'pending'
    })
    
    # TODO: Dispatch Celery task
    
    return {
        'session_id': session_id,
        'status': 'active',
        'model_accuracy': f'{model_accuracy:.1%}' if model_accuracy else 'existing',
        'message': f'AI Trader started for {req.symbol}'
    }

@router.post('/stop')
def stop_ai(session_id: str, user=Depends(get_current_user)):
    """Stop AI trader"""
    uid = user['uid']
    
    # Verify ownership
    session = get_ai_session(session_id)
    if not session or session.get('userId') != uid:
        raise HTTPException(404, 'AI session not found')
    
    # Stop session
    stop_ai_session(session_id)
    
    # TODO: Revoke Celery task and cancel orders
    
    return {'status': 'stopped', 'session_id': session_id}

@router.get('/status/{session_id}')
def get_status(session_id: str, user=Depends(get_current_user)):
    """Get live AI session status"""
    uid = user['uid']
    
    session = get_ai_session(session_id)
    if not session or session.get('userId') != uid:
        raise HTTPException(404, 'AI session not found')
    
    return session

@router.post('/train')
def train_ai_model(req: TrainRequest, user=Depends(get_current_user)):
    """Manually trigger model retrain"""
    try:
        result = train_model(req.symbol)
        return {
            'symbol': req.symbol,
            'accuracy': f'{result["accuracy"]:.1%}',
            'rows_trained': result['rows_trained'],
            'model_path': result['model_path'],
            'message': 'Model trained successfully'
        }
    except Exception as e:
        raise HTTPException(500, f'Training failed: {str(e)}')
