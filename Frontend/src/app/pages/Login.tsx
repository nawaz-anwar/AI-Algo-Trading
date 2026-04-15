import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Code2, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../api';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await login(email, password);
        navigate('/dashboard');
      } else {
        // Sign up
        const userCredential = await register(email, password);
        
        // Create user profile in backend
        const token = await userCredential.user.getIdToken();
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            full_name: fullName || email.split('@')[0]
          })
        });
        
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4">
      <div className="w-full max-w-[480px] bg-[#1E293B] rounded-xl p-8 border border-[#334155]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center justify-center mb-3">
            <Code2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">CryptoAlgo</h1>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-6 bg-[#0F172A] p-1 rounded-lg">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              isLogin
                ? 'bg-[#2563EB] text-white'
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              !isLogin
                ? 'bg-[#2563EB] text-white'
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm text-[#F1F5F9] mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-[#F1F5F9] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[#F1F5F9] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        {/* Forgot Password */}
        <div className="mt-4 text-center">
          <a href="#" className="text-sm text-[#2563EB] hover:text-[#1D4ED8]">
            Forgot password?
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#334155] text-center">
          <p className="text-sm text-[#94A3B8]">Powered by Delta Exchange India</p>
        </div>
      </div>
    </div>
  );
}
