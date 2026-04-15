import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../api';

interface Trade {
  id: string;
  date: string;
  symbol: string;
  strategy: string;
  side: string;
  size: string;
  entry_price: string;
  exit_price: string;
  pnl: string;
  pnl_usdt: number;
  status: string;
  pnl_positive: boolean;
  delta_order_id?: string;
}

interface TradeStats {
  total_trades: number;
  total_pnl: string;
  win_rate: string;
  open_trades: number;
}

interface TradeHistoryResponse {
  trades: Trade[];
  total: number;
  filtered: number;
  limit: number;
}

export function TradeHistory() {
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    symbol: '',
    strategy: '',
    days: '',
    search: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.symbol && filters.symbol !== 'all') params.append('symbol', filters.symbol);
      if (filters.strategy && filters.strategy !== 'all') params.append('strategy', filters.strategy);
      if (filters.days && filters.days !== 'all') params.append('days', filters.days);
      
      // Fetch both stats and history
      const [statsResponse, historyResponse] = await Promise.all([
        api.getTradeStats(),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/trades/history?${params}`, {
          headers: {
            'Authorization': `Bearer ${await (await import('../../firebase')).auth.currentUser?.getIdToken()}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.json()) as Promise<TradeHistoryResponse>
      ]);

      setStats(statsResponse);
      setTrades(historyResponse.trades || []);
    } catch (err) {
      console.error('Failed to fetch trade data:', err);
      setError('Failed to load trade data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1200px]">
        <h1 className="text-3xl font-bold text-[#F1F5F9] mb-6">Trade History</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-[#94A3B8]">Loading trade history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1200px]">
        <h1 className="text-3xl font-bold text-[#F1F5F9] mb-6">Trade History</h1>
        <div className="bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl p-4">
          <p className="text-[#DC2626]">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statsCards = [
    { 
      label: 'Total P&L', 
      value: stats?.total_pnl || '$0.00', 
      color: stats?.total_pnl?.startsWith('-') ? 'red' : 'green' 
    },
    { 
      label: 'Win Rate', 
      value: stats?.win_rate || '0%', 
      color: 'blue' 
    },
    { 
      label: 'Total Trades', 
      value: stats?.total_trades?.toString() || '0', 
      color: 'gray' 
    },
  ];

  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <h1 className="text-3xl font-bold text-[#F1F5F9] mb-6">Trade History</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
            <p className="text-sm text-[#94A3B8] mb-1">{stat.label}</p>
            <p
              className={`text-2xl font-bold ${
                stat.color === 'green'
                  ? 'text-[#16A34A]'
                  : stat.color === 'blue'
                  ? 'text-[#2563EB]'
                  : stat.color === 'red'
                  ? 'text-[#DC2626]'
                  : 'text-[#F1F5F9]'
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#1E293B] rounded-xl p-4 border border-[#334155] mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-[#94A3B8] mb-2">Symbol</label>
            <select 
              value={filters.symbol}
              onChange={(e) => handleFilterChange('symbol', e.target.value)}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="">All Symbols</option>
              <option value="BTCUSD">BTC/USD</option>
              <option value="ETHUSD">ETH/USD</option>
              <option value="SOLUSD">SOL/USD</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-2">Strategy</label>
            <select 
              value={filters.strategy}
              onChange={(e) => handleFilterChange('strategy', e.target.value)}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="">All Strategies</option>
              <option value="EMA Crossover">EMA Crossover</option>
              <option value="RSI Strategy">RSI Strategy</option>
              <option value="MACD Strategy">MACD Strategy</option>
              <option value="AI Trader">AI Trader</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-2">Date Range</label>
            <select 
              value={filters.days}
              onChange={(e) => handleFilterChange('days', e.target.value)}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search trades..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trade Table */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        {trades.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[#94A3B8] mb-2">No trades found</p>
            <p className="text-sm text-[#64748B]">
              {stats?.total_trades === 0 
                ? "Start trading with our algorithms to see your trade history here."
                : "Try adjusting your filters to see more trades."
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155] bg-[#0F172A]/50">
                    <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-4">Date</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-4">Symbol</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-4">Strategy</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-4">Side</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-4">Size</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-4">Entry</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-4">Exit</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-4">P&L</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, index) => (
                    <tr
                      key={trade.id}
                      className={`border-b border-[#334155]/50 ${
                        index % 2 === 0 ? 'bg-[#0F172A]/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{trade.date}</td>
                      <td className="px-6 py-4 text-sm text-[#F1F5F9] font-medium">{trade.symbol}</td>
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{trade.strategy}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            trade.side === 'BUY'
                              ? 'bg-[#16A34A]/10 text-[#16A34A]'
                              : 'bg-[#DC2626]/10 text-[#DC2626]'
                          }`}
                        >
                          {trade.side}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#F1F5F9]">{trade.size}</td>
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{trade.entry_price}</td>
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{trade.exit_price}</td>
                      <td
                        className={`px-6 py-4 text-sm font-medium ${
                          trade.pnl_positive ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {trade.pnl}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`flex items-center gap-2 text-xs ${
                            trade.status === 'Open' ? 'text-[#2563EB]' : 'text-[#94A3B8]'
                          }`}
                        >
                          {trade.status === 'Open' && (
                            <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
                          )}
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#334155]">
              <p className="text-sm text-[#94A3B8]">
                Showing {trades.length} of {stats?.total_trades || 0} trades
              </p>
              <button 
                onClick={fetchData}
                className="px-3 py-1.5 bg-[#2563EB] text-sm text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
              >
                Refresh
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
