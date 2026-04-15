from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.services.firestore_service import get_delta_keys, get_active_algo_runs
from app.services.delta_client import DeltaClient
import httpx

router = APIRouter()

@router.get('/data')
def get_dashboard_data(user=Depends(get_current_user)):
    """Get all dashboard data: wallet, prices, active algos, positions"""
    uid = user['uid']
    
    try:
        # Get Delta API keys
        api_key, api_secret = get_delta_keys(uid)
        client = DeltaClient(api_key, api_secret)
        
        # Fetch wallet balances
        wallet_response = client.get('/v2/wallet/balances')
        wallet_balances = wallet_response.get('result', [])
        
        # Calculate total balance in INR
        total_balance_inr = sum(
            float(asset.get('balance_inr', 0)) 
            for asset in wallet_balances
        )
        
        # Get individual asset balances
        assets = {}
        for asset in wallet_balances:
            symbol = asset.get('asset_symbol')
            if symbol in ['BTC', 'ETH', 'USD', 'USDT', 'SOL', 'XRP']:
                assets[symbol] = {
                    'balance': float(asset.get('balance', 0)),
                    'balance_inr': float(asset.get('balance_inr', 0)),
                    'available_balance': float(asset.get('available_balance', 0))
                }
        
        # Fetch live prices for BTC, ETH, SOL
        # Note: Delta India API may not have /v2/tickers endpoint
        # Using mock data for now until we implement proper price fetching
        prices = {
            'BTCUSD': {
                'symbol': 'BTCUSD',
                'price': 0,
                'change_24h': 0,
                'change_percent_24h': '0',
                'high_24h': 0,
                'low_24h': 0,
                'volume_24h': 0
            },
            'ETHUSD': {
                'symbol': 'ETHUSD',
                'price': 0,
                'change_24h': 0,
                'change_percent_24h': '0',
                'high_24h': 0,
                'low_24h': 0,
                'volume_24h': 0
            },
            'SOLUSD': {
                'symbol': 'SOLUSD',
                'price': 0,
                'change_24h': 0,
                'change_percent_24h': '0',
                'high_24h': 0,
                'low_24h': 0,
                'volume_24h': 0
            }
        }
        
        # Fetch open positions
        try:
            positions_response = client.get('/v2/positions')
            positions = positions_response.get('result', [])
        except:
            positions = []
        
        # Format positions
        open_positions = []
        for pos in positions:
            if float(pos.get('size', 0)) != 0:
                open_positions.append({
                    'symbol': pos.get('product_symbol', ''),
                    'side': 'BUY' if float(pos.get('size', 0)) > 0 else 'SELL',
                    'size': abs(float(pos.get('size', 0))),
                    'entry_price': float(pos.get('entry_price', 0)),
                    'mark_price': float(pos.get('mark_price', 0)),
                    'unrealized_pnl': float(pos.get('unrealized_pnl', 0)),
                    'unrealized_pnl_percent': float(pos.get('unrealized_pnl_percent', 0)),
                    'liquidation_price': float(pos.get('liquidation_price', 0))
                })
        
        # Get active algorithms from Firestore
        active_algos = get_active_algo_runs(uid)
        
        # Format algo data
        algos_list = []
        for algo in active_algos:
            algos_list.append({
                'id': algo.get('id'),
                'name': algo.get('algo_name', 'Unknown'),
                'symbol': algo.get('symbol', ''),
                'status': algo.get('status', 'unknown'),
                'started_at': algo.get('started_at')
            })
        
        return {
            'wallet': {
                'total_balance_inr': round(total_balance_inr, 2),
                'assets': assets
            },
            'prices': prices,
            'positions': open_positions,
            'active_algos': algos_list,
            'delta_connected': True
        }
        
    except ValueError as e:
        # Delta keys not configured
        raise HTTPException(400, 'Delta Exchange not connected. Please connect your API keys first.')
    except httpx.HTTPStatusError as e:
        error_detail = f'Delta API error: {e.response.status_code}'
        raise HTTPException(400, error_detail)
    except Exception as e:
        raise HTTPException(500, f'Failed to fetch dashboard data: {str(e)}')
