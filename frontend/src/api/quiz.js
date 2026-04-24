import api from './axios'

export const getQuizzes = () => api.get('/quizzes')
export const getQuiz = (id) => api.get(`/quizzes/${id}`)
export const createQuiz = (data) => api.post('/quizzes', data)
export const updateQuiz = (id, data) => api.put(`/quizzes/${id}`, data)
export const deleteQuiz = (id) => api.delete(`/quizzes/${id}`)

// Questions
export const addQuestion = (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data)
export const updateQuestion = (quizId, questionId, data) =>
  api.put(`/quizzes/${quizId}/questions/${questionId}`, data)
export const deleteQuestion = (quizId, questionId) =>
  api.delete(`/quizzes/${quizId}/questions/${questionId}`)
export const reorderQuestions = (quizId, questionIds) =>
  api.put(`/quizzes/${quizId}/questions/reorder`, { question_ids: questionIds })

// Image upload
export const uploadImage = (formData) =>
  api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
