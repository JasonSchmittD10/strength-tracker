# Settings Tab Rebuild

**Date:** 2026-04-28  
**Source:** Figma node 188:6514 (Captain Offshore)

## Overview

Complete rebuild of the Settings tab to match the new Figma design. The current tab has all settings inline (editable fields, toggles); the new design converts the tab into a dashboard-style overview that routes into three dedicated sub-screens.

## Architecture

**Approach:** Flat routes with a shared sub-screen header wrapper (Option A).

Sub-screens are added as flat routes outside the `MainApp` layout (no `BottomNav`), matching the existing pattern for `/workout` and `/groups/:groupId`. A thin `SettingsSubScreen` wrapper component provides the back arrow + title header shared by all three sub-screens.

## Files Changed

| File | Change |
|------|--------|
| `src/components/settings/SettingsTab.jsx` | Full rebuild |
| `src/components/settings/AccountScreen.jsx` | New |
| `src/components/settings/PreferencesScreen.jsx` | New |
| `src/components/settings/PrivacyScreen.jsx` | New |
| `src/components/settings/SettingsSubScreen.jsx` | New (shared wrapper) |
| `src/App.jsx` | Add three new routes |
| `src/lib/utils.js` | Extract + export `computeWeekStreak` |
| `src/components/home/HomeScreen.jsx` | Import `computeWeekStreak` from utils |
| `src/assets/icons/` | Add Account, Toggles, Lock SVGs |

## Main Settings Tab

**File:** `src/components/settings/SettingsTab.jsx`

Layout (scrollable, `px-4` padding, `pt` below status bar):

1. **Avatar** — 32px circle, top-left. Shows `profile.avatar_url` or initials fallback. `onClick` navigates to `/settings/account`.

2. **Stats banner** — Full-width card with orange gradient border and background matching Figma (`linear-gradient` from `rgba(0,0,0,0.2)` to `rgba(242,166,85,0.2)`), `border border-accent/30`, `rounded-xl`. Three equal columns separated by `bg-[#2d2d2d] w-px` dividers:
   - **Sessions** — `sessions.length`
   - **LB Moved** — `sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0)`, formatted via existing `formatVolume()`
   - **Week Streak** — `computeWeekStreak(sessions)` (extracted from HomeScreen)
   - Each stat: value in `font-display text-4xl text-white`, label in `font-secondary text-xs text-muted uppercase`

3. **PRs section** — Section label "PRs" (`text-white/60 text-lg font-semibold`). 2×2 grid of dark cards (`bg-white/5 border border-white/10 rounded-xl p-4`). Each card: exercise name (small muted caps) above e1RM value (`font-display text-4xl`). Data from existing `usePRs()`. Shows top 4 PRs by e1RM.

4. **Current Program section** — Section label "Current Program". Single card (`bg-white/5 border border-white/10 rounded-xl p-4`) containing:
   - Program name in `font-display text-[32px]`
   - Tag pills (`border border-white/10 rounded px-1.5 py-0.5 text-xs text-white/40`) — level and focus from `useProgramConfig()`
   - Program description in `text-muted text-base`
   - If no program active: prompt to select one

5. **Settings section** — Section label "Settings". Three stacked nav tiles (`bg-[#222] border border-[#383838] rounded-xl p-4 flex items-center gap-3`):
   - **My Account** — Account icon, title "My Account", subtitle "Email, password, sign out" → `/settings/account`
   - **Preferences** — Toggles icon, title "Preferences", subtitle "Units, week start" → `/settings/preferences`
   - **Privacy** — Lock icon, title "Privacy", subtitle "Group visibility, activity sharing" → `/settings/privacy`
   - No chevron in Figma; tiles are `cursor-pointer` with `onClick` navigate

6. **Logout button** — Centered, small ghost button (`bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white font-bold`). Calls `signOut()` from `useAuth()`.

7. **App version** — `text-muted text-base text-center`. Reads from `package.json`: `import pkg from '../../package.json'` → `APP VERSION: {pkg.version}`.

## Sub-screen Wrapper

**File:** `src/components/settings/SettingsSubScreen.jsx`

Props: `title` (string), `children`.

Renders:
- Header bar: back arrow (left) + centered title. Back arrow calls `useNavigate()(-1)`.
- Scrollable content area below.
- No `BottomNav`.

## My Account Sub-screen

**File:** `src/components/settings/AccountScreen.jsx`  
**Route:** `/settings/account`

Uses `SettingsSubScreen` with title "My Account". Content using existing `Section`/row components:

- **Avatar upload** — circular photo with Camera icon overlay, file input, same logic as current SettingsTab
- **Display name** — inline editable row with save/cancel, same pattern as current SettingsTab
- **Email** — read-only `ActionRow` (no chevron, just display)
- **Sign Out** — `DestructiveButton` at bottom

> Note: The settings tile subtitle reads "Email, password, sign out" (matching Figma copy), but no password-change UI is in scope. Password change is a future enhancement.

Data: `useAuth()`, `useProfile()`, `useUpdateProfile()`.

## Preferences Sub-screen

**File:** `src/components/settings/PreferencesScreen.jsx`  
**Route:** `/settings/preferences`

Uses `SettingsSubScreen` with title "Preferences". Content:

- **Weight unit** — `SegmentedRow` label "Weight" options `['lbs', 'kg']`
- **Distance unit** — `SegmentedRow` label "Distance" options `['mi', 'km']`
- **Week starts on** — `SegmentedRow` label "Week Starts" options `['Mon', 'Sun', 'Sat']` (maps to `week_start_day` values 1, 0, 6)

Data: `useProfile()`, `useUpdateProfile()`.

## Privacy Sub-screen

**File:** `src/components/settings/PrivacyScreen.jsx`  
**Route:** `/settings/privacy`

Uses `SettingsSubScreen` with title "Privacy". Content:

- **Private Profile** — `ToggleRow` label "Private Profile", subtitle "Hide your activity from group members", bound to `profile.is_private`

Data: `useProfile()`, `useUpdateProfile()`.

## Utilities

**`src/lib/utils.js`** — Add export:
```js
export function computeWeekStreak(sessions) { ... }
```
Exact logic moved from `HomeScreen.jsx` (lines 30–43). `HomeScreen` updated to import from utils instead.

## Routing

**`src/App.jsx`** — Add inside the router, outside `MainApp`:
```jsx
<Route path="/settings/account" element={<AccountScreen />} />
<Route path="/settings/preferences" element={<PreferencesScreen />} />
<Route path="/settings/privacy" element={<PrivacyScreen />} />
```

## Icons

Three SVG icons from Figma downloaded and committed to `src/assets/icons/`:
- `account.svg` (node 188:6748)
- `toggles.svg` (node 188:6797)
- `lock.svg` (node 192:6850)

Imported as React components or `<img>` tags, consistent with existing icon usage in the project.

## Data Dependencies

| Data | Source | Already exists? |
|------|--------|----------------|
| Session count | `useSessions()` | Yes |
| Total LB moved | `useSessions()` + `.reduce()` | Yes (per-session `totalVolume`) |
| Week streak | `computeWeekStreak()` | Yes (needs extraction) |
| PRs | `usePRs()` | Yes |
| Current program | `useProgramConfig()` | Yes |
| Profile | `useProfile()` | Yes |
| Auth | `useAuth()` | Yes |

No new hooks, no schema changes, no new dependencies.
