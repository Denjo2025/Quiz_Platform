export default function PlayerCard({ nickname, index = 0 }) {
  const colors = [
    'bg-blue-100 text-blue-600 border-blue-200',
    'bg-amber-100 text-amber-600 border-amber-200',
    'bg-rose-100 text-rose-600 border-rose-200',
    'bg-emerald-100 text-emerald-600 border-emerald-200',
    'bg-violet-100 text-violet-600 border-violet-200',
    'bg-sky-100 text-sky-600 border-sky-200'
  ]
  const colorStyle = colors[index % colors.length]

  return (
    <div className="flex flex-col items-center gap-4 group animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
      <div
        className={`w-16 h-16 rounded-[1.5rem] border-4 ${colorStyle} flex items-center justify-center text-2xl font-black font-outfit shadow-lg shadow-blue-900/5 transform transition-all group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-blue-900/10`}
      >
        {nickname.charAt(0).toUpperCase()}
      </div>
      <span className="text-blue-900/40 text-[10px] font-black uppercase tracking-[0.3em] truncate w-full text-center group-hover:text-blue-600 transition-colors">
        {nickname}
      </span>
    </div>
  )
}