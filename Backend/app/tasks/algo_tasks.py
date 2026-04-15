"""
Celery tasks for algorithm trading execution
"""
from app.tasks.celery_app import celery_app
from app.services.firestore_service import get_delta_keys, update_algo_run, stop_algo_run, save_trade
from app.services.delta_client import DeltaClient
from app.services.algo_engine import EMACrossover, RSIStrategy, MACDStrategy
import asyncio
import websockets
import json
import time
import hmac
import hashlib
import os

@celery_app.task(bind=True, name='run_algo')
def run_algo_task(self, uid: str, run_id: str, algo_id: int, algo_name: str, 
                  symbol: str, product_id: int, order_size: int, params: dict):
    """
    Execute algorithm trading strategy
    
    This task:
    1. Connects to Delta WebSocket
    2. Receives live candles
    3. Runs strategy logic
    4. Places orders when signals trigger
    """
    
    print(f"=" * 80)
    print(f"🚀 ALGO TASK STARTED")
    print(f"Task ID: {self.request.id}")
    print(f"Run ID: {run_id}")
    print(f"Algo: {algo_name}")
    print(f"Symbol: {symbol}")
    print(f"Product ID: {product_id}")
    print(f"Order Size: {order_size}")
    print(f"Params: {params}")
    print(f"=" * 80)
    
    try:
        # Get Delta API keys
        print(f"📡 Fetching Delta API keys for user {uid}...")
        api_key, api_secret = get_delta_keys(uid)
        print(f"✅ API keys retrieved")
        
        # Initialize Delta client
        client = DeltaClient(api_key, api_secret)
        base_url = os.getenv('DELTA_BASE_URL', 'https://api.india.delta.exchange')
        print(f"🔗 Delta client initialized: {base_url}")
        
        # Initialize strategy
        print(f"🎯 Initializing strategy: {algo_name}")
        strategy = None
        if algo_id == 1:  # EMA Crossover
            strategy = EMACrossover(
                fast=params.get('fast_period', 9),
                slow=params.get('slow_period', 21)
            )
            print(f"   EMA Fast: {params.get('fast_period', 9)}, Slow: {params.get('slow_period', 21)}")
        elif algo_id == 2:  # RSI
            strategy = RSIStrategy(
                period=params.get('period', 14),
                oversold=params.get('oversold', 30),
                overbought=params.get('overbought', 70)
            )
            print(f"   RSI Period: {params.get('period', 14)}")
        elif algo_id == 3:  # MACD
            strategy = MACDStrategy(
                fast=params.get('fast_period', 12),
                slow=params.get('slow_period', 26),
                signal=params.get('signal_period', 9)
            )
            print(f"   MACD Fast: {params.get('fast_period', 12)}, Slow: {params.get('slow_period', 26)}")
        
        if not strategy:
            raise ValueError(f"Unknown algo_id: {algo_id}")
        
        print(f"✅ Strategy initialized")
        
        # Seed strategy with historical data
        print(f"📊 Fetching historical candles...")
        try:
            history = client.get('/v2/chart/history', {
                'symbol': symbol,
                'resolution': '1',  # 1-minute candles
                'from': int(time.time()) - 7200,  # Last 2 hours
                'to': int(time.time())
            })
            
            if history.get('s') == 'ok':
                candle_count = len(history.get('c', []))
                print(f"✅ Loaded {candle_count} historical candles")
                
                # Seed strategy
                for close_price in history.get('c', []):
                    strategy.add_candle(float(close_price))
                
                print(f"✅ Strategy seeded with historical data")
            else:
                print(f"⚠️  Historical data fetch failed: {history}")
        except Exception as e:
            print(f"⚠️  Failed to fetch historical data: {e}")
            print(f"   Continuing without historical seed...")
        
        # Run WebSocket loop
        print(f"🔌 Starting WebSocket connection...")
        asyncio.run(run_websocket_loop(
            client, strategy, uid, run_id, symbol, product_id, 
            order_size, params, api_key, api_secret
        ))
        
    except Exception as e:
        print(f"❌ ALGO TASK FAILED: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
        # Update Firestore with error
        try:
            update_algo_run(run_id, {
                'status': 'error',
                'error_message': str(e)
            })
        except:
            pass
        
        raise


async def run_websocket_loop(client, strategy, uid, run_id, symbol, product_id, 
                             order_size, params, api_key, api_secret):
    """WebSocket loop for receiving live candles"""
    
    ws_url = os.getenv('DELTA_BASE_URL', 'https://api.india.delta.exchange').replace('https', 'wss') + '/live'
    print(f"🔌 WebSocket URL: {ws_url}")
    
    # WebSocket symbol format: MARK:BTCUSD
    ws_symbol = f"MARK:{symbol}"
    print(f"📡 Subscribing to: {ws_symbol}")
    
    retry_count = 0
    max_retries = 5
    
    while retry_count < max_retries:
        try:
            async with websockets.connect(ws_url) as ws:
                print(f"✅ WebSocket connected")
                
                # Authenticate
                print(f"🔐 Authenticating WebSocket...")
                timestamp = str(int(time.time()))
                message = 'GET' + timestamp + '/live'
                signature = hmac.new(
                    api_secret.encode(),
                    message.encode(),
                    hashlib.sha256
                ).hexdigest()
                
                auth_msg = {
                    'type': 'auth',
                    'payload': {
                        'api-key': api_key,
                        'timestamp': timestamp,
                        'signature': signature
                    }
                }
                await ws.send(json.dumps(auth_msg))
                print(f"✅ Auth message sent")
                
                # Subscribe to candlesticks
                print(f"📊 Subscribing to candlesticks...")
                subscribe_msg = {
                    'type': 'subscribe',
                    'payload': {
                        'channels': [{
                            'name': 'candlesticks',
                            'symbols': [ws_symbol],
                            'resolution': '1'
                        }]
                    }
                }
                await ws.send(json.dumps(subscribe_msg))
                print(f"✅ Subscription message sent")
                
                # Listen for candles
                print(f"👂 Listening for candles...")
                candle_count = 0
                
                async for message in ws:
                    try:
                        data = json.loads(message)
                        
                        # Check if it's a candle
                        if data.get('type') == 'candlesticks':
                            candle_count += 1
                            close_price = float(data.get('close', 0))
                            
                            print(f"\n📊 CANDLE #{candle_count} RECEIVED")
                            print(f"   Symbol: {data.get('symbol')}")
                            print(f"   Close: {close_price}")
                            print(f"   Time: {data.get('time')}")
                            
                            # Add to strategy
                            strategy.add_candle(close_price)
                            
                            # Get signal
                            signal = strategy.signal()
                            print(f"   Signal: {signal}")
                            
                            if signal != 'hold':
                                print(f"\n🎯 SIGNAL TRIGGERED: {signal.upper()}")
                                
                                # Place order
                                try:
                                    await place_order(
                                        client, signal, symbol, product_id, 
                                        order_size, close_price, params, uid, run_id
                                    )
                                except Exception as e:
                                    print(f"❌ Order placement failed: {e}")
                            
                        elif data.get('type') == 'auth':
                            print(f"🔐 Auth response: {data}")
                        elif data.get('type') == 'subscriptions':
                            print(f"📡 Subscription confirmed: {data}")
                        else:
                            print(f"📨 Other message: {data.get('type')}")
                            
                    except json.JSONDecodeError:
                        print(f"⚠️  Invalid JSON: {message}")
                    except Exception as e:
                        print(f"⚠️  Message processing error: {e}")
                
        except websockets.exceptions.ConnectionClosed:
            retry_count += 1
            print(f"⚠️  WebSocket closed. Retry {retry_count}/{max_retries}")
            await asyncio.sleep(5)
        except Exception as e:
            print(f"❌ WebSocket error: {e}")
            retry_count += 1
            await asyncio.sleep(5)
    
    print(f"❌ Max retries reached. Stopping algo.")
    stop_algo_run(run_id)


async def place_order(client, signal, symbol, product_id, order_size, 
                     current_price, params, uid, run_id):
    """Place order on Delta Exchange"""
    
    print(f"\n{'='*80}")
    print(f"📤 PLACING ORDER")
    print(f"   Signal: {signal}")
    print(f"   Symbol: {symbol}")
    print(f"   Product ID: {product_id}")
    print(f"   Size: {order_size}")
    print(f"   Current Price: {current_price}")
    print(f"{'='*80}")
    
    # Calculate stop-loss and take-profit
    sl_pct = params.get('stop_loss_pct', 2.0) / 100
    tp_pct = params.get('take_profit_pct', 4.0) / 100
    
    if signal == 'buy':
        sl_price = round(current_price * (1 - sl_pct), 2)
        tp_price = round(current_price * (1 + tp_pct), 2)
    else:  # sell
        sl_price = round(current_price * (1 + sl_pct), 2)
        tp_price = round(current_price * (1 - tp_pct), 2)
    
    print(f"   Stop Loss: {sl_price}")
    print(f"   Take Profit: {tp_price}")
    
    # Prepare order payload
    order_payload = {
        'product_id': product_id,
        'size': order_size,
        'side': signal,
        'order_type': 'market_order',
        'bracket_stop_loss_price': str(sl_price),
        'bracket_stop_loss_limit_price': str(sl_price * 0.999),
        'bracket_take_profit_price': str(tp_price),
        'bracket_take_profit_limit_price': str(tp_price * 0.999),
        'time_in_force': 'gtc'
    }
    
    print(f"📋 Order Payload:")
    print(json.dumps(order_payload, indent=2))
    
    try:
        # Place bracket order
        print(f"🚀 Sending order to Delta Exchange...")
        order_response = client.post('/v2/orders/bracket', order_payload)
        
        print(f"✅ ORDER PLACED SUCCESSFULLY!")
        print(f"   Response: {json.dumps(order_response, indent=2)}")
        
        # Save trade to Firestore
        if order_response.get('success'):
            order_id = order_response.get('result', {}).get('id')
            print(f"💾 Saving trade to Firestore...")
            
            save_trade(uid, {
                'symbol': symbol,
                'product_id': product_id,
                'side': signal,
                'size': order_size,
                'entry_price': current_price,
                'delta_order_id': order_id,
                'algo_name': f'Algo Run {run_id}',
                'status': 'open'
            })
            
            print(f"✅ Trade saved to Firestore")
        else:
            print(f"⚠️  Order response indicates failure: {order_response}")
            
    except Exception as e:
        print(f"❌ ORDER FAILED: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise
