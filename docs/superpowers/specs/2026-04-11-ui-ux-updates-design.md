# UI/UX Updates — Session 4 Design

**Date:** 2026-04-11  
**Status:** Approved

---

## Overview

12 targeted UI/UX improvements across auth, workout, navigation, homepage, groups, and profile. All changes are within the existing React + Vite + Tailwind + Supabase stack.

---

## Task 1 — Auth: Replace OTP with Email + Password

**Files:** `src/components/auth/LoginScreen.jsx`, `src/components/auth/OtpInput.jsx`

Replace the two-step OTP flow with a single-screen email + password form.

### LoginScreen.jsx — full rewrite

- Single screen (no step state)
- `mode` state: `'signin'` | `'signup'`, toggled by a link below the submit button
- Fields: email (`type="email"`), password (`type="password"`)
- Sign in: `supabase.auth.signInWithPassword({ email, password })`
- Sign up: `supabase.auth.signUp({ email, password })` — no email verification
- Inline error display below fields
- `onAuthStateChange` in `useAuth.js` handles transition automatically — no changes needed there

### OtpInput.jsx — delete

No longer needed. Remove file entirely.

---

## Task 2 — Units: lb / kg Preference

**Files:** `src/components/settings/SettingsTab.jsx`, `src/hooks/useProfile.js` (or new `src/hooks/useSettings.js`), `src/lib/utils.js`, `src/components/workout/SetRow.jsx`, history/progress display components

### Behavior

- Unit preference is **label-only** for now — numbers stored as-entered, no numeric conversion
- Default: `'lb'`
- `// TODO: when unit preference changes, convert historical weight values in exerciseSets`

### Data

- Stored as `unit_preference: 'lb' | 'kg'` on the `profiles` row via `useUpdateProfile` mutation
- No schema migration needed — Supabase `profiles` table uses jsonb-compatible upsert

### New code

**`src/lib/utils.js` — add `formatWeight`:**
```js
export function formatWeight(value, unit = 'lb') {
  if (value == null || value === '') return ''
  return `${value} ${unit}`
}
```

**`useUnitPreference()` hook** (in `useProfile.js` or `useSettings.js`):
```js
export function useUnitPreference() {
  const { data: profile } = useProfile()
  return profile?.unit_preference ?? 'lb'
}
```

### SettingsTab.jsx

Add a `ToggleRow` in the **App Settings** section:
- Label: "Use pounds (lb)"
- Checked when `unit_preference === 'lb'`
- `onChange`: `updateProfile({ unit_preference: checked ? 'lb' : 'kg' })`

### Apply everywhere weight is shown

- `SetRow.jsx`: placeholder on weight input changes from `"kg"` to the current unit
- History tab: suffix weight values with unit label
- Progress tab: suffix weight values with unit label

---

## Task 3 — Workout: Remove Back Arrow, Add Cancel Button

**File:** `src/components/workout/WorkoutScreen.jsx`

### Header

Remove the `<button onClick={handleBack}>` containing `<ArrowLeft size={20} />`. Elapsed timer stays in header.

### Fixed bottom bar

Current: single "Finish Workout" button.  
After: two stacked elements:

```jsx
<div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-bg-primary/95 backdrop-blur border-t border-bg-tertiary">
  <button onClick={() => setSummaryOpen(true)} className="w-full bg-accent ... mb-3">
    Finish Workout
  </button>
  <button onClick={handleBack} className="w-full text-danger text-sm font-medium py-1">
    Cancel Workout
  </button>
</div>
```

`handleBack()` already checks `hasCompletedSets` and shows the confirm dialog — no logic change needed.

---

## Task 4 — Workout Header: Program Subheading

**File:** `src/components/workout/WorkoutScreen.jsx`

Import `useProgram` and destructure `{ program, blockInfo }` from its result.

In the sticky header, add below the session name span:

```jsx
{mode === 'program' && blockInfo && (
  <div className="text-xs text-text-muted leading-none mt-0.5">
    {program.name} · Block {blockInfo.blockNumber} · Week {blockInfo.weekInBlock} · {blockInfo.phaseName}
  </div>
)}
```

No changes to `useProgram`.

---

## Task 5 — Workout: Target Rep Ranges per Exercise

**File:** `src/components/workout/ExerciseBlock.jsx`

The `exercise` prop already has `reps` (e.g. `'4–6'`) and `sets` (e.g. `4`) from the program definition. Add below the muscle label in the header:

```jsx
{exercise.reps && (
  <div className="text-xs text-text-muted mt-0.5">
    {exercise.sets} × {exercise.reps} reps
  </div>
)}
```

Custom exercises added via search have no `reps` property — renders nothing automatically.

---

## Task 6 — Completed Sets: Lock State + Pencil Icon

**File:** `src/components/workout/SetRow.jsx`

When `completed === true`:

- Both `<input>` elements: add `readOnly` and `className` addition `pointer-events-none`
- `<select>`: add `disabled` and `pointer-events-none`
- Submit button icon: `<Check>` → `<Pencil>` (import from `lucide-react`)
- Button `onClick` when completed: `onChange({ ...set, completed: false })` to unlock

When `completed === false`, behavior unchanged (Check icon, onComplete fires).

---

## Task 7 — Hide "+ Add Set" in Program Context

**Files:** `src/components/workout/WorkoutScreen.jsx`, `src/components/workout/ExerciseBlock.jsx`

Pass `isProgramMode={mode === 'program'}` from `WorkoutScreen` to each `<ExerciseBlock>`.

In `ExerciseBlock`:
```jsx
{!isProgramMode && (
  <button onClick={addSet} ...>+ Add Set</button>
)}
```

---

## Task 8 — Rest Timer: Full Screen on Set Completion

**Files:** `src/components/workout/RestTimer.jsx`, `src/components/workout/WorkoutScreen.jsx`

### RestTimer.jsx changes

New props:
- `fullScreen: boolean` — switches rendering mode
- `onMinimize: () => void` — called by Minimize button (full-screen mode only)

**Full-screen layout** (`fullScreen === true`):
```
fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary
```
Contains: large SVG ring + time, "Rest" label, −30s / +30s / Skip Rest controls, "Minimize" button.

**Bottom sheet layout** (`fullScreen === false`): existing layout unchanged. "Skip" button renamed to **"Skip Rest"** in both modes.

### WorkoutScreen.jsx changes

New state: `const [restTimerFullScreen, setRestTimerFullScreen] = useState(false)`

**`handleSetComplete` update:**
```js
function handleSetComplete(exIdx, setIdx) {
  const sets = exerciseSets[exIdx] ?? []
  const wasCompleted = sets[setIdx]?.completed
  if (!wasCompleted) {
    const restDuration = activeExercises[exIdx]?.rest ?? 90
    // Reset timer (key forces remount) and go full screen
    setRestTimer({ duration: restDuration, key: Date.now() })
    setRestTimerFullScreen(true)
  }
  setExerciseSets(prev => ({
    ...prev,
    [exIdx]: (prev[exIdx] ?? []).map((s, i) => i === setIdx ? { ...s, completed: !wasCompleted } : s),
  }))
}
```

**RestTimer usage:**
```jsx
{restTimer && (
  <RestTimer
    key={restTimer.key}
    duration={restTimer.duration}
    onDismiss={handleRestDismiss}
    fullScreen={restTimerFullScreen}
    onMinimize={() => setRestTimerFullScreen(false)}
  />
)}
```

`handleRestDismiss` unchanged — clears `restTimer` state.

---

## Task 9 — Nav Layout Bug Fixes

### Sticky header fix (WorkoutScreen.jsx)

Current problem: `sticky top-0` inside `overflow-y-auto` container in `App.jsx` doesn't work — `sticky` requires the scroll container to be an ancestor, but the overflow div in `App.jsx` is the scroll root, and `sticky` only works relative to its scroll container.

Fix: give `WorkoutScreen` its own scroll context:

```jsx
// WorkoutScreen outermost div:
<div className="flex flex-col h-full">
  {/* Static header — never scrolls */}
  <div className="bg-bg-primary/95 backdrop-blur border-b border-bg-tertiary px-4 py-3 flex items-center gap-3 flex-shrink-0">
    ...
  </div>
  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto pb-32">
    ...exercises...
  </div>
  {/* Fixed bottom bar stays as-is */}
</div>
```

The outer `App.jsx` `overflow-y-auto` wrapper scrolls other tabs. `WorkoutScreen` opts out by managing its own internal scroll.

### Bottom nav safe area (BottomNav.jsx)

Add inline style to the `<nav>` element:
```jsx
<nav style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary border-t border-bg-tertiary">
```

Remove the `safe-bottom` class from the inner flex row (avoid double-padding). The `App.jsx` content padding (`calc(4rem + env(safe-area-inset-bottom))`) already accounts for the nav height — verify it still matches after this change.

---

## Task 10 — Homepage: Remove Profile Icon, Promote Program Card

**File:** `src/components/home/HomeScreen.jsx`

### Remove

The `<button onClick={() => navigate('/settings')}>` rendering the user initial in the header. Header becomes just the "Hybrid" `<h1>`.

### Program card

Replace the minimal `blockInfo` text badge with:

```jsx
{blockInfo && (
  <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
    <div>
      <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-0.5">Active Program</div>
      <div className="font-bold text-text-primary text-sm">{program.name}</div>
      <div className="text-xs text-text-secondary mt-0.5">
        Block {blockInfo.blockNumber} · Week {blockInfo.weekInBlock} · {blockInfo.phaseName}
        {blockInfo.isDeload && <span className="text-warning ml-1">· Deload</span>}
      </div>
    </div>
    <button onClick={() => navigate('/program-selector')} className="text-xs text-accent font-medium">
      Change
    </button>
  </div>
)}
```

Position: immediately below the header, above the "Up Next" card.

---

## Task 11 — Groups Tab: Direct Landing When In a Group

**File:** `src/components/groups/GroupsTab.jsx`

```jsx
useEffect(() => {
  if (!isLoading && groups.length > 0) {
    navigate(`/groups/${groups[0].id}`, { replace: true })
  }
}, [isLoading, groups, navigate])
```

- `replace: true` prevents navigation loop: back from `GroupDetailScreen` skips `GroupsTab` entirely
- Remove the `+` create button from the header (one-group-per-user constraint)
- Empty state (join/create UI) unchanged for users not in any group

---

## Task 12 — Profile: Main Lift PRs + Photo Upload

**Files:** `src/hooks/useSessions.js`, `src/components/settings/SettingsTab.jsx`, `src/hooks/useProfile.js`

### usePRs() hook (src/hooks/useSessions.js)

```js
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
          const e1rm = set.weight * (1 + set.reps / 30)
          if (!bests[name] || e1rm > bests[name]) bests[name] = e1rm
        }
      }
    }
    return MAIN_LIFTS.map(name => ({ name, e1rm: bests[name] ?? null }))
  }, [sessions])
}
```

Epley formula: `weight × (1 + reps / 30)`. Only completed sets with `weight > 0` and `reps > 0`.

### SettingsTab.jsx — Personal Records section

Add above the Program section. 2×2 grid:

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

### Photo upload (SettingsTab.jsx)

- Hidden `<input type="file" accept="image/*" capture="user" ref={fileInputRef}>`
- Avatar circle gets a camera overlay icon on hover/tap that triggers `fileInputRef.current.click()`
- Upload: `supabase.storage.from('avatars').upload(\`${user.id}/avatar.jpg\`, file, { upsert: true })`
- Get URL: `supabase.storage.from('avatars').getPublicUrl(\`${user.id}/avatar.jpg\`)`
- Save to profile: `updateProfile({ avatar_url: publicUrl })`
- Display: if `profile.avatar_url` is set, render `<img src={profile.avatar_url} className="w-14 h-14 rounded-full object-cover" />`; otherwise show initial letter
- If `avatars` bucket does not exist in Supabase, leave `// TODO: create 'avatars' bucket in Supabase Storage (public read, authenticated write)` and skip upload logic

---

## Component Checklist

### Files to delete
- `src/components/auth/OtpInput.jsx`

### Files to create
- *(none — all changes are modifications to existing files)*

### Files to modify
- `src/components/auth/LoginScreen.jsx`
- `src/components/settings/SettingsTab.jsx`
- `src/hooks/useProfile.js` (add `useUnitPreference`)
- `src/lib/utils.js` (add `formatWeight`)
- `src/components/workout/SetRow.jsx`
- `src/components/workout/ExerciseBlock.jsx`
- `src/components/workout/WorkoutScreen.jsx`
- `src/components/workout/RestTimer.jsx`
- `src/components/shared/BottomNav.jsx`
- `src/components/home/HomeScreen.jsx`
- `src/components/groups/GroupsTab.jsx`
- `src/hooks/useSessions.js` (add `usePRs`)
- History tab (unit label)
- Progress tab (unit label)
