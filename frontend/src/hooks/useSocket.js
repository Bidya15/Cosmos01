import { useEffect, useRef } from 'react'
import { useCosmosStore } from '../store/cosmosStore'
import { createSocket, subscribe, publish, disconnectSocket, Topics } from '../utils/stomp'
import { detectProximityChanges } from '../utils/proximity'
import { AVATAR_CONFIG, WS_BASE } from '../config'

/**
 * Specialized socket hook for managing the real-time communication lifecycle.
 * Handles USER_JOIN, POSITION_UPDATE, and PROXIMITY_ENTER/LEAVE events.
 * 
 * @param {Object} localUser The local reactive user object
 */
export function useSocket(localUser) {
  const {
    setSocket, upsertUser, removeUser,
    connections, addConnection, removeConnection,
    openChatRoom, addMessage, users, addEvent,
  } = useCosmosStore()

  const localUserRef = useRef(localUser)
  const usersRef = useRef(users)
  const connectionsRef = useRef(connections)
  const initializedRef = useRef(false)

  // Keep refs in sync for use in event handlers (avoiding stale closures)
  useEffect(() => { localUserRef.current = localUser }, [localUser])
  useEffect(() => { usersRef.current = users }, [users])
  useEffect(() => { connectionsRef.current = connections }, [connections])

  useEffect(() => {
    if (!localUser || initializedRef.current) return
    initializedRef.current = true
    window.__COSMOS_USER_ID__ = localUser.id

    const init = async () => {
      const client = await createSocket(WS_BASE)
      setSocket({ publish, client })

      const onConnected = () => {
        const spaceTopic = `${Topics.COSMOS_BROADCAST}/${localUserRef.current.spaceId}`
        
        // --- SUBSCRIBE TO SYSTEM TOPICS ---
        subscribe(spaceTopic, handleBroadcast)
        subscribe(Topics.MY_ROOM_STATE, handleRoomState)
        subscribe(Topics.MY_CHAT, handleChat)
        subscribe(Topics.MY_CHAT_HISTORY, handleChatHistory)
        subscribe(Topics.MY_PROXIMITY, handleProximity)

        // --- ANNOUNCE ENTRANCE ---
        publish(Topics.JOIN, {
          id: localUserRef.current.id,
          spaceId: localUserRef.current.spaceId,
          username: localUserRef.current.username,
          color: localUserRef.current.color,
          x: localUserRef.current.x,
          y: localUserRef.current.y,
        })
      }

      if (client.connected) onConnected()
      else window.addEventListener('cosmos:connected', onConnected, { once: true })
    }

    init()

    return () => {
      publish(Topics.LEAVE, { userId: localUserRef.current?.id })
      setTimeout(() => disconnectSocket(), 200)
      initializedRef.current = false
    }
  }, [localUser?.id])

  /**
   * Orchestrates space-wide broadcasts (Join, Leave, Move)
   */
  function handleBroadcast(envelope) {
    const { type, payload } = envelope
    const local = localUserRef.current
    switch (type) {
      case 'USER_JOINED':
        if (payload.id !== local?.id) {
          upsertUser(payload)
          addEvent(`${payload.username} entered orbit`, 'JOIN', payload.color)
        }
        break
      case 'USER_LEFT':
        const leavingUser = usersRef.current[payload.userId]
        if (leavingUser) addEvent(`${leavingUser.username} lost signal`, 'LEAVE', leavingUser.color)
        removeUser(payload.userId)
        removeConnection(payload.userId)
        break
      case 'POSITION_UPDATE':
        if (payload.userId === local?.id) return
        // Guard against updating users that haven't registered in the store yet
        if (usersRef.current[payload.userId]) {
          upsertUser({ id: payload.userId, x: payload.x, y: payload.y })
        }
        checkProximity(payload.userId, payload.x, payload.y)
        break
      case 'USER_REACTION':
        // Trigger visual effect in the renderer (we'll use a custom event or store flag)
        window.dispatchEvent(new CustomEvent('cosmos:reaction', { detail: payload }))
        
        const reactor = usersRef.current[payload.userId] || (payload.userId === local?.id ? local : null)
        if (reactor) addEvent(`${reactor.username}: ${payload.emoji}`, 'REACTION', reactor.color)
        break
    }
  }

  function handleRoomState(payload) {
    const local = localUserRef.current
    for (const user of payload.users || []) {
      if (user.id !== local?.id) upsertUser(user)
    }
  }

  function handleChat(envelope) {
    const { payload } = envelope
    addMessage(payload.roomId, {
      id: `msg_${Date.now()}_${Math.random()}`,
      senderId: payload.fromUserId,
      senderUsername: payload.fromUsername,
      senderColor: payload.color,
      text: payload.message,
      timestamp: payload.timestamp,
      isGlobal: payload.isGlobal
    })
  }

  function handleChatHistory(envelope) {
    const { payload } = envelope
    if (payload.messages) {
      useCosmosStore.getState().addHistory(payload.messages)
    }
  }

  /**
   * Handles server-side proximity detections (Automated connection management)
   */
  function handleProximity(envelope) {
    const { type, payload } = envelope
    if (!localUserRef.current) return
    if (type === 'PROXIMITY_ENTER') { 
      addConnection(payload.userId)
      openChatRoom(payload.userId) 
    }
    else if (type === 'PROXIMITY_LEAVE') {
      removeConnection(payload.userId)
    }
  }

  /**
   * Supplemental client-side proximity check for immediate visual feedback.
   */
  function checkProximity(movedUserId, newX, newY) {
    const local = localUserRef.current
    if (!local) return
    
    // Virtual state update for calculation
    const tempUsers = { 
      ...usersRef.current, 
      [movedUserId]: { ...usersRef.current[movedUserId], x: newX, y: newY } 
    }
    
    const { entered, left } = detectProximityChanges(
      local, 
      tempUsers, 
      connectionsRef.current, 
      AVATAR_CONFIG.PROXIMITY_RADIUS
    )
    
    for (const uid of entered) { addConnection(uid); openChatRoom(uid) }
    for (const uid of left) removeConnection(uid)
  }
}
