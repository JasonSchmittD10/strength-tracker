# Workout Screen UX Polish — Design Spec

**Date:** 2026-04-19
**Scope:** Group A — incremental UX improvements to the active workout flow. No schema changes, no new dependencies.

---

## Items

1. Weight carries forward
2. Edit doesn't reset rest timer
3. Current set row highlight
4. Set row alignment
5. Auto-collapse completed exercise tiles
7. Delete movement in custom workout builder

---

## 1. Weight Carries Forward

**Goal:** When a user changes the weight on any set, all subsequent uncompleted sets in that block automatically update to match.

**Location:** `src/components/workout/ExerciseBlock.jsx` — `updateSet(setIdx, updated)`

**Logic:**
- After applying the target set change, check if `updated.weight` differs from the previous value at that index.
- If yes, iterate over all sets at indices `> setIdx` where `completed !== true` and set their `weight` to `updated.weight`.
- Reps and RPE changes are not cascaded — weight only.

```js
function updateSet(setIdx, updated) {
  let next = sets.map((s, i) => i === setIdx ? updated : s)
  if (updated.weight !== sets[setIdx]?.weight) {
    next = next.map((s, i) =>
      i > setIdx && !s.completed ? { ...s, weight: updated.weight } : s
    )
  }
  onChange(next)
}
```

---

## 2. Edit Doesn't Reset Rest Timer

**Goal:** Saving an edit to an already-completed set (pencil → edit → checkmark) must not trigger or reset the rest timer. Only a first-time set completion starts the timer.

**Root cause:** The pencil click un-completes the set (`completed: false`). When the user clicks checkmark to re-save, `handleSetComplete` sees `wasCompleted = false` and fires the timer.

**Fix — two-file change:**

**`SetRow.jsx` — `handleComplete`:**
When un-completing via pencil, tag the set with a transient `editing: true` flag:
```js
function handleComplete() {
  if (!completed) onComplete()
  else onChange({ ...set, completed: false, editing: true })
}
```

**`WorkoutScreen.jsx` — `handleSetComplete`:**
Skip the timer when the set is being re-completed after an edit:
```js
function handleSetComplete(exIdx, setIdx) {
  const sets = exerciseSets[exIdx] ?? []
  const set = sets[setIdx]
  const wasCompleted = set?.completed
  const isRecompletion = set?.editing === true
  if (!wasCompleted && !isRecompletion) {
    const restDuration = activeExercises[exIdx]?.rest ?? 90
    setRestTimer({ duration: restDuration, key: Date.now() })
    setRestTimerFullScreen(true)
  }
  setExerciseSets(prev => ({
    ...prev,
    [exIdx]: (prev[exIdx] ?? []).map((s, i) =>
      i === setIdx ? { ...s, completed: !wasCompleted, editing: false } : s
    ),
  }))
}
```

The `editing` flag is never persisted — it exists only in transient UI state and is cleared on re-completion.

---

## 3. Current Set Row Highlight

**Goal:** The next uncompleted set in the active exercise block gets a visible orange accent border so the user can locate their place at a glance.

**Definition of "active exercise":** The first exercise (by index) that has at least one uncompleted set.

**Changes:**

**`WorkoutScreen.jsx`:**
Derive `activeExIdx` just before rendering:
```js
const activeExIdx = activeExercises.findIndex((_, i) =>
  (exerciseSets[i] ?? []).some(s => !s.completed)
)
```
Pass `isActive={exIdx === activeExIdx}` to each `ExerciseBlock`.

**`ExerciseBlock.jsx`:**
Accept `isActive` prop. Find the first uncompleted set index:
```js
const firstUncompletedIdx = sets.findIndex(s => !s.completed)
```
Pass `highlighted={isActive && i === firstUncompletedIdx}` to each `SetRow`.

**`SetRow.jsx`:**
Accept `highlighted` prop. When true, apply `ring-1 ring-accent` to the outermost row wrapper (`div.relative.overflow-hidden`):
```jsx
<div className={`relative overflow-hidden rounded-lg ${highlighted ? 'ring-1 ring-accent' : ''}`}>
```

---

## 4. Set Row Alignment

**Goal:** The checkmark/pencil button height matches the weight, reps, and RPE fields.

**Audit:**
- Inputs (weight, reps): `py-2.5 min-h-[44px]` → renders at 44px ✓
- Select (RPE): `py-2.5 min-h-[44px]` → renders at 44px ✓
- Button (checkmark): `w-9 h-9` → 36px ✗ (8px shorter)

**Fix in `SetRow.jsx`:** Change button dimensions from `w-9 h-9` to `w-11 h-11` (44px), keeping `rounded-full` and all other classes unchanged.

---

## 5. Auto-Collapse Completed Exercise Tiles

**Goal:** When all sets in an ExerciseBlock are logged, the tile collapses automatically. The header remains tappable to re-expand.

**Changes in `ExerciseBlock.jsx`:**

Add `collapsed` state (defaults `false`):
```js
const [collapsed, setCollapsed] = useState(false)
```

Add a `useEffect` that watches `sets` and auto-collapses when all sets are completed:
```js
useEffect(() => {
  if (sets.length > 0 && sets.every(s => s.completed)) {
    setCollapsed(true)
  }
}, [sets])
```

Make the header row a toggle target:
```jsx
<div
  className="flex items-center justify-between mb-3 cursor-pointer"
  onClick={() => setCollapsed(c => !c)}
>
```

Add a completion indicator in the header (visible when collapsed):
```jsx
{collapsed && sets.every(s => s.completed) && (
  <span className="text-xs text-success font-medium ml-2">Done</span>
)}
```

Wrap the body (cues toggle, column headers, set rows, add set button) in a conditional:
```jsx
{!collapsed && ( /* ...body... */ )}
```

**Note:** The existing `cuesOpen` and `historyOpen` state are unaffected — the history sheet can still be triggered from the header's clock icon even when collapsed. The clock icon's `onClick` must call `e.stopPropagation()` to prevent the header click from toggling collapse simultaneously.

---

## 7. Delete Movement in Custom Workout Builder

**Goal:** In custom/template mode, each ExerciseBlock has a delete control that removes the entire exercise from the workout.

**Changes:**

**`ExerciseBlock.jsx`:**
Add `onRemove` prop. When defined, render a trash icon button in the header. The button calls `e.stopPropagation()` (since the header is now clickable for collapse) and calls `onRemove()`:
```jsx
import { Trash2 } from 'lucide-react'

{onRemove && (
  <button
    onClick={e => { e.stopPropagation(); onRemove() }}
    className="p-2 text-text-muted hover:text-danger transition-colors flex-shrink-0"
  >
    <Trash2 size={16} />
  </button>
)}
```

**`WorkoutScreen.jsx`:**
Add `handleRemoveExercise(exIdx)`. Removes the exercise from `customExercises` and re-indexes `exerciseSets` (since it's an object keyed by exercise index, all keys above the removed index shift down by 1):
```js
function handleRemoveExercise(exIdx) {
  setCustomExercises(prev => prev.filter((_, i) => i !== exIdx))
  setExerciseSets(prev => {
    const next = {}
    Object.entries(prev).forEach(([key, sets]) => {
      const k = parseInt(key)
      if (k < exIdx) next[k] = sets
      else if (k > exIdx) next[k - 1] = sets
    })
    return next
  })
}
```

Pass `onRemove` only in custom/template mode:
```jsx
onRemove={isCustomMode ? () => handleRemoveExercise(exIdx) : undefined}
```

No confirmation dialog — consistent with the existing swipe-to-remove-set pattern. Destructive but low-stakes during an in-progress workout.

---

## Files Changed

| File | Changes |
|---|---|
| `src/components/workout/ExerciseBlock.jsx` | Weight carry-forward in `updateSet`; `collapsed` state + `useEffect`; header click-to-toggle; `onRemove` prop + trash icon; `isActive` → `highlighted` pass-through; `stopPropagation` on clock icon |
| `src/components/workout/SetRow.jsx` | `editing: true` on pencil click; `highlighted` prop + `ring-accent` ring; button height `w-11 h-11` |
| `src/components/workout/WorkoutScreen.jsx` | `isRecompletion` guard in `handleSetComplete`; `activeExIdx` derivation; `isActive` prop on ExerciseBlock; `handleRemoveExercise`; `onRemove` prop on ExerciseBlock |

---

## Out of Scope

- Superset-aware weight carry-forward (carry within superset member only) — current behavior is per-block, which is correct
- Confirmation dialog on delete — not warranted given existing swipe-delete pattern
- Persisting collapsed state across sessions — collapse is a session-only UI hint
