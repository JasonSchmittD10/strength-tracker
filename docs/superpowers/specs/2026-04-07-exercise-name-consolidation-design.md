# Design: Exercise Name Consolidation + Data Migration — 2026-04-07

## Problem

Two naming systems coexist in the codebase:
- **EXERCISE_LIBRARY** keys: exercise-first style (`Barbell Row (Pronated)`, `Leg Press`, `Weighted Pull-Up`)
- **PROGRAMS** names: prefix-style (`Barbell Bent-over Row`, `Machine Leg Press`, `Pull-up`)

Historical session data in Supabase was saved with PROGRAMS names. History lookups use EXERCISE_LIBRARY names. The existing `LEGACY_NAME_MAP` / `resolveExName()` partially bridges this but maps in the wrong direction (EXERCISE_LIBRARY → PROGRAMS) and is not applied consistently.

## Canonical Standard

**EXERCISE_LIBRARY keys are canonical.** All exercise names everywhere must match an EXERCISE_LIBRARY key.

---

## Part 1: Complete Alias Map

Replace `LEGACY_NAME_MAP` / `resolveExName()` with `NAME_ALIASES` / `normalizeExerciseName()`.

`NAME_ALIASES` maps historical/PROGRAMS variant names → canonical EXERCISE_LIBRARY names. Placed near the top of the JS section, immediately after the PROGRAMS registry.

```js
const NAME_ALIASES = {
  // PROGRAMS → canonical (Push A)
  'Barbell Overhead Press':             'Overhead Press (Barbell)',
  'Dumbbell Incline Press':             'Incline Dumbbell Press',
  'Cable Tricep Pushdown':              'Tricep Pushdown (Cable)',
  'Dumbbell Overhead Tricep Extension': 'Overhead Tricep Extension',
  // PROGRAMS → canonical (Pull A)
  'Pull-up':                            'Weighted Pull-Up',
  'Barbell Bent-over Row':              'Barbell Row (Pronated)',
  'Machine Chest-supported Row':        'Chest-Supported Row (DB)',
  'Cable Face Pull':                    'Face Pull (Cable)',
  'Barbell Bicep Curl':                 'Barbell Curl',
  'Dumbbell Hammer Curl':               'Hammer Curl (DB)',
  // PROGRAMS → canonical (Legs A)
  'Barbell Back Squat':                 'Back Squat (Barbell)',
  'Barbell Romanian Deadlift':          'Romanian Deadlift',
  'Machine Leg Press':                  'Leg Press',
  'Machine Leg Curl':                   'Leg Curl (Machine)',
  'Dumbbell Walking Lunge':             'Walking Lunge (DB)',
  'Machine Standing Calf Raise':        'Standing Calf Raise',
  // PROGRAMS → canonical (Push B)
  'Barbell Incline Bench Press':        'Incline Barbell Press',
  'Cable Chest Fly':                    'Cable Fly (Low-to-High)',
  'Dumbbell Lateral Raise':             'Lateral Raise (DB)',
  'Barbell Close Grip Bench Press':     'Close-Grip Bench Press',
  'EZ Bar Skull Crusher':               'Skull Crusher (EZ Bar)',
  // PROGRAMS → canonical (Pull B)
  'Cable Lat Pulldown':                 'Lat Pulldown (Wide Grip)',
  'Cable Seated Row':                   'Cable Row (Neutral Grip)',
  'Dumbbell Single-arm Row':            'Single-Arm DB Row',
  'Cable Straight-arm Pulldown':        'Straight-Arm Pulldown',
  'Dumbbell Incline Curl':              'Incline DB Curl',
  'Cable Curl':                         'Cable Curl (Rope)',
  // PROGRAMS → canonical (Legs B)
  'Barbell Bulgarian Split Squat':      'Bulgarian Split Squat (DB)',
  'Barbell Hack Squat':                 'Hack Squat / Leg Press',
  'Nordic Hamstring Curl':              'Nordic Curl / Lying Leg Curl',
  'Dumbbell Goblet Squat':              'Goblet Squat (Tempo)',
  'Barbell Seated Calf Raise':          'Seated Calf Raise',
  // Known freeform historical variants
  'Pull-Up':                            'Weighted Pull-Up',
  'Pull Up':                            'Weighted Pull-Up',
  'Pullup':                             'Weighted Pull-Up',
};

function normalizeExerciseName(name) {
  return NAME_ALIASES[name] || name;
}
```

`LEGACY_NAME_MAP` and `resolveExName` are **deleted**.

---

## Part 2A: Update PROGRAMS to Use Canonical Names

All exercise `name` fields in the PROGRAMS registry get updated to canonical EXERCISE_LIBRARY names. This ensures all new sessions save canonical names going forward.

| Session  | Old PROGRAMS name                    | New canonical name              |
|----------|--------------------------------------|---------------------------------|
| Push A   | Barbell Overhead Press               | Overhead Press (Barbell)        |
| Push A   | Dumbbell Incline Press               | Incline Dumbbell Press          |
| Push A   | Cable Tricep Pushdown                | Tricep Pushdown (Cable)         |
| Push A   | Dumbbell Overhead Tricep Extension   | Overhead Tricep Extension       |
| Pull A   | Pull-up                              | Weighted Pull-Up                |
| Pull A   | Barbell Bent-over Row                | Barbell Row (Pronated)          |
| Pull A   | Machine Chest-supported Row          | Chest-Supported Row (DB)        |
| Pull A   | Cable Face Pull                      | Face Pull (Cable)               |
| Pull A   | Barbell Bicep Curl                   | Barbell Curl                    |
| Pull A   | Dumbbell Hammer Curl                 | Hammer Curl (DB)                |
| Legs A   | Barbell Back Squat                   | Back Squat (Barbell)            |
| Legs A   | Barbell Romanian Deadlift            | Romanian Deadlift               |
| Legs A   | Machine Leg Press                    | Leg Press                       |
| Legs A   | Machine Leg Curl                     | Leg Curl (Machine)              |
| Legs A   | Dumbbell Walking Lunge               | Walking Lunge (DB)              |
| Legs A   | Machine Standing Calf Raise          | Standing Calf Raise             |
| Push B   | Barbell Incline Bench Press          | Incline Barbell Press           |
| Push B   | Cable Chest Fly                      | Cable Fly (Low-to-High)         |
| Push B   | Dumbbell Lateral Raise               | Lateral Raise (DB)              |
| Push B   | Barbell Close Grip Bench Press       | Close-Grip Bench Press          |
| Push B   | EZ Bar Skull Crusher                 | Skull Crusher (EZ Bar)          |
| Pull B   | Cable Lat Pulldown                   | Lat Pulldown (Wide Grip)        |
| Pull B   | Cable Seated Row                     | Cable Row (Neutral Grip)        |
| Pull B   | Dumbbell Single-arm Row              | Single-Arm DB Row               |
| Pull B   | Cable Straight-arm Pulldown          | Straight-Arm Pulldown           |
| Pull B   | Dumbbell Incline Curl                | Incline DB Curl                 |
| Pull B   | Cable Curl                           | Cable Curl (Rope)               |
| Legs B   | Barbell Bulgarian Split Squat        | Bulgarian Split Squat (DB)      |
| Legs B   | Barbell Hack Squat                   | Hack Squat / Leg Press          |
| Legs B   | Nordic Hamstring Curl                | Nordic Curl / Lying Leg Curl    |
| Legs B   | Dumbbell Goblet Squat                | Goblet Squat (Tempo)            |
| Legs B   | Barbell Seated Calf Raise            | Seated Calf Raise               |

Unchanged (already canonical): `Barbell Bench Press`, `Cable Lateral Raise`, `Dumbbell Shoulder Press`, `Trap Bar Deadlift`.

## Part 2A: Simplify MUSCLE_MAP

Replace the duplicated PROGRAMS+EXERCISE_LIBRARY MUSCLE_MAP entries with a single canonical-only version. Apply `normalizeExerciseName(ex.name)` at the two lookup sites (~lines 2551, 2712) instead of duplicating entries.

```js
const MUSCLE_MAP = {
  'Barbell Bench Press': 'Chest', 'Incline Barbell Press': 'Chest', 'Incline Dumbbell Press': 'Chest',
  'Cable Fly (Low-to-High)': 'Chest', 'Close-Grip Bench Press': 'Chest',
  'Overhead Press (Barbell)': 'Shoulders', 'Dumbbell Shoulder Press': 'Shoulders',
  'Cable Lateral Raise': 'Shoulders', 'Lateral Raise (DB)': 'Shoulders', 'Face Pull (Cable)': 'Shoulders',
  'Weighted Pull-Up': 'Back', 'Barbell Row (Pronated)': 'Back', 'Chest-Supported Row (DB)': 'Back',
  'Lat Pulldown (Wide Grip)': 'Back', 'Cable Row (Neutral Grip)': 'Back',
  'Single-Arm DB Row': 'Back', 'Straight-Arm Pulldown': 'Back',
  'Tricep Pushdown (Cable)': 'Arms', 'Overhead Tricep Extension': 'Arms', 'Skull Crusher (EZ Bar)': 'Arms',
  'Barbell Curl': 'Arms', 'Hammer Curl (DB)': 'Arms', 'Incline DB Curl': 'Arms', 'Cable Curl (Rope)': 'Arms',
  'Back Squat (Barbell)': 'Legs', 'Romanian Deadlift': 'Legs', 'Leg Press': 'Legs',
  'Leg Curl (Machine)': 'Legs', 'Walking Lunge (DB)': 'Legs', 'Standing Calf Raise': 'Legs',
  'Bulgarian Split Squat (DB)': 'Legs', 'Trap Bar Deadlift': 'Legs', 'Hack Squat / Leg Press': 'Legs',
  'Nordic Curl / Lying Leg Curl': 'Legs', 'Goblet Squat (Tempo)': 'Legs', 'Seated Calf Raise': 'Legs',
};
```

Lookup sites: `MUSCLE_MAP[normalizeExerciseName(ex.name)]`

---

## Part 2B: Runtime Normalization

Apply `normalizeExerciseName()` wherever session exercise names are read:

| Location | Change |
|---|---|
| `getExerciseEntries(sessions, name)` | `s.exercises?.find(e => normalizeExerciseName(e.name) === normalizeExerciseName(name))` |
| `renderProgressSelect()` | `lifts.add(normalizeExerciseName(ex.name))` |
| `startWorkout()` pre-fill | `lastSessionData[normalizeExerciseName(ex.name)] = ex.sets` and `lastSessionData[normalizeExerciseName(ex.name)]` |
| `showExerciseDetail()` (~line 3676) | Replace `resolveExName` calls with `normalizeExerciseName` |
| `MUSCLE_MAP` lookup sites (×2) | `MUSCLE_MAP[normalizeExerciseName(ex.name)]` |

---

## Part 2C: One-Time Data Migration

`migrateExerciseNames()` — console-callable, no UI required.

```
window.migrateExerciseNames = async function() { ... }
```

Algorithm:
1. `loadSessions(true)` — force-fetch all sessions, bypass cache
2. For each session, normalize each `exercises[i].name`
3. If any name changed: PATCH the session row via `PATCH /sessions?id=eq.{_supabase_id}` with updated `data` JSONB
4. Log each patched session and a final summary (`N sessions updated, M unchanged`)
5. Invalidate `sessionCache = null`

PATCH request uses existing `sbHeaders` (includes apikey, auth, content-type, prefer).

---

## Files Changed

- `index.html` — all changes self-contained

## Out of Scope

- Any Supabase schema changes
- Any changes to how sessions are saved (save format unchanged)
- Adding UI for migration (console-callable is sufficient for a one-shot op)
