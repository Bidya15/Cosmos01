import React, { useState, useEffect, useRef } from 'react'
import { useCosmosStore } from '../store/cosmosStore'

export default function ProximityToast() {
  const { connections, users } = useCosmosStore()
  const [toasts, setToasts] = useState([])
  const prevConnectionsRef = useRef(new Set())

  useEffect(() => {
    const prev = prevConnectionsRef.current

    // Detect new connections
    for (const uid of connections) {
      if (!prev.has(uid)) {
        const user = users[uid]
        if (user) {
          const id = `toast_${Date.now()}_${uid}`
          setToasts(t => [...t, { id, user, type: 'enter' }])
          setTimeout(() => {
            setToasts(t => t.filter(toast => toast.id !== id))
          }, 3500)
        }
      }
    }

    // Detect disconnections
    for (const uid of prev) {
      if (!connections.has(uid)) {
        const user = users[uid]
        if (user) {
          const id = `toast_${Date.now()}_${uid}_left`
          setToasts(t => [...t, { id, user, type: 'leave' }])
          setTimeout(() => {
            setToasts(t => t.filter(toast => toast.id !== id))
          }, 2500)
        }
      }
    }

    prevConnectionsRef.current = new Set(connections)
  }, [connections])

  if (toasts.length === 0) return null

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="message-enter flex items-center gap-3 px-5 py-3 font-display text-xs tracking-wider"
          style={{
            background: toast.type === 'enter'
              ? 'rgba(6, 182, 212, 0.15)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${toast.type === 'enter' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
            backdropFilter: 'blur(10px)',
            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
          }}
        >
          <div className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: toast.user.color,
              boxShadow: `0 0 6px ${toast.user.color}`,
            }} />
          <span className="text-cosmos-comet">{toast.user.username}</span>
          <span style={{ color: toast.type === 'enter' ? '#06b6d4' : '#94a3b8' }}>
            {toast.type === 'enter' ? '◎ signal acquired' : '◌ signal lost'}
          </span>
        </div>
      ))}
    </div>
  )
}
