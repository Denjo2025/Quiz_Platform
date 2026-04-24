export default function QuizCard({ quiz, onDelete, onEdit, onStart }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all border-2 border-transparent hover:border-blue-100 group animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-blue-900 text-xl leading-none italic uppercase tracking-tight group-hover:text-blue-600 transition-colors truncate">
            {quiz.title}
          </h3>
          {quiz.description && (
            <p className="text-blue-900/30 text-[10px] font-black uppercase tracking-widest mt-3 line-clamp-2 leading-relaxed">
              {quiz.description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-50 border-2 border-blue-100 flex flex-col items-center justify-center">
          <span className="text-blue-900 font-black text-sm">{quiz.question_count ?? quiz.questions?.length ?? 0}</span>
          <span className="text-blue-900/30 font-black text-[8px] uppercase tracking-tighter">QUES</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-auto">
        <button
          onClick={() => onStart(quiz)}
          className="btn-primary flex-1 py-4 text-xs font-black shadow-lg shadow-blue-600/10"
        >
          START MISSION
        </button>
        <button
          onClick={() => onEdit(quiz)}
          className="btn-secondary w-14 h-14 p-0 flex items-center justify-center rounded-2xl border-2 border-blue-50 text-xl"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(quiz)}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-rose-50 border-2 border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xl"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}