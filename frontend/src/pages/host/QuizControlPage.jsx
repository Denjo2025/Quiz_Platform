import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameSocket } from '../../hooks/useGameSocket'
import { useAuthStore } from '../../store/authStore'
import AnswerStats from '../../components/AnswerStats'
import ConfirmModal from '../../components/ConfirmModal'

export default function QuizControlPage() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  const [phase, setPhase] = useState('waiting') // waiting | question | question_end | game_end
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [timeLimit, setTimeLimit] = useState(30)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [allAnswered, setAllAnswered] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [answerStats, setAnswerStats] = useState([])
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [isLastQuestion, setIsLastQuestion] = useState(false)
  const [ending, setEnding] = useState(false)
  const [endConfirm, setEndConfirm] = useState(false)

  // Timer for question countdown
  const [timeLeft, setTimeLeft] = useState(0)

  const { sendMessage, lastMessage, connectionStatus } = useGameSocket({
    roomCode,
    role: 'host',
    token,
  })

  useEffect(() => {
    if (!lastMessage) return
    const { type, payload } = lastMessage

    switch (type) {
      case 'host_connected':
        setTotalPlayers(payload.player_count || 0)
        if (payload.status === 'in_progress') setPhase('waiting')
        break
      case 'player_joined':
        setTotalPlayers(payload.player_count)
        break
      case 'player_left':
        setTotalPlayers(payload.player_count)
        break
      case 'game_starting':
        setPhase('waiting')
        break
      case 'question_start':
        if (phase === 'question' && currentQuestion && payload.question_index === questionIndex) break
        setCurrentQuestion({
          text: payload.text,
          image_url: payload.image_url,
          answers: payload.answers,
          time_limit: payload.time_limit,
        })
        setQuestionIndex(payload.question_index)
        setTotalQuestions(payload.total_questions)
        setTimeLimit(payload.time_limit || 30)
        setAnsweredCount(0)
        setAllAnswered(false)
        setPhase('question')
        setAnswerStats([])
        setCorrectAnswerIndex(null)
        setIsLastQuestion(payload.question_index + 1 >= payload.total_questions)
        break
      case 'answer_received':
        setAnsweredCount(payload.answers_received)
        setTotalPlayers(payload.total_players)
        break
      case 'all_answered':
        setAllAnswered(true)
        setTimeUp(true)
        break
      case 'question_end':
        setAnswerStats(payload.answer_stats || [])
        setCorrectAnswerIndex(payload.correct_answer_index)
        setLeaderboard(payload.leaderboard || [])
        setPhase('question_end')
        break
      case 'game_end':
        navigate(`/host/results/${roomCode}`, {
          state: { finalLeaderboard: payload.final_leaderboard }
        })
        break
    }
  }, [lastMessage])

  // Timer for question countdown
  useEffect(() => {
    if (phase !== 'question' || !currentQuestion) return
    setTimeLeft(timeLimit)
    setTimeUp(false)
    setAllAnswered(false)
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval)
          setTimeUp(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, currentQuestion, timeLimit])

  const handleNextQuestion = () => {
    sendMessage({ type: 'host_next_question' })
    setPhase('question')
    setAnsweredCount(0)
    setAllAnswered(false)
  }

  const handleEndGame = () => {
    setEndConfirm(true)
  }

  const confirmEndGame = () => {
    setEndConfirm(false)
    sendMessage({ type: 'host_end_game' })
    setEnding(true)
  }

  return (
    <div className="min-h-screen bg-vibrant-space flex flex-col px-4 py-6 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col gap-6 relative z-10">
        {/* Top bar */}
        <div className="bg-white p-5 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 border-b-4 border-blue-600/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl shadow-blue-600/30">
              <span className="text-xl text-white font-black italic">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-blue-900/40 text-[8px] font-black uppercase tracking-widest leading-none">Mission Pin</span>
              <span className="text-blue-900 font-black font-outfit text-xl uppercase tracking-tighter">{roomCode}</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center md:items-end">
              <span className="text-blue-900/40 text-[8px] font-black uppercase tracking-widest leading-none mb-1">Mission Progress</span>
              <div className="flex items-baseline gap-1">
                <span className="text-blue-600 font-black font-outfit text-2xl">{questionIndex + 1}</span>
                <span className="text-blue-900/20 font-black text-xs">/ {totalQuestions}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-bounce'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest">{connectionStatus === 'connected' ? 'Connected' : 'Syncing'}</span>
              </div>
              <button
                onClick={handleEndGame}
                disabled={ending}
                className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-inner"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col gap-6">
          {phase === 'question' && currentQuestion && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in flex-1">
              {/* Question Main Panel */}
              <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 shadow-2xl flex flex-col gap-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
                <div className="space-y-6 flex-1">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    {currentQuestion.image_url && (
                      <div className="w-full md:w-2/5 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-blue-50">
                        <img src={currentQuestion.image_url} alt="" className="w-full h-56 object-cover" />
                      </div>
                    )}
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-blue-900 text-3xl font-black font-outfit leading-tight tracking-tighter italic text-balance">
                        {currentQuestion.text}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6">
                    {currentQuestion.answers.map((a, i) => {
                      const labels = ['A', 'B', 'C', 'D']
                      const bgColors = ['bg-emerald-50 text-emerald-600', 'bg-rose-50 text-rose-600', 'bg-amber-50 text-amber-600', 'bg-sky-50 text-sky-600']
                      const indicators = ['bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500']
                      return (
                        <div key={i} className={`${bgColors[i]} rounded-[2rem] px-6 py-4 flex items-center gap-4 shadow-sm`}>
                          <div className={`w-10 h-10 ${indicators[i]} rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                            {labels[i]}
                          </div>
                          <span className="font-black text-lg truncate tracking-tight">{a.text}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Status Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
                  <p className="text-blue-900/30 text-[9px] font-black uppercase tracking-[0.4em]">Time Left</p>
                  <div className={`text-8xl font-black font-outfit tabular-nums leading-none ${timeLeft <= 5 ? 'text-rose-500 animate-shake' : 'text-blue-600'}`}>
                    {timeLeft}
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
                  <p className="text-blue-900/30 text-[9px] font-black uppercase tracking-[0.4em]">Submissions</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black font-outfit text-blue-900 leading-none">{answeredCount}</span>
                    <span className="text-2xl font-black text-blue-900/20">/ {totalPlayers}</span>
                  </div>
                  <div className="w-full flex gap-1 h-3 bg-blue-50 p-0.5 rounded-full overflow-hidden">
                    {Array.from({ length: Math.max(totalPlayers, 1) }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-700 ${i < answeredCount ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'bg-blue-100'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === 'question_end' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up flex-1">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex-1">
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner text-blue-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-black text-blue-900 font-outfit uppercase italic tracking-tighter">Mission Intel</h2>
                  </div>
                  <AnswerStats
                    stats={answerStats}
                    correctIndex={correctAnswerIndex}
                    answers={currentQuestion?.answers || []}
                    phase={phase}
                  />
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="btn-yellow w-full py-6 text-2xl font-black italic shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isLastQuestion ? (
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>FINALIZE MISSION</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>NEXT SECTOR</span>
                    </div>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
                <div className="flex items-center justify-between">
                  <h3 className="text-blue-900/30 text-[9px] font-black uppercase tracking-[0.4em]">Elite Agents</h3>
                  <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.2h7.6l-6.15 4.47L18.25 21 12 16.5 5.75 21l2.4-7.33L2 9.2h7.6L12 2z" />
                  </svg>
                </div>
                <div className="space-y-3">
                  {leaderboard.slice(0, 6).map((entry, i) => (
                    <div
                      key={entry.nickname}
                      className={`
                        flex items-center gap-4 p-4 rounded-[1.5rem] transition-all
                        ${i === 0 ? 'bg-amber-50 text-amber-600 shadow-sm' : 'bg-blue-50 text-blue-900/60'}
                      `}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black font-outfit text-base ${i === 0 ? 'bg-amber-400 text-white shadow-lg' : 'bg-white shadow-inner'}`}>
                        {entry.rank}
                      </div>
                      <p className="flex-1 font-black truncate text-base tracking-tight">{entry.nickname}</p>
                      <span className="text-base font-black font-outfit opacity-40">{entry.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(phase === 'waiting' || (!currentQuestion && phase !== 'question')) && (
            <div className="flex-1 flex flex-col items-center justify-center gap-10 text-center animate-fade-in py-16">
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-white font-outfit tracking-tighter uppercase italic leading-none">Awaiting Launch Signal</h2>
                <p className="text-white/40 font-black tracking-[0.5em] uppercase text-[10px] animate-pulse">Syncing neural network feeds...</p>
              </div>
            </div>
          )}
        </div>

        <ConfirmModal
          show={endConfirm}
          title="End Game"
          message="End the game now?"
          confirmText="End Game"
          danger={true}
          onConfirm={confirmEndGame}
          onCancel={() => setEndConfirm(false)}
        />
      </div>
    </div>
  )
}



