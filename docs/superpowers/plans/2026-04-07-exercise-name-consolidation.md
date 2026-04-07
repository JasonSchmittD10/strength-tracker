# Exercise Name Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all exercise names to EXERCISE_LIBRARY canonical keys, apply runtime normalization everywhere session data is read, and provide a console-callable migration function to clean stored Supabase data.

**Architecture:** Four sequential tasks: (1) replace `LEGACY_NAME_MAP`/`resolveExName` with `NAME_ALIASES`/`normalizeExerciseName`; (2) update PROGRAMS to use canonical names; (3) apply `normalizeExerciseName` at all session read sites; (4) add `migrateExerciseNames()` for one-time DB cleanup. All changes are in `index.html`.

**Tech Stack:** Vanilla JS, Supabase REST API (PATCH for migration), single HTML file

---

### Task 1: Replace LEGACY_NAME_MAP with NAME_ALIASES

**Files:**
- Modify: `index.html` — lines ~1723–1733 (LEGACY_NAME_MAP + resolveExName)

- [ ] **Step 1: Find and replace the LEGACY_NAME_MAP block**

Locate lines 1723–1733 in `index.html`. The current block looks like:

```javascript
const LEGACY_NAME_MAP = {
  'Overhead Press (Barbell)': 'Barbell Overhead Press', 'Incline Dumbbell Press': 'Dumbbell Incline Press', ...
};
function resolveExName(name) { return LEGACY_NAME_MAP[name] || name; }
```

Replace the entire block (both the `const` and the `function`) with:

```javascript
// ── Exercise name aliases: historical/PROGRAMS variant → canonical EXERCISE_LIBRARY key ──
const NAME_ALIASES = {
  // Push A variants
  'Barbell Overhead Press':             'Overhead Press (Barbell)',
  'Dumbbell Incline Press':             'Incline Dumbbell Press',
  'Cable Tricep Pushdown':              'Tricep Pushdown (Cable)',
  'Dumbbell Overhead Tricep Extension': 'Overhead Tricep Extension',
  // Pull A variants
  'Pull-up':                            'Weighted Pull-Up',
  'Barbell Bent-over Row':              'Barbell Row (Pronated)',
  'Machine Chest-supported Row':        'Chest-Supported Row (DB)',
  'Cable Face Pull':                    'Face Pull (Cable)',
  'Barbell Bicep Curl':                 'Barbell Curl',
  'Dumbbell Hammer Curl':               'Hammer Curl (DB)',
  // Legs A variants
  'Barbell Back Squat':                 'Back Squat (Barbell)',
  'Barbell Romanian Deadlift':          'Romanian Deadlift',
  'Machine Leg Press':                  'Leg Press',
  'Machine Leg Curl':                   'Leg Curl (Machine)',
  'Dumbbell Walking Lunge':             'Walking Lunge (DB)',
  'Machine Standing Calf Raise':        'Standing Calf Raise',
  // Push B variants
  'Barbell Incline Bench Press':        'Incline Barbell Press',
  'Cable Chest Fly':                    'Cable Fly (Low-to-High)',
  'Dumbbell Lateral Raise':             'Lateral Raise (DB)',
  'Barbell Close Grip Bench Press':     'Close-Grip Bench Press',
  'EZ Bar Skull Crusher':               'Skull Crusher (EZ Bar)',
  // Pull B variants
  'Cable Lat Pulldown':                 'Lat Pulldown (Wide Grip)',
  'Cable Seated Row':                   'Cable Row (Neutral Grip)',
  'Dumbbell Single-arm Row':            'Single-Arm DB Row',
  'Cable Straight-arm Pulldown':        'Straight-Arm Pulldown',
  'Dumbbell Incline Curl':              'Incline DB Curl',
  'Cable Curl':                         'Cable Curl (Rope)',
  // Legs B variants
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

- [ ] **Step 2: Verify `resolveExName` has no remaining callers**

Search the file for any remaining `resolveExName` references:

```bash
grep -n "resolveExName" index.html
```

Expected output: lines ~3676 and ~3681 (inside `showExerciseDetail`). These will be updated in Task 3. No other callers should exist.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "refactor: replace LEGACY_NAME_MAP/resolveExName with NAME_ALIASES/normalizeExerciseName"
```

---

### Task 2: Update PROGRAMS to Use Canonical Names

**Files:**
- Modify: `index.html` — lines ~1543–1609 (PROGRAMS sessions exercises array)

- [ ] **Step 1: Update Push A exercises (~lines 1543–1548)**

Old:
```javascript
          { name: 'Barbell Bench Press',        sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Barbell Overhead Press',      sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Dumbbell Incline Press',       sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Lateral Raise',         sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
          { name: 'Cable Tricep Pushdown',       sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Overhead Tricep Extension', sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
```

New:
```javascript
          { name: 'Barbell Bench Press',        sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Overhead Press (Barbell)',    sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Incline Dumbbell Press',      sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Lateral Raise',         sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
          { name: 'Tricep Pushdown (Cable)',     sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Overhead Tricep Extension',   sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
```

- [ ] **Step 2: Update Pull A exercises (~lines 1555–1560)**

Old:
```javascript
          { name: 'Pull-up',                     sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Barbell Bent-over Row',        sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Machine Chest-supported Row',  sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Face Pull',             sets: 3, reps: '15–20', rest: 60,  restLabel: '1 min' },
          { name: 'Barbell Bicep Curl',          sets: 3, reps: '8–10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Hammer Curl',         sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
```

New:
```javascript
          { name: 'Weighted Pull-Up',            sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Barbell Row (Pronated)',       sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Chest-Supported Row (DB)',     sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Face Pull (Cable)',            sets: 3, reps: '15–20', rest: 60,  restLabel: '1 min' },
          { name: 'Barbell Curl',                sets: 3, reps: '8–10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Hammer Curl (DB)',             sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
```

- [ ] **Step 3: Update Legs A exercises (~lines 1567–1572)**

Old:
```javascript
          { name: 'Barbell Back Squat',           sets: 4, reps: '4–6',    rest: 240, restLabel: '4 min' },
          { name: 'Barbell Romanian Deadlift',    sets: 4, reps: '6–8',    rest: 180, restLabel: '3 min' },
          { name: 'Machine Leg Press',            sets: 3, reps: '10–12',  rest: 120, restLabel: '2 min' },
          { name: 'Machine Leg Curl',             sets: 3, reps: '10–12',  rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Walking Lunge',       sets: 3, reps: '12 each',rest: 90,  restLabel: '90 sec' },
          { name: 'Machine Standing Calf Raise',  sets: 4, reps: '15–20',  rest: 60,  restLabel: '1 min' },
```

New:
```javascript
          { name: 'Back Squat (Barbell)',         sets: 4, reps: '4–6',    rest: 240, restLabel: '4 min' },
          { name: 'Romanian Deadlift',            sets: 4, reps: '6–8',    rest: 180, restLabel: '3 min' },
          { name: 'Leg Press',                   sets: 3, reps: '10–12',  rest: 120, restLabel: '2 min' },
          { name: 'Leg Curl (Machine)',           sets: 3, reps: '10–12',  rest: 90,  restLabel: '90 sec' },
          { name: 'Walking Lunge (DB)',           sets: 3, reps: '12 each',rest: 90,  restLabel: '90 sec' },
          { name: 'Standing Calf Raise',          sets: 4, reps: '15–20',  rest: 60,  restLabel: '1 min' },
```

- [ ] **Step 4: Update Push B exercises (~lines 1579–1584)**

Old:
```javascript
          { name: 'Barbell Incline Bench Press',  sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Dumbbell Shoulder Press',      sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Chest Fly',              sets: 3, reps: '12–15', rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Lateral Raise',       sets: 4, reps: '15–20', rest: 60,  restLabel: '1 min' },
          { name: 'Barbell Close Grip Bench Press', sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'EZ Bar Skull Crusher',         sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
```

New:
```javascript
          { name: 'Incline Barbell Press',        sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Dumbbell Shoulder Press',      sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Fly (Low-to-High)',      sets: 3, reps: '12–15', rest: 90,  restLabel: '90 sec' },
          { name: 'Lateral Raise (DB)',           sets: 4, reps: '15–20', rest: 60,  restLabel: '1 min' },
          { name: 'Close-Grip Bench Press',       sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Skull Crusher (EZ Bar)',       sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
```

- [ ] **Step 5: Update Pull B exercises (~lines 1591–1596)**

Old:
```javascript
          { name: 'Cable Lat Pulldown',           sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Seated Row',             sets: 4, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Single-arm Row',      sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Cable Straight-arm Pulldown',  sets: 3, reps: '12–15', rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Incline Curl',        sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Cable Curl',                   sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
```

New:
```javascript
          { name: 'Lat Pulldown (Wide Grip)',     sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Row (Neutral Grip)',     sets: 4, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Single-Arm DB Row',            sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Straight-Arm Pulldown',        sets: 3, reps: '12–15', rest: 90,  restLabel: '90 sec' },
          { name: 'Incline DB Curl',              sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Cable Curl (Rope)',             sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
```

- [ ] **Step 6: Update Legs B exercises (~lines 1603–1608)**

Old:
```javascript
          { name: 'Barbell Bulgarian Split Squat', sets: 4, reps: '8–10 each', rest: 180, restLabel: '3 min' },
          { name: 'Trap Bar Deadlift',            sets: 4, reps: '6–8',       rest: 210, restLabel: '3.5 min' },
          { name: 'Barbell Hack Squat',            sets: 3, reps: '12–15',     rest: 90,  restLabel: '90 sec' },
          { name: 'Nordic Hamstring Curl',        sets: 3, reps: '8–10',      rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Goblet Squat',        sets: 3, reps: '12',         rest: 90,  restLabel: '90 sec' },
          { name: 'Barbell Seated Calf Raise',    sets: 4, reps: '15–20',     rest: 60,  restLabel: '1 min' },
```

New:
```javascript
          { name: 'Bulgarian Split Squat (DB)',   sets: 4, reps: '8–10 each', rest: 180, restLabel: '3 min' },
          { name: 'Trap Bar Deadlift',            sets: 4, reps: '6–8',       rest: 210, restLabel: '3.5 min' },
          { name: 'Hack Squat / Leg Press',       sets: 3, reps: '12–15',     rest: 90,  restLabel: '90 sec' },
          { name: 'Nordic Curl / Lying Leg Curl', sets: 3, reps: '8–10',      rest: 90,  restLabel: '90 sec' },
          { name: 'Goblet Squat (Tempo)',         sets: 3, reps: '12',         rest: 90,  restLabel: '90 sec' },
          { name: 'Seated Calf Raise',            sets: 4, reps: '15–20',     rest: 60,  restLabel: '1 min' },
```

- [ ] **Step 7: Update MUSCLE_MAP to canonical-only entries (~lines 2464–2475)**

Replace the full `MUSCLE_MAP` const (including the "Legacy aliases" comment block) with:

```javascript
const MUSCLE_MAP = {
  // Chest
  'Barbell Bench Press': 'Chest', 'Incline Barbell Press': 'Chest', 'Incline Dumbbell Press': 'Chest',
  'Cable Fly (Low-to-High)': 'Chest', 'Close-Grip Bench Press': 'Chest',
  // Shoulders
  'Overhead Press (Barbell)': 'Shoulders', 'Dumbbell Shoulder Press': 'Shoulders',
  'Cable Lateral Raise': 'Shoulders', 'Lateral Raise (DB)': 'Shoulders', 'Face Pull (Cable)': 'Shoulders',
  // Back
  'Weighted Pull-Up': 'Back', 'Barbell Row (Pronated)': 'Back', 'Chest-Supported Row (DB)': 'Back',
  'Lat Pulldown (Wide Grip)': 'Back', 'Cable Row (Neutral Grip)': 'Back',
  'Single-Arm DB Row': 'Back', 'Straight-Arm Pulldown': 'Back',
  // Arms
  'Tricep Pushdown (Cable)': 'Arms', 'Overhead Tricep Extension': 'Arms', 'Skull Crusher (EZ Bar)': 'Arms',
  'Barbell Curl': 'Arms', 'Hammer Curl (DB)': 'Arms', 'Incline DB Curl': 'Arms', 'Cable Curl (Rope)': 'Arms',
  // Legs
  'Back Squat (Barbell)': 'Legs', 'Romanian Deadlift': 'Legs', 'Leg Press': 'Legs',
  'Leg Curl (Machine)': 'Legs', 'Walking Lunge (DB)': 'Legs', 'Standing Calf Raise': 'Legs',
  'Bulgarian Split Squat (DB)': 'Legs', 'Trap Bar Deadlift': 'Legs', 'Hack Squat / Leg Press': 'Legs',
  'Nordic Curl / Lying Leg Curl': 'Legs', 'Goblet Squat (Tempo)': 'Legs', 'Seated Calf Raise': 'Legs',
};
```

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "refactor: update PROGRAMS and MUSCLE_MAP to canonical EXERCISE_LIBRARY names"
```

---

### Task 3: Apply normalizeExerciseName at All Session Read Sites

**Files:**
- Modify: `index.html` — lines ~2014–2021 (startWorkout), ~2551, ~2712 (MUSCLE_MAP lookups), ~2769 (renderProgressSelect), ~2942 (getExerciseEntries), ~3676–3692 (showExerciseDetail)

- [ ] **Step 1: Update `startWorkout` pre-fill (~lines 2013–2021)**

Old:
```javascript
  if (lastMatch) {
    lastMatch.exercises.forEach(ex => {
      lastSessionData[ex.name] = ex.sets;
    });
  }

  // Pre-fill setData from last session where available
  activeSession.exercises.forEach((ex, i) => {
    const prev = lastSessionData[ex.name] || [];
```

New:
```javascript
  if (lastMatch) {
    lastMatch.exercises.forEach(ex => {
      lastSessionData[normalizeExerciseName(ex.name)] = ex.sets;
    });
  }

  // Pre-fill setData from last session where available
  activeSession.exercises.forEach((ex, i) => {
    const prev = lastSessionData[normalizeExerciseName(ex.name)] || [];
```

- [ ] **Step 2: Update MUSCLE_MAP lookup in `renderWeeklyHeatmap` (~line 2551)**

Old:
```javascript
      const muscle = MUSCLE_MAP[ex.name];
```

New (this is the first occurrence, inside `renderWeeklyHeatmap`):
```javascript
      const muscle = MUSCLE_MAP[normalizeExerciseName(ex.name)];
```

- [ ] **Step 3: Update MUSCLE_MAP lookup in `renderVolumeChart` (~line 2712)**

Old (second occurrence of the same pattern, inside `renderVolumeChart`):
```javascript
      const muscle = MUSCLE_MAP[ex.name];
```

New:
```javascript
      const muscle = MUSCLE_MAP[normalizeExerciseName(ex.name)];
```

Note: There are exactly two `MUSCLE_MAP[ex.name]` occurrences. Use grep to confirm before editing:
```bash
grep -n "MUSCLE_MAP\[ex\.name\]" index.html
```

- [ ] **Step 4: Update `renderProgressSelect` (~line 2769)**

Old:
```javascript
  sessions.forEach(s => s.exercises?.forEach(ex => lifts.add(ex.name)));
```

New:
```javascript
  sessions.forEach(s => s.exercises?.forEach(ex => lifts.add(normalizeExerciseName(ex.name))));
```

- [ ] **Step 5: Update `getExerciseEntries` (~line 2942)**

Old:
```javascript
    const ex = s.exercises?.find(e => e.name === name);
```

New:
```javascript
    const ex = s.exercises?.find(e => normalizeExerciseName(e.name) === normalizeExerciseName(name));
```

- [ ] **Step 6: Update `showExerciseDetail` (~lines 3676–3692)**

Old:
```javascript
    const resolvedName = resolveExName(name);
    const allSets = [];
    const history = [];

    legacySessions.forEach(s => {
      const exData = (s.exercises || []).find(e => resolveExName(e.name) === resolvedName);
      ...
    });
    ...
    const info = EXERCISE_LIBRARY[name] || EXERCISE_LIBRARY[resolvedName] || null;
```

New:
```javascript
    const resolvedName = normalizeExerciseName(name);
    const allSets = [];
    const history = [];

    legacySessions.forEach(s => {
      const exData = (s.exercises || []).find(e => normalizeExerciseName(e.name) === resolvedName);
      ...
    });
    ...
    const info = EXERCISE_LIBRARY[resolvedName] || null;
```

- [ ] **Step 7: Verify no remaining resolveExName calls**

```bash
grep -n "resolveExName" index.html
```

Expected: no output. If any remain, replace with `normalizeExerciseName`.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "fix: apply normalizeExerciseName at all session read sites"
```

---

### Task 4: Add migrateExerciseNames() Console Function

**Files:**
- Modify: `index.html` — add after `deleteSession` function (~line 1754)

- [ ] **Step 1: Add migration function**

Find the line immediately after the closing `}` of `deleteSession` (~line 1754). Insert:

```javascript
// ══════════════════════════════════════════════════════════════
// ONE-TIME DATA MIGRATION — call window.migrateExerciseNames() from console
// ══════════════════════════════════════════════════════════════
window.migrateExerciseNames = async function() {
  console.log('[migrate] Loading all sessions...');
  const sessions = await loadSessions(true); // force-bypass cache
  let updated = 0, unchanged = 0;

  for (const s of sessions) {
    if (!s._supabase_id) { console.warn('[migrate] Session missing _supabase_id, skipping:', s); continue; }

    const originalExercises = s.exercises || [];
    let changed = false;

    const normalizedExercises = originalExercises.map(ex => {
      const canonical = normalizeExerciseName(ex.name);
      if (canonical !== ex.name) {
        console.log(`[migrate] Session ${s._supabase_id} (${s.date}): "${ex.name}" → "${canonical}"`);
        changed = true;
        return { ...ex, name: canonical };
      }
      return ex;
    });

    if (!changed) { unchanged++; continue; }

    // Rebuild full session data with normalized names
    const updatedData = { ...s, exercises: normalizedExercises };
    delete updatedData._supabase_id; // don't store internal key in JSONB

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${s._supabase_id}`, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify({ data: updatedData })
      });
      if (!res.ok) {
        console.error(`[migrate] PATCH failed for session ${s._supabase_id}:`, res.status, await res.text());
      } else {
        updated++;
      }
    } catch (e) {
      console.error(`[migrate] Network error for session ${s._supabase_id}:`, e);
    }
  }

  sessionCache = null; // invalidate so next load gets clean data
  console.log(`[migrate] Done. ${updated} sessions updated, ${unchanged} unchanged.`);
};
```

- [ ] **Step 2: Verify the function is callable from console**

Open the app in a browser and open DevTools console. Run:

```javascript
typeof window.migrateExerciseNames
```

Expected output: `"function"`

- [ ] **Step 3: Verify dry-run logic (before running for real)**

In console, check that NAME_ALIASES is populated:

```javascript
Object.keys(NAME_ALIASES).length
```

Expected: `35` (the number of alias entries).

Also confirm normalizeExerciseName works:

```javascript
normalizeExerciseName('Pull-up')      // → 'Weighted Pull-Up'
normalizeExerciseName('Barbell Curl') // → 'Barbell Curl' (already canonical, unchanged)
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add migrateExerciseNames() console function for one-time DB cleanup"
```

---

## Self-Review

**Spec coverage:**
- ✅ NAME_ALIASES with all known variants — Task 1
- ✅ normalizeExerciseName() function — Task 1
- ✅ LEGACY_NAME_MAP + resolveExName deleted — Task 1 Step 1
- ✅ PROGRAMS updated to canonical names — Task 2 Steps 1–6
- ✅ MUSCLE_MAP simplified to canonical-only — Task 2 Step 7
- ✅ getExerciseEntries normalized — Task 3 Step 5
- ✅ renderProgressSelect normalized — Task 3 Step 4
- ✅ startWorkout pre-fill normalized — Task 3 Step 1
- ✅ showExerciseDetail (resolveExName replaced) — Task 3 Step 6
- ✅ MUSCLE_MAP lookup sites (×2) normalized — Task 3 Steps 2–3
- ✅ migrateExerciseNames() console function — Task 4

**Placeholder scan:** No TBDs or vague steps. All code is complete.

**Type consistency:**
- `normalizeExerciseName(name: string): string` — defined Task 1, used identically in all tasks. ✅
- `NAME_ALIASES` — defined Task 1, referenced in Task 4 Step 3 dry-run check. ✅
- `s._supabase_id` — present on all normalized sessions (set in `normalizeSession` via `{ _supabase_id: row.id }`). ✅
- Migration uses `sbHeaders` (defined at file top, includes apikey + auth + content-type + prefer). ✅
