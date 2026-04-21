import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import PrimaryButton from '@/components/shared/PrimaryButton'
import mascotImage from '@/assets/images/mascot.png'

// ─── Shared mascot crop — matches Figma node 133:16897 ───────────────────────
function Mascot() {
  return (
    <div className="relative w-[177px] h-[159px] overflow-hidden flex-shrink-0">
      <img
        src={mascotImage}
        alt=""
        className="absolute max-w-none"
        style={{
          width: '141.24%',
          height: '280.55%',
          left: '-20.34%',
          top: '-105.69%',
        }}
      />
    </div>
  )
}

// ─── Auth input — Figma active state uses accent border/tint on focus ─────────
function AuthInput({ type, value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`w-full h-[46px] rounded-[4px] px-[10px] font-commons text-[18px] tracking-[-0.5px] leading-[1.19] focus:outline-none transition-colors ${
        focused
          ? 'bg-[rgba(242,166,85,0.05)] border border-[rgba(242,166,85,0.5)]'
          : 'bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)]'
      } ${value ? 'text-white' : 'text-[rgba(255,255,255,0.6)]'} placeholder:text-[rgba(255,255,255,0.4)]`}
    />
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [mode, setMode] = useState('signup') // 'signup' | 'signin' | 'forgot'
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
    // On success: onAuthStateChange fires SIGNED_IN → App transitions automatically
  }

  // ── Forgot-password sub-view ───────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div className="h-screen bg-[#0a0a0a] overflow-y-auto flex flex-col">
        <p className="font-judge text-[24px] text-[#5b5b5b] text-center pt-[66px] leading-normal flex-shrink-0">
          MEATHEAD
        </p>

        <div className="flex-1 flex flex-col justify-center px-[24px] pb-[40px]">
          <div className="flex flex-col gap-[4px] items-center text-center mb-[36px]">
            <h1 className="font-judge text-[32px] leading-[40px] text-white">
              Reset Password
            </h1>
            <p className="font-commons text-[18px] text-[rgba(255,255,255,0.6)] leading-[1.19]">
              We'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]">
            {forgotSent ? (
              <p className="font-commons text-[18px] text-[rgba(255,255,255,0.6)] text-center leading-[1.4]">
                Check your email for a reset link.
              </p>
            ) : (
              <div className="flex flex-col gap-[16px]">
                <AuthInput
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address"
                  autoComplete="email"
                />
              </div>
            )}

            {error && (
              <p className="font-commons text-[14px] text-[#f87171] text-center">{error}</p>
            )}

            {!forgotSent && (
              <PrimaryButton
                type="submit"
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </PrimaryButton>
            )}

            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="font-commons font-semibold text-[18px] text-white text-center tracking-[-0.36px] leading-[1.19]"
            >
              <span className="underline decoration-solid">Back to Sign In</span>
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Main sign-up / sign-in view ────────────────────────────────────────────
  const isSignup = mode === 'signup'

  return (
    <div className="h-screen bg-[#0a0a0a] overflow-y-auto flex flex-col">
      {/* MEATHEAD wordmark */}
      <p className="font-judge text-[24px] text-[#5b5b5b] text-center pt-[66px] leading-normal flex-shrink-0">
        MEATHEAD
      </p>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-[24px] pt-[44px] pb-[40px]">
        <div className="w-full flex flex-col items-center gap-[36px]">

          {/* Mascot — shown on sign-up (welcome) screen */}
          {isSignup && <Mascot />}

          {/* Title + subtitle */}
          <div className="flex flex-col items-center gap-[4px] text-center w-full">
            <h1 className="font-judge text-[32px] leading-[40px] text-white">
              Welcome
            </h1>
            <p className="font-commons text-[18px] text-[rgba(255,255,255,0.6)] leading-[1.19]">
              {isSignup
                ? 'Create an account below to get started.'
                : 'Sign in below to get started.'}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-[24px]"
          >
            {/* Inputs */}
            <div className="flex flex-col gap-[16px]">
              <AuthInput
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email Address"
                autoComplete="email"
              />
              <AuthInput
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="font-commons text-[14px] text-[#f87171] text-center -mt-[8px]">
                {error}
              </p>
            )}

            {/* CTA + links */}
            <div className="flex flex-col items-center gap-[24px]">
              <PrimaryButton
                type="submit"
                disabled={loading || !email.trim() || !password}
              >
                {loading
                  ? (isSignup ? 'Creating account…' : 'Signing in…')
                  : (isSignup ? 'Create an Account' : 'Sign In')}
              </PrimaryButton>

              {/* Switch mode link */}
              <button
                type="button"
                onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
                className="font-commons font-semibold text-[18px] text-white text-center tracking-[-0.36px] leading-[1.19]"
              >
                {isSignup
                  ? <>Existing User? <span className="underline decoration-solid">Sign In</span></>
                  : <>Don't Have an Account? <span className="underline decoration-solid">Create One</span></>}
              </button>

              {/* Forgot password — sign-in only */}
              {!isSignup && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="font-commons font-semibold text-[18px] text-white text-center tracking-[-0.36px] leading-[1.19] underline decoration-solid"
                >
                  Forgot Password
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
