import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getQuiz, createQuiz, updateQuiz,
  addQuestion, updateQuestion, deleteQuestion, reorderQuestions
} from '../../api/quiz'
import QuestionEditor from '../../components/QuestionEditor'
import ConfirmModal from '../../components/ConfirmModal'

export default function QuizEditorPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const isNew = !quizId || quizId === 'new'

  const [quiz, setQuiz] = useState({ title: '', description: '', questions: [] })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [editingQuestion, setEditingQuestion] = useState(null) // question index or 'new'
  const [error, setError] = useState('')
  const [savedQuizId, setSavedQuizId] = useState(isNew ? null : Number(quizId))
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (!isNew) {
      getQuiz(quizId).then((res) => {
        setQuiz(res.data)
        setLoading(false)
      }).catch(() => navigate('/host/dashboard'))
    }
  }, [quizId])

  const saveQuizMeta = async () => {
    if (!quiz.title.trim()) { setError('Quiz title is required'); return null }
    setSaving(true)
    setError('')
    try {
      if (!savedQuizId) {
        const res = await createQuiz({ title: quiz.title, description: quiz.description })
        setSavedQuizId(res.data.id)
        setQuiz((prev) => ({ ...prev, id: res.data.id }))
        return res.data.id
      } else {
        await updateQuiz(savedQuizId, { title: quiz.title, description: quiz.description })
        return savedQuizId
      }
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail || err.message || 'Unknown error'
      setError(`Save failed (HTTP ${status}): ${detail}`)
      console.error('Quiz save error:', err.response?.data || err)
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleSaveQuestion = async (data) => {
    const qid = savedQuizId || await saveQuizMeta()
    if (!qid) return
    try {
      if (editingQuestion === 'new') {
        const orderIndex = quiz.questions.length
        const res = await addQuestion(qid, { ...data, order_index: orderIndex })
        setQuiz((prev) => ({ ...prev, questions: [...prev.questions, res.data] }))
      } else {
        const q = quiz.questions[editingQuestion]
        const res = await updateQuestion(qid, q.id, { ...data, order_index: q.order_index })
        setQuiz((prev) => {
          const qs = [...prev.questions]
          qs[editingQuestion] = res.data
          return { ...prev, questions: qs }
        })
      }
      setEditingQuestion(null)
    } catch {
      setError('Failed to save question')
    }
  }

  const handleDeleteQuestion = (index) => {
    setDeleteConfirm(index)
  }

  const confirmDeleteQuestion = async () => {
    const index = deleteConfirm
    setDeleteConfirm(null)
    const q = quiz.questions[index]
    if (q.id && savedQuizId) {
      try {
        await deleteQuestion(savedQuizId, q.id)
      } catch { /* ignore */ }
    }
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const handleMoveQuestion = async (index, direction) => {
    const qs = [...quiz.questions]
    const target = index + direction
    if (target < 0 || target >= qs.length) return;
    [qs[index], qs[target]] = [qs[target], qs[index]]
    setQuiz((prev) => ({ ...prev, questions: qs }))
    if (savedQuizId) {
      await reorderQuestions(savedQuizId, qs.map((q) => q.id)).catch(() => { })
    }
  }

  const handleSaveAndExit = async () => {
    const qid = await saveQuizMeta()
    if (qid) navigate('/host/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen bg-vibrant-space flex flex-col items-center justify-center">
      <p className="text-white font-black uppercase tracking-[0.5em] text-xs animate-pulse">Decrypting Mission Data...</p>
    </div>
  )




  return (
    <div className="min-h-screen bg-vibrant-space flex flex-col px-4 py-8 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-4xl mx-auto flex-1 space-y-10 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] shadow-2xl border-b-8 border-blue-600/10">
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto text-center sm:text-left">
            <button
              onClick={() => navigate('/host/dashboard')}
              className="w-12 h-12 flex-shrink-0 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-inner"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="space-y-0.5">
              <h1 className="text-3xl font-black text-blue-900 font-outfit tracking-tighter leading-none italic uppercase">Mission Editor</h1>
              <p className="text-blue-900/30 font-black uppercase tracking-widest text-[9px]">Secure Environment</p>
            </div>
          </div>
          <button
            onClick={handleSaveAndExit}
            disabled={saving}
            className="btn-yellow px-8 py-4 flex items-center justify-center gap-2 w-full md:w-auto"
          >
            {saving ? (
              <div className="w-5 h-5 border-4 border-blue-900/20 border-t-blue-900 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="font-black text-lg">FINALIZE MISSION</span>
          </button>
        </div>

        {/* Quiz Meta */}
        <div className="bg-white rounded-[3rem] p-8 space-y-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner text-blue-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-blue-900 font-outfit uppercase italic tracking-tighter">Operation Details</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-blue-900/30 text-[9px] font-black uppercase tracking-[0.4em] ml-2">Operation Code Name</label>
              <input
                className="w-full px-6 py-4 rounded-[1.5rem] bg-blue-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white text-lg font-black font-outfit text-blue-900 outline-none transition-all shadow-inner"
                placeholder="Mission Alpha..."
                value={quiz.title}
                onChange={(e) => setQuiz((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-blue-900/30 text-[9px] font-black uppercase tracking-[0.4em] ml-2">Mission Objectives</label>
              <textarea
                className="w-full px-6 py-4 rounded-[1.5rem] bg-blue-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white text-blue-900 outline-none transition-all shadow-inner h-[60px] resize-none text-sm font-medium"
                placeholder="Brief your agents..."
                value={quiz.description || ''}
                onChange={(e) => setQuiz((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-6 rounded-[2.5rem] bg-rose-50 border-2 border-rose-100 text-rose-500 font-black italic flex items-center gap-3 animate-shake">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm tracking-tight">{error}</span>
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white font-outfit uppercase italic tracking-tighter">Tactical Sections</h2>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-2xl text-blue-600 font-black font-outfit text-lg">
                {quiz.questions.length}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {quiz.questions.map((q, i) => (
              <div key={q.id || i} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                {editingQuestion === i ? (
                  <QuestionEditor
                    initial={q}
                    onSave={handleSaveQuestion}
                    onCancel={() => setEditingQuestion(null)}
                  />
                ) : (
                  <div className="bg-white rounded-[2.5rem] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 group hover:shadow-2xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 border-4 border-white shadow-inner flex items-center justify-center font-black text-blue-900/20 text-2xl font-outfit flex-shrink-0 group-hover:text-blue-600 group-hover:scale-110 transition-all">
                        {i + 1}
                      </div>

                      <div className="flex-1 min-w-0 relative z-10 sm:hidden">
                        <p className="text-blue-900 font-black font-outfit text-xl tracking-tighter italic line-clamp-1 group-hover:text-blue-600 transition-colors">{q.text}</p>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 relative z-10 hidden sm:block">
                      <p className="text-blue-900 font-black font-outfit text-xl tracking-tighter italic line-clamp-1 group-hover:text-blue-600 transition-colors">{q.text}</p>
                      <div className="flex items-center gap-4 mt-1.5">
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 rounded-lg text-[9px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {q.time_limit_seconds}s
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 rounded-lg text-[9px] font-black text-emerald-600 uppercase tracking-widest shadow-sm">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          {q.points} Pts
                        </div>
                      </div>
                    </div>

                    {/* Show tags on mobile below text */}
                    <div className="flex items-center gap-4 mt-1 sm:hidden w-full px-1 relative z-10">
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 rounded-lg text-[9px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {q.time_limit_seconds}s
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 rounded-lg text-[9px] font-black text-emerald-600 uppercase tracking-widest shadow-sm">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          {q.points} Pts
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 justify-between sm:justify-end relative z-10 border-t border-blue-50 sm:border-t-0 pt-4 sm:pt-0">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveQuestion(i, -1)}
                          disabled={i === 0}
                          className="p-1.5 bg-blue-50 text-blue-900/20 hover:text-blue-600 rounded-lg disabled:opacity-0 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(i, 1)}
                          disabled={i === quiz.questions.length - 1}
                          className="p-1.5 bg-blue-50 text-blue-900/20 hover:text-blue-600 rounded-lg disabled:opacity-0 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <button
                        onClick={() => setEditingQuestion(i)}
                        className="btn-primary py-3 px-5 text-sm font-black italic bg-blue-600 text-white"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(i)}
                        className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-inner"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Question */}
          {editingQuestion === 'new' ? (
            <div className="animate-fade-in">
              <QuestionEditor
                onSave={handleSaveQuestion}
                onCancel={() => setEditingQuestion(null)}
              />
            </div>
          ) : (
            <button
              onClick={async () => {
                const qid = savedQuizId || await saveQuizMeta()
                if (qid) setEditingQuestion('new')
              }}
              className="w-full py-10 rounded-[3rem] border-4 border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/60 hover:bg-white/5 transition-all flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-2xl">
                <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-black font-outfit uppercase tracking-[0.5em] text-[10px]">Initialize New Tactical Section</span>
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        show={deleteConfirm !== null}
        title="Delete Question"
        message="Delete this question?"
        confirmText="Delete"
        danger={true}
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}


