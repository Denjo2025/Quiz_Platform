import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameSocket } from '../../hooks/useGameSocket'
import { useAuthStore } from '../../store/authStore'
import PlayerCard from '../../components/PlayerCard'
import { QRCodeSVG } from 'qrcode.react'

export default function QuizLobbyPage() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const [players, setPlayers] = useState([])
  const [quizTitle, setQuizTitle] = useState('')
  const [starting, setStarting] = useState(false)

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
        setPlayers(payload.players || [])
        setQuizTitle(payload.quiz_title || '')
        break
      case 'player_joined':
        setPlayers((prev) =>
          prev.includes(payload.nickname) ? prev : [...prev, payload.nickname]
        )
        break
      case 'player_left':
        setPlayers((prev) => prev.filter((p) => p !== payload.nickname))
        break
      case 'game_starting':
        setStarting(true)
        useAuthStore.getState().setHostRoomCode(roomCode)
        setTimeout(() => navigate(`/host/control/${roomCode}`), 3500)
        break
    }
  }, [lastMessage])

  const handleStart = () => {
    if (players.length === 0) return
    sendMessage({ type: 'host_start_game' })
  }

  return (
    <div className="min-h-screen bg-vibrant-space flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative background stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700" />
      </div>

      {starting ? (
        <div className="text-center space-y-10 animate-pulse">
          <div className="space-y-3">
            <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter">IGNITION!</h1>
            <p className="text-white/60 font-black uppercase tracking-[0.5em] text-xs">Synchronizing Mission Parameters...</p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl relative z-10 animate-fade-in flex gap-8 flex-wrap md:flex-nowrap justify-center">
          {/* Left Side - Room Info & Players */}
          <div className="flex-1 bg-white rounded-[3rem] p-10 shadow-2xl space-y-10 relative overflow-hidden border-b-8 border-blue-600/10 min-w-0">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
          
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left space-y-3">
                <p className="text-blue-900/30 text-[9px] font-black uppercase tracking-[0.5em]">MISSION IDENTIFIER</p>
                <h1 className="text-7xl font-black text-blue-900 font-outfit tracking-tighter leading-none italic uppercase">
                  {roomCode}
                </h1>
                {quizTitle && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border-2 border-blue-100">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-blue-900 text-sm font-black italic uppercase tracking-tight">{quizTitle}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center md:items-end gap-4">
                <div className="text-center md:text-right space-y-2">
                  <p className="text-blue-900/30 text-[9px] font-black uppercase tracking-[0.4em]">MISSION STATUS</p>
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black italic uppercase tracking-tight ${connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                    <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {connectionStatus === 'connected' ? 'UPLINK ESTABLISHED' : 'ACQUIRING SIGNAL...'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-[2.5rem] p-8 space-y-6 shadow-inner border-2 border-blue-100/50">
              <div className="flex items-center justify-between border-b-2 border-blue-100 pb-4">
                <h2 className="text-blue-900 font-black italic uppercase tracking-tight text-xl">ACTIVE RECRUITS</h2>
                <span className="bg-blue-900 text-white px-4 py-1 rounded-full font-black text-sm">{players.length}</span>
              </div>
              
              {players.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <svg className="w-12 h-12 text-blue-200 mx-auto animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M2.828 9.9a15 15 0 0121.214 0" />
                  </svg>
                  <p className="text-blue-900/40 text-xs font-black italic uppercase tracking-widest">Scanning for incoming signals...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {players.map((p, i) => (
                    <div key={p} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                      <PlayerCard nickname={p} index={i} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                id="btn-start-game"
                onClick={handleStart}
                disabled={players.length === 0}
                className="btn-yellow w-full max-w-md py-5 text-xl font-black italic disabled:opacity-50 disabled:grayscale transition-all"
              >
                {players.length === 0 ? 'WAITING FOR RECRUITS...' : `COMMENCE MISSION (${players.length})`}
              </button>
              <button
                onClick={() => navigate('/host/dashboard')}
                className="text-blue-900/20 hover:text-blue-600 transition-colors font-black text-[9px] uppercase tracking-[0.5em] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ABORT MISSION
              </button>
            </div>
          </div>

          {/* Right Side - QR Code */}
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl flex flex-col items-center justify-center gap-6 w-80 flex-shrink-0">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
            
            <div className="text-center space-y-2">
              <p className="text-blue-900/30 text-[9px] font-black uppercase tracking-[0.4em]">QUICK JOIN</p>
              <p className="text-blue-900 text-xs font-black italic">Scan to Join</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border-4 border-blue-50 shadow-inner">
              <QRCodeSVG
                value={`${window.location.origin}/join/${roomCode}`}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="text-center space-y-1">
              <p className="text-blue-900/40 text-[8px] font-black uppercase tracking-[0.3em]">OR ENTER PIN</p>
              <p className="text-3xl font-black text-blue-600 tracking-[0.2em]">{roomCode}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}