from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.services.firestore_service import (
    create_algo_run, stop_algo_run, get_active_algo_runs, get_algo_run
)
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class StartAlgoRequest(BaseModel):
    algo_id: int
    algo_name: str
    symbol: str
    product_id: int
    order_size: int
    params: dict

@router.get('/')
def list_algos():
    """List all available prebuilt strategies"""
    return [
        {
            'id': 1,
            'name': 'EMA Crossover',
            'description': 'Buy when fast EMA crosses above slow EMA, sell on reverse',
            'params': [
                {'name': 'fast_period', 'type': 'int', 'default': 9, 'min': 5, 'max': 50},
                {'name': 'slow_period', 'type': 'int', 'default': 21, 'min': 10, 'max': 200},
                {'name': 'stop_loss_pct', 'type': 'float', 'default': 2.0, 'min': 0.5, 'max': 10},
                {'name': 'take_profit_pct', 'type': 'float', 'default': 4.0, 'min': 1, 'max': 20}
            ]
        },
        {
            'id': 2,
            'name': 'RSI Strategy',
            'description': 'Buy when RSI < oversold, sell when RSI > overbought',
            'params': [
                {'name': 'period', 'type': 'int', 'default': 14, 'min': 5, 'max': 30},
                {'name': 'oversold', 'type': 'int', 'default': 30, 'min': 10, 'max': 40},
                {'name': 'overbought', 'type': 'int', 'default': 70, 'min': 60, 'max': 90},
                {'name': 'stop_loss_pct', 'type': 'float', 'default': 2.0, 'min': 0.5, 'max': 10},
                {'name': 'take_profit_pct', 'type': 'float', 'default': 4.0, 'min': 1, 'max': 20}
            ]
        },
        {
            'id': 3,
            'name': 'MACD Strategy',
            'description': 'Buy/sell on MACD histogram crossover',
            'params': [
                {'name': 'fast_period', 'type': 'int', 'default': 12, 'min': 5, 'max': 30},
                {'name': 'slow_period', 'type': 'int', 'default': 26, 'min': 10, 'max': 50},
                {'name': 'signal_period', 'type': 'int', 'default': 9, 'min': 5, 'max': 20},
                {'name': 'stop_loss_pct', 'type': 'float', 'default': 2.0, 'min': 0.5, 'max': 10},
                {'name': 'take_profit_pct', 'type': 'float', 'default': 4.0, 'min': 1, 'max': 20}
            ]
        }
    ]

@router.post('/start')
def start_algo(req: StartAlgoRequest, user=Depends(get_current_user)):
    """Start a prebuilt algo strategy"""
    uid = user['uid']
    
    # Create algo run record
    run_id = create_algo_run(uid, {
        'algo_id': req.algo_id,
        'algo_name': req.algo_name,
        'symbol': req.symbol,
        'product_id': req.product_id,
        'params': req.params,
        'celery_task_id': 'pending'
    })
    
    # TODO: Dispatch Celery task
    # For now, return success
    
    return {
        'run_id': run_id,
        'status': 'running',
        'message': f'{req.algo_name} started for {req.symbol}'
    }

@router.post('/stop')
def stop_algo(run_id: str, user=Depends(get_current_user)):
    """Stop a running algo"""
    uid = user['uid']
    
    # Verify ownership
    run = get_algo_run(run_id)
    if not run or run.get('userId') != uid:
        raise HTTPException(404, 'Algo run not found')
    
    # Stop the run
    stop_algo_run(run_id)
    
    # TODO: Revoke Celery task
    
    return {'status': 'stopped', 'run_id': run_id}

@router.get('/active')
def get_active(user=Depends(get_current_user)):
    """Get user's currently running algos"""
    uid = user['uid']
    runs = get_active_algo_runs(uid)
    return runs
