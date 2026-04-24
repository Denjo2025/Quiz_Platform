export default function QuestionDisplay({ text, image_url, questionIndex, totalQuestions, mode = 'default' }) {
  const isVibrant = mode === 'vibrant'
  
  const fontSize =
    text.length > 120 ? 'text-2xl lg:text-3xl' :
    text.length > 60 ? 'text-3xl lg:text-4xl' :
    'text-4xl lg:text-5xl'

  if (isVibrant) {
    return (
      <div className="w-full flex flex-col gap-10 animate-fade-in">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {image_url && (
            <div className="w-full md:w-1/2 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-blue-50 group">
              <img
                src={image_url}
                alt="Question"
                className="w-full object-cover max-h-72 group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          )}
          <div className={`flex-1 flex items-center justify-center min-h-[200px] ${!image_url ? 'w-full' : ''}`}>
            <h2 className={`font-black text-blue-900 leading-[1.1] tracking-tighter text-center font-outfit ${fontSize} text-balance`}>
              {text}
            </h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center gap-8 animate-fade-in relative">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-4 text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
          <span>Sector {questionIndex + 1}</span>
          <span className="w-1 h-1 bg-white/20 rounded-full" />
          <span>Total {totalQuestions}</span>
        </div>
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full flex flex-col lg:row items-center gap-8">
        {image_url && (
          <div className="w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/40 border border-white/10 group">
            <img
              src={image_url}
              alt="Intelligence Feed"
              className="w-full object-cover max-h-64 group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        )}

        <div className="card w-full py-10 px-8 flex items-center justify-center min-h-[160px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 text-[10rem] font-black text-white/[0.02] -mr-10 -mt-10 select-none pointer-events-none font-outfit">
            Q{questionIndex + 1}
          </div>
          <p className={`font-black text-white leading-tight tracking-tight text-center relative z-10 font-outfit ${fontSize} text-balance`}>
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}