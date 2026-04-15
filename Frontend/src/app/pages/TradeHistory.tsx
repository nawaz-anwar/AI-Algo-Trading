import { Search } from 'lucide-react';

const stats = [
  { label: 'Total P&L', value: '+₹12,450', color: 'green' },
  { label: 'Win Rate', value: '68.5%', color: 'blue' },
  { label: 'Total Trades', value: '247', color: 'gray' },
];

const trades = [
  {
    date: 'Apr 15, 14:32',
    symbol: 'BTC/USD',
    strategy: 'EMA Crossover',
    side: 'BUY',
    size: '0.05',
    entry: '68,450',
    exit: '69,120',
    pnl: '+₹2,340',
    status: 'Closed',
    pnlPositive: true,
  },
  {
    date: 'Apr 15, 13:18',
    symbol: 'ETH/USD',
    strategy: 'AI Trader',
    side: 'SELL',
    size: '2.5',
    entry: '3,420',
    exit: '-',
    pnl: '-₹580',
    status: 'Open',
    pnlPositive: false,
  },
  {
    date: 'Apr 15, 11:05',
    symbol: 'SOL/USD',
    strategy: 'RSI Strategy',
    side: 'BUY',
    size: '15',
    entry: '148.50',
    exit: '152.20',
    pnl: '+₹1,150',
    status: 'Closed',
    pnlPositive: true,
  },
  {
    date: 'Apr 14, 16:42',
    symbol: 'BTC/USD',
    strategy: 'MACD Strategy',
    side: 'SELL',
    size: '0.08',
    entry: '67,200',
    exit: '66,800',
    pnl: '+₹890',
    status: 'Closed',
    pnlPositive: true,
  },
  {
    date: 'Apr 14, 15:20',
    symbol: 'MATIC/USD',
    strategy: 'EMA Crossover',
    side: 'BUY',
    size: '500',
    entry: '0.82',
    exit: '0.79',
    pnl: '-₹1,520',
    status: 'Closed',
    pnlPositive: false,
  },
  {
    date: 'Apr 14, 12:55',
    symbol: 'ETH/USD',
    strategy: 'AI Trader',
    side: 'BUY',
    size: '3.2',
    entry: '3,380',
    exit: '3,450',
    pnl: '+₹2,280',
    status: 'Closed',
    pnlPositive: true,
  },
  {
    date: 'Apr 14, 10:30',
    symbol: 'SOL/USD',
    strategy: 'RSI Strategy',
    side: 'SELL',
    size: '20',
    entry: '150.20',
    exit: '148.90',
    pnl: '+₹680',
    status: 'Closed',
    pnlPositive: true,
  },
  {
    date: 'Apr 13, 18:15',
    symbol: 'BTC/USD',
    strategy: 'EMA Crossover',
    side: 'BUY',
    size: '0.06',
    entry: '66,800',
    exit: '67,500',
    pnl: '+₹1,420',
    status: 'Closed',
    pnlPositive: true,
  },
];

export function TradeHistory() {
  return (
    <div className="p-8 max-w-[1200px]">
      {/* Header */}
      <h1 className="text-3xl font-bold text-[#F1F5F9] mb-6">Trade History</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
            <p className="text-sm text-[#94A3B8] mb-1">{stat.label}</p>
            <p
              className={`text-2xl font-bold ${
                stat.color === 'green'
                  ? 'text-[#16A34A]'
                  : stat.color === 'blue'
                  ? 'text-[#2563EB]'
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
            <select className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]">
              <option>All Symbols</option>
              <option>BTC/USD</option>
              <option>ETH/USD</option>
              <option>SOL/USD</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-2">Strategy</label>
            <select className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]">
              <option>All Strategies</option>
              <option>EMA Crossover</option>
              <option>RSI Strategy</option>
              <option>AI Trader</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-2">Date Range</label>
            <select className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search trades..."
                className="w-full pl-10 pr-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trade Table */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
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
                  key={index}
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
                  <td className="px-6 py-4 text-sm text-[#94A3B8]">{trade.entry}</td>
                  <td className="px-6 py-4 text-sm text-[#94A3B8]">{trade.exit}</td>
                  <td
                    className={`px-6 py-4 text-sm font-medium ${
                      trade.pnlPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#334155]">
          <p className="text-sm text-[#94A3B8]">Showing 1-8 of 247 trades</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-[#334155] text-sm text-[#F1F5F9] rounded-lg hover:bg-[#475569] transition-colors">
              Previous
            </button>
            <button className="px-3 py-1.5 bg-[#2563EB] text-sm text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
              1
            </button>
            <button className="px-3 py-1.5 bg-[#334155] text-sm text-[#F1F5F9] rounded-lg hover:bg-[#475569] transition-colors">
              2
            </button>
            <button className="px-3 py-1.5 bg-[#334155] text-sm text-[#F1F5F9] rounded-lg hover:bg-[#475569] transition-colors">
              3
            </button>
            <button className="px-3 py-1.5 bg-[#334155] text-sm text-[#F1F5F9] rounded-lg hover:bg-[#475569] transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
