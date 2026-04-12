# UI/UX Updates — Session 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 12 UI/UX improvements across auth, workout flow, navigation, homepage, groups, and profile.

**Architecture:** All changes are isolated to existing React components and hooks. No new files except possibly `src/hooks/useSettings.js`. No schema migrations — `unit_preference` and `avatar_url` are added to the existing `profiles` row via upsert. The `usePRs` hook is added to the existing `useSessions.js` file.

**Tech Stack:** React 18, Vite, Tailwind CSS, React Router DOM (hash), TanStack Query, Supabase JS v2, lucide-react icons.

---

## File Map

| File | Change |
|---|---|
| `src/lib/utils.js` | Add `formatWeight` helper |
| `src/hooks/useProfile.js` | Add `useUnitPreference` hook |
| `src/components/auth/LoginScreen.jsx` | Full rewrite — email+password |
| `src/components/auth/OtpInput.jsx` | **Delete** |
| `src/components/workout/SetRow.jsx` | Unit label + lock state + pencil icon |
| `src/components/workout/ExerciseBlock.jsx` | Rep range hint + `isProgramMode` prop |
| `src/components/workout/RestTimer.jsx` | Full-screen mode + `onMinimize` prop |
| `src/components/workout/WorkoutScreen.jsx` | Remove back arrow, cancel button, subheading, scroll fix, rest timer reset |
| `src/components/shared/BottomNav.jsx` | Safe area padding |
| `src/components/history/SessionCard.jsx` | Unit label on weight display |
| `src/components/progress/ProgressTab.jsx` | Unit label on weight display |
| `src/components/home/HomeScreen.jsx` | Remove profile icon, expand program card |
| `src/components/groups/GroupsTab.jsx` | Auto-redirect when in a group |
| `src/hooks/useSessions.js` | Add `usePRs` hook |
| `src/components/settings/SettingsTab.jsx` | Unit toggle + PRs section + photo upload |

---

## Task 1: Add `formatWeight` to utils.js

**Files:**
- Modify: `src/lib/utils.js`

- [ ] **Add `formatWeight` at the end of the file**

```js
// src/lib/utils.js — append after the existing exports
export function formatWeight(value, unit = 'lb') {
  if (value == null || value === '' || value === 0) return '—'
  return `${value} ${unit}`
}
```

- [ ] **Verify build passes**

```bash
cd /Users/jasonschmitt/strength-tracker/.claude/worktrees/focused-bose && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` with no errors.

- [ ] **Commit**

```bash
git add src/lib/utils.js
git commit -m "feat: add formatWeight utility"
```

---

## Task 2: Add `useUnitPreference` to `useProfile.js`

**Files:**
- Modify: `src/hooks/useProfile.js`

- [ ] **Append `useUnitPreference` after the existing exports**

```js
// src/hooks/useProfile.js — append after useUpdateProfile export

export function useUnitPreference() {
  const { data: profile } = useProfile()
  // TODO: when unit preference changes, convert historical weight values in exerciseSets
  return profile?.unit_preference ?? 'lb'
}
```

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Commit**

```bash
git add src/hooks/useProfile.js
git commit -m "feat: add useUnitPreference hook"
```

---

## Task 3: Replace OTP auth with email + password

**Files:**
- Modify: `src/components/auth/LoginScreen.jsx`
- Delete: `src/components/auth/OtpInput.jsx`

- [ ] **Rewrite `LoginScreen.jsx` completely**

```jsx
// src/components/auth/LoginScreen.jsx
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
```

- [ ] **Delete `OtpInput.jsx`**

```bash
rm src/components/auth/OtpInput.jsx
```

- [ ] **Verify build (no import errors for deleted file)**

```bash
npm run build 2>&1 | tail -10
```
Expected: no errors. If `OtpInput` is imported anywhere else, fix those imports now.

- [ ] **Commit**

```bash
git add -A src/components/auth/
git commit -m "feat: replace OTP auth with email + password"
```

---

## Task 4: Update `SetRow.jsx` — unit label + lock state + pencil icon

**Files:**
- Modify: `src/components/workout/SetRow.jsx`

- [ ] **Rewrite `SetRow.jsx`**

```jsx
// src/components/workout/SetRow.jsx
import { Check, Pencil } from 'lucide-react'
import { useUnitPreference } from '@/hooks/useProfile'

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]

export default function SetRow({ setNumber, set, onChange, onComplete }) {
  const { weight = '', reps = '', rpe = '', completed = false } = set
  const unit = useUnitPreference()

  function handleComplete() {
    if (!completed) onComplete()
    else onChange({ ...set, completed: false })
  }

  return (
    <div className={`flex items-center gap-2 py-2 ${completed ? 'opacity-60' : ''}`}>
      <span className="w-6 text-center text-xs text-text-muted font-medium">{setNumber}</span>

      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={e => onChange({ ...set, weight: e.target.value })}
        placeholder={unit}
        readOnly={completed}
        className={`flex-1 min-w-0 bg-bg-tertiary rounded-lg px-2 py-2.5 text-center text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px] ${completed ? 'pointer-events-none' : ''}`}
      />

      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={e => onChange({ ...set, reps: e.target.value })}
        placeholder="reps"
        readOnly={completed}
        className={`flex-1 min-w-0 bg-bg-tertiary rounded-lg px-2 py-2.5 text-center text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px] ${completed ? 'pointer-events-none' : ''}`}
      />

      <select
        value={rpe}
        onChange={e => onChange({ ...set, rpe: e.target.value })}
        disabled={completed}
        className={`w-16 bg-bg-tertiary rounded-lg px-1 py-2.5 text-center text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px] ${completed ? 'pointer-events-none' : ''}`}
      >
        <option value="">RPE</option>
        {RPE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
      </select>

      <button
        onClick={handleComplete}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          completed ? 'bg-success text-white' : 'bg-bg-tertiary text-text-muted hover:bg-accent/20 hover:text-accent'
        }`}
      >
        {completed ? <Pencil size={16} /> : <Check size={16} />}
      </button>
    </div>
  )
}
```

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/workout/SetRow.jsx
git commit -m "feat: SetRow unit label, lock completed sets, pencil unlock icon"
```

---

## Task 5: Update `ExerciseBlock.jsx` — rep range hint + `isProgramMode` prop

**Files:**
- Modify: `src/components/workout/ExerciseBlock.jsx`

- [ ] **Apply changes to `ExerciseBlock.jsx`**

Two changes:
1. Show `{exercise.sets} × {exercise.reps} reps` hint below exercise name when `exercise.reps` is defined
2. Accept `isProgramMode` prop and hide "+ Add Set" when true

```jsx
// src/components/workout/ExerciseBlock.jsx
import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import SetRow from './SetRow'
import { EXERCISE_LIBRARY } from '@/lib/exercises'
import ExerciseHistorySheet from './ExerciseHistorySheet'

export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete, isProgramMode = false }) {
  const [cuesOpen, setCuesOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const info = EXERCISE_LIBRARY[exercise.name] || {}
  const primaryMuscle = info.muscles?.primary?.[0] || ''

  function updateSet(setIdx, updated) {
    const next = sets.map((s, i) => i === setIdx ? updated : s)
    onChange(next)
  }

  function addSet() {
    const last = sets[sets.length - 1] || {}
    onChange([...sets, { weight: last.weight || '', reps: last.reps || '', rpe: '', completed: false }])
  }

  return (
    <div className="bg-bg-card rounded-2xl border border-bg-tertiary p-4 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-text-primary text-base">{exercise.name}</div>
          {primaryMuscle && <div className="text-xs text-text-secondary">{primaryMuscle}</div>}
          {exercise.reps && (
            <div className="text-xs text-text-muted mt-0.5">
              {exercise.sets} × {exercise.reps} reps
            </div>
          )}
        </div>
        <button onClick={() => setHistoryOpen(true)} className="p-2 text-text-muted hover:text-accent transition-colors">
          <Clock size={16} />
        </button>
      </div>

      {/* Cues toggle */}
      {info.cues?.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setCuesOpen(v => !v)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Coaching cues {cuesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {cuesOpen && (
            <ul className="mt-2 space-y-1">
              {info.cues.map((cue, i) => (
                <li key={i} className="text-xs text-text-secondary pl-2 border-l border-accent/30">{cue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6" />
        <span className="flex-1 text-center text-xs text-text-muted">Weight</span>
        <span className="flex-1 text-center text-xs text-text-muted">Reps</span>
        <span className="w-16 text-center text-xs text-text-muted">RPE</span>
        <span className="w-9" />
      </div>

      {/* Sets */}
      {sets.map((set, i) => (
        <SetRow
          key={i}
          setNumber={i + 1}
          set={set}
          onChange={updated => updateSet(i, updated)}
          onComplete={() => onSetComplete(exIdx, i)}
        />
      ))}

      {!isProgramMode && (
        <button
          onClick={addSet}
          className="w-full mt-2 py-2 text-xs text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
        >
          + Add Set
        </button>
      )}

      <ExerciseHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        exerciseName={exercise.name}
      />
    </div>
  )
}
```

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/workout/ExerciseBlock.jsx
git commit -m "feat: ExerciseBlock rep range hint and isProgramMode hide add-set"
```

---

## Task 6: Update `RestTimer.jsx` — full-screen mode

**Files:**
- Modify: `src/components/workout/RestTimer.jsx`

- [ ] **Rewrite `RestTimer.jsx` with `fullScreen` + `onMinimize` props**

```jsx
// src/components/workout/RestTimer.jsx
import { useEffect, useState, useRef } from 'react'

export default function RestTimer({ duration, onDismiss, fullScreen = false, onMinimize }) {
  const [remaining, setRemaining] = useState(duration)
  const endRef = useRef(Date.now() + duration * 1000)

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        if (navigator.vibrate) navigator.vibrate([40, 30, 80])
        onDismiss()
      }
    }
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [onDismiss])

  function addTime(delta) {
    endRef.current += delta * 1000
    setRemaining(v => Math.max(0, v + delta))
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  if (fullScreen) {
    const pct = remaining / duration
    const r = 80, cx = 96, cy = 96
    const circumference = 2 * Math.PI * r
    const dashOffset = circumference * (1 - pct)

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary">
        <div className="text-sm text-text-muted mb-8 uppercase tracking-widest font-medium">Rest</div>

        <svg width="192" height="192" viewBox="0 0 192 192" className="mb-6">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(108,99,255,0.15)" strokeWidth="8" />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none" stroke="#6c63ff" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#f0f2ff" fontSize="42" fontWeight="bold" fontFamily="Syne, sans-serif">
            {mins}:{String(secs).padStart(2, '0')}
          </text>
        </svg>

        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => addTime(-30)} className="px-5 py-3 text-sm text-text-secondary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">−30s</button>
          <button onClick={onDismiss} className="px-7 py-3 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors">Skip Rest</button>
          <button onClick={() => addTime(30)} className="px-5 py-3 text-sm text-text-secondary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">+30s</button>
        </div>

        <button
          onClick={onMinimize}
          className="text-text-muted text-sm hover:text-text-primary transition-colors"
        >
          Minimize ↓
        </button>
      </div>
    )
  }

  // Bottom sheet mode (minimized)
  const pct = remaining / duration
  const r = 36, cx = 44, cy = 44
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - pct)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div className="pointer-events-auto bg-bg-secondary border border-bg-tertiary rounded-t-2xl w-full max-w-sm mx-auto p-6 pb-8 safe-bottom">
        <div className="flex flex-col items-center gap-4">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(108,99,255,0.15)" strokeWidth="6" />
            <circle
              cx={cx} cy={cy} r={r}
              fill="none" stroke="#6c63ff" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
            <text x={cx} y={cy + 6} textAnchor="middle" fill="#f0f2ff" fontSize="18" fontWeight="bold" fontFamily="Syne, sans-serif">
              {mins}:{String(secs).padStart(2, '0')}
            </text>
          </svg>

          <div className="text-sm text-text-secondary">Rest</div>

          <div className="flex items-center gap-3">
            <button onClick={() => addTime(-30)} className="px-4 py-2 text-sm text-text-secondary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">−30s</button>
            <button onClick={onDismiss} className="px-6 py-2 text-sm font-semibold text-text-primary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">Skip Rest</button>
            <button onClick={() => addTime(30)} className="px-4 py-2 text-sm text-text-secondary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">+30s</button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/workout/RestTimer.jsx
git commit -m "feat: RestTimer full-screen mode with Minimize and Skip Rest"
```

---

## Task 7: Update `WorkoutScreen.jsx` — all workout screen changes

**Files:**
- Modify: `src/components/workout/WorkoutScreen.jsx`

This task bundles all WorkoutScreen changes:
- Remove back arrow button from header
- Add program subheading to header  
- Restructure layout for reliable sticky header (flex column, internal scroll)
- Pass `isProgramMode` to `ExerciseBlock`
- Add `restTimerFullScreen` state; reset timer with `key` on new set submit
- Pass `fullScreen` + `onMinimize` to `RestTimer`
- Add "Cancel Workout" text button to the fixed footer

- [ ] **Read the current file first, then apply the full replacement**

```jsx
// src/components/workout/WorkoutScreen.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import ExerciseBlock from './ExerciseBlock'
import ExerciseSearchSheet from './ExerciseSearchSheet'
import RestTimer from './RestTimer'
import WorkoutSummary from './WorkoutSummary'
import { useSessions, useSaveSession } from '@/hooks/useSessions'
import { useProgram } from '@/hooks/useProgram'
import { normalizeExerciseName } from '@/lib/exercises'
import { totalVolume } from '@/lib/utils'

function useElapsedTimer() {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])
  return elapsed
}

function formatElapsed(s) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function WorkoutScreen() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const mode = state?.mode || (state?.session ? 'program' : 'custom')
  const session = state?.session
  const programId = state?.programId
  const template = state?.template

  const elapsed = useElapsedTimer()
  const { data: allSessions = [] } = useSessions()
  const { mutateAsync: saveSession } = useSaveSession()
  const { data: programData } = useProgram()
  const { program, blockInfo } = programData || {}

  // ─── Custom/template exercises ────────────────────────────────────────────
  const [customExercises, setCustomExercises] = useState(() => {
    if (mode === 'template' && template?.exercises) {
      return template.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest ?? 90,
        restLabel: ex.restLabel ?? '90 sec',
      }))
    }
    return []
  })

  const activeExercises = mode === 'program' ? (session?.exercises ?? []) : customExercises

  // ─── exerciseSets ─────────────────────────────────────────────────────────
  const [exerciseSets, setExerciseSets] = useState(() => {
    if (mode === 'program' && session) {
      const lastMatch = allSessions.find(s => s.sessionId === session.id)
      return Object.fromEntries(
        session.exercises.map((ex, i) => {
          const prevSets = lastMatch?.exercises?.find(
            e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name)
          )?.sets ?? []
          const sets = Array.from({ length: ex.sets }, (_, j) => ({
            weight: prevSets[j]?.weight ?? '',
            reps: prevSets[j]?.reps ?? ex.reps?.split('–')[0] ?? '',
            rpe: '',
            completed: false,
          }))
          return [i, sets]
        })
      )
    }
    if (mode === 'template' && template?.exercises) {
      const lastMatch = allSessions.find(s => s.sessionName === template.name)
      return Object.fromEntries(
        template.exercises.map((ex, i) => {
          const prevSets = lastMatch?.exercises?.find(
            e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name)
          )?.sets ?? []
          const setsCount = ex.sets ?? 3
          const sets = Array.from({ length: setsCount }, (_, j) => ({
            weight: prevSets[j]?.weight ?? '',
            reps: prevSets[j]?.reps ?? ex.reps?.split('–')[0] ?? '',
            rpe: '',
            completed: false,
          }))
          return [i, sets]
        })
      )
    }
    return {}
  })

  const prefilledRef = useRef(false)
  useEffect(() => {
    if (mode !== 'program' || !session || prefilledRef.current || !allSessions.length) return
    prefilledRef.current = true
    const lastMatch = allSessions.find(s => s.sessionId === session.id)
    if (!lastMatch) return
    setExerciseSets(prev => {
      const next = { ...prev }
      session.exercises.forEach((ex, i) => {
        const prevSets = lastMatch.exercises?.find(
          e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name)
        )?.sets ?? []
        if (!prevSets.length) return
        next[i] = prev[i].map((s, j) => ({
          ...s,
          weight: prevSets[j]?.weight ?? s.weight,
          reps: prevSets[j]?.reps ?? s.reps,
        }))
      })
      return next
    })
  }, [allSessions, session, mode])

  const templatePrefilledRef = useRef(false)
  useEffect(() => {
    if (mode !== 'template' || !template || templatePrefilledRef.current || !allSessions.length) return
    templatePrefilledRef.current = true
    const lastMatch = allSessions.find(s => s.sessionName === template.name)
    if (!lastMatch) return
    setExerciseSets(prev => {
      const next = { ...prev }
      template.exercises.forEach((ex, i) => {
        const prevSets = lastMatch.exercises?.find(
          e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name)
        )?.sets ?? []
        if (!prevSets.length) return
        next[i] = (prev[i] ?? []).map((s, j) => ({
          ...s,
          weight: prevSets[j]?.weight ?? s.weight,
          reps: prevSets[j]?.reps ?? s.reps,
        }))
      })
      return next
    })
  }, [allSessions, template, mode])

  // ─── Rest timer ───────────────────────────────────────────────────────────
  const [restTimer, setRestTimer] = useState(null)          // { duration, key }
  const [restTimerFullScreen, setRestTimerFullScreen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [confirmBack, setConfirmBack] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const handleRestDismiss = useCallback(() => setRestTimer(null), [])
  const startedAt = useRef(new Date().toISOString())

  const hasCompletedSets = Object.values(exerciseSets).some(sets => sets.some(s => s.completed))

  function handleBack() {
    if (hasCompletedSets) setConfirmBack(true)
    else navigate(-1)
  }

  function handleSetComplete(exIdx, setIdx) {
    const sets = exerciseSets[exIdx] ?? []
    const wasCompleted = sets[setIdx]?.completed
    if (!wasCompleted) {
      const restDuration = activeExercises[exIdx]?.rest ?? 90
      // key: Date.now() forces RestTimer remount — resets countdown if already running
      setRestTimer({ duration: restDuration, key: Date.now() })
      setRestTimerFullScreen(true)
    }
    setExerciseSets(prev => ({
      ...prev,
      [exIdx]: (prev[exIdx] ?? []).map((s, i) => i === setIdx ? { ...s, completed: !wasCompleted } : s),
    }))
  }

  function handleAddExercise(exerciseName) {
    const newIdx = customExercises.length
    setCustomExercises(prev => [
      ...prev,
      { name: exerciseName, sets: 3, reps: '8–12', rest: 90, restLabel: '90 sec' },
    ])
    setExerciseSets(prev => ({
      ...prev,
      [newIdx]: Array.from({ length: 3 }, () => ({ weight: '', reps: '', rpe: '', completed: false })),
    }))
  }

  const buildSessionData = useCallback(() => {
    const exercises = activeExercises.map((ex, i) => ({
      name: ex.name,
      sets: (exerciseSets[i] ?? []).map((s, j) => ({
        setNumber: j + 1,
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps) || 0,
        rpe: s.rpe ? parseFloat(s.rpe) : null,
        completed: s.completed,
      })),
    }))
    if (mode === 'program') {
      return {
        sessionId: session.id,
        sessionName: session.name,
        tag: session.tag,
        tagLabel: session.tagLabel,
        programId,
        startedAt: startedAt.current,
        completedAt: new Date().toISOString(),
        durationSeconds: elapsed,
        duration: elapsed,
        date: new Date().toISOString().split('T')[0],
        exercises,
      }
    }
    return {
      sessionId: null,
      sessionName: 'Custom Workout',
      tag: null,
      tagLabel: null,
      programId: 'custom',
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      durationSeconds: elapsed,
      duration: elapsed,
      date: new Date().toISOString().split('T')[0],
      exercises,
    }
  }, [mode, session, programId, elapsed, exerciseSets, activeExercises])

  async function handleSave(sessionName) {
    const data = buildSessionData()
    if (sessionName) data.sessionName = sessionName
    data.totalVolume = totalVolume(data.exercises)
    await saveSession(data)
    navigate('/history')
  }

  if (mode === 'program' && !session) {
    return (
      <div className="flex items-center justify-center h-screen text-text-muted">
        No session selected.{' '}
        <button onClick={() => navigate('/home')} className="ml-2 text-accent">Go home</button>
      </div>
    )
  }

  const TAG_COLORS = {
    push: 'text-push bg-push/15',
    pull: 'text-pull bg-pull/15',
    legs: 'text-legs bg-legs/15',
  }

  const isCustomMode = mode === 'custom' || mode === 'template'

  const currentSessionState = {
    ...(mode === 'program' ? session : {}),
    exercises: activeExercises.map((ex, i) => ({ ...ex, sets: exerciseSets[i] ?? [] })),
  }

  return (
    <div className="flex flex-col h-full">
      {/* Static header — does not scroll */}
      <div className="flex-shrink-0 bg-bg-primary/95 backdrop-blur border-b border-bg-tertiary px-4 py-3 flex items-center gap-3">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {mode === 'program' && session.tag && (
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${TAG_COLORS[session.tag] ?? ''}`}>
                {session.tagLabel}
              </span>
            )}
            <span className="font-bold text-text-primary truncate">
              {mode === 'program' ? session.name : 'Custom Workout'}
            </span>
          </div>
          {mode === 'program' && blockInfo && (
            <div className="text-xs text-text-muted leading-none mt-0.5">
              {program?.name} · Block {blockInfo.blockNumber} · Week {blockInfo.weekInBlock} · {blockInfo.phaseName}
            </div>
          )}
        </div>
        <span className="font-mono text-sm text-text-muted flex-shrink-0">{formatElapsed(elapsed)}</span>
      </div>

      {/* Scrollable exercise list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-36">
        {isCustomMode && activeExercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">💪</div>
            <p className="text-text-secondary text-sm mb-6">No exercises yet. Add one to get started.</p>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
            >
              <Plus size={18} />
              Add Exercise
            </button>
          </div>
        )}

        {activeExercises.map((ex, i) => (
          <ExerciseBlock
            key={i}
            exercise={ex}
            exIdx={i}
            sets={exerciseSets[i] ?? []}
            onChange={sets => setExerciseSets(prev => ({ ...prev, [i]: sets }))}
            onSetComplete={handleSetComplete}
            isProgramMode={mode === 'program'}
          />
        ))}

        {isCustomMode && activeExercises.length > 0 && (
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-4 border border-dashed border-bg-tertiary rounded-xl text-text-muted text-sm hover:border-accent/50 hover:text-accent transition-colors"
          >
            <Plus size={16} />
            Add Exercise
          </button>
        )}
      </div>

      {/* Fixed bottom bar — Finish + Cancel */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-4 safe-bottom bg-bg-primary/95 backdrop-blur border-t border-bg-tertiary">
        <button
          onClick={() => setSummaryOpen(true)}
          className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl py-3 transition-colors mb-2"
        >
          Finish Workout
        </button>
        <button
          onClick={handleBack}
          className="w-full text-danger text-sm font-medium py-1"
        >
          Cancel Workout
        </button>
      </div>

      {/* Rest timer */}
      {restTimer && (
        <RestTimer
          key={restTimer.key}
          duration={restTimer.duration}
          onDismiss={handleRestDismiss}
          fullScreen={restTimerFullScreen}
          onMinimize={() => setRestTimerFullScreen(false)}
        />
      )}

      {/* Exercise search sheet */}
      <ExerciseSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={handleAddExercise}
      />

      {/* Workout summary sheet */}
      <WorkoutSummary
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onSave={handleSave}
        session={currentSessionState}
        durationSeconds={elapsed}
        mode={mode}
        templateId={template?.id}
        templateName={template?.name}
      />

      {/* Confirm leave dialog */}
      {confirmBack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-back-title"
            className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 id="confirm-back-title" className="font-bold text-text-primary mb-2">Cancel workout?</h3>
            <p className="text-text-secondary text-sm mb-5">Your progress will be lost.</p>
            <div className="flex gap-3">
              <button autoFocus onClick={() => setConfirmBack(false)} className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary">Keep going</button>
              <button onClick={() => navigate(-1)} className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold">Cancel Workout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/workout/WorkoutScreen.jsx
git commit -m "feat: workout screen — remove back arrow, cancel button, subheading, scroll fix, rest timer reset"
```

---

## Task 8: Update `BottomNav.jsx` — safe area padding

**Files:**
- Modify: `src/components/shared/BottomNav.jsx`

The current code has `safe-bottom` on the inner flex row. Move padding to the `<nav>` itself so the background color extends into the safe area too.

- [ ] **Apply the change**

```jsx
// src/components/shared/BottomNav.jsx
import { NavLink } from 'react-router-dom'
import { Home, Clock, TrendingUp, Users, Settings } from 'lucide-react'

const TABS = [
  { to: '/home',     icon: Home,       label: 'Home' },
  { to: '/history',  icon: Clock,      label: 'History' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/groups',   icon: Users,      label: 'Groups' },
  { to: '/settings', icon: Settings,   label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary border-t border-bg-tertiary"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors relative ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-accent" />
                )}
                <Icon size={20} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/shared/BottomNav.jsx
git commit -m "fix: BottomNav safe area padding on the nav element"
```

---

## Task 9: Apply unit labels in `SessionCard.jsx` and `ProgressTab.jsx`

**Files:**
- Modify: `src/components/history/SessionCard.jsx`
- Modify: `src/components/progress/ProgressTab.jsx`

Currently both files hardcode `"kg"` as the unit suffix.

- [ ] **Update `SessionCard.jsx`**

Add `useUnitPreference` import and replace the three `"kg"` literals:

```jsx
// src/components/history/SessionCard.jsx
import { useState } from 'react'
import { formatDate, formatDuration, formatVolume, totalVolume } from '@/lib/utils'
import { useUnitPreference } from '@/hooks/useProfile'
import SlideUpSheet from '@/components/shared/SlideUpSheet'

const TAG_COLORS = {
  push: 'bg-push/15 text-push border-push/30',
  pull: 'bg-pull/15 text-pull border-pull/30',
  legs: 'bg-legs/15 text-legs border-legs/30',
}

export default function SessionCard({ session }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const unit = useUnitPreference()
  const vol = totalVolume(session.exercises || [])
  const completedSets = (session.exercises || []).reduce((n, ex) => n + (ex.sets || []).filter(s => s.completed !== false).length, 0)

  return (
    <>
      <button
        onClick={() => setDetailOpen(true)}
        className="w-full bg-bg-card border border-bg-tertiary rounded-2xl p-4 text-left hover:border-accent/30 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {session.tag && (
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[session.tag] || 'bg-accent/15 text-accent border-accent/30'}`}>
                  {session.tagLabel || session.tag}
                </span>
              )}
            </div>
            <div className="font-bold text-text-primary">{session.sessionName}</div>
            <div className="text-xs text-text-muted mt-0.5">{formatDate(session.date)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-text-secondary">{formatVolume(vol)} {unit}</div>
            {session.duration && <div className="text-xs text-text-muted">{formatDuration(session.duration)}</div>}
            <div className="text-xs text-text-muted">{completedSets} sets</div>
          </div>
        </div>
      </button>

      <SlideUpSheet open={detailOpen} onClose={() => setDetailOpen(false)} title={session.sessionName}>
        <div className="space-y-4">
          <div className="flex gap-4 text-sm text-text-secondary">
            <span>{formatDate(session.date)}</span>
            {session.duration && <span>{formatDuration(session.duration)}</span>}
            <span>{formatVolume(vol)} {unit}</span>
          </div>
          {(session.exercises || []).map((ex, i) => {
            const exVol = totalVolume([ex])
            return (
              <div key={i}>
                <div className="font-semibold text-text-primary mb-1">{ex.name}</div>
                <div className="text-xs text-text-muted mb-1">{formatVolume(exVol)} {unit} volume</div>
                {(ex.sets || []).map((s, j) => (
                  <div key={j} className="text-sm text-text-secondary py-0.5">
                    {j + 1}. {s.weight}{unit} × {s.reps} reps{s.rpe ? ` @ ${s.rpe} RPE` : ''}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </SlideUpSheet>
    </>
  )
}
```

- [ ] **Update `ProgressTab.jsx`**

Replace the four hardcoded `"kg"` literals with the unit from `useUnitPreference`:

```jsx
// src/components/progress/ProgressTab.jsx
import { useState } from 'react'
import { useSessions } from '@/hooks/useSessions'
import { useUnitPreference } from '@/hooks/useProfile'
import { normalizeExerciseName } from '@/lib/exercises'
import { epley, formatDate, formatVolume, totalVolume } from '@/lib/utils'
import ExerciseChart from './ExerciseChart'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

const METRICS = [
  { key: 'e1rm', label: 'e1RM' },
  { key: 'volume', label: 'Volume' },
  { key: 'maxWeight', label: 'Max Weight' },
]

export default function ProgressTab() {
  const { data: sessions = [], isLoading } = useSessions()
  const unit = useUnitPreference()
  const [selectedExercise, setSelectedExercise] = useState('')
  const [metric, setMetric] = useState('e1rm')

  const exerciseNames = [...new Set(
    sessions.flatMap(s => (s.exercises || []).map(e => normalizeExerciseName(e.name)))
  )].sort()

  if (isLoading) return <LoadingSpinner />

  const exerciseData = selectedExercise
    ? sessions
        .filter(s => s.exercises?.some(e => normalizeExerciseName(e.name) === selectedExercise))
        .map(s => ({
          ...s,
          exercises: s.exercises.filter(e => normalizeExerciseName(e.name) === selectedExercise),
        }))
        .slice(0, 20)
        .reverse()
    : []

  const allSets = exerciseData.flatMap(s => s.exercises?.flatMap(e => e.sets || []) || [])
  const bestE1RM = allSets.length ? Math.max(0, ...allSets.map(s => epley(s.weight, s.reps) || 0)) : 0
  const bestSession = exerciseData.find(s => {
    const sets = s.exercises?.[0]?.sets || []
    return sets.some(st => (epley(st.weight, st.reps) || 0) === bestE1RM)
  })

  return (
    <div className="safe-top px-4 pb-4 max-w-lg mx-auto">
      <h1 className="font-bold text-2xl text-text-primary py-4">Progress</h1>

      <select
        value={selectedExercise}
        onChange={e => setSelectedExercise(e.target.value)}
        className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent mb-4"
      >
        <option value="">Select exercise…</option>
        {exerciseNames.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {selectedExercise && (
        <>
          <div className="flex gap-2 mb-4">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  metric === m.key
                    ? 'bg-accent text-white'
                    : 'bg-bg-card border border-bg-tertiary text-text-muted hover:border-accent/30'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {exerciseData.length > 1 ? (
            <div className="bg-bg-card border border-bg-tertiary rounded-2xl p-4 mb-4">
              <ExerciseChart data={exerciseData} metric={metric} />
            </div>
          ) : (
            <div className="bg-bg-card border border-bg-tertiary rounded-2xl p-4 mb-4 text-center text-text-muted text-sm py-8">
              {exerciseData.length === 0 ? 'No data yet.' : 'Log 2+ sessions to see chart.'}
            </div>
          )}

          {bestE1RM > 0 && (
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-4">
              <div className="text-xs text-text-muted mb-1">Personal Best e1RM</div>
              <div className="text-2xl font-bold text-accent">{bestE1RM} {unit}</div>
              {bestSession && (
                <div className="text-xs text-text-secondary mt-1">{formatDate(bestSession.date)}</div>
              )}
            </div>
          )}

          {exerciseData.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-text-secondary mb-2">Recent Sessions</div>
              {[...exerciseData].reverse().slice(0, 5).map((s, i) => {
                const sets = s.exercises?.[0]?.sets || []
                const topSet = sets.length ? sets.reduce((b, c) => (epley(c.weight, c.reps) || 0) > (epley(b.weight, b.reps) || 0) ? c : b) : {}
                const vol = totalVolume(s.exercises)
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-bg-tertiary last:border-0">
                    <div>
                      <div className="text-sm text-text-primary">{formatDate(s.date, true)}</div>
                      <div className="text-xs text-text-muted">
                        {topSet.weight}{unit} × {topSet.reps} · {formatVolume(vol)} {unit}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-accent">
                      {epley(topSet.weight, topSet.reps) || '—'} {unit}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/history/SessionCard.jsx src/components/progress/ProgressTab.jsx
git commit -m "feat: apply unit preference label in History and Progress tabs"
```

---

## Task 10: Update `HomeScreen.jsx` — remove profile icon, expand program card

**Files:**
- Modify: `src/components/home/HomeScreen.jsx`

Two changes:
1. Remove the circular avatar button (`<button onClick={() => navigate('/settings')}>`) from the header
2. Replace the minimal `blockInfo` text badge with a full program card

- [ ] **Remove the profile button — edit the header section**

Find this block (lines 67–75 in the current file):
```jsx
<div className="flex items-center justify-between py-4">
  <h1 className="font-bold text-2xl text-text-primary tracking-tight">Hybrid</h1>
  <button
    onClick={() => navigate('/settings')}
    className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold"
  >
    {initial}
  </button>
</div>
```

Replace with:
```jsx
<div className="py-4">
  <h1 className="font-bold text-2xl text-text-primary tracking-tight">Hybrid</h1>
</div>
```

- [ ] **Replace the blockInfo text badge with the program card**

Find this block (current file ~lines 78–87):
```jsx
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
```

Replace with:
```jsx
{blockInfo && (
  <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
    <div>
      <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-0.5">Active Program</div>
      <div className="font-bold text-text-primary text-sm">{program?.name}</div>
      <div className="text-xs text-text-secondary mt-0.5">
        Block {blockInfo.blockNumber} · Week {blockInfo.weekInBlock} · {blockInfo.phaseName}
        {blockInfo.isDeload && <span className="text-warning ml-1">· Deload</span>}
      </div>
    </div>
    <button onClick={() => navigate('/program-selector')} className="text-xs text-accent font-medium flex-shrink-0 ml-4">
      Change
    </button>
  </div>
)}
```

- [ ] **Remove the `initial` variable and unused `user` import if nothing else uses it**

Check if `user` or `initial` is used anywhere else in the file. If `initial` is only used in the removed button, delete:
```js
const initial = user?.email?.[0]?.toUpperCase() || '?'
```
If `user` is unused, remove it from the `useAuth()` destructure.

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/home/HomeScreen.jsx
git commit -m "feat: HomeScreen remove profile icon, expand program card"
```

---

## Task 11: Update `GroupsTab.jsx` — direct landing when in a group

**Files:**
- Modify: `src/components/groups/GroupsTab.jsx`

- [ ] **Add `useEffect` redirect and remove `+` create button**

Two changes:
1. Add `useEffect` that redirects to the group page when data loads and the user is in a group
2. Remove the `+` create button from the header (the `{hasGroups && (...)}` block)

Find the import line at the top and add `useEffect`:
```jsx
import { useState, useEffect } from 'react'
```

Add the `useEffect` inside the `GroupsTab` component, right after the existing state/hook declarations:
```jsx
useEffect(() => {
  if (!isLoading && groups.length > 0) {
    navigate(`/groups/${groups[0].id}`, { replace: true })
  }
}, [isLoading, groups, navigate])
```

Remove the `+` button from the header — find and delete:
```jsx
{hasGroups && (
  <button
    onClick={() => setShowCreate(true)}
    className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
    aria-label="Create group"
  >
    <Plus size={18} />
  </button>
)}
```

After removing it, if `Plus` is no longer imported anywhere in the file, remove the `Plus` import from the `lucide-react` import line.

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/groups/GroupsTab.jsx
git commit -m "feat: GroupsTab auto-navigate to group when already a member"
```

---

## Task 12: Add `usePRs` hook to `useSessions.js`

**Files:**
- Modify: `src/hooks/useSessions.js`

- [ ] **Append `usePRs` after the existing exports**

```js
// src/hooks/useSessions.js — append at the end of the file
import { useMemo } from 'react'

const MAIN_LIFTS = [
  'Barbell Bench Press',
  'Back Squat (Barbell)',
  'Romanian Deadlift',
  'Overhead Press (Barbell)',
]

export function usePRs() {
  const { data: sessions = [] } = useSessions()
  return useMemo(() => {
    const bests = {}
    for (const session of sessions) {
      for (const exercise of session.exercises ?? []) {
        const name = normalizeExerciseName(exercise.name)
        if (!MAIN_LIFTS.includes(name)) continue
        for (const set of exercise.sets ?? []) {
          if (!set.completed || !set.weight || !set.reps) continue
          const e1rm = epley(set.weight, set.reps)
          if (e1rm && (!bests[name] || e1rm > bests[name])) bests[name] = e1rm
        }
      }
    }
    return MAIN_LIFTS.map(name => ({ name, e1rm: bests[name] ?? null }))
  }, [sessions])
}
```

Note: `useMemo` is not yet imported in this file. Add it to the existing React import at the top:
```js
// Change:
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// To (add useMemo from react):
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
```

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/hooks/useSessions.js
git commit -m "feat: add usePRs hook for main lift e1RM personal records"
```

---

## Task 13: Update `SettingsTab.jsx` — unit toggle + PRs section + photo upload

**Files:**
- Modify: `src/components/settings/SettingsTab.jsx`

This is the largest single-file change. Three additions to the existing SettingsTab.

- [ ] **Read `SettingsTab.jsx` in full before editing**

- [ ] **Add imports at the top**

Add to the existing imports:
```jsx
import { useRef } from 'react'  // add ref to existing useState import: import { useState, useRef } from 'react'
import { useUnitPreference } from '@/hooks/useProfile'
import { usePRs } from '@/hooks/useSessions'
import { formatWeight } from '@/lib/utils'
```

- [ ] **Add hooks inside the component** (after existing hook calls)

```jsx
const unit = useUnitPreference()
const prs = usePRs()
const fileInputRef = useRef(null)
const [uploadingPhoto, setUploadingPhoto] = useState(false)
```

- [ ] **Add photo upload handler** (after `togglePrivacy` function)

```jsx
async function handlePhotoUpload(e) {
  const file = e.target.files?.[0]
  if (!file || !user?.id) return
  setUploadingPhoto(true)
  try {
    // TODO: create 'avatars' bucket in Supabase Storage (public read, authenticated write)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`${user.id}/avatar.jpg`, file, { upsert: true })
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${user.id}/avatar.jpg`)
    await updateProfile({ avatar_url: publicUrl })
  } catch (e) {
    console.error('Photo upload failed:', e)
  } finally {
    setUploadingPhoto(false)
  }
}
```

- [ ] **Update the avatar display in the Profile section**

Find the current avatar circle:
```jsx
<div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
  {initial}
</div>
```

Replace with:
```jsx
<button
  onClick={() => fileInputRef.current?.click()}
  disabled={uploadingPhoto}
  className="relative w-14 h-14 rounded-full flex-shrink-0 overflow-hidden group"
>
  {profile?.avatar_url ? (
    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full bg-accent flex items-center justify-center text-white text-xl font-bold">
      {initial}
    </div>
  )}
  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity rounded-full">
    <span className="text-white text-xs">✎</span>
  </div>
</button>
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  capture="user"
  className="hidden"
  onChange={handlePhotoUpload}
/>
```

- [ ] **Add "Personal Records" section** — insert before the Program section

Find `<Section title="Program">` and insert before it:

```jsx
<Section title="Personal Records">
  <div className="grid grid-cols-2 gap-3 py-2">
    {prs.map(({ name, e1rm }) => (
      <div key={name} className="bg-bg-tertiary rounded-xl p-3">
        <div className="text-xs text-text-muted mb-1 leading-tight">{name}</div>
        <div className="font-bold text-text-primary text-base">
          {e1rm ? formatWeight(Math.round(e1rm * 10) / 10, unit) : '—'}
        </div>
        <div className="text-xs text-text-muted">e1RM</div>
      </div>
    ))}
  </div>
</Section>
```

- [ ] **Add unit toggle to App Settings section**

Currently there is no "App Settings" section. Add it before the existing "Profile" section:

```jsx
<Section title="App Settings">
  <ToggleRow
    label="Use pounds (lb)"
    description={`Weight displayed in ${unit === 'lb' ? 'lb' : 'kg'}`}
    checked={unit === 'lb'}
    onChange={() => updateProfile({ unit_preference: unit === 'lb' ? 'kg' : 'lb' })}
  />
</Section>
```

- [ ] **Verify build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit**

```bash
git add src/components/settings/SettingsTab.jsx
git commit -m "feat: SettingsTab unit toggle, PRs section, profile photo upload"
```

---

## Self-Review

**Spec coverage check:**

| Spec item | Task |
|---|---|
| Auth: email+password, delete OtpInput | Task 3 |
| Units: useUnitPreference, formatWeight | Tasks 1, 2 |
| Units toggle in Settings | Task 13 |
| Units applied in SetRow, History, Progress | Tasks 4, 9 |
| Remove back arrow, add Cancel Workout | Task 7 |
| Workout header program subheading | Task 7 |
| Rep range per exercise | Task 5 |
| Lock completed sets, pencil icon | Task 4 |
| Hide Add Set in program context | Tasks 5, 7 |
| Rest timer full screen on set complete | Tasks 6, 7 |
| Reset timer on mid-rest set complete | Task 7 |
| Full screen Minimize + Skip Rest | Task 6 |
| Sticky header fix (scroll) | Task 7 |
| Bottom nav safe area gap | Task 8 |
| Homepage: remove profile icon | Task 10 |
| Homepage: program card | Task 10 |
| Groups: direct landing | Task 11 |
| Profile: main lift PRs | Tasks 12, 13 |
| Profile: photo upload | Task 13 |

All items covered. ✓
