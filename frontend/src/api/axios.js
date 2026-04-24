import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
})

let authToken = null

export const setAuthToken = (token) => {
  authToken = token
}

const getToken = () => {
  if (authToken) return authToken
  const store = useAuthStore.getState()
  if (store.token === null && localStorage.getItem('quiz_token')) {
    store.loadFromStorage()
  }
  return store.token || localStorage.getItem('quiz_token')
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 307 redirect by retrying with auth
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config
    if ((err.response?.status === 307 || err.response?.status === 308) && !originalConfig._retry) {
      originalConfig._retry = true
      const token = getToken()
      originalConfig.headers.Authorization = `Bearer ${token}`
      return api(originalConfig)
    }
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  }
)

export default api
