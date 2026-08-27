import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/api'

export default function AuthScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmailInput] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const isSignup = mode === 'signup'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignup) {
        await register(email, password)
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-6">
      {/* ambient glow, kept faint and static — no gratuitous motion */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.07] blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--color-brass), transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <span
            aria-hidden
            className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-line text-lg text-brass"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ¶
          </span>
          <h1 className="font-display text-[1.6rem] tracking-tight text-ink">Ask Your Docs</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {isSignup ? 'Create an account to get started.' : 'Sign in to continue to your library.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]"
        >
          <div className="space-y-4">
            <Field label="Email" type="email" value={email} onChange={setEmailInput} autoComplete="email" required />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              minLength={isSignup ? 8 : undefined}
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-[#4a2a22] bg-[#2a1712] px-3 py-2 text-[13px] text-[#e0a495]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center rounded-lg bg-brass px-4 py-2.5 text-sm font-medium text-[#171310] transition-colors hover:bg-[#d9b06e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-faint">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? 'signin' : 'signup')
              setError(null)
            }}
            className="text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-brass"
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, ...rest }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-brass-dim focus:outline-none"
        {...rest}
      />
    </label>
  )
}
