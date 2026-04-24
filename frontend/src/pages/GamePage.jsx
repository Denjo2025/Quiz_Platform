import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameSocket } from '../hooks/useGameSocket'
import { useGameStore } from '../store/gameStore'
import QuestionDisplay from '../components/QuestionDisplay'
import AnswerButton from '../components/AnswerButton'
import Timer from '../components/Timer'
import Leaderboard from '../components/Leaderboard'

export default function GamePage() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [timerResetKey, setTimerResetKey] = useState(0)
  const [reconnecting, setReconnecting] = useState(false)
  const [roomCodeLoaded, setRoomCodeLoaded] = useState(null)

  const {
    nickname, gameStatus, currentQuestion, questionIndex, totalQuestions,
    timeLimit, myScore, myLastPoints, lastAnswerCorrect, correctAnswerIndex,
    leaderboard, hasAnswered, submitAnswer, startQuestion, showAnswerResult,
    showQuestionEnd, showGameEnd, loadSession, saveSession, setRoom, setNickname,
  } = useGameStore()

  useEffect(() => {
    const session = loadSession()
    if (session) {
      setRoom(session.roomCode)
      setNickname(session.nickname)
      setRoomCodeLoaded(session.roomCode)
      setReconnecting(true)
    } else {
      navigate('/')
    }
  }, [])

  if (!roomCodeLoaded && !nickname) {
    return (
      <div className="min-h-screen bg-vibrant-space flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-8">
          <div className="w-24 h-24 mx-auto bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-float">
            <span className="text-4xl text-blue-600 font-black">K</span>
          </div>
          <p className="text-white font-black uppercase tracking-[0.4em] text-sm animate-pulse">Initializing Arena...</p>
        </div>
      </div>
    )
  }

  const currentNickname = nickname || useGameStore.getState().nickname
  
  const { sendMessage, lastMessage } = useGameSocket({
    roomCode,
    role: 'player',
    nickname: currentNickname,
  })

  useEffect(() => {
    if (!lastMessage) return
    const { type, payload } = lastMessage

    switch (type) {
      case 'question_start':
        setTimerResetKey(k => k + 1)
        startQuestion(payload)
        useGameStore.getState().saveSession()
        setReconnecting(false)
        break
      case 'answer_received':
        if (!hasAnswered) {
          submitAnswer()
          useGameStore.getState().saveSession()
        }
        break
      case 'answer_result':
        showAnswerResult(payload)
        useGameStore.getState().saveSession()
        break
      case 'question_end':
        showQuestionEnd(payload)
        break
      case 'game_end':
        showGameEnd(payload)
        navigate(`/result/${roomCode}`)
        break
    }
  }, [lastMessage])

  const handleAnswer = (index) => {
    if (hasAnswered) return
    submitAnswer()
    sendMessage({ type: 'player_answer', payload: { answer_index: index } })
    useGameStore.getState().saveSession()
  }

  return (
    <div className="min-h-screen bg-vibrant-space flex flex-col items-center px-4 py-6 gap-6 relative overflow-hidden">
      {/* Header / HUD */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-white px-6 py-3 rounded-[1.5rem] shadow-2xl relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg text-white font-black text-xs">K</div>
          <div className="flex flex-col">
            <span className="text-blue-900/40 text-[8px] font-black uppercase tracking-widest leading-none">Player</span>
            <span className="text-blue-900 font-black tracking-tight text-sm">{currentNickname}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-blue-900/40 text-[8px] font-black uppercase tracking-widest leading-none">Questions</span>
            <span className="text-blue-900 font-black text-xs">{questionIndex + 1} / {totalQuestions}</span>
          </div>
          <div className="h-8 w-px bg-blue-900/10" />
          <div className="flex flex-col items-end">
            <span className="text-blue-900/40 text-[8px] font-black uppercase tracking-widest leading-none">Credits</span>
            <span className="text-blue-600 font-black text-xl tabular-nums">
              {myScore.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {(gameStatus === 'question' || gameStatus === 'answered') && currentQuestion && (
        <div className="w-full max-w-5xl flex flex-col items-center gap-6 flex-1 relative z-10 animate-fade-in">
          <div className="w-full flex flex-col lg:flex-row items-stretch gap-6">
            <div className="flex-1 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
              <QuestionDisplay
                text={currentQuestion.text}
                image_url={currentQuestion.image_url}
                questionIndex={questionIndex}
                totalQuestions={totalQuestions}
                mode="vibrant"
              />
            </div>
            <div className="flex items-center justify-center lg:w-40">
              <Timer
                key={timerResetKey}
                duration={timeLimit}
                onEnd={() => {}}
                variant="vibrant"
              />
            </div>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
            {hasAnswered ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white/10 rounded-[2.5rem] border-2 border-white/20 backdrop-blur-md">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl animate-float">
                  <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-white text-3xl font-black font-outfit tracking-tight">Answer Locked!</h3>
                <p className="text-white/60 font-medium mt-2 text-base">Waiting for headquarters...</p>
              </div>
            ) : (
              currentQuestion.answers?.map((ans, i) => (
                <AnswerButton
                  key={i}
                  index={i}
                  text={ans.text}
                  image_url={ans.image_url || null}
                  disabled={hasAnswered}
                  onClick={() => handleAnswer(i)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {gameStatus === 'answer_result' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in relative z-10 py-10">
          <div className={`
            w-36 h-36 rounded-[2.5rem] flex items-center justify-center shadow-2xl
            ${lastAnswerCorrect ? 'bg-emerald-500 scale-110' : 'bg-rose-500'}
            transition-all duration-700
          `}>
            {lastAnswerCorrect ? (
              <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ) : (
              <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-5xl md:text-6xl font-black font-outfit tracking-tight text-white italic">
              {lastAnswerCorrect ? 'NICE WORK!' : 'TOO SLOW!'}
            </h2>
            <p className="text-white/60 text-lg font-bold uppercase tracking-[0.3em]">
              {lastAnswerCorrect ? 'PERFECT UPLINK' : 'CORE BREACH'}
            </p>
          </div>
          
          {lastAnswerCorrect && (
            <div className="bg-white px-6 py-3 rounded-2xl shadow-2xl animate-bounce">
              <p className="text-3xl font-black text-blue-600 tabular-nums">
                +{myLastPoints.toLocaleString()} <span className="text-xs uppercase tracking-widest ml-1">Credits</span>
              </p>
            </div>
          )}
        </div>
      )}

      {gameStatus === 'question_end' && (
        <div className="flex-1 flex flex-col items-center gap-8 w-full max-w-3xl animate-slide-up relative z-10 py-10">
          <div className="text-center space-y-2">
            <h2 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-white italic">LEADERBOARD</h2>
            <p className="text-white/60 font-black uppercase tracking-[0.4em] text-[10px]">Current Arena Standings</p>
          </div>
          <Leaderboard entries={leaderboard} myNickname={currentNickname} />
        </div>
      )}

      {(gameStatus === 'idle' || gameStatus === 'waiting' || gameStatus === 'starting') && (
        <div className="flex-1 flex flex-col items-center justify-center gap-10 relative z-10">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-black font-outfit tracking-tight text-white uppercase italic">Initializing...</h2>
            <p className="text-white/40 font-black uppercase tracking-[0.4em] text-[10px]">Synchronizing with headquarters</p>
          </div>
        </div>
      )}
    </div>
  )
}