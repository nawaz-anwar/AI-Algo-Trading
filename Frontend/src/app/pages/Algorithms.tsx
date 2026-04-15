import { useState, useEffect } from 'react';
import { Info, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../api';

interface AlgoParam {
  name: string;
  type: string;
  default: number;
  min: number;
  max: number;
}

interface AlgoDefinition {
  id: number;
  name: string;
  description: string;
  params: AlgoParam[];
}

interface AlgoRun {
  id: string;
  algo_id: number;
  algo_name: string;
  symbol: string;
  status: string;
  params: any;
  started_at: any;
}

interface StrategyState {
  algo_id: number;
  symbol: string;
  product_id: number;
  order_size: number;
  params: any;
}

export function Algorithms() {
  const [algos, setAlgos] = useState<AlgoDefinition[]>([]);
  const [activeRuns, setActiveRuns] = useState<AlgoRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [strategyStates, setStrategyStates] = useState<{ [key: number]: StrategyState }>({});
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchData();
    // Refresh active runs every 10 seconds
    const interval = setInterval(fetchActiveRuns, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [algosData, runsData] = await Promise.all([
        api.getAlgos(),
        api.getActiveAlgos()
      ]);
      
      setAlgos(algosData);
      setActiveRuns(runsData);
      
      // Initialize strategy states with defaults
      const initialStates: { [key: number]: StrategyState } = {};
      algosData.forEach((algo: AlgoDefinition) => {
        const defaultParams: any = {};
        algo.params.forEach(param => {
          defaultParams[param.name] = param.default;
        });
        
        initialStates[algo.id] = {
          algo_id: algo.id,
          symbol: 'BTCUSD',
          product_id: 27, // BTCUSD product ID
          order_size: 1,
          params: defaultParams
        };
      });
      setStrategyStates(initialStates);
      
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch algos:', err);
      setError(err.message || 'Failed to load algorithms');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveRuns = async () => {
    try {
      const runsData = await api.getActiveAlgos();
      setActiveRuns(runsData);
    } catch (err) {
      console.error('Failed to fetch active runs:', err);
    }
  };

  const isAlgoRunning = (algoId: number) => {
    return activeRuns.some(run => run.algo_id === algoId && run.status === 'running');
  };

  const getRunningAlgo = (algoId: number) => {
    return activeRuns.find(run => run.algo_id === algoId && run.status === 'running');
  };

  const handleStartAlgo = async (algoId: number) => {
    setActionLoading({ ...actionLoading, [algoId]: true });
    
    try {
      const state = strategyStates[algoId];
      const algo = algos.find(a => a.id === algoId);
      
      if (!algo) return;
      
      await api.startAlgo({
        algo_id: algoId,
        algo_name: algo.name,
        symbol: state.symbol,
        product_id: state.product_id,
        order_size: state.order_size,
        params: state.params
      });
      
      // Refresh active runs
      await fetchActiveRuns();
    } catch (err: any) {
      console.error('Failed to start algo:', err);
      alert(err.message || 'Failed to start algorithm');
    } finally {
      setActionLoading({ ...actionLoading, [algoId]: false });
    }
  };

  const handleStopAlgo = async (algoId: number) => {
    const runningAlgo = getRunningAlgo(algoId);
    if (!runningAlgo) return;
    
    setActionLoading({ ...actionLoading, [algoId]: true });
    
    try {
      await api.stopAlgo(runningAlgo.id);
      // Refresh active runs
      await fetchActiveRuns();
    } catch (err: any) {
      console.error('Failed to stop algo:', err);
      alert(err.message || 'Failed to stop algorithm');
    } finally {
      setActionLoading({ ...actionLoading, [algoId]: false });
    }
  };

  const updateStrategyState = (algoId: number, updates: Partial<StrategyState>) => {
    setStrategyStates({
      ...strategyStates,
      [algoId]: { ...strategyStates[algoId], ...updates }
    });
  };

  const updateParam = (algoId: number, paramName: string, value: number) => {
    const state = strategyStates[algoId];
    updateStrategyState(algoId, {
      params: { ...state.params, [paramName]: value }
    });
  };

  const getAlgoType = (name: string): 'Trend' | 'Momentum' | 'Volatility' => {
    if (name.includes('EMA')) return 'Trend';
    if (name.includes('RSI') || name.includes('MACD')) return 'Momentum';
    return 'Volatility';
  };

  const getSymbolOptions = () => [
    { value: 'BTCUSD', label: 'BTC/USD', productId: 27 },
    { value: 'ETHUSD', label: 'ETH/USD', productId: 3136 },
    { value: 'SOLUSD', label: 'SOL/USD', productId: 139511 }
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-4" />
          <p className="text-[#94A3B8]">Loading algorithms...</p>
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
            <h3 className="text-lg font-semibold text-[#DC2626] mb-2">Failed to Load Algorithms</h3>
            <p className="text-sm text-[#DC2626]/80 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        {algos.map((algo) => {
          const isRunning = isAlgoRunning(algo.id);
          const state = strategyStates[algo.id] || {};
          const isLoading = actionLoading[algo.id];
          const type = getAlgoType(algo.name);

          return (
            <div key={algo.id} className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-[#F1F5F9]">{algo.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      type === 'Trend'
                        ? 'bg-[#2563EB]/10 text-[#2563EB]'
                        : 'bg-[#7C3AED]/10 text-[#7C3AED]'
                    }`}
                  >
                    {type}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{algo.description}</p>
              </div>

              {/* Supported Pairs */}
              <div className="mb-4">
                <p className="text-xs text-[#94A3B8] mb-2">Supported Pairs</p>
                <div className="flex flex-wrap gap-1.5">
                  {getSymbolOptions().map((option) => (
                    <span
                      key={option.value}
                      className="px-2 py-1 bg-[#334155]/50 text-xs text-[#F1F5F9] rounded"
                    >
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[#334155] my-4" />

              {/* Parameters */}
              <div className="space-y-3 mb-4">
                {/* Main parameters in grid */}
                <div className="grid grid-cols-2 gap-3">
                  {algo.params.slice(0, 2).map((param) => (
                    <div key={param.name}>
                      <label className="block text-xs text-[#94A3B8] mb-1 capitalize">
                        {param.name.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="number"
                        value={state.params?.[param.name] || param.default}
                        onChange={(e) => updateParam(algo.id, param.name, parseFloat(e.target.value))}
                        min={param.min}
                        max={param.max}
                        className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                        disabled={isRunning}
                      />
                    </div>
                  ))}
                </div>

                {/* Symbol selector */}
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Symbol</label>
                  <select
                    value={state.symbol}
                    onChange={(e) => {
                      const option = getSymbolOptions().find(o => o.value === e.target.value);
                      updateStrategyState(algo.id, {
                        symbol: e.target.value,
                        product_id: option?.productId || 27
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    disabled={isRunning}
                  >
                    {getSymbolOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Order size */}
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Order Size (contracts)</label>
                  <input
                    type="number"
                    value={state.order_size}
                    onChange={(e) => updateStrategyState(algo.id, { order_size: parseInt(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    disabled={isRunning}
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => isRunning ? handleStopAlgo(algo.id) : handleStartAlgo(algo.id)}
                disabled={isLoading}
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRunning
                    ? 'bg-transparent border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10'
                    : 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isRunning ? 'Stopping...' : 'Starting...'}
                  </span>
                ) : isRunning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
                    Stop Strategy
                  </span>
                ) : (
                  'Start Strategy'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
