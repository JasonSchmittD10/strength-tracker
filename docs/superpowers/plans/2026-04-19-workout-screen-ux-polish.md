# Workout Screen UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement six incremental UX improvements to the active workout screen — weight carry-forward, edit-without-timer-reset, active set highlight, row height alignment, auto-collapse completed tiles, and delete movement.

**Architecture:** All changes are confined to three existing components (`SetRow`, `ExerciseBlock`, `WorkoutScreen`). No new files, no schema changes, no new dependencies. Each task is independently committable.

**Tech Stack:** React, Tailwind CSS, Lucide icons, Vite dev server (preview at localhost for verification)

**Spec:** `docs/superpowers/specs/2026-04-19-workout-screen-ux-polish-design.md`

---

## File Map

| File | Tasks |
|---|---|
| `src/components/workout/SetRow.jsx` | 1, 3, 4 |
| `src/components/workout/ExerciseBlock.jsx` | 2, 4, 5, 6 |
| `src/components/workout/WorkoutScreen.jsx` | 3, 4, 6 |

---

## Task 1: Set Row Alignment

**Files:**
- Modify: `src/components/workout/SetRow.jsx`

The checkmark/pencil button is `w-9 h-9` (36px) while inputs are `min-h-[44px]`. Fix by changing button to `w-11 h-11` (44px).

- [ ] **Step 1: Read the file**

Read `src/components/workout/SetRow.jsx` in full before editing.

- [ ] **Step 2: Change button dimensions**

In `SetRow.jsx`, find the button element (line ~101). Change `w-9 h-9` to `w-11 h-11`:

```jsx
<button
  onClick={handleComplete}
  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
    completed ? 'bg-success text-white' : 'bg-bg-tertiary text-text-muted hover:bg-accent/20 hover:text-accent'
  }`}
>
```

- [ ] **Step 3: Verify in preview**

Open the workout screen in the running preview server. Start any workout. Confirm the checkmark button height visually matches the weight and reps inputs in the same row.

- [ ] **Step 4: Commit**

```bash
git add src/components/workout/SetRow.jsx
git commit -m "fix: normalize set row button height to 44px to match inputs"
```

---

## Task 2: Weight Carries Forward

**Files:**
- Modify: `src/components/workout/ExerciseBlock.jsx`

When the weight field on any set changes, cascade the new value to all subsequent uncompleted sets in the same block.

- [ ] **Step 1: Read the file**

Read `src/components/workout/ExerciseBlock.jsx` in full before editing.

- [ ] **Step 2: Update `updateSet` to cascade weight**

Replace the existing `updateSet` function:

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

- [ ] **Step 3: Verify in preview**

Start a workout. On any exercise with 3+ sets, change the weight on set 1. Confirm sets 2 and 3 update to match. Mark set 2 as completed, then change set 1's weight again — confirm only set 3 updates (set 2 is completed, set 1 is the target, so only set 3 is affected).

- [ ] **Step 4: Commit**

```bash
git add src/components/workout/ExerciseBlock.jsx
git commit -m "feat: carry weight forward to subsequent uncompleted sets"
```

---

## Task 3: Edit Doesn't Reset Rest Timer

**Files:**
- Modify: `src/components/workout/SetRow.jsx`
- Modify: `src/components/workout/WorkoutScreen.jsx`

When a completed set is un-completed via the pencil icon and then re-completed, the rest timer must not fire. Fix by tagging the set with a transient `editing: true` flag on pencil click, then checking for it in `handleSetComplete`.

- [ ] **Step 1: Read both files**

Read `src/components/workout/SetRow.jsx` and `src/components/workout/WorkoutScreen.jsx` in full before editing.

- [ ] **Step 2: Tag set with `editing: true` on pencil click in SetRow**

In `SetRow.jsx`, update `handleComplete` (currently lines ~16-19):

```js
function handleComplete() {
  if (!completed) onComplete()
  else onChange({ ...set, completed: false, editing: true })
}
```

- [ ] **Step 3: Guard rest timer in WorkoutScreen**

In `WorkoutScreen.jsx`, replace `handleSetComplete` (currently lines ~198-211):

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

- [ ] **Step 4: Verify in preview**

Start a workout, complete a set (rest timer should appear). Dismiss or skip the timer. Click the pencil on that completed set — set goes back to editable. Change the weight. Click the checkmark — confirm the rest timer does NOT appear. Now complete a fresh uncompleted set — confirm the rest timer DOES appear.

- [ ] **Step 5: Commit**

```bash
git add src/components/workout/SetRow.jsx src/components/workout/WorkoutScreen.jsx
git commit -m "fix: re-completing an edited set no longer triggers rest timer"
```

---

## Task 4: Current Set Row Highlight

**Files:**
- Modify: `src/components/workout/WorkoutScreen.jsx`
- Modify: `src/components/workout/ExerciseBlock.jsx`
- Modify: `src/components/workout/SetRow.jsx`

The first uncompleted set in the first exercise that has any uncompleted sets gets an orange accent ring.

- [ ] **Step 1: Read all three files**

Read `src/components/workout/WorkoutScreen.jsx`, `src/components/workout/ExerciseBlock.jsx`, and `src/components/workout/SetRow.jsx` in full.

- [ ] **Step 2: Derive `activeExIdx` in WorkoutScreen**

In `WorkoutScreen.jsx`, add this derivation just before the `return` statement (after the `displayGroups` loop, around line ~396):

```js
const activeExIdx = activeExercises.findIndex((_, i) =>
  (exerciseSets[i] ?? []).some(s => !s.completed)
)
```

- [ ] **Step 3: Pass `isActive` to ExerciseBlock in WorkoutScreen**

In `WorkoutScreen.jsx`, find both places where `<ExerciseBlock` is rendered (inside `displayGroups.map` for both `'single'` and `'superset'` types) and add `isActive={exIdx === activeExIdx}` to each:

For the `'single'` case (around line ~462):
```jsx
<ExerciseBlock
  key={exIdx}
  exercise={activeExercises[exIdx]}
  exIdx={exIdx}
  sets={exerciseSets[exIdx] ?? []}
  onChange={sets => setExerciseSets(prev => ({ ...prev, [exIdx]: sets }))}
  onSetComplete={handleSetComplete}
  isProgramMode={mode === 'program'}
  onRemoveSet={isCustomMode ? (setIdx) => removeSet(exIdx, setIdx) : undefined}
  isSelected={selectedExercises.has(exIdx)}
  onSelect={isCustomMode && isSelectingSuperset ? () => handleToggleSelect(exIdx) : undefined}
  isActive={exIdx === activeExIdx}
/>
```

For the `'superset'` case (around line ~484):
```jsx
<ExerciseBlock
  key={exIdx}
  exercise={activeExercises[exIdx]}
  exIdx={exIdx}
  sets={exerciseSets[exIdx] ?? []}
  onChange={sets => setExerciseSets(prev => ({ ...prev, [exIdx]: sets }))}
  onSetComplete={handleSetComplete}
  isProgramMode={mode === 'program'}
  onRemoveSet={isCustomMode ? (setIdx) => removeSet(exIdx, setIdx) : undefined}
  isInSuperset={true}
  isSelected={selectedExercises.has(exIdx)}
  onSelect={isCustomMode && isSelectingSuperset ? () => handleToggleSelect(exIdx) : undefined}
  onAddSet={isCustomMode ? () => handleAddSetToSuperset(group.indices) : undefined}
  isActive={exIdx === activeExIdx}
/>
```

- [ ] **Step 4: Accept `isActive` in ExerciseBlock and pass `highlighted` to SetRow**

In `ExerciseBlock.jsx`, update the component signature to accept `isActive`:

```js
export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete, isProgramMode = false, onRemoveSet, isInSuperset = false, isSelected = false, onSelect, onAddSet, isActive = false }) {
```

Find the first uncompleted set index just before the `return`:

```js
const firstUncompletedIdx = isActive ? sets.findIndex(s => !s.completed) : -1
```

In the `sets.map` that renders `<SetRow>` components, add the `highlighted` prop:

```jsx
{sets.map((set, i) => (
  <SetRow
    key={i}
    setNumber={i + 1}
    set={set}
    onChange={updated => updateSet(i, updated)}
    onComplete={() => onSetComplete(exIdx, i)}
    onRemove={onRemoveSet && sets.length > 1 ? () => onRemoveSet(i) : undefined}
    highlighted={i === firstUncompletedIdx}
  />
))}
```

- [ ] **Step 5: Accept `highlighted` in SetRow and apply accent ring**

In `SetRow.jsx`, update the component signature:

```js
export default function SetRow({ setNumber, set, onChange, onComplete, onRemove, highlighted = false }) {
```

Add the ring to the outermost `div` (currently `<div className="relative overflow-hidden rounded-lg">`):

```jsx
<div className={`relative overflow-hidden rounded-lg ${highlighted ? 'ring-1 ring-accent' : ''}`}>
```

- [ ] **Step 6: Verify in preview**

Start a workout. Confirm the first set of the first exercise has an orange ring. Complete set 1 — confirm the ring moves to set 2. Complete all sets in exercise 1 — confirm the ring moves to the first uncompleted set in exercise 2.

- [ ] **Step 7: Commit**

```bash
git add src/components/workout/WorkoutScreen.jsx src/components/workout/ExerciseBlock.jsx src/components/workout/SetRow.jsx
git commit -m "feat: highlight active set row with accent ring"
```

---

## Task 5: Auto-Collapse Completed Exercise Tiles

**Files:**
- Modify: `src/components/workout/ExerciseBlock.jsx`

When all sets in a block are completed, the tile collapses automatically. The header stays tappable to re-expand.

- [ ] **Step 1: Read the file**

Read `src/components/workout/ExerciseBlock.jsx` in full.

- [ ] **Step 2: Add `collapsed` state and auto-collapse effect**

Add after the existing `useState` declarations at the top of the component:

```js
const [collapsed, setCollapsed] = useState(false)

useEffect(() => {
  if (sets.length > 0 && sets.every(s => s.completed)) {
    setCollapsed(true)
  }
}, [sets])
```

Add `useEffect` to the import at the top of the file:

```js
import { useState, useEffect } from 'react'
```

- [ ] **Step 3: Make header clickable and show completion indicator**

Replace the header `div` (currently `<div className="flex items-center justify-between mb-3">`):

```jsx
<div
  className="flex items-center justify-between mb-3 cursor-pointer select-none"
  onClick={() => setCollapsed(c => !c)}
>
```

Add a "Done" badge inside the header's name section, visible only when collapsed and all sets are complete. Find the `<div className="flex-1">` block and add the badge after the exercise name:

```jsx
<div className="flex-1">
  <div className="flex items-center gap-2">
    <div className="font-bold text-text-primary text-base">{exercise.name}</div>
    {collapsed && sets.every(s => s.completed) && (
      <span className="text-xs text-success font-semibold">Done</span>
    )}
  </div>
  {primaryMuscle && <div className="text-xs text-text-secondary">{primaryMuscle}</div>}
  {exercise.reps && (
    <div className="text-xs text-text-muted mt-0.5">
      {exercise.sets} × {exercise.reps} reps
    </div>
  )}
</div>
```

- [ ] **Step 4: Add `stopPropagation` to the clock (history) button**

The history button is inside the header div which is now clickable. Prevent it from toggling collapse when tapped:

```jsx
<button
  onClick={e => { e.stopPropagation(); setHistoryOpen(true) }}
  className="p-2 text-text-muted hover:text-accent transition-colors"
>
  <Clock size={16} />
</button>
```

- [ ] **Step 5: Wrap body content in collapse gate**

Wrap the cues section, column headers, set rows, and "+ Add Set" button in a single conditional. The entire body below the header becomes:

```jsx
{!collapsed && (
  <>
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
      <span className="w-11" />
    </div>

    {/* Sets */}
    {sets.map((set, i) => (
      <SetRow
        key={i}
        setNumber={i + 1}
        set={set}
        onChange={updated => updateSet(i, updated)}
        onComplete={() => onSetComplete(exIdx, i)}
        onRemove={onRemoveSet && sets.length > 1 ? () => onRemoveSet(i) : undefined}
        highlighted={i === firstUncompletedIdx}
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
  </>
)}
```

**Note:** The `ExerciseHistorySheet` stays outside the `!collapsed` gate — it's triggered from the header and must always be rendered.

- [ ] **Step 6: Verify in preview**

Start a workout. Complete all sets on one exercise — confirm the tile collapses and shows "Done". Tap the header — confirm it re-expands and the sets are visible. Complete all sets again — confirm it re-collapses.

- [ ] **Step 7: Commit**

```bash
git add src/components/workout/ExerciseBlock.jsx
git commit -m "feat: auto-collapse exercise tile when all sets complete"
```

---

## Task 6: Delete Movement in Custom Workout Builder

**Files:**
- Modify: `src/components/workout/ExerciseBlock.jsx`
- Modify: `src/components/workout/WorkoutScreen.jsx`

In custom/template mode, add a trash icon to each exercise block header that removes the entire exercise. Re-indexes `exerciseSets` (object keyed by exercise index) after removal.

- [ ] **Step 1: Read both files**

Read `src/components/workout/ExerciseBlock.jsx` and `src/components/workout/WorkoutScreen.jsx` in full.

- [ ] **Step 2: Add `Trash2` import and `onRemove` prop to ExerciseBlock**

Update the imports at the top of `ExerciseBlock.jsx`:

```js
import { ChevronDown, ChevronUp, Clock, Check, Trash2 } from 'lucide-react'
```

Update the component signature to accept `onRemove`:

```js
export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete, isProgramMode = false, onRemoveSet, isInSuperset = false, isSelected = false, onSelect, onAddSet, isActive = false, onRemove }) {
```

- [ ] **Step 3: Add trash button to the header in ExerciseBlock**

Inside the header `div`, after the clock button and before the closing `</div>`, add:

```jsx
{onRemove && (
  <button
    onClick={e => { e.stopPropagation(); onRemove() }}
    className="p-2 text-text-muted hover:text-danger transition-colors flex-shrink-0"
  >
    <Trash2 size={16} />
  </button>
)}
```

- [ ] **Step 4: Add `handleRemoveExercise` to WorkoutScreen**

In `WorkoutScreen.jsx`, add this function after `handleAddSupersetFromSheet` (around line ~300):

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

- [ ] **Step 5: Pass `onRemove` to ExerciseBlock in WorkoutScreen**

In the `'single'` ExerciseBlock render (inside `displayGroups.map`), add `onRemove`:

```jsx
<ExerciseBlock
  key={exIdx}
  exercise={activeExercises[exIdx]}
  exIdx={exIdx}
  sets={exerciseSets[exIdx] ?? []}
  onChange={sets => setExerciseSets(prev => ({ ...prev, [exIdx]: sets }))}
  onSetComplete={handleSetComplete}
  isProgramMode={mode === 'program'}
  onRemoveSet={isCustomMode ? (setIdx) => removeSet(exIdx, setIdx) : undefined}
  isSelected={selectedExercises.has(exIdx)}
  onSelect={isCustomMode && isSelectingSuperset ? () => handleToggleSelect(exIdx) : undefined}
  isActive={exIdx === activeExIdx}
  onRemove={isCustomMode ? () => handleRemoveExercise(exIdx) : undefined}
/>
```

In the `'superset'` ExerciseBlock render, also add `onRemove`:

```jsx
<ExerciseBlock
  key={exIdx}
  exercise={activeExercises[exIdx]}
  exIdx={exIdx}
  sets={exerciseSets[exIdx] ?? []}
  onChange={sets => setExerciseSets(prev => ({ ...prev, [exIdx]: sets }))}
  onSetComplete={handleSetComplete}
  isProgramMode={mode === 'program'}
  onRemoveSet={isCustomMode ? (setIdx) => removeSet(exIdx, setIdx) : undefined}
  isInSuperset={true}
  isSelected={selectedExercises.has(exIdx)}
  onSelect={isCustomMode && isSelectingSuperset ? () => handleToggleSelect(exIdx) : undefined}
  onAddSet={isCustomMode ? () => handleAddSetToSuperset(group.indices) : undefined}
  isActive={exIdx === activeExIdx}
  onRemove={isCustomMode ? () => handleRemoveExercise(exIdx) : undefined}
/>
```

- [ ] **Step 6: Verify in preview**

Start a custom workout. Add 3 exercises. Tap the trash icon on the middle exercise (index 1) — confirm it disappears and the remaining two are correctly indexed (subsequent exercises don't shift or lose their set data). Add a set to the remaining exercises and confirm state is correct.

- [ ] **Step 7: Commit**

```bash
git add src/components/workout/ExerciseBlock.jsx src/components/workout/WorkoutScreen.jsx
git commit -m "feat: add delete button to exercise blocks in custom workout"
```

---

## Final Step: Push

```bash
git push origin main
```

Vercel auto-deploys on push to `main`.
