from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.services.firestore_service import get_trades

router = APIRouter()

@router.get('/history')
def get_trade_history(limit: int = 50, user=Depends(get_current_user)):
    """Get paginated trade history"""
    uid = user['uid']
    trades = get_trades(uid, limit)
    return trades

@router.get('/stats')
def get_trade_stats(user=Depends(get_current_user)):
    """Get trade statistics summary"""
    uid = user['uid']
    trades = get_trades(uid, limit=1000)
    
    if not trades:
        return {
            'total_trades': 0,
            'total_pnl': 0,
            'win_rate': 0,
            'best_trade': 0,
            'worst_trade': 0
        }
    
    closed_trades = [t for t in trades if t.get('status') == 'closed']
    
    if not closed_trades:
        return {
            'total_trades': len(trades),
            'open_trades': len(trades),
            'total_pnl': 0,
            'win_rate': 0,
            'best_trade': 0,
            'worst_trade': 0
        }
    
    pnls = [t.get('pnl_usdt', 0) for t in closed_trades]
    wins = len([p for p in pnls if p > 0])
    
    return {
        'total_trades': len(trades),
        'open_trades': len(trades) - len(closed_trades),
        'closed_trades': len(closed_trades),
        'total_pnl': round(sum(pnls), 2),
        'win_rate': round((wins / len(closed_trades)) * 100, 1) if closed_trades else 0,
        'best_trade': round(max(pnls), 2) if pnls else 0,
        'worst_trade': round(min(pnls), 2) if pnls else 0,
        'avg_pnl': round(sum(pnls) / len(pnls), 2) if pnls else 0
    }
