import { useEffect, useRef, useState } from 'react'

interface PriceData {
  symbol: string
  mark_price: string
  last_price: string
  volume: string
  price_change_percent_24h: string
  high: string
  low: string
}

export function usePriceFeed(symbols: string[] = ['BTCUSD', 'ETHUSD', 'SOLUSD']) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'wss://cdn-ind.testnet.deltaex.org/live'

    const connect = () => {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            payload: {
              channels: [
                {
                  name: 'v2/ticker',
                  symbols: symbols
                }
              ]
            }
          })
        )
      }

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'v2/ticker') {
          setPrices((prev) => ({
            ...prev,
            [data.symbol]: data
          }))
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('WebSocket closed, reconnecting in 3s...')
        setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      wsRef.current?.close()
    }
  }, [symbols.join(',')])

  return prices
}
