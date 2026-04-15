import { useState } from 'react';
import { Info } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  type: 'Trend' | 'Momentum' | 'Volatility';
  description: string;
  pairs: string[];
  fastPeriod: number;
  slowPeriod: number;
  symbol: string;
  orderSize: string;
  isRunning: boolean;
}

export function Algorithms() {
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: '1',
      name: 'EMA Crossover',
      type: 'Trend',
      description: 'Buy when fast EMA crosses above slow EMA, sell on opposite',
      pairs: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
      fastPeriod: 12,
      slowPeriod: 26,
      symbol: 'BTC/USD',
      orderSize: '100',
      isRunning: false,
    },
    {
      id: '2',
      name: 'RSI Strategy',
      type: 'Momentum',
      description: 'Buy when RSI < 30 (oversold), sell when RSI > 70 (overbought)',
      pairs: ['BTC/USD', 'ETH/USD', 'MATIC/USD'],
      fastPeriod: 14,
      slowPeriod: 70,
      symbol: 'ETH/USD',
      orderSize: '250',
      isRunning: false,
    },
    {
      id: '3',
      name: 'MACD Strategy',
      type: 'Momentum',
      description: 'Trade based on MACD line crossing signal line',
      pairs: ['BTC/USD', 'SOL/USD', 'AVAX/USD'],
      fastPeriod: 12,
      slowPeriod: 26,
      symbol: 'SOL/USD',
      orderSize: '500',
      isRunning: false,
    },
  ]);

  const toggleStrategy = (id: string) => {
    setStrategies(strategies.map(s => 
      s.id === id ? { ...s, isRunning: !s.isRunning } : s
    ));
  };

  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <h1 className="text-3xl font-bold text-[#F1F5F9] mb-6">Algorithms</h1>

      {/* Info Bar */}
      <div className="bg-[#1E293B] border-l-4 border-[#2563EB] rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#94A3B8]">
            Configure your trading strategies below. Adjust parameters and click Start to activate automated trading. 
            Monitor performance in the Trade History section.
          </p>
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-3 gap-6">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[#F1F5F9]">{strategy.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    strategy.type === 'Trend'
                      ? 'bg-[#2563EB]/10 text-[#2563EB]'
                      : 'bg-[#7C3AED]/10 text-[#7C3AED]'
                  }`}
                >
                  {strategy.type}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{strategy.description}</p>
            </div>

            {/* Supported Pairs */}
            <div className="mb-4">
              <p className="text-xs text-[#94A3B8] mb-2">Supported Pairs</p>
              <div className="flex flex-wrap gap-1.5">
                {strategy.pairs.map((pair) => (
                  <span
                    key={pair}
                    className="px-2 py-1 bg-[#334155]/50 text-xs text-[#F1F5F9] rounded"
                  >
                    {pair}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-px bg-[#334155] my-4" />

            {/* Parameters */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Fast Period</label>
                  <input
                    type="number"
                    value={strategy.fastPeriod}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    disabled={strategy.isRunning}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Slow Period</label>
                  <input
                    type="number"
                    value={strategy.slowPeriod}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    disabled={strategy.isRunning}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Symbol</label>
                <select
                  value={strategy.symbol}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  disabled={strategy.isRunning}
                >
                  {strategy.pairs.map((pair) => (
                    <option key={pair} value={pair}>
                      {pair}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Order Size (₹)</label>
                <input
                  type="text"
                  value={strategy.orderSize}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  disabled={strategy.isRunning}
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => toggleStrategy(strategy.id)}
              className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                strategy.isRunning
                  ? 'bg-transparent border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10'
                  : 'bg-[#16A34A] text-white hover:bg-[#15803D]'
              }`}
            >
              {strategy.isRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
                  Stop Strategy
                </span>
              ) : (
                'Start Strategy'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
