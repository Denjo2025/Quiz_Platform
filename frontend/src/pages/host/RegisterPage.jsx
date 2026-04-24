import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { setAuthToken } from '../../api/axios'

export default function RegisterPage() {
  const navigate = useNavigate()
  const loginStore = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const res = await register(email, password)
      const token = res.data.access_token
      setAuthToken(token)
      loginStore(token, { email })
      navigate('/host/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vibrant-space flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden border-b-8 border-blue-600/10">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
          
          <div className="text-center space-y-4">
            <div>
              <h1 className="text-4xl font-black text-blue-900 font-outfit tracking-tighter italic uppercase leading-none">New Recruitment</h1>
              <p className="text-blue-900/30 font-black uppercase tracking-widest text-[8px] mt-1">Join the Elite Command Rank</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <label className="block text-blue-900/30 text-[9px] font-black uppercase tracking-[0.4em] ml-2">Email Feed</label>
              <input
                type="email"
                className="w-full bg-blue-50 border-4 border-transparent focus:border-blue-600/20 focus:bg-white px-6 py-4 rounded-[1.5rem] text-blue-900 font-black font-outfit text-lg outline-none transition-all shadow-inner"
                placeholder="commander@mission.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-3">
              <label className="block text-blue-900/30 text-[9px] font-black uppercase tracking-[0.4em] ml-2">New Security Key</label>
              <input
                type="password"
                className="w-full bg-blue-50 border-4 border-transparent focus:border-blue-600/20 focus:bg-white px-6 py-4 rounded-[1.5rem] text-blue-900 font-black font-outfit text-lg outline-none transition-all shadow-inner"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-100 text-rose-500 font-black italic text-center text-xs animate-shake flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-yellow w-full py-5 text-xl font-black italic shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-4 border-blue-900/20 border-t-blue-900 rounded-full animate-spin" />
                  <span>INITIALIZING...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>CONFIRM ENLISTMENT</span>
                </div>
              )}
            </button>
          </form>

          <div className="space-y-6">
            <p className="text-center text-blue-900/30 text-[10px] font-black uppercase tracking-widest">
              Already a Commander?{' '}
              <Link to="/host/login" className="text-blue-600 hover:text-blue-500 transition-colors">
                Sign In
              </Link>
            </p>

            <button
              onClick={() => navigate('/')}
              className="w-full text-center text-blue-900/20 hover:text-blue-600 transition-colors font-black text-[9px] uppercase tracking-[0.5em] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retreat to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}