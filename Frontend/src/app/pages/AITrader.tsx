import { useState } from 'react';
import { Sparkles } from 'lucide-react';

const signals = [
  { time: '14:32:15', symbol: 'BTC/USD', signal: 'BUY', confidence: 87, action: 'Executed' },
  { time: '14:28:42', symbol: 'ETH/USD', signal: 'HOLD', confidence: 62, action: 'Skipped' },
  { time: '14:25:18', symbol: 'SOL/USD', signal: 'SELL', confidence: 78, action: 'Executed' },
  { time: '14:21:05', symbol: 'BTC/USD', signal: 'BUY', confidence: 91, action: 'Executed' },
  { time: '14:15:33', symbol: 'MATIC/USD', signal: 'HOLD', confidence: 55, action: 'Skipped' },
];

export function AITrader() {
  const [isActive, setIsActive] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);

  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">AI Trader</h1>
        <Sparkles className="w-6 h-6 text-[#7C3AED]" />
      </div>

      {/* AI Status Card */}
      <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155] mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  isActive
                    ? 'bg-[#7C3AED]/10 text-[#7C3AED]'
                    : 'bg-[#334155] text-[#94A3B8]'
                }`}
              >
                {isActive ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-pulse" />
                    ACTIVE
                  </span>
                ) : (
                  'STOPPED'
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-[#94A3B8] mb-1">Model Version</p>
                <p className="text-sm font-medium text-[#F1F5F9]">v2.4.1</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] mb-1">Last Trained</p>
                <p className="text-sm font-medium text-[#F1F5F9]">April 14, 2026</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] mb-1">Accuracy</p>
                <p className="text-sm font-medium text-[#F1F5F9]">84.2%</p>
              </div>
            </div>
          </div>
          <div className="ml-6 pl-6 border-l border-[#334155]">
            <div className="mb-4">
              <p className="text-xs text-[#94A3B8] mb-1">Trades Today</p>
              <p className="text-2xl font-bold text-[#F1F5F9]">3/10</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#94A3B8]">Last Signal</p>
                <p className="text-xs font-medium text-[#16A34A]">BUY 72%</p>
              </div>
              <div className="w-40 h-2 bg-[#334155] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7C3AED] rounded-full transition-all"
                  style={{ width: '72%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Config Card */}
      <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155] mb-6">
        <h3 className="font-semibold text-[#F1F5F9] mb-4">Configuration</h3>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#F1F5F9] mb-2">Symbol</label>
              <select className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]">
                <option>BTC/USD</option>
                <option>ETH/USD</option>
                <option>SOL/USD</option>
                <option>MATIC/USD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#F1F5F9] mb-2">Order Size (₹)</label>
              <input
                type="text"
                defaultValue="500"
                className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#F1F5F9] mb-2">Confidence Threshold</label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                  style={{
                    background: `linear-gradient(to right, #7C3AED ${((confidenceThreshold - 50) / 45) * 100}%, #334155 ${((confidenceThreshold - 50) / 45) * 100}%)`,
                  }}
                />
                <p className="text-sm text-[#7C3AED] font-medium">{confidenceThreshold}%</p>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#F1F5F9] mb-2">Max Daily Trades</label>
              <input
                type="number"
                defaultValue="10"
                className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isActive
              ? 'bg-transparent border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10'
              : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
          }`}
        >
          {isActive ? 'Stop AI Trader' : 'Start AI Trader'}
        </button>
      </div>

      {/* Live Signals Table */}
      <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155] mb-6">
        <h3 className="font-semibold text-[#F1F5F9] mb-4">Live Signals</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left text-xs font-medium text-[#94A3B8] pb-3">Time</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] pb-3">Symbol</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] pb-3">Signal</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] pb-3">Confidence</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal, index) => (
                <tr
                  key={index}
                  className={`border-b border-[#334155]/50 ${
                    index % 2 === 0 ? 'bg-[#0F172A]/30' : ''
                  }`}
                >
                  <td className="py-3 text-sm text-[#94A3B8]">{signal.time}</td>
                  <td className="py-3 text-sm text-[#F1F5F9]">{signal.symbol}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        signal.signal === 'BUY'
                          ? 'bg-[#16A34A]/10 text-[#16A34A]'
                          : signal.signal === 'SELL'
                          ? 'bg-[#DC2626]/10 text-[#DC2626]'
                          : 'bg-[#94A3B8]/10 text-[#94A3B8]'
                      }`}
                    >
                      {signal.signal}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#334155] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7C3AED] rounded-full"
                          style={{ width: `${signal.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#F1F5F9] w-8">{signal.confidence}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-[#94A3B8]">{signal.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Process Steps */}
      <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]">
        <h3 className="font-semibold text-[#F1F5F9] mb-6">AI Process</h3>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-sm font-semibold">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-[#F1F5F9]">Data Collection</p>
                <p className="text-xs text-[#94A3B8]">Gather market data from exchanges</p>
              </div>
            </div>
          </div>
          <div className="w-16 h-px bg-[#7C3AED] mx-4" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-sm font-semibold">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-[#F1F5F9]">Feature Engineering</p>
                <p className="text-xs text-[#94A3B8]">Process and extract patterns</p>
              </div>
            </div>
          </div>
          <div className="w-16 h-px bg-[#7C3AED] mx-4" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-sm font-semibold">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-[#F1F5F9]">Signal Generation</p>
                <p className="text-xs text-[#94A3B8]">Predict and execute trades</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
