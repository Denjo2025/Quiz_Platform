import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'

const isDev = import.meta.env.DEV

/**
 * useGameSocket — wraps native WebSocket with reconnect logic.
 * @param {Object} params
 * @param {string} params.roomCode
 * @param {'host'|'player'} params.role
 * @param {string} [params.token]    — required for host
 * @param {string} [params.nickname] — required for player (sent as first message)
 */
export function useGameSocket({ roomCode, role, token, nickname }) {
  const [lastMessage, setLastMessage] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const wsRef = useRef(null)
  const reconnectCount = useRef(0)
  const maxReconnects = 3
  const gameEndedRef = useRef(false)
  const unmountedRef = useRef(false)

  const getUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsHost = import.meta.env.VITE_WS_URL || window.location.host
    let url
    if (role === 'host') {
      url = `${protocol}://${wsHost}/ws/host/${roomCode}?token=${token}`
    } else {
      url = `${protocol}://${wsHost}/ws/player/${roomCode}`
    }
    console.log(`[WS] ${role} connecting to: ${url}`)
    return url
  }, [roomCode, role, token])

  const connect = useCallback(() => {
    if (unmountedRef.current) return
    if (!roomCode) return

    // For host, ensure we have a valid token before connecting
    if (role === 'host' && !token) {
      if (isDev) console.log('[WS] No token available, waiting...')
      setConnectionStatus('connecting')
      // Retry after short delay to see if token loads
      setTimeout(() => {
        if (!unmountedRef.current) connect()
      }, 500)
      return
    }

    // For player, ensure we have a nickname before connecting
    if (role === 'player' && !nickname) {
      if (isDev) console.log('[WS] No nickname available, waiting...')
      setConnectionStatus('connecting')
      setTimeout(() => {
        if (!unmountedRef.current) connect()
      }, 500)
      return
    }

    const url = getUrl()
    if (isDev) console.log(`[WS] Connecting to ${url}`)

    const ws = new WebSocket(url)
    wsRef.current = ws
    setConnectionStatus('connecting')

    ws.onopen = () => {
      if (isDev) console.log('[WS] Connected')
      reconnectCount.current = 0
      setConnectionStatus('connected')

      // For player role, immediately send player_join message
      if (role === 'player' && nickname) {
        ws.send(JSON.stringify({
          type: 'player_join',
          payload: { nickname },
        }))
      }
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        console.log(`[WS] ${role} received:`, msg.type, msg.payload)
        if (isDev) console.log('[WS] Received:', msg)
        if (msg.type === 'game_end') {
          gameEndedRef.current = true
        }
        setLastMessage(msg)
      } catch (e) {
        console.error('[WS] Failed to parse message', e)
      }
    }

    ws.onclose = (event) => {
      if (isDev) console.log('[WS] Closed:', event.code, event.reason)
      setConnectionStatus('disconnected')

      if (unmountedRef.current || gameEndedRef.current) return

      // Don't reconnect if closed due to invalid token (code 4001)
      if (event.code === 4001) {
        if (isDev) console.log('[WS] Invalid token, not reconnecting')
        setConnectionStatus('error')
        return
      }

      // Attempt reconnect with exponential backoff
      if (reconnectCount.current < maxReconnects) {
        const delay = Math.pow(2, reconnectCount.current) * 1000
        reconnectCount.current += 1
        if (isDev) console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectCount.current})`)
        setTimeout(connect, delay)
      } else {
        setConnectionStatus('error')
      }
    }

    ws.onerror = (error) => {
      if (isDev) console.error('[WS] Error:', error)
      setConnectionStatus('error')
    }
  }, [getUrl, role, nickname])

  useEffect(() => {
    unmountedRef.current = false
    gameEndedRef.current = false
    connect()

    return () => {
      unmountedRef.current = true
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted')
      }
    }
  }, [connect])

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('[WS] Cannot send — not connected')
    }
  }, [])

  return { sendMessage, lastMessage, connectionStatus }
}
