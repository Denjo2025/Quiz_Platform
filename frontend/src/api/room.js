import api from './axios'

export const createRoom = (quizId) => {
  return api.post('/rooms/', { quiz_id: quizId })
}

export const getRoomInfo = (roomCode) => api.get(`/rooms/${roomCode}`)
