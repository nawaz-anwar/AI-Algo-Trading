import { auth } from '../firebase'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const call = async (method: string, path: string, body?: any) => {
  const token = await auth.currentUser?.getIdToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || error.message || 'Request failed')
  }

  return res.json()
}

export const api = {
  // Auth
  verifyUser: (data: { email: string; full_name?: string }) =>
    call('POST', '/api/auth/verify', data),
  getProfile: () => call('GET', '/api/auth/profile'),

  // Dashboard
  getDashboard: () => call('GET', '/api/dashboard/data'),

  // Delta Exchange
  connectDelta: (data: { api_key: string; api_secret: string }) =>
    call('POST', '/api/delta/connect', data),
  testDelta: () => call('GET', '/api/delta/test'),
  getProducts: () => call('GET', '/api/delta/products'),

  // Algorithms
  getAlgos: () => call('GET', '/api/algos'),
  startAlgo: (data: any) => call('POST', '/api/algos/start', data),
  stopAlgo: (run_id: string) => call('POST', '/api/algos/stop', { run_id }),
  getActiveAlgos: () => call('GET', '/api/algos/active'),

  // AI Trader
  startAI: (data: {
    symbol: string
    product_id: number
    order_size: number
    confidence_threshold?: number
    max_daily_trades?: number
  }) => call('POST', '/api/ai/start', data),
  stopAI: (session_id: string) => call('POST', '/api/ai/stop', { session_id }),
  getAIStatus: (session_id: string) => call('GET', `/api/ai/status/${session_id}`),
  trainModel: (symbol: string) => call('POST', '/api/ai/train', { symbol }),

  // Trades
  getTradeHistory: (limit: number = 50) => call('GET', `/api/trades/history?limit=${limit}`),
  getTradeStats: () => call('GET', '/api/trades/stats')
}
