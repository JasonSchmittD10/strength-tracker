import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import MagicLinkSent from './MagicLinkSent'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function sendLink() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: import.meta.env.VITE_APP_URL ?? window.location.origin },
      })
      if (error) {
        const msg = error.message ?? ''
        const lower = msg.toLowerCase()
        const isNetworkError =
          msg === 'Load failed' ||
          msg === 'Failed to fetch' ||
          lower.includes('networkerror') ||
          lower.includes('network request failed')
        const isServerError =
          lower.includes('error saving new user') ||
          lower.includes('database error saving new user')
        setError(
          isNetworkError
            ? 'Unable to reach the server. Check your connection and try again.'
            : isServerError
            ? 'Sign-up is temporarily unavailable due to a server configuration issue. Please contact support.'
            : msg
        )
      } else {
        setSent(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendLink()
  }

  if (sent) return <MagicLinkSent email={email} onBack={() => setSent(false)} onResend={sendLink} />

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <img src="/icon.png" alt="Hybrid" className="w-16 h-16 rounded-2xl mb-4" />
          <h1 className="font-sans text-3xl font-bold text-text-primary tracking-tight">Hybrid</h1>
          <p className="text-text-secondary text-sm mt-1">Strength Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent transition-colors"
            />
            {error && <p className="text-danger text-sm mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-base transition-colors"
          >
            {loading ? 'Sending…' : 'Send Magic Link'}
          </button>
        </form>
      </div>
    </div>
  )
}
