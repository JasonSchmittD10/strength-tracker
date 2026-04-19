# Exercise Info Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline coaching-cues toggle in ExerciseBlock with a slide-up info drawer opened by tapping the exercise name.

**Architecture:** A new `ExerciseInfoSheet` component uses the existing `SlideUpSheet` to display exercise info (pattern, muscles, cues, notes) from `EXERCISE_LIBRARY`. `ExerciseBlock` wires the exercise name as a tap target, removes the inline cues toggle, and renders the new sheet.

**Tech Stack:** React (hooks), Tailwind CSS (project design tokens), Lucide React icons, `SlideUpSheet` shared component, `EXERCISE_LIBRARY` static data.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/workout/ExerciseInfoSheet.jsx` | Create | Slide-up drawer rendering exercise pattern, muscles, cues, notes |
| `src/components/workout/ExerciseBlock.jsx` | Modify | Wire name tap; add `infoOpen` state; remove `cuesOpen` state and inline cues; render `ExerciseInfoSheet` |

---

### Task 1: Create ExerciseInfoSheet

**Files:**
- Create: `src/components/workout/ExerciseInfoSheet.jsx`

**Context:** The app uses a shared `SlideUpSheet` component at `src/components/shared/SlideUpSheet.jsx`. Its signature is:
```jsx
<SlideUpSheet open={bool} onClose={fn} title={string} heightClass="h-[70vh]" footer={node}>
  {children}
</SlideUpSheet>
```
Exercise data lives in `EXERCISE_LIBRARY` (imported from `@/lib/exercises`). Each entry has shape:
```js
{
  muscles: { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'] },
  pattern: 'Horizontal Push',
  cues: ['Retract shoulder blades...', ...],
  notes: 'Primary strength marker...'
}
```
Not all exercises have all fields — guard each one before rendering.

Design tokens to use: `text-text-muted`, `text-text-primary`, `text-text-secondary`, `border-accent/40`.

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react'
import { EXERCISE_LIBRARY } from '@/lib/exercises'
import SlideUpSheet from '@/components/shared/SlideUpSheet'

export default function ExerciseInfoSheet({ open, onClose, exerciseName, initialTab = 'info' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const info = EXERCISE_LIBRARY[exerciseName] || {}
  const hasPattern = !!info.pattern
  const hasMuscles = !!info.muscles
  const hasCues = info.cues?.length > 0
  const hasNotes = !!info.notes
  const hasContent = hasPattern || hasMuscles || hasCues || hasNotes

  return (
    <SlideUpSheet open={open} onClose={onClose} title={exerciseName}>
      {!hasContent ? (
        <p className="text-text-muted text-sm">No info available for this exercise.</p>
      ) : (
        <div className="space-y-5">
          {(hasPattern || hasMuscles) && (
            <div className="space-y-3">
              {hasPattern && (
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Movement Pattern</div>
                  <div className="text-sm text-text-primary">{info.pattern}</div>
                </div>
              )}
              {hasMuscles && (
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Muscles</div>
                  {info.muscles.primary?.length > 0 && (
                    <div className="text-sm text-text-primary">Primary: {info.muscles.primary.join(', ')}</div>
                  )}
                  {info.muscles.secondary?.length > 0 && (
                    <div className="text-sm text-text-secondary">Secondary: {info.muscles.secondary.join(', ')}</div>
                  )}
                </div>
              )}
            </div>
          )}
          {hasCues && (
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Coaching Cues</div>
              <ul className="space-y-2">
                {info.cues.map((cue, i) => (
                  <li key={i} className="text-sm text-text-secondary pl-3 border-l-2 border-accent/40">{cue}</li>
                ))}
              </ul>
            </div>
          )}
          {hasNotes && (
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Notes</div>
              <p className="text-sm text-text-secondary">{info.notes}</p>
            </div>
          )}
        </div>
      )}
    </SlideUpSheet>
  )
}
```

- [ ] **Step 2: Start the dev server and verify the component exists without errors**

Run: `npm run dev` (from `/Users/jasonschmitt/strength-tracker`)

Expected: Dev server starts at `http://localhost:5173` with no compile errors. The component is not yet wired up — no visual change needed at this step.

- [ ] **Step 3: Commit**

```bash
git add src/components/workout/ExerciseInfoSheet.jsx
git commit -m "feat: add ExerciseInfoSheet slide-up drawer"
```

---

### Task 2: Update ExerciseBlock to use ExerciseInfoSheet

**Files:**
- Modify: `src/components/workout/ExerciseBlock.jsx`

**Context:** The current file is at `src/components/workout/ExerciseBlock.jsx`. Key sections to change:

**Current imports (top of file):**
```jsx
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Clock, Check, Trash2 } from 'lucide-react'
import SetRow from './SetRow'
import { EXERCISE_LIBRARY } from '@/lib/exercises'
import ExerciseHistorySheet from './ExerciseHistorySheet'
```

**Current state declarations (inside component):**
```jsx
const [cuesOpen, setCuesOpen] = useState(false)
const [historyOpen, setHistoryOpen] = useState(false)
const [collapsed, setCollapsed] = useState(false)
```

**Current exercise name div (inside header):**
```jsx
<div className="font-bold text-text-primary text-base">{exercise.name}</div>
```

**Current cues toggle section (inside `{!collapsed && (...)}`):**
```jsx
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
```

**Current sheet renders (at bottom, outside `{!collapsed && (...)}}`):**
```jsx
<ExerciseHistorySheet
  open={historyOpen}
  onClose={() => setHistoryOpen(false)}
  exerciseName={exercise.name}
/>
```

- [ ] **Step 1: Update imports**

Replace the current import block with:
```jsx
import { useState, useEffect } from 'react'
import { Clock, Check, Trash2 } from 'lucide-react'
import SetRow from './SetRow'
import { EXERCISE_LIBRARY } from '@/lib/exercises'
import ExerciseHistorySheet from './ExerciseHistorySheet'
import ExerciseInfoSheet from './ExerciseInfoSheet'
```

(`ChevronDown` and `ChevronUp` are removed — they were only used by the cues toggle.)

- [ ] **Step 2: Update state declarations**

Replace:
```jsx
const [cuesOpen, setCuesOpen] = useState(false)
const [historyOpen, setHistoryOpen] = useState(false)
const [collapsed, setCollapsed] = useState(false)
```

With:
```jsx
const [infoOpen, setInfoOpen] = useState(false)
const [historyOpen, setHistoryOpen] = useState(false)
const [collapsed, setCollapsed] = useState(false)
```

- [ ] **Step 3: Make the exercise name tappable**

Replace:
```jsx
<div className="font-bold text-text-primary text-base">{exercise.name}</div>
```

With:
```jsx
<div
  className="font-bold text-text-primary text-base cursor-pointer hover:text-accent transition-colors"
  onClick={e => { e.stopPropagation(); setInfoOpen(true) }}
>
  {exercise.name}
</div>
```

`e.stopPropagation()` is required — the parent header div has an `onClick` for collapse toggle. Without it, tapping the name would both open the drawer and toggle collapse.

- [ ] **Step 4: Remove the inline cues toggle section**

Delete the entire block:
```jsx
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
```

Nothing replaces it — that space becomes part of the tile body directly preceding the column headers.

- [ ] **Step 5: Add ExerciseInfoSheet render**

After the existing `<ExerciseHistorySheet ... />` at the bottom of the component (still inside the outer `<div>`), add:

```jsx
<ExerciseInfoSheet
  open={infoOpen}
  onClose={() => setInfoOpen(false)}
  exerciseName={exercise.name}
/>
```

The bottom of the component should now look like:
```jsx
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

- [ ] **Step 6: Verify in the dev server**

1. Open an active workout (program session or custom)
2. Tap an exercise name (e.g. "Barbell Bench Press") — the info drawer should slide up showing Movement Pattern, Muscles, Coaching Cues, Notes
3. Tap the backdrop or ✕ — drawer closes
4. Tap the exercise name again, then drag the handle down — drawer dismisses
5. Tap an exercise that has no `EXERCISE_LIBRARY` entry — drawer shows "No info available for this exercise."
6. Tap the clock icon — history sheet opens (unchanged)
7. Tap anywhere in the header outside the name — tile collapses (unchanged)

Expected: all 7 behaviors work. No "Coaching cues" toggle visible anywhere in the tile.

- [ ] **Step 7: Commit**

```bash
git add src/components/workout/ExerciseBlock.jsx
git commit -m "feat: open exercise info drawer on name tap, remove inline cues toggle"
```

---

## Files Changed

| File | Changes |
|---|---|
| `src/components/workout/ExerciseInfoSheet.jsx` | New component — slide-up drawer with pattern, muscles, cues, notes |
| `src/components/workout/ExerciseBlock.jsx` | Add `infoOpen` state; name → tappable; remove `cuesOpen` + cues toggle; add `ExerciseInfoSheet` render; remove `ChevronDown`/`ChevronUp` imports |
