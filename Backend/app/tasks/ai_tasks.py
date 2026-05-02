"""
Celery tasks for AI trader execution
"""
from app.tasks.celery_app import celery_app
from app.services.firestore_service import (
    get_delta_keys, get_ai_session, update_ai_session,
    save_trade, save_ai_signal
)
from app.services.delta_client import DeltaClient
from app.services.ai_engine import get_live_signal
from google.cloud.firestore_v1 import Increment
import asyncio
import websockets
import json
import time
import hmac
import hashlib
import os


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def _parse_candle(data: dict):
    if data.get('type') != 'candlesticks':
        return None

    payload = data.get('payload') if isinstance(data.get('payload'), dict) else data
    close = payload.get('close') or payload.get('c')
    if close is None:
        return None

    return {
        'open': _safe_float(payload.get('open') or payload.get('o') or close),
        'high': _safe_float(payload.get('high') or payload.get('h') or close),
        'low': _safe_float(payload.get('low') or payload.get('l') or close),
        'close': _safe_float(close),
        'volume': _safe_float(payload.get('volume') or payload.get('v') or 0),
        'time': payload.get('time')
    }


def _build_order_payload(signal: str, product_id: int, order_size: int, current_price: float, stop_loss_pct: float, take_profit_pct: float):
    sl_pct = max(0.1, stop_loss_pct) / 100
    tp_pct = max(0.1, take_profit_pct) / 100

    if signal == 'buy':
        sl_price = round(current_price * (1 - sl_pct), 2)
        tp_price = round(current_price * (1 + tp_pct), 2)
    else:
        sl_price = round(current_price * (1 + sl_pct), 2)
        tp_price = round(current_price * (1 - tp_pct), 2)

    return {
        'product_id': product_id,
        'size': order_size,
        'side': signal,
        'order_type': 'market_order',
        'bracket_stop_loss_price': str(sl_price),
        'bracket_stop_loss_limit_price': str(round(sl_price * 0.999, 2)),
        'bracket_take_profit_price': str(tp_price),
        'bracket_take_profit_limit_price': str(round(tp_price * 0.999, 2)),
        'time_in_force': 'gtc'
    }


@celery_app.task(bind=True, name='run_ai')
def run_ai_task(self, uid: str, session_id: str):
    print(f"🤖 AI TASK STARTED session={session_id} task={self.request.id}")
    session = get_ai_session(session_id)
    if not session:
        raise ValueError(f"AI session not found: {session_id}")

    symbol = session.get('symbol')
    product_id = int(session.get('product_id'))
    order_size = int(session.get('order_size', 1))
    threshold_pct = float(session.get('confidence_threshold', 0.68)) * 100
    max_daily_trades = int(session.get('max_daily_trades', 10))
    mode = session.get('mode', 'paper')
    cooldown_seconds = int(session.get('cooldown_seconds', 60))
    stop_loss_pct = float(session.get('stop_loss_pct', 2.0))
    take_profit_pct = float(session.get('take_profit_pct', 4.0))
    max_order_size = int(session.get('max_order_size', order_size))

    allowlist = [s.strip().upper() for s in os.getenv('AI_ALLOWED_SYMBOLS', 'BTCUSD,ETHUSD,SOLUSD,MATICUSD').split(',') if s.strip()]
    if symbol.upper() not in allowlist:
        update_ai_session(session_id, {
            'status': 'error',
            'error_message': f'Symbol {symbol} is not allowed for AI trading'
        })
        return

    if order_size > max_order_size:
        update_ai_session(session_id, {
            'status': 'error',
            'error_message': f'Order size exceeds max_order_size ({max_order_size})'
        })
        return

    try:
        api_key, api_secret = get_delta_keys(uid)
    except Exception as e:
        update_ai_session(session_id, {
            'status': 'error',
            'error_message': f'Failed to retrieve Delta Exchange API credentials: {str(e)}'
        })
        return
    client = DeltaClient(api_key, api_secret)
    asyncio.run(_run_ai_loop(
        client=client,
        uid=uid,
        session_id=session_id,
        symbol=symbol,
        product_id=product_id,
        order_size=order_size,
        threshold_pct=threshold_pct,
        max_daily_trades=max_daily_trades,
        mode=mode,
        cooldown_seconds=cooldown_seconds,
        stop_loss_pct=stop_loss_pct,
        take_profit_pct=take_profit_pct,
        api_key=api_key,
        api_secret=api_secret
    ))


async def _run_ai_loop(client, uid: str, session_id: str, symbol: str, product_id: int, order_size: int,
                       threshold_pct: float, max_daily_trades: int, mode: str, cooldown_seconds: int,
                       stop_loss_pct: float, take_profit_pct: float, api_key: str, api_secret: str):
    history = client.get('/v2/chart/history', {
        'symbol': symbol,
        'resolution': '1',
        'from': int(time.time()) - 7200,
        'to': int(time.time())
    })

    candle_buffer = []
    if history.get('s') == 'ok':
        opens = history.get('o', [])
        highs = history.get('h', [])
        lows = history.get('l', [])
        closes = history.get('c', [])
        volumes = history.get('v', [])

        for i in range(len(closes)):
            candle_buffer.append({
                'open': _safe_float(opens[i] if i < len(opens) else closes[i]),
                'high': _safe_float(highs[i] if i < len(highs) else closes[i]),
                'low': _safe_float(lows[i] if i < len(lows) else closes[i]),
                'close': _safe_float(closes[i]),
                'volume': _safe_float(volumes[i] if i < len(volumes) else 0),
            })

    ws_url = os.getenv('DELTA_BASE_URL', 'https://api.india.delta.exchange').replace('https://', 'wss://') + '/live'
    ws_symbol = f"MARK:{symbol}"
    consecutive_errors = 0
    retries = 0
    max_retries = 5

    while retries < max_retries:
        try:
            async with websockets.connect(ws_url) as ws:
                timestamp = str(int(time.time()))
                signature = hmac.new(
                    api_secret.encode(),
                    ('GET' + timestamp + '/live').encode(),
                    hashlib.sha256
                ).hexdigest()

                await ws.send(json.dumps({
                    'type': 'auth',
                    'payload': {
                        'api-key': api_key,
                        'timestamp': timestamp,
                        'signature': signature
                    }
                }))

                await ws.send(json.dumps({
                    'type': 'subscribe',
                    'payload': {
                        'channels': [{
                            'name': 'candlesticks',
                            'symbols': [ws_symbol],
                            'resolution': '1'
                        }]
                    }
                }))

                async for raw_message in ws:
                    session = get_ai_session(session_id)
                    if not session or session.get('status') != 'active':
                        return

                    update_ai_session(session_id, {'last_heartbeat_ts': int(time.time())})

                    try:
                        data = json.loads(raw_message)
                    except json.JSONDecodeError:
                        continue

                    candle = _parse_candle(data)
                    if not candle:
                        continue

                    candle_buffer.append(candle)
                    candle_buffer = candle_buffer[-300:]

                    signal = get_live_signal(
                        symbol=symbol,
                        candle_buffer=candle_buffer,
                        threshold=max(0.5, min(0.95, threshold_pct / 100))
                    )
                    confidence_raw = float(signal.get('confidence', 0))
                    confidence_pct = confidence_raw * 100 if confidence_raw <= 1 else confidence_raw

                    save_ai_signal(session_id, {
                        'symbol': symbol,
                        'signal': signal.get('signal', 'hold'),
                        'confidence': round(confidence_pct, 1),
                        'reason': signal.get('reason', ''),
                        'mode': mode
                    })

                    update_ai_session(session_id, {
                        'last_signal': signal.get('signal', 'hold'),
                        'last_confidence': round(confidence_pct, 1),
                        'last_reason': signal.get('reason', ''),
                        'last_signal_at': int(time.time())
                    })

                    action = signal.get('signal', 'hold')
                    if action not in ['buy', 'sell'] or confidence_pct < threshold_pct:
                        consecutive_errors = 0
                        continue

                    trades_today = int(session.get('trades_today', 0))
                    if trades_today >= max_daily_trades:
                        continue

                    last_trade_at = int(session.get('last_trade_at', 0) or 0)
                    now_ts = int(time.time())
                    if last_trade_at and now_ts - last_trade_at < cooldown_seconds:
                        continue

                    if mode == 'paper':
                        save_trade(uid, {
                            'symbol': symbol,
                            'product_id': product_id,
                            'side': action,
                            'size': order_size,
                            'entry_price': candle.get('close', 0),
                            'algo_name': 'AI Trader',
                            'ai_session_id': session_id,
                            'mode': mode,
                            'delta_order_id': f'paper_{session_id}_{now_ts}'
                        })
                    else:
                        payload = _build_order_payload(
                            signal=action,
                            product_id=product_id,
                            order_size=order_size,
                            current_price=candle.get('close', 0),
                            stop_loss_pct=stop_loss_pct,
                            take_profit_pct=take_profit_pct
                        )
                        order_response = client.post('/v2/orders/bracket', payload)
                        if not order_response.get('success'):
                            err_msg = order_response.get('error') or order_response.get('message') or 'Order failed'
                            raise ValueError(err_msg)

                        order_id = order_response.get('result', {}).get('id')
                        save_trade(uid, {
                            'symbol': symbol,
                            'product_id': product_id,
                            'side': action,
                            'size': order_size,
                            'entry_price': candle.get('close', 0),
                            'algo_name': 'AI Trader',
                            'ai_session_id': session_id,
                            'mode': mode,
                            'delta_order_id': order_id
                        })

                    update_ai_session(session_id, {
                        'trades_today': Increment(1),
                        'last_trade_at': now_ts,
                        'last_action': action
                    })
                    consecutive_errors = 0

        except Exception as e:
            retries += 1
            consecutive_errors += 1
            update_ai_session(session_id, {
                'last_error': str(e),
                'error_count': consecutive_errors,
                'last_error_at': int(time.time())
            })

            if consecutive_errors >= 3:
                update_ai_session(session_id, {
                    'status': 'error',
                    'error_message': f'AI task halted after repeated failures: {str(e)}'
                })
                return

            await asyncio.sleep(5)

    update_ai_session(session_id, {
        'status': 'error',
        'error_message': 'AI task stopped after max reconnect retries'
    })
