# Time-Based Movements — Design Spec

**Date:** 2026-04-19
**Scope:** Group D — add duration input for time-based exercises (planks, holds, wall sits). No schema migration. No new dependencies.

---

## Background

All exercises currently use a reps-based input model. Time-based exercises like planks and dead hangs have no meaningful rep count — they need a duration in seconds. The set data is stored as JSONB in `sessions.data`, so adding a `duration_seconds` field is backwards-compatible.

---

## Identifying Time-Based Exercises

`EXERCISE_LIBRARY` entries gain an optional `inputType: 'time'` field. Absent means `'reps'` (default). New time-based exercises are added to the library:

```js
'Plank': { inputType: 'time', muscles: { primary: ['Core'] }, pattern: 'Isometric', cues: [...], notes: '...' }
'Dead Hang': { inputType: 'time', muscles: { primary: ['Lats', 'Grip'] }, ... }
'Wall Sit': { inputType: 'time', muscles: { primary: ['Quads'] }, ... }
'L-Sit': { inputType: 'time', muscles: { primary: ['Core', 'Hip Flexors'] }, ... }
```

Custom exercises not in the library default to `'reps'` (no change needed).

---

## ExerciseBlock Changes

`ExerciseBlock` reads `inputType` from `EXERCISE_LIBRARY` and:

1. Passes `inputType` to each `<SetRow>`.
2. Changes the column header label: "Reps" → "Sec" when `inputType === 'time'`.
3. Changes the header stat line: `{exercise.sets} × {exercise.reps} reps` → `{exercise.sets} × {exercise.reps} sec` when time-based. If `exercise.reps` is absent, omit the stat line entirely.

---

## SetRow Changes

`SetRow` accepts a new `inputType = 'reps'` prop.

When `inputType === 'time'`:
- The reps `<input>` binds to `set.duration_seconds` instead of `set.reps`.
- `placeholder` is `"sec"` instead of `"reps"`.
- `inputMode` stays `"numeric"`.
- `onChange` writes `{ ...set, duration_seconds: e.target.value }` (not `reps`).
- The weight input and RPE select are unchanged (weighted planks exist).

When `inputType === 'reps'` (default):
- Behaviour is identical to current — no change.

---

## Set Data Model

Time-based sets store duration in `duration_seconds`:

```js
// reps-based set (unchanged)
{ weight: '135', reps: '8', rpe: '8', completed: true }

// time-based set
{ weight: '', duration_seconds: '45', rpe: '', completed: true }
```

The `reps` field is absent/empty on time-based sets. JSONB storage means no migration.

---

## PR / e1RM Calculation

`useSessions.js` computes e1RM from `set.weight` and `set.reps`. Time-based sets have no `reps`, so `!set.reps` short-circuits the existing guard `if (!set.completed || !set.weight || !set.reps) continue` — no change needed.

---

## Builder / Template Mode

`handleSaveBuilder` in `WorkoutScreen` maps `ex.reps || '8–12'` for the template payload. Time-based exercises should save `ex.reps` as-is (which may be `undefined`/empty). When loading a time-based template, `reps` will be absent and the duration input is driven by `inputType` from the library — no template schema change needed.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/exercises.js` | Add `inputType: 'time'` to relevant entries; add Plank, Dead Hang, Wall Sit, L-Sit entries |
| `src/components/workout/ExerciseBlock.jsx` | Pass `inputType` to SetRow; conditional "Sec"/"Reps" column header; conditional stat line |
| `src/components/workout/SetRow.jsx` | Accept `inputType` prop; swap reps input for duration input when time-based |

---

## Out of Scope

- Rest timer integration for time-based sets — future iteration
- MM:SS picker UI — seconds input is sufficient for now
- Displaying history for time-based exercises (ExerciseHistorySheet) — future iteration
- Per-set input type toggle (overriding library) — future iteration
