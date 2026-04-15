import pandas as pd
from collections import deque

class EMACrossover:
    """EMA Crossover Strategy - Buy when fast EMA crosses above slow EMA"""
    
    def __init__(self, fast=9, slow=21):
        self.fast = fast
        self.slow = slow
        self.closes = deque(maxlen=slow * 3)
        self.prev_diff = None

    def add_candle(self, close_price: float):
        self.closes.append(close_price)

    def signal(self) -> str:
        if len(self.closes) < self.slow + 2:
            return 'hold'
        
        s = pd.Series(list(self.closes))
        fast = s.ewm(span=self.fast, adjust=False).mean()
        slow_ = s.ewm(span=self.slow, adjust=False).mean()
        
        diff = fast.iloc[-1] - slow_.iloc[-1]
        prev = fast.iloc[-2] - slow_.iloc[-2]
        
        if prev < 0 and diff > 0:
            return 'buy'
        elif prev > 0 and diff < 0:
            return 'sell'
        
        return 'hold'

class RSIStrategy:
    """RSI Strategy - Buy when oversold, sell when overbought"""
    
    def __init__(self, period=14, oversold=30, overbought=70):
        self.period = period
        self.oversold = oversold
        self.overbought = overbought
        self.closes = deque(maxlen=period * 3)

    def add_candle(self, close_price: float):
        self.closes.append(close_price)

    def rsi(self):
        s = pd.Series(list(self.closes))
        d = s.diff()
        gain = d.clip(lower=0).rolling(self.period).mean()
        loss = (-d.clip(upper=0)).rolling(self.period).mean()
        rs = gain / loss
        return float(100 - (100 / (1 + rs.iloc[-1])))

    def signal(self):
        if len(self.closes) < self.period * 2:
            return 'hold'
        
        rsi = self.rsi()
        
        if rsi < self.oversold:
            return 'buy'
        elif rsi > self.overbought:
            return 'sell'
        
        return 'hold'

class MACDStrategy:
    """MACD Strategy - Buy/sell on histogram crossover"""
    
    def __init__(self, fast=12, slow=26, signal=9):
        self.fast_p = fast
        self.slow_p = slow
        self.signal_p = signal
        self.closes = deque(maxlen=slow * 4)

    def add_candle(self, close_price: float):
        self.closes.append(close_price)

    def signal(self):
        if len(self.closes) < self.slow_p + self.signal_p + 2:
            return 'hold'
        
        s = pd.Series(list(self.closes))
        macd = s.ewm(span=self.fast_p).mean() - s.ewm(span=self.slow_p).mean()
        sig = macd.ewm(span=self.signal_p).mean()
        hist = macd - sig
        
        # Crossover: histogram crosses zero
        if hist.iloc[-2] < 0 and hist.iloc[-1] > 0:
            return 'buy'
        elif hist.iloc[-2] > 0 and hist.iloc[-1] < 0:
            return 'sell'
        
        return 'hold'
