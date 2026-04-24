import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  roomCode: null,
  nickname: null,
  players: [],
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  timeLimit: 30,
  myScore: 0,
  myLastPoints: 0,
  leaderboard: [],
  finalLeaderboard: [],
  gameStatus: 'idle', // idle | waiting | starting | question | answered | answer_result | question_end | game_end
  hasAnswered: false,
  lastAnswerCorrect: null,
  correctAnswerIndex: null,
  answerStats: [],

  saveSession: () => {
    const state = get()
    if (state.roomCode && state.nickname) {
      localStorage.setItem('quiz_room', state.roomCode)
      localStorage.setItem('quiz_nickname', state.nickname)
      localStorage.setItem('quiz_myScore', state.myScore.toString())
      localStorage.setItem('quiz_hasAnswered', state.hasAnswered ? '1' : '0')
      localStorage.setItem('quiz_questionIndex', state.questionIndex.toString())
      localStorage.setItem('quiz_gameStatus', state.gameStatus)
    }
  },

  loadSession: () => {
    const roomCode = localStorage.getItem('quiz_room')
    const nickname = localStorage.getItem('quiz_nickname')
    const myScore = parseInt(localStorage.getItem('quiz_myScore') || '0', 10)
    const hasAnswered = localStorage.getItem('quiz_hasAnswered') === '1'
    const questionIndex = parseInt(localStorage.getItem('quiz_questionIndex') || '0', 10)
    const gameStatus = localStorage.getItem('quiz_gameStatus') || 'waiting'
    if (roomCode && nickname) {
      set({ roomCode, nickname, myScore, hasAnswered, questionIndex, gameStatus })
      return { roomCode, nickname }
    }
    return null
  },

  clearSession: () => {
    localStorage.removeItem('quiz_room')
    localStorage.removeItem('quiz_nickname')
    localStorage.removeItem('quiz_myScore')
    localStorage.removeItem('quiz_hasAnswered')
    localStorage.removeItem('quiz_questionIndex')
    localStorage.removeItem('quiz_gameStatus')
  },

  setRoom: (roomCode) => {
    set({ roomCode })
    const state = get()
    if (roomCode && state.nickname) {
      localStorage.setItem('quiz_room', roomCode)
    }
  },

  setNickname: (nickname) => {
    set({ nickname })
    const state = get()
    if (state.roomCode && nickname) {
      localStorage.setItem('quiz_nickname', nickname)
    }
  },

  setPlayers: (players) => set({ players }),

  addPlayer: (nickname) =>
    set((state) => ({
      players: state.players.includes(nickname)
        ? state.players
        : [...state.players, nickname],
    })),

  removePlayer: (nickname) =>
    set((state) => ({ players: state.players.filter((p) => p !== nickname) })),

  startCountdown: () => set({ gameStatus: 'starting' }),

  startQuestion: (payload) =>
    set({
      currentQuestion: {
        text: payload.text,
        image_url: payload.image_url,
        answers: payload.answers,
        is_text_answer: payload.is_text_answer || false,
      },
      questionIndex: payload.question_index,
      totalQuestions: payload.total_questions,
      timeLimit: payload.time_limit,
      gameStatus: 'question',
      hasAnswered: false,
      lastAnswerCorrect: null,
      correctAnswerIndex: null,
      answerStats: [],
    }),

  submitAnswer: () => set({ hasAnswered: true, gameStatus: 'answered' }),

  showAnswerResult: (payload) => {
    localStorage.setItem('quiz_myScore', payload.total_score.toString())
    set({
      gameStatus: 'answer_result',
      myScore: payload.total_score,
      myLastPoints: payload.points_earned,
      lastAnswerCorrect: payload.correct,
      correctAnswerIndex: payload.correct_answer_index,
    })
  },

showQuestionEnd: (payload) => set((state) => ({
      gameStatus: 'question_end',
      leaderboard: payload.leaderboard || [],
      answerStats: payload.answer_stats || [],
      correctAnswerIndex: payload.correct_answer_index,
      myScore: payload.leaderboard?.find(e => e.nickname === state.nickname)?.score || state.myScore,
    })),

  showGameEnd: (payload) =>
    set({
      gameStatus: 'game_end',
      finalLeaderboard: payload.final_leaderboard || [],
    }),

  reset: () =>
    set({
      roomCode: null,
      nickname: null,
      players: [],
      currentQuestion: null,
      questionIndex: 0,
      totalQuestions: 0,
      timeLimit: 30,
      myScore: 0,
      myLastPoints: 0,
      leaderboard: [],
      finalLeaderboard: [],
      gameStatus: 'idle',
      hasAnswered: false,
      lastAnswerCorrect: null,
      correctAnswerIndex: null,
      answerStats: [],
    }),
}))
