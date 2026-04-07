import { create } from 'zustand'
import axios from 'axios'
import { AVATAR_CONFIG, COLORS_ARRAY, API_BASE } from '../config'

const STORAGE_KEY = 'cosmos_session'

const getInitialState = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      return { user: data.user, token: data.token }
    } catch (e) {
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
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password })
      get().setAuth(res.data, res.data.token)
      return { success: true }
    } catch (e) {
      return { success: false, error: e.response?.data || 'Login failed' }
    }
  },

  register: async (username, email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, { username, email, password })
      get().setAuth(res.data, res.data.token)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data || "Login connection failed" }
    }
  },

  forgotPassword: async (email) => {
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data || "Email verification failed" }
    }
  },

  resetPassword: async (email, newPassword) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password`, { email, newPassword })
      return { success: true, message: res.data }
    } catch (err) {
      return { success: false, error: err.response?.data || "Signal reset failed" }
    }
  },

  logout: () => {
    get().setAuth(null, null)
    set({ isJoined: false, localUser: null, currentSpaceId: null, users: {}, connections: new Set() })
  },

  fetchSpaces: async () => {
    try {
      const res = await axios.get(`${API_BASE}/cosmos/spaces`)
      set({ spaces: res.data })
    } catch (e) {
      console.error('[Store] Failed to fetch spaces:', e)
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
    for (const msg of messages) {
      get().addMessage(msg.roomId, {
        id: `hist_${msg.timestamp}_${Math.random()}`,
        senderId: msg.fromUserId,
        senderUsername: msg.fromUsername,
        senderColor: msg.color,
        text: msg.message,
        timestamp: msg.timestamp,
        isGlobal: msg.isGlobal
      })
    }
  },

  setSocket: (socket) => set({ socket }),
  setShowMinimap: (v) => set({ showMinimap: v }),
  setShowControls: (v) => set({ showControls: v }),

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

export function getRoomId(uid1, uid2) {
  if (!uid1 || !uid2) return null
  return [uid1, uid2].sort().join('__')
}
