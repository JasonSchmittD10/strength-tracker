# Workout Header — Pixel-Perfect Update

**Date:** 2026-04-21  
**Scope:** `src/components/workout/WorkoutScreen.jsx` header block (lines 474–511) + 3 new asset files

---

## Title / Subtitle Logic

| Mode | Title | Subtitle |
|------|-------|----------|
| `program` | session name (e.g. "Legs B") | program string (e.g. "PPL x 2 · Block 1 · Week 4 · Deload") |
| `template` | template name | today's date (e.g. "Monday, April 21") |
| `custom` / `builder` | "Workout" | today's date (e.g. "Monday, April 21") |

Date format: `new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })`

---

## Left Icon Button

- Download Figma asset `c5c5c54a-7119-43c8-ac51-edd30d029f27` → `src/assets/icons/icon-workout.svg`
- Replace `<Dumbbell size={20} className="text-white" />` with `<img src={workoutIcon} className="w-[20px] h-[20px]" alt="" />`
- Button padding: `p-[6px]` (unchanged), `rounded-[4px]`, `bg-[rgba(255,255,255,0.1)]`

---

## Pause / Play Button

- Download Figma asset `b2b6ad6b-cfaa-4d49-8c60-35a163139f3c` → `src/assets/icons/icon-pause.svg`
- Download Figma asset `3361f736-c737-40a1-b885-76bfc3f9dd9c` → `src/assets/icons/icon-play.svg`
- Padding: `p-[8px]` (was `p-[6px]`)
- Icon container: `w-[16px] h-[16px]`
- Running state: `bg-[rgba(255,255,255,0.1)]`, shows pause icon
- Paused state: `bg-[rgba(242,166,85,0.5)]`, shows play icon

---

## Timer Text

- Always render `formatElapsed(elapsed)` — remove the `isPaused ? 'Paused' : ...` conditional
- The amber button background communicates paused state visually

---

## Assets

| File | Figma asset UUID | Purpose |
|------|-----------------|---------|
| `src/assets/icons/icon-workout.svg` | `c5c5c54a-7119-43c8-ac51-edd30d029f27` | Left icon next to title |
| `src/assets/icons/icon-pause.svg` | `b2b6ad6b-cfaa-4d49-8c60-35a163139f3c` | Pause button icon |
| `src/assets/icons/icon-play.svg` | `3361f736-c737-40a1-b885-76bfc3f9dd9c` | Play button icon |
