import React, { useState, useEffect } from 'react'
import { useCosmosStore } from '../store/cosmosStore'

export default function JoinScreen() {
  const { user, spaces, fetchSpaces, joinCosmos } = useCosmosStore()
  const [selectedSpace, setSelectedSpace] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    fetchSpaces()
  }, [fetchSpaces])

  useEffect(() => {
    if (spaces && spaces.length > 0 && !selectedSpace) {
      setSelectedSpace(spaces[0].id)
    }
  }, [spaces, selectedSpace])

  const handleJoin = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!selectedSpace || !user) return
    setIsConnecting(true)
    
    // Artificial delay for premium feel
    setTimeout(() => {
      joinCosmos(selectedSpace)
    }, 800)
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-cosmos-space p-6 overflow-y-auto">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-10 sm:px-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-600/20 border border-blue-400/30 text-blue-400 font-display text-xl"
               style={{ textShadow: '0 0 10px rgba(96, 165, 250, 0.5)' }}>
            {user.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-display text-[10px] tracking-[0.3em] text-cosmos-aura uppercase opacity-50">Authenticated Profile</div>
            <div className="font-display text-lg tracking-wider text-cosmos-comet uppercase">{user.username}</div>
          </div>
        </div>

        {/* Space Selection Card */}
        <div 
          className="relative p-8 sm:p-10"
          style={{
            background: 'rgba(5, 8, 17, 0.85)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            backdropFilter: 'blur(20px)',
            clipPath: 'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)',
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="mb-8">
            <h1 className="font-display text-xl tracking-[0.2em] text-cosmos-comet mb-2 uppercase">Establish Manifestation</h1>
            <p className="font-display text-[10px] text-cosmos-dust tracking-widest uppercase opacity-60">Select your destination in the virtual office</p>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-10 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar pointer-events-auto">
            {spaces && spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => setSelectedSpace(space.id)}
                className={`group flex items-center justify-between p-4 transition-all duration-300 relative ${
                  selectedSpace === space.id 
                    ? 'bg-blue-600/20 border-blue-500/40' 
                    : 'bg-slate-900/40 border-cosmos-dust/10 hover:border-cosmos-dust/30'
                }`}
                style={{
                  border: '1px solid',
                  clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)'
                }}
              >
                <div className="flex flex-col items-start px-2">
                  <span className={`font-display text-xs tracking-widest uppercase transition-colors ${
                    selectedSpace === space.id ? 'text-blue-400' : 'text-cosmos-comet'
                  }`}>
                    {space.name || space.id.replace('-', ' ')}
                  </span>
                  <span className="font-display text-[9px] text-cosmos-dust/50 tracking-wider lowercase mt-1 text-left">
                    {space.description}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-2">
                  <div className="text-right">
                    <div className="font-display text-[10px] text-cosmos-aurora/80">{space.userCount}</div>
                    <div className="font-display text-[8px] text-cosmos-dust/30 uppercase tracking-tighter">Nearby</div>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    selectedSpace === space.id ? 'bg-blue-400 animate-pulse' : 'bg-cosmos-dust/20'
                  }`} />
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleJoin}
            disabled={!selectedSpace || isConnecting}
            className="w-full py-4 font-display text-xs tracking-[0.4em] uppercase bg-blue-600/10 border border-blue-600/30 text-blue-400 hover:bg-blue-600/20 transition-all disabled:opacity-20 flex items-center justify-center pointer-events-auto"
            style={{ clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)' }}
          >
            {isConnecting ? 'Establishing Link...' : 'Enter Cosmos'}
          </button>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => useCosmosStore.getState().logout()}
            className="font-display text-[10px] tracking-[0.2em] text-pink-500/50 hover:text-pink-500 transition-colors uppercase pointer-events-auto"
          >
            Switch Account / Logout
          </button>
        </div>
      </div>
    </div>
  )
}
