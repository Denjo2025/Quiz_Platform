import { useEffect, useState } from 'react'

export default function Podium({ entries = [] }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  const top3 = entries.slice(0, 3)
  const order = [top3[1], top3[0], top3[2]]
  const heights = ['h-48', 'h-64', 'h-36']
  const medals = ['🥈', '🥇', '🥉']
  const delays = ['delay-300', 'delay-100', 'delay-500']
  const colors = [
    'bg-slate-50 border-slate-200 text-slate-400',
    'bg-yellow-50 border-yellow-200 text-yellow-600',
    'bg-amber-50 border-amber-200 text-amber-700'
  ]
  const avatarColors = [
    'bg-slate-100 text-slate-600 border-slate-200',
    'bg-yellow-400 text-white border-yellow-300 shadow-yellow-400/20',
    'bg-amber-100 text-amber-700 border-amber-200'
  ]

  return (
    <div className="w-full max-w-4xl mx-auto py-12">
      <div className="flex items-end justify-center gap-4 sm:gap-8 mb-0">
        {order.map((player, i) => {
          if (!player) return <div key={i} className="w-32" />
          
          const isWinner = i === 1
          
          return (
            <div
              key={player.nickname}
              className={`flex flex-col items-center gap-6 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} ${delays[i]}`}
            >
              <div className="relative group">
                <div className={`
                  w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] border-4 flex items-center justify-center text-3xl sm:text-4xl font-black font-outfit shadow-2xl
                  ${avatarColors[i]}
                  ${isWinner ? 'scale-125 ring-8 ring-yellow-400/10' : ''}
                  transition-all duration-500 group-hover:scale-110
                `}>
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 text-5xl animate-bounce ${delays[i]}`}>
                  {medals[i]}
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className={`font-black font-outfit uppercase tracking-tighter text-xl truncate max-w-[10rem] ${isWinner ? 'text-blue-900' : 'text-blue-900/60'}`}>
                  {player.nickname}
                </p>
                <p className="text-blue-600 font-black text-sm italic uppercase tracking-widest">{player.score.toLocaleString()} PTS</p>
              </div>

              <div className={`
                w-32 sm:w-40 ${heights[i]} rounded-t-[3rem] ${colors[i]} border-4 border-b-0 shadow-2xl shadow-blue-900/5 
                flex flex-col items-center justify-start pt-8 transition-all duration-1000 ${delays[i]} 
                ${visible ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'} origin-bottom relative overflow-hidden
              `}>
                <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/50" />
                <span className="relative z-10 text-current/10 text-8xl font-black font-outfit leading-none">
                  {i === 1 ? '1' : i === 0 ? '2' : '3'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {entries.length > 3 && (
        <div className="mt-16 space-y-4 px-6 animate-fade-in delay-700">
          <label className="block text-blue-900/20 font-black text-[10px] uppercase tracking-[0.5em] text-center mb-8">MISSION HONOR ROLL</label>
          <div className="grid grid-cols-1 gap-4">
            {entries.slice(3, 8).map((entry, idx) => (
              <div 
                key={entry.nickname} 
                className="flex items-center gap-6 px-10 py-6 rounded-[2.5rem] bg-blue-50/50 border-2 border-blue-100/50 hover:bg-blue-50 transition-all group"
              >
                <span className="text-blue-900/20 font-black font-outfit text-xl w-8 text-center group-hover:text-blue-600 transition-colors">
                  {entry.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-black font-outfit text-blue-900 truncate text-lg block italic uppercase tracking-tight">{entry.nickname}</span>
                </div>
                <div className="text-right">
                  <span className="font-black font-outfit text-blue-900/40 text-sm tabular-nums block">{entry.score.toLocaleString()}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-900/10">MISSION PTS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}