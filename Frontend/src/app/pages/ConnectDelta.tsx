import { useState, useEffect } from 'react';
import { CheckCircle2, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../api';

export function ConnectDelta() {
  const [currentStep, setCurrentStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Check if Delta is already connected
  useEffect(() => {
    checkDeltaConnection();
  }, []);

  const checkDeltaConnection = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delta/test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Already connected, redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      // Not connected, show connection flow
      console.log('Delta not connected, showing connection flow');
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey || !apiSecret) {
      setError('Please enter both API Key and Secret');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = await getToken();
      
      // Call backend to connect Delta API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delta/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to connect Delta Exchange');
      }

      // Store wallet balance
      setWalletBalance(data.wallet);
      setCurrentStep(3);
    } catch (err: any) {
      console.error('Delta connection error:', err);
      setError(err.message || 'Invalid API credentials. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingConnection) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-4" />
          <p className="text-[#94A3B8]">Checking connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-[600px]">
        {/* Header */}
        <h1 className="text-3xl font-bold text-[#F1F5F9] mb-2 text-center">Connect Delta Exchange</h1>
        <p className="text-[#94A3B8] text-center mb-8">
          Link your Delta Exchange account to start automated trading
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8 px-12">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                currentStep >= 1
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#334155] text-[#94A3B8]'
              }`}
            >
              {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-xs text-[#94A3B8]">Instructions</span>
          </div>
          <div className={`flex-1 h-px mx-4 ${currentStep >= 2 ? 'bg-[#2563EB]' : 'bg-[#334155]'}`} />
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                currentStep >= 2
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#334155] text-[#94A3B8]'
              }`}
            >
              {currentStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
            </div>
            <span className="text-xs text-[#94A3B8]">API Credentials</span>
          </div>
          <div className={`flex-1 h-px mx-4 ${currentStep >= 3 ? 'bg-[#2563EB]' : 'bg-[#334155]'}`} />
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                currentStep >= 3
                  ? 'bg-[#16A34A] text-white'
                  : 'bg-[#334155] text-[#94A3B8]'
              }`}
            >
              {currentStep >= 3 ? <CheckCircle2 className="w-5 h-5" /> : '3'}
            </div>
            <span className="text-xs text-[#94A3B8]">Connected</span>
          </div>
        </div>

        {/* Step 1: Instructions */}
        {currentStep === 1 && (
          <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]">
            <div className="border-l-4 border-[#2563EB] bg-[#2563EB]/5 p-4 rounded-r-lg mb-6">
              <h3 className="font-semibold text-[#F1F5F9] mb-3">How to get your Delta API Key</h3>
              <ol className="space-y-2 text-sm text-[#94A3B8]">
                <li className="flex gap-2">
                  <span className="font-semibold text-[#2563EB]">1.</span>
                  <span>Log in to your Delta Exchange account</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[#2563EB]">2.</span>
                  <span>Navigate to Settings → API Management</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[#2563EB]">3.</span>
                  <span>Click "Create New API Key"</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[#2563EB]">4.</span>
                  <span>Enable trading permissions and copy both API Key and Secret</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[#2563EB]">5.</span>
                  <span>Paste your credentials in the next step</span>
                </li>
              </ol>
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: API Form */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {error && (
              <div className="bg-[#DC2626]/10 border border-[#DC2626] rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#DC2626] mb-1">Connection Failed</p>
                  <p className="text-xs text-[#DC2626]/80">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-[#F1F5F9] mb-2">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your Delta API Key"
                      disabled={loading}
                      className={`w-full px-4 py-3 pr-12 bg-[#0F172A] border ${
                        error ? 'border-[#DC2626]' : 'border-[#334155]'
                      } rounded-lg text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors disabled:opacity-50`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors disabled:opacity-50"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#F1F5F9] mb-2">API Secret</label>
                  <div className="relative">
                    <input
                      type={showApiSecret ? 'text' : 'password'}
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="Enter your Delta API Secret"
                      disabled={loading}
                      className={`w-full px-4 py-3 pr-12 bg-[#0F172A] border ${
                        error ? 'border-[#DC2626]' : 'border-[#334155]'
                      } rounded-lg text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors disabled:opacity-50`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiSecret(!showApiSecret)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors disabled:opacity-50"
                    >
                      {showApiSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#334155]/30 rounded-lg mb-6">
                <Lock className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                <p className="text-xs text-[#94A3B8]">
                  Your credentials are encrypted with AES-256 and stored securely
                </p>
              </div>

              <button
                onClick={handleConnect}
                disabled={loading || !apiKey || !apiSecret}
                className="w-full py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Connecting...' : 'Connect & Verify'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && (
          <div className="bg-[#1E293B] rounded-xl p-8 border border-[#334155] text-center">
            <div className="w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#16A34A]" />
            </div>
            <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Successfully Connected!</h2>
            <p className="text-[#94A3B8] mb-6">Your Delta Exchange account is now linked</p>

            {walletBalance && walletBalance.length > 0 && (
              <div className="bg-[#0F172A] rounded-lg p-4 mb-6">
                <p className="text-sm text-[#94A3B8] mb-3">Wallet Balances</p>
                <div className="space-y-2">
                  {walletBalance.slice(0, 3).map((asset: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-[#94A3B8]">{asset.asset_symbol}</span>
                      <span className="text-lg font-semibold text-[#F1F5F9]">
                        {parseFloat(asset.balance).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Back Button */}
        {currentStep > 1 && currentStep < 3 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="w-full mt-4 py-2.5 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
