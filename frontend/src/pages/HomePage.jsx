import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { getRoomInfo } from '../api/room'

export default function HomePage() {
  const [pin, setPin] = useState('')
  const [nickname, setNicknameLocal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => !!s.token)
  const { setRoom, setNickname, reset } = useGameStore()

  useEffect(() => { reset() }, [reset])

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
        setError('Uplink failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vibrant-space flex items-center justify-center relative overflow-x-hidden p-6 lg:p-12">
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-7xl relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* Left Side: Hero Content */}
        <div className="flex-1 w-full space-y-8 animate-fade-in text-center lg:text-left">

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md mx-auto lg:mx-0">
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
              <span className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Mission Protocol Active</span>
            </div>

            <h1 className="text-7xl lg:text-[140px] font-black text-white italic uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
              VIBRANT<br />
              <span className="text-yellow-400">ARENA</span>
            </h1>

            <p className="text-blue-100/80 text-lg lg:text-xl font-medium max-w-xl mx-auto lg:mx-0">
              The elite multiplayer battleground for intellectual dominance.<br className="hidden lg:block" />
              Launch your mission or join the squad instantly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            {/* Join Squad Button - ONLY VISIBLE ON MOBILE */}
            <button
              onClick={() => navigate('/join')}
              className="lg:hidden btn-yellow px-10 py-5 text-xl font-black italic shadow-2xl flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 transition-all"
            >
              <svg className="w-7 h-7 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.93 9.48a3.19 3.19 0 00-1.68-2.58l-5.74-3.32a3.19 3.19 0 00-3.18 0l-5.74 3.32a3.19 3.19 0 00-1.68 2.58l-.16 2.5a6.41 6.41 0 001.3 4.29l1.6 2.11a3.2 3.2 0 002.58 1.28h5.72a3.2 3.2 0 002.58-1.28l1.6-2.11a6.41 6.41 0 001.3-4.29l-.16-2.5zm-5.43 3.52a1.5 1.5 0 111.5-1.5 1.5 1.5 0 01-1.5 1.5zm-3-1.5a1.5 1.5 0 111.5-1.5 1.5 1.5 0 01-1.5 1.5zm-5 1.5a1.5 1.5 0 111.5-1.5 1.5 1.5 0 01-1.5 1.5zM10 8H8V6H6v2H4v2h2v2h2v-2h2V8z" />
              </svg>
              JOIN SQUAD
            </button>

            <button
              onClick={() => navigate(isAuthenticated ? '/host/dashboard' : '/host/login')}
              className="bg-blue-600/30 hover:bg-blue-500/40 text-white border-2 border-white/20 px-10 py-5 rounded-[2.5rem] text-xl font-black italic transition-all backdrop-blur-md flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 shadow-xl"
            >
              <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              {isAuthenticated ? 'DASHBOARD' : 'HOST MISSION'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/10 max-w-xl mx-auto lg:mx-0">
            {[
              { label: 'Real-time', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />, desc: 'Zero latency', color: 'text-yellow-400' },
              { label: 'Social', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />, desc: 'Squad play', color: 'text-yellow-400' },
              { label: 'Elite', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />, desc: 'Top rankings', color: 'text-yellow-400' }
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center lg:items-start space-y-1">
                <svg className={`w-6 h-6 ${f.color} mb-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {f.icon}
                </svg>
                <p className="text-white font-black uppercase tracking-tighter italic text-xs">{f.label}</p>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-none">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Join Form Card - ONLY VISIBLE ON DESKTOP */}
        <div className="hidden lg:flex w-full max-w-md animate-fade-in relative z-10">
          <div className="bg-white w-full rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden">
            <div className="text-center space-y-4">
              <div>
                <h2 className="text-3xl font-black text-blue-900 font-outfit tracking-tighter italic uppercase leading-none">JOIN SQUAD</h2>
                <p className="text-blue-900/40 font-black uppercase tracking-widest text-[8px] mt-1">ENTER MISSION IDENTIFIER BELOW</p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full bg-blue-50/50 border-4 border-transparent focus:border-blue-600/20 focus:bg-blue-50 px-6 py-5 rounded-[1.5rem] text-blue-900 font-black font-outfit text-2xl text-center placeholder:text-blue-900/30 outline-none transition-all tracking-[0.3em] uppercase italic"
                    placeholder="MISSION PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  />
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    className="w-full bg-blue-50/50 border-4 border-transparent focus:border-blue-600/20 focus:bg-blue-50 px-6 py-5 rounded-[1.5rem] text-blue-900 font-black font-outfit text-xl text-center outline-none transition-all placeholder:text-blue-900/30 placeholder:italic placeholder:tracking-widest uppercase italic"
                    placeholder="AGENT CODENAME"
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
                className="w-full bg-white border-4 border-blue-50 text-blue-300 hover:text-blue-600 hover:border-blue-100 py-5 rounded-[1.5rem] text-xl font-black italic transition-all shadow-sm disabled:opacity-50 disabled:grayscale"
              >
                {loading ? 'LAUNCHING...' : 'INITIALIZE'}
              </button>
            </form>

            <p className="text-center text-blue-900/20 font-black text-[8px] uppercase tracking-[0.5em]">
              SECURE UPLINK V1.0.4
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}