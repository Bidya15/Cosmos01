import { useEffect, useRef } from 'react'
import { useCosmosStore } from '../store/cosmosStore'
import { createSocket, subscribe, publish, disconnectSocket, Topics } from '../utils/stomp'
import { detectProximityChanges } from '../utils/proximity'
import { AVATAR_CONFIG, WS_BASE } from '../config'

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
        
        subscribe(spaceTopic, handleBroadcast)
        subscribe(Topics.MY_ROOM_STATE, handleRoomState)
        subscribe(Topics.MY_CHAT, handleChat)
        subscribe(Topics.MY_CHAT_HISTORY, handleChatHistory)
        subscribe(Topics.MY_PROXIMITY, handleProximity)

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
        if (usersRef.current[payload.userId]) {
          upsertUser({ id: payload.userId, x: payload.x, y: payload.y })
        }
        checkProximity(payload.userId, payload.x, payload.y)
        break
      case 'USER_REACTION':
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

  function checkProximity(movedUserId, newX, newY) {
    const local = localUserRef.current
    if (!local) return
    
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
