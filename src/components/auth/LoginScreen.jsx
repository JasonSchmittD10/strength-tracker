import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import OtpInput from './OtpInput'

export default function LoginScreen() {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const emailRef = useRef(null)

  useEffect(() => {
    if (step === 'email') emailRef.current?.focus()
    if (step === 'code') setOtpCode('')
  }, [step])

  async function sendCode(targetEmail) {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setStep('code')
  }

  function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    sendCode(email.trim())
  }

  async function verifyCode(code) {
    setVerifying(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    setVerifying(false)
    if (error) setError(error.message)
    // On success: onAuthStateChange fires SIGNED_IN → App.jsx transitions automatically
  }

  async function resendCode() {
    setResent(false)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (!error) setResent(true)
    else setError(error.message)
  }

  function goBack() {
    setStep('email')
    setError('')
    setResent(false)
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <img src="/icon.png" alt="Hybrid" className="w-16 h-16 rounded-2xl mb-4" />
          <h1 className="font-sans text-3xl font-bold text-text-primary tracking-tight">Hybrid</h1>
          <p className="text-text-secondary text-sm mt-1">Strength Tracker</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">Sign in</h2>
              <p className="text-text-secondary text-sm mb-4">We'll send a code to your email</p>
              <input
                ref={emailRef}
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
              {loading ? 'Sending…' : 'Send Code'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-text-secondary text-sm hover:text-text-primary transition-colors"
            >
              ← Back
            </button>

            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">Check your email</h2>
              <p className="text-text-secondary text-sm">
                Enter the 6-digit code sent to{' '}
                <span className="text-text-primary font-medium">{email}</span>
              </p>
            </div>

            <OtpInput
              onComplete={code => { setOtpCode(code); verifyCode(code) }}
              disabled={verifying}
            />

            {error && <p className="text-danger text-sm text-center">{error}</p>}

            <button
              disabled={verifying || otpCode.length < 6}
              onClick={() => otpCode.length === 6 && verifyCode(otpCode)}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-base transition-colors"
            >
              {verifying ? 'Verifying…' : 'Verify'}
            </button>

            <div className="text-center">
              {resent ? (
                <p className="text-success text-sm">Code resent!</p>
              ) : (
                <button
                  onClick={resendCode}
                  className="text-accent text-sm hover:underline"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
