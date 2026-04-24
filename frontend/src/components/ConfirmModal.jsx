import { useEffect, useRef } from 'react'

export default function ConfirmModal({ show, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, danger = false }) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [show])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && show) {
        onCancel?.()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [show, onCancel])

  if (!show) return null

  const isAlert = !onCancel

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={isAlert ? onConfirm : onCancel} />
      <div
        ref={modalRef}
        className="relative w-full max-w-md glass-card rounded-2xl p-6 space-y-4 animate-fade-in"
      >
        {title && (
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        )}
        <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end pt-2">
          {!isAlert && (
            <button
              onClick={onCancel}
              className="btn-secondary px-5 py-2.5 text-sm"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={danger ? "btn-danger px-5 py-2.5 text-sm" : "btn-primary px-5 py-2.5 text-sm"}
          >
            {isAlert ? 'OK' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
