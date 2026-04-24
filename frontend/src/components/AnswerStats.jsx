const answerLabels = ['A', 'B', 'C', 'D']
const barColors = [
  'bg-emerald-500 shadow-emerald-500/20',
  'bg-rose-500 shadow-rose-500/20',
  'bg-amber-500 shadow-amber-500/20',
  'bg-sky-500 shadow-sky-500/20'
]
const indicatorColors = [
  'bg-emerald-50 text-emerald-600',
  'bg-rose-50 text-rose-600',
  'bg-amber-50 text-amber-600',
  'bg-sky-50 text-sky-600'
]

export default function AnswerStats({ stats = [], correctIndex, answers = [] }) {
  const maxCount = Math.max(...stats.map((s) => s.count), 1)

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-6">
        {stats.map((s) => {
          const pct = Math.round((s.count / maxCount) * 100)
          const isCorrect = s.index === correctIndex
          const label = answers[s.index]?.text || `Option ${answerLabels[s.index]}`

          return (
            <div key={s.index} className="space-y-3 group animate-slide-up" style={{ animationDelay: `${s.index * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black font-outfit shadow-sm ${indicatorColors[s.index]}`}>
                    {answerLabels[s.index]}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-black font-outfit tracking-tighter text-lg leading-none ${isCorrect ? 'text-emerald-600' : 'text-blue-900/60'}`}>
                      {label}
                    </span>
                    {isCorrect && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">Correct Answer</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black font-outfit text-blue-900 tabular-nums leading-none">{s.count}</div>
                  <div className="text-[10px] font-black text-blue-900/20 uppercase tracking-widest">Responses</div>
                </div>
              </div>
              
              <div className="relative w-full h-5 bg-blue-50 rounded-full overflow-hidden border border-blue-100/50 shadow-inner">
                <div 
                  className={`absolute inset-y-0 left-0 h-full ${barColors[s.index]} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 mix-blend-overlay animate-pulse" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


