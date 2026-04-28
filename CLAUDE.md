# Strength Tracker — Codebase Guide

React + Vite app, Tailwind, Supabase, TanStack Query. Hash-based routing.

## Design System (READ BEFORE WRITING ANY UI)

This app has a tight, established design system. Before writing UI:
1. Open `tailwind.config.js` and confirm the token names you intend to use **actually exist**.
2. Skim 1–2 sibling screens (`HomeScreen`, `ProgramTab`, `GroupsTab`) to match their visual patterns.
3. If working from Figma, use the EXACT pixel values, opacities, and tokens — do not approximate.

Approximation is what makes screens look "off." Match values to the digit.

### Fonts (only these exist)

| Class | Family | Use for |
|-------|--------|---------|
| `font-judge` | F37 Judge Trial | Display numbers, large headlines, hero text, stat values |
| `font-commons` | TT Commons | All UI/body text, labels, buttons, descriptions |
| `font-sans` | Syne | Default — rarely used directly |

**Do NOT use:** `font-display`, `font-secondary`, `font-mono`, or any other font class. They don't exist and silently fall back, breaking the design.

Common pairings: `font-judge font-bold text-[36px] leading-none` for stat values, `font-commons font-semibold text-[18px] tracking-[-0.36px]` for section labels, `font-commons text-[16px] tracking-[-0.2px]` for body.

### Color tokens (only these exist)

- Backgrounds: `bg-bg-primary` (#0a0a0a), `bg-bg-secondary` (#161616), `bg-bg-tertiary` (#222), `bg-bg-card`, `bg-bg-stat`, `bg-bg-badge`
- Accent: `bg-accent` / `text-accent` / `border-accent` (#f2a655), `accent-hover`, `accent-dim`
- Text: `text-text-primary` (white), `text-text-secondary` (#8b8b8b), `text-text-muted` (#5c5c5c)
- Status: `text-success`, `text-warning`, `text-danger`
- Lift categories: `push`, `pull`, `legs` (each with `.dim` variant)

For arbitrary opacities the codebase frequently uses literal values like `bg-[rgba(255,255,255,0.05)]`, `border-[rgba(255,255,255,0.1)]`, `text-[#8b8b8b]`. Match those — don't substitute `bg-white/5` style classes when the rest of the file uses literals (and vice versa).

### Standard patterns (copy these, don't reinvent)

**Standard card / tile:**
```
bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px]
```

**Section label (above a card or list):**
```
font-commons font-semibold text-[18px] text-[rgba(255,255,255,0.6)] tracking-[-0.36px] leading-[14px]
```

**Stat value / large number:**
```
font-judge font-bold text-[36px] text-white leading-none
```

**Stat label (below value):**
```
font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]
```

**Pill / tag:**
```
border border-[rgba(255,255,255,0.1)] rounded-[4px] pt-[4px] pb-[2px] px-[6px]
font-commons text-[12px] text-[rgba(255,255,255,0.4)] tracking-[-0.2px] leading-[14px]
```

**Body / description text:**
```
font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]
```

**Small button (logout-style):**
```
bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[4px] px-[12px] py-[10px]
font-commons font-bold text-[14px] text-white tracking-[-0.28px]
```

### Shared components — use them, don't rebuild

Located in `src/components/shared/`:

- **`PrimaryButton`** — full-width primary action. Variants: `primary` (orange), `secondary` (subtle white). Use for any major CTA.
- **`DestructiveButton`** — full-width red-bordered button. Use for sign out, delete, etc.
- **`SlideUpSheet`** — bottom sheet modal with drag-to-dismiss. Use for forms, pickers, confirmations.
- **`ModalOverlay`** — generic full-screen portal overlay (z-60).
- **`BottomNav`** — tab bar (rendered by `MainApp` layout, do not import directly).
- **`LoadingSpinner`** — full-screen loading state.

Before creating an inline button or modal, check if one of these fits. If it does, use it.

### Border radius

Tailwind defaults work (`rounded-sm` 2px, `rounded-md` 6px, `rounded-lg` 8px). Custom: `rounded-xl` = 16px, `rounded-2xl` = 20px. Cards typically use `rounded-[8px]`, sheets/modals `rounded-tl-[16px] rounded-tr-[16px]`, pills `rounded-[4px]`.

### Spacing

The codebase uses literal pixel values heavily: `px-[16px]`, `py-[12px]`, `gap-[12px]`, `gap-[24px]`. When matching Figma, copy the exact values rather than rounding to `p-4`.

## Routing

`src/App.jsx` defines routes via `createHashRouter`. Tab routes (`/home`, `/program`, `/progress`, `/groups`, `/settings`) live inside the `MainApp` layout (which renders `BottomNav`). Full-screen routes (`/workout`, `/conditioning`, `/groups/:groupId`, `/settings/account|preferences|privacy`) live outside.

## Data layer

- TanStack Query for all server state. Hooks live in `src/hooks/` (`useProfile`, `useSessions`, `useProgramConfig`, `useGroups`, etc.).
- Supabase for persistence. Client at `src/lib/supabase.js`.
- Mutations use `useMutation` with optimistic updates and query invalidation.

## Utilities

`src/lib/utils.js` — `epley`, `totalVolume`, `formatVolume`, `formatDuration`, `formatDate`, `weekStart`, `computeWeekStreak`. Always check here before writing date/volume math.

## Working from Figma designs

When implementing a Figma node:
1. Use the Figma MCP `get_design_context` tool. Do not call `get_screenshot` after.
2. The MCP returns React + Tailwind code with the exact pixel values, opacities, and gradient stops. Translate **those exact values** into this codebase — don't round them.
3. The MCP code uses arbitrary font strings like `font-['F37_Judge_Trial:Bold',sans-serif]`. Convert to `font-judge font-bold`. Same for `font-['TT_Commons:Regular',sans-serif]` → `font-commons` (or `font-commons font-semibold` / `font-bold` for DemiBold/Bold variants).
4. Asset URLs from Figma expire in 7 days. Always download SVGs/images via `curl` and commit them to `src/assets/icons/` or `src/assets/images/` — never reference Figma's hosted URLs in code.
5. After implementing, scan your file for `font-display`, `font-secondary`, or any font class not in the Fonts table above. Those are bugs that will silently fall back to system fonts.

## Verification

For UI changes, start the preview server and verify visually before reporting work as complete. The app is auth-gated, so a blank screenshot at `/` means the login page is showing — that's expected without credentials, but it does mean you can't visually verify post-auth screens through the preview alone. In those cases, at minimum: confirm the build passes (`npm run build`), confirm no TypeScript/JSX errors in the file you changed, and confirm font/color/spacing values match the design system above.
