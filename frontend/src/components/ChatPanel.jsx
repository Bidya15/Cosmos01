import React, { useState, useEffect, useRef } from 'react'
import { useCosmosStore, getRoomId } from '../store/cosmosStore'

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

  useEffect(() => {
    if (connections.size > 0 || Object.keys(chatRooms).length > 0) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [connections.size, chatRooms])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChatRoom, chatRooms[activeChatRoom]?.messages])

  useEffect(() => {
    if (!activeChatRoom) {
      if (chatRooms['GLOBAL']) {
        useCosmosStore.setState({ activeChatRoom: 'GLOBAL' })
      } else if (connections.size > 0) {
        const firstId = [...connections][0]
        openChatRoom(firstId)
      }
    }
  }, [connections, activeChatRoom, chatRooms])

  const connectedUsers = [...connections].map(id => users[id]).filter(Boolean)
  const activeRoom = activeChatRoom ? chatRooms[activeChatRoom] : null
  const isGlobalActive = activeChatRoom === 'GLOBAL'
  const otherUserId = isGlobalActive ? null : activeRoom?.participants?.find(id => id !== localUser?.id)
  const otherUser = otherUserId ? users[otherUserId] : null
  
  const availableRooms = Object.keys(chatRooms).filter(rid => rid === 'GLOBAL' || connections.has(rid.split('__').find(id => id !== localUser?.id)))
  if (chatRooms['GLOBAL'] && !availableRooms.includes('GLOBAL')) availableRooms.unshift('GLOBAL')

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

    const socket = useCosmosStore.getState().socket
    if (socket?.publish) {
      socket.publish('CHAT', {
        roomId: activeRoom.id,
        toUserId: isGlobalActive ? null : otherUserId,
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
      
      {(connectedUsers.length > 0 || chatRooms['GLOBAL']) && (
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
          {chatRooms['GLOBAL'] && (
            <button
              onClick={() => useCosmosStore.setState({ activeChatRoom: 'GLOBAL' })}
              className="flex-shrink-0 px-3 py-1.5 font-display text-xs tracking-[0.2em] transition-all uppercase"
              style={{
                background: activeChatRoom === 'GLOBAL' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(9, 15, 30, 0.8)',
                border: `1px solid ${activeChatRoom === 'GLOBAL' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.15)'}`,
                color: activeChatRoom === 'GLOBAL' ? '#fff' : '#94a3b8',
                clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
              }}
            >
              Global
            </button>
          )}
          {connectedUsers.map(user => {
            const rid = getRoomId(localUser.id, user.id)
            const isActive = activeChatRoom === rid
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
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              {isGlobalActive ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-cosmos-aurora shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <span className="font-display text-xs tracking-[0.2em] text-white/90 uppercase">Global Broadcast</span>
                </>
              ) : otherUser ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: otherUser.color, boxShadow: `0 0 8px ${otherUser.color}` }} />
                  <span className="font-display text-xs tracking-wider text-white/80">
                    {otherUser.username}
                  </span>
                </>
              ) : (
                 <span className="font-display text-xs tracking-wider text-white/40 italic">Signal Lost</span>
              )}
            </div>
            <button onClick={closeChatRoom} className="text-white/40 hover:text-white/80 transition-colors">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar" style={{ minHeight: 180, maxHeight: 240 }}>
            {activeRoom.messages.length === 0 ? (
              <div className="text-center py-8 opacity-40">
                <div className="font-display text-[10px] tracking-widest uppercase">Signal Established</div>
                <div className="font-body text-[11px] mt-1 italic">Begin transmission...</div>
              </div>
            ) : (
              activeRoom.messages.map((msg) => {
                const isLocal = msg.senderId === localUser?.id
                const senderColor = msg.senderColor || (isLocal ? localUser?.color : (users[msg.senderId]?.color || '#ffffff'))
                const senderName = isLocal ? localUser?.username : (msg.senderUsername || users[msg.senderId]?.username || 'Unknown')
                
                return (
                  <div key={msg.id} className={`flex ${isLocal ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%]">
                      {!isLocal && (
                        <div className="font-display text-[9px] mb-1 opacity-60 ml-2 uppercase tracking-tight" 
                             style={{ color: senderColor }}>{senderName}</div>
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
