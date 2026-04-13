import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  function switchMode(next) {
    setMode(next)
    setError('')
    setForgotSent(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      })
      setLoading(false)
      if (error) setError(error.message)
      else setForgotSent(true)
      return
    }

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
              {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Start tracking your lifts' : 'We\'ll send you a reset link'}
            </p>

            {forgotSent ? (
              <p className="text-text-primary text-sm bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3">
                Check your email for a reset link.
              </p>
            ) : (
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
                {mode !== 'forgot' && (
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent transition-colors"
                  />
                )}
              </div>
            )}

            {error && <p className="text-danger text-sm mt-2">{error}</p>}
          </div>

          {!forgotSent && (
            <button
              type="submit"
              disabled={loading || !email.trim() || (mode !== 'forgot' && !password)}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-base transition-colors"
            >
              {loading
                ? (mode === 'signin' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending…')
                : (mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link')}
            </button>
          )}

          <div className="text-center space-y-2">
            {mode === 'signin' && (
              <>
                <p className="text-text-secondary text-sm">
                  No account?{' '}
                  <button type="button" onClick={() => switchMode('signup')} className="text-accent hover:underline">
                    Create one
                  </button>
                </p>
                <p className="text-text-secondary text-sm">
                  <button type="button" onClick={() => switchMode('forgot')} className="text-accent hover:underline">
                    Forgot password?
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-text-secondary text-sm">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('signin')} className="text-accent hover:underline">
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-text-secondary text-sm">
                <button type="button" onClick={() => switchMode('signin')} className="text-accent hover:underline">
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
