import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowUp, Menu } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import Sources from './Sources'

const EXAMPLE_PROMPTS = [
  'Summarize the key points across my documents',
  'What are the most important dates or deadlines?',
  'Are there any risks or open questions mentioned?',
]

let turnCounter = 0

export default function AskView({ documents, resetKey, onOpenSidebar }) {
  const [turns, setTurns] = useState([])
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const textareaRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    setTurns([])
    setQuestion('')
    setIsAsking(false)
  }, [resetKey])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  async function runAsk(turnId, questionText) {
    setIsAsking(true)
    try {
      const res = await api.ask(questionText)
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, status: 'done', answer: res.answer, sources: res.sources } : t))
      )
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not reach the server. Try again.'
      setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, status: 'error', error: message } : t)))
    } finally {
      setIsAsking(false)
    }
  }

  function submitQuestion(text) {
    const q = text.trim()
    if (!q || isAsking) return
    const id = `t${++turnCounter}`
    setTurns((prev) => [...prev, { id, question: q, status: 'loading' }])
    runAsk(id, q)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!question.trim() || isAsking) return
    submitQuestion(question)
    setQuestion('')
    requestAnimationFrame(autoResize)
  }

  function handleRetry(turn) {
    if (isAsking) return
    setTurns((prev) => prev.map((t) => (t.id === turn.id ? { ...t, status: 'loading', error: null } : t)))
    runAsk(turn.id, turn.question)
  }

  const isEmpty = turns.length === 0

  return (
    <div className="flex h-screen min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3 md:hidden">
        <button
          onClick={onOpenSidebar}
          aria-label="Open library"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:text-ink"
        >
          <Menu size={18} strokeWidth={1.75} />
        </button>
        <span className="font-display text-[14px] tracking-tight text-ink">Ask Your Docs</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState hasDocuments={documents.length > 0} onPick={submitQuestion} />
        ) : (
          <div className="mx-auto w-full max-w-[640px] px-6 pt-14 pb-8">
            {turns.map((turn) => (
              <Turn key={turn.id} turn={turn} documents={documents} onRetry={handleRetry} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-[640px] px-6 pb-6">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-2xl border border-line bg-surface-raised p-2 pl-4 transition-colors focus-within:border-brass-dim"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value)
              autoResize()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Ask a question about your documents…"
            aria-label="Ask a question about your documents"
            className="max-h-40 flex-1 resize-none overflow-y-auto bg-transparent py-2 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <button
            type="submit"
            disabled={!question.trim() || isAsking}
            aria-label="Send question"
            className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass text-[#171310] transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp size={16} strokeWidth={2} />
          </button>
        </form>
        <p className="mt-2.5 text-center font-mono text-[11px] text-ink-faint">
          Answers are grounded in your uploaded documents.
        </p>
      </div>
    </div>
  )
}

function EmptyState({ hasDocuments, onPick }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 pb-24 text-center">
      <span
        aria-hidden
        className="mb-6 text-4xl text-brass opacity-80"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        ¶
      </span>
      <h1 className="font-display text-[2rem] italic leading-tight text-ink">
        Ask anything about your documents.
      </h1>
      <p className="mt-3 max-w-[380px] text-[15px] leading-relaxed text-ink-muted">
        {hasDocuments
          ? 'Every answer traces back to the source passages that support it.'
          : 'Upload a document from the library to get started.'}
      </p>

      {hasDocuments && (
        <div className="mt-7 flex max-w-[480px] flex-wrap justify-center gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onPick(prompt)}
              className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-brass-dim hover:text-ink"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Turn({ turn, documents, onRetry }) {
  return (
    <div className="mb-10">
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">You asked</p>
      <p className="mb-7 text-[16px] leading-relaxed text-ink">{turn.question}</p>

      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">Answer</p>

      {turn.status === 'loading' && <AnswerPending />}

      {turn.status === 'error' && (
        <div className="answer-enter">
          <p className="flex items-start gap-1.5 text-[14px] leading-relaxed text-[#e0a495]">
            <AlertCircle size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" />
            {turn.error}
          </p>
          <button
            onClick={() => onRetry(turn)}
            className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted transition-colors hover:text-brass"
          >
            Try again
          </button>
        </div>
      )}

      {turn.status === 'done' && (
        <>
          <div className="answer-enter font-display text-[17px] leading-[1.7] text-ink">{turn.answer}</div>
          {turn.sources?.length > 0 && <Sources sources={turn.sources} documents={documents} />}
        </>
      )}
    </div>
  )
}

function AnswerPending() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5">
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-brass" style={{ animationDelay: '0ms' }} />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-brass" style={{ animationDelay: '160ms' }} />
        <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-brass" style={{ animationDelay: '320ms' }} />
      </div>
      <div className="space-y-2.5">
        <div className="h-3 w-[92%] animate-pulse rounded-sm bg-surface-hover" />
        <div className="h-3 w-[85%] animate-pulse rounded-sm bg-surface-hover" />
        <div className="h-3 w-[65%] animate-pulse rounded-sm bg-surface-hover" />
      </div>
    </div>
  )
}
