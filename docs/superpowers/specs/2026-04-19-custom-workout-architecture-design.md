# Custom Workout Architecture Rework — Design Spec

**Date:** 2026-04-19
**Scope:** Group C — introduce a template picker and a dedicated builder mode so custom workouts split cleanly into Templates (saved blueprints) and Sessions (active workout instances). No schema changes. No new dependencies.

---

## Background

The `workout_templates` table and all data hooks (`useWorkoutTemplates`, `useSaveTemplate`, `useDeleteTemplate`) already exist. `WorkoutScreen` already handles `mode: 'template'`. What's missing is UI: a way to pick a saved template before starting, and a way to build a template without going through a full workout.

---

## Home Screen Changes

**Current:** One "Start Custom Workout" outline button navigates directly to `{ mode: 'custom' }`.

**New:** Two buttons replace it:

```
[ My Workouts ]       ← opens TemplatePickerSheet (slide-up)
[ Build Workout ]     ← navigates to /workout with { mode: 'builder' }
```

The `HeroNoPlan` component also has a "Start Custom Workout" button — this becomes "My Workouts" and opens the picker sheet the same way.

Button styles:
- "My Workouts" — `PrimaryButton` (accent fill, same as current outline button but filled)
- "Build Workout" — `PrimaryButton variant="outline"`

Both buttons are stacked vertically with `gap-3`, matching the existing `HeroNoPlan` button layout.

---

## TemplatePickerSheet

**File:** `src/components/workout/TemplatePickerSheet.jsx`

Uses `SlideUpSheet` with `title="My Workouts"`.

### Data

Loads templates with `useWorkoutTemplates()`. Each template row in Supabase has:
```js
{ id, name, exercises: [{ name, sets, reps, rest, restLabel }], created_at }
```

### Template list item

Each template renders as a tappable row:
```
[Template Name]          [exercise count] exercises
[created_at date]
```

Tapping navigates: `navigate('/workout', { state: { mode: 'template', template } })`

### Empty state

When `templates.length === 0`:
```
No saved workouts yet.
Tap "Build Workout" to create one.
```

### Footer

Always present at the bottom of the sheet (uses `SlideUpSheet`'s `footer` prop):

```jsx
<button onClick={() => { onClose(); navigate('/workout', { state: { mode: 'custom' } }) }}>
  Start Empty Workout
</button>
```

Styled as a secondary text link (`text-text-muted text-sm text-center w-full`).

### Props

```js
{ open: bool, onClose: fn }
```

`navigate` comes from `useNavigate()` inside the component.

---

## Builder Mode in WorkoutScreen

### Detecting builder mode

```js
const mode = state?.mode || (state?.session ? 'program' : 'custom')
```

`mode === 'builder'` when navigated with `{ mode: 'builder' }`.

### isCustomMode expansion

```js
const isCustomMode = mode === 'custom' || mode === 'template' || mode === 'builder'
```

This gives builder access to: `onRemove`, `onRemoveSet`, add exercise button, superset button, `handleRemoveExercise`.

### Timer display

The elapsed timer in the header is hidden in builder mode — the header just shows "Build Workout" as the title with no timer or pause button. The `useElapsedTimer` hook still runs (simplest approach — no rewiring needed).

Header title:
```js
mode === 'builder' ? 'Build Workout' : mode === 'program' ? session.name : 'Custom Workout'
```

Pause button and elapsed display: hidden when `mode === 'builder'`.

### Set completion

In builder mode, `ExerciseBlock` receives `isProgramMode={false}` (same as custom — sets are editable) but the checkmark button in `SetRow` should be hidden. This is achieved by passing a new `isBuilderMode` prop to `ExerciseBlock`, which passes `hideComplete` to `SetRow`.

**`SetRow.jsx`** — add `hideComplete = false` prop. When true, render `null` instead of the checkmark/pencil button:
```jsx
{!hideComplete && (
  <button ...>
    {completed ? <Pencil size={14} /> : <Check size={16} />}
  </button>
)}
```

**`ExerciseBlock.jsx`** — add `isBuilderMode = false` prop. Pass `hideComplete={isBuilderMode}` to each `SetRow`.

**`WorkoutScreen.jsx`** — pass `isBuilderMode={mode === 'builder'}` to each `ExerciseBlock`.

### Finish / Save button

In builder mode, the "Finish Workout" button is replaced by "Save Template".

Tapping "Save Template" opens an inline name prompt (same `<input>` pattern as `WorkoutSummary`) and calls `useSaveTemplate`, then navigates to `/home`.

This is implemented inline in `WorkoutScreen` for builder mode — no `WorkoutSummary` sheet involved. A small save UI renders in place of the "Finish Workout" / "Cancel Workout" block:

```jsx
{mode === 'builder' ? (
  <div className="pt-4 mt-2 border-t border-bg-tertiary space-y-3">
    <input
      value={builderName}
      onChange={e => setBuilderName(e.target.value)}
      placeholder="e.g. Upper Body Power"
      className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent"
    />
    {builderSaveError && <p className="text-xs text-danger">{builderSaveError}</p>}
    <PrimaryButton onClick={handleSaveBuilder} disabled={builderSaving || activeExercises.length === 0}>
      {builderSaving ? 'Saving…' : 'Save Template'}
    </PrimaryButton>
    <button onClick={() => navigate(-1)} className="w-full text-text-muted text-sm font-medium py-2">
      Discard
    </button>
  </div>
) : (
  /* existing Finish / Cancel block */
)}
```

State needed in WorkoutScreen:
```js
const [builderName, setBuilderName] = useState('')
const [builderSaving, setBuilderSaving] = useState(false)
const [builderSaveError, setBuilderSaveError] = useState(null)
```

`handleSaveBuilder`:
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

### Back navigation in builder mode

`handleBack` in builder mode: if exercises exist, show a "Discard workout?" confirm dialog (same `confirmBack` pattern). If no exercises, navigate back directly.

The existing `useBlocker` / `confirmBack` logic already covers this since `hasCompletedSets` will be false, but builder should block back if there are unsaved exercises. Change the blocker condition:

```js
const shouldBlockNav = mode === 'builder'
  ? activeExercises.length > 0
  : hasCompletedSets
```

---

## Files Changed

| File | Change |
|---|---|
| `src/components/workout/TemplatePickerSheet.jsx` | New — slide-up template list with start-empty footer |
| `src/components/home/HomeScreen.jsx` | Replace single custom button with "My Workouts" + "Build Workout" |
| `src/components/workout/WorkoutScreen.jsx` | Add `builder` mode: hidden timer/pause, `isBuilderMode` prop, save template flow, nav blocker update |
| `src/components/workout/ExerciseBlock.jsx` | Add `isBuilderMode` prop; pass `hideComplete` to `SetRow` |
| `src/components/workout/SetRow.jsx` | Add `hideComplete` prop; conditionally hide checkmark button |

---

## Out of Scope

- Editing a template outside of re-running it (edit in place) — future iteration
- Reordering exercises in builder — future iteration
- Template categories or tags — future iteration
- Deleting templates from the picker — future iteration (add long-press or swipe)
