import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getQuizzes, deleteQuiz } from '../../api/quiz'
import { createRoom } from '../../api/room'
import { useAuthStore } from '../../store/authStore'
import ConfirmModal from '../../components/ConfirmModal'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [errorModal, setErrorModal] = useState('')

  const loadQuizzes = async () => {
    try {
      const res = await getQuizzes()
      setQuizzes(res.data)
    } catch {
      // auth error handled globally
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadQuizzes() }, [])

  const handleStart = async (quiz) => {
    setStarting(quiz.id)
    try {
      const res = await createRoom(quiz.id)
      navigate(`/host/lobby/${res.data.room_code}`)
    } catch (err) {
      setErrorModal(err.response?.data?.detail || 'Could not create room')
    } finally {
      setStarting(null)
    }
  }

  const handleEdit = (quiz) => navigate(`/host/quiz/${quiz.id}`)

  const handleDelete = (quiz) => {
    setDeleteConfirm(quiz)
  }

  const confirmDelete = async () => {
    const quiz = deleteConfirm
    setDeleteConfirm(null)
    try {
      await deleteQuiz(quiz.id)
      setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id))
    } catch {
      setErrorModal('Failed to delete quiz')
    }
  }

  return (
    <div className="min-h-screen bg-vibrant-space flex flex-col px-4 py-8 relative overflow-hidden">
      {/* Decorative background stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-6xl mx-auto flex-1 space-y-10 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] shadow-2xl border-b-8 border-blue-600/10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <span className="text-3xl text-white font-black italic">K</span>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-3xl font-black text-blue-900 font-outfit tracking-tighter leading-none italic">MISSION CONTROL</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-blue-900/40 font-black uppercase tracking-widest text-[9px]">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={() => navigate('/host/quiz/new')}
              className="btn-yellow px-6 py-4 text-lg flex items-center justify-center gap-2 group flex-1 md:flex-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Create Operation
            </button>
            <button onClick={logout} className="p-4 bg-blue-50 text-blue-400 rounded-2xl hover:bg-rose-50 hover:text-rose-400 transition-colors shadow-inner">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="text-white/40 font-black uppercase tracking-[0.5em] text-xs animate-pulse">Synchronizing Data...</div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white/10 rounded-[3rem] border-4 border-white/10 border-dashed py-24 flex flex-col items-center gap-8 text-center animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white font-outfit tracking-tighter italic">NO ACTIVE OPERATIONS</h2>
              <p className="text-white/40 font-medium text-sm max-w-xs mx-auto">Launch your first mission to begin intelligence gathering.</p>
            </div>
            <button
              onClick={() => navigate('/host/quiz/new')}
              className="btn-yellow px-10 py-5 text-xl"
            >
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Initialize First Mission
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
            {quizzes.map((quiz, i) => (
              <div 
                key={quiz.id} 
                className={`
                  bg-white rounded-[2.5rem] p-7 flex flex-col gap-6 group hover:shadow-2xl transition-all relative overflow-hidden animate-slide-up
                  ${starting === quiz.id ? 'opacity-60 cursor-wait' : ''}
                `}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-600/10 text-blue-600 rounded-lg font-black text-[9px] uppercase tracking-widest">
                        {quiz.question_count ?? 0} Questions
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-blue-900 font-outfit tracking-tighter italic group-hover:text-blue-600 transition-colors">
                      {quiz.title}
                    </h3>
                    <p className="text-blue-900/40 text-xs font-medium line-clamp-2 leading-relaxed">
                      {quiz.description || 'No detailed mission parameters provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-auto relative z-10 pt-5 border-t border-blue-900/5">
                  <button
                    onClick={() => handleStart(quiz)}
                    disabled={starting === quiz.id}
                    className="btn-primary flex-[2] py-3.5 flex items-center justify-center gap-2 bg-blue-600 text-white text-lg"
                  >
                    {starting === quiz.id ? (
                      <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        DEPLOY
                      </>
                    )}
                  </button>
                  <div className="flex gap-2 justify-center sm:justify-end">
                    <button
                      onClick={() => handleEdit(quiz)}
                      className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-inner"
                      title="Edit Mission"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(quiz)}
                      className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-inner"
                      title="Terminate"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        show={!!deleteConfirm}
        title="Delete Quiz"
        message={`Delete "${deleteConfirm?.title}"? This cannot be undone.`}
        confirmText="Delete"
        danger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmModal
        show={!!errorModal}
        title="Error"
        message={errorModal}
        onConfirm={() => setErrorModal('')}
      />
    </div>
  )
}