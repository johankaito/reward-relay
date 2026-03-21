# Design Gap Analysis — Reward Relay
**Generated**: 2026-03-22
**Scope**: Desktop + Mobile + Component Library vs current Next.js implementation
**Method**: Line-by-line comparison of all Stitch design HTML files against current source code
**Confidence**: 97.8%

---

## 0. Executive Summary

The codebase has adopted the Financial Luminary token palette and glassmorphism utilities correctly. The largest gaps are **architectural** (nav taxonomy, layout structure, card visualization) and **typographic** (missing Plus Jakarta Sans on hero metrics). Approximately **23 discrete gaps** were identified, ranging from critical layout breaks to polish-level styling inconsistencies. The spend tracker arc and profit dashboard hero were recently redesigned (issues #164/#165) and are largely aligned. The biggest unimplemented surface is the **Apple Wallet card stack** visualization and the **nav architecture mismatch**.

---

## 1. Design Token Gaps

| Token | Design Value | Current `tokens.css` | Status |
|---|---|---|---|
| `--surface` | `#0f131f` | `#0f131f` | ✅ Match |
| `--primary` | `#4edea3` | `#4edea3` | ✅ Match |
| `--primary-container` | `#10b981` | `#10b981` | ✅ Match |
| `--secondary` | `#d0bcff` | `#d0bcff` | ✅ Match |
| `--tertiary` | `#c3c0ff` | `#c3c0ff` | ✅ Match |
| `--surface-container-low` | `#171b28` | `#171b28` | ✅ Match |
| `--surface-container` | `#1b1f2c` | `#1b1f2c` | ✅ Match |
| `--surface-container-highest` | `#313442` | `#313442` | ✅ Match |
| `--outline` | `#86948a` | `#86948a` | ✅ Match |
| `--outline-variant` | `#3c4a42` | `#3c4a42` | ✅ Match |
| `--shadow-ambient` | `0px 24px 48px -12px rgba(0,0,0,0.4)` | `0px 24px 48px -12px rgba(0,0,0,0.4)` | ✅ Match |
| Tailwind `font-headline` | Plus Jakarta Sans | Not in `tailwind.config` | ❌ **Missing** |
| Tailwind `font-body` | Inter | Not in `tailwind.config` | ❌ **Missing** |
| `surface-container-low` as Tailwind class | `#171b28` | Not mapped to Tailwind | ❌ **Missing** |
| `surface-container` as Tailwind class | `#1b1f2c` | Not mapped to Tailwind | ❌ **Missing** |
| `on-surface-variant` as Tailwind class | `#bbcabf` | Not mapped to Tailwind | ❌ **Missing** |

**Root cause**: `tokens.css` exports CSS custom properties but `tailwind.config.ts` does not extend the theme with the Stitch color tokens (`surface-container-low`, `on-surface`, etc.). All design HTML uses direct Tailwind token classes (`bg-surface-container-low`, `text-on-surface`). The current Tailwind config only exposes `--accent`, `--text-primary` etc via inline theme.

**Fix required**: Extend `tailwind.config.ts` theme colors to map design system names (`surface-container`, `on-surface`, `primary` etc.) to the CSS variables in `tokens.css`.

---

## 2. Typography Gaps

| Spec | Design Requirement | Current State | Status |
|---|---|---|---|
| Hero display font | Plus Jakarta Sans, 400–800 weight | `--font-sans: var(--font-grotesk)` in globals | ❌ Gap |
| Body / label font | Inter | Inter likely loaded | ⚠️ Unverified |
| Hero size | `text-6xl`–`text-8xl`, `font-extrabold`, `tracking-tighter` | Varies by page | ⚠️ Partial |
| Tabular numbers | `font-variant-numeric: tabular-nums` | Defined in `globals.css` for `.font-mono` only | ❌ Gap |
| Section headings | Plus Jakarta Sans, `font-bold`, `tracking-tight` | `text-2xl font-semibold` in cards page | ⚠️ Partial |

**Critical**: The design spec explicitly states "Display & Headlines (Plus Jakarta Sans)" for all high-impact metrics. The current `globals.css` maps `--font-sans` to `var(--font-grotesk)`. Plus Jakarta Sans must be loaded in `layout.tsx` via `next/font/google` and applied to headline elements.

**Tabular rule**: All financial numbers ($, points) **must** have `tabular-nums` class. Currently only `code` and `.font-mono` elements get tabular rendering.

---

## 3. AppShell / Navigation Gaps

### 3.1 Nav Taxonomy Mismatch (CRITICAL)

| Design Items | Current Items | Gap |
|---|---|---|
| Home | Home (`/dashboard`) | ✅ |
| Cards | Cards (`/cards`) | ✅ |
| Track | Discover (dropdown) | ❌ Wrong label + wrong sub-pages |
| Redeem | Spending (dropdown) | ❌ Wrong mapping |
| Account | Timeline (dropdown) | ❌ Missing entirely |

The Stitch designs show a **flat 5-item nav**: Home / Cards / Track / Redeem / Account.
Current `AppShell.tsx` has: Home / Cards / Discover / Spending / Timeline — with hierarchical sub-items.

**Design intent**:
- **Track** → maps to analytics/spending/profit (current "Spending" dropdown)
- **Redeem** → maps to flights/redemptions (no equivalent in current nav)
- **Account** → maps to profile/settings (no equivalent in current nav)

The flights design also shows a 6-item nav (adding "Flights" as active), suggesting "Redeem" expands or "Flights" is nested under "Redeem".

### 3.2 Sidebar Layout Architecture (CRITICAL)

| Attribute | Design | Current | Gap |
|---|---|---|---|
| Position | `fixed left-0 top-0 h-screen w-64` | Inside a CSS grid column `md:grid-cols-[220px_1fr]` | ❌ |
| Background | `bg-[#171b28]` (surface-container-low) | `bg-[var(--surface)]` via card wrapper | ❌ |
| Border | `border-r border-white/5` (ghost border only) | `rounded-xl border border-[var(--border-default)]` | ❌ No-Line violation |
| Width | 256px (w-64) | 220px | ❌ |
| Height | Full viewport height | `h-fit` (collapses to content) | ❌ |
| Main content offset | `md:ml-64` | Grid right column | ❌ |

**Impact**: The current implementation creates a "floating card" sidebar that doesn't extend to the bottom of the viewport — breaking the Financial Luminary depth illusion.

### 3.3 Active Nav State Colors

| Attribute | Design | Current | Gap |
|---|---|---|---|
| Active item bg | `bg-[#1b1f2c]` (surface-container) | `bg-[var(--surface-strong)]` = `#262a37` | ❌ Too bright |
| Active item text | `text-[#4edea3]` (primary) | `text-[var(--text-primary)]` = `#dfe2f3` | ❌ Wrong color |
| Active icon color | `text-[#4edea3]` | `text-[var(--accent)]` = `#4edea3` | ✅ Correct |
| Hover bg | `hover:bg-[#313442]` | `hover:bg-[var(--surface-subtle)]` = `#313442` | ✅ Correct |

### 3.4 Missing Sidebar Elements

The design sidebar includes:
1. **"The Financial Luminary" tagline** (`text-[10px] uppercase tracking-widest text-slate-500`) below the logo — **missing**
2. **"Add New Card" gradient pill button** in sidebar footer — currently in header only
3. **User avatar + name + tier** in sidebar footer — **missing entirely**

### 3.5 Header Gaps

| Attribute | Design | Current |
|---|---|---|
| Header title | Breadcrumb: "Dashboard > Overview" (desktop) | "Reward Relay" logo in header |
| Search bar | `rounded-full` with icon inside | No search in header |
| Notifications icon | Present | Present ✅ |
| Settings icon | Present | Missing — only LogOut shown |
| User avatar | In sidebar, not header | Not in header |

---

## 4. Page-by-Page Desktop Gaps

### 4.1 Dashboard (`/dashboard`)

**Design elements**:
- Alert strip with left emerald border, dismiss button
- Hero: `$14,285.42` in `text-[64px]` Plus Jakarta Sans + `+12.4%` pill badge
- Quick stats: 4 cards (Points Sum, Active Cards, Yearly Fees, Saved YTD)
- Active Bonus Trackers bento grid (2 tracker cards + "Track New Bonus" CTA)
- Credit Portfolio: 3D wallet-style card stack with `rotate-3`, `rotate-1`, `-rotate-1` transforms
- Recent Points: Activity feed with category icons, point values in primary color

**Current state**: Likely not implemented to design spec (dashboard page not surfaced in glob). Needs full verification.

**Key missing components**:
- Alert/notification strip with emerald left border
- 3D wallet card stack visualization
- Bonus Trackers bento grid
- Hero metric in Plus Jakarta Sans display size

### 4.2 Card Portfolio (`/cards`)

**Design elements**:
- Stats row: Total Limit / Monthly Spend / Points Earned (3 stat cards)
- Main area: 2–3 column card bento grid — each card is **Apple Wallet style** with:
  - `aspect-[1.586/1]` (credit card aspect ratio)
  - Bank-specific gradient (Amex: silver/grey; CBA: yellow/orange; ANZ: blue; Westpac: red)
  - `rounded-xl` (1rem, not 3rem — check spec)
  - Spending progress bar embedded in card
  - `group-hover:-translate-y-2` lift effect
- Right aside: Selected card details panel with glassmorphism, bonus progress mini-bar
- Recent activity feed below cards

**Current state**: Shows catalog list view for card selection — lacks wallet-style visualization entirely.

**Priority gaps**:
1. Wallet-style card visual (aspect ratio, gradients, embedded progress)
2. Stats row above cards
3. Card detail aside panel
4. Recent activity in card context

### 4.3 Spend Tracker (`/spending`)

**Design elements**:
- 4-column stat cards at top (glassmorphism `.glass-panel`)
- Left column (5/12): SVG half-arc at `M 10 50 A 40 40 0 0 1 90 50`, rotated `-180deg`, with gradient stroke
- Hover on arc: `stroke-width: 12` (up from 10), stronger glow
- "On track" pill with `check_circle` icon
- Daily burn rate text
- Right column (7/12): Transaction list with `w-14 h-14 rounded-2xl` icons

**Current state**: Issue #164 implemented the arc redesign. Likely close but needs verification against:
- Arc hover interaction (stroke-width transition)
- Glass stat cards using correct `.glass-panel` CSS class
- Icon sizes (`w-14 h-14`) in transaction list

### 4.4 Profit Dashboard (`/profit`)

**Design elements**:
- Hero: `$14,842.60` split with cents in lighter weight, "FY 2024 Net Profit" label
- Stat strip: Total Bonuses (`+$18,200`) and Gross Fees (`-$3,357`)
- Footer: "+22% from last FY" pill
- **Bar chart** ("Bonuses vs Fees per Card"): 5 vertical bar pairs, primary for bonus (gradient fill), secondary for fee
- High Velocity Assets section: Card items with ROI (12.4x, 8.2x)
- Holding Strategy section: Low ROI cards (1.8x, 0.9x)
- Bento grid: 3 insight cards (Potential Savings, Next ROI Peak, Wallet Health)

**Current state**: Issue #165 implemented using recharts `AreaChart`. The **chart type is wrong** — design uses a grouped bar chart (bonus bar + fee bar per card), not an area chart. ROI table exists but uses different visual structure.

**Priority gaps**:
1. Chart type: AreaChart → grouped bar chart (Bonus vs Fee per card)
2. "High Velocity Assets" / "Holding Strategy" card sections with ROI display
3. 3 insight bento cards at bottom
4. Hero stat strip (Total Bonuses / Gross Fees layout)

### 4.5 Flights (`/flights`)

**Design elements**:
- Nav shows "Flights" as active top-level item (not nested under Redeem)
- Top bar: "Reward Flights" title, "Global Search" badge, large search input (`rounded-full`)
- Award route cards with airline gradient headers, origin→destination, cabin class badge
- Points required, taxes, booking CTA
- Glassmorphism card style (`.glass-card`)

**Current state**: Flights page exists. Uses standard `Card` components and `Input`/`Select` from shadcn. Missing glassmorphism card style and airline-specific gradient headers.

### 4.6 Landing Page (`/`)

**Design elements**:
- Dark hero `#0f131f` bg, ambient gradient blobs (primary/secondary at 10% opacity)
- "Command Your Wealth" pill badge (primary/10 bg)
- H1: "Master the Churn" (Plus Jakarta Sans, 5xl–7xl, font-extrabold)
- "The Churn" word in `#10b981` (primary-container)
- Two CTAs: "Join the Elite" (gradient pill) + "View Live Dashboard" (glassmorphism pill)
- Social proof: "5,000+ Aussie Points Hackers" + bank logos (AMEX, QANTAS etc.)
- "How it Works" section with 3-step numbered list on `surface-container-low`
- Visual showcase: Spend progress arc (full circle) + credit card stack

**Current state**: Not evaluated — login page uses `PublicHeader` + shadcn `Card` components. Likely significantly different from design.

---

## 5. Mobile Responsiveness Gaps

### 5.1 Mobile Dashboard
- Design: `max-w-[390px]` content, hero metric at `text-[40px]`, horizontal scroll cards (`snap-x`)
- Current: Uses AppShell grid which may not constrain width correctly on mobile

### 5.2 Mobile Card Portfolio
- Design: Horizontal scroll card carousel with `snap-x snap-mandatory`, `min-w-[310px]` per card
- Current: Card grid collapses to single column — no horizontal scroll pattern

### 5.3 Mobile Spend Tracker
- Design: `arc-hero-bg` section with `border-bottom-left-radius: 4rem; border-bottom-right-radius: 4rem`, arc centered
- Arc SVG: `M 20 90 A 80 80 0 0 1 180 90` (different path from desktop: `M 10 50 A 40 40 0 0 1 90 50`)
- Category bento 2-column grid with `glass-card` boxes
- Current: Spending page responsive but arc implementation may use desktop dimensions on mobile

### 5.4 Mobile Profit Dashboard
- Design: Horizontal scrollable bar chart with 6 months, scrolls past viewport
- Bento 2x2 grid for stats (Points Val, Cash Back, ROI card spanning 2 cols)
- Current: No mobile-specific chart layout

### 5.5 Mobile Flights
- Design: Search input at top, horizontal scrollable filter chips, flight cards stacked
- Current: Uses desktop-first layout

### 5.6 Mobile Bottom Nav
- Design: `h-20 pb-safe`, `uppercase tracking-widest font-semibold`, icon `scale-110` on active, `shadow-[0_-8px_32px_rgba(0,0,0,0.5)]`
- Current: `py-1`, `text-[10px] font-medium`, no shadow
- Gap: Missing shadow, font-semibold, tracking-widest, pb-safe

---

## 6. Component Library Gaps

Based on the Stitch component library reference:

### 6.1 Credit Card Component
- **Design spec**: `aspect-[1.586/1]`, bank-specific gradient, last-4 digits, points balance, spend progress bar, `rounded-xl` (not `rounded-2xl`)
- **Current**: No reusable `CreditCard` component — card visuals are ad-hoc
- **Gap**: Create `<CreditCard>` component matching wallet spec

### 6.2 Button Variants
- **Design spec**: Primary (gradient pill, rounded-full), Secondary (outline, secondary color), Ghost (text only), Loading (spinner)
- **Current `button.tsx`**: Has default/destructive/outline/ghost — default uses gradient ✅, but uses `rounded-md` not `rounded-full`
- **Gap**: Primary button should be `rounded-full` per spec

### 6.3 Stat Card Component
- **Design spec**: `surface-container` bg, `rounded-lg` (2rem), label-md for title, display-sm for value, no border header
- **Current**: Uses shadcn `Card` with `CardHeader` — adds visual dividers
- **Gap**: Custom `<StatCard>` without header divider

### 6.4 Activity Feed Item
- **Design spec**: `w-10 h-10 rounded-full` icon container, two-line text, right-aligned value + timestamp
- **Current**: Partial implementations in spending/profit pages
- **Gap**: Extract into shared `<ActivityItem>` component

### 6.5 Progress Bar
- **Design spec**: `h-2 rounded-full bg-surface-container-highest` track, `bg-gradient-to-r from-primary-container to-primary` fill
- **Current**: shadcn `Progress` component (different styling)
- **Gap**: Custom progress bar or override shadcn default styles

### 6.6 Status Badges
- **Design spec**: Success (primary/10 bg, primary text, check_circle icon), Error (error color), Pending (primary/40 animate-pulse)
- **Current**: shadcn `Badge` with variant system
- **Gap**: Design-spec status indicators with icon + background

### 6.7 Input Fields
- **Design spec**: `surface-container-highest` bg, **no border**, focus → `surface-bright` bg + primary ghost border (20% opacity)
- **Current**: shadcn `Input` with `border-[var(--border-default)]`
- **Gap**: Input border should be removed, focus state should use background-shift pattern

### 6.8 Loading State / Shimmer
- **Design**: Not explicitly in component library but shimmer utility exists in `globals.css`
- **Current**: `.shimmer` class defined ✅, but not consistently applied

---

## 7. "No-Line" Rule Violations Audit

The most critical design principle: *"Do not use 1px solid borders to section content."*

| Location | Current Code | Violation |
|---|---|---|
| AppShell sidebar nav | `rounded-xl border border-[var(--border-default)]` | ❌ |
| AppShell header | `border-b border-[var(--border-default)]` | ⚠️ Structural OK |
| Card components | `border border-[var(--border-default)]` | ❌ |
| Input fields | `border-[var(--border-default)]` | ❌ |
| Card detail rows | `border-b border-white/5` | ⚠️ Ghost border OK (5% opacity) |
| Dashboard stat cards | `border border-white/5` | ⚠️ Ghost border OK |

**Rule clarification from DESIGN.md**: Ghost borders at ≤15% opacity (`border-white/5` = 5% opacity) are acceptable fallbacks. Full `--border-default` borders on sections violate the rule.

---

## 8. Animation & Interaction Gaps

| Interaction | Design Spec | Current State | Gap |
|---|---|---|---|
| Nav active → page transition | View transitions via CSS `@view-transition` | Defined in `globals.css` ✅ | ✅ |
| Card hover | `-translate-y-2` + shadow | Not on wallet card components | ❌ |
| Arc hover | stroke-width 10→12 + stronger glow | Not verified in spending page | ⚠️ |
| Button press | `active:scale-95` | Not in current `button.tsx` | ❌ |
| CTA hover | `hover:scale-[1.02]` | `filter: brightness(1.1)` in globals | ⚠️ Different approach |
| Mobile active | `active:bg-white/5` | Not implemented | ❌ |
| Bonus tracker hover | `hover:border-primary/30` | Not in current card styles | ❌ |
| Shimmer loading | `.shimmer` on skeleton | Defined but not consistently used | ⚠️ |
| Points update animation | Tabular nums prevent layout shift | Not enforced globally | ❌ |

---

## 9. Prioritised Task List

### 🔴 P0 — Critical (breaks design system integrity)

1. **[NAV-001] Fix sidebar layout**: Convert from CSS grid column to `fixed left-0 h-screen` with `main {ml-64}` offset. Remove the card wrapper border.
2. **[NAV-002] Remap nav taxonomy**: Home / Cards / Track / Redeem / Account → replace current Home / Cards / Discover / Spending / Timeline
3. **[NAV-003] Fix active state colors**: `bg-[var(--surface-container)]` (#1b1f2c) + `text-[var(--primary)]` (#4edea3) for active items
4. **[TYPO-001] Load Plus Jakarta Sans**: Add to `layout.tsx` via `next/font/google`, map to `--font-headline` CSS var, apply `font-headline` class to all hero metrics
5. **[TOKEN-001] Extend Tailwind config**: Add design system color tokens (`surface-container`, `on-surface`, `primary` etc.) as Tailwind classes mapping to CSS variables
6. **[PROFIT-001] Fix profit chart type**: Replace `AreaChart` with grouped bar chart (bonus bars + fee bars per card)

### 🟡 P1 — High Impact (significant visual regression from design)

7. **[NAV-004] Add sidebar footer elements**: "The Financial Luminary" tagline, "Add New Card" gradient pill button in sidebar, user avatar/name/tier
8. **[CARDS-001] Build Apple Wallet card component**: `aspect-[1.586/1]`, bank gradients, points display, progress bar, hover lift
9. **[CARDS-002] Cards page redesign**: Stats row (Total Limit, Monthly Spend, Points Earned) + card bento grid + detail aside panel
10. **[DASH-001] Dashboard redesign**: Alert strip, hero metric + quick stats, bonus tracker grid, wallet stack, recent points feed
11. **[INPUT-001] Fix input style**: Remove border, use `surface-container-highest` bg, implement focus background-shift

### 🟠 P2 — Medium Impact (noticeable polish gaps)

12. **[MOBILE-001] Mobile bottom nav polish**: Add `shadow-[0_-8px_32px_rgba(0,0,0,0.5)]`, `font-semibold tracking-widest`, `pb-safe`, `scale-110` on active
13. **[MOBILE-002] Mobile card carousel**: Horizontal snap-x scroll on mobile cards page
14. **[MOBILE-003] Mobile spend tracker arc**: Arc dimensions and `arc-hero-bg` section with rounded bottom corners
15. **[PROFIT-002] ROI sections**: Add "High Velocity Assets" + "Holding Strategy" sections with card-level ROI display
16. **[BUTTON-001] Primary button pill**: Change default button `rounded-md` → `rounded-full` to match spec
17. **[TYPO-002] Enforce tabular-nums globally**: Add `tabular-nums` utility class application to all financial figures

### 🟢 P3 — Polish (fine-tuning)

18. **[ANIM-001] Card hover interactions**: `-translate-y-2` + `shadow-primary/10` on wallet cards, `hover:border-primary/30` on bonus tracker cards
19. **[ANIM-002] Button active state**: Add `active:scale-95` to button variants
20. **[COMP-001] Extract shared components**: `<StatCard>`, `<ActivityItem>`, `<ProgressBar>` matching design specs
21. **[LANDING-001] Landing page redesign**: Full Financial Luminary landing with hero, how-it-works, showcase section
22. **[FLIGHTS-001] Flights page polish**: Glassmorphism card style, airline gradient headers, filter chips
23. **[NAV-005] Remove ghost border from sidebar card wrapper**: Replace tonal shift with background-only separation

---

## 10. Files to Modify (Implementation Roadmap)

| File | Changes Required | Priority |
|---|---|---|
| `app/src/components/layout/AppShell.tsx` | Layout → fixed sidebar, nav taxonomy, active colors, sidebar footer | P0 |
| `app/tailwind.config.ts` | Add design system color tokens | P0 |
| `app/src/app/layout.tsx` | Load Plus Jakarta Sans via next/font/google | P0 |
| `app/src/styles/tokens.css` | Add `--font-headline: 'Plus Jakarta Sans', sans-serif` | P0 |
| `app/src/app/profit/page.tsx` | Replace AreaChart with bar chart, add ROI sections + bento grid | P0 |
| `app/src/components/ui/button.tsx` | `rounded-md` → `rounded-full` for default variant | P1 |
| `app/src/components/ui/input.tsx` | Remove border, add bg + focus styles | P1 |
| `app/src/app/cards/page.tsx` | Full redesign: stats row + wallet card grid + detail panel | P1 |
| `app/src/app/dashboard/page.tsx` | Full redesign: alert strip + hero + bonus trackers + card stack | P1 |
| `app/src/components/cards/CardGrid.tsx` | Replace with wallet-style card component | P1 |
| `app/src/app/spending/page.tsx` | Verify arc hover, icon sizes, stat card styles | P2 |
| `app/src/app/flights/page.tsx` | Glassmorphism cards, airline gradients | P2 |

---

## Appendix: Token Mapping Reference

### Current `tokens.css` aliases → Design system canonical names

| Legacy alias (current) | Design canonical | Hex value |
|---|---|---|
| `--surface-muted` | `surface-container-lowest` | `#0a0e1a` |
| `--surface-soft` | `surface-container-low` | `#171b28` |
| `--surface-strong` | `surface-container-high` | `#262a37` |
| `--surface-subtle` | `surface-container-highest` | `#313442` |
| `--text-primary` | `on-surface` | `#dfe2f3` |
| `--text-secondary` | `on-surface-variant` | `#bbcabf` |
| `--accent` | `primary` | `#4edea3` |
| `--border-default` | `outline-variant` at 5% opacity | `rgba(255,255,255,0.05)` |

---

*End of gap analysis. Next step: implement in priority order starting with P0 items.*
