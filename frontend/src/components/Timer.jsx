import { useEffect, useRef, useState } from 'react'

export default function Timer({ duration, onEnd, variant = 'default' }) {
  const [remaining, setRemaining] = useState(duration)
  const durationRef = useRef(duration)
  const rafRef = useRef(null)
  const isVibrant = variant === 'vibrant'

  durationRef.current = duration

  useEffect(() => {
    const startTime = Date.now()
    const initialDuration = durationRef.current

    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const left = Math.max(initialDuration - elapsed, 0)
      setRemaining(left)
      if (left <= 0) {
        onEnd?.()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = remaining / duration
  const dashOffset = circumference * (1 - progress)
  
  const isLow = remaining <= 5
  const isMedium = remaining <= duration * 0.5
  
  const color = isLow ? '#ef4444' : isMedium ? '#f59e0b' : (isVibrant ? '#2563eb' : '#7c3aed')
  const displaySeconds = Math.ceil(remaining)

  return (
    <div className={`relative flex items-center justify-center w-36 h-36 group ${isVibrant ? 'bg-white rounded-[2.5rem] shadow-2xl p-4' : ''}`}>
      {/* Outer Glow Circle */}
      {!isVibrant && (
        <div 
          className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-colors duration-300"
          style={{ backgroundColor: color }}
        />
      )}
      
      <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-lg" viewBox="0 0 100 100">
        {/* Background Circle */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={isVibrant ? 'rgba(37, 99, 235, 0.05)' : 'rgba(255,255,255,0.05)'}
          strokeWidth="8"
        />
        {/* Progress Circle */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-100 ease-linear"
        />
      </svg>
      
      <div className="flex flex-col items-center justify-center relative z-10">
        <span
          className={`text-5xl font-black font-outfit tabular-nums ${isLow ? 'animate-shake' : ''}`}
          style={{ color, transition: 'color 0.3s ease' }}
        >
          {displaySeconds}
        </span>
        <span className={`text-[10px] font-black uppercase tracking-widest -mt-1 ${isVibrant ? 'text-blue-900/20' : 'text-white/20'}`}>Secs</span>
      </div>
    </div>
  )
}