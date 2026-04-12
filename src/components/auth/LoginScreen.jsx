import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')

    const { error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password })

    setLoading(false)
    if (error) setError(error.message)
    // On success: onAuthStateChange in useAuth fires SIGNED_IN → App transitions automatically
  }

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
            <h2 className="text-xl font-bold text-text-primary mb-1">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              {mode === 'signin' ? 'Welcome back' : 'Start tracking your lifts'}
            </p>

            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent transition-colors"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && <p className="text-danger text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-base transition-colors"
          >
            {loading
              ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
              : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>

          <div className="text-center">
            {mode === 'signin' ? (
              <p className="text-text-secondary text-sm">
                No account?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError('') }} className="text-accent hover:underline">
                  Create one
                </button>
              </p>
            ) : (
              <p className="text-text-secondary text-sm">
                Already have an account?{' '}
                <button type="button" onClick={() => { setMode('signin'); setError('') }} className="text-accent hover:underline">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
