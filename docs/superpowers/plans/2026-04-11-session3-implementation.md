# Session 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OTP login, persistent auth, PWA standalone mode, social Groups, and a Strava-style activity feed to the existing Hybrid Strength Tracker.

**Architecture:** Features are layered — auth/PWA changes come first (they affect every screen), then activity data infrastructure, then Groups UI which consumes it. All new components live under `src/components/groups/` and `src/components/auth/`. Hooks live in `src/hooks/`. No existing feature is removed except `MagicLinkSent.jsx`.

**Tech Stack:** React 18, Vite, Tailwind CSS (custom design tokens), Supabase JS v2, TanStack Query v5, React Router v6 (hash-based), lucide-react icons.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/supabase.js` | Modify | Add auth persistence config |
| `src/hooks/useAuth.js` | Modify | Add `queryClient.clear()` to signOut |
| `index.html` | Modify | Complete Apple PWA meta tags |
| `public/manifest.json` | Modify | Fix theme_color, expand icons |
| `src/index.css` | Modify | Add overscroll/overflow/height fixes |
| `src/components/auth/OtpInput.jsx` | Create | Reusable 6-box OTP input component |
| `src/components/auth/LoginScreen.jsx` | Rewrite | OTP email+code two-step flow |
| `src/components/auth/MagicLinkSent.jsx` | Delete | No longer needed |
| `src/hooks/useSessions.js` | Modify | Full activity summary + PR detection at save time |
| `src/hooks/useActivity.js` | Create | Hooks for fetching personal and group activity |
| `src/components/home/HomeScreen.jsx` | Modify | Replace sessions-based recent strip with activity table data |
| `src/hooks/useGroups.js` | Create | CRUD mutations + queries for groups |
| `src/components/groups/GroupCard.jsx` | Create | Row card in the groups list |
| `src/components/groups/GroupsTab.jsx` | Create | Groups list screen (empty state + list) |
| `src/components/groups/WorkoutActivityCard.jsx` | Create | Strava-style workout summary card |
| `src/components/groups/SessionDetailSheet.jsx` | Create | SlideUpSheet showing full session detail |
| `src/components/groups/GroupDetailScreen.jsx` | Create | Full group screen: members + invite + feed |
| `src/App.jsx` | Modify | Replace stub GroupsTab, add `/groups/:groupId` route |

---

## Task 1: Supabase auth persistence config

**Files:**
- Modify: `src/lib/supabase.js`

- [ ] **Step 1: Replace the supabase client init with explicit auth options**

Replace the entire file:

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'hybrid-auth-token',
    },
  }
)
```

- [ ] **Step 2: Verify no broken imports**

Run: `npm run build`
Expected: exits 0 with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.js
git commit -m "feat: configure Supabase auth for persistent sessions and OTP code flow"
```

---

## Task 2: Harden useAuth signOut

**Files:**
- Modify: `src/hooks/useAuth.js`

The existing hook already does `getSession()` + `onAuthStateChange` correctly. The only change: `signOut` must clear the TanStack Query cache so stale user data doesn't persist after logout.

- [ ] **Step 1: Add `useQueryClient` import and call it in signOut**

Replace the entire file:

```js
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    queryClient.clear()
  }

  return { user, session, loading, signOut }
}
```

- [ ] **Step 2: Verify the build still passes**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.js
git commit -m "feat: clear query cache on sign out"
```

---

## Task 3: PWA — index.html, manifest.json, index.css

**Files:**
- Modify: `index.html`
- Modify: `public/manifest.json`
- Modify: `src/index.css`

- [ ] **Step 1: Update index.html — fix viewport + add missing Apple meta tags**

Replace the entire file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
  <title>Hybrid Strength Tracker</title>
  <link rel="manifest" href="/manifest.json" />

  <!-- PWA / Standalone mode -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Hybrid">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#0f1117">
  <meta name="format-detection" content="telephone=no">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 2: Update manifest.json — fix theme_color and expand icons**

Replace the entire file:

```json
{
  "name": "Hybrid Strength Tracker",
  "short_name": "Hybrid",
  "description": "Personal strength training tracker",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f1117",
  "theme_color": "#0f1117",
  "icons": [
    {
      "src": "/icon.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 3: Update index.css — add overscroll / overflow / height rules**

Replace the entire file:

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body {
    overscroll-behavior: none;
    -webkit-text-size-adjust: 100%;
    height: 100%;
    overflow: hidden;
  }

  #root {
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  body {
    @apply bg-bg-primary text-text-primary font-sans;
    -webkit-font-smoothing: antialiased;
  }

  * { box-sizing: border-box; }
}

@layer utilities {
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .safe-top    { padding-top:    env(safe-area-inset-top); }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add index.html public/manifest.json src/index.css
git commit -m "feat: complete PWA standalone mode meta tags and overscroll fixes"
```

---

## Task 4: OtpInput component

**Files:**
- Create: `src/components/auth/OtpInput.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useRef, useState } from 'react'

// Props:
//   length    — number of boxes, default 6
//   onComplete(code) — called when all boxes are filled
//   disabled  — grays out all inputs
export default function OtpInput({ length = 6, onComplete, disabled = false }) {
  const [values, setValues] = useState(Array(length).fill(''))
  const inputs = useRef([])

  function focusAt(idx) {
    inputs.current[idx]?.focus()
  }

  function handleChange(idx, e) {
    const raw = e.target.value
    // Only take the last character typed (in case browser pastes into single input)
    const char = raw.replace(/\D/g, '').slice(-1)
    if (!char) return

    const next = [...values]
    next[idx] = char
    setValues(next)

    if (idx < length - 1) {
      focusAt(idx + 1)
    } else {
      // Last digit — auto-submit
      const code = next.join('')
      if (code.length === length) onComplete?.(code)
    }
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace') {
      if (values[idx]) {
        // Clear this box
        const next = [...values]
        next[idx] = ''
        setValues(next)
      } else if (idx > 0) {
        // Move back and clear previous
        const next = [...values]
        next[idx - 1] = ''
        setValues(next)
        focusAt(idx - 1)
      }
      e.preventDefault()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    const next = Array(length).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setValues(next)
    const filled = pasted.length
    focusAt(Math.min(filled, length - 1))
    if (pasted.length === length) onComplete?.(pasted)
  }

  return (
    <div className="flex gap-2 justify-center">
      {values.map((val, idx) => (
        <input
          key={idx}
          ref={el => { inputs.current[idx] = el }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={e => handleChange(idx, e)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={[
            'w-12 h-14 text-center text-xl font-bold rounded-xl',
            'bg-bg-tertiary border text-text-primary',
            'focus:outline-none focus:border-accent',
            val ? 'border-accent/40' : 'border-bg-tertiary',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify it renders (will be tested via LoginScreen in Task 5)**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/OtpInput.jsx
git commit -m "feat: add OtpInput component with auto-advance, backspace, paste support"
```

---

## Task 5: Rewrite LoginScreen for OTP code flow

**Files:**
- Modify: `src/components/auth/LoginScreen.jsx`

- [ ] **Step 1: Rewrite the file**

```jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import OtpInput from './OtpInput'

export default function LoginScreen() {
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const emailRef = useRef(null)

  useEffect(() => {
    if (step === 'email') emailRef.current?.focus()
  }, [step])

  async function sendCode(targetEmail) {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep('code')
    }
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
    // On success, onAuthStateChange in useAuth fires SIGNED_IN — App.jsx transitions automatically
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
        {/* Logo */}
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

            <OtpInput onComplete={verifyCode} disabled={verifying} />

            {error && <p className="text-danger text-sm text-center">{error}</p>}

            <button
              disabled={verifying}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-base transition-colors"
              onClick={() => {
                // Verify button is a fallback — OtpInput auto-submits on 6th digit.
                // This button is only active if OtpInput is somehow full without auto-submit.
                // It's intentionally left with no logic here — OtpInput's onComplete handles it.
              }}
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
```

Note: The Verify button above is a non-functional fallback placeholder because `OtpInput.onComplete` already auto-submits on the 6th digit. To make the button functional as a true fallback (for users who somehow fill boxes without triggering auto-submit), update `LoginScreen` to track the current code value and call `verifyCode` from the button. Replace the Verify button with this version that tracks OTP state:

```jsx
// Add to state at the top of LoginScreen:
const [otpCode, setOtpCode] = useState('')

// Replace OtpInput usage:
<OtpInput
  onComplete={code => { setOtpCode(code); verifyCode(code) }}
  disabled={verifying}
/>

// Replace Verify button:
<button
  disabled={verifying || otpCode.length < 6}
  onClick={() => otpCode.length === 6 && verifyCode(otpCode)}
  className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-base transition-colors"
>
  {verifying ? 'Verifying…' : 'Verify'}
</button>
```

Write the final file incorporating both `otpCode` state and the Verify button properly wired:

```jsx
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/LoginScreen.jsx
git commit -m "feat: replace magic link login with 6-digit OTP code flow"
```

---

## Task 6: Delete MagicLinkSent.jsx

**Files:**
- Delete: `src/components/auth/MagicLinkSent.jsx`

- [ ] **Step 1: Remove the file**

```bash
rm src/components/auth/MagicLinkSent.jsx
```

- [ ] **Step 2: Verify build — no import errors**

Run: `npm run build`
Expected: exits 0. (LoginScreen no longer imports it.)

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove MagicLinkSent — replaced by OTP code flow"
```

---

## Task 7: useSessions — full activity summary + PR detection

**Files:**
- Modify: `src/hooks/useSessions.js`

The goal: when a workout is saved, build a rich `summary` object (including PR detection) before writing the activity row. PRs are detected by comparing the current session's best e1RM per exercise against all prior sessions in the cache.

- [ ] **Step 1: Update useSessions.js**

Replace the entire file:

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeExerciseName } from '@/lib/exercises'
import { epley, totalVolume } from '@/lib/utils'

function normalizeSession(row) {
  const d = row.data
  const base = { _id: row.id }
  if (d.sessionName && d.exercises) return { ...d, ...base }
  // Legacy format
  const exercises = (d.lifts || []).map(lift => ({
    name: lift.name,
    sets: (lift.sets || []).map(s => ({ weight: s.weight ?? '', reps: s.reps ?? '', rpe: s.rpe ?? '' })),
  }))
  return {
    ...base,
    id: d.id,
    sessionId: (d.type || 'push') + '-a',
    sessionName: d.day || d.sessionName || 'Session',
    date: d.date || new Date().toISOString().split('T')[0],
    duration: d.duration || null,
    notes: d.notes || '',
    exercises,
  }
}

async function fetchSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, data, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeSession)
}

async function saveSession(session) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ data: session })
    .select()
    .single()
  if (error) throw error
  return data
}

async function writeActivity({ sessionId, summary }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase
    .from('activity')
    .insert({ user_id: user.id, session_id: sessionId, type: 'workout', summary })
  if (error) console.warn('activity write failed', error)
}

// Compute PRs: for each exercise in the current session, find the best e1RM
// from completed sets, then compare against the historical best from cached sessions.
// Returns an array of PR objects.
function detectPRs(session, previousSessions) {
  // Build historical best e1RM per normalized exercise name
  const historicalBest = {}
  previousSessions.forEach(s => {
    ;(s.exercises || []).forEach(ex => {
      const key = normalizeExerciseName(ex.name)
      ;(ex.sets || []).forEach(set => {
        const e = epley(set.weight, set.reps)
        if (e && e > (historicalBest[key] ?? 0)) historicalBest[key] = e
      })
    })
  })

  // Find PRs in the current session
  const prs = []
  ;(session.exercises || []).forEach(ex => {
    const key = normalizeExerciseName(ex.name)
    let bestSet = null
    let bestE1RM = 0
    ;(ex.sets || []).filter(s => s.completed === true).forEach(s => {
      const e = epley(s.weight, s.reps)
      if (e && e > bestE1RM) { bestE1RM = e; bestSet = s }
    })
    if (bestSet && bestE1RM > (historicalBest[key] ?? 0)) {
      prs.push({
        exercise: ex.name,
        weight: parseFloat(bestSet.weight) || 0,
        reps: parseInt(bestSet.reps) || 0,
        e1RM: bestE1RM,
      })
    }
  })
  return prs
}

export function useSessions() {
  return useQuery({ queryKey: ['sessions'], queryFn: fetchSessions })
}

export function useSessionsByExercise(exerciseName) {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    select: sessions =>
      sessions
        .filter(s => s.exercises?.some(e => normalizeExerciseName(e.name) === normalizeExerciseName(exerciseName)))
        .map(s => ({
          ...s,
          exercises: s.exercises?.filter(e => normalizeExerciseName(e.name) === normalizeExerciseName(exerciseName)),
        })),
    enabled: !!exerciseName,
  })
}

export function useSaveSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (session) => {
      const saved = await saveSession(session)

      // PR detection uses cached sessions (before invalidation so previous data is still present)
      const previousSessions = queryClient.getQueryData(['sessions']) ?? []
      const prs = detectPRs(session, previousSessions)

      const summary = {
        sessionName: session.sessionName,
        programId: session.programId || 'custom',
        totalSets: (session.exercises || []).reduce(
          (n, ex) => n + (ex.sets || []).filter(s => s.completed === true).length,
          0
        ),
        totalVolume: session.totalVolume ?? totalVolume(session.exercises),
        durationSeconds: session.durationSeconds || session.duration || 0,
        prs,
        displayDate: session.completedAt || new Date().toISOString(),
      }

      try {
        await writeActivity({ sessionId: saved.id, summary })
      } catch (e) {
        console.warn('activity write failed', e)
      }

      return saved
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['program'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSessions.js
git commit -m "feat: write full activity summary with PR detection on workout save"
```

---

## Task 8: useActivity hook

**Files:**
- Create: `src/hooks/useActivity.js`

This hook provides two queries: personal recent activity (for HomeScreen) and group activity (for GroupDetailScreen).

- [ ] **Step 1: Create the file**

```js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Fetch the current user's own recent activity rows, newest first
export function useRecentActivity(limit = 3) {
  return useQuery({
    queryKey: ['activity', 'mine', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Fetch activity for all members of a group, with profile info attached.
// Requires Supabase RLS to allow reading activity rows for group members.
export function useGroupActivity(groupId) {
  return useQuery({
    queryKey: ['activity', 'group', groupId],
    queryFn: async () => {
      // Step 1: get member user_ids for this group
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
      if (membersError) throw membersError

      const memberIds = (members || []).map(m => m.user_id)
      if (memberIds.length === 0) return []

      // Step 2: fetch activity for those members with profile info
      const { data, error } = await supabase
        .from('activity')
        .select('*, profiles ( display_name, avatar_url, is_private )')
        .in('user_id', memberIds)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error

      // Step 3: filter out private profiles (belt-and-suspenders on top of RLS)
      return (data || []).filter(a => !a.profiles?.is_private)
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2,
  })
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useActivity.js
git commit -m "feat: add useRecentActivity and useGroupActivity hooks"
```

---

## Task 9: HomeScreen — upgrade recent activity to real feed

**Files:**
- Modify: `src/components/home/HomeScreen.jsx`

Replace the hardcoded "Recent activity" section (which queries the `sessions` cache) with `useRecentActivity` pulling from the `activity` table. Use `WorkoutActivityCard` with `compact` prop.

- [ ] **Step 1: Update imports and add activity query**

At the top of `HomeScreen.jsx`, add the new imports:

```js
import { useRecentActivity } from '@/hooks/useActivity'
import WorkoutActivityCard from '@/components/groups/WorkoutActivityCard'
```

Replace the `const recent = sessions.slice(0, 3)` line and the entire "Recent activity" JSX block.

The full updated `HomeScreen.jsx`:

```jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useSessions } from '@/hooks/useSessions'
import { useProgram } from '@/hooks/useProgram'
import { useAuth } from '@/hooks/useAuth'
import { useWorkoutTemplates, useDeleteTemplate } from '@/hooks/useTemplates'
import { useRecentActivity } from '@/hooks/useActivity'
import WorkoutActivityCard from '@/components/groups/WorkoutActivityCard'
import { formatDate } from '@/lib/utils'

const TAG_COLORS = {
  push: 'bg-push/15 text-push border-push/30',
  pull: 'bg-pull/15 text-pull border-pull/30',
  legs: 'bg-legs/15 text-legs border-legs/30',
}

function TagPill({ tag, label }) {
  return (
    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || 'bg-accent/15 text-accent border-accent/30'}`}>
      {label}
    </span>
  )
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: sessions = [] } = useSessions()
  const { data: programData, isLoading } = useProgram()
  const { data: templates = [] } = useWorkoutTemplates()
  const { mutateAsync: deleteTemplate, isPending: deletePending } = useDeleteTemplate()
  const { data: recentActivity = [] } = useRecentActivity(3)

  const [templateToDelete, setTemplateToDelete] = useState(null)

  const { config, program, blockInfo, nextSession } = programData || {}

  function startSession(session) {
    navigate('/workout', { state: { session, programId: program?.id } })
  }

  function startCustomWorkout() {
    navigate('/workout', { state: { mode: 'custom' } })
  }

  function startTemplateWorkout(template) {
    navigate('/workout', { state: { mode: 'template', template } })
  }

  async function confirmDelete() {
    if (!templateToDelete) return
    await deleteTemplate(templateToDelete.id)
    setTemplateToDelete(null)
  }

  function getLastUsed(templateName) {
    const match = sessions.find(s => s.sessionName === templateName)
    return match?.date ? formatDate(match.date, true) : 'Never used'
  }

  const initial = user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="safe-top px-4 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <h1 className="font-bold text-2xl text-text-primary tracking-tight">Hybrid</h1>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold"
        >
          {initial}
        </button>
      </div>

      {/* Block info badge */}
      {blockInfo && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-text-muted font-medium">
            Block {blockInfo.blockNumber} · Week {blockInfo.weekInBlock} ·{' '}
            <span className={blockInfo.isDeload ? 'text-warning' : 'text-text-secondary'}>
              {blockInfo.phaseName}
            </span>
          </span>
        </div>
      )}

      {/* Next Up card */}
      {isLoading ? (
        <div className="bg-bg-card rounded-2xl p-5 mb-4 h-32 animate-pulse" />
      ) : nextSession && (
        <div className="bg-bg-card rounded-2xl border border-bg-tertiary p-5 mb-4">
          <div className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Up Next</div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TagPill tag={nextSession.tag} label={nextSession.tagLabel} />
              </div>
              <div className="text-xl font-bold text-text-primary">{nextSession.name}</div>
              <div className="text-sm text-text-secondary mt-0.5">{nextSession.focus}</div>
              <div className="text-xs text-text-muted mt-1">{nextSession.exercises.length} exercises</div>
            </div>
          </div>
          {blockInfo?.isDeload && (
            <div className="text-xs text-warning mb-3">↓ Deload week — reduce loads ~10%</div>
          )}
          <button
            onClick={() => startSession(nextSession)}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Start Workout
          </button>
        </div>
      )}

      {/* Quick Start */}
      {program && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-text-secondary mb-2">Quick Start</div>
          <div className="grid grid-cols-3 gap-2">
            {program.sessions.map(s => (
              <button
                key={s.id}
                onClick={() => startSession(s)}
                className="bg-bg-card border border-bg-tertiary rounded-xl p-3 text-left hover:border-accent/50 transition-colors"
              >
                <TagPill tag={s.tag} label={s.tagLabel} />
                <div className="text-xs font-semibold text-text-primary mt-1.5">{s.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Start Custom Workout */}
      <button
        onClick={startCustomWorkout}
        className="w-full mb-4 py-3 border border-accent text-accent font-semibold rounded-xl text-sm hover:bg-accent/10 transition-colors"
      >
        Start Custom Workout
      </button>

      {/* My Workouts section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-text-secondary">My Workouts</div>
          <button
            onClick={startCustomWorkout}
            className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            aria-label="Start custom workout"
          >
            <Plus size={14} />
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-5 text-center">
            <p className="text-text-muted text-sm">
              No saved workouts yet. Start a custom workout and save it when you're done.
            </p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                lastUsed={getLastUsed(template.name)}
                onStart={() => startTemplateWorkout(template)}
                onDeleteRequest={() => setTemplateToDelete(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent activity — from activity table */}
      {recentActivity.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-text-secondary">Recent</div>
            <button onClick={() => navigate('/history')} className="text-xs text-accent">See all</button>
          </div>
          <div className="space-y-2">
            {recentActivity.map(activity => (
              <WorkoutActivityCard key={activity.id} activity={activity} compact />
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="font-bold text-text-primary mb-2">Delete "{templateToDelete.name}"?</h3>
            <p className="text-text-secondary text-sm mb-5">This workout template will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setTemplateToDelete(null)}
                className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletePending}
                className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {deletePending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TemplateCard({ template, lastUsed, onStart, onDeleteRequest }) {
  const longPressTimer = useRef(null)

  function handleTouchStart() {
    longPressTimer.current = setTimeout(onDeleteRequest, 600)
  }
  function handleTouchEnd() {
    clearTimeout(longPressTimer.current)
  }

  return (
    <button
      onClick={onStart}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={e => { e.preventDefault(); onDeleteRequest() }}
      aria-label={`Start ${template.name} workout`}
      className="flex-shrink-0 w-36 bg-bg-card border border-bg-tertiary rounded-xl p-3 text-left hover:border-accent/50 transition-colors"
    >
      <div className="text-xs font-semibold text-text-primary mb-1 truncate">{template.name}</div>
      <div className="text-xs text-text-muted">{template.exercises?.length ?? 0} exercises</div>
      <div className="text-xs text-text-muted mt-0.5">{lastUsed}</div>
    </button>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: exits 0. Note: WorkoutActivityCard doesn't exist yet — this will fail until Task 13 is complete. Skip this build check until after Task 13.

- [ ] **Step 3: Commit (after Task 13 build passes)**

```bash
git add src/components/home/HomeScreen.jsx
git commit -m "feat: upgrade HomeScreen recent activity to use activity table"
```

---

## Task 10: useGroups hook

**Files:**
- Create: `src/hooks/useGroups.js`

- [ ] **Step 1: Create the file**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

async function fetchUserGroups() {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      role,
      joined_at,
      groups (
        id, name, description, invite_code, created_by, created_at,
        group_members ( count )
      )
    `)
  if (error) throw error
  return (data || []).map(row => ({
    role: row.role,
    joined_at: row.joined_at,
    ...row.groups,
    memberCount: row.groups?.group_members?.[0]?.count ?? 0,
  }))
}

async function fetchGroupDetail(groupId) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      id, name, description, invite_code, created_by, created_at,
      group_members (
        user_id, role, joined_at,
        profiles ( display_name, avatar_url, is_private )
      )
    `)
    .eq('id', groupId)
    .single()
  if (error) throw error
  return data
}

async function createGroup({ name, description }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, description: description || null, created_by: user.id })
    .select()
    .single()
  if (error) throw error

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' })
  if (memberError) throw memberError

  return group
}

async function joinGroup(inviteCode) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group, error: findError } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', inviteCode.trim())
    .single()
  if (findError || !group) throw new Error('No group found with that code')

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'member' })
  if (error) throw error

  return group
}

async function leaveGroup({ groupId, userId, isAdmin }) {
  // Get all members of the group to determine last-member and admin-transfer cases
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
  if (membersError) throw membersError

  const otherMembers = (members || []).filter(m => m.user_id !== userId)

  if (otherMembers.length === 0) {
    // Last member — delete the group (cascades to group_members via FK)
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) throw error
    return { deleted: true }
  }

  if (isAdmin) {
    // Transfer admin to earliest-joined other member
    const newAdmin = otherMembers[0]
    const { error: transferError } = await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', newAdmin.user_id)
    if (transferError) throw transferError
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)
  if (error) throw error

  return { deleted: false }
}

export function useGroups() {
  return useQuery({ queryKey: ['groups'], queryFn: fetchUserGroups })
}

export function useGroupDetail(groupId) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => fetchGroupDetail(groupId),
    enabled: !!groupId,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useJoinGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: joinGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useLeaveGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGroups.js
git commit -m "feat: add useGroups, useGroupDetail, useCreateGroup, useJoinGroup, useLeaveGroup hooks"
```

---

## Task 11: GroupCard component

**Files:**
- Create: `src/components/groups/GroupCard.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { ChevronRight } from 'lucide-react'

// Props:
//   group   — { id, name, memberCount, created_at }
//   onClick — handler
export default function GroupCard({ group, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-4 hover:border-accent/40 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        {/* Avatar placeholder — first two letters of group name */}
        <div className="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="text-accent font-bold text-sm">
            {group.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="font-semibold text-text-primary text-sm">{group.name}</div>
          <div className="text-xs text-text-muted mt-0.5">
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </div>
        </div>
      </div>
      <ChevronRight size={18} className="text-text-muted flex-shrink-0" />
    </button>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/groups/GroupCard.jsx
git commit -m "feat: add GroupCard component"
```

---

## Task 12: GroupsTab component

**Files:**
- Create: `src/components/groups/GroupsTab.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { useGroups, useCreateGroup, useJoinGroup } from '@/hooks/useGroups'
import GroupCard from './GroupCard'

function CreateGroupDialog({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const { mutateAsync: createGroup, isPending } = useCreateGroup()

  async function handleCreate() {
    if (!name.trim()) { setError('Group name is required'); return }
    setError('')
    try {
      const group = await createGroup({ name: name.trim(), description: description.trim() })
      onCreated(group.id)
    } catch (e) {
      setError(e.message || 'Failed to create group')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-text-primary text-lg mb-4">Create a Group</h3>
        <div className="space-y-3 mb-4">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Group name"
            className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function JoinGroupDialog({ onClose, onJoined }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const { mutateAsync: joinGroup, isPending } = useJoinGroup()

  async function handleJoin() {
    if (!code.trim()) { setError('Enter an invite code'); return }
    setError('')
    try {
      const group = await joinGroup(code.trim())
      onJoined(group.id)
    } catch (e) {
      setError(e.message || 'No group found with that code')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-text-primary text-lg mb-4">Join with Code</h3>
        <div className="space-y-3 mb-4">
          <input
            autoFocus
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="8-character invite code"
            className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent tracking-widest uppercase"
            maxLength={8}
          />
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={isPending}
            className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? 'Joining…' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GroupsTab() {
  const navigate = useNavigate()
  const { data: groups = [], isLoading } = useGroups()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  function handleCreated(groupId) {
    setShowCreate(false)
    navigate(`/groups/${groupId}`)
  }

  function handleJoined(groupId) {
    setShowJoin(false)
    navigate(`/groups/${groupId}`)
  }

  const hasGroups = groups.length > 0

  return (
    <div className="safe-top px-4 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between py-4">
        <h1 className="font-bold text-2xl text-text-primary">Groups</h1>
        {hasGroups && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            aria-label="Create group"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-bg-card rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : hasGroups ? (
        <div className="space-y-2">
          {groups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={() => navigate(`/groups/${group.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-20 text-center px-6">
          {/* Two-person silhouette SVG */}
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mb-5 opacity-30">
            <circle cx="26" cy="22" r="10" fill="currentColor" className="text-text-secondary" />
            <path d="M6 54c0-11 9-18 20-18s20 7 20 18" fill="currentColor" className="text-text-secondary" />
            <circle cx="50" cy="22" r="10" fill="currentColor" className="text-text-secondary" opacity="0.6" />
            <path d="M34 54c2-8 8-14 16-14s14 6 16 14" fill="currentColor" className="text-text-secondary" opacity="0.6" />
          </svg>
          <h2 className="text-xl font-bold text-text-primary mb-2">Train Together</h2>
          <p className="text-text-secondary text-sm mb-8">
            Join a group to share workouts and compete with friends.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full bg-accent text-white font-semibold rounded-xl py-3 text-sm hover:bg-accent-hover transition-colors"
            >
              Create a Group
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="w-full border border-accent text-accent font-semibold rounded-xl py-3 text-sm hover:bg-accent/10 transition-colors"
            >
              Join with Code
            </button>
          </div>
        </div>
      )}

      {showCreate && <CreateGroupDialog onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {showJoin && <JoinGroupDialog onClose={() => setShowJoin(false)} onJoined={handleJoined} />}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/groups/GroupsTab.jsx src/components/groups/GroupCard.jsx
git commit -m "feat: add GroupsTab with empty state, create group dialog, join with code dialog"
```

---

## Task 13: WorkoutActivityCard component

**Files:**
- Create: `src/components/groups/WorkoutActivityCard.jsx`

This component is used in two places: the full group feed (default mode) and the HomeScreen recent activity (compact mode). The `activity` prop is an activity table row (with optional `profiles` join for group feed rows).

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react'
import { formatVolume, formatDuration } from '@/lib/utils'
import { PROGRAMS } from '@/lib/programs'
import SessionDetailSheet from './SessionDetailSheet'

const TAG_COLORS = {
  push: 'bg-push/15 text-push border-push/30',
  pull: 'bg-pull/15 text-pull border-pull/30',
  legs: 'bg-legs/15 text-legs border-legs/30',
}

function getSessionTag(sessionName) {
  const lower = (sessionName || '').toLowerCase()
  if (lower.includes('push')) return { tag: 'push', label: 'PUSH' }
  if (lower.includes('pull')) return { tag: 'pull', label: 'PULL' }
  if (lower.includes('leg')) return { tag: 'legs', label: 'LEGS' }
  return null
}

function formatDisplayDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const now = new Date()
  const diffMs = now - d
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Props:
//   activity  — activity row, optionally with `profiles` join
//   compact   — boolean, shows condensed layout (HomeScreen)
export default function WorkoutActivityCard({ activity, compact = false }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { summary } = activity

  if (!summary) return null

  const {
    sessionName,
    programId,
    totalSets,
    totalVolume: vol,
    durationSeconds,
    prs = [],
    displayDate,
  } = summary

  const programLabel = PROGRAMS[programId]?.name ?? (programId === 'custom' ? 'Custom' : programId)
  const tagInfo = getSessionTag(sessionName)
  const displayName =
    activity.profiles?.display_name ||
    (activity.user_id ? activity.user_id.slice(0, 8) : 'You')
  const initial = displayName[0]?.toUpperCase() || '?'
  const timeLabel = formatDisplayDate(displayDate || activity.created_at)

  if (compact) {
    return (
      <>
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 flex items-center justify-between text-left hover:border-accent/30 transition-colors"
        >
          <div>
            <div className="text-sm font-semibold text-text-primary">{sessionName}</div>
            <div className="text-xs text-text-muted">{timeLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-secondary">{formatVolume(vol ?? 0)} kg</div>
            {durationSeconds > 0 && (
              <div className="text-xs text-text-muted">{formatDuration(durationSeconds)}</div>
            )}
          </div>
        </button>
        <SessionDetailSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          activity={activity}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        className="w-full bg-bg-card border border-bg-tertiary rounded-2xl p-4 text-left hover:border-accent/30 transition-colors"
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initial}
            </div>
            <span className="text-sm font-medium text-text-primary">{displayName}</span>
          </div>
          <span className="text-xs text-text-muted">{timeLabel}</span>
        </div>

        {/* Session name + tag */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-base font-bold text-text-primary">{sessionName}</span>
          {tagInfo && (
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[tagInfo.tag]}`}>
              {tagInfo.label}
            </span>
          )}
        </div>

        {/* Program label */}
        <div className="text-xs text-text-muted mb-3">{programLabel}</div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-bg-secondary rounded-xl py-2 text-center">
            <div className="text-sm font-bold text-text-primary">{totalSets ?? 0}</div>
            <div className="text-xs text-text-muted">Sets</div>
          </div>
          <div className="bg-bg-secondary rounded-xl py-2 text-center">
            <div className="text-sm font-bold text-text-primary">{formatVolume(vol ?? 0)}</div>
            <div className="text-xs text-text-muted">Volume</div>
          </div>
          <div className="bg-bg-secondary rounded-xl py-2 text-center">
            <div className="text-sm font-bold text-text-primary">
              {durationSeconds > 0 ? formatDuration(durationSeconds) : '—'}
            </div>
            <div className="text-xs text-text-muted">Duration</div>
          </div>
        </div>

        {/* PR badges */}
        {prs.length > 0 && (
          <div className="space-y-1">
            {prs.slice(0, 2).map((pr, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-warning">
                <span>🏆</span>
                <span className="font-medium">PR: {pr.exercise} — {pr.e1RM} kg e1RM</span>
              </div>
            ))}
            {prs.length > 2 && (
              <div className="text-xs text-text-muted">+{prs.length - 2} more PR{prs.length - 2 > 1 ? 's' : ''}</div>
            )}
          </div>
        )}
      </button>

      <SessionDetailSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        activity={activity}
      />
    </>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: exits 0 (SessionDetailSheet doesn't exist yet — will fail until Task 14; skip until then).

- [ ] **Step 3: Commit (after Task 14 build passes)**

```bash
git add src/components/groups/WorkoutActivityCard.jsx
git commit -m "feat: add WorkoutActivityCard with compact mode, PR badges, stats row"
```

---

## Task 14: SessionDetailSheet component

**Files:**
- Create: `src/components/groups/SessionDetailSheet.jsx`

Fetches the full session from Supabase when opened and renders all exercises + sets.

- [ ] **Step 1: Create the file**

```jsx
import { useEffect, useState } from 'react'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import { supabase } from '@/lib/supabase'
import { formatDuration, formatVolume } from '@/lib/utils'

const TAG_COLORS = {
  push: 'bg-push/15 text-push border-push/30',
  pull: 'bg-pull/15 text-pull border-pull/30',
  legs: 'bg-legs/15 text-legs border-legs/30',
}

function getSessionTag(sessionName) {
  const lower = (sessionName || '').toLowerCase()
  if (lower.includes('push')) return { tag: 'push', label: 'PUSH' }
  if (lower.includes('pull')) return { tag: 'pull', label: 'PULL' }
  if (lower.includes('leg')) return { tag: 'legs', label: 'LEGS' }
  return null
}

// Props:
//   open      — boolean
//   onClose   — function
//   activity  — activity row with summary.session_id
export default function SessionDetailSheet({ open, onClose, activity }) {
  const [sessionData, setSessionData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !activity?.session_id) return
    setLoading(true)
    supabase
      .from('sessions')
      .select('id, data, created_at')
      .eq('id', activity.session_id)
      .single()
      .then(({ data, error }) => {
        setLoading(false)
        if (!error && data) setSessionData(data.data)
      })
  }, [open, activity?.session_id])

  const summary = activity?.summary ?? {}
  const { sessionName, durationSeconds, totalVolume, prs = [] } = summary

  const tagInfo = getSessionTag(sessionName)
  const prExercises = new Set(prs.map(pr => pr.exercise))

  function formatDate(isoString) {
    if (!isoString) return ''
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  }

  return (
    <SlideUpSheet
      open={open}
      onClose={onClose}
      title={sessionName || 'Workout'}
      heightClass="h-[90vh]"
    >
      {/* Header summary */}
      <div className="flex items-center gap-2 mb-4">
        {tagInfo && (
          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[tagInfo.tag]}`}>
            {tagInfo.label}
          </span>
        )}
        <span className="text-xs text-text-muted">{formatDate(summary.displayDate || activity?.created_at)}</span>
      </div>

      {/* Stats summary row */}
      <div className="flex gap-4 mb-5 text-sm">
        {totalVolume != null && (
          <div>
            <span className="font-bold text-text-primary">{formatVolume(totalVolume)}</span>
            <span className="text-text-muted ml-1">kg</span>
          </div>
        )}
        {durationSeconds > 0 && (
          <div>
            <span className="font-bold text-text-primary">{formatDuration(durationSeconds)}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Exercises */}
      {sessionData && (
        <div className="space-y-5">
          {(sessionData.exercises || []).map((ex, i) => {
            const exVolume = (ex.sets || [])
              .filter(s => s.completed !== false)
              .reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)
            const hasPR = prExercises.has(ex.name)

            return (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-text-primary text-sm">{ex.name}</span>
                  {hasPR && (
                    <span className="text-xs bg-warning/15 text-warning border border-warning/30 px-1.5 py-0.5 rounded-full font-medium">
                      🏆 PR
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {(ex.sets || []).map((s, j) => (
                    <div
                      key={j}
                      className={`text-xs flex items-center gap-2 py-1 px-2 rounded-lg ${s.completed === false ? 'opacity-40' : 'bg-bg-primary/50'}`}
                    >
                      <span className="text-text-muted w-10">Set {j + 1}</span>
                      <span className="text-text-primary font-medium">{s.weight}kg × {s.reps}</span>
                      {s.rpe && <span className="text-text-muted">@ RPE {s.rpe}</span>}
                    </div>
                  ))}
                </div>
                {exVolume > 0 && (
                  <div className="text-xs text-text-muted mt-1.5 px-2">
                    Total: {formatVolume(exVolume)} kg
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </SlideUpSheet>
  )
}
```

- [ ] **Step 2: Verify build — Tasks 9, 13, 14 should now all compile**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit all three components together**

```bash
git add src/components/groups/SessionDetailSheet.jsx src/components/groups/WorkoutActivityCard.jsx src/components/home/HomeScreen.jsx
git commit -m "feat: add SessionDetailSheet, WorkoutActivityCard, upgrade HomeScreen recent activity"
```

---

## Task 15: GroupDetailScreen component

**Files:**
- Create: `src/components/groups/GroupDetailScreen.jsx`

Full group screen: header with back + leave menu, invite banner, members list, activity feed.

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, MoreHorizontal, Check } from 'lucide-react'
import { useGroupDetail, useLeaveGroup } from '@/hooks/useGroups'
import { useGroupActivity } from '@/hooks/useActivity'
import { useAuth } from '@/hooks/useAuth'
import WorkoutActivityCard from './WorkoutActivityCard'

function MemberRow({ member }) {
  const profile = member.profiles
  const name = profile?.display_name || member.user_id?.slice(0, 8) || '?'
  const initial = name[0]?.toUpperCase() || '?'
  const joinedDate = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : ''

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
        <span className="text-accent font-bold text-sm">{initial}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{name}</div>
        {joinedDate && <div className="text-xs text-text-muted">Joined {joinedDate}</div>}
      </div>
      {member.role === 'admin' && (
        <span className="text-xs bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-medium">
          Admin
        </span>
      )}
    </div>
  )
}

function LeaveConfirmDialog({ isAdmin, isLastMember, onConfirm, onCancel, isLeaving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-text-primary text-lg mb-2">Leave Group?</h3>
        <p className="text-text-secondary text-sm mb-5">
          {isLastMember
            ? 'You are the only member. Leaving will permanently delete this group.'
            : isAdmin
              ? 'You are the admin. Leaving will transfer admin to the next member.'
              : 'You will no longer see this group or its activity feed.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLeaving}
            className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {isLeaving ? 'Leaving…' : isLastMember ? 'Delete & Leave' : 'Leave'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GroupDetailScreen() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: group, isLoading } = useGroupDetail(groupId)
  const { data: activityFeed = [] } = useGroupActivity(groupId)
  const { mutateAsync: leaveGroup, isPending: isLeaving } = useLeaveGroup()

  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const members = group?.group_members ?? []
  const myMembership = members.find(m => m.user_id === user?.id)
  const isAdmin = myMembership?.role === 'admin'
  const isLastMember = members.length === 1

  function copyInviteCode() {
    if (!group?.invite_code) return
    navigator.clipboard.writeText(group.invite_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleLeave() {
    try {
      const result = await leaveGroup({ groupId, userId: user.id, isAdmin })
      setShowLeaveConfirm(false)
      navigate('/groups', { replace: true })
    } catch (e) {
      setShowLeaveConfirm(false)
      console.error('Leave group failed', e)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-text-muted">
        <p>Group not found.</p>
        <button onClick={() => navigate('/groups')} className="mt-3 text-accent text-sm">Back to Groups</button>
      </div>
    )
  }

  return (
    <div className="safe-top bg-bg-primary min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-bg-tertiary">
        <button
          onClick={() => navigate('/groups')}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Groups</span>
        </button>
        <h1 className="font-bold text-text-primary text-base">{group.name}</h1>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors relative"
        >
          <MoreHorizontal size={18} />
          {menuOpen && (
            <div
              className="absolute right-0 top-10 bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden z-10 min-w-36 shadow-lg"
              onBlur={() => setMenuOpen(false)}
            >
              <button
                onClick={() => { setMenuOpen(false); setShowLeaveConfirm(true) }}
                className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-bg-tertiary transition-colors"
              >
                Leave Group
              </button>
            </div>
          )}
        </button>
      </div>

      <div className="px-4 pb-8 max-w-lg mx-auto">
        {/* Invite Code banner */}
        <div className="mt-4 mb-5 bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-0.5">Invite Code</div>
              <div className="text-lg font-bold text-text-primary tracking-widest">{group.invite_code}</div>
            </div>
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-1.5 text-xs text-accent border border-accent/40 rounded-lg px-3 py-1.5 hover:bg-accent/10 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1">Share this code with friends to let them join</p>
        </div>

        {/* Members */}
        <div className="mb-5">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Members · {members.length}
          </div>
          <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 divide-y divide-bg-tertiary">
            {members.map(member => (
              <MemberRow key={member.user_id} member={member} />
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Group Activity
          </div>
          {activityFeed.length === 0 ? (
            <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-6 text-center">
              <p className="text-text-muted text-sm">No workouts yet. Complete a workout to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityFeed.map(activity => (
                <WorkoutActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showLeaveConfirm && (
        <LeaveConfirmDialog
          isAdmin={isAdmin}
          isLastMember={isLastMember}
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
          isLeaving={isLeaving}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/groups/GroupDetailScreen.jsx
git commit -m "feat: add GroupDetailScreen with invite banner, members list, activity feed, leave group"
```

---

## Task 16: App.jsx — add groups routing, remove stub

**Files:**
- Modify: `src/App.jsx`

Remove the inline `GroupsTab` stub function. Import and use the real `GroupsTab` and `GroupDetailScreen`. Add the `/groups/:groupId` route nested inside `MainApp` (no bottom nav on that screen since it has its own header).

- [ ] **Step 1: Replace the file**

```jsx
import { createHashRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import LoginScreen from '@/components/auth/LoginScreen'
import BottomNav from '@/components/shared/BottomNav'
import HomeScreen from '@/components/home/HomeScreen'
import HistoryTab from '@/components/history/HistoryTab'
import ProgressTab from '@/components/progress/ProgressTab'
import SettingsTab from '@/components/settings/SettingsTab'
import WorkoutScreen from '@/components/workout/WorkoutScreen'
import ProgramSelector from '@/components/programs/ProgramSelector'
import GroupsTab from '@/components/groups/GroupsTab'
import GroupDetailScreen from '@/components/groups/GroupDetailScreen'

function MainApp() {
  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <MainApp />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomeScreen /> },
      { path: 'history', element: <HistoryTab /> },
      { path: 'progress', element: <ProgressTab /> },
      { path: 'groups', element: <GroupsTab /> },
      { path: 'settings', element: <SettingsTab /> },
      { path: 'workout', element: <WorkoutScreen /> },
      { path: 'program-selector', element: <ProgramSelector /> },
    ],
  },
  {
    path: '/groups/:groupId',
    element: <GroupDetailScreen />,
  },
])

export default function App() {
  const { loading, session } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!session) return <LoginScreen />
  return <RouterProvider router={router} />
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: exits 0 with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add groups routing, replace stub GroupsTab with real component"
```

---

## Task 17: Final integration verification

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: exits 0, no warnings about missing imports.

- [ ] **Step 2: Dev server smoke test**

Run: `npm run dev`

Navigate through these flows in the browser and verify:

**Auth:**
- [ ] Visiting the app when signed out shows the OTP email entry screen
- [ ] Entering email and "Send Code" shows the 6-box code entry screen
- [ ] Typing a digit advances focus to next box
- [ ] Backspace on empty box moves focus back
- [ ] "Back" arrow returns to email entry
- [ ] "Resend code" link shows "Code resent!" confirmation
- [ ] After successful login the app transitions to HomeScreen

**Persistent auth:**
- [ ] Refreshing the page keeps the user signed in (no login flash)
- [ ] Opening a new tab goes straight to HomeScreen

**Settings:**
- [ ] "Sign Out" button in Settings signs out and shows the login screen

**HomeScreen:**
- [ ] "Recent" section is empty initially, then shows `WorkoutActivityCard` rows after saving a workout

**Groups:**
- [ ] Tapping the Groups tab shows the empty state (two-person SVG, "Train Together")
- [ ] "Create a Group" dialog opens, entering a name and creating navigates to GroupDetailScreen
- [ ] Invite code visible and copy button works
- [ ] "Join with Code" dialog shows "No group found with that code" on a bad code
- [ ] After joining a group, the groups list shows the new group card
- [ ] "…" menu → "Leave Group" shows confirmation dialog; confirming navigates back to Groups

**Activity feed (requires a completed workout):**
- [ ] Saving a workout writes an activity row with `totalSets`, `totalVolume`, `durationSeconds`, `prs`
- [ ] Group feed shows WorkoutActivityCards from group members
- [ ] Tapping a card opens SessionDetailSheet with exercises and sets

- [ ] **Step 3: Final commit if any last fixes**

```bash
git add -p  # stage only intentional changes
git commit -m "fix: session 3 integration cleanup"
```

---

## Post-deployment note

After deploying, the user must **remove the existing home screen icon** from their iOS device and **re-add from Safari** for standalone mode (no URL bar) to take effect. The existing installed icon will continue to open in Safari with the URL bar.

---

## Spec Coverage Cross-Check

| Spec Requirement | Task |
|-----------------|------|
| OTP email entry screen | Task 5 |
| 6-box OTP input (auto-advance, backspace, paste, auto-submit) | Task 4 |
| Verify button fallback | Task 5 |
| Resend code | Task 5 |
| Delete MagicLinkSent | Task 6 |
| Supabase persistSession / autoRefreshToken / detectSessionInUrl false | Task 1 |
| signOut clears query cache | Task 2 |
| Loading spinner until session resolved | Already correct in App.jsx — Task 16 preserves it |
| Sign Out button in Settings | Already wired in SettingsTab — Task 2 provides queryClient.clear |
| index.html Apple meta tags | Task 3 |
| manifest.json standalone + correct theme | Task 3 |
| index.css overscroll/overflow/height | Task 3 |
| Full activity summary shape on save | Task 7 |
| PR detection at workout end | Task 7 |
| user_id written to activity table | Task 7 |
| useRecentActivity hook | Task 8 |
| useGroupActivity hook | Task 8 |
| HomeScreen real activity data | Task 9 |
| useGroups / useGroupDetail / mutations | Task 10 |
| GroupCard | Task 11 |
| GroupsTab empty state + list | Task 12 |
| Create group dialog | Task 12 |
| Join with code dialog | Task 12 |
| WorkoutActivityCard (default + compact) | Task 13 |
| SessionDetailSheet | Task 14 |
| GroupDetailScreen invite banner | Task 15 |
| GroupDetailScreen members list | Task 15 |
| GroupDetailScreen group feed | Task 15 |
| Leave group (admin transfer, last-member delete) | Task 15 |
| /groups/:groupId routing | Task 16 |
