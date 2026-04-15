from fastapi import APIRouter, Depends, HTTPException, Query
from app.routers.auth import get_current_user
from app.services.firestore_service import get_trades
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter()

@router.get('/history')
def get_trade_history(
    limit: int = Query(50, ge=1, le=100),
    symbol: Optional[str] = Query(None),
    strategy: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    days: Optional[int] = Query(None, ge=1, le=365),
    user=Depends(get_current_user)
):
    """Get paginated and filtered trade history"""
    uid = user['uid']
    
    # Get all trades for the user (we'll filter in Python since Firestore has limited query capabilities)
    all_trades = get_trades(uid, limit=1000)  # Get more to allow filtering
    
    # Apply filters
    filtered_trades = all_trades
    
    if symbol:
        filtered_trades = [t for t in filtered_trades if t.get('symbol', '').upper() == symbol.upper()]
    
    if strategy:
        filtered_trades = [t for t in filtered_trades if strategy.lower() in t.get('algo_name', '').lower()]
    
    if status:
        filtered_trades = [t for t in filtered_trades if t.get('status', '').lower() == status.lower()]
    
    if days:
        cutoff_date = datetime.now() - timedelta(days=days)
        filtered_trades = [
            t for t in filtered_trades 
            if t.get('opened_at') and t['opened_at'].timestamp() > cutoff_date.timestamp()
        ]
    
    # Apply limit
    filtered_trades = filtered_trades[:limit]
    
    # Format trades for frontend
    formatted_trades = []
    for trade in filtered_trades:
        # Convert Firestore timestamp to readable format
        opened_at = trade.get('opened_at')
        if opened_at:
            date_str = opened_at.strftime('%b %d, %H:%M')
        else:
            date_str = 'Unknown'
        
        # Format P&L
        pnl_usdt = trade.get('pnl_usdt', 0)
        if pnl_usdt != 0:
            pnl_str = f"${pnl_usdt:,.2f}" if pnl_usdt > 0 else f"-${abs(pnl_usdt):,.2f}"
        else:
            pnl_str = "-"
        
        formatted_trade = {
            'id': trade.get('id'),
            'date': date_str,
            'symbol': trade.get('symbol', ''),
            'strategy': trade.get('algo_name', ''),
            'side': trade.get('side', '').upper(),
            'size': str(trade.get('size', 0)),
            'entry_price': f"${trade.get('entry_price', 0):,.2f}" if trade.get('entry_price') else '-',
            'exit_price': f"${trade.get('exit_price', 0):,.2f}" if trade.get('exit_price') else '-',
            'pnl': pnl_str,
            'pnl_usdt': pnl_usdt,
            'status': trade.get('status', 'unknown').title(),
            'pnl_positive': pnl_usdt > 0,
            'delta_order_id': trade.get('delta_order_id')
        }
        formatted_trades.append(formatted_trade)
    
    return {
        'trades': formatted_trades,
        'total': len(all_trades),
        'filtered': len(filtered_trades),
        'limit': limit
    }

@router.get('/stats')
def get_trade_stats(user=Depends(get_current_user)):
    """Get trade statistics summary"""
    uid = user['uid']
    trades = get_trades(uid, limit=1000)
    
    if not trades:
        return {
            'total_trades': 0,
            'total_pnl': '$0.00',
            'win_rate': '0%',
            'best_trade': '$0.00',
            'worst_trade': '$0.00',
            'open_trades': 0
        }
    
    closed_trades = [t for t in trades if t.get('status') == 'closed']
    open_trades = [t for t in trades if t.get('status') == 'open']
    
    if not closed_trades:
        return {
            'total_trades': len(trades),
            'open_trades': len(open_trades),
            'total_pnl': '$0.00',
            'win_rate': '0%',
            'best_trade': '$0.00',
            'worst_trade': '$0.00'
        }
    
    pnls = [t.get('pnl_usdt', 0) for t in closed_trades]
    wins = len([p for p in pnls if p > 0])
    total_pnl = sum(pnls)
    
    return {
        'total_trades': len(trades),
        'open_trades': len(open_trades),
        'closed_trades': len(closed_trades),
        'total_pnl': f"${total_pnl:,.2f}" if total_pnl >= 0 else f"-${abs(total_pnl):,.2f}",
        'total_pnl_raw': total_pnl,
        'win_rate': f"{(wins / len(closed_trades)) * 100:.1f}%" if closed_trades else '0%',
        'best_trade': f"${max(pnls):,.2f}" if pnls else '$0.00',
        'worst_trade': f"${min(pnls):,.2f}" if pnls else '$0.00',
        'avg_pnl': f"${sum(pnls) / len(pnls):,.2f}" if pnls else '$0.00'
    }

@router.post('/create-sample')
def create_sample_trades(user=Depends(get_current_user)):
    """Create sample trades for testing (remove in production)"""
    from app.services.firestore_service import save_trade, close_trade
    import random
    from datetime import datetime, timedelta
    
    uid = user['uid']
    
    # Sample trade data
    symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD']
    strategies = ['EMA Crossover', 'RSI Strategy', 'MACD Strategy', 'AI Trader']
    sides = ['buy', 'sell']
    
    created_trades = []
    
    for i in range(10):
        symbol = random.choice(symbols)
        strategy = random.choice(strategies)
        side = random.choice(sides)
        size = random.randint(1, 5)
        entry_price = random.uniform(50000, 70000) if symbol == 'BTCUSD' else random.uniform(2000, 4000)
        
        # Create trade
        trade_data = {
            'symbol': symbol,
            'product_id': 27 if symbol == 'BTCUSD' else 3136,
            'side': side,
            'size': size,
            'entry_price': round(entry_price, 2),
            'algo_name': strategy,
            'delta_order_id': f'sample_{random.randint(100000, 999999)}'
        }
        
        trade_id = save_trade(uid, trade_data)
        
        # Randomly close some trades
        if random.random() > 0.3:  # 70% chance to close
            price_change = random.uniform(-0.05, 0.08)  # -5% to +8%
            exit_price = entry_price * (1 + price_change)
            pnl_usdt = (exit_price - entry_price) * size if side == 'buy' else (entry_price - exit_price) * size
            pnl_pct = (price_change * 100) if side == 'buy' else (-price_change * 100)
            
            close_trade(trade_id, round(exit_price, 2), round(pnl_usdt, 2), round(pnl_pct, 2))
        
        created_trades.append(trade_id)
    
    return {
        'message': f'Created {len(created_trades)} sample trades',
        'trade_ids': created_trades
    }
