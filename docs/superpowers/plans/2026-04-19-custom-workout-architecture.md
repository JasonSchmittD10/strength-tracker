# Custom Workout Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a template picker sheet and a dedicated builder mode so custom workouts split into Templates (pick and run) and Sessions (active workout instances).

**Architecture:** Five files change in dependency order: SetRow gets `hideComplete`, ExerciseBlock gets `isBuilderMode`, a new TemplatePickerSheet component handles template selection, WorkoutScreen gains a `builder` mode, and HomeScreen wires up two new entry points.

**Tech Stack:** React (hooks), Tailwind CSS (project design tokens), TanStack Query (`useWorkoutTemplates`, `useSaveTemplate`), React Router v6 (`useNavigate`), `SlideUpSheet` shared component.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/workout/SetRow.jsx` | Modify | Add `hideComplete` prop — hides checkmark button in builder mode |
| `src/components/workout/ExerciseBlock.jsx` | Modify | Add `isBuilderMode` prop — passes `hideComplete` to SetRow |
| `src/components/workout/TemplatePickerSheet.jsx` | Create | Slide-up sheet listing saved templates with start-empty fallback |
| `src/components/workout/WorkoutScreen.jsx` | Modify | Add `builder` mode: hidden timer, save-template flow, nav guard |
| `src/components/home/HomeScreen.jsx` | Modify | Replace single custom button with "My Workouts" + "Build Workout" |

---

### Task 1: SetRow — add hideComplete prop

**Files:**
- Modify: `src/components/workout/SetRow.jsx`

**Context:** SetRow is at `/Users/jasonschmitt/strength-tracker/src/components/workout/SetRow.jsx`. Read it first.

Current signature:
```jsx
export default function SetRow({ setNumber, set, onChange, onComplete, onRemove, highlighted = false }) {
```

Current checkmark button (lines ~101–108):
```jsx
<button
  onClick={handleComplete}
  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
    completed ? 'bg-success text-white' : 'bg-bg-tertiary text-text-muted hover:bg-accent/20 hover:text-accent'
  }`}
>
  {completed ? <Pencil size={16} /> : <Check size={16} />}
</button>
```

In builder mode the button must be hidden but the column spacing preserved. Replace the button with a conditional that renders either the button or a same-width spacer.

- [ ] **Step 1: Update the signature to accept `hideComplete`**

Change:
```jsx
export default function SetRow({ setNumber, set, onChange, onComplete, onRemove, highlighted = false }) {
```
To:
```jsx
export default function SetRow({ setNumber, set, onChange, onComplete, onRemove, highlighted = false, hideComplete = false }) {
```

- [ ] **Step 2: Replace the checkmark button with a conditional**

Replace the button block with:
```jsx
{!hideComplete ? (
  <button
    onClick={handleComplete}
    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
      completed ? 'bg-success text-white' : 'bg-bg-tertiary text-text-muted hover:bg-accent/20 hover:text-accent'
    }`}
  >
    {completed ? <Pencil size={16} /> : <Check size={16} />}
  </button>
) : (
  <div className="w-11 flex-shrink-0" />
)}
```

The `<div className="w-11 flex-shrink-0" />` preserves column alignment with the `<span className="w-11" />` spacer in ExerciseBlock's column headers.

- [ ] **Step 3: Verify the dev server starts with no errors**

Run: `npm run dev` from `/Users/jasonschmitt/strength-tracker`
Expected: Compiles without errors. No visual change yet — `hideComplete` defaults `false`.

- [ ] **Step 4: Commit**

```bash
cd /Users/jasonschmitt/strength-tracker
git add src/components/workout/SetRow.jsx
git commit -m "feat: add hideComplete prop to SetRow for builder mode"
```

---

### Task 2: ExerciseBlock — add isBuilderMode prop

**Files:**
- Modify: `src/components/workout/ExerciseBlock.jsx`

**Context:** ExerciseBlock is at `/Users/jasonschmitt/strength-tracker/src/components/workout/ExerciseBlock.jsx`. Read it first.

Current signature (line 8):
```jsx
export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete, isProgramMode = false, onRemoveSet, isInSuperset = false, isSelected = false, onSelect, onAddSet, isActive = false, onRemove }) {
```

SetRow is rendered inside a `sets.map(...)` block. Each `<SetRow>` currently receives:
```jsx
<SetRow
  key={i}
  setNumber={i + 1}
  set={set}
  onChange={updated => updateSet(i, updated)}
  onComplete={() => onSetComplete(exIdx, i)}
  onRemove={onRemoveSet && sets.length > 1 ? () => onRemoveSet(i) : undefined}
  highlighted={i === firstUncompletedIdx}
/>
```

- [ ] **Step 1: Add `isBuilderMode` to the signature**

Change:
```jsx
export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete, isProgramMode = false, onRemoveSet, isInSuperset = false, isSelected = false, onSelect, onAddSet, isActive = false, onRemove }) {
```
To:
```jsx
export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete, isProgramMode = false, onRemoveSet, isInSuperset = false, isSelected = false, onSelect, onAddSet, isActive = false, onRemove, isBuilderMode = false }) {
```

- [ ] **Step 2: Pass `hideComplete` to each SetRow**

Find the SetRow render inside `sets.map(...)` and add `hideComplete={isBuilderMode}`:
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

- [ ] **Step 3: Verify the dev server starts with no errors**

Run: `npm run dev` from `/Users/jasonschmitt/strength-tracker`
Expected: Compiles without errors. No visual change yet.

- [ ] **Step 4: Commit**

```bash
cd /Users/jasonschmitt/strength-tracker
git add src/components/workout/ExerciseBlock.jsx
git commit -m "feat: add isBuilderMode prop to ExerciseBlock, pass hideComplete to SetRow"
```

---

### Task 3: TemplatePickerSheet — new component

**Files:**
- Create: `src/components/workout/TemplatePickerSheet.jsx`

**Context:**

`SlideUpSheet` is at `src/components/shared/SlideUpSheet.jsx`. Signature:
```jsx
<SlideUpSheet open={bool} onClose={fn} title={string} heightClass="h-[70vh]" footer={node}>
  {children}
</SlideUpSheet>
```

`useWorkoutTemplates()` from `@/hooks/useTemplates` returns `{ data: templates = [] }` where each template is:
```js
{ id, name, exercises: [{ name, sets, reps, rest, restLabel }], created_at }
```

Design tokens: `bg-bg-card`, `bg-bg-tertiary`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `border-bg-tertiary`, `text-accent`.

`formatDate` is available from `@/lib/utils` — signature: `formatDate(dateString, short)`.

Navigation: `useNavigate()` from `react-router-dom`. After selecting a template, navigate to `/workout` with state `{ mode: 'template', template }`. Start empty: navigate to `/workout` with state `{ mode: 'custom' }`. Always call `onClose()` before navigating.

- [ ] **Step 1: Create the file**

```jsx
import { useNavigate } from 'react-router-dom'
import { useWorkoutTemplates } from '@/hooks/useTemplates'
import { formatDate } from '@/lib/utils'
import SlideUpSheet from '@/components/shared/SlideUpSheet'

export default function TemplatePickerSheet({ open, onClose }) {
  const navigate = useNavigate()
  const { data: templates = [], isLoading } = useWorkoutTemplates()

  function handlePick(template) {
    onClose()
    navigate('/workout', { state: { mode: 'template', template } })
  }

  function handleStartEmpty() {
    onClose()
    navigate('/workout', { state: { mode: 'custom' } })
  }

  const footer = (
    <button
      onClick={handleStartEmpty}
      className="w-full text-center text-sm text-text-muted py-1"
    >
      Start Empty Workout
    </button>
  )

  return (
    <SlideUpSheet open={open} onClose={onClose} title="My Workouts" footer={footer}>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-bg-tertiary animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <p className="text-text-secondary text-sm">No saved workouts yet.</p>
          <p className="text-text-muted text-xs">Tap "Build Workout" on the home screen to create one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => handlePick(t)}
              className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-left hover:border-accent/40 transition-colors"
            >
              <div className="font-semibold text-text-primary text-sm">{t.name}</div>
              <div className="text-xs text-text-muted mt-0.5">
                {t.exercises?.length ?? 0} exercises · {formatDate(t.created_at, true)}
              </div>
            </button>
          ))}
        </div>
      )}
    </SlideUpSheet>
  )
}
```

- [ ] **Step 2: Verify the dev server starts with no errors**

Run: `npm run dev` from `/Users/jasonschmitt/strength-tracker`
Expected: Compiles without errors. Component not yet wired to anything.

- [ ] **Step 3: Commit**

```bash
cd /Users/jasonschmitt/strength-tracker
git add src/components/workout/TemplatePickerSheet.jsx
git commit -m "feat: add TemplatePickerSheet slide-up template selector"
```

---

### Task 4: WorkoutScreen — builder mode

**Files:**
- Modify: `src/components/workout/WorkoutScreen.jsx`

**Context:** Read `/Users/jasonschmitt/strength-tracker/src/components/workout/WorkoutScreen.jsx` before making changes.

This task makes several targeted changes to WorkoutScreen. Read each change carefully against the current file.

**Changes overview:**
1. Import `useSaveTemplate`
2. Add `builder` to `isCustomMode`
3. Add builder state vars + `handleSaveBuilder`
4. Hide timer/pause in header when `mode === 'builder'`
5. Pass `isBuilderMode` to each `ExerciseBlock`
6. Replace Finish/Cancel block with builder save UI when mode is `'builder'`

---

- [ ] **Step 1: Add useSaveTemplate import**

Find the line:
```js
import { useSessions, useSaveSession } from '@/hooks/useSessions'
```

Add a new line directly below it:
```js
import { useSaveTemplate } from '@/hooks/useTemplates'
```

- [ ] **Step 2: Wire up useSaveTemplate**

Find the line:
```js
const { mutateAsync: saveSession } = useSaveSession()
```

Add directly below it:
```js
const { mutateAsync: saveTemplate } = useSaveTemplate()
```

- [ ] **Step 3: Expand isCustomMode to include builder**

Find:
```js
const isCustomMode = mode === 'custom' || mode === 'template'
```

Replace with:
```js
const isCustomMode = mode === 'custom' || mode === 'template' || mode === 'builder'
```

- [ ] **Step 4: Add builder state variables**

Find the block of state declarations near the top of the component (where `isPaused`, `restTimer`, etc. are declared). Add these three lines anywhere in that block:
```js
const [builderName, setBuilderName] = useState('')
const [builderSaving, setBuilderSaving] = useState(false)
const [builderSaveError, setBuilderSaveError] = useState(null)
```

- [ ] **Step 5: Add handleSaveBuilder function**

Add this function alongside the other handler functions (e.g., after `handleSave`):

```js
async function handleSaveBuilder() {
  if (activeExercises.length === 0) return
  setBuilderSaving(true)
  setBuilderSaveError(null)
  try {
    const name = builderName.trim() || 'Custom Workout'
    const exercises = activeExercises.map((ex, i) => ({
      name: ex.name,
      sets: (exerciseSets[i] ?? []).length || ex.sets || 3,
      reps: ex.reps || '8–12',
      rest: ex.rest ?? 90,
      restLabel: ex.restLabel ?? '90 sec',
    }))
    await saveTemplate({ name, exercises })
    allowNavRef.current = true
    navigate('/home')
  } catch (e) {
    setBuilderSaveError('Failed to save. Please try again.')
  } finally {
    setBuilderSaving(false)
  }
}
```

- [ ] **Step 6: Hide timer and pause button in header for builder mode**

Find the header section. It has this structure for the right side:
```jsx
<div className="flex items-center gap-2 flex-shrink-0">
  {isPaused
    ? <span className="text-sm text-text-muted italic">Paused</span>
    : <span className="font-mono text-sm text-text-muted">{formatElapsed(elapsed)}</span>
  }
  <button
    onClick={handleTogglePause}
    className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
    aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
  >
    {isPaused ? <Play size={15} /> : <Pause size={15} />}
  </button>
</div>
```

Wrap it with a conditional so it only shows when not in builder mode:
```jsx
{mode !== 'builder' && (
  <div className="flex items-center gap-2 flex-shrink-0">
    {isPaused
      ? <span className="text-sm text-text-muted italic">Paused</span>
      : <span className="font-mono text-sm text-text-muted">{formatElapsed(elapsed)}</span>
    }
    <button
      onClick={handleTogglePause}
      className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
      aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
    >
      {isPaused ? <Play size={15} /> : <Pause size={15} />}
    </button>
  </div>
)}
```

Also update the header title to show "Build Workout" in builder mode. Find:
```jsx
<span className="font-bold text-text-primary truncate">
  {mode === 'program' ? session.name : 'Custom Workout'}
```

Replace with:
```jsx
<span className="font-bold text-text-primary truncate">
  {mode === 'program' ? session.name : mode === 'builder' ? 'Build Workout' : 'Custom Workout'}
```

- [ ] **Step 7: Pass isBuilderMode to each ExerciseBlock**

There are two ExerciseBlock render sites in WorkoutScreen: one for `group.type === 'single'` and one inside the superset group. Add `isBuilderMode={mode === 'builder'}` to **both**:

For single:
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
  isBuilderMode={mode === 'builder'}
/>
```

For superset:
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
  isBuilderMode={mode === 'builder'}
/>
```

- [ ] **Step 8: Replace Finish/Cancel block with builder-aware conditional**

Find the Finish/Cancel section inside the scrollable area:
```jsx
{/* Finish + Cancel — inline at bottom of scroll area */}
<div className="pt-4 mt-2 border-t border-bg-tertiary">
  <PrimaryButton onClick={() => setSummaryOpen(true)} className="mb-2">
    Finish Workout
  </PrimaryButton>
  <button
    onClick={handleBack}
    className="w-full text-danger text-sm font-medium py-2"
  >
    Cancel Workout
  </button>
```

Replace with:
```jsx
{/* Finish / Save — inline at bottom of scroll area */}
<div className="pt-4 mt-2 border-t border-bg-tertiary">
  {mode === 'builder' ? (
    <div className="space-y-3">
      <input
        value={builderName}
        onChange={e => setBuilderName(e.target.value)}
        placeholder="e.g. Upper Body Power"
        className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {builderSaveError && <p className="text-xs text-danger">{builderSaveError}</p>}
      <PrimaryButton
        onClick={handleSaveBuilder}
        disabled={builderSaving || activeExercises.length === 0}
        className="mb-2"
      >
        {builderSaving ? 'Saving…' : 'Save Template'}
      </PrimaryButton>
      <button
        onClick={() => { allowNavRef.current = true; navigate(-1) }}
        className="w-full text-text-muted text-sm font-medium py-2"
      >
        Discard
      </button>
    </div>
  ) : (
    <>
      <PrimaryButton onClick={() => setSummaryOpen(true)} className="mb-2">
        Finish Workout
      </PrimaryButton>
      <button
        onClick={handleBack}
        className="w-full text-danger text-sm font-medium py-2"
      >
        Cancel Workout
      </button>
    </>
  )}
```

Note: the closing `</div>` for this section remains as-is after your changes.

- [ ] **Step 9: Verify in dev server**

Run: `npm run dev` from `/Users/jasonschmitt/strength-tracker`

Navigate to `/workout` with `{ mode: 'builder' }` (you can temporarily add a direct link or use browser dev tools to set location state).

Expected:
- Header shows "Build Workout", no timer, no pause button
- Add Exercise works
- Set rows show no checkmark button (spacer in its place)
- Scroll to bottom: name input + "Save Template" button + "Discard" link visible
- "Discard" navigates back without confirmation dialog
- "Save Template" with no exercises is disabled (button opacity reduced)

- [ ] **Step 10: Commit**

```bash
cd /Users/jasonschmitt/strength-tracker
git add src/components/workout/WorkoutScreen.jsx
git commit -m "feat: add builder mode to WorkoutScreen — no timer, save template flow"
```

---

### Task 5: HomeScreen — wire up new entry points

**Files:**
- Modify: `src/components/home/HomeScreen.jsx`

**Context:** Read `/Users/jasonschmitt/strength-tracker/src/components/home/HomeScreen.jsx` before making changes.

This task makes three changes:
1. Import `TemplatePickerSheet` and add `pickerOpen` state
2. Update `HeroNoPlan` button to open the picker
3. Replace the bottom "Start Custom Workout" outline button with "My Workouts" + "Build Workout"

---

- [ ] **Step 1: Add TemplatePickerSheet import**

Find the imports at the top of the file. Add:
```js
import TemplatePickerSheet from '@/components/workout/TemplatePickerSheet'
```

- [ ] **Step 2: Add pickerOpen state inside HomeScreen**

Find the `const navigate = useNavigate()` line. Add directly below it:
```js
const [pickerOpen, setPickerOpen] = useState(false)
```

Also add `useState` to the React import if it's not already there. The current import is:
```js
import { useMemo } from 'react'
```

Change to:
```js
import { useMemo, useState } from 'react'
```

- [ ] **Step 3: Update HeroNoPlan — "Start Custom Workout" → opens picker**

Find `HeroNoPlan` usage in the render:
```jsx
<HeroNoPlan
  onStartCustom={() => navigate('/workout', { state: { mode: 'custom' } })}
  onStartPlan={() => navigate('/program-selector')}
/>
```

Replace with:
```jsx
<HeroNoPlan
  onStartCustom={() => setPickerOpen(true)}
  onStartPlan={() => navigate('/program-selector')}
/>
```

The `HeroNoPlan` component itself uses `onStartCustom` as the handler for its "Start Custom Workout" button — no changes needed inside `HeroNoPlan`.

- [ ] **Step 4: Replace the bottom "Start Custom Workout" button**

Find:
```jsx
{/* Start Custom Workout — outline button, 36px below volume */}
<div className="px-4 mt-9">
  <PrimaryButton variant="outline" onClick={() => navigate('/workout', { state: { mode: 'custom' } })}>
    Start Custom Workout
  </PrimaryButton>
</div>
```

Replace with:
```jsx
{/* My Workouts + Build Workout — 36px below volume */}
<div className="px-4 mt-9 flex flex-col gap-3">
  <PrimaryButton onClick={() => setPickerOpen(true)}>
    My Workouts
  </PrimaryButton>
  <PrimaryButton variant="outline" onClick={() => navigate('/workout', { state: { mode: 'builder' } })}>
    Build Workout
  </PrimaryButton>
</div>
```

- [ ] **Step 5: Render TemplatePickerSheet**

Find the closing `</div>` at the very end of the HomeScreen return (before the final `}`). Add the sheet just before it:

```jsx
      <TemplatePickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 6: Verify the full flow in dev server**

Run: `npm run dev` from `/Users/jasonschmitt/strength-tracker`

Test the golden paths:
1. **My Workouts (no templates):** Tap "My Workouts" → picker opens → "No saved workouts yet" empty state → "Start Empty Workout" navigates to custom mode workout
2. **Build Workout:** Tap "Build Workout" → WorkoutScreen in builder mode → add exercises → enter name → "Save Template" saves and returns home
3. **My Workouts (with template):** After saving one, tap "My Workouts" → template appears → tap it → WorkoutScreen in template mode (existing behavior)
4. **HeroNoPlan:** When no program, "Start Custom Workout" opens the picker (same as "My Workouts")

- [ ] **Step 7: Commit**

```bash
cd /Users/jasonschmitt/strength-tracker
git add src/components/home/HomeScreen.jsx
git commit -m "feat: add My Workouts picker and Build Workout entry points on HomeScreen"
```

---

## Files Changed

| File | Changes |
|---|---|
| `src/components/workout/SetRow.jsx` | `hideComplete` prop — renders spacer instead of checkmark button |
| `src/components/workout/ExerciseBlock.jsx` | `isBuilderMode` prop — passed as `hideComplete` to SetRow |
| `src/components/workout/TemplatePickerSheet.jsx` | New — template list sheet with start-empty footer |
| `src/components/workout/WorkoutScreen.jsx` | `builder` mode: no timer display, `isBuilderMode` to ExerciseBlocks, save-template bottom UI, discard nav |
| `src/components/home/HomeScreen.jsx` | "My Workouts" (opens picker) + "Build Workout" (builder mode) replace single custom button |
