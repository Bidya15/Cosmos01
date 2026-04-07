import { create } from 'zustand'
import axios from 'axios'
import { AVATAR_CONFIG, COLORS_ARRAY, API_BASE } from '../config'

const STORAGE_KEY = 'cosmos_session'

// Helper to load authentication state from local storage on initialization
const getInitialState = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      return { user: data.user, token: data.token }
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
  return { user: null, token: null }
}

export const useCosmosStore = create((set, get) => ({
  ...getInitialState(),
  localUser: null,
  isJoined: false,
  currentSpaceId: null,

  spaces: [],
  users: {},
  connections: new Set(),
  chatRooms: {},
  activeChatRoom: null,

  showMinimap: true,
  showControls: true,
  events: [],
  socket: null,

  // Persist auth state to storage
  setAuth: (user, token) => {
    set({ user, token })
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  },

  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password })
      get().setAuth(response.data, response.data.token)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data || 'Login failed' }
    }
  },

  register: async (username, email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, { username, email, password })
      get().setAuth(response.data, response.data.token)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data || "Login connection failed" }
    }
  },

  forgotPassword: async (email) => {
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data || "Email verification failed" }
    }
  },

  resetPassword: async (email, newPassword) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/reset-password`, { email, newPassword })
      return { success: true, message: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data || "Signal reset failed" }
    }
  },

  logout: () => {
    get().setAuth(null, null)
    set({ isJoined: false, localUser: null, currentSpaceId: null, users: {}, connections: new Set() })
  },

  fetchSpaces: async () => {
    try {
      const response = await axios.get(`${API_BASE}/cosmos/spaces`)
      set({ spaces: response.data })
    } catch (error) {
      console.error('[Store] Failed to fetch spaces:', error)
    }
  },

  joinCosmos: (spaceId) => {
    const { user } = get()
    if (!user) return

    const userId = user.id || `local_${Date.now()}`
    const userName = user.username || 'Explorer'

    const colorIndex = Math.floor(Math.random() * COLORS_ARRAY.length)
    const localUser = {
      id: userId,
      username: userName,
      color: user.color || COLORS_ARRAY[colorIndex],
      x: 400 + Math.random() * 200 - 100,
      y: 300 + Math.random() * 200 - 100,
      isLocal: true,
      spaceId: spaceId || 'main-office'
    }
    set({ localUser, isJoined: true, currentSpaceId: localUser.spaceId })
    return localUser
  },

  updateLocalPosition: (x, y) => {
    set((state) => ({
      localUser: state.localUser ? { ...state.localUser, x, y } : null
    }))
  },

  upsertUser: (userData) => {
    set((state) => ({
      users: {
        ...state.users,
        [userData.id]: { ...state.users[userData.id], ...userData }
      }
    }))
  },

  removeUser: (userId) => {
    set((state) => {
      const users = { ...state.users }
      delete users[userId]
      return { users }
    })
  },

  addConnection: (userId) => {
    set((state) => {
      const connections = new Set(state.connections)
      connections.add(userId)
      return { connections }
    })
  },

  removeConnection: (userId) => {
    set((state) => {
      const connections = new Set(state.connections)
      connections.delete(userId)
      
      const roomId = getRoomId(state.localUser?.id, userId)
      const chatRooms = { ...state.chatRooms }
      
      // Clean up private chat rooms when a connection is lost
      if (roomId !== 'GLOBAL') {
        delete chatRooms[roomId]
      }
      
      const activeChatRoom = state.activeChatRoom === roomId ? null : state.activeChatRoom
      
      return { connections, chatRooms, activeChatRoom }
    })
  },

  openChatRoom: (otherUserId) => {
    const state = get()
    if (!state.localUser) return
    const roomId = getRoomId(state.localUser.id, otherUserId)
    set((prev) => ({
      chatRooms: {
        ...prev.chatRooms,
        [roomId]: prev.chatRooms[roomId] || {
          id: roomId,
          participants: [state.localUser.id, otherUserId],
          messages: []
        }
      },
      activeChatRoom: roomId
    }))
  },

  closeChatRoom: () => set({ activeChatRoom: null }),

  addMessage: (roomId, message) => {
    set((state) => {
      const chatRooms = { ...state.chatRooms }
      if (!chatRooms[roomId]) {
        chatRooms[roomId] = { id: roomId, messages: [], participants: [] }
      }
      
      const room = chatRooms[roomId]
      return {
        chatRooms: {
          ...chatRooms,
          [roomId]: {
            ...room,
            messages: [...room.messages, message]
          }
        }
      }
    })
  },

  addHistory: (messages) => {
    for (const messageData of messages) {
      get().addMessage(messageData.roomId, {
        id: `hist_${messageData.timestamp}_${Math.random()}`,
        senderId: messageData.fromUserId,
        senderUsername: messageData.fromUsername,
        senderColor: messageData.color,
        text: messageData.message,
        timestamp: messageData.timestamp,
        isGlobal: messageData.isGlobal
      })
    }
  },

  setSocket: (socket) => set({ socket }),
  setShowMinimap: (visible) => set({ showMinimap: visible }),
  setShowControls: (visible) => set({ showControls: visible }),

  addEvent: (text, type = 'SYSTEM', color = '#06b6d4') => {
    const event = {
      id: `ev_${Date.now()}_${Math.random()}`,
      text,
      type,
      color,
      timestamp: Date.now()
    }
    set(state => ({
      events: [event, ...state.events].slice(0, 10)
    }))
  },
}))

// Generates a consistent room ID for two users
export function getRoomId(userId1, userId2) {
  if (!userId1 || !userId2) return null
  return [userId1, userId2].sort().join('__')
}
