import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { createRoom } from '../../api/room'
import { getQuizzes } from '../../api/quiz'
import Podium from '../../components/Podium'
import ConfirmModal from '../../components/ConfirmModal'

export default function QuizResultsPage() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAuthStore((s) => s.token)

  const [finalLeaderboard, setFinalLeaderboard] = useState(
    location.state?.finalLeaderboard || []
  )
  const [restarting, setRestarting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [endConfirm, setEndConfirm] = useState(false)

  const handleEndGame = () => {
    setEndConfirm(true)
  }

  const confirmEndGame = async () => {
    setEndConfirm(false)
    setEnding(true)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/end`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        navigate('/host/dashboard')
      }
    } catch (err) {
      console.error('End game error:', err)
    } finally {
      setEnding(false)
    }
  }

  const handlePlayAgain = async () => {
    setRestarting(true)
    try {
      const res = await getQuizzes()
      if (res.data.length > 0) {
        const roomRes = await createRoom(res.data[0].id)
        navigate(`/host/lobby/${roomRes.data.room_code}`)
      } else {
        navigate('/host/dashboard')
      }
    } catch {
      navigate('/host/dashboard')
    } finally {
      setRestarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-vibrant-space flex flex-col items-center px-4 py-10 gap-10 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700" />
      </div>

      <div className="text-center space-y-4 animate-fade-in relative z-10">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">MISSION COMPLETE</h1>
          <p className="text-white/40 font-black uppercase tracking-[0.5em] text-[10px]">Mission Data Archived - Room {roomCode}</p>
        </div>
      </div>

      <div className="w-full max-w-3xl relative z-10 animate-slide-up">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl space-y-10 relative overflow-hidden border-b-8 border-blue-600/10">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
          
          <div className="flex justify-center">
            <div className="w-full max-w-xl">
              <Podium entries={finalLeaderboard} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button
              onClick={handlePlayAgain}
              disabled={restarting}
              className="btn-yellow px-8 py-5 text-xl font-black italic shadow-2xl flex-1 w-full md:w-auto flex items-center justify-center gap-2"
            >
              {restarting ? 'INITIALIZING...' : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>PLAY AGAIN</span>
                </>
              )}
            </button>
            <button
              onClick={handleEndGame}
              disabled={ending}
              className="px-8 py-5 rounded-[1.5rem] bg-rose-50 text-rose-500 font-black italic text-lg border-2 border-rose-100 hover:bg-rose-100 transition-all flex-1 w-full md:w-auto flex items-center justify-center gap-2"
            >
              {ending ? 'ENDING...' : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>END MISSION</span>
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/host/dashboard')}
              className="btn-secondary px-8 py-5 text-lg font-black italic flex-1 w-full md:w-auto flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>DASHBOARD</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={endConfirm}
        title="End Game"
        message="End game and clean up now?"
        confirmText="End Game"
        danger={true}
        onConfirm={confirmEndGame}
        onCancel={() => setEndConfirm(false)}
      />
    </div>
  )
}

