# React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the single-file vanilla JS strength tracker PWA into a React + Vite + Tailwind + shadcn/ui application with Supabase auth, deployable to Vercel.

**Architecture:** Hash-router SPA with bottom-tab navigation, TanStack Query for server state, Supabase magic-link auth gate before the main app. All business logic ported verbatim from `index.html` into focused lib modules and React hooks.

**Tech Stack:** React 18, Vite, Tailwind CSS v3, shadcn/ui, Supabase JS v2, React Router v6 (hash), TanStack Query v5

**IMPORTANT — use actual exercise names from source:** The PROGRAMS registry and EXERCISE_LIBRARY in this plan use the canonical names from the existing `index.html` (e.g. `"Overhead Press (Barbell)"`, `"Back Squat (Barbell)"`, `"Face Pull (Cable)"`). The spec's "Programs Data" section has some differences — always defer to what's in the source file.

---

## File Map

```
/
├── index.html                         (Vite entry — replace existing)
├── vite.config.js                     (create)
├── tailwind.config.js                 (create)
├── postcss.config.js                  (create)
├── package.json                       (create)
├── vercel.json                        (create)
├── .env.local                         (create)
├── public/
│   ├── icon.png                       (copy from repo root)
│   ├── manifest.json                  (update start_url)
│   └── sw.js                          (copy from repo root)
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── lib/
    │   ├── supabase.js
    │   ├── programs.js
    │   ├── exercises.js
    │   └── utils.js
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useSessions.js
    │   ├── useProgram.js
    │   └── useProfile.js
    └── components/
        ├── auth/
        │   ├── LoginScreen.jsx
        │   └── MagicLinkSent.jsx
        ├── home/
        │   └── HomeScreen.jsx
        ├── workout/
        │   ├── WorkoutScreen.jsx
        │   ├── ExerciseBlock.jsx
        │   ├── SetRow.jsx
        │   ├── RestTimer.jsx
        │   └── WorkoutSummary.jsx
        ├── history/
        │   ├── HistoryTab.jsx
        │   └── SessionCard.jsx
        ├── progress/
        │   ├── ProgressTab.jsx
        │   └── ExerciseChart.jsx
        ├── settings/
        │   └── SettingsTab.jsx
        └── shared/
            ├── BottomNav.jsx
            ├── SlideUpSheet.jsx
            └── LoadingSpinner.jsx
```

---

## Task 1: Scaffold project files

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html` (overwrite existing)
- Create: `.env.local`
- Create: `vercel.json`
- Create: `public/manifest.json` (update from repo root)
- Create: `src/index.css`
- Create: `src/main.jsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "hybrid-strength-tracker",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 3: Create tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#0f1117',
          secondary: '#1a1d27',
          tertiary:  '#22263a',
          card:      '#1e2235',
        },
        accent: {
          DEFAULT: '#6c63ff',
          hover:   '#5a52e0',
          dim:     'rgba(108,99,255,0.15)',
        },
        text: {
          primary:   '#f0f2ff',
          secondary: '#8b8fa8',
          muted:     '#5a5e7a',
        },
        push:    { DEFAULT: '#ff6b6b', dim: 'rgba(255,107,107,0.15)' },
        pull:    { DEFAULT: '#4ecdc4', dim: 'rgba(78,205,196,0.15)' },
        legs:    { DEFAULT: '#ffe66d', dim: 'rgba(255,230,109,0.15)' },
        success: '#4ade80',
        warning: '#fbbf24',
        danger:  '#f87171',
      },
      fontFamily: {
        sans: ['Syne', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl:   '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Create postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Create index.html (overwrite existing)**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Hybrid Strength Tracker</title>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#1a1d27" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 6: Create .env.local**

```
VITE_SUPABASE_URL=https://yawoliebqdxrmkygawqj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhd29saWVicWR4cm1reWdhd3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODU1NDUsImV4cCI6MjA4OTg2MTU0NX0.VYiuBLZVn_sr0mRfwbY5AZVw3Ozu2SBKcH0Qo9me1vk
```

- [ ] **Step 7: Create vercel.json**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 8: Create public/manifest.json**

```json
{
  "name": "Hybrid Strength Tracker",
  "short_name": "Hybrid",
  "description": "Personal strength training tracker with PPL programming",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f1117",
  "theme_color": "#1a1d27",
  "icons": [
    {
      "src": "/icon.png",
      "sizes": "200x200",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

Copy `icon.png` from repo root to `public/icon.png`. Copy `sw.js` from repo root to `public/sw.js`.

- [ ] **Step 9: Create src/index.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-bg-primary text-text-primary font-sans;
    -webkit-font-smoothing: antialiased;
  }
  * { box-sizing: border-box; }
}

@layer utilities {
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .safe-top    { padding-top:    env(safe-area-inset-top); }
}
```

- [ ] **Step 10: Create src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5 },
  },
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
```

- [ ] **Step 11: Install dependencies**

```bash
cd /Users/jasonschmitt/strength-tracker/.claude/worktrees/beautiful-hellman
npm install
```

Expected: dependencies install without error.

- [ ] **Step 12: Commit**

```bash
git add package.json vite.config.js tailwind.config.js postcss.config.js index.html .env.local vercel.json public/manifest.json public/sw.js public/icon.png src/index.css src/main.jsx
git commit -m "feat: scaffold vite+react project with tailwind and dependencies"
```

---

## Task 2: Core lib modules

**Files:**
- Create: `src/lib/supabase.js`
- Create: `src/lib/utils.js`
- Create: `src/lib/programs.js`
- Create: `src/lib/exercises.js`

- [ ] **Step 1: Create src/lib/supabase.js**

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

- [ ] **Step 2: Create src/lib/utils.js**

```js
export function epley(weight, reps) {
  if (!weight || !reps || reps <= 0) return null
  const w = parseFloat(weight), r = parseFloat(reps)
  if (isNaN(w) || isNaN(r) || r <= 0) return null
  return Math.round(w * (1 + r / 30))
}

export function totalVolume(exercises) {
  let vol = 0
  ;(exercises || []).forEach(ex => {
    ;(ex.sets || []).forEach(s => {
      const w = parseFloat(s.weight), r = parseFloat(s.reps)
      if (w > 0 && r > 0 && s.completed) vol += w * r
    })
  })
  return vol
}

export function formatVolume(vol) {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${Math.round(vol / 1_000)}k`
  return String(Math.round(vol))
}

export function formatDuration(seconds) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatDate(dateStr, short = false) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterdayDate = new Date(today)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'
  if (short) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function weekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().split('T')[0]
}
```

- [ ] **Step 3: Create src/lib/programs.js**

Port the PROGRAMS registry exactly from `index.html` lines 1521–1616. Key fields per exercise: `name`, `sets`, `reps`, `rest`, `restLabel`. Include all helpers.

```js
export const PROGRAMS = {
  'ppl-x2': {
    id: 'ppl-x2',
    name: 'PPL × 2',
    description: 'Push / Pull / Legs twice per week — strength & hypertrophy',
    blockStructure: {
      weeksPerBlock: 4,
      deloadWeek: 4,
      blockNames: ['Strength & Size', 'Strength & Size', 'Strength & Size'],
      phaseByWeek: { 1: 'Foundation', 2: 'Accumulation', 3: 'Intensification', 4: 'Deload' },
    },
    sessionOrder: ['push-a', 'pull-a', 'legs-a', 'push-b', 'pull-b', 'legs-b'],
    sessions: [
      {
        id: 'push-a', name: 'Push A', tag: 'push', tagLabel: 'PUSH',
        focus: 'Strength · Chest, Shoulders, Triceps',
        exercises: [
          { name: 'Barbell Bench Press',        sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Overhead Press (Barbell)',    sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Incline Dumbbell Press',      sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Lateral Raise',         sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
          { name: 'Tricep Pushdown (Cable)',     sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Overhead Tricep Extension',   sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'pull-a', name: 'Pull A', tag: 'pull', tagLabel: 'PULL',
        focus: 'Strength · Back, Biceps',
        exercises: [
          { name: 'Weighted Pull-Up',            sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Barbell Row (Pronated)',       sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Chest-Supported Row (DB)',     sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Face Pull (Cable)',            sets: 3, reps: '15–20', rest: 60,  restLabel: '1 min' },
          { name: 'Barbell Curl',                sets: 3, reps: '8–10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Hammer Curl (DB)',             sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'legs-a', name: 'Legs A', tag: 'legs', tagLabel: 'LEGS',
        focus: 'Strength · Quads, Hamstrings, Glutes',
        exercises: [
          { name: 'Back Squat (Barbell)',         sets: 4, reps: '4–6',    rest: 240, restLabel: '4 min' },
          { name: 'Romanian Deadlift',            sets: 4, reps: '6–8',    rest: 180, restLabel: '3 min' },
          { name: 'Leg Press',                    sets: 3, reps: '10–12',  rest: 120, restLabel: '2 min' },
          { name: 'Leg Curl (Machine)',            sets: 3, reps: '10–12',  rest: 90,  restLabel: '90 sec' },
          { name: 'Walking Lunge (DB)',            sets: 3, reps: '12 each',rest: 90,  restLabel: '90 sec' },
          { name: 'Standing Calf Raise',           sets: 4, reps: '15–20',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'push-b', name: 'Push B', tag: 'push', tagLabel: 'PUSH',
        focus: 'Hypertrophy · Chest, Shoulders, Triceps',
        exercises: [
          { name: 'Incline Barbell Press',        sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Dumbbell Shoulder Press',      sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Fly (Low-to-High)',      sets: 3, reps: '12–15', rest: 90,  restLabel: '90 sec' },
          { name: 'Lateral Raise (DB)',           sets: 4, reps: '15–20', rest: 60,  restLabel: '1 min' },
          { name: 'Close-Grip Bench Press',       sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Skull Crusher (EZ Bar)',       sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'pull-b', name: 'Pull B', tag: 'pull', tagLabel: 'PULL',
        focus: 'Hypertrophy · Back, Biceps',
        exercises: [
          { name: 'Lat Pulldown (Wide Grip)',     sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Row (Neutral Grip)',     sets: 4, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Single-Arm DB Row',            sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Straight-Arm Pulldown',        sets: 3, reps: '12–15', rest: 90,  restLabel: '90 sec' },
          { name: 'Incline DB Curl',              sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Cable Curl (Rope)',             sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'legs-b', name: 'Legs B', tag: 'legs', tagLabel: 'LEGS',
        focus: 'Hypertrophy · Quad-Dominant + Posterior',
        exercises: [
          { name: 'Bulgarian Split Squat (DB)',   sets: 4, reps: '8–10 each', rest: 180, restLabel: '3 min' },
          { name: 'Trap Bar Deadlift',            sets: 4, reps: '6–8',       rest: 210, restLabel: '3.5 min' },
          { name: 'Hack Squat / Leg Press',       sets: 3, reps: '12–15',     rest: 90,  restLabel: '90 sec' },
          { name: 'Nordic Curl / Lying Leg Curl', sets: 3, reps: '8–10',      rest: 90,  restLabel: '90 sec' },
          { name: 'Goblet Squat (Tempo)',         sets: 3, reps: '12',         rest: 90,  restLabel: '90 sec' },
          { name: 'Seated Calf Raise',            sets: 4, reps: '15–20',     rest: 60,  restLabel: '1 min' },
        ],
      },
    ],
  },
}

export function getActiveProgram(config) {
  const id = config?.activeProgramId || 'ppl-x2'
  return PROGRAMS[id] || PROGRAMS['ppl-x2']
}

export function getBlockAndWeek(config) {
  if (!config?.programStartDate) return null
  const program = getActiveProgram(config)
  const { weeksPerBlock, deloadWeek, phaseByWeek } = program.blockStructure
  const start = new Date(config.programStartDate + 'T00:00:00')
  const daysSinceStart = Math.floor((Date.now() - start) / 86400000)
  const weeksElapsed = Math.floor(daysSinceStart / 7)
  const weekInBlock = (weeksElapsed % weeksPerBlock) + 1
  const blockNumber = Math.floor(weeksElapsed / weeksPerBlock) + 1
  const isDeload = weekInBlock === deloadWeek
  const phaseName = phaseByWeek[weekInBlock] || `Week ${weekInBlock}`
  return { blockNumber, weekInBlock, weeksPerBlock, isDeload, phaseName }
}

export function getNextSession(config, recentSessions) {
  const program = getActiveProgram(config)
  const order = program.sessionOrder
  if (!recentSessions?.length) return program.sessions[0]
  const last = recentSessions[0]
  const lastIdx = order.indexOf(last.sessionId || 'push-a')
  const nextId = order[(lastIdx + 1) % order.length]
  return program.sessions.find(s => s.id === nextId) || program.sessions[0]
}
```

- [ ] **Step 4: Create src/lib/exercises.js**

Port EXERCISE_LIBRARY from `index.html` lines 3123–3690. Each entry has `muscles`, `pattern`, `cues`, and optionally `notes`. Also port NAME_ALIASES verbatim.

```js
export const NAME_ALIASES = {
  'Barbell Overhead Press':             'Overhead Press (Barbell)',
  'Dumbbell Incline Press':             'Incline Dumbbell Press',
  'Cable Tricep Pushdown':              'Tricep Pushdown (Cable)',
  'Dumbbell Overhead Tricep Extension': 'Overhead Tricep Extension',
  'Pull-up':                            'Weighted Pull-Up',
  'Barbell Bent-over Row':              'Barbell Row (Pronated)',
  'Machine Chest-supported Row':        'Chest-Supported Row (DB)',
  'Cable Face Pull':                    'Face Pull (Cable)',
  'Barbell Bicep Curl':                 'Barbell Curl',
  'Dumbbell Hammer Curl':               'Hammer Curl (DB)',
  'Barbell Back Squat':                 'Back Squat (Barbell)',
  'Barbell Romanian Deadlift':          'Romanian Deadlift',
  'Machine Leg Press':                  'Leg Press',
  'Machine Leg Curl':                   'Leg Curl (Machine)',
  'Dumbbell Walking Lunge':             'Walking Lunge (DB)',
  'Machine Standing Calf Raise':        'Standing Calf Raise',
  'Barbell Incline Bench Press':        'Incline Barbell Press',
  'Cable Chest Fly':                    'Cable Fly (Low-to-High)',
  'Dumbbell Lateral Raise':             'Lateral Raise (DB)',
  'Barbell Close Grip Bench Press':     'Close-Grip Bench Press',
  'EZ Bar Skull Crusher':               'Skull Crusher (EZ Bar)',
  'Cable Lat Pulldown':                 'Lat Pulldown (Wide Grip)',
  'Cable Seated Row':                   'Cable Row (Neutral Grip)',
  'Dumbbell Single-arm Row':            'Single-Arm DB Row',
  'Cable Straight-arm Pulldown':        'Straight-Arm Pulldown',
  'Dumbbell Incline Curl':              'Incline DB Curl',
  'Cable Curl':                         'Cable Curl (Rope)',
  'Barbell Bulgarian Split Squat':      'Bulgarian Split Squat (DB)',
  'Barbell Hack Squat':                 'Hack Squat / Leg Press',
  'Nordic Hamstring Curl':              'Nordic Curl / Lying Leg Curl',
  'Dumbbell Goblet Squat':              'Goblet Squat (Tempo)',
  'Barbell Seated Calf Raise':          'Seated Calf Raise',
  'Pull-Up':                            'Weighted Pull-Up',
  'Pull Up':                            'Weighted Pull-Up',
  'Pullup':                             'Weighted Pull-Up',
}

export function normalizeExerciseName(name) {
  return NAME_ALIASES[name] || name
}

// EXERCISE_LIBRARY — port verbatim from index.html lines 3123–3690.
// Each key is the canonical exercise name. Shape:
// { muscles: { primary: string[], secondary: string[] }, pattern: string, cues: string[], notes?: string }
export const EXERCISE_LIBRARY = {
  'Barbell Bench Press': {
    muscles: { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'] },
    pattern: 'Horizontal Push',
    cues: ['Retract and depress shoulder blades before unracking', 'Bar path: slight arc from lower chest to over shoulders', 'Drive feet into floor, maintain arch', 'Elbows ~45–60° from torso — not flared, not tucked'],
    notes: 'Primary strength marker for horizontal push.',
  },
  // ... copy all remaining entries from index.html EXERCISE_LIBRARY ...
}

export async function migrateExerciseNames(supabase) {
  console.log('[migrate] Loading all sessions...')
  const { data: rows, error } = await supabase
    .from('sessions')
    .select('id, data')
    .order('created_at', { ascending: false })

  if (error) { console.error('[migrate] Load error', error); return }

  let updated = 0, unchanged = 0
  for (const row of rows) {
    const s = row.data
    if (!s?.exercises) { unchanged++; continue }

    let changed = false
    const normalizedExercises = s.exercises.map(ex => {
      const canonical = normalizeExerciseName(ex.name)
      if (canonical !== ex.name) { changed = true; return { ...ex, name: canonical } }
      return ex
    })

    if (!changed) { unchanged++; continue }

    const { error: patchErr } = await supabase
      .from('sessions')
      .update({ data: { ...s, exercises: normalizedExercises } })
      .eq('id', row.id)

    if (patchErr) console.error(`[migrate] PATCH failed for ${row.id}:`, patchErr)
    else updated++
  }
  console.log(`[migrate] Done. ${updated} updated, ${unchanged} unchanged.`)
}
```

> **Note:** The EXERCISE_LIBRARY body above shows the shape. During implementation, copy all ~33 entries verbatim from `index.html` lines 3123–3690.

- [ ] **Step 5: Commit**

```bash
git add src/lib/
git commit -m "feat: add lib modules — supabase client, programs, exercises, utils"
```

---

## Task 3: Auth — useAuth hook + screens + App gate

**Files:**
- Create: `src/hooks/useAuth.js`
- Create: `src/components/auth/LoginScreen.jsx`
- Create: `src/components/auth/MagicLinkSent.jsx`
- Create: `src/App.jsx`
- Create: `src/components/shared/LoadingSpinner.jsx`

- [ ] **Step 1: Create src/components/shared/LoadingSpinner.jsx**

```jsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-bg-primary">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
```

- [ ] **Step 2: Create src/hooks/useAuth.js**

```js
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()

  return { user, session, loading, signOut }
}
```

- [ ] **Step 3: Create src/components/auth/LoginScreen.jsx**

```jsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import MagicLinkSent from './MagicLinkSent'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  if (sent) return <MagicLinkSent email={email} onBack={() => setSent(false)} onResend={handleSubmit} />

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <img src="/icon.png" alt="Hybrid" className="w-16 h-16 rounded-2xl mb-4" />
          <h1 className="font-sans text-3xl font-bold text-text-primary tracking-tight">Hybrid</h1>
          <p className="text-text-secondary text-sm mt-1">Strength Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent transition-colors"
            />
            {error && <p className="text-danger text-sm mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-base transition-colors"
          >
            {loading ? 'Sending…' : 'Send Magic Link'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/auth/MagicLinkSent.jsx**

```jsx
export default function MagicLinkSent({ email, onBack, onResend }) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-6">📬</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
        <p className="text-text-secondary text-sm mb-2">
          We sent a magic link to
        </p>
        <p className="text-text-primary font-medium mb-8">{email}</p>
        <button
          onClick={onResend}
          className="w-full border border-bg-tertiary text-text-secondary rounded-xl py-3 text-sm mb-4 hover:border-accent hover:text-text-primary transition-colors"
        >
          Resend link
        </button>
        <button
          onClick={onBack}
          className="text-text-muted text-sm hover:text-text-secondary transition-colors"
        >
          Use a different email
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create src/App.jsx**

```jsx
import { createHashRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import LoginScreen from '@/components/auth/LoginScreen'
import BottomNav from '@/components/shared/BottomNav'
import HomeScreen from '@/components/home/HomeScreen'
import HistoryTab from '@/components/history/HistoryTab'
import ProgressTab from '@/components/progress/ProgressTab'
import SettingsTab from '@/components/settings/SettingsTab'
import WorkoutScreen from '@/components/workout/WorkoutScreen'

function MainApp() {
  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}

function GroupsTab() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-6 mt-12">
      <div className="text-4xl mb-4">👥</div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Groups</h2>
      <p className="text-text-secondary text-sm">Coming soon — train with friends and share progress.</p>
    </div>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <MainApp />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomeScreen /> },
      { path: 'history', element: <HistoryTab /> },
      { path: 'progress', element: <ProgressTab /> },
      { path: 'groups', element: <GroupsTab /> },
      { path: 'settings', element: <SettingsTab /> },
      { path: 'workout', element: <WorkoutScreen /> },
    ],
  },
])

export default function App() {
  const { loading, session } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!session) return <LoginScreen />
  return <RouterProvider router={router} />
}
```

- [ ] **Step 6: Verify app boots**

```bash
npm run dev
```

Open the dev URL. Should see LoginScreen. No console errors.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: add auth flow — magic link login, session gate, app shell"
```

---

## Task 4: Shared components + BottomNav

**Files:**
- Create: `src/components/shared/BottomNav.jsx`
- Create: `src/components/shared/SlideUpSheet.jsx`

- [ ] **Step 1: Create src/components/shared/BottomNav.jsx**

```jsx
import { NavLink } from 'react-router-dom'
import { Home, Clock, TrendingUp, Users, Settings } from 'lucide-react'

const TABS = [
  { to: '/home',     icon: Home,       label: 'Home' },
  { to: '/history',  icon: Clock,      label: 'History' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/groups',   icon: Users,      label: 'Groups' },
  { to: '/settings', icon: Settings,   label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className="bg-bg-secondary border-t border-bg-tertiary safe-bottom flex-shrink-0">
      <div className="flex">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors relative ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-accent" />
                )}
                <Icon size={20} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create src/components/shared/SlideUpSheet.jsx**

```jsx
import { useEffect } from 'react'

export default function SlideUpSheet({ open, onClose, title, children, heightClass = 'h-[70vh]' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative bg-bg-secondary rounded-t-2xl ${heightClass} flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-bg-tertiary flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-bg-tertiary absolute top-2 left-1/2 -translate-x-1/2" />
          <h2 className="font-bold text-text-primary text-base">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/
git commit -m "feat: add BottomNav and SlideUpSheet shared components"
```

---

## Task 5: Data hooks

**Files:**
- Create: `src/hooks/useSessions.js`
- Create: `src/hooks/useProgram.js`
- Create: `src/hooks/useProfile.js`

- [ ] **Step 1: Create src/hooks/useSessions.js**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { normalizeExerciseName } from '@/lib/exercises'

function normalizeSession(row) {
  const d = row.data
  const base = { _id: row.id }
  if (d.sessionName && d.exercises) return { ...d, ...base }
  // Legacy format
  const exercises = (d.lifts || []).map(lift => ({
    name: lift.name,
    sets: (lift.sets || []).map(s => ({ weight: s.weight ?? '', reps: s.reps ?? '', rpe: s.rpe ?? '' })),
  }))
  return {
    ...base,
    id: d.id,
    sessionId: (d.type || 'push') + '-a',
    sessionName: d.day || d.sessionName || 'Session',
    date: d.date || new Date().toISOString().split('T')[0],
    duration: d.duration || null,
    notes: d.notes || '',
    exercises,
  }
}

async function fetchSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, data, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeSession)
}

async function saveSession(session) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ data: session })
    .select()
    .single()
  if (error) throw error
  return data
}

async function writeActivity({ sessionId, summary }) {
  const { error } = await supabase
    .from('activity')
    .insert({ session_id: sessionId, type: 'workout', summary })
  if (error) console.warn('activity write failed', error)
}

export function useSessions() {
  return useQuery({ queryKey: ['sessions'], queryFn: fetchSessions })
}

export function useSessionsByExercise(exerciseName) {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    select: sessions =>
      sessions
        .filter(s => s.exercises?.some(e => normalizeExerciseName(e.name) === normalizeExerciseName(exerciseName)))
        .map(s => ({
          ...s,
          exercises: s.exercises?.filter(e => normalizeExerciseName(e.name) === normalizeExerciseName(exerciseName)),
        })),
  })
}

export function useSaveSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (session) => {
      const saved = await saveSession(session)
      await writeActivity({ sessionId: saved.id, summary: { sessionName: session.sessionName, volume: session.totalVolume } })
      return saved
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })
}
```

- [ ] **Step 2: Create src/hooks/useProgram.js**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getActiveProgram, getBlockAndWeek, getNextSession } from '@/lib/programs'

const DEFAULT_CONFIG = { activeProgramId: 'ppl-x2', programStartDate: '2026-03-30' }

async function fetchConfig() {
  const { data, error } = await supabase
    .from('user_config')
    .select('data')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (data) return data.data
  // First run — seed default
  await supabase.from('user_config').insert({ data: DEFAULT_CONFIG })
  return DEFAULT_CONFIG
}

export function useProgram() {
  const { data: sessions } = useQuery({ queryKey: ['sessions'], enabled: false })

  return useQuery({
    queryKey: ['program'],
    queryFn: async () => {
      const config = await fetchConfig()
      const program = getActiveProgram(config)
      const blockInfo = getBlockAndWeek(config)
      return { config, program, blockInfo }
    },
    select: result => ({
      ...result,
      nextSession: getNextSession(result.config, sessions || []),
    }),
  })
}

export function useSaveConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config) => {
      await supabase.from('user_config').delete().neq('id', 0)
      const { error } = await supabase.from('user_config').insert({ data: config })
      if (error) throw error
      return config
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program'] }),
  })
}
```

- [ ] **Step 3: Create src/hooks/useProfile.js**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user.id),
    enabled: !!user?.id,
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }),
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat: add data hooks — useSessions, useProgram, useProfile"
```

---

## Task 6: HomeScreen

**Files:**
- Create: `src/components/home/HomeScreen.jsx`

- [ ] **Step 1: Create src/components/home/HomeScreen.jsx**

```jsx
import { useNavigate } from 'react-router-dom'
import { useSessions } from '@/hooks/useSessions'
import { useProgram } from '@/hooks/useProgram'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatDuration, formatVolume, totalVolume } from '@/lib/utils'

const TAG_COLORS = {
  push: 'bg-push/15 text-push border-push/30',
  pull: 'bg-pull/15 text-pull border-pull/30',
  legs: 'bg-legs/15 text-legs border-legs/30',
}

function TagPill({ tag, label }) {
  return (
    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || 'bg-accent/15 text-accent border-accent/30'}`}>
      {label}
    </span>
  )
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: sessions = [] } = useSessions()
  const { data: programData, isLoading } = useProgram()

  const { config, program, blockInfo, nextSession } = programData || {}
  const recent = sessions.slice(0, 3)

  function startSession(session) {
    navigate('/workout', { state: { session, programId: program?.id } })
  }

  const initial = user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="safe-top px-4 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <h1 className="font-bold text-2xl text-text-primary tracking-tight">Hybrid</h1>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold"
        >
          {initial}
        </button>
      </div>

      {/* Block info badge */}
      {blockInfo && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-text-muted font-medium">
            Block {blockInfo.blockNumber} · Week {blockInfo.weekInBlock} ·{' '}
            <span className={blockInfo.isDeload ? 'text-warning' : 'text-text-secondary'}>
              {blockInfo.phaseName}
            </span>
          </span>
        </div>
      )}

      {/* Next Up card */}
      {isLoading ? (
        <div className="bg-bg-card rounded-2xl p-5 mb-4 h-32 animate-pulse" />
      ) : nextSession && (
        <div className="bg-bg-card rounded-2xl border border-bg-tertiary p-5 mb-4">
          <div className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wider">Up Next</div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TagPill tag={nextSession.tag} label={nextSession.tagLabel} />
              </div>
              <div className="text-xl font-bold text-text-primary">{nextSession.name}</div>
              <div className="text-sm text-text-secondary mt-0.5">{nextSession.focus}</div>
              <div className="text-xs text-text-muted mt-1">{nextSession.exercises.length} exercises</div>
            </div>
          </div>
          {blockInfo?.isDeload && (
            <div className="text-xs text-warning mb-3">↓ Deload week — reduce loads ~10%</div>
          )}
          <button
            onClick={() => startSession(nextSession)}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Start Workout
          </button>
        </div>
      )}

      {/* Quick Start */}
      {program && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-text-secondary mb-2">Quick Start</div>
          <div className="grid grid-cols-3 gap-2">
            {program.sessions.map(s => (
              <button
                key={s.id}
                onClick={() => startSession(s)}
                className="bg-bg-card border border-bg-tertiary rounded-xl p-3 text-left hover:border-accent/50 transition-colors"
              >
                <TagPill tag={s.tag} label={s.tagLabel} />
                <div className="text-xs font-semibold text-text-primary mt-1.5">{s.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-text-secondary">Recent</div>
            <button onClick={() => navigate('/history')} className="text-xs text-accent">See all</button>
          </div>
          <div className="space-y-2">
            {recent.map((s, i) => (
              <div key={s._id || i} className="bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-primary">{s.sessionName}</div>
                  <div className="text-xs text-text-muted">{formatDate(s.date, true)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-secondary">{formatVolume(totalVolume(s.exercises))} kg</div>
                  {s.duration && <div className="text-xs text-text-muted">{formatDuration(s.duration)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/
git commit -m "feat: add HomeScreen with next-up card, quick start, recent activity"
```

---

## Task 7: WorkoutScreen — core

**Files:**
- Create: `src/components/workout/WorkoutScreen.jsx`
- Create: `src/components/workout/ExerciseBlock.jsx`
- Create: `src/components/workout/SetRow.jsx`

- [ ] **Step 1: Create src/components/workout/SetRow.jsx**

```jsx
import { Check } from 'lucide-react'

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]

export default function SetRow({ setNumber, set, onChange, onComplete, isNew }) {
  const { weight = '', reps = '', rpe = '', completed = false } = set

  function handleComplete() {
    if (!completed) onComplete()
    else onChange({ ...set, completed: false })
  }

  return (
    <div className={`flex items-center gap-2 py-2 ${completed ? 'opacity-60' : ''}`}>
      <span className="w-6 text-center text-xs text-text-muted font-medium">{setNumber}</span>

      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={e => onChange({ ...set, weight: e.target.value })}
        placeholder="kg"
        className="flex-1 min-w-0 bg-bg-tertiary rounded-lg px-2 py-2.5 text-center text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
      />

      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={e => onChange({ ...set, reps: e.target.value })}
        placeholder="reps"
        className="flex-1 min-w-0 bg-bg-tertiary rounded-lg px-2 py-2.5 text-center text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
      />

      <select
        value={rpe}
        onChange={e => onChange({ ...set, rpe: e.target.value })}
        className="w-16 bg-bg-tertiary rounded-lg px-1 py-2.5 text-center text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
      >
        <option value="">RPE</option>
        {RPE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
      </select>

      <button
        onClick={handleComplete}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          completed ? 'bg-success text-white' : 'bg-bg-tertiary text-text-muted hover:bg-accent/20 hover:text-accent'
        }`}
      >
        <Check size={16} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/workout/ExerciseBlock.jsx**

```jsx
import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import SetRow from './SetRow'
import { EXERCISE_LIBRARY } from '@/lib/exercises'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import ExerciseHistorySheet from './ExerciseHistorySheet'

export default function ExerciseBlock({ exercise, exIdx, sets, onChange, onSetComplete }) {
  const [cuesOpen, setCuesOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const info = EXERCISE_LIBRARY[exercise.name] || {}
  const primaryMuscle = info.muscles?.primary?.[0] || ''

  function updateSet(setIdx, updated) {
    const next = sets.map((s, i) => i === setIdx ? updated : s)
    onChange(next)
  }

  function addSet() {
    const last = sets[sets.length - 1] || {}
    onChange([...sets, { weight: last.weight || '', reps: last.reps || '', rpe: '', completed: false }])
  }

  return (
    <div className="bg-bg-card rounded-2xl border border-bg-tertiary p-4 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-text-primary text-base">{exercise.name}</div>
          {primaryMuscle && <div className="text-xs text-text-secondary">{primaryMuscle}</div>}
        </div>
        <button onClick={() => setHistoryOpen(true)} className="p-2 text-text-muted hover:text-accent transition-colors">
          <Clock size={16} />
        </button>
      </div>

      {/* Cues toggle */}
      {info.cues?.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setCuesOpen(v => !v)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Coaching cues {cuesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {cuesOpen && (
            <ul className="mt-2 space-y-1">
              {info.cues.map((cue, i) => (
                <li key={i} className="text-xs text-text-secondary pl-2 border-l border-accent/30">{cue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center gap-2 mb-1 px-0">
        <span className="w-6" />
        <span className="flex-1 text-center text-xs text-text-muted">Weight</span>
        <span className="flex-1 text-center text-xs text-text-muted">Reps</span>
        <span className="w-16 text-center text-xs text-text-muted">RPE</span>
        <span className="w-9" />
      </div>

      {/* Sets */}
      {sets.map((set, i) => (
        <SetRow
          key={i}
          setNumber={i + 1}
          set={set}
          onChange={updated => updateSet(i, updated)}
          onComplete={() => onSetComplete(exIdx, i)}
        />
      ))}

      <button
        onClick={addSet}
        className="w-full mt-2 py-2 text-xs text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
      >
        + Add Set
      </button>

      <ExerciseHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        exerciseName={exercise.name}
      />
    </div>
  )
}
```

- [ ] **Step 3: Create ExerciseHistorySheet placeholder (full impl in Task 9)**

Create `src/components/workout/ExerciseHistorySheet.jsx`:

```jsx
import { useSessionsByExercise } from '@/hooks/useSessions'
import { epley, formatDate } from '@/lib/utils'
import SlideUpSheet from '@/components/shared/SlideUpSheet'

export default function ExerciseHistorySheet({ open, onClose, exerciseName }) {
  const { data: exSessions = [] } = useSessionsByExercise(exerciseName)
  const recent = exSessions.slice(0, 3)
  const chartData = exSessions.slice(0, 10).reverse()

  return (
    <SlideUpSheet open={open} onClose={onClose} title={exerciseName} heightClass="h-[70vh]">
      {/* e1RM Chart — inline SVG */}
      {chartData.length > 1 && (
        <E1RMChart data={chartData} />
      )}

      {/* Recent sessions */}
      {recent.length === 0 ? (
        <p className="text-text-muted text-sm">No history yet.</p>
      ) : recent.map((s, i) => {
        const sets = s.exercises?.[0]?.sets || []
        const topSet = sets.reduce((b, c) => (epley(c.weight, c.reps) || 0) > (epley(b.weight, b.reps) || 0) ? c : b, sets[0] || {})
        const e1rm = epley(topSet?.weight, topSet?.reps)
        return (
          <div key={i} className="mb-4">
            <div className="text-xs text-text-muted mb-1">{formatDate(s.date, true)} · {s.sessionName}</div>
            {sets.map((set, j) => (
              <div key={j} className="text-sm text-text-secondary">
                {j + 1}. {set.weight}kg × {set.reps} reps{set.rpe ? ` @ ${set.rpe} RPE` : ''}
              </div>
            ))}
            {e1rm && <div className="text-xs text-accent mt-1">e1RM: {e1rm}kg</div>}
          </div>
        )
      })}
    </SlideUpSheet>
  )
}

function E1RMChart({ data }) {
  const values = data.map(s => {
    const sets = s.exercises?.[0]?.sets || []
    return Math.max(0, ...sets.map(st => epley(st.weight, st.reps) || 0))
  })
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1
  const W = 280, H = 80, PAD = 10

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full mb-4" style={{ overflow: 'visible' }}>
      {/* connecting line */}
      <polyline
        points={data.map((_, i) => {
          const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
          const y = H - PAD - ((values[i] - minV) / range) * (H - PAD * 2)
          return `${x},${y}`
        }).join(' ')}
        fill="none"
        stroke="rgba(108,99,255,0.3)"
        strokeWidth="1.5"
      />
      {/* dots */}
      {data.map((_, i) => {
        const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
        const y = H - PAD - ((values[i] - minV) / range) * (H - PAD * 2)
        const isLast = i === data.length - 1
        return (
          <circle key={i} cx={x} cy={y} r={isLast ? 5 : 4}
            fill={isLast ? '#6c63ff' : 'rgba(108,99,255,0.4)'}
          />
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/workout/SetRow.jsx src/components/workout/ExerciseBlock.jsx src/components/workout/ExerciseHistorySheet.jsx
git commit -m "feat: add SetRow, ExerciseBlock, ExerciseHistorySheet components"
```

---

## Task 8: WorkoutScreen — main screen + RestTimer

**Files:**
- Create: `src/components/workout/RestTimer.jsx`
- Create: `src/components/workout/WorkoutSummary.jsx`
- Create: `src/components/workout/WorkoutScreen.jsx`

- [ ] **Step 1: Create src/components/workout/RestTimer.jsx**

```jsx
import { useEffect, useState, useRef } from 'react'

export default function RestTimer({ duration, onDismiss }) {
  const [remaining, setRemaining] = useState(duration)
  const endRef = useRef(Date.now() + duration * 1000)

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        if (navigator.vibrate) navigator.vibrate([40, 30, 80])
        onDismiss()
      }
    }
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [onDismiss])

  const pct = remaining / duration
  const r = 36, cx = 44, cy = 44
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - pct)

  function addTime(delta) {
    endRef.current += delta * 1000
    setRemaining(v => Math.max(0, v + delta))
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div className="pointer-events-auto bg-bg-secondary border border-bg-tertiary rounded-t-2xl w-full max-w-sm mx-auto p-6 pb-8 safe-bottom">
        <div className="flex flex-col items-center gap-4">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(108,99,255,0.15)" strokeWidth="6" />
            <circle
              cx={cx} cy={cy} r={r}
              fill="none" stroke="#6c63ff" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
            <text x={cx} y={cy + 6} textAnchor="middle" fill="#f0f2ff" fontSize="18" fontWeight="bold" fontFamily="Syne, sans-serif">
              {mins}:{String(secs).padStart(2, '0')}
            </text>
          </svg>

          <div className="text-sm text-text-secondary">Rest</div>

          <div className="flex items-center gap-3">
            <button onClick={() => addTime(-30)} className="px-4 py-2 text-sm text-text-secondary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">−30s</button>
            <button onClick={onDismiss} className="px-6 py-2 text-sm font-semibold text-text-primary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">Skip</button>
            <button onClick={() => addTime(30)} className="px-4 py-2 text-sm text-text-secondary border border-bg-tertiary rounded-xl hover:border-accent/40 transition-colors">+30s</button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/workout/WorkoutSummary.jsx**

```jsx
import { epley, formatDuration, formatVolume, totalVolume } from '@/lib/utils'
import SlideUpSheet from '@/components/shared/SlideUpSheet'
import { useSessions } from '@/hooks/useSessions'
import { normalizeExerciseName } from '@/lib/exercises'

export default function WorkoutSummary({ open, onClose, onSave, session, durationSeconds }) {
  const { data: allSessions = [] } = useSessions()
  const vol = totalVolume(session.exercises)
  const completedSets = session.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0)

  // Detect PRs: highest e1RM ever for each exercise
  const prs = session.exercises.map(ex => {
    const name = normalizeExerciseName(ex.name)
    const currentBest = Math.max(0, ...ex.sets.filter(s => s.completed).map(s => epley(s.weight, s.reps) || 0))
    const historicBest = allSessions.reduce((best, s) => {
      const match = s.exercises?.find(e => normalizeExerciseName(e.name) === name)
      if (!match) return best
      const sessionBest = Math.max(0, ...(match.sets || []).map(st => epley(st.weight, st.reps) || 0))
      return Math.max(best, sessionBest)
    }, 0)
    return currentBest > 0 && currentBest > historicBest ? { name: ex.name, e1rm: currentBest } : null
  }).filter(Boolean)

  return (
    <SlideUpSheet open={open} onClose={onClose} title="Workout Summary" heightClass="h-auto max-h-[85vh]">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Volume" value={`${formatVolume(vol)} kg`} />
          <Stat label="Sets" value={completedSets} />
          <Stat label="Duration" value={formatDuration(durationSeconds)} />
        </div>

        {prs.length > 0 && (
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Personal Records 🏆</div>
            {prs.map(pr => (
              <div key={pr.name} className="flex items-center justify-between py-2 border-b border-bg-tertiary last:border-0">
                <span className="text-sm text-text-primary">{pr.name}</span>
                <span className="text-sm font-bold text-accent">{pr.e1rm}kg e1RM</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-bg-tertiary rounded-xl text-sm text-text-secondary hover:border-accent/30 transition-colors"
          >
            Keep Going
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 bg-accent text-white font-semibold rounded-xl text-sm hover:bg-accent-hover transition-colors"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </SlideUpSheet>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-bg-tertiary rounded-xl p-3 text-center">
      <div className="text-lg font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-muted mt-0.5">{label}</div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/workout/WorkoutScreen.jsx**

```jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ExerciseBlock from './ExerciseBlock'
import RestTimer from './RestTimer'
import WorkoutSummary from './WorkoutSummary'
import { useSessions, useSaveSession } from '@/hooks/useSessions'
import { normalizeExerciseName } from '@/lib/exercises'
import { totalVolume } from '@/lib/utils'

function useElapsedTimer() {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [])
  return elapsed
}

function formatElapsed(s) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function WorkoutScreen() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const session = state?.session
  const programId = state?.programId

  const elapsed = useElapsedTimer()
  const { data: allSessions = [] } = useSessions()
  const saveSession = useSaveSession()

  // Pre-fill sets from last matching session
  const [exerciseSets, setExerciseSets] = useState(() => {
    if (!session) return {}
    const lastMatch = allSessions.find(s => s.sessionId === session.id)
    return Object.fromEntries(
      session.exercises.map((ex, i) => {
        const prevSets = lastMatch?.exercises?.find(e => normalizeExerciseName(e.name) === normalizeExerciseName(ex.name))?.sets || []
        const sets = Array.from({ length: ex.sets }, (_, j) => ({
          weight: prevSets[j]?.weight ?? '',
          reps: prevSets[j]?.reps ?? ex.reps.split('–')[0] ?? '',
          rpe: '',
          completed: false,
        }))
        return [i, sets]
      })
    )
  })

  const [restTimer, setRestTimer] = useState(null) // { duration }
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [confirmBack, setConfirmBack] = useState(false)
  const startedAt = useRef(new Date().toISOString())

  const hasCompletedSets = Object.values(exerciseSets).some(sets => sets.some(s => s.completed))

  function handleBack() {
    if (hasCompletedSets) setConfirmBack(true)
    else navigate(-1)
  }

  function handleSetComplete(exIdx, setIdx) {
    const sets = exerciseSets[exIdx]
    const wasCompleted = sets[setIdx]?.completed
    if (!wasCompleted) {
      // Only trigger rest timer for new completions
      const restDuration = session.exercises[exIdx]?.rest || 90
      setRestTimer({ duration: restDuration })
    }
    setExerciseSets(prev => ({
      ...prev,
      [exIdx]: prev[exIdx].map((s, i) => i === setIdx ? { ...s, completed: !wasCompleted } : s),
    }))
  }

  const buildSessionData = useCallback(() => ({
    sessionId: session.id,
    sessionName: session.name,
    programId,
    startedAt: startedAt.current,
    completedAt: new Date().toISOString(),
    durationSeconds: elapsed,
    date: new Date().toISOString().split('T')[0],
    exercises: session.exercises.map((ex, i) => ({
      name: ex.name,
      sets: (exerciseSets[i] || []).map((s, j) => ({
        setNumber: j + 1,
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps) || 0,
        rpe: s.rpe ? parseFloat(s.rpe) : null,
        completed: s.completed,
      })),
    })),
  }), [session, programId, elapsed, exerciseSets])

  async function handleSave() {
    const data = buildSessionData()
    data.totalVolume = totalVolume(data.exercises)
    await saveSession.mutateAsync(data)
    navigate('/history')
  }

  if (!session) return (
    <div className="flex items-center justify-center h-screen text-text-muted">
      No session selected. <button onClick={() => navigate('/home')} className="ml-2 text-accent">Go home</button>
    </div>
  )

  const TAG_COLORS = {
    push: 'text-push bg-push/15',
    pull: 'text-pull bg-pull/15',
    legs: 'text-legs bg-legs/15',
  }

  return (
    <div className="safe-top pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/95 backdrop-blur border-b border-bg-tertiary px-4 py-3 flex items-center gap-3">
        <button onClick={handleBack} className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${TAG_COLORS[session.tag] || ''}`}>{session.tagLabel}</span>
            <span className="font-bold text-text-primary">{session.name}</span>
          </div>
        </div>
        <span className="font-mono text-sm text-text-muted">{formatElapsed(elapsed)}</span>
      </div>

      {/* Exercise blocks */}
      <div className="px-4 pt-4">
        {session.exercises.map((ex, i) => (
          <ExerciseBlock
            key={i}
            exercise={ex}
            exIdx={i}
            sets={exerciseSets[i] || []}
            onChange={sets => setExerciseSets(prev => ({ ...prev, [i]: sets }))}
            onSetComplete={handleSetComplete}
          />
        ))}
      </div>

      {/* Finish button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-bg-primary/95 backdrop-blur border-t border-bg-tertiary">
        <button
          onClick={() => setSummaryOpen(true)}
          className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl py-3 transition-colors"
        >
          Finish Workout
        </button>
      </div>

      {/* Rest timer */}
      {restTimer && (
        <RestTimer
          duration={restTimer.duration}
          onDismiss={() => setRestTimer(null)}
        />
      )}

      {/* Summary sheet */}
      <WorkoutSummary
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        onSave={handleSave}
        session={{ ...session, exercises: session.exercises.map((ex, i) => ({ ...ex, sets: exerciseSets[i] || [] })) }}
        durationSeconds={elapsed}
      />

      {/* Confirm leave dialog */}
      {confirmBack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-text-primary mb-2">Leave workout?</h3>
            <p className="text-text-secondary text-sm mb-5">Your progress will be lost.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBack(false)} className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary">Stay</button>
              <button onClick={() => navigate(-1)} className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold">Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify workout flow**

```bash
npm run dev
```

Log in, tap Start Workout from HomeScreen. Verify: exercises load, sets can be completed, rest timer appears, Finish Workout opens summary.

- [ ] **Step 5: Commit**

```bash
git add src/components/workout/
git commit -m "feat: add full WorkoutScreen with RestTimer, WorkoutSummary, ExerciseHistorySheet"
```

---

## Task 9: HistoryTab

**Files:**
- Create: `src/components/history/SessionCard.jsx`
- Create: `src/components/history/HistoryTab.jsx`

- [ ] **Step 1: Create src/components/history/SessionCard.jsx**

```jsx
import { useState } from 'react'
import { formatDate, formatDuration, formatVolume, totalVolume } from '@/lib/utils'
import SlideUpSheet from '@/components/shared/SlideUpSheet'

const TAG_COLORS = {
  push: 'bg-push/15 text-push border-push/30',
  pull: 'bg-pull/15 text-pull border-pull/30',
  legs: 'bg-legs/15 text-legs border-legs/30',
}

export default function SessionCard({ session }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const vol = totalVolume(session.exercises || [])
  const completedSets = (session.exercises || []).reduce((n, ex) => n + (ex.sets || []).filter(s => s.completed !== false).length, 0)

  return (
    <>
      <button
        onClick={() => setDetailOpen(true)}
        className="w-full bg-bg-card border border-bg-tertiary rounded-2xl p-4 text-left hover:border-accent/30 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {session.tag && (
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TAG_COLORS[session.tag] || 'bg-accent/15 text-accent border-accent/30'}`}>
                  {session.tagLabel || session.tag}
                </span>
              )}
            </div>
            <div className="font-bold text-text-primary">{session.sessionName}</div>
            <div className="text-xs text-text-muted mt-0.5">{formatDate(session.date)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-text-secondary">{formatVolume(vol)} kg</div>
            {session.duration && <div className="text-xs text-text-muted">{formatDuration(session.duration)}</div>}
            <div className="text-xs text-text-muted">{completedSets} sets</div>
          </div>
        </div>
      </button>

      <SlideUpSheet open={detailOpen} onClose={() => setDetailOpen(false)} title={session.sessionName}>
        <div className="space-y-4">
          <div className="flex gap-4 text-sm text-text-secondary">
            <span>{formatDate(session.date)}</span>
            {session.duration && <span>{formatDuration(session.duration)}</span>}
            <span>{formatVolume(vol)} kg</span>
          </div>
          {(session.exercises || []).map((ex, i) => {
            const exVol = totalVolume([ex])
            return (
              <div key={i}>
                <div className="font-semibold text-text-primary mb-1">{ex.name}</div>
                <div className="text-xs text-text-muted mb-1">{formatVolume(exVol)} kg volume</div>
                {(ex.sets || []).map((s, j) => (
                  <div key={j} className="text-sm text-text-secondary py-0.5">
                    {j + 1}. {s.weight}kg × {s.reps} reps{s.rpe ? ` @ ${s.rpe} RPE` : ''}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </SlideUpSheet>
    </>
  )
}
```

- [ ] **Step 2: Create src/components/history/HistoryTab.jsx**

```jsx
import { useSessions } from '@/hooks/useSessions'
import SessionCard from './SessionCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

function groupByRelativeDate(sessions) {
  const groups = {}
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]

  sessions.forEach(s => {
    const d = s.date || ''
    let label
    if (d === today) label = 'Today'
    else if (d >= weekAgo) label = 'This Week'
    else if (d >= twoWeeksAgo) label = 'Last Week'
    else {
      const dt = new Date(d + 'T00:00:00')
      label = dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    if (!groups[label]) groups[label] = []
    groups[label].push(s)
  })
  return groups
}

export default function HistoryTab() {
  const { data: sessions = [], isLoading } = useSessions()

  if (isLoading) return <LoadingSpinner />

  if (!sessions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6 mt-12">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-text-secondary">No sessions logged yet.</p>
      </div>
    )
  }

  const groups = groupByRelativeDate(sessions)

  return (
    <div className="safe-top px-4 pb-4 max-w-lg mx-auto">
      <h1 className="font-bold text-2xl text-text-primary py-4">History</h1>
      {Object.entries(groups).map(([label, items]) => (
        <div key={label} className="mb-5">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{label}</div>
          <div className="space-y-2">
            {items.map((s, i) => <SessionCard key={s._id || i} session={s} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/history/
git commit -m "feat: add HistoryTab with grouped sessions and detail sheet"
```

---

## Task 10: ProgressTab

**Files:**
- Create: `src/components/progress/ExerciseChart.jsx`
- Create: `src/components/progress/ProgressTab.jsx`

- [ ] **Step 1: Create src/components/progress/ExerciseChart.jsx**

```jsx
import { epley, formatDate } from '@/lib/utils'

// data: array of { date, exercises: [{ sets: [{weight, reps}] }] }
// metric: 'e1rm' | 'volume' | 'maxWeight'
export default function ExerciseChart({ data, metric = 'e1rm' }) {
  if (!data.length) return null

  const points = data.map(s => {
    const sets = s.exercises?.[0]?.sets || []
    if (metric === 'e1rm') return Math.max(0, ...sets.map(st => epley(st.weight, st.reps) || 0))
    if (metric === 'volume') return sets.reduce((sum, st) => sum + (parseFloat(st.weight) || 0) * (parseInt(st.reps) || 0), 0)
    if (metric === 'maxWeight') return Math.max(0, ...sets.map(st => parseFloat(st.weight) || 0))
    return 0
  })

  const minV = Math.min(...points)
  const maxV = Math.max(...points)
  const range = maxV - minV || 1
  const W = 320, H = 120, PAD = 16
  const n = points.length

  const cx = (i) => PAD + (i / Math.max(n - 1, 1)) * (W - PAD * 2)
  const cy = (v) => H - PAD - ((v - minV) / range) * (H - PAD * 2)

  const [hovered, setHovered] = React.useState(null)

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ overflow: 'visible' }}
      >
        {/* Y gridlines */}
        {[0, 0.5, 1].map(t => {
          const y = H - PAD - t * (H - PAD * 2)
          const val = Math.round(minV + t * range)
          return (
            <g key={t}>
              <line x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={PAD} y={y - 3} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Syne, sans-serif">{val}</text>
            </g>
          )
        })}

        {/* Connecting line */}
        <polyline
          points={points.map((v, i) => `${cx(i)},${cy(v)}`).join(' ')}
          fill="none"
          stroke="rgba(108,99,255,0.3)"
          strokeWidth="1.5"
        />

        {/* Dots */}
        {points.map((v, i) => {
          const isLast = i === n - 1
          const isHovered = hovered === i
          return (
            <g key={i}>
              <circle
                cx={cx(i)} cy={cy(v)}
                r={isHovered ? 6 : isLast ? 5 : 4}
                fill={isLast ? '#6c63ff' : 'rgba(108,99,255,0.5)'}
                style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onTouchStart={() => setHovered(i)}
                onTouchEnd={() => setTimeout(() => setHovered(null), 1500)}
              />
              {isHovered && (
                <g>
                  <rect x={cx(i) - 30} y={cy(v) - 24} width="60" height="18" rx="4" fill="#1e2235" stroke="rgba(108,99,255,0.4)" strokeWidth="1" />
                  <text x={cx(i)} y={cy(v) - 11} textAnchor="middle" fill="#f0f2ff" fontSize="9" fontFamily="Syne, sans-serif">
                    {v}{metric === 'volume' ? ' kg·reps' : ' kg'}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* X axis dates (first, last) */}
        {n > 1 && (
          <>
            <text x={PAD} y={H + 4} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Syne, sans-serif">
              {formatDate(data[0].date, true)}
            </text>
            <text x={W - PAD} y={H + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Syne, sans-serif">
              {formatDate(data[n - 1].date, true)}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}

// Need React imported
import React from 'react'
```

- [ ] **Step 2: Create src/components/progress/ProgressTab.jsx**

```jsx
import { useState } from 'react'
import { useSessions } from '@/hooks/useSessions'
import { normalizeExerciseName } from '@/lib/exercises'
import { epley, formatDate, formatVolume, totalVolume } from '@/lib/utils'
import ExerciseChart from './ExerciseChart'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

const METRICS = [
  { key: 'e1rm', label: 'e1RM' },
  { key: 'volume', label: 'Volume' },
  { key: 'maxWeight', label: 'Max Weight' },
]

export default function ProgressTab() {
  const { data: sessions = [], isLoading } = useSessions()
  const [selectedExercise, setSelectedExercise] = useState('')
  const [metric, setMetric] = useState('e1rm')

  // Build sorted exercise list
  const exerciseNames = [...new Set(
    sessions.flatMap(s => (s.exercises || []).map(e => normalizeExerciseName(e.name)))
  )].sort()

  if (isLoading) return <LoadingSpinner />

  const exerciseData = selectedExercise
    ? sessions
        .filter(s => s.exercises?.some(e => normalizeExerciseName(e.name) === selectedExercise))
        .map(s => ({
          ...s,
          exercises: s.exercises.filter(e => normalizeExerciseName(e.name) === selectedExercise),
        }))
        .reverse()
        .slice(-20)
    : []

  // Personal best
  const allSets = exerciseData.flatMap(s => s.exercises?.flatMap(e => e.sets || []) || [])
  const bestE1RM = Math.max(0, ...allSets.map(s => epley(s.weight, s.reps) || 0))
  const bestSession = exerciseData.find(s => {
    const sets = s.exercises?.[0]?.sets || []
    return sets.some(st => epley(st.weight, st.reps) === bestE1RM)
  })

  return (
    <div className="safe-top px-4 pb-4 max-w-lg mx-auto">
      <h1 className="font-bold text-2xl text-text-primary py-4">Progress</h1>

      {/* Exercise selector */}
      <select
        value={selectedExercise}
        onChange={e => setSelectedExercise(e.target.value)}
        className="w-full bg-bg-card border border-bg-tertiary rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent mb-4"
      >
        <option value="">Select exercise…</option>
        {exerciseNames.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {selectedExercise && (
        <>
          {/* Metric toggle */}
          <div className="flex gap-2 mb-4">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  metric === m.key
                    ? 'bg-accent text-white'
                    : 'bg-bg-card border border-bg-tertiary text-text-muted hover:border-accent/30'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {exerciseData.length > 1 ? (
            <div className="bg-bg-card border border-bg-tertiary rounded-2xl p-4 mb-4">
              <ExerciseChart data={exerciseData} metric={metric} />
            </div>
          ) : (
            <div className="bg-bg-card border border-bg-tertiary rounded-2xl p-4 mb-4 text-center text-text-muted text-sm">
              {exerciseData.length === 0 ? 'No data yet.' : 'Log 2+ sessions to see chart.'}
            </div>
          )}

          {/* Personal best */}
          {bestE1RM > 0 && (
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-4">
              <div className="text-xs text-text-muted mb-1">Personal Best e1RM</div>
              <div className="text-2xl font-bold text-accent">{bestE1RM} kg</div>
              {bestSession && (
                <div className="text-xs text-text-secondary mt-1">{formatDate(bestSession.date)}</div>
              )}
            </div>
          )}

          {/* Recent sessions table */}
          {exerciseData.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-text-secondary mb-2">Recent Sessions</div>
              {[...exerciseData].reverse().slice(0, 5).map((s, i) => {
                const sets = s.exercises?.[0]?.sets || []
                const topSet = sets.reduce((b, c) => (epley(c.weight, c.reps) || 0) > (epley(b.weight, b.reps) || 0) ? c : b, sets[0] || {})
                const vol = totalVolume(s.exercises)
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-bg-tertiary last:border-0">
                    <div>
                      <div className="text-sm text-text-primary">{formatDate(s.date, true)}</div>
                      <div className="text-xs text-text-muted">
                        {topSet.weight}kg × {topSet.reps} · {formatVolume(vol)} kg
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-accent">
                      {epley(topSet.weight, topSet.reps) || '—'} kg
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/progress/
git commit -m "feat: add ProgressTab with e1RM chart and personal best"
```

---

## Task 11: SettingsTab

**Files:**
- Create: `src/components/settings/SettingsTab.jsx`

- [ ] **Step 1: Create src/components/settings/SettingsTab.jsx**

```jsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useSessions } from '@/hooks/useSessions'
import { useProgram } from '@/hooks/useProgram'
import { migrateExerciseNames } from '@/lib/exercises'
import { supabase } from '@/lib/supabase'

export default function SettingsTab() {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { data: sessions = [] } = useSessions()
  const { data: programData } = useProgram()
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [migrating, setMigrating] = useState(false)

  const name = profile?.display_name || user?.email?.split('@')[0] || '?'
  const initial = name[0]?.toUpperCase() || '?'
  const isPrivate = profile?.is_private || false

  async function saveName() {
    if (!displayName.trim()) { setEditingName(false); return }
    await updateProfile.mutateAsync({ display_name: displayName.trim() })
    setEditingName(false)
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `hybrid-sessions-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  async function runMigration() {
    setMigrating(true)
    await migrateExerciseNames(supabase)
    setMigrating(false)
    alert('Migration complete. Check console for details.')
  }

  async function togglePrivacy() {
    await updateProfile.mutateAsync({ is_private: !isPrivate })
  }

  return (
    <div className="safe-top px-4 pb-8 max-w-lg mx-auto">
      <h1 className="font-bold text-2xl text-text-primary py-4">Settings</h1>

      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="flex-1 bg-bg-tertiary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                />
                <button onClick={saveName} className="text-accent text-sm px-2">Save</button>
              </div>
            ) : (
              <button onClick={() => { setDisplayName(name); setEditingName(true) }} className="text-left">
                <div className="font-semibold text-text-primary">{name}</div>
                <div className="text-xs text-accent">Edit name</div>
              </button>
            )}
            <div className="text-xs text-text-muted mt-0.5 truncate">{user?.email}</div>
          </div>
        </div>

        <ToggleRow
          label="Private profile"
          description="Activity hidden from group members"
          checked={isPrivate}
          onChange={togglePrivacy}
        />
      </Section>

      {/* Program */}
      <Section title="Program">
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-text-primary">{programData?.program?.name || 'PPL × 2'}</div>
            <div className="text-xs text-text-muted">Active program</div>
          </div>
          <span className="text-xs text-text-muted">(change coming soon)</span>
        </div>
      </Section>

      {/* Data */}
      <Section title="Data">
        <ActionRow label="Export Data" description="Download all sessions as JSON" onClick={exportData} />
        <ActionRow
          label={migrating ? 'Migrating…' : 'Run Name Migration'}
          description="Normalize historical exercise names"
          onClick={runMigration}
          disabled={migrating}
        />
      </Section>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full mt-4 py-3 rounded-xl border border-danger/40 text-danger text-sm font-semibold hover:bg-danger/10 transition-colors"
      >
        Sign Out
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{title}</div>
      <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-2 space-y-1">
        {children}
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm text-text-primary">{label}</div>
        {description && <div className="text-xs text-text-muted">{description}</div>}
      </div>
      <button
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-accent' : 'bg-bg-tertiary'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function ActionRow({ label, description, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-between py-3 text-left disabled:opacity-50"
    >
      <div>
        <div className="text-sm text-text-primary">{label}</div>
        {description && <div className="text-xs text-text-muted">{description}</div>}
      </div>
      <span className="text-text-muted text-sm">›</span>
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/settings/
git commit -m "feat: add SettingsTab with profile, privacy toggle, export, sign out"
```

---

## Task 12: Complete EXERCISE_LIBRARY + build verification

- [ ] **Step 1: Port full EXERCISE_LIBRARY**

Open `index.html` at lines 3123–3690. Copy ALL entries verbatim into `src/lib/exercises.js`. There are ~33 exercises. The format is:

```js
'Exercise Name': {
  muscles: { primary: ['...'], secondary: ['...'] },
  pattern: '...',
  cues: ['...', '...'],
  notes: '...',  // optional
},
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits with code 0, no errors. Fix any import errors or undefined references.

- [ ] **Step 3: Fix any build errors**

Common issues:
- Missing `import React from 'react'` in ExerciseChart (already included at bottom of file — move to top)
- Broken import paths — verify all `@/` aliases resolve
- `useSessionsByExercise` in ExerciseHistorySheet: the hook selects from cached data, which requires sessions to already be loaded via `useSessions()` in a parent

- [ ] **Step 4: Verify dev server**

```bash
npm run dev
```

Walk through: Login → Home → Start any workout → Complete a set → Rest timer → Finish → Save → History → Progress → Settings → Sign out.

- [ ] **Step 5: Commit**

```bash
git add src/lib/exercises.js
git commit -m "feat: port full EXERCISE_LIBRARY with coaching cues for all 33 exercises"
```

---

## Task 13: Deploy to Vercel

- [ ] **Step 1: Push branch to remote**

```bash
git push -u origin claude/beautiful-hellman
```

- [ ] **Step 2: Add env vars in Vercel dashboard**

In Vercel project settings → Environment Variables, add:
- `VITE_SUPABASE_URL` = `https://yawoliebqdxrmkygawqj.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key)

- [ ] **Step 3: Deploy**

Either connect branch to Vercel or use `npx vercel --prod` from the worktree directory.

- [ ] **Step 4: Verify live URL**

Open the deployed URL. Test full auth flow: enter email → receive magic link → tap link → app loads → all tabs work.

---

## Quality Checklist

- [ ] `npm run build` exits 0, no errors
- [ ] Auth: email → magic link → signed in → app loads
- [ ] HomeScreen: shows correct next session (PPL rotation from most recent)
- [ ] Block/week badge shows correct phase (Block 2, Week 3 = Intensification as of 2026-04-11)
- [ ] Quick Start: all 6 sessions accessible
- [ ] Workout: pre-fills weights from last matching session
- [ ] Sets log: weight, reps, RPE all save
- [ ] Completing a set triggers rest timer
- [ ] Editing an already-completed set does NOT re-trigger rest timer
- [ ] Exercise history sheet: opens, shows e1RM chart + recent sets
- [ ] Finish Workout: shows volume, sets, duration, PR detection
- [ ] Save: writes to `sessions` table + `activity` table
- [ ] History: grouped by date, tapping opens detail sheet
- [ ] Progress: exercise selector, metric toggle, chart, personal best
- [ ] Settings: display name edit, privacy toggle, export, sign out
- [ ] Bottom nav: all tabs navigate correctly
- [ ] No console errors in production build
- [ ] Deployed to Vercel, accessible at live URL

---

## Notes

**Existing sessions without user_id:** The old vanilla-JS app didn't use auth, so existing rows in `sessions` may have `user_id = null`. After first login with the new app, those rows won't appear due to RLS. The user may need to run a SQL migration in the Supabase dashboard:

```sql
UPDATE sessions SET user_id = '<your-auth-uid>' WHERE user_id IS NULL;
```

Find your auth UID from Supabase Auth → Users after logging in.

**useProgram + sessions dependency:** `useProgram`'s `select` function references `sessions` from `useQuery({ queryKey: ['sessions'], enabled: false })`. This only works if sessions are already fetched. Ensure `useSessions()` is called in HomeScreen before `useProgram()` is needed for `nextSession`, or refactor `getNextSession` into `useProgram`'s `queryFn` by fetching sessions there too.
