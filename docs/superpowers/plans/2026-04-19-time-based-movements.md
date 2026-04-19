# Time-Based Movements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a duration input mode to SetRow so time-based exercises (plank, dead hang, wall sit, L-sit) show a seconds field instead of reps.

**Architecture:** `EXERCISE_LIBRARY` entries get an optional `inputType: 'time'` flag. `ExerciseBlock` reads this flag and passes it as a prop to `SetRow`. `SetRow` swaps the reps input for a duration input (binding to `duration_seconds` on the set object) when `inputType === 'time'`. The column header and stat line update to say "Sec" instead of "Reps". No schema migration — the sessions table stores JSONB so adding `duration_seconds` is backwards-compatible.

**Tech Stack:** React (hooks), Tailwind CSS (project design tokens), static `EXERCISE_LIBRARY` data at `src/lib/exercises.js`.

---

## File Structure

| File | Change |
|---|---|
| `src/lib/exercises.js` | Add `inputType: 'time'` + 4 new entries (Plank, Dead Hang, Wall Sit, L-Sit) |
| `src/components/workout/SetRow.jsx` | Accept `inputType` prop; swap reps input logic when `'time'` |
| `src/components/workout/ExerciseBlock.jsx` | Derive `inputType` from library; pass to `SetRow`; update column header and stat line |

---

## Task 1: Add Time-Based Exercises to EXERCISE_LIBRARY

**Files:**
- Modify: `src/lib/exercises.js`

**Context:** `EXERCISE_LIBRARY` is exported from `src/lib/exercises.js`. Each entry is keyed by exercise name. Existing entries have `muscles`, `pattern`, `cues`, `notes`. Time-based entries add `inputType: 'time'`. The object closes with `}` at around line 267 (after `'Cable Fly (Low-to-High)'`). New entries go immediately before that closing `}`.

- [ ] **Step 1: Add time-based entries to EXERCISE_LIBRARY**

Find the line that reads `'Cable Fly (Low-to-High)': {` near the end of `src/lib/exercises.js`. After its closing `},`, and before the final `}` that closes `EXERCISE_LIBRARY`, add:

```js
  'Plank': {
    inputType: 'time',
    muscles: { primary: ['Core'], secondary: ['Shoulders', 'Glutes'] },
    pattern: 'Isometric',
    cues: ['Forearms on floor, elbows under shoulders', 'Squeeze glutes and abs — no sagging hips', 'Neck neutral — eyes to floor', 'Breathe steadily — do not hold breath'],
    notes: 'Core endurance staple. Quality over duration — a 30-sec perfect plank beats 2 min with a sagging back.',
  },
  'Dead Hang': {
    inputType: 'time',
    muscles: { primary: ['Lats', 'Grip'], secondary: ['Rear Delts', 'Core'] },
    pattern: 'Isometric',
    cues: ['Fully passive hang — let shoulders elevate', 'No kipping or swinging', 'Grip with full hand, not fingertips', 'Breathe steadily'],
    notes: 'Excellent shoulder decompression and grip endurance builder. Progress by adding weight via belt.',
  },
  'Wall Sit': {
    inputType: 'time',
    muscles: { primary: ['Quads'], secondary: ['Glutes', 'Hamstrings'] },
    pattern: 'Isometric',
    cues: ['Back flat against wall', 'Thighs parallel to floor', 'Feet shoulder-width, toes forward', 'Do not rest hands on thighs'],
    notes: 'Pure quad endurance. Simple to perform with no equipment — effective finisher for leg sessions.',
  },
  'L-Sit': {
    inputType: 'time',
    muscles: { primary: ['Core', 'Hip Flexors'], secondary: ['Triceps', 'Shoulders'] },
    pattern: 'Isometric',
    cues: ['Legs straight and parallel to floor', 'Depress scapulae — push shoulders down', 'Point toes', 'Tuck version acceptable for beginners'],
    notes: 'Advanced isometric requiring hip flexor strength and tricep/shoulder stability. Use parallettes or dip bars.',
  },
```

- [ ] **Step 2: Start the dev server and verify no compile errors**

Run (from `/Users/jasonschmitt/strength-tracker`): `npm run dev`

Expected: Dev server starts at `http://localhost:5173` with no compile errors in the terminal. No visual change yet — the new exercises aren't wired into the UI.

- [ ] **Step 3: Commit**

```bash
git add src/lib/exercises.js
git commit -m "feat: add time-based exercise entries to EXERCISE_LIBRARY"
```

---

## Task 2: Update SetRow to Support Duration Input

**Files:**
- Modify: `src/components/workout/SetRow.jsx`

**Context:** `SetRow` is at `src/components/workout/SetRow.jsx`. Current props signature (line 10):
```jsx
export default function SetRow({ setNumber, set, onChange, onComplete, onRemove, highlighted = false, hideComplete = false }) {
```

Current destructuring of `set` (line 11):
```jsx
const { weight = '', reps = '', rpe = '', completed = false } = set
```

Current reps input (lines 81–89):
```jsx
<input
  type="number"
  inputMode="numeric"
  value={reps}
  onChange={e => onChange({ ...set, reps: e.target.value })}
  placeholder="reps"
  readOnly={completed}
  className={`flex-1 min-w-0 bg-bg-tertiary rounded-lg px-2 py-2.5 text-center text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px] ${completed ? 'pointer-events-none' : ''}`}
/>
```

- [ ] **Step 1: Add `inputType` prop and update the reps input**

Make two changes:

**1.** Add `inputType = 'reps'` to the props destructuring (line 10):

```jsx
export default function SetRow({ setNumber, set, onChange, onComplete, onRemove, highlighted = false, hideComplete = false, inputType = 'reps' }) {
```

**2.** Replace the reps input with a conditional version that reads/writes `duration_seconds` when `inputType === 'time'`:

```jsx
<input
  type="number"
  inputMode="numeric"
  value={inputType === 'time' ? (set.duration_seconds ?? '') : reps}
  onChange={e => onChange(
    inputType === 'time'
      ? { ...set, duration_seconds: e.target.value }
      : { ...set, reps: e.target.value }
  )}
  placeholder={inputType === 'time' ? 'sec' : 'reps'}
  readOnly={completed}
  className={`flex-1 min-w-0 bg-bg-tertiary rounded-lg px-2 py-2.5 text-center text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px] ${completed ? 'pointer-events-none' : ''}`}
/>
```

No other changes to this file.

- [ ] **Step 2: Commit**

```bash
git add src/components/workout/SetRow.jsx
git commit -m "feat: add inputType prop to SetRow — duration input for time-based exercises"
```

---

## Task 3: Update ExerciseBlock to Derive and Pass inputType

**Files:**
- Modify: `src/components/workout/ExerciseBlock.jsx`

**Context:** `ExerciseBlock` is at `src/components/workout/ExerciseBlock.jsx`. Key existing lines:

Line 13 — EXERCISE_LIBRARY lookup already present:
```jsx
const info = EXERCISE_LIBRARY[exercise.name] || {}
```

Lines 71–75 — stat line in the header:
```jsx
{exercise.reps && (
  <div className="text-xs text-text-muted mt-0.5">
    {exercise.sets} × {exercise.reps} reps
  </div>
)}
```

Lines 96–102 — column headers:
```jsx
<div className="flex items-center gap-2 mb-1">
  <span className="w-6" />
  <span className="flex-1 text-center text-xs text-text-muted">Weight</span>
  <span className="flex-1 text-center text-xs text-text-muted">Reps</span>
  <span className="w-16 text-center text-xs text-text-muted">RPE</span>
  <span className="w-11" />
</div>
```

Lines 105–116 — SetRow render (inside `sets.map`):
```jsx
<SetRow
  key={i}
  setNumber={i + 1}
  set={set}
  onChange={updated => updateSet(i, updated)}
  onComplete={() => onSetComplete(exIdx, i)}
  onRemove={onRemoveSet && sets.length > 1 ? () => onRemoveSet(i) : undefined}
  highlighted={i === firstUncompletedIdx}
  hideComplete={isBuilderMode}
/>
```

- [ ] **Step 1: Derive inputType from the library lookup**

After line 14 (`const primaryMuscle = ...`), add:

```jsx
const inputType = info.inputType || 'reps'
```

- [ ] **Step 2: Update the stat line to say "sec" for time-based exercises**

Replace:
```jsx
{exercise.reps && (
  <div className="text-xs text-text-muted mt-0.5">
    {exercise.sets} × {exercise.reps} reps
  </div>
)}
```

With:
```jsx
{exercise.reps && (
  <div className="text-xs text-text-muted mt-0.5">
    {exercise.sets} × {exercise.reps} {inputType === 'time' ? 'sec' : 'reps'}
  </div>
)}
```

- [ ] **Step 3: Update the column header from "Reps" to "Sec" when time-based**

Replace:
```jsx
<span className="flex-1 text-center text-xs text-text-muted">Reps</span>
```

With:
```jsx
<span className="flex-1 text-center text-xs text-text-muted">{inputType === 'time' ? 'Sec' : 'Reps'}</span>
```

- [ ] **Step 4: Pass inputType to SetRow**

Replace:
```jsx
<SetRow
  key={i}
  setNumber={i + 1}
  set={set}
  onChange={updated => updateSet(i, updated)}
  onComplete={() => onSetComplete(exIdx, i)}
  onRemove={onRemoveSet && sets.length > 1 ? () => onRemoveSet(i) : undefined}
  highlighted={i === firstUncompletedIdx}
  hideComplete={isBuilderMode}
/>
```

With:
```jsx
<SetRow
  key={i}
  setNumber={i + 1}
  set={set}
  onChange={updated => updateSet(i, updated)}
  onComplete={() => onSetComplete(exIdx, i)}
  onRemove={onRemoveSet && sets.length > 1 ? () => onRemoveSet(i) : undefined}
  highlighted={i === firstUncompletedIdx}
  hideComplete={isBuilderMode}
  inputType={inputType}
/>
```

- [ ] **Step 5: Verify in the dev server**

1. Start a custom workout and add "Plank" as an exercise — the column header should read "Sec" instead of "Reps", and the second input should have placeholder "sec".
2. Type a value (e.g., 45) into the sec field and tap the check button to complete the set — it should complete and dim as usual.
3. Add "Barbell Bench Press" as a second exercise — column header should read "Reps" and placeholder "reps" (unchanged behavior).
4. Add "Dead Hang" — verify same time-based behavior as Plank.
5. Open `ExerciseInfoSheet` for "Plank" by tapping the name — info drawer opens showing Movement Pattern: Isometric, Muscles: Core.

Expected: All 5 checks pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/workout/ExerciseBlock.jsx
git commit -m "feat: pass inputType through ExerciseBlock to SetRow, update column header for time-based exercises"
```

---

## Files Changed

| File | Changes |
|---|---|
| `src/lib/exercises.js` | Add `inputType: 'time'` field to 4 new entries: Plank, Dead Hang, Wall Sit, L-Sit |
| `src/components/workout/SetRow.jsx` | Add `inputType` prop; reps input conditionally reads/writes `duration_seconds` |
| `src/components/workout/ExerciseBlock.jsx` | Derive `inputType` from `EXERCISE_LIBRARY`; pass to `SetRow`; update column header and stat line |
