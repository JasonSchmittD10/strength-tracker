import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(onDone, 1500)
    }
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
            <h2 className="text-xl font-bold text-text-primary mb-1">New password</h2>
            <p className="text-text-secondary text-sm mb-4">Choose a new password for your account</p>

            {success ? (
              <p className="text-text-primary text-sm bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3">
                Password updated! Signing you in…
              </p>
            ) : (
              <div className="space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  autoFocus
                  className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent transition-colors"
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            )}

            {error && <p className="text-danger text-sm mt-2">{error}</p>}
          </div>

          {!success && (
            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-black font-semibold rounded-xl py-3 text-base transition-colors"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
