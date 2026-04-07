let stompClient = null
let connected = false
const pendingSubscriptions = []
const pendingPublishes = []

export async function createSocket(serverUrl = 'http://localhost:8080') {
  const SockJS = (await import('sockjs-client')).default
  const { Client } = await import('@stomp/stompjs')

  const userId = window.__COSMOS_USER_ID__

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${serverUrl}/ws?userId=${userId || ''}`),
    reconnectDelay: 2000,
    debug: () => {},
  })

  stompClient.onConnect = () => {
    connected = true
    pendingSubscriptions.forEach(fn => fn())
    pendingSubscriptions.length = 0

    pendingPublishes.forEach(fn => fn())
    pendingPublishes.length = 0

    window.dispatchEvent(new Event('cosmos:connected'))
  }

  stompClient.onDisconnect = () => {
    connected = false
    window.dispatchEvent(new Event('cosmos:disconnected'))
  }

  stompClient.onStompError = (frame) => {
    console.error('[STOMP Error]', frame.headers?.message)
  }

  stompClient.activate()
  return stompClient
}

export function getStompClient() {
  return stompClient
}

export function subscribe(destination, callback) {
  const doSub = () => {
    if (stompClient && stompClient.connected) {
      try {
        stompClient.subscribe(destination, (msg) => {
          try {
            callback(JSON.parse(msg.body))
          } catch (e) {
            console.error('[STOMP] Parse error', e)
          }
        })
      } catch (err) {
        console.warn(`[STOMP] Subscription to ${destination} failed, retrying...`, err.message)
        setTimeout(doSub, 150)
      }
    } else {
      pendingSubscriptions.push(doSub)
    }
  }

  doSub()
}

export function publish(destination, payload) {
  const doPub = () => {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination,
        body: JSON.stringify(payload),
      })
    } else {
      pendingPublishes.push(doPub)
    }
  }
  doPub()
}

export function disconnectSocket() {
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
    connected = false
    pendingPublishes.length = 0
    pendingSubscriptions.length = 0
  }
}

export const Topics = {
  COSMOS_BROADCAST: '/topic/cosmos',
  MY_ROOM_STATE: '/user/queue/room-state',
  MY_CHAT: '/user/queue/chat',
  MY_CHAT_HISTORY: '/user/queue/chat-history',
  MY_PROXIMITY: '/user/queue/proximity',

  JOIN: '/app/cosmos/join',
  MOVE: '/app/cosmos/move',
  CHAT: '/app/cosmos/chat',
  REACTION: '/app/cosmos/reaction',
  LEAVE: '/app/cosmos/leave',
}
