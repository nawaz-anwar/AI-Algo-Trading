import pandas as pd
import numpy as np
import joblib
import os
import time
from xgboost import XGBClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score

FEATURES = [
    'ema_diff', 'price_above_ema50',
    'rsi', 'macd', 'macd_signal', 'macd_hist',
    'bb_width', 'bb_pos',
    'vol_ratio',
    'return_1', 'return_5', 'candle_body'
]

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Input:  DataFrame with columns: open, high, low, close, volume
    Output: DataFrame with 14 new indicator columns + target column
    """
    # ── Trend Indicators ──────────────────────────────
    df['ema_9'] = df['close'].ewm(span=9, adjust=False).mean()
    df['ema_21'] = df['close'].ewm(span=21, adjust=False).mean()
    df['ema_50'] = df['close'].ewm(span=50, adjust=False).mean()
    df['ema_diff'] = df['ema_9'] - df['ema_21']
    df['price_above_ema50'] = (df['close'] > df['ema_50']).astype(int)

    # ── Momentum Indicators ───────────────────────────
    delta = df['close'].diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    df['rsi'] = 100 - (100 / (1 + gain / loss))

    ema12 = df['close'].ewm(span=12).mean()
    ema26 = df['close'].ewm(span=26).mean()
    df['macd'] = ema12 - ema26
    df['macd_signal'] = df['macd'].ewm(span=9).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']

    # ── Volatility Indicators ─────────────────────────
    df['bb_mid'] = df['close'].rolling(20).mean()
    bb_std = df['close'].rolling(20).std()
    df['bb_upper'] = df['bb_mid'] + (2 * bb_std)
    df['bb_lower'] = df['bb_mid'] - (2 * bb_std)
    df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_mid']
    df['bb_pos'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])

    # ── Volume Indicators ─────────────────────────────
    df['vol_sma20'] = df['volume'].rolling(20).mean()
    df['vol_ratio'] = df['volume'] / df['vol_sma20']

    # ── Price Action ──────────────────────────────────
    df['return_1'] = df['close'].pct_change(1)
    df['return_5'] = df['close'].pct_change(5)
    df['candle_body'] = (df['close'] - df['open']).abs() / df['open']

    # ── Target Variable ───────────────────────────────
    df['target'] = (df['close'].shift(-1) > df['close']).astype(int)

    return df.dropna()

def train_model(symbol: str, resolution: str = '5', delta_client=None) -> dict:
    """
    Train XGBoost model for a given symbol.
    Uses TimeSeriesSplit to avoid look-ahead bias.
    Returns: { accuracy, precision, model_path }
    """
    import httpx
    
    base = os.getenv('DELTA_BASE_URL', 'https://cdn-ind.testnet.deltaex.org')
    
    # Fetch 30 days of OHLC from Delta
    resp = httpx.get(f'{base}/v2/chart/history', params={
        'symbol': symbol,
        'resolution': resolution,
        'from': int(time.time()) - 86400 * 30,
        'to': int(time.time())
    }, timeout=30.0)
    data = resp.json()

    if data.get('s') != 'ok':
        raise ValueError(f"Failed to fetch chart data: {data}")

    # Build DataFrame
    df = pd.DataFrame({
        'open': [float(x) for x in data['o']],
        'high': [float(x) for x in data['h']],
        'low': [float(x) for x in data['l']],
        'close': [float(x) for x in data['c']],
        'volume': [float(x) for x in data['v']],
    })
    print(f'Raw candles: {len(df)}')

    # Build features
    df = build_features(df)
    print(f'After feature engineering: {len(df)} rows')

    X = df[FEATURES]
    y = df['target']

    # Time-series cross-validation
    tscv = TimeSeriesSplit(n_splits=5)
    scores = []
    
    for train_idx, val_idx in tscv.split(X):
        X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_tr, y_val = y.iloc[train_idx], y.iloc[val_idx]
        
        m = XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=5,
            use_label_encoder=False,
            eval_metric='logloss'
        )
        m.fit(X_tr, y_tr, eval_set=[(X_val, y_val)], verbose=False)
        pred = m.predict(X_val)
        scores.append(accuracy_score(y_val, pred))

    avg_acc = sum(scores) / len(scores)
    print(f'CV Accuracy: {avg_acc:.2%}')

    # Final train on ALL data
    final_model = XGBClassifier(
        n_estimators=300, max_depth=4,
        learning_rate=0.03, subsample=0.8,
        colsample_bytree=0.8, min_child_weight=5,
        use_label_encoder=False, eval_metric='logloss'
    )
    final_model.fit(X, y)

    # Save model
    os.makedirs('models', exist_ok=True)
    model_path = f'models/{symbol}_xgb.pkl'
    joblib.dump(final_model, model_path)
    print(f'Model saved: {model_path}')

    return {
        'accuracy': avg_acc,
        'model_path': model_path,
        'rows_trained': len(df)
    }

def get_live_signal(symbol: str, candle_buffer: list, threshold: float = 0.65) -> dict:
    """
    candle_buffer: list of last 100+ candle dicts from WebSocket
    threshold: minimum confidence to act (default 65%)
    Returns: { signal, confidence, reason, features }
    """
    model_path = f'models/{symbol}_xgb.pkl'
    if not os.path.exists(model_path):
        return {
            'signal': 'hold',
            'confidence': 0,
            'reason': 'Model not trained yet'
        }

    model = joblib.load(model_path)

    # Build features from buffer
    df = pd.DataFrame(candle_buffer)
    
    # Handle different column naming conventions
    if 'o' in df.columns:
        df = df.rename(columns={'o': 'open', 'h': 'high', 'l': 'low', 'c': 'close', 'v': 'volume'})
    
    df = df.astype(float)
    df = build_features(df)

    if len(df) < 2:
        return {
            'signal': 'hold',
            'confidence': 0,
            'reason': 'Insufficient data'
        }

    # Use most recent completed candle
    last = df[FEATURES].iloc[[-1]]

    # Get probability of UP move
    proba = model.predict_proba(last)[0]
    prob_up = float(proba[1])
    prob_down = float(proba[0])

    # Determine signal
    if prob_up >= threshold:
        signal = 'buy'
        confidence = prob_up
        reason = f'Model {prob_up:.0%} confident price will rise'
    elif prob_down >= threshold:
        signal = 'sell'
        confidence = prob_down
        reason = f'Model {prob_down:.0%} confident price will fall'
    else:
        signal = 'hold'
        confidence = max(prob_up, prob_down)
        reason = f'Confidence {confidence:.0%} below threshold {threshold:.0%}'

    return {
        'signal': signal,
        'confidence': round(confidence * 100, 1),
        'prob_up': round(prob_up * 100, 1),
        'prob_down': round(prob_down * 100, 1),
        'reason': reason,
        'features': last.to_dict('records')[0]
    }
