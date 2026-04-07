import React, { useState, useEffect } from 'react'
import { useCosmosStore } from '../store/cosmosStore'

export function StellarTicker() {
  const { users, currentSpaceId } = useCosmosStore()
  const [index, setIndex] = useState(0)
  
  const stats = [
    `SIGNAL RADIUS: 280 UNITS`,
    `ACTIVE COORDINATES: ${currentSpaceId?.toUpperCase() || 'UNKNOWN'}`,
    `NETWORK CAPACITY: ${Object.keys(users).length + 1} / 128`,
    `ENIGMA PROTOCOL: ANALYZING...`,
    `LATENCY: ${(Math.random() * 20 + 10).toFixed(1)} MS`,
  ]

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % stats.length), 5000)
    return () => clearInterval(timer)
  }, [stats.length])

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-cyan-950/20 border-x border-cyan-500/20 overflow-hidden min-w-[280px]">
      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      <div key={index} className="font-display text-[10px] tracking-[0.2em] text-cyan-400/80 uppercase animate-in slide-in-from-right-4 fade-in duration-700">
        {stats[index]}
      </div>
    </div>
  )
}

export function ActivityFeed() {
  const events = useCosmosStore(s => s.events)

  if (events.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 animate-in slide-in-from-left-4 fade-in duration-500">
      <div className="font-display text-[9px] tracking-[0.3em] text-white/30 uppercase ml-1 mb-1">
        Telemetry Log
      </div>
      {events.map((ev) => (
        <div 
          key={ev.id} 
          className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/40 border border-white/5 backdrop-blur-sm"
          style={{ 
            clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
            borderLeft: `2px solid ${ev.color}`
          }}
        >
          <span className="font-display text-[10px] text-white/40 opacity-50">
            {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="font-display text-[10px] tracking-wide text-white/80">
             {ev.text}
          </span>
        </div>
      ))}
    </div>
  )
}
