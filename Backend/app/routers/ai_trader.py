from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.services.firestore_service import (
    create_ai_session, stop_ai_session, get_ai_session, update_ai_session,
    get_active_ai_sessions, get_ai_signals
)
from app.services.ai_engine import train_model
from app.tasks.celery_app import celery_app
from app.tasks.ai_tasks import run_ai_task
from pydantic import BaseModel, Field
from typing import Literal
import os

router = APIRouter()

class StartAIRequest(BaseModel):
    symbol: str
    product_id: int
    order_size: int
    confidence_threshold: float = Field(default=0.68, ge=0.5, le=0.95)
    max_daily_trades: int = Field(default=10, ge=1, le=200)
    mode: Literal['paper', 'live'] = 'paper'
    cooldown_seconds: int = Field(default=60, ge=5, le=3600)
    max_order_size: int = Field(default=10, ge=1, le=1000)
    stop_loss_pct: float = Field(default=2.0, ge=0.1, le=20)
    take_profit_pct: float = Field(default=4.0, ge=0.1, le=50)

class TrainRequest(BaseModel):
    symbol: str

class StopAIRequest(BaseModel):
    session_id: str

@router.post('/start')
def start_ai_trader(req: StartAIRequest, user=Depends(get_current_user)):
    """Start AI trader - train model if needed and start Celery task"""
    uid = user['uid']

    active_sessions = get_active_ai_sessions(uid)
    if active_sessions:
        raise HTTPException(409, 'AI Trader already running. Stop active session first.')

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
        'mode': req.mode,
        'cooldown_seconds': req.cooldown_seconds,
        'max_order_size': req.max_order_size,
        'stop_loss_pct': req.stop_loss_pct,
        'take_profit_pct': req.take_profit_pct,
        'model_version': f'xgb_{req.symbol}_v1',
        'last_signal': 'hold',
        'last_confidence': 0,
        'last_reason': '',
        'last_heartbeat_ts': 0,
        'error_count': 0,
        'celery_task_id': 'pending'
    })

    # Dispatch AI worker task
    try:
        task = run_ai_task.delay(uid=uid, session_id=session_id)
        update_ai_session(session_id, {'celery_task_id': task.id})
    except Exception as e:
        update_ai_session(session_id, {
            'status': 'error',
            'error_message': f'Failed to start AI task: {str(e)}',
            'celery_task_id': 'failed'
        })
        raise HTTPException(500, f'Failed to start AI task: {str(e)}')

    return {
        'session_id': session_id,
        'task_id': task.id,
        'status': 'active',
        'mode': req.mode,
        'model_accuracy': f'{model_accuracy:.1%}' if model_accuracy else 'existing',
        'message': f'AI Trader started for {req.symbol}'
    }

@router.post('/stop')
def stop_ai(req: StopAIRequest, user=Depends(get_current_user)):
    """Stop AI trader"""
    uid = user['uid']
    session_id = req.session_id

    # Verify ownership
    session = get_ai_session(session_id)
    if not session or session.get('userId') != uid:
        raise HTTPException(404, 'AI session not found')

    # Stop session
    stop_ai_session(session_id)

    task_id = session.get('celery_task_id')
    if task_id and task_id not in ['pending', 'failed']:
        try:
            celery_app.control.revoke(task_id, terminate=True)
        except Exception:
            pass

    return {'status': 'stopped', 'session_id': session_id}

@router.get('/status/{session_id}')
def get_status(session_id: str, user=Depends(get_current_user)):
    """Get live AI session status"""
    uid = user['uid']
    
    session = get_ai_session(session_id)
    if not session or session.get('userId') != uid:
        raise HTTPException(404, 'AI session not found')

    return session

@router.get('/active')
def get_active_status(user=Depends(get_current_user)):
    """Get current active AI session for user"""
    uid = user['uid']
    active = get_active_ai_sessions(uid)
    return active[0] if active else None

@router.get('/signals/{session_id}')
def get_signals(session_id: str, limit: int = 30, user=Depends(get_current_user)):
    """Get recent AI signals for a session"""
    uid = user['uid']
    session = get_ai_session(session_id)
    if not session or session.get('userId') != uid:
        raise HTTPException(404, 'AI session not found')

    signals = get_ai_signals(session_id, limit=max(1, min(limit, 200)))
    return {
        'session_id': session_id,
        'signals': signals,
        'count': len(signals)
    }

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
