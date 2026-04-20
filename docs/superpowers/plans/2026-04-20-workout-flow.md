# Workout Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the active workout screen and post-workout summary to match the Figma design (nodes 116:4832, 118:9765, 118:8604).

**Architecture:** Update four existing components in-place — ExerciseBlock, SetRow, WorkoutScreen, WorkoutSummary. WorkoutSummary converts from a SlideUpSheet into a full-screen overlay controlled by `summaryOpen` state in WorkoutScreen. No new routes or files.

**Tech Stack:** React 18.2, TailwindCSS 3.4, lucide-react icons, font-judge (F37 Judge Trial), font-commons (TT Commons)

---

## File Map

| File | Change |
|------|--------|
| `src/components/workout/ExerciseBlock.jsx` | Restyle card, name/meta, icons, Add Set button; remove standalone column-header row |
| `src/components/workout/SetRow.jsx` | Restyle inputs, set number, check button; add per-row labels on first row only via `showLabels` prop |
| `src/components/workout/WorkoutScreen.jsx` | Restyle header (icon pill + centered title + timer); restyle footer (Finish/Cancel/Add Exercise) |
| `src/components/workout/WorkoutSummary.jsx` | Convert from SlideUpSheet wrapper to full-screen fixed overlay; new stats layout + "What You Did" section |

---

## Task 1: Restyle ExerciseBlock

**Files:**
- Modify: `src/components/workout/ExerciseBlock.jsx`

### Steps

- [ ] **Step 1: Update the card container and header**

Replace the outer `div` and header section. Change from `bg-bg-card rounded-2xl border border-bg-tertiary p-4` to the new card style, update exercise name and meta typography, and update icon buttons.

New `ExerciseBlock.jsx` (full replacement):

```jsx
// src/components/workout/ExerciseBlock.jsx
import { useState, useEffect } from 'react'
import { Clock, Trash2 } from 'lucide-react'
import SetRow from './SetRow'
import { EXERCISE_LIBRARY } from '@/lib/exercises'
import ExerciseHistorySheet from './ExerciseHistorySheet'
import ExerciseInfoSheet from './ExerciseInfoSheet'
import { Check } from 'lucide-react'

export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete, isProgramMode = false, onRemoveSet, isInSuperset = false, isSelected = false, onSelect, onAddSet, isActive = false, onRemove, isBuilderMode = false }) {
  const [infoOpen, setInfoOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const info = EXERCISE_LIBRARY[exercise.name] || {}
  const primaryMuscle = info.muscles?.primary?.[0] || ''
  const inputType = info.inputType ?? 'reps'

  useEffect(() => {
    if (sets.length > 0 && sets.every(s => s.completed)) {
      setCollapsed(true)
    }
  }, [sets])

  function updateSet(setIdx, updated) {
    let next = sets.map((s, i) => i === setIdx ? updated : s)
    if (updated.weight !== sets[setIdx]?.weight) {
      next = next.map((s, i) =>
        i > setIdx && !s.completed ? { ...s, weight: updated.weight } : s
      )
    }
    onChange(next)
  }

  function addSet() {
    if (onAddSet) {
      onAddSet()
    } else {
      const last = sets[sets.length - 1] || {}
      onChange([...sets, { weight: last.weight || '', reps: last.reps || '', rpe: '', completed: false }])
    }
  }

  const firstUncompletedIdx = isActive ? sets.findIndex(s => !s.completed) : -1

  const metaParts = []
  if (primaryMuscle) metaParts.push(primaryMuscle)
  if (exercise.sets && exercise.reps) metaParts.push(`${exercise.sets}×${exercise.reps} ${inputType === 'time' ? 'sec' : 'reps'}`)
  if (exercise.tempo) metaParts.push(`Tempo ${exercise.tempo}`)

  return (
    <div className={`bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px] ${isInSuperset ? 'mb-0' : 'mb-[12px]'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-[16px]">
        <div className="flex items-center gap-[10px] flex-1 min-w-0">
          {onSelect && (
            <button
              onClick={onSelect}
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-accent border-accent' : 'border-text-muted'}`}
            >
              {isSelected && <Check size={10} className="text-black" />}
            </button>
          )}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setCollapsed(c => !c)}
          >
            <div className="flex items-center gap-[8px]">
              <span
                className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-snug"
                onClick={e => { e.stopPropagation(); setInfoOpen(true) }}
              >
                {exercise.name}
              </span>
              {collapsed && sets.every(s => s.completed) && (
                <span className="text-xs text-success font-semibold">Done</span>
              )}
            </div>
            {metaParts.length > 0 && (
              <div className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-snug mt-[2px]">
                {metaParts.join(' · ')}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-[16px] flex-shrink-0 ml-[12px]">
          <button
            onClick={e => { e.stopPropagation(); setHistoryOpen(true) }}
            className="text-[#8b8b8b] hover:text-accent transition-colors"
          >
            <Clock size={16} />
          </button>
          {onRemove && (
            <button
              onClick={e => { e.stopPropagation(); onRemove() }}
              className="text-[#8b8b8b] hover:text-danger transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
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
              hideComplete={isBuilderMode}
              inputType={inputType}
              showLabels={i === 0}
            />
          ))}

          {!isProgramMode && (
            <button
              onClick={addSet}
              className="w-full mt-[12px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[4px] px-[12px] py-[10px] font-commons font-bold text-[14px] text-white"
            >
              + Add Set
            </button>
          )}
        </>
      )}

      <ExerciseHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        exerciseName={exercise.name}
      />

      <ExerciseInfoSheet
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        exerciseName={exercise.name}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify preview**

Open the preview server. Navigate to a workout. Confirm:
- Card background is dark with subtle border, rounded-[8px]
- Exercise name is larger (18px) with semibold weight
- Clock + trash icons are right-aligned at `gap-[16px]`
- Add Set button is a full-width bordered pill (not a text link)

- [ ] **Step 3: Commit**

```bash
git add src/components/workout/ExerciseBlock.jsx
git commit -m "feat: restyle ExerciseBlock to match Figma design"
```

---

## Task 2: Restyle SetRow

**Files:**
- Modify: `src/components/workout/SetRow.jsx`

Key changes:
- Set number: larger (`text-[18px] font-semibold text-[#9d9d9d]`), fixed `w-[24px]`
- Inputs: dark bg `bg-[#0a0a0a]`, border `border-[rgba(255,255,255,0.1)]`, `rounded-[4px]`, larger text `text-[18px] text-white/60`, padding `py-[12px] px-[10px]`
- Labels above each input in the first row only (new `showLabels` prop)
- Check button: `bg-white/10 rounded-[4px] size-[44px]` square (not round), check icon green when completed
- Remove RPE select → keep as input field to match input styling

### Steps

- [ ] **Step 1: Rewrite SetRow**

Full replacement of `src/components/workout/SetRow.jsx`:

```jsx
// src/components/workout/SetRow.jsx
import { useState, useRef } from 'react'
import { Check, Pencil } from 'lucide-react'
import { useUnitPreference } from '@/hooks/useProfile'

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]
const SWIPE_THRESHOLD = 60
const REMOVE_ZONE_WIDTH = 80

export default function SetRow({ setNumber, set, onChange, onComplete, onRemove, highlighted = false, hideComplete = false, inputType = 'reps', showLabels = false }) {
  const { weight = '', reps = '', rpe = '', completed = false } = set
  const unit = useUnitPreference()
  const [swipeX, setSwipeX] = useState(0)
  const touchStartXRef = useRef(null)

  function handleComplete() {
    if (!completed) onComplete()
    else onChange({ ...set, completed: false, editing: true })
  }

  function handleTouchStart(e) {
    if (!onRemove) return
    touchStartXRef.current = e.touches[0].clientX
  }

  function handleTouchMove(e) {
    if (!onRemove || touchStartXRef.current === null) return
    const dx = touchStartXRef.current - e.touches[0].clientX
    if (swipeX > 0 && dx < -10) {
      setSwipeX(0)
      touchStartXRef.current = null
      return
    }
    if (dx > 0) setSwipeX(Math.min(dx, REMOVE_ZONE_WIDTH))
  }

  function handleTouchEnd() {
    if (!onRemove) return
    setSwipeX(prev => prev >= SWIPE_THRESHOLD ? REMOVE_ZONE_WIDTH : 0)
    touchStartXRef.current = null
  }

  function resetSwipe() {
    setSwipeX(0)
  }

  const inputClass = `w-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-[4px] py-[12px] px-[10px] font-commons text-[18px] text-white/60 text-center focus:outline-none focus:border-accent min-h-[44px] ${completed ? 'pointer-events-none opacity-50' : ''}`

  return (
    <div className={`relative overflow-hidden rounded-[4px] mb-[8px] ${highlighted ? 'ring-1 ring-accent/60' : ''}`}>
      {onRemove && (
        <div
          className="absolute right-0 top-0 bottom-0 bg-danger flex items-center justify-center"
          style={{ width: REMOVE_ZONE_WIDTH }}
          onClick={onRemove}
        >
          <span className="text-white text-xs font-semibold">Remove</span>
        </div>
      )}
      <div
        style={{
          transform: `translateX(-${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.2s ease' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swipeX > 0 ? resetSwipe : undefined}
        className="flex items-end gap-[8px]"
      >
        {/* Set number */}
        <div className="flex flex-col items-center justify-end flex-shrink-0 w-[24px]">
          {showLabels && <span className="font-commons text-[14px] text-[#8b8b8b] mb-[8px] invisible">·</span>}
          <span className="font-commons font-semibold text-[18px] text-[#9d9d9d] leading-none pb-[13px]">{setNumber}</span>
        </div>

        {/* Weight */}
        <div className="flex-1 flex flex-col gap-[4px]">
          {showLabels && <span className="font-commons text-[14px] text-[#8b8b8b] text-center">Weight</span>}
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={e => onChange({ ...set, weight: e.target.value })}
            placeholder={unit}
            readOnly={completed}
            className={inputClass}
          />
        </div>

        {/* Reps / Time */}
        <div className="flex-1 flex flex-col gap-[4px]">
          {showLabels && <span className="font-commons text-[14px] text-[#8b8b8b] text-center">{inputType === 'time' ? 'Sec' : 'Reps'}</span>}
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
            className={inputClass}
          />
        </div>

        {/* RPE */}
        <div className="flex-1 flex flex-col gap-[4px]">
          {showLabels && <span className="font-commons text-[14px] text-[#8b8b8b] text-center">RPE</span>}
          <select
            value={rpe}
            onChange={e => onChange({ ...set, rpe: e.target.value })}
            disabled={completed}
            className={`w-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-[4px] py-[12px] px-[4px] font-commons text-[18px] text-white/60 text-center focus:outline-none focus:border-accent min-h-[44px] ${completed ? 'pointer-events-none opacity-50' : ''}`}
          >
            <option value="">RPE</option>
            {RPE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* Check / Done button */}
        {!hideComplete ? (
          <button
            onClick={handleComplete}
            className={`w-[44px] h-[44px] rounded-[4px] flex items-center justify-center flex-shrink-0 transition-colors ${
              completed ? 'bg-accent' : 'bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            {completed ? <Pencil size={16} className="text-black" /> : <Check size={16} className="text-white/60" />}
          </button>
        ) : (
          <div className="w-[44px] flex-shrink-0" />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify preview**

Navigate to an active workout. Check first set row has labels above inputs (Weight / Reps / RPE), subsequent rows have no labels. Inputs are dark with border. Check button is a square pill. Tapping check turns it accent-colored.

- [ ] **Step 3: Commit**

```bash
git add src/components/workout/SetRow.jsx
git commit -m "feat: restyle SetRow inputs and check button to match Figma"
```

---

## Task 3: Restyle WorkoutScreen header

**Files:**
- Modify: `src/components/workout/WorkoutScreen.jsx` (header section only, lines 477–510)

Key changes:
- Replace current header with: icon pill (left) + centered title stack + timer pill (right)
- Icon: `Dumbbell` in `bg-white/10 rounded-[4px] p-[6px]`  
- Title: "Workout" in `font-judge text-[16px]` + subtitle in `font-commons text-[12px] text-[#8b8b8b]`
- Timer: `font-commons text-[16px] text-[#8b8b8b] tracking-[0.5px]` + pause icon in same pill style
- Remove the existing tag badge and program context line from the header

### Steps

- [ ] **Step 1: Add Dumbbell to imports and update header JSX**

At the top of WorkoutScreen.jsx, the import line already has `{ Plus, Pause, Play }` from lucide-react. Add `Dumbbell`:

```jsx
import { Plus, Pause, Play, Dumbbell } from 'lucide-react'
```

Replace the static header block (lines 476–510) with:

```jsx
{/* Static header */}
<div className="flex-shrink-0 px-[16px] py-[12px] flex items-center justify-between bg-bg-primary">
  {/* Left: icon pill */}
  <div className="bg-[rgba(255,255,255,0.1)] rounded-[4px] p-[6px] flex-shrink-0">
    <Dumbbell size={16} className="text-white" />
  </div>

  {/* Center: title + subtitle */}
  <div className="flex flex-col items-center flex-1 mx-[12px]">
    <span className="font-judge text-[16px] text-white leading-none">Workout</span>
    <span className="font-commons text-[12px] text-[#8b8b8b] leading-none mt-[2px] truncate max-w-[180px]">
      {mode === 'program'
        ? session.name
        : mode === 'builder'
          ? 'Build Workout'
          : 'Custom Workout'}
    </span>
  </div>

  {/* Right: timer + pause pill */}
  {mode !== 'builder' && (
    <div className="flex items-center gap-[8px] flex-shrink-0">
      <span className="font-commons text-[16px] text-[#8b8b8b] tracking-[0.5px]">
        {isPaused ? 'Paused' : formatElapsed(elapsed)}
      </span>
      <button
        onClick={handleTogglePause}
        className="bg-[rgba(255,255,255,0.1)] rounded-[4px] p-[6px] flex items-center justify-center"
        aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
      >
        {isPaused ? <Play size={16} className="text-white" /> : <Pause size={16} className="text-white" />}
      </button>
    </div>
  )}
</div>
```

- [ ] **Step 2: Verify preview**

Navigate to a workout. Confirm:
- Three-column header: dumbbell icon left, "Workout" + subtitle center, timer + pause right
- No tag badge or program context line in header
- Pause button is square pill matching dumbbell icon style

- [ ] **Step 3: Commit**

```bash
git add src/components/workout/WorkoutScreen.jsx
git commit -m "feat: restyle WorkoutScreen header to match Figma"
```

---

## Task 4: Restyle WorkoutScreen footer buttons

**Files:**
- Modify: `src/components/workout/WorkoutScreen.jsx` (footer section, lines 580–618 and 622–658)

Key changes:
- Finish Workout: `bg-accent h-[46px] rounded-[6px] font-commons font-bold text-[18px] text-black w-full`
- Cancel: `font-commons font-bold text-[18px] text-[#c02727] w-full text-center py-[12px]`
- "Add Exercise" button (custom mode, inline in scroll area): `bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] py-[12px] px-[16px] font-commons font-bold text-[18px] text-white w-full`
- Sticky footer buttons for custom mode keep existing logic but match new style

### Steps

- [ ] **Step 1: Update the scroll-area footer (Finish/Cancel section)**

Replace the `<div className="pt-4 mt-2 border-t border-bg-tertiary">` block (currently lines 581–619) with:

```jsx
{/* Finish / Save — inline at bottom of scroll area */}
<div className="pt-[24px] mt-[8px] flex flex-col gap-[12px]">
  {mode === 'builder' ? (
    <>
      <input
        value={builderName}
        onChange={e => setBuilderName(e.target.value)}
        placeholder="e.g. Upper Body Power"
        className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons text-[18px] text-white placeholder-[#5c5c5c] focus:outline-none focus:border-accent"
      />
      {builderSaveError && <p className="font-commons text-[14px] text-danger">{builderSaveError}</p>}
      <button
        onClick={handleSaveBuilder}
        disabled={builderSaving || activeExercises.length === 0}
        className="w-full h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black disabled:opacity-50"
      >
        {builderSaving ? 'Saving…' : 'Save Template'}
      </button>
      <button
        onClick={() => { allowNavRef.current = true; navigate(-1) }}
        className="w-full font-commons font-bold text-[18px] text-[#c02727] text-center py-[12px]"
      >
        Discard
      </button>
    </>
  ) : (
    <>
      {isCustomMode && activeExercises.length > 0 && (
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] py-[12px] px-[16px] font-commons font-bold text-[18px] text-white"
        >
          + Add Exercise
        </button>
      )}
      <button
        onClick={() => setSummaryOpen(true)}
        className="w-full h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black"
      >
        Finish Workout
      </button>
      <button
        onClick={handleBack}
        className="w-full font-commons font-bold text-[18px] text-[#c02727] text-center py-[12px]"
      >
        Cancel Workout
      </button>
    </>
  )}
</div>
```

- [ ] **Step 2: Remove the old sticky footer for custom mode (lines 622–658)**

The sticky footer that shows "Add Exercise" and "Superset" buttons when custom exercises exist should be removed since Add Exercise is now inline. Keep only the superset selection UI.

Replace the old sticky footer block:

```jsx
{/* Sticky footer (custom mode only — superset selection only) */}
{isCustomMode && activeExercises.length > 0 && isSelectingSuperset && (
  <div className="flex-shrink-0 border-t border-bg-tertiary bg-bg-primary px-4 py-3">
    <div className="flex gap-2">
      <button
        onClick={() => { setIsSelectingSuperset(false); setSelectedExercises(new Set()) }}
        className="flex-1 py-3 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
      >
        Cancel
      </button>
      <button
        onClick={handleAddSuperset}
        disabled={!canAddSuperset}
        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${canAddSuperset ? 'bg-accent text-black' : 'bg-bg-tertiary text-text-muted'}`}
      >
        Add Superset{canAddSuperset && selectedExercises.size >= 2 ? ` (${selectedExercises.size})` : ''}
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 3: Update the empty-state Add Exercise button** (lines ~518–525)

```jsx
{isCustomMode && activeExercises.length === 0 && (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <p className="font-commons text-[16px] text-[#8b8b8b] mb-[24px]">No exercises yet. Add one to get started.</p>
    <button
      onClick={() => setSearchOpen(true)}
      className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] py-[12px] px-[24px] font-commons font-bold text-[18px] text-white"
    >
      + Add Exercise
    </button>
  </div>
)}
```

- [ ] **Step 4: Verify preview**

Navigate to a custom workout. Confirm:
- "Finish Workout" is a solid accent button, full width, h-46px
- "Cancel Workout" is red text, no button background
- "Add Exercise" appears above Finish as a bordered pill
- Empty state shows no emoji, just the text prompt and Add Exercise button

- [ ] **Step 5: Commit**

```bash
git add src/components/workout/WorkoutScreen.jsx
git commit -m "feat: restyle WorkoutScreen footer buttons to match Figma"
```

---

## Task 5: Convert WorkoutSummary to full-screen overlay

**Files:**
- Modify: `src/components/workout/WorkoutSummary.jsx`

Key changes:
- Remove `SlideUpSheet` wrapper
- Render as `fixed inset-0 z-50 bg-bg-primary overflow-y-auto` when `open === true`
- New header: back chevron + "Back" in accent | centered "Workout" font-judge | bookmark icon
- New stats block: big volume number + stats grid tiles
- New "What You Did" section listing each exercise's completed sets
- Footer: Copy Results secondary + "Done — Log Workout" primary accent button
- Custom mode still shows workout name input + save-as-template option

### Steps

- [ ] **Step 1: Rewrite WorkoutSummary.jsx**

Full replacement:

```jsx
import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, Copy, Check, Bookmark } from 'lucide-react'
import { epley, formatDuration, formatVolume, totalVolume } from '@/lib/utils'
import PrimaryButton from '@/components/shared/PrimaryButton'
import { useSessions } from '@/hooks/useSessions'
import { useSaveTemplate } from '@/hooks/useTemplates'
import { useUnitPreference } from '@/hooks/useProfile'
import { normalizeExerciseName } from '@/lib/exercises'

function inferTemplateExercises(exercises) {
  return exercises.map(ex => {
    const completed = ex.sets.filter(s => s.completed)
    const setsCount = completed.length || ex.sets.length
    let reps = ex.reps ?? '8-12'
    if (completed.length > 0) {
      const sorted = [...completed].sort((a, b) => (parseInt(a.reps) || 0) - (parseInt(b.reps) || 0))
      reps = String(sorted[Math.floor(sorted.length / 2)].reps || '8-12')
    }
    return { name: ex.name, sets: setsCount, reps, rest: ex.rest ?? 90, restLabel: ex.restLabel ?? '90 sec' }
  })
}

export default function WorkoutSummary({
  open, onClose, onSave, session, durationSeconds,
  mode = 'program', templateId, templateName,
  externalSaving = false, externalSaveError = null,
}) {
  const { data: allSessions = [] } = useSessions()
  const { mutateAsync: saveTemplate } = useSaveTemplate()
  const unit = useUnitPreference()
  const isCustomMode = mode === 'custom' || mode === 'template'

  const [workoutName, setWorkoutName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) { setWorkoutName(templateName ?? ''); setSaveError(null) }
  }, [open, templateName])

  const { vol, completedSets, exerciseCount } = useMemo(() => {
    if (!open) return { vol: 0, completedSets: 0, exerciseCount: 0 }
    return {
      vol: totalVolume(session.exercises),
      completedSets: session.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0),
      exerciseCount: session.exercises.length,
    }
  }, [open, session.exercises])

  const prs = useMemo(() => {
    if (!open) return []
    return session.exercises.map(ex => {
      const name = normalizeExerciseName(ex.name)
      const currentBest = Math.max(0, ...ex.sets.filter(s => s.completed).map(s => epley(s.weight, s.reps) || 0))
      const historicBest = allSessions.reduce((best, s) => {
        const match = s.exercises?.find(e => normalizeExerciseName(e.name) === name)
        if (!match) return best
        const sessionBest = Math.max(0, ...(match.sets ?? []).map(st => epley(st.weight, st.reps) || 0))
        return Math.max(best, sessionBest)
      }, 0)
      return currentBest > 0 && currentBest > historicBest ? { name: ex.name, e1rm: currentBest } : null
    }).filter(Boolean)
  }, [open, session.exercises, allSessions])

  function copyWorkout() {
    const lines = session.exercises.map(ex => {
      const sets = ex.sets
        .filter(s => s.completed && s.weight && s.reps)
        .map(s => `${s.weight}×${s.reps}`)
        .join(' ')
      return sets ? `${ex.name}\n${sets}` : ex.name
    }).join('\n')
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleSaveWithTemplate() {
    setSaving(true)
    setSaveError(null)
    try {
      const name = workoutName.trim() || 'Custom Workout'
      const exercises = inferTemplateExercises(session.exercises)
      await saveTemplate({ id: templateId, name, exercises })
      await onSave(name)
    } catch (e) {
      setSaveError('Failed to save template. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveWithoutTemplate() {
    if (saving) return
    setSaving(true)
    try { await onSave(null) } finally { setSaving(false) }
  }

  const volK = vol >= 1000 ? (vol / 1000).toFixed(1) : vol

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-[16px] py-[12px]">
        <button
          onClick={onClose}
          className="flex items-center gap-[4px]"
        >
          <ChevronLeft size={16} className="text-accent" />
          <span className="font-commons text-[14px] text-accent">Back</span>
        </button>
        <span className="font-judge text-[16px] text-white">Workout</span>
        <button className="text-[#8b8b8b]">
          <Bookmark size={16} />
        </button>
      </div>

      <div className="px-[16px] pb-[40px]">
        {/* Volume stats */}
        <div className="mt-[24px] mb-[8px]">
          <span className="font-commons text-[14px] text-white/40 tracking-[1px] uppercase">Total Volume</span>
        </div>
        <div className="flex items-end gap-[4px]">
          <span className="font-judge text-[48px] text-white leading-none">{volK}</span>
          {vol >= 1000 && <span className="font-judge text-[32px] text-accent leading-none mb-[2px]">k</span>}
        </div>
        <div className="font-commons text-[14px] text-[#8b8b8b] mt-[4px]">lb lifted</div>

        {/* PR badge */}
        {prs.length > 0 && (
          <div className="inline-flex items-center gap-[6px] mt-[12px] bg-[rgba(19,134,75,0.05)] border border-[rgba(19,134,75,0.15)] rounded-[8px] px-[8px] py-[4px]">
            <span className="font-commons text-[13px] text-[#13864b] font-semibold">
              {prs.length} PR{prs.length > 1 ? 's' : ''} — {prs.map(p => p.name).join(', ')}
            </span>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-[8px] mt-[24px]">
          <StatTile label="SETS" value={completedSets} />
          <StatTile label="DURATION" value={formatDuration(durationSeconds)} />
          <StatTile label="EXERCISES" value={exerciseCount} />
        </div>

        {/* What You Did */}
        <div className="mt-[32px]">
          <span className="font-commons text-[14px] text-white/40 tracking-[1px] uppercase">What You Did</span>
          <div className="mt-[12px] flex flex-col gap-[16px]">
            {session.exercises.map((ex, i) => {
              const doneSets = ex.sets.filter(s => s.completed)
              return (
                <div key={i}>
                  <div className="font-commons font-semibold text-[18px] text-white mb-[8px]">{ex.name}</div>
                  {doneSets.length > 0 ? (
                    <div className="bg-[#181818] rounded-[8px] px-[16px] py-[12px] flex flex-col gap-[8px]">
                      {doneSets.map((s, j) => (
                        <div key={j} className="flex items-center justify-between">
                          <span className="font-commons text-[14px] text-[#8b8b8b]">Set {j + 1}</span>
                          <span className="font-commons text-[14px] text-white">
                            {s.weight ? `${s.weight} ${unit} × ` : ''}{s.reps || s.duration_seconds || '—'}{s.rpe ? ` @ ${s.rpe}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#181818] rounded-[8px] px-[16px] py-[12px]">
                      <span className="font-commons text-[14px] text-[#5c5c5c]">No sets completed</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Custom mode: save-as-template */}
        {isCustomMode && (
          <div className="mt-[32px] flex flex-col gap-[12px]">
            <span className="font-commons text-[14px] text-white/40 tracking-[1px] uppercase">
              {templateId ? 'Update Template' : 'Save as Template'}
            </span>
            <input
              value={workoutName}
              onChange={e => setWorkoutName(e.target.value)}
              placeholder="e.g. Upper Body Power"
              aria-label="Workout template name"
              maxLength={100}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[6px] px-[16px] py-[12px] font-commons text-[18px] text-white placeholder-[#5c5c5c] focus:outline-none focus:border-accent"
            />
            {saveError && <p className="font-commons text-[14px] text-danger">{saveError}</p>}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-[32px] flex flex-col gap-[12px]">
          <button
            onClick={copyWorkout}
            className="w-full flex items-center justify-center gap-[8px] py-[12px] border border-[rgba(255,255,255,0.1)] rounded-[6px] font-commons text-[16px] text-[#8b8b8b]"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Workout Results'}
          </button>

          {externalSaveError && <p className="font-commons text-[14px] text-danger text-center">{externalSaveError}</p>}

          {isCustomMode ? (
            <>
              <button
                onClick={handleSaveWithTemplate}
                disabled={saving}
                className="w-full h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black disabled:opacity-50"
              >
                {saving ? 'Saving…' : templateId ? 'Update Template' : 'Done — Log Workout'}
              </button>
              <button
                onClick={handleSaveWithoutTemplate}
                disabled={saving}
                className="w-full font-commons text-[16px] text-[#8b8b8b] text-center py-[8px] disabled:opacity-50"
              >
                Don't Save Template
              </button>
            </>
          ) : (
            <button
              onClick={() => onSave(null)}
              disabled={externalSaving}
              className="w-full h-[46px] bg-accent rounded-[6px] font-commons font-bold text-[18px] text-black disabled:opacity-50"
            >
              {externalSaving ? 'Saving…' : 'Done — Log Workout'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value }) {
  return (
    <div className="bg-[#181818] rounded-[2px] flex flex-col items-center py-[14px] px-[8px]">
      <span className="font-judge text-[26px] text-white leading-none">{value}</span>
      <span className="font-commons text-[11px] text-[#8b8b8b] mt-[4px] uppercase tracking-[0.5px]">{label}</span>
    </div>
  )
}
```

- [ ] **Step 2: Verify preview**

Tap "Finish Workout" on an active workout. Confirm:
- Full-screen overlay appears (not a bottom sheet)
- Header has back chevron + "Back" in accent + centered "Workout" title + bookmark icon
- Volume shown as large number (with k suffix if ≥ 1000)
- Stats grid shows Sets / Duration / Exercises
- "What You Did" lists each exercise with completed set details
- "Done — Log Workout" button is accent colored

- [ ] **Step 3: Verify "Back" returns to workout**

Tap "Back" — confirm you return to the active workout with sets intact (no data lost).

- [ ] **Step 4: Verify save flow**

Tap "Done — Log Workout" — confirm it saves and navigates to `/history`.

- [ ] **Step 5: Commit**

```bash
git add src/components/workout/WorkoutSummary.jsx
git commit -m "feat: convert WorkoutSummary to full-screen overlay with Figma design"
```

---

## Self-Review

**Spec coverage:**
- ✅ Active screen header (icon + title + timer) — Task 3
- ✅ Exercise card styling — Task 1
- ✅ Set row inputs + labels + check button — Task 2
- ✅ Finish/Cancel/Add Exercise footer — Task 4
- ✅ Summary full-screen with volume stats — Task 5
- ✅ Summary "What You Did" section — Task 5
- ✅ Summary PR badge — Task 5
- ✅ Summary Done button — Task 5
- ✅ Custom mode save-as-template in summary — Task 5

**Placeholder scan:** No TBDs or incomplete steps.

**Type consistency:** `showLabels` prop added in Task 2 (SetRow) and passed correctly in Task 1 (ExerciseBlock). `StatTile` defined and used only in WorkoutSummary.
