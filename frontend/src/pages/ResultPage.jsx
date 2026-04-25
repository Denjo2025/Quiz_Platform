import { useNavigate, useParams } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import Leaderboard from '../components/Leaderboard'

export default function ResultPage() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { finalLeaderboard, nickname, myScore, reset } = useGameStore()

  const myRank = finalLeaderboard.find((e) => e.nickname === nickname)?.rank ?? '—'

  const handlePlayAgain = () => {
    reset()
    navigate('/join')
  }

  return (
    <div className="min-h-screen bg-vibrant-space flex flex-col items-center px-4 py-10 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700" />
      </div>

      <div className="flex-1 w-full max-w-4xl flex flex-col items-center gap-10 relative z-10">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="space-y-1">
            <h1 className="text-5xl font-black font-outfit tracking-tight text-white uppercase italic">LEADERBOARD</h1>
            <p className="text-white/40 font-black uppercase tracking-[0.4em] text-[10px]">Final Mission Report</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* My Stats Card */}
          <div className="bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
            <div className="text-center">
              <p className="text-blue-900/40 text-[8px] font-black uppercase tracking-[0.4em] mb-1">Final Rank</p>
              <div className="text-8xl font-black font-outfit text-blue-600 leading-none tracking-tighter">#{myRank}</div>
            </div>
            <div className="w-full h-px bg-blue-900/5" />
            <div className="text-center">
              <p className="text-blue-900/40 text-[8px] font-black uppercase tracking-[0.4em] mb-1">Total Credits</p>
              <div className="text-4xl font-black text-blue-900 font-outfit tracking-tight">
                {myScore.toLocaleString()}
              </div>
            </div>
            {myRank === 1 && (
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center rotate-12 shadow-xl border-4 border-white text-white">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.4 7.2h7.6l-6.15 4.47L18.25 21 12 16.5 5.75 21l2.4-7.33L2 9.2h7.6L12 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Detailed Leaderboard */}
          <div className="lg:col-span-2">
            <Leaderboard entries={finalLeaderboard} myNickname={nickname} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl animate-slide-up pt-8">
          <button
            id="btn-play-again"
            onClick={handlePlayAgain}
            className="btn-yellow flex-1 py-5 text-xl font-black flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Play Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary flex-1 py-5 text-xl font-black text-blue-600 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </button>
        </div>
      </div>
    </div>
  )
}