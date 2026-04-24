import { useState, useRef } from 'react'
import { uploadImage } from '../api/quiz'

const TIME_OPTIONS = [10, 20, 30, 60]
const ANSWER_LABELS = ['A', 'B', 'C', 'D']
const INDICATOR_COLORS = [
  'bg-emerald-50 text-emerald-600',
  'bg-rose-50 text-rose-600',
  'bg-amber-50 text-amber-600',
  'bg-sky-50 text-sky-600'
]

const emptyAnswer = () => ({ text: '', is_correct: false, image_url: null })

async function doUpload(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await uploadImage(fd)
  return res.data.image_url
}

export default function QuestionEditor({ initial, onSave, onCancel }) {
  const [text, setText] = useState(initial?.text || '')
  const [timeLimit, setTimeLimit] = useState(initial?.time_limit_seconds || 20)
  const [points, setPoints] = useState(initial?.points || 1000)
  const [imageUrl, setImageUrl] = useState(initial?.image_url || null)
  const [imagePreview, setImagePreview] = useState(initial?.image_url || null)
  const [uploadingQ, setUploadingQ] = useState(false)
  const [isTextAnswer, setIsTextAnswer] = useState(initial?.is_text_answer || false)
  const [answers, setAnswers] = useState(
    initial?.answers?.length
      ? initial.answers.map((a) => ({ text: a.text || '', is_correct: a.is_correct, image_url: a.image_url || null }))
      : [emptyAnswer(), emptyAnswer()]
  )
  const [uploadingAnswerIdx, setUploadingAnswerIdx] = useState(null)
  const [error, setError] = useState('')

  const qImgRef = useRef()
  const ansImgRefs = useRef([])

  const handleQuestionImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setUploadingQ(true)
    try {
      const url = await doUpload(file)
      setImageUrl(url)
    } catch {
      setError('Question image upload failed.')
      setImagePreview(null); setImageUrl(null)
    } finally {
      setUploadingQ(false)
    }
  }

  const setCorrect = (idx) =>
    setAnswers((prev) => prev.map((a, i) => ({ ...a, is_correct: isTextAnswer ? a.is_correct : i === idx })))

  const updateAnswerText = (idx, val) =>
    setAnswers((prev) => prev.map((a, i) => (i === idx ? { ...a, text: val } : a)))

  const handleAnswerImage = async (idx, file) => {
    if (!file) return
    setUploadingAnswerIdx(idx)
    const preview = URL.createObjectURL(file)
    setAnswers((prev) => prev.map((a, i) => (i === idx ? { ...a, _preview: preview } : a)))
    try {
      const url = await doUpload(file)
      setAnswers((prev) => prev.map((a, i) => (i === idx ? { ...a, image_url: url, _preview: null } : a)))
    } catch {
      setError(`Answer ${ANSWER_LABELS[idx]} image upload failed.`)
      setAnswers((prev) => prev.map((a, i) => (i === idx ? { ...a, _preview: null } : a)))
    } finally {
      setUploadingAnswerIdx(null)
    }
  }

  const removeAnswerImage = (idx) =>
    setAnswers((prev) => prev.map((a, i) => (i === idx ? { ...a, image_url: null, _preview: null } : a)))

  const addAnswer = () => {
    const maxAnswers = isTextAnswer ? 10 : 4
    if (answers.length < maxAnswers) {
      const newAnswer = { ...emptyAnswer(), is_correct: isTextAnswer }
      setAnswers((prev) => [...prev, newAnswer])
    }
  }

  const removeAnswer = (idx) => {
    const minAnswers = isTextAnswer ? 1 : 2
    if (answers.length <= minAnswers) return
    const updated = answers.filter((_, i) => i !== idx)
    setAnswers(updated)
  }

  const handleSave = () => {
    if (!text.trim()) { setError('Question text is required.'); return }
    
    if (isTextAnswer) {
      const validAnswers = answers.filter(a => a.text.trim())
      if (validAnswers.length < 1) {
        setError('Enter at least one correct answer.'); return
      }
      onSave({
        text: text.trim(),
        image_url: imageUrl || null,
        time_limit_seconds: timeLimit,
        points,
        is_text_answer: isTextAnswer,
        answers: validAnswers.map(({ _preview, ...rest }) => rest),
      })
    } else {
      if (answers.some((a) => !a.text.trim() && !a.image_url)) { setError('All answers need text or image.'); return }
      if (!answers.some((a) => a.is_correct)) { setError('Select a correct answer.'); return }
      onSave({
        text: text.trim(),
        image_url: imageUrl || null,
        time_limit_seconds: timeLimit,
        points,
        is_text_answer: isTextAnswer,
        answers: answers.map(({ _preview, ...rest }) => rest),
      })
    }
  }

  return (
    <div className="bg-white rounded-[1.5rem] sm:rounded-[3.5rem] p-4 sm:p-10 space-y-4 sm:space-y-10 shadow-2xl animate-fade-in relative overflow-hidden border-4 border-blue-50">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600/10" />
      
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <label className="block text-blue-900/30 text-[10px] font-black uppercase tracking-[0.4em] ml-2">Section Challenge</label>
            <textarea
              className="w-full px-4 sm:px-8 py-3 sm:py-6 rounded-2xl sm:rounded-[2.5rem] bg-blue-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white text-blue-900 font-black font-outfit text-base sm:text-xl outline-none transition-all shadow-inner h-20 sm:h-32 resize-none"
              placeholder="Input challenge intelligence..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-blue-900/30 text-[10px] font-black uppercase tracking-[0.4em] ml-2">Duration</label>
              <select 
                className="w-full px-4 sm:px-8 py-2 sm:py-5 rounded-xl sm:rounded-[2rem] bg-blue-50 text-blue-900 font-black font-outfit uppercase tracking-widest text-[10px] sm:text-sm outline-none shadow-inner appearance-none cursor-pointer"
                value={timeLimit} 
                onChange={(e) => setTimeLimit(Number(e.target.value))}
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t} Seconds</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="block text-blue-900/30 text-[10px] font-black uppercase tracking-[0.4em] ml-2">Mission Value</label>
              <select 
                className="w-full px-4 sm:px-8 py-2 sm:py-5 rounded-xl sm:rounded-[2rem] bg-blue-50 text-blue-900 font-black font-outfit uppercase tracking-widest text-[10px] sm:text-sm outline-none shadow-inner appearance-none cursor-pointer"
                value={points} 
                onChange={(e) => setPoints(Number(e.target.value))}
              >
                {[500, 1000, 2000].map((p) => <option key={p} value={p}>{p} Pts</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-blue-900/30 text-[10px] font-black uppercase tracking-[0.4em] ml-2">Answer Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setIsTextAnswer(false); setAnswers([emptyAnswer(), emptyAnswer()]) }}
                className={`flex-1 py-2 sm:py-4 px-3 sm:px-6 rounded-xl sm:rounded-[2rem] font-black font-outfit uppercase tracking-widest text-[10px] sm:text-sm transition-all ${
                  !isTextAnswer 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
                }`}
              >
                Multiple Choice
              </button>
              <button
                type="button"
                onClick={() => { setIsTextAnswer(true); setAnswers((prev) => prev.map((a) => ({ ...a, is_correct: true }))) }}
                className={`flex-1 py-2 sm:py-4 px-3 sm:px-6 rounded-xl sm:rounded-[2rem] font-black font-outfit uppercase tracking-widest text-[10px] sm:text-sm transition-all ${
                  isTextAnswer 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
                }`}
              >
                Type Answer
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-64 space-y-4">
          <label className="block text-blue-900/30 text-[10px] font-black uppercase tracking-[0.4em] ml-2 text-center">Visual Uplink</label>
          <div
            onClick={() => qImgRef.current?.click()}
            className={`
              relative w-full aspect-square rounded-[3rem] border-4 border-dashed cursor-pointer 
              transition-all overflow-hidden group shadow-inner
              ${imagePreview ? 'border-blue-200' : 'border-blue-100 bg-blue-50 hover:bg-blue-100/50'}
            `}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-blue-200 gap-2">
                <span className="text-4xl">📸</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Add Intel</span>
              </div>
            )}
            {uploadingQ && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input ref={qImgRef} type="file" accept="image/*" className="hidden" onChange={handleQuestionImage} />
          {imageUrl && (
            <button onClick={() => { setImageUrl(null); setImagePreview(null) }} className="w-full text-rose-500 font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform">
              Remove Visual
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <label className="block text-blue-900/30 text-[10px] font-black uppercase tracking-[0.4em] ml-2">Response Matrices</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isTextAnswer ? (
            <>
              <div className="col-span-1 sm:col-span-2 p-3 sm:p-6 rounded-2xl sm:rounded-[2.5rem] bg-emerald-50 border-2 border-emerald-200 shadow-lg">
                <p className="text-blue-900/50 text-[10px] font-black uppercase tracking-widest mb-4">Add all correct answers (any match = correct)</p>
                {answers.map((ans, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setCorrect(idx)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-md ${ans.is_correct ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-500/30'}`}
                    >
                      {ans.is_correct ? <span className="text-xl">✓</span> : <span className="font-black text-xl font-outfit">+</span>}
                    </button>
                    <input
                      className="flex-1 min-w-0 px-3 sm:px-6 py-2 sm:py-4 rounded-xl sm:rounded-[2rem] bg-white border-2 border-transparent focus:border-emerald-500 text-blue-900 font-black font-outfit text-sm sm:text-lg outline-none transition-all"
                      placeholder="Type a correct answer..."
                      value={ans.text}
                      onChange={(e) => updateAnswerText(idx, e.target.value)}
                    />
                    {answers.length > 1 && (
                      <button onClick={() => removeAnswer(idx)} className="text-rose-500/30 hover:text-rose-500 transition-colors flex-shrink-0 p-2">✕</button>
                    )}
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-4">
                  <p className="text-blue-900/30 text-[10px] font-black uppercase tracking-widest leading-relaxed">Players will type their answer - case insensitive matching</p>
                  {answers.length < 10 && (
                    <button
                      onClick={addAnswer}
                      className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:text-emerald-700 flex-shrink-0 bg-emerald-500/10 px-4 py-2 rounded-xl"
                    >
                      + Add more
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            answers.map((ans, idx) => (
              <div key={idx} className={`relative p-3 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border-2 transition-all flex flex-col gap-2 sm:gap-4 ${ans.is_correct ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-600/5' : 'bg-blue-50 border-transparent shadow-inner'}`}>
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setCorrect(idx)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shadow-md ${ans.is_correct ? 'bg-emerald-500 text-white' : 'bg-white text-blue-900/20'}`}
                  >
                    {ans.is_correct ? <span className="text-xl">✓</span> : <span className="font-black text-lg sm:text-xl font-outfit">{ANSWER_LABELS[idx]}</span>}
                  </button>
                  <input
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-blue-900 font-black font-outfit text-sm sm:text-lg placeholder-blue-900/20"
                    placeholder="Intelligence Data..."
                    value={ans.text}
                    onChange={(e) => updateAnswerText(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => ansImgRefs.current[idx].click()}
                    className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${ans.image_url ? 'bg-blue-600 text-white' : 'bg-white text-blue-900/20 shadow-sm'}`}
                  >
                    <span className="text-xs sm:text-base">🖼️</span>
                  </button>
                  <input ref={(el) => (ansImgRefs.current[idx] = el)} type="file" accept="image/*" className="hidden" onChange={(e) => handleAnswerImage(idx, e.target.files?.[0])} />
                  {answers.length > 2 && (
                    <button onClick={() => removeAnswer(idx)} className="text-rose-500/30 hover:text-rose-500 transition-colors p-1 flex-shrink-0 text-sm sm:text-base">✕</button>
                  )}
                </div>
                
                {(ans._preview || ans.image_url) && (
                  <div className="flex items-center gap-4 animate-slide-up pl-16">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                      <img src={ans._preview || ans.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => removeAnswerImage(idx)} className="text-[10px] font-black uppercase text-rose-500">Remove</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {!isTextAnswer && answers.length < 4 && (
          <button
            onClick={addAnswer}
            className="py-3 sm:py-6 rounded-2xl sm:rounded-[2.5rem] border-4 border-dashed border-blue-100 text-blue-900/20 hover:text-blue-600 hover:border-blue-600/20 hover:bg-blue-50 transition-all font-black font-outfit uppercase tracking-widest text-[9px] sm:text-[10px]"
          >
            + ADD RESPONSE MATRIX
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-[1.5rem] bg-rose-50 border-2 border-rose-200 text-rose-500 font-black text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-blue-50">
        <button onClick={handleSave} className="btn-primary flex-1 py-5 text-lg font-black italic bg-blue-600 text-white shadow-xl shadow-blue-600/20">
          CONFIRM INTELLIGENCE
        </button>
        <button onClick={onCancel} className="btn-secondary w-full sm:w-auto px-10 py-5 text-lg font-black italic bg-blue-50 text-blue-900">
          ABORT
        </button>
      </div>
    </div>
  )
}