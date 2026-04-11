# Session 3 Design: Groups, Activity Feed, Persistent Auth & PWA Polish

**Date:** 2026-04-11  
**Status:** Approved

---

## Overview

Session 3 adds five interconnected features to the existing Vite + React + Tailwind + shadcn/ui + Supabase app:

1. OTP code login (replace magic link)
2. Persistent auth (stay logged in indefinitely)
3. PWA polish (no Safari URL bar, standalone mode)
4. Groups (create/join, member lists, invite codes)
5. Activity feed (Strava-style workout cards with drill-down)

---

## Feature 1: OTP Code Login

### Problem
Magic link auth opens Safari on iOS — a separate context from the installed PWA, breaking the session flow.

### Solution
Replace magic links with a 6-digit email OTP typed directly into the app. Supabase supports this via `signInWithOtp` without a `emailRedirectTo`, which switches it to code mode instead of link mode.

### LoginScreen.jsx — full rewrite

**Step 1 — Email entry:**
- App icon + "Hybrid" wordmark
- Heading: "Sign in", subtext: "We'll send a code to your email"
- `type="email"` input, auto-focused, large
- "Send Code" button — full width, accent, loading state
- Error message below input on failure
- On success: transition to Step 2 in-place (no navigation)

```js
await supabase.auth.signInWithOtp({
  email,
  options: { shouldCreateUser: true }
  // No emailRedirectTo → triggers code mode
})
```

**Step 2 — Code entry:**
- Back button → returns to Step 1, clears email
- Heading: "Check your email", subtext shows email address
- 6 individual single-character input boxes in a row
  - `type="tel"` (numeric keyboard on iOS, no decimal)
  - Each box ~52×60px, `bg-bg-tertiary`, rounded-xl, `border-accent` on focus
  - Auto-advance focus on digit entry
  - Backspace on empty box moves focus back
  - Paste of 6-digit string fills all boxes
  - Auto-submit on 6th digit (no button tap required)
- "Verify" button below (disabled until 6 digits filled — fallback for non-auto-submit)
- "Resend code" link — re-calls `signInWithOtp`, shows "Code resent" confirmation
- Error on invalid/expired code
- On success: `onAuthStateChange` fires `SIGNED_IN` → `useAuth` updates → App.jsx transitions to main app

```js
const { error } = await supabase.auth.verifyOtp({
  email,
  token: sixDigitCode,
  type: 'email'
})
```

### OtpInput.jsx — new reusable component

`src/components/auth/OtpInput.jsx`

Props: `length` (default 6), `onComplete(code: string)`, `disabled`

Renders N individual input boxes. Handles: digit entry, backspace, paste, auto-advance, auto-submit on last digit.

### Delete MagicLinkSent.jsx

No longer needed. Remove entirely.

---

## Feature 2: Persistent Auth

### Problem
Users must stay signed in indefinitely on a device with no re-login on every visit.

### Fixes

**lib/supabase.js** — explicit persistence config:
```js
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,  // no redirect URLs with OTP code flow
      storageKey: 'hybrid-auth-token',
    }
  }
)
```

**useAuth.js** — hardened session restore:
- `getSession()` on mount to restore from localStorage
- `onAuthStateChange` listener for OTP verify success, sign out, token refresh
- `loading: true` until session is determined
- `signOut()` calls `supabase.auth.signOut()` + `queryClient.clear()`

**App.jsx** — show full-screen `LoadingSpinner` while `loading` is true. Never render `LoginScreen` until loading is false AND user is confirmed null. Prevents login flash on cold open.

**SettingsTab.jsx** — sign out button wired to `signOut()` from `useAuth`. Styled `text-danger` with logout icon, at bottom of settings list. (Button already exists visually; wire it up.)

---

## Feature 3: PWA Polish

### index.html meta tags (inside `<head>`):
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Hybrid">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0f1117">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<meta name="format-detection" content="telephone=no">
```

### public/manifest.json:
```json
{
  "name": "Hybrid Strength Tracker",
  "short_name": "Hybrid",
  "description": "Personal strength training tracker",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f1117",
  "theme_color": "#0f1117",
  "icons": [
    { "src": "/icon.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### index.css additions:
```css
html, body {
  overscroll-behavior: none;
  -webkit-text-size-adjust: 100%;
  height: 100%;
  overflow: hidden;
}

#root {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

**User note:** After deploying, the user must remove the existing home screen icon and re-add from Safari for standalone mode to take effect.

---

## Feature 4: Groups

### Database tables (already in Supabase)
- `groups` — id, name, description, invite_code, created_by, created_at
- `group_members` — group_id, user_id, role, joined_at
- `profiles` — id, display_name, avatar_url, is_private, created_at

### GroupsTab.jsx — new component replacing App.jsx stub

**Empty state (no groups):**
- Header: "Groups"
- SVG empty state (two person silhouettes)
- Heading: "Train Together", subtext about sharing workouts
- "Create a Group" (filled accent) + "Join with Code" (outlined)

**With groups:**
- Header: "Groups" + "+" icon button
- List of `GroupCard` components
- Each GroupCard: group name, member count, last activity date, chevron right
- Tap → navigate to `/groups/:groupId`

### Create Group flow
- Opens a Dialog
- Inputs: group name (required), description (optional, multiline)
- On create: insert into `groups` (with `created_by: user.id`), then insert into `group_members` as `'admin'`
- `invite_code` generated by DB (`substring(md5(random()::text), 1, 8)`)
- Navigate to new GroupDetailScreen on success

### Join Group flow
- Opens a Dialog
- Input: 8-character invite code
- Query `groups` where `invite_code = input`
- If found: insert into `group_members` as `'member'`, navigate to GroupDetailScreen
- If not found: "No group found with that code"

### GroupDetailScreen.jsx — new full screen

Header: back button + group name + (admin only) settings icon

Sections:
1. **Invite banner** — "Invite Code: XXXXXXXX" + copy-to-clipboard, subtext
2. **Members list** — avatar initial + display name + "Admin" badge, member count in header, joined date as secondary text
3. **Group Feed** — WorkoutActivityCards from all group members (see Feature 5)

**Leave Group:**
- Non-admin: "..." menu in header
- Admin: same, with warning ("Leaving will transfer admin or delete group if you are the only member")
- If other members exist: transfer admin role to the earliest-joined non-admin member (sort `group_members` by `joined_at` asc, pick first non-self)
- If last member: delete `groups` row (cascades to `group_members` via FK)
- Confirmation Dialog before executing

### hooks/useGroups.js — new file

Exports:
- `useGroups()` — queries group_members + groups for current user
- `useGroupDetail(groupId)` — queries single group detail
- `useCreateGroup()` — mutation, invalidates `['groups']` on success
- `useJoinGroup()` — mutation, invalidates `['groups']` on success
- `useLeaveGroup()` — mutation, invalidates `['groups']` on success

`fetchUserGroups` query:
```js
supabase
  .from('group_members')
  .select(`
    role, joined_at,
    groups (
      id, name, description, invite_code, created_by, created_at,
      group_members ( count )
    )
  `)
```

### Routing additions (App.jsx)
- `/groups` → `GroupsTab` (list view)
- `/groups/:groupId` → `GroupDetailScreen` (full screen, back to groups tab)

---

## Feature 5: Activity Feed

### Activity row shape (Supabase `activity` table)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "session_id": 123,
  "type": "workout",
  "summary": {
    "sessionName": "Push A",
    "programId": "ppl-x2",
    "totalSets": 18,
    "totalVolume": 9240,
    "durationSeconds": 3720,
    "prs": [
      { "exercise": "Barbell Bench Press", "weight": 102.5, "reps": 5, "e1RM": 119.2 }
    ],
    "displayDate": "2026-04-11T14:30:00Z"
  },
  "created_at": "timestamp"
}
```

### Writing activity on workout save

**PR detection approach:** At workout end (when session is saved), compare the current session's best e1RM per exercise against all prior sessions' data. A PR = new e1RM > previous best for that exercise. Computed client-side before writing the activity row. Old activity rows with the old summary shape are not supported and may render incorrectly — that's acceptable.

The updated `writeActivity` call receives the full summary shape including `prs`, `totalSets`, `durationSeconds`, `displayDate`, and `programId`. This happens in `useSessions.js` `useSaveSession` mutation.

### WorkoutActivityCard.jsx — new component

Strava-style summary card. Two modes via `compact` prop:
- **Default (feed):** avatar + name + timestamp, session name + program info, stats row (sets / volume / duration), PR badges
- **Compact (HomeScreen):** name + date + volume inline, no stats row

Layout (default):
```
┌─────────────────────────────────────────┐
│  [Avatar] Jason          Today, 2:30 PM │
│  Push A                    [PUSH badge] │
│  PPL × 2 · Block 2 · Week 3            │
│  ┌──────────┬──────────┬─────────────┐  │
│  │ 18 sets  │ 9,240 lb │  1h 02m     │  │
│  └──────────┴──────────┴─────────────┘  │
│  🏆 PR: Bench Press — 119.2 kg e1RM    │
└─────────────────────────────────────────┘
```

- Avatar: initial circle with accent background
- PR section: only shown if `prs.length > 0`, up to 2 PRs, "+N more" if additional
- Tap → opens `SessionDetailSheet`
- Card: `bg-bg-card`, rounded-2xl, `border-bg-tertiary`

### SessionDetailSheet.jsx — new component

`SlideUpSheet` at ~90% height. Queries `sessions` table by `session_id` on open.

Content:
- Header: session name + tag pill + date
- Duration + total volume summary row
- Per-exercise breakdown:
  - Exercise name (bold) + PR badge if applicable
  - Each set: "Set 1 — 100kg × 5 reps @ RPE 7.5"
  - Total volume per exercise

### Group feed query — useGroupActivity(groupId)

```js
// 1. Get member user_ids for this group
// 2. Fetch activity .in('user_id', memberIds) ordered by created_at desc, limit 50
// 3. Join profiles (display_name, avatar_url, is_private)
// 4. Filter out private profiles client-side
// staleTime: 2 min
```

Shown in `GroupDetailScreen`.

### HomeScreen upgrade

Replace the hardcoded "Recent Activity" strip with real data from `activity` table. Show user's own last 3 workouts as `WorkoutActivityCard` with `compact` prop.

---

## Component Checklist

### New files
- `src/components/auth/OtpInput.jsx`
- `src/components/groups/GroupsTab.jsx`
- `src/components/groups/GroupCard.jsx`
- `src/components/groups/GroupDetailScreen.jsx`
- `src/components/groups/WorkoutActivityCard.jsx`
- `src/components/groups/SessionDetailSheet.jsx`
- `src/hooks/useGroups.js`

### Deleted files
- `src/components/auth/MagicLinkSent.jsx`

### Modified files
- `src/components/auth/LoginScreen.jsx` — full rewrite for OTP flow
- `src/lib/supabase.js` — add auth persistence config
- `src/hooks/useAuth.js` — harden session restore, signOut with query clear
- `src/App.jsx` — loading state, groups routing
- `index.html` — Apple PWA meta tags
- `src/index.css` — overscroll/overflow fixes
- `public/manifest.json` — standalone display, correct theme
- `src/components/home/HomeScreen.jsx` — real activity feed
- `src/components/settings/SettingsTab.jsx` — wire sign out
- `src/hooks/useSessions.js` — full activity summary shape + PR detection

---

## Clarifications (from design session)

1. **PR detection** — computed at workout end (save time), client-side, comparing current session's best e1RM per exercise against all prior sessions.
2. **Old activity rows** — no backward compatibility. Old rows may render incorrectly; that's fine (pre-launch dev environment).
