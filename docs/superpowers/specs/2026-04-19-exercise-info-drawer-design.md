# Exercise Info Drawer — Design Spec

**Date:** 2026-04-19
**Scope:** Group B — replace inline coaching-cues dropdown with a slide-up drawer opened by tapping the exercise name. No schema changes, no new dependencies.

---

## Goal

Tapping the exercise title in a workout tile opens a slide-up info drawer. The drawer shows the exercise's movement pattern, muscles, coaching cues, and notes. The inline "Coaching cues" toggle inside the tile is removed. The drawer is architected to grow tabs (History, Notes, PRs) in the future without changes to `ExerciseBlock`.

---

## Tap Target

The exercise name `<div>` in the `ExerciseBlock` header becomes tappable:

```jsx
<div
  className="font-bold text-text-primary text-base cursor-pointer hover:text-accent transition-colors"
  onClick={e => { e.stopPropagation(); setInfoOpen(true) }}
>
  {exercise.name}
</div>
```

`e.stopPropagation()` prevents the header's collapse toggle from firing simultaneously.

The rest of the header (primary muscle label, sets×reps line, clock icon, trash icon) is unaffected.

---

## ExerciseInfoSheet Component

**File:** `src/components/workout/ExerciseInfoSheet.jsx`

Uses `SlideUpSheet` (existing shared component at `src/components/shared/SlideUpSheet.jsx`).

### Props

| Prop | Type | Description |
|---|---|---|
| `open` | bool | Controls sheet visibility |
| `onClose` | fn | Called on backdrop tap or ✕ |
| `exerciseName` | string | Looked up in `EXERCISE_LIBRARY` |
| `initialTab` | string | Defaults `'info'` — reserved for future tab expansion |

### Content (now)

The sheet renders one section: the "Info" tab content.

```
[Title: exercise name]

Movement Pattern
  Horizontal Push

Muscles
  Primary: Chest
  Secondary: Front Delts, Triceps

Coaching Cues
  • Retract and depress shoulder blades before unracking
  • Bar path: slight arc from lower chest to over shoulders
  • Drive feet into floor, maintain arch
  • Elbows ~45–60° from torso — not flared, not tucked

Notes
  Primary strength marker for horizontal push. Keep touch point at
  lower chest, not mid-sternum.
```

If an exercise has no `EXERCISE_LIBRARY` entry, the sheet shows: `"No info available for this exercise."`.

### Architecture for future tabs

`ExerciseInfoSheet` internally tracks `activeTab` state (defaults to `initialTab`). When tabs are added, a tab bar renders at the top of the scroll area. The `ExerciseBlock` only needs to pass `exerciseName` — no new props required to add tabs.

```js
const [activeTab, setActiveTab] = useState(initialTab)
```

---

## ExerciseBlock Changes

### Add

- `infoOpen` state (boolean, defaults `false`)
- Exercise name tap handler (see above)
- `<ExerciseInfoSheet open={infoOpen} onClose={() => setInfoOpen(false)} exerciseName={exercise.name} />`

### Remove

- `cuesOpen` state
- `setCuesOpen` setter
- The "Coaching cues" toggle button and its conditional `<ul>` render
- `ChevronDown` and `ChevronUp` imports (no longer used after cues removal)

### Clock button stays

`ExerciseHistorySheet` and its clock trigger are unchanged. The clock button will be removed in a future iteration when History becomes a tab inside `ExerciseInfoSheet`.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/workout/ExerciseInfoSheet.jsx` | New — slide-up drawer with exercise info |
| `src/components/workout/ExerciseBlock.jsx` | Wire name tap; add `infoOpen` state; remove inline cues |

---

## Out of Scope

- Tab bar UI (History, Notes, PRs tabs) — future iteration
- Removing the clock/history button — future iteration when History tab is added
- Editing exercise notes — read-only for now
- Any data fetching — all content comes from `EXERCISE_LIBRARY` (static)
