import React, { useEffect, useState } from 'react'
import { useCosmosStore } from '../store/cosmosStore'
import { StellarTicker, ActivityFeed } from './WorldEvents'

const WORLD_WIDTH = 2400
const WORLD_HEIGHT = 1800
const MINIMAP_W = 160
const MINIMAP_H = 120

function Minimap() {
  const { localUser, users, connections } = useCosmosStore()

  if (!localUser) return null

  const scaleX = MINIMAP_W / WORLD_WIDTH
  const scaleY = MINIMAP_H / WORLD_HEIGHT

  return (
    <div className="relative" style={{
      width: MINIMAP_W,
      height: MINIMAP_H,
      background: 'rgba(5, 8, 17, 0.85)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      backdropFilter: 'blur(10px)',
      clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
    }}>
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(#1a2d54 1px, transparent 1px), linear-gradient(90deg, #1a2d54 1px, transparent 1px)',
          backgroundSize: `${80 * scaleX}px ${80 * scaleY}px`,
        }} />

      {Object.values(users).map(user => (
        <div
          key={user.id}
          className="absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            left: user.x * scaleX,
            top: user.y * scaleY,
            backgroundColor: user.color,
            opacity: connections.has(user.id) ? 1 : 0.5,
            boxShadow: connections.has(user.id) ? `0 0 4px ${user.color}` : 'none',
          }}
        />
      ))}

      <div
        className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          left: localUser.x * scaleX,
          top: localUser.y * scaleY,
          backgroundColor: '#06b6d4',
          boxShadow: '0 0 8px rgba(6, 182, 212, 0.8)',
          zIndex: 10,
        }}
      />

      <div className="absolute bottom-1 right-2 font-display text-xs text-cosmos-dust/40 tracking-wider">
        MAP
      </div>
    </div>
  )
}

function ConnectionBadge({ userId }) {
  const { users, localUser } = useCosmosStore()
  const user = users[userId]
  if (!user) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2"
      style={{
        background: 'rgba(5, 8, 17, 0.8)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
      }}>
      <div className="connection-pulse w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: user.color, boxShadow: `0 0 6px ${user.color}` }} />
      <span className="font-display text-xs tracking-wider text-cosmos-comet">{user.username}</span>
      <span className="font-display text-xs text-cosmos-aurora/70">◉</span>
    </div>
  )
}

export default function HUD() {
  const { localUser, users, connections, showMinimap, showControls } = useCosmosStore()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  if (!localUser) return null

  const totalUsers = Object.keys(users).length + 1
  const connectedCount = connections.size

  return (
    <>
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(5,8,17,0.9), transparent)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"
              style={{ boxShadow: '0 0 8px rgba(6, 182, 212, 0.8)' }} />
            <span className="font-display text-sm tracking-widest text-cosmos-comet">COSMOS</span>
          </div>
          <div className="font-display text-xs text-cosmos-dust/60">
            {formatTime(elapsed)}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            <Stat label="USERS" value={totalUsers} />
            <Stat label="CONNECTED" value={connectedCount} accent />
          </div>
          <StellarTicker />
          <Stat label="POS" value={`${Math.round(localUser.x)}, ${Math.round(localUser.y)}`} mono />
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: localUser.color, boxShadow: `0 0 8px ${localUser.color}` }} />
              <span className="font-display text-xs tracking-wider text-cosmos-comet">
                {localUser.username}
              </span>
            </div>
            
            <div className="flex gap-1.5 px-2 py-1 bg-slate-900/40 border border-white/5 backdrop-blur-md" 
                 style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}>
              {['✨', '🔥', '🚀', '💎', '👽'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => useCosmosStore.getState().socket?.publish(Topics.REACTION, { emoji })}
                  className="hover:scale-125 transition-transform duration-200 text-sm filter drop-shadow-md"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => useCosmosStore.getState().logout()}
            className="px-3 py-1 font-display text-[10px] tracking-widest text-pink-500/60 hover:text-pink-400 border border-pink-500/20 hover:bg-pink-500/10 transition-all uppercase"
            style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="absolute left-4 bottom-4 flex flex-col gap-4 pointer-events-none max-w-[240px]">
        <ActivityFeed />
        {showMinimap && <Minimap />}
        {showControls && (
          <div className="font-display text-[9px] text-cosmos-dust/40 tracking-[0.2em] space-y-1 ml-1 uppercase">
            <div><span className="text-cosmos-aurora/70">WASD</span> / <span className="text-cosmos-aurora/70">↑↓←→</span> Move</div>
            <div><span className="text-cosmos-aurora/70">ENTER</span> Chat</div>
          </div>
        )}
      </div>

      {connectedCount > 0 && (
        <div className="absolute top-16 right-4 flex flex-col gap-1.5 pointer-events-none">
          <div className="font-display text-xs tracking-widest text-cosmos-aurora/60 text-right mb-1">
            SIGNALS
          </div>
          {[...connections].map(uid => (
            <ConnectionBadge key={uid} userId={uid} />
          ))}
        </div>
      )}
    </>
  )
}

function Stat({ label, value, accent, mono }) {
  return (
    <div className="text-center">
      <div className="font-display text-xs tracking-widest text-cosmos-dust/50">{label}</div>
      <div className={`font-display text-sm tracking-wider ${accent ? 'text-cosmos-aurora' : mono ? 'text-cosmos-dust' : 'text-cosmos-comet'}`}>
        {value}
      </div>
    </div>
  )
}
