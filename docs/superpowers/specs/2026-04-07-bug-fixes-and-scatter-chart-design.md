# Design: Bug Fixes & Scatter Chart — 2026-04-07

## Overview

Three targeted changes to `index.html` (single-file app, Supabase backend):

1. Edit Set → No Rest Timer Reset
2. Progress Tab — Dot/Scatter Chart for Exercise History
3. Fix Disconnected In-Workout Exercise History

---

## Bug 1 — Edit Set: No Rest Timer Reset

### Problem

`completeSet(exIdx, sIdx)` always calls `startRestTimer()`, including when the user unlocks a completed set via `editSet()` and re-submits it.

### Fix

Capture `set.editing` as `wasEditing` before clearing it. Gate the `startRestTimer()` call on `!wasEditing`.

```js
function completeSet(exIdx, sIdx) {
  const set = setData[exIdx][sIdx];
  const wasEditing = set.editing;  // capture before clearing
  set.done = true;
  set.editing = false;
  // ... haptic, re-render, next-label logic ...
  if (!wasEditing) {
    startRestTimer(...);
  }
}
```

No other changes needed. `editSet()` already sets `editing = true`, so the flag is in place.

---

## Bug 2 — Progress Tab: Scatter/Dot Chart

### Problem

`renderProgress()` renders a horizontal bar chart (one bar per session). The request is to replace this with a dot/scatter chart — one dot per session, plotted as weight or estimated 1RM over time, with a tooltip on tap/hover.

### Design

**Data**: Same as current — top set per session, filtered to sessions where `topSet.weight` is truthy. One point per session.

**Chart type**: Inline SVG with `viewBox="0 0 400 200"` (renders responsively via CSS `width: 100%`).

**Axes**:
- X: dates, evenly spaced left→right (oldest→newest). Axis labels: first, last, and a midpoint date shown below the chart.
- Y: weight or e1RM (depending on toggle), scaled bottom→top with 10% padding at top/bottom. Axis labels: min and max values on the left.

**Dots**: `<circle r="5">` per session. Color: `var(--accent)`. On tap/click, show tooltip.

**Trend line**: Straight `<line>` from the first to last data point. Color: `var(--muted)`, dashed, low opacity. Shows direction of progress at a glance.

**Tooltip**: A `<div class="scatter-tooltip">` (position: absolute, z-index: 100) rendered outside the SVG, positioned near the tapped dot. Shows: date · weight lbs × reps (e1rm if in e1rm mode). Dismisses on tap elsewhere.

**Toggle**: Existing "Top Set Weight" / "Est. 1RM" toggle retained. Clicking it re-renders the chart with the new Y axis.

**Fallback**: If only one data point, render the dot with a note "Need more sessions to see trend."

### New CSS

Two new rule blocks added to the existing `<style>` section:

```css
.scatter-svg { width: 100%; height: auto; display: block; overflow: visible; }
.scatter-tooltip {
  position: absolute; z-index: 100;
  background: var(--card); border: 1px solid var(--border-strong);
  border-radius: 8px; padding: 7px 10px;
  font-family: var(--mono); font-size: 11px; color: var(--text);
  pointer-events: none; white-space: nowrap;
}
```

---

## Bug 3 — Shared Exercise History Lookup

### Problem

`openLiftModal()` and `openExerciseInfo()` both query Supabase via `loadSessions()` and filter by `e.name === exerciseName`, but the filtering logic diverges:

- `openExerciseInfo`: requires `topSet.weight` to be truthy — only includes sessions with logged weight.
- `openLiftModal`: includes any session where `ex.sets?.length > 0` — can include sessions with empty weights, leading to 0-value chart bars or inconsistent results.

### Fix

Extract a shared pure function:

```js
function getExerciseEntries(sessions, name) {
  const entries = [];
  sessions.forEach(s => {
    const ex = s.exercises?.find(e => e.name === name);
    if (!ex?.sets?.length) return;
    const topSet = ex.sets.reduce((a, b) =>
      (parseFloat(b.weight) || 0) > (parseFloat(a.weight) || 0) ? b : a, ex.sets[0]);
    if (!topSet.weight) return;
    entries.push({
      date: s.date,
      sessionName: s.sessionName,
      sets: ex.sets,
      topSet,
      weight: parseFloat(topSet.weight),
      reps: parseFloat(topSet.reps),
      rpe: topSet.rpe,
      e1rm: epley(topSet.weight, topSet.reps)
    });
  });
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}
```

Both `openLiftModal` and `openExerciseInfo` call `getExerciseEntries(sessions, name)` instead of their current inline logic. The returned shape satisfies both rendering needs (all sets via `entry.sets`, top set via `entry.topSet`).

---

## Files Changed

- `index.html` — all three changes are self-contained within this file.
- No new files created. No dependency changes.

---

## Out of Scope

- Exercise ID field in Supabase schema (no migration needed; name-matching is sufficient once unified)
- Any changes to session save format
- Refactoring unrelated code
