import React, { useState, useEffect, useRef } from 'react'
import { useCosmosStore, getRoomId } from '../store/cosmosStore'

/**
 * The Real-Time Chat HUD.
 * Automatically appears when users enter proximity.
 * Manages multiple "Quantum Links" (conversations) and handles smooth entry/exit animations.
 */
export default function ChatPanel() {
  const {
    localUser,
    users,
    connections,
    chatRooms,
    activeChatRoom,
    openChatRoom,
    closeChatRoom,
    addMessage,
  } = useCosmosStore()

  const [input, setInput] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // 1. MANAGE VISIBILITY: Handle smooth entrance/exit based on proximity connections
  useEffect(() => {
    if (connections.size > 0) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [connections.size])

  // 2. AUTO-FOCUS & SCROLL: UX helpers for active messaging
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChatRoom, chatRooms[activeChatRoom]?.messages])

  // 3. AUTO-SELECT: Ensure at least one room is active if connections exist
  useEffect(() => {
    if (!activeChatRoom && connections.size > 0) {
      const firstId = [...connections][0]
      openChatRoom(firstId)
    }
  }, [connections, activeChatRoom])

  // --- DERIVED STATE ---
  const connectedUsers = [...connections].map(id => users[id]).filter(Boolean)
  const activeRoom = activeChatRoom ? chatRooms[activeChatRoom] : null
  const otherUserId = activeRoom?.participants?.find(id => id !== localUser?.id)
  const otherUser = otherUserId ? users[otherUserId] : null

  /**
   * Dispatches the current input to both the local store and the remote socket.
   */
  const handleSendMessage = () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || !activeRoom || !localUser) return

    const message = {
      id: `msg_${Date.now()}`,
      senderId: localUser.id,
      text: trimmedInput,
      timestamp: Date.now(),
    }

    addMessage(activeRoom.id, message)

    // Publish to the synchronization layer
    const socket = useCosmosStore.getState().socket
    if (socket?.publish) {
      socket.publish('CHAT', {
        roomId: activeRoom.id,
        toUserId: otherUserId,
        message: trimmedInput,
        timestamp: message.timestamp,
      })
    }

    setInput('')
    inputRef.current?.focus()
  }

  if (!isVisible && connections.size === 0) return null

  return (
    <div className={`absolute right-4 bottom-4 w-80 flex flex-col gap-2 pointer-events-auto ${connections.size > 0 ? 'chat-enter' : 'chat-exit'}`}>
      
      {/* 1. CONNECTION TABS (Multi-User Support) */}
      {connectedUsers.length > 1 && (
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
          {connectedUsers.map(user => {
            const isActive = activeChatRoom === getRoomId(localUser.id, user.id)
            return (
              <button
                key={user.id}
                onClick={() => openChatRoom(user.id)}
                className="flex-shrink-0 px-3 py-1.5 font-display text-xs tracking-wider transition-all"
                style={{
                  background: isActive ? 'rgba(37, 99, 235, 0.3)' : 'rgba(9, 15, 30, 0.8)',
                  border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.15)'}`,
                  color: isActive ? '#e2e8f0' : '#94a3b8',
                  clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
                }}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: user.color, boxShadow: `0 0 6px ${user.color}` }} />
                {user.username}
              </button>
            )
          })}
        </div>
      )}

      {/* 2. CHAT WINDOW (Quantum Sync Interface) */}
      {activeRoom && (
        <div
          className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{
            background: 'rgba(5, 8, 17, 0.92)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            backdropFilter: 'blur(20px)',
            clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)',
            maxHeight: '380px',
          }}
        >
          {/* Header Section */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              {otherUser && (
                <>
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: otherUser.color, boxShadow: `0 0 8px ${otherUser.color}` }} />
                  <span className="font-display text-xs tracking-wider text-white/80">
                    {otherUser.username}
                  </span>
                </>
              )}
            </div>
            <button onClick={closeChatRoom} className="text-white/40 hover:text-white/80 transition-colors">✕</button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar" style={{ minHeight: 180, maxHeight: 240 }}>
            {activeRoom.messages.length === 0 ? (
              <div className="text-center py-8 opacity-40">
                <div className="font-display text-[10px] tracking-widest uppercase">Signal Established</div>
                <div className="font-body text-[11px] mt-1 italic">Begin transmission...</div>
              </div>
            ) : (
              activeRoom.messages.map((msg) => {
                const isLocal = msg.senderId === localUser?.id
                const sender = isLocal ? localUser : otherUser
                return (
                  <div key={msg.id} className={`flex ${isLocal ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%]">
                      {!isLocal && (
                        <div className="font-display text-[10px] mb-1 opacity-60 ml-2" 
                             style={{ color: sender?.color }}>{sender?.username}</div>
                      )}
                      <div
                        className="px-3 py-2 font-body text-sm text-white/90"
                        style={{
                          background: isLocal ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isLocal ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                          clipPath: isLocal 
                            ? 'polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' 
                            : 'polygon(0 0, 100% 0, 100% 100%, 6px 100%)',
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="px-3 py-3 border-t border-white/10 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Transmit signal..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-white/80 placeholder-white/20"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="text-[10px] font-display tracking-widest text-blue-400 hover:text-blue-300 transition-colors uppercase disabled:opacity-20"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
