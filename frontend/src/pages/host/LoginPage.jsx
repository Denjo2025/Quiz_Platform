import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { setAuthToken } from '../../api/axios'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginStore = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    navigate('/host/dashboard')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      const token = res.data.access_token
      setAuthToken(token)
      loginStore(token, { email })
      navigate('/host/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
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
        <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden border-b-8 border-blue-600/10">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
          
          <div className="text-center space-y-4">
            <div>
              <h1 className="text-4xl font-black text-blue-900 font-outfit tracking-tighter italic uppercase leading-none">Commander Login</h1>
              <p className="text-blue-900/30 font-black uppercase tracking-widest text-[8px] mt-1">Initialize Tactical Command</p>
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
              <label className="block text-blue-900/30 text-[9px] font-black uppercase tracking-[0.4em] ml-2">Security Key</label>
              <input
                type="password"
                className="w-full bg-blue-50 border-4 border-transparent focus:border-blue-600/20 focus:bg-white px-6 py-4 rounded-[1.5rem] text-blue-900 font-black font-outfit text-lg outline-none transition-all shadow-inner"
                placeholder="••••••••"
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
              className="btn-yellow w-full px-4 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-black italic shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <div className="w-5 h-5 flex-shrink-0 border-4 border-blue-900/20 border-t-blue-900 rounded-full animate-spin" />
                  <span className="truncate">AUTHENTICATING...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="truncate">ESTABLISH UPLINK</span>
                </div>
              )}
            </button>
          </form>

          <div className="space-y-6">
            <p className="text-center text-blue-900/30 text-[10px] font-black uppercase tracking-widest">
              New Recruit?{' '}
              <Link to="/host/register" className="text-blue-600 hover:text-blue-500 transition-colors">
                Enlist Now
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