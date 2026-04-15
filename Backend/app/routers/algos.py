from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.services.firestore_service import (
    create_algo_run, stop_algo_run, get_active_algo_runs, get_algo_run, update_algo_run
)
from app.tasks.algo_tasks import run_algo_task
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

class StopAlgoRequest(BaseModel):
    run_id: str

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
    
    print(f"🚀 Starting algo: {req.algo_name} for user {uid}")
    print(f"   Symbol: {req.symbol}")
    print(f"   Product ID: {req.product_id}")
    print(f"   Order Size: {req.order_size}")
    print(f"   Params: {req.params}")
    
    # Create algo run record with pending status
    run_id = create_algo_run(uid, {
        'algo_id': req.algo_id,
        'algo_name': req.algo_name,
        'symbol': req.symbol,
        'product_id': req.product_id,
        'params': req.params,
        'celery_task_id': 'dispatching'
    })
    
    print(f"✅ Algo run created: {run_id}")
    
    # Dispatch Celery task
    try:
        print(f"📤 Dispatching Celery task...")
        task = run_algo_task.delay(
            uid=uid,
            run_id=run_id,
            algo_id=req.algo_id,
            algo_name=req.algo_name,
            symbol=req.symbol,
            product_id=req.product_id,
            order_size=req.order_size,
            params=req.params
        )
        
        print(f"✅ Celery task dispatched: {task.id}")
        
        # Update with actual task ID
        update_algo_run(run_id, {
            'celery_task_id': task.id
        })
        
        print(f"✅ Algo run updated with task ID")
        
        return {
            'run_id': run_id,
            'task_id': task.id,
            'status': 'running',
            'message': f'{req.algo_name} started for {req.symbol}'
        }
        
    except Exception as e:
        print(f"❌ Failed to dispatch Celery task: {e}")
        # Update status to error
        update_algo_run(run_id, {
            'status': 'error',
            'celery_task_id': 'failed',
            'error_message': str(e)
        })
        raise HTTPException(500, f'Failed to start algorithm: {str(e)}')

@router.post('/stop')
def stop_algo(req: StopAlgoRequest, user=Depends(get_current_user)):
    """Stop a running algo"""
    uid = user['uid']
    run_id = req.run_id
    
    # Verify ownership
    run = get_algo_run(run_id)
    if not run or run.get('userId') != uid:
        raise HTTPException(404, 'Algo run not found')
    
    # Stop the run
    stop_algo_run(run_id)
    
    # TODO: Revoke Celery task
    task_id = run.get('celery_task_id')
    if task_id and task_id not in ['pending', 'dispatching', 'failed']:
        try:
            from app.tasks.celery_app import celery_app
            celery_app.control.revoke(task_id, terminate=True)
            print(f"✅ Celery task {task_id} revoked")
        except Exception as e:
            print(f"⚠️  Failed to revoke task: {e}")
    
    return {'status': 'stopped', 'run_id': run_id}

@router.get('/active')
def get_active(user=Depends(get_current_user)):
    """Get user's currently running algos"""
    uid = user['uid']
    runs = get_active_algo_runs(uid)
    return runs
