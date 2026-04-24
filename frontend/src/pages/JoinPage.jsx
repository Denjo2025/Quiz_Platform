import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRoomInfo } from '../api/room'
import { useGameStore } from '../store/gameStore'

export default function JoinPage() {
  const { roomCode: urlRoomCode } = useParams()
  const [pin, setPin] = useState(urlRoomCode || '')
  const [nickname, setNicknameLocal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const { setRoom, setNickname } = useGameStore()

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    const code = pin.trim().toUpperCase()
    const nick = nickname.trim()

    if (code.length !== 6) { setError('PIN must be 6 characters'); return }
    if (!nick || nick.length < 1 || nick.length > 20) {
      setError('Nickname must be 1–20 characters'); return
    }

    setLoading(true)
    try {
      const res = await getRoomInfo(code)
      const room = res.data
      if (room.status !== 'waiting') {
        setError('Mission is already in progress.')
        return
      }
      setRoom(code)
      setNickname(nick)
      navigate(`/lobby/${code}`)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Room not found. Check the PIN and try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vibrant-space flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden border-b-8 border-blue-600/10">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />

          <div className="text-center space-y-4">
            <div>
              <h1 className="text-3xl font-black text-blue-900 font-outfit tracking-tighter italic uppercase leading-none">JOIN SQUAD</h1>
              <p className="text-blue-900/30 font-black uppercase tracking-widest text-[8px] mt-1">Initialize Mission Parameters</p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-blue-900/40 text-[9px] font-black uppercase tracking-[0.4em] ml-4">Mission PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  className="w-full bg-blue-50 border-4 border-transparent focus:border-blue-600/20 focus:bg-white px-6 py-4 rounded-[1.5rem] text-blue-900 font-black font-outfit text-4xl text-center placeholder:text-blue-900/10 outline-none transition-all shadow-inner tracking-[0.3em] uppercase italic"
                  placeholder="000000"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-blue-900/40 text-[9px] font-black uppercase tracking-[0.3em] ml-4">Agent Codename</label>
                <input
                  type="text"
                  className="w-full bg-blue-50 border-4 border-transparent focus:border-blue-600/20 focus:bg-white px-6 py-4 rounded-[1.5rem] text-blue-900 font-black font-outfit text-xl outline-none transition-all shadow-inner placeholder:text-blue-900/10"
                  placeholder="CODENAME"
                  value={nickname}
                  onChange={(e) => setNicknameLocal(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-500 text-xs font-black italic text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !pin || !nickname}
              className="btn-primary w-full py-5 text-xl font-black italic shadow-2xl disabled:opacity-50 disabled:grayscale transition-all"
            >
              {loading ? 'LAUNCHING...' : 'INITIALIZE'}
            </button>
          </form>

          <div className="space-y-6 pt-4">
            <button
              onClick={() => navigate('/')}
              className="w-full text-center text-blue-900/20 hover:text-blue-600 transition-colors font-black text-[9px] uppercase tracking-[0.5em] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retreat to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
