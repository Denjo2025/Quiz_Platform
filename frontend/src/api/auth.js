import api from './axios'

export const register = (email, password) =>
  api.post('/auth/register', { email, password })

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const getMe = async () => {
  const res = await api.get('/auth/me')
  return res.data
}

export const debugAuth = async () => {
  const res = await api.get('/auth/debug-headers')
  return res.data
}
