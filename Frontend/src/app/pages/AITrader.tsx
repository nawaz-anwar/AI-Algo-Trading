import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../api';

interface AISession {
  id: string;
  symbol: string;
  product_id: number;
  order_size: number;
  confidence_threshold: number;
  max_daily_trades: number;
  trades_today: number;
  status: string;
  mode: 'paper' | 'live';
  model_version?: string;
  last_signal?: string;
  last_confidence?: number;
  last_reason?: string;
  last_heartbeat_ts?: number;
  celery_task_id?: string;
}

interface AISignal {
  id: string;
  signal: string;
  confidence: number;
  reason: string;
  created_at_ts?: number;
}

const SYMBOL_OPTIONS = [
  { value: 'BTCUSD', label: 'BTC/USD', productId: 27 },
  { value: 'ETHUSD', label: 'ETH/USD', productId: 3136 },
  { value: 'SOLUSD', label: 'SOL/USD', productId: 139511 },
  { value: 'MATICUSD', label: 'MATIC/USD', productId: 84 },
];

export function AITrader() {
  const [session, setSession] = useState<AISession | null>(null);
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    symbol: 'BTCUSD',
    product_id: 27,
    order_size: 1,
    confidence_threshold: 0.7,
    max_daily_trades: 10,
    mode: 'paper' as 'paper' | 'live',
    cooldown_seconds: 60,
    max_order_size: 10,
    stop_loss_pct: 2.0,
    take_profit_pct: 4.0
  });

  const confidenceThreshold = Math.round(form.confidence_threshold * 100);
  const isActive = session?.status === 'active';
  const normalizePct = (value?: number) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return 0;
    return n <= 1 ? n * 100 : n;
  };
  const selectedSymbolLabel = useMemo(
    () => SYMBOL_OPTIONS.find((s) => s.value === (session?.symbol || form.symbol))?.label || form.symbol,
    [form.symbol, session?.symbol]
  );

  const fetchAIState = async () => {
    try {
      const active = await api.getActiveAI();
      setSession(active);

      if (active?.id) {
        const [status, signalResponse] = await Promise.all([
          api.getAIStatus(active.id),
          api.getAISignals(active.id, 20)
        ]);
        setSession(status);
        setSignals(signalResponse.signals || []);
      } else {
        setSignals([]);
      }
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load AI Trader state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIState();
    const interval = setInterval(fetchAIState, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await api.startAI(form);
      await fetchAIState();
    } catch (err: any) {
      setError(err.message || 'Failed to start AI Trader');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!session?.id) return;
    setActionLoading(true);
    try {
      await api.stopAI(session.id);
      await fetchAIState();
    } catch (err: any) {
      setError(err.message || 'Failed to stop AI Trader');
    } finally {
      setActionLoading(false);
    }
  };

  const updateForm = (updates: Partial<typeof form>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1200px]">
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">AI Trader</h1>
        <Sparkles className="w-6 h-6 text-[#7C3AED]" />
      </div>

      {error && (
        <div className="bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#DC2626] mt-0.5" />
          <p className="text-sm text-[#FCA5A5]">{error}</p>
        </div>
      )}

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
                <p className="text-sm font-medium text-[#F1F5F9]">{session?.model_version || 'Not trained'}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] mb-1">Mode</p>
                <p className="text-sm font-medium text-[#F1F5F9]">{(session?.mode || form.mode).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] mb-1">Task ID</p>
                <p className="text-sm font-medium text-[#F1F5F9] truncate max-w-[170px]">{session?.celery_task_id || '-'}</p>
              </div>
            </div>
          </div>
          <div className="ml-6 pl-6 border-l border-[#334155]">
            <div className="mb-4">
              <p className="text-xs text-[#94A3B8] mb-1">Trades Today</p>
              <p className="text-2xl font-bold text-[#F1F5F9]">
                {session?.trades_today || 0}/{session?.max_daily_trades || form.max_daily_trades}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#94A3B8]">Last Signal</p>
                <p className="text-xs font-medium text-[#16A34A]">
                  {(session?.last_signal || 'hold').toUpperCase()} {Math.round(normalizePct(session?.last_confidence))}%
                </p>
              </div>
              <div className="w-40 h-2 bg-[#334155] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7C3AED] rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, normalizePct(session?.last_confidence)))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155] mb-6">
        <h3 className="font-semibold text-[#F1F5F9] mb-4">Configuration</h3>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#F1F5F9] mb-2">Symbol</label>
              <select
                value={form.symbol}
                onChange={(e) => {
                  const selected = SYMBOL_OPTIONS.find((s) => s.value === e.target.value);
                  updateForm({
                    symbol: e.target.value,
                    product_id: selected?.productId || 27
                  });
                }}
                disabled={isActive}
                className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              >
                {SYMBOL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#F1F5F9] mb-2">Order Size</label>
              <input
                type="number"
                value={form.order_size}
                onChange={(e) => updateForm({ order_size: parseInt(e.target.value || '1') })}
                min={1}
                disabled={isActive}
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
                  onChange={(e) => updateForm({ confidence_threshold: Number(e.target.value) / 100 })}
                  disabled={isActive}
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
                value={form.max_daily_trades}
                onChange={(e) => updateForm({ max_daily_trades: parseInt(e.target.value || '10') })}
                min={1}
                disabled={isActive}
                className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-[#F1F5F9] mb-2">Mode</label>
            <select
              value={form.mode}
              onChange={(e) => updateForm({ mode: e.target.value as 'paper' | 'live' })}
              disabled={isActive}
              className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="paper">Paper</option>
              <option value="live">Live</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#F1F5F9] mb-2">Max Order Size</label>
            <input
              type="number"
              value={form.max_order_size}
              onChange={(e) => updateForm({ max_order_size: parseInt(e.target.value || '10') })}
              min={1}
              disabled={isActive}
              className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#F1F5F9] mb-2">Cooldown (sec)</label>
            <input
              type="number"
              value={form.cooldown_seconds}
              onChange={(e) => updateForm({ cooldown_seconds: parseInt(e.target.value || '60') })}
              min={5}
              disabled={isActive}
              className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm text-[#F1F5F9] mb-2">Stop Loss %</label>
            <input
              type="number"
              value={form.stop_loss_pct}
              onChange={(e) => updateForm({ stop_loss_pct: Number(e.target.value || '2') })}
              min={0.1}
              step={0.1}
              disabled={isActive}
              className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#F1F5F9] mb-2">Take Profit %</label>
            <input
              type="number"
              value={form.take_profit_pct}
              onChange={(e) => updateForm({ take_profit_pct: Number(e.target.value || '4') })}
              min={0.1}
              step={0.1}
              disabled={isActive}
              className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        <button
          onClick={isActive ? handleStop : handleStart}
          disabled={actionLoading}
          className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            isActive
              ? 'bg-transparent border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10'
              : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
          }`}
        >
          {actionLoading ? 'Please wait...' : isActive ? 'Stop AI Trader' : 'Start AI Trader'}
        </button>
      </div>

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
                  key={signal.id || index}
                  className={`border-b border-[#334155]/50 ${
                    index % 2 === 0 ? 'bg-[#0F172A]/30' : ''
                  }`}
                >
                  <td className="py-3 text-sm text-[#94A3B8]">
                    {signal.created_at_ts ? new Date(signal.created_at_ts * 1000).toLocaleTimeString() : '-'}
                  </td>
                  <td className="py-3 text-sm text-[#F1F5F9]">{selectedSymbolLabel}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        signal.signal?.toUpperCase() === 'BUY'
                          ? 'bg-[#16A34A]/10 text-[#16A34A]'
                          : signal.signal?.toUpperCase() === 'SELL'
                          ? 'bg-[#DC2626]/10 text-[#DC2626]'
                          : 'bg-[#94A3B8]/10 text-[#94A3B8]'
                      }`}
                    >
                      {(signal.signal || 'HOLD').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#334155] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#7C3AED] rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, normalizePct(signal.confidence)))}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#F1F5F9] w-8">{Math.round(normalizePct(signal.confidence))}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-[#94A3B8]">
                    {signal.signal?.toLowerCase() === 'hold' ? 'Skipped' : 'Executed'}
                  </td>
                </tr>
              ))}
              {!signals.length && (
                <tr>
                  <td className="py-6 text-sm text-[#94A3B8]" colSpan={5}>
                    No live signals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <p className="text-sm font-medium text-[#F1F5F9]">Signal & Risk Execution</p>
                <p className="text-xs text-[#94A3B8]">Predict, gate by risk controls, and execute</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
