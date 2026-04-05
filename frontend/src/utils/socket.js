import { io } from 'socket.io-client'

let socket = null

export function createSocket(serverUrl = 'http://localhost:8080') {
  if (socket) return socket

  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
  })

  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Event emitters
export const SocketEvents = {
  // Client -> Server
  JOIN: 'cosmos:join',
  MOVE: 'cosmos:move',
  CHAT_MESSAGE: 'cosmos:chat',
  LEAVE: 'cosmos:leave',

  // Server -> Client
  USER_JOINED: 'cosmos:user_joined',
  USER_LEFT: 'cosmos:user_left',
  POSITION_UPDATE: 'cosmos:position_update',
  ROOM_STATE: 'cosmos:room_state',
  PROXIMITY_ENTER: 'cosmos:proximity_enter',
  PROXIMITY_LEAVE: 'cosmos:proximity_leave',
  CHAT_RECEIVED: 'cosmos:chat_received',
  ERROR: 'cosmos:error',
}
