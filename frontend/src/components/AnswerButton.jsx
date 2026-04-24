const labels = ['A', 'B', 'C', 'D']
const colors = [
  'bg-emerald-500', // A - Green
  'bg-rose-500',    // B - Red
  'bg-amber-500',   // C - Orange/Yellow
  'bg-sky-500'      // D - Blue
]

export default function AnswerButton({ 
  index, 
  text, 
  image_url, 
  disabled, 
  selected, 
  correct, 
  wrong, 
  onClick 
}) {
  let statusClass = 'bg-white text-blue-900 border-transparent hover:translate-y-[-6px] hover:shadow-2xl'
  if (selected) statusClass = 'bg-blue-50 ring-4 ring-blue-400/50'
  
  if (correct) {
    statusClass = 'bg-emerald-50 ring-4 ring-emerald-500/50 scale-[1.05] z-10 shadow-2xl'
  } else if (wrong) {
    statusClass = 'bg-rose-50 ring-4 ring-rose-500/50 opacity-50 grayscale'
  }

  const hasImage = !!image_url

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative w-full flex flex-col rounded-[2.5rem] 
        transition-all duration-300 shadow-xl font-outfit
        disabled:cursor-not-allowed
        overflow-hidden
        ${statusClass}
      `}
    >
      {hasImage && (
        <div className="w-full h-40 overflow-hidden relative">
          <img src={image_url} alt={`Option ${labels[index]}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <div className="w-full flex items-center gap-6 px-6 py-5 relative">
        <div className={`
          flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white
          transition-transform duration-500 shadow-lg
          ${colors[index]}
          ${selected ? 'scale-110 rotate-6' : 'group-hover:rotate-12'}
        `}>
          {labels[index]}
        </div>
        
        <span className={`flex-1 text-left leading-tight font-black tracking-tight ${hasImage ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
          {text}
        </span>

        {correct && (
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}