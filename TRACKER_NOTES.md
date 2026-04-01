# Strength Tracker — Source of Truth

## Stack
- Single file app: `index.html`
- Deployed: Netlify (auto-deploys on push to main)
- Database: Supabase (`sessions` table, `id` / `data` jsonb / `created_at`)
- Supabase URL: https://yawoliebqdxrmkygawqj.supabase.co

## Current Features
- Session selector → Preview screen → Active workout screen
- Workout timer in nav (starts on "Start Workout")
- Per-set submit button that locks the row and fires a rest timer
- Rest timer overlay with countdown ring, skip button
- Cancel workout (no save) / Finish workout (saves to Supabase)
- Session history pulled from Supabase (handles old + new data formats)
- Lift progress chart by exercise
- Delete session with confirmation

## Program
PPL × 2: Push A, Pull A, Legs A, Push B, Pull B, Legs B

## Wishlist / Known Issues
- Analytics: revisit with more data (volume trends, RPE fatigue detection, streak calendar)
- Auto-progression suggestions (RPE-based weight recommendations after each session)
- Multi-user auth (Supabase RLS + login screen) when ready to add wife/others
- Settings screen (sound on/off, program switcher, reset start date)
- Capacitor wrapper for true native haptics when going native app route
