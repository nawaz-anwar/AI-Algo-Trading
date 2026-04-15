import { useState, useEffect } from 'react';
import { Sparkline } from '../components/Sparkline';
import { api } from '../../api';
import { Loader2, AlertCircle } from 'lucide-react';

const walletSparkline = [42000, 43500, 42800, 45200, 44100, 46300, 45800, 47200, 46500, 48100];
const btcSparkline = [65200, 66100, 65800, 67200, 66500, 68100, 67800, 69200, 68500, 69800];
const ethSparkline = [3200, 3280, 3150, 3320, 3290, 3410, 3380, 3450, 3420, 3480];
const solSparkline = [142, 145, 143, 148, 146, 151, 149, 153, 151, 155];

interface DashboardData {
  wallet: {
    total_balance_inr: number;
    assets: {
      [key: string]: {
        balance: number;
        balance_inr: number;
        available_balance: number;
      };
    };
  };
  prices: {
    [key: string]: {
      symbol: string;
      price: number;
      change_24h: number;
      change_percent_24h: string;
      high_24h: number;
      low_24h: number;
      volume_24h: number;
    };
  };
  positions: Array<{
    symbol: string;
    side: string;
    size: number;
    entry_price: number;
    mark_price: number;
    unrealized_pnl: number;
    unrealized_pnl_percent: number;
  }>;
  active_algos: Array<{
    id: string;
    name: string;
    symbol: string;
    status: string;
  }>;
  delta_connected: boolean;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.getDashboard();
      setData(response);
      setError('');
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-4" />
          <p className="text-[#94A3B8]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-[#DC2626]/10 border border-[#DC2626] rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-[#DC2626] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-[#DC2626] mb-2">Failed to Load Dashboard</h3>
            <p className="text-sm text-[#DC2626]/80 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (value: number, currency: string = 'INR') => {
    if (currency === 'INR') {
      return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Dashboard</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#16A34A]/10 border border-[#16A34A]/30 rounded-lg">
          <div className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
          <span className="text-sm text-[#16A34A] font-medium">Delta Connected</span>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155] mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-[#94A3B8] mb-1">Total Balance</p>
            <h2 className="text-4xl font-bold text-[#F1F5F9]">
              {formatCurrency(data.wallet.total_balance_inr)}
            </h2>
            <p className="text-sm text-[#94A3B8] mt-2">
              USD: {formatCurrency(data.wallet.assets.USD?.balance || 0, 'USD')}
            </p>
          </div>
          <div className="flex gap-2">
            {data.wallet.assets.BTC && data.wallet.assets.BTC.balance > 0 && (
              <div className="px-3 py-1.5 bg-[#EA580C]/10 border border-[#EA580C]/30 rounded-full">
                <span className="text-xs font-medium text-[#EA580C]">BTC</span>
              </div>
            )}
            {data.wallet.assets.ETH && data.wallet.assets.ETH.balance > 0 && (
              <div className="px-3 py-1.5 bg-[#2563EB]/10 border border-[#2563EB]/30 rounded-full">
                <span className="text-xs font-medium text-[#2563EB]">ETH</span>
              </div>
            )}
            {(data.wallet.assets.USD || data.wallet.assets.USDT) && (
              <div className="px-3 py-1.5 bg-[#16A34A]/10 border border-[#16A34A]/30 rounded-full">
                <span className="text-xs font-medium text-[#16A34A]">USD</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-16">
          <Sparkline data={walletSparkline} color="#2563EB" height={64} />
        </div>
      </div>

      {/* Price Cards Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* BTC/USD */}
        <div className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#94A3B8]">BTC/USD</span>
            {data.prices.BTCUSD && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  parseFloat(data.prices.BTCUSD.change_percent_24h) >= 0
                    ? 'bg-[#16A34A]/10 text-[#16A34A]'
                    : 'bg-[#DC2626]/10 text-[#DC2626]'
                }`}
              >
                {formatPercent(data.prices.BTCUSD.change_percent_24h)}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-[#F1F5F9] mb-1">
            {data.prices.BTCUSD ? formatCurrency(data.prices.BTCUSD.price, 'USD') : '$--'}
          </p>
          {data.prices.BTCUSD && (
            <div className="flex items-center gap-3 text-xs text-[#94A3B8] mb-3">
              <span>H: {formatCurrency(data.prices.BTCUSD.high_24h, 'USD')}</span>
              <span>L: {formatCurrency(data.prices.BTCUSD.low_24h, 'USD')}</span>
            </div>
          )}
          <div className="h-12">
            <Sparkline
              data={btcSparkline}
              color={
                data.prices.BTCUSD && parseFloat(data.prices.BTCUSD.change_percent_24h) >= 0
                  ? '#16A34A'
                  : '#DC2626'
              }
              height={48}
            />
          </div>
        </div>

        {/* ETH/USD */}
        <div className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#94A3B8]">ETH/USD</span>
            {data.prices.ETHUSD && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  parseFloat(data.prices.ETHUSD.change_percent_24h) >= 0
                    ? 'bg-[#16A34A]/10 text-[#16A34A]'
                    : 'bg-[#DC2626]/10 text-[#DC2626]'
                }`}
              >
                {formatPercent(data.prices.ETHUSD.change_percent_24h)}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-[#F1F5F9] mb-1">
            {data.prices.ETHUSD ? formatCurrency(data.prices.ETHUSD.price, 'USD') : '$--'}
          </p>
          {data.prices.ETHUSD && (
            <div className="flex items-center gap-3 text-xs text-[#94A3B8] mb-3">
              <span>H: {formatCurrency(data.prices.ETHUSD.high_24h, 'USD')}</span>
              <span>L: {formatCurrency(data.prices.ETHUSD.low_24h, 'USD')}</span>
            </div>
          )}
          <div className="h-12">
            <Sparkline
              data={ethSparkline}
              color={
                data.prices.ETHUSD && parseFloat(data.prices.ETHUSD.change_percent_24h) >= 0
                  ? '#16A34A'
                  : '#DC2626'
              }
              height={48}
            />
          </div>
        </div>

        {/* SOL/USD */}
        <div className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#94A3B8]">SOL/USD</span>
            {data.prices.SOLUSD && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  parseFloat(data.prices.SOLUSD.change_percent_24h) >= 0
                    ? 'bg-[#16A34A]/10 text-[#16A34A]'
                    : 'bg-[#DC2626]/10 text-[#DC2626]'
                }`}
              >
                {formatPercent(data.prices.SOLUSD.change_percent_24h)}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-[#F1F5F9] mb-1">
            {data.prices.SOLUSD ? formatCurrency(data.prices.SOLUSD.price, 'USD') : '$--'}
          </p>
          {data.prices.SOLUSD && (
            <div className="flex items-center gap-3 text-xs text-[#94A3B8] mb-3">
              <span>H: {formatCurrency(data.prices.SOLUSD.high_24h, 'USD')}</span>
              <span>L: {formatCurrency(data.prices.SOLUSD.low_24h, 'USD')}</span>
            </div>
          )}
          <div className="h-12">
            <Sparkline
              data={solSparkline}
              color={
                data.prices.SOLUSD && parseFloat(data.prices.SOLUSD.change_percent_24h) >= 0
                  ? '#16A34A'
                  : '#DC2626'
              }
              height={48}
            />
          </div>
        </div>
      </div>

      {/* Active Algos and Open Positions Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Active Algos */}
        <div className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
          <h3 className="text-lg font-semibold text-[#F1F5F9] mb-4">Active Algos</h3>
          {data.active_algos.length > 0 ? (
            <div className="space-y-3">
              {data.active_algos.map((algo, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-[#F1F5F9]">{algo.name}</p>
                      <p className="text-xs text-[#94A3B8]">{algo.symbol}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#16A34A] capitalize">{algo.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-[#94A3B8]">No active algorithms</p>
              <p className="text-xs text-[#64748B] mt-1">Start an algorithm to see it here</p>
            </div>
          )}
        </div>

        {/* Open Positions */}
        <div className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
          <h3 className="text-lg font-semibold text-[#F1F5F9] mb-4">Open Positions</h3>
          {data.positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155]">
                    <th className="text-left text-xs font-medium text-[#94A3B8] pb-2">Symbol</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] pb-2">Side</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] pb-2">Size</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] pb-2">Entry</th>
                    <th className="text-right text-xs font-medium text-[#94A3B8] pb-2">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.positions.map((position, index) => (
                    <tr key={index} className="border-b border-[#334155]/50">
                      <td className="py-2 text-sm text-[#F1F5F9]">{position.symbol}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            position.side === 'BUY'
                              ? 'bg-[#16A34A]/10 text-[#16A34A]'
                              : 'bg-[#DC2626]/10 text-[#DC2626]'
                          }`}
                        >
                          {position.side}
                        </span>
                      </td>
                      <td className="py-2 text-sm text-[#F1F5F9]">{position.size}</td>
                      <td className="py-2 text-sm text-[#94A3B8]">
                        {formatCurrency(position.entry_price, 'USD')}
                      </td>
                      <td
                        className={`py-2 text-sm text-right font-medium ${
                          position.unrealized_pnl >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {formatCurrency(position.unrealized_pnl, 'USD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-[#94A3B8]">No open positions</p>
              <p className="text-xs text-[#64748B] mt-1">Your positions will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
