# Workout Flow Redesign — Spec

**Date:** 2026-04-20  
**Figma:** nodes 116:4832, 118:9765, 118:8604

---

## Scope

Redesign the active workout screen and post-workout summary to match Figma specs. Covers custom workouts and plan workouts.

---

## 1. Active Workout Screen

### Header
- Left: bear icon in `bg-white/10 rounded-[4px] p-[6px]`
- Center: "Workout" `font-judge text-[16px]` + subtitle (session name or "Custom") `font-commons text-[12px] text-[#8b8b8b]`
- Right: elapsed timer `text-[#8b8b8b] text-[16px] tracking-[0.5px]` + pause icon in same pill

### Exercise Cards (`ExerciseBlock`)
- Container: `bg-white/5 border border-white/10 rounded-[8px] p-[16px] gap-[24px]`
- Exercise name: `font-commons font-semibold text-[18px] tracking-[-0.5px] text-white`
- Meta (muscle + sets): `font-commons text-[14px] text-[#8b8b8b]`
- Top-right: history (clock) + trash icons, `size-[16px] gap-[16px]`
- Add Set button: `bg-white/5 border border-white/10 rounded-[4px] px-[12px] py-[10px] text-[14px] font-bold text-white`

### Set Rows (`SetRow`)
- Set number: `text-[#9d9d9d] text-[18px] font-semibold`
- Column labels (Weight / Reps / RPE or Time): only on first row, `text-[14px] text-[#8b8b8b]`
- Inputs: `bg-[#0a0a0a] border border-white/10 rounded-[4px] py-[12px] px-[10px] text-[18px] text-white/60`
- Check button: `bg-white/10 rounded-[4px] size-[44px]`
- Completed state: check turns accent, input backgrounds darken

### Footer
- "Add Exercise" (custom mode only): `bg-white/5 border border-white/10 rounded-[6px] py-[12px] px-[16px] text-[18px] font-bold text-white w-full`
- "Finish Workout": `bg-accent h-[46px] rounded-[6px] text-[18px] text-black font-bold w-full`
- "Cancel": `text-[#c02727] text-[18px] font-bold text-center w-full`

---

## 2. Post-Workout Summary

Replaces the `WorkoutSummary` SlideUpSheet with a full-screen view rendered inside `WorkoutScreen` (state-controlled, no new route).

### Header
- Left: back chevron + "Back" in accent orange
- Center: "Workout" `font-judge text-[16px]`
- Right: bookmark icon

### Stats Block
- "TOTAL VOLUME" label: `text-[14px] text-white/40 tracking-[1px] uppercase`
- Volume: `font-judge text-[48px] text-white` + "k" suffix `text-[32px] text-accent`
- "lb lifted": `text-[14px] text-[#8b8b8b]`
- PR badge (if any): `bg-[rgba(19,134,75,0.05)] border border-[rgba(19,134,75,0.15)] rounded-[8px] px-[8px] py-[4px] text-[#13864b]`
- Stats grid (Sets / Duration / Exercises): `bg-[#181818] rounded-[2px]` tiles, `font-judge text-[26px] text-white`

### "What You Did" Section
- Label: `text-[14px] text-white/40 tracking-[1px] uppercase`
- Exercise name: `font-commons font-semibold text-[18px]`
- Set rows: `bg-[#181818] rounded-[8px] px-[16px] py-[12px]`

### Footer
- "Copy Workout Results": secondary button
- "Done — Log Workout": `bg-accent h-[46px] rounded-[6px] text-[18px] text-black font-bold`

---

## Architecture

- **`WorkoutScreen.jsx`** — update header, footer, add `showSummary` state to render summary in-place
- **`ExerciseBlock.jsx`** — restyle to match card specs above
- **`SetRow.jsx`** — restyle inputs, check button, column labels
- **`WorkoutSummary.jsx`** — convert from SlideUpSheet to full-screen component
- No new routes or files required
