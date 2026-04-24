import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  hostRoomCode: null,

  login: (token, user) => {
    localStorage.setItem('quiz_token', token)
    localStorage.setItem('quiz_user', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('quiz_token')
    localStorage.removeItem('quiz_user')
    localStorage.removeItem('quiz_hostRoomCode')
    set({ token: null, user: null, isAuthenticated: false, hostRoomCode: null })
  },

  setHostRoomCode: (roomCode) => {
    localStorage.setItem('quiz_hostRoomCode', roomCode)
    set({ hostRoomCode: roomCode })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('quiz_token')
    const userStr = localStorage.getItem('quiz_user')
    const roomCode = localStorage.getItem('quiz_hostRoomCode')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ token, user, isAuthenticated: true, hostRoomCode: roomCode })
      } catch {
        localStorage.removeItem('quiz_token')
        localStorage.removeItem('quiz_user')
      }
    }
  },
}))
