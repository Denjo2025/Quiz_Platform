export default function Leaderboard({ entries = [], myNickname }) {
  return (
    <div className="w-full space-y-4">
      {entries.map((entry, i) => {
        let tierClass = 'bg-white text-blue-900 border-2 border-blue-50 shadow-lg shadow-blue-900/5'
        let rankColor = 'bg-blue-50 text-blue-400'
        
        if (i === 0) {
          tierClass = 'bg-yellow-400 text-blue-900 shadow-xl shadow-yellow-500/20 border-yellow-300'
          rankColor = 'bg-yellow-500 text-white shadow-lg shadow-yellow-600/20'
        } else if (i === 1) {
          tierClass = 'bg-slate-100 text-blue-900 shadow-xl shadow-slate-400/20 border-slate-200'
          rankColor = 'bg-slate-400 text-white shadow-lg'
        } else if (i === 2) {
          tierClass = 'bg-orange-100 text-blue-900 shadow-xl shadow-orange-500/20 border-orange-200'
          rankColor = 'bg-orange-400 text-white shadow-lg'
        }

        const isMe = entry.nickname === myNickname

        return (
          <div
            key={entry.nickname}
            className={`
              ${tierClass}
              flex items-center gap-6 px-10 py-6 rounded-[2.5rem] 
              transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden
              ${isMe ? 'ring-4 ring-blue-600/20 ring-offset-4 ring-offset-white' : ''}
            `}
          >
            <div className={`
              w-14 h-14 rounded-2xl flex items-center justify-center font-black font-outfit text-2xl
              ${rankColor} shadow-inner flex-shrink-0
            `}>
              {entry.rank}
            </div>

            <div className="flex-1 min-w-0">
              <span className="font-black font-outfit text-2xl md:text-3xl tracking-tighter italic uppercase block truncate group-hover:translate-x-1 transition-transform leading-none">
                {entry.nickname}
                {isMe && <span className="ml-3 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 px-3 py-1 bg-blue-600/10 rounded-full italic align-middle">YOU</span>}
              </span>
              <span className="text-blue-900/20 font-black uppercase tracking-widest text-[8px] mt-1 block">Active Recruit</span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black tabular-nums font-outfit italic tracking-tighter leading-none">
                {entry.score.toLocaleString()}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-900/20 mt-1">Points</span>
            </div>

            {/* Subtle highlight for winner */}
            {i === 0 && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
            )}
          </div>
        )
      })}

      {entries.length === 0 && (
        <div className="text-center py-20 bg-blue-50 rounded-[4rem] border-4 border-dashed border-blue-100">
          <p className="text-blue-900/20 font-black uppercase tracking-[0.5em] text-sm">NO MISSION DATA ARCHIVED</p>
        </div>
      )}
    </div>
  )
}