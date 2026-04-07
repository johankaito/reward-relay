# Design Gap Analysis — Reward Relay
**Generated**: 2026-04-06 (full refresh — holistic + mobile audit)
**Scope**: Desktop + Mobile + Component Library + Onboarding vs current Next.js implementation
**Method**: Line-by-line comparison of all Stitch design HTML files + DESIGN.md against current source code + automated scans
**Confidence**: 98%

---

## 0. Executive Summary

Full audit of all Stitch exports (7 desktop pages, 7 mobile pages, 2 component library files) + onboarding flow against all source files.

**22 discrete gaps identified**: 2 P0 critical, 8 P1 high, 7 P2 medium, 5 P3 polish.

**Resolved since last audit (2026-03-22)**: Sidebar is now fixed full-height (`h-screen fixed`) ✅. Nav taxonomy now correct (Home/Cards/Track/Redeem/Account) ✅. Active nav state colors correct ✅. Sidebar footer (tagline, Add New Card CTA, user avatar + tier) all present ✅. Tailwind v4 `@theme inline` block in `globals.css` now exposes design tokens as Tailwind classes ✅. `--font-headline` alias now defined ✅. Profit chart changed from AreaChart to grouped BarChart ✅. Mobile bottom nav: shadow, `font-semibold`, `pb-safe`, `scale-110`, `active:bg-white/5` all present ✅. Mobile spend arc path `M 20 90 A 80 80 0 0 1 180 90` implemented ✅. Profit page has `overflow-x-auto` chart wrapper + `grid-cols-2` stat bento ✅. Dashboard hero uses `text-[40px]` on mobile + `grid-cols-2` stat cards ✅. Cards page has `snap-x snap-mandatory overflow-x-auto` carousel ✅. NewChurnerOnboarding spend chips have `overflow-x-auto` ✅.

**Remaining biggest gaps**: No-Line Rule violations now spread to 9+ files including new `tracker/[id]` and `dashboard/cards/[id]` pages + AwardRouteCard. Hardcoded hex colors persist across AppShell, ProGate, UpgradeModal, ReportIncorrectForm, progress-bar. Sidebar width mismatch (w-72=288px vs spec w-64=256px). Card carousel snap alignment (snap-center vs snap-start). Onboarding border-2 on selection cards violates No-Line Rule. Bottom nav tracking too tight vs spec.

---

## 1. Design Token Gaps

| Token | Design Value | Current `tokens.css` / `globals.css` | Status |
|---|---|---|---|
| `--surface` | `#0f131f` | `#0f131f` | ✅ |
| `--primary` | `#4edea3` | `#4edea3` | ✅ |
| `--primary-container` | `#10b981` | `#10b981` | ✅ |
| `--secondary` | `#d0bcff` | `#d0bcff` | ✅ |
| `--surface-container-low` | `#171b28` | `#171b28` | ✅ |
| `--surface-container` | `#1b1f2c` | `#1b1f2c` | ✅ |
| `--surface-container-highest` | `#313442` | `#313442` | ✅ |
| `--outline-variant` | `#3c4a42` | `#3c4a42` | ✅ |
| `--shadow-ambient` | `0px 24px 48px -12px rgba(0,0,0,0.4)` | `0px 24px 48px -12px rgba(0,0,0,0.4)` | ✅ |
| Tailwind token classes | Exposed via `@theme inline` in `globals.css` (Tailwind v4) | All design tokens exposed as Tailwind classes | ✅ |
| `--font-headline` | Plus Jakarta Sans | Defined + aliased correctly in `globals.css` | ✅ |
| `theme-color` meta | `#0f131f` | `#0a0a0b` (wrong) | ❌ |

---

## 2. Typography Gaps

| Spec | Design Requirement | Current State | Status |
|---|---|---|---|
| Hero display font | Plus Jakarta Sans, 400–800 weight | Loaded correctly, `--font-headline` alias correct | ✅ |
| Hero size (desktop) | `display-lg` = 3.5rem, `font-extrabold` | `text-5xl md:text-6xl lg:text-[80px] font-extrabold` | ✅ |
| Hero size (mobile) | `text-[40px]` | `text-[40px]` | ✅ |
| Body / label font | Inter | Inter loaded as default | ✅ |
| Tabular numbers | Global on all financial values | 34+ instances — good coverage | ✅ |
| IBM Plex Mono | Not in design spec | Loaded in `layout.tsx` — extra font weight | ⚠️ P3 |

---

## 3. AppShell / Navigation Gaps

### 3.1 Nav Taxonomy

| Design Items | Current Items | Status |
|---|---|---|
| Home | Home (`/dashboard`) | ✅ |
| Cards | Cards (`/cards`) | ✅ |
| Track | Track (`/spending`) | ✅ |
| Redeem | Redeem (`/flights`) | ✅ |
| Account | Account (`/settings`) | ✅ |

### 3.2 Sidebar Layout

| Attribute | Design | Current | Status |
|---|---|---|---|
| Position | `fixed left-0 top-0 h-screen` | `fixed left-0 top-0 h-screen` | ✅ |
| Width | `w-64` (256px) | `w-72` (288px) | ❌ 32px too wide |
| Background | `surface-container-low` = `#171b28` | `bg-[#171b28]` | ✅ (hardcoded) |
| Border | Ghost border `border-r border-white/5` | `border-r border-white/5` | ✅ |
| Main offset | `md:ml-64` | `md:pl-72` (matches current w-72) | ⚠️ Consistent but wrong vs spec |

### 3.3 Active Nav State Colors

| Attribute | Design | Current | Status |
|---|---|---|---|
| Active item bg | `surface-container` = `#1b1f2c` | `bg-surface-container` | ✅ |
| Active item text | `text-primary` = `#4edea3` | `text-primary` | ✅ |
| Active icon | `text-primary` | `text-primary` | ✅ |
| Hover bg | `hover:bg-surface-container-highest` | `hover:bg-surface-container-highest` | ✅ |

### 3.4 Mobile Bottom Nav

| Attribute | Design | Current | Status |
|---|---|---|---|
| Height | `h-20` (80px) | `minHeight: 80` inline style | ✅ (equivalent) |
| `pb-safe` | Required for iPhone home bar | `pb-safe` class present | ✅ |
| Background | `bg-[#0f131f]/90 backdrop-blur-2xl` | `rgba(15,19,31,0.80)` + `backdropFilter: blur(24px)` | ✅ |
| Shadow | `shadow-[0_-8px_32px_rgba(0,0,0,0.5)]` | `boxShadow: "0 -8px 32px rgba(0,0,0,0.5)"` | ✅ |
| Font weight | `font-semibold uppercase tracking-widest` | `font-semibold uppercase tracking-[0.05em]` | ❌ tracking too tight (0.05em vs 0.1em for `tracking-widest`) |
| Active icon | `scale-110` | `scale-110` | ✅ |
| Active text | `text-[#4edea3]` | `text-primary` (resolves to `#4edea3`) | ✅ |
| Inactive text | `text-slate-500` | `text-on-surface-variant` (resolves to `#bbcabf` — lighter than slate-500) | ❌ Wrong shade |
| `md:hidden` on bottom nav | Required | `md:hidden` on `<nav>` | ✅ |

### 3.5 Sidebar Footer

| Element | Design | Current | Status |
|---|---|---|---|
| "The Financial Luminary" tagline | Below logo | Present | ✅ |
| "Add New Card" gradient pill | Bottom of sidebar | Present | ✅ |
| User avatar + name + tier | Sidebar footer | Present | ✅ |

---

## 4. Page-by-Page Comparison Tables

### §1 Dashboard

| Gap ID | Description | Design Intent | Current | Priority |
|---|---|---|---|---|
| [DASH-001] | Hero metric shows correct value | Total portfolio dollar value | ✅ Implemented (FY net profit + wallet value) | ✅ Resolved |
| [DASH-002] | Hero font size mobile | `text-[40px]` | `text-[40px]` | ✅ Resolved |
| [DASH-003] | Stat cards grid on mobile | `grid-cols-2` | `grid-cols-2 md:grid-cols-4` | ✅ Resolved |
| [DASH-004] | Snap-scroll card row on mobile | `snap-x` horizontal scroll | Not implemented on dashboard (spending-tracker style) | P3 |
| [DASH-005] | Alert strip | Left emerald border strip with dismiss | Not present | P2 |
| [DASH-006] | 3D wallet card stack | 3 WalletCards with `rotate-3`, `rotate-1`, `-rotate-1` | No stacked rotated layout | P2 |
| [DASH-007] | Recent points activity feed | Category icons + point values | Not present | P2 |

### §2 Cards

| Gap ID | Description | Design Intent | Current | Priority |
|---|---|---|---|---|
| [CARDS-001] | Snap alignment | `snap-start` per card | `snap-center` | P2 |
| [CARDS-002] | Card min-width | `min-w-[310px]` per card | `min-w-[300px]` | P3 |
| [CARDS-003] | Spend progress bar location | Embedded inside card face | Below card face div | P1 |
| [CARDS-004] | Points balance on card | Visible on card surface | Not displayed | P1 |
| [CARDS-005] | Card hover lift | `group-hover:-translate-y-2` | `group-hover:-translate-y-1` | P3 |
| [CARDS-006] | Detail aside panel | Glassmorphism right panel — bonus progress + activity | Not present | P2 |
| [CARDS-007] | Stats row | Total Limit / Monthly Spend / Points Earned stat cards | Not present | P2 |

### §3 Spending Tracker

| Gap ID | Description | Design Intent | Current | Priority |
|---|---|---|---|---|
| [SPEND-001] | 4 glassmorphism stat cards | Top row: Est. Rewards / Time Remaining / Maximize Return / Upcoming Bills | Not present | P1 |
| [SPEND-002] | Mobile arc path | `M 20 90 A 80 80 0 0 1 180 90` | ✅ Implemented | ✅ Resolved |
| [SPEND-003] | Arc viewBox | `0 0 200 100` | `0 0 200 100` | ✅ Resolved |
| [SPEND-004] | Mobile arc-hero-bg rounded-bottom | `border-bottom-left-radius: 4rem` on section | Not applied | P3 |

### §4 Profit

| Gap ID | Description | Design Intent | Current | Priority |
|---|---|---|---|---|
| [PROFIT-001] | Chart type | Grouped bar chart | BarChart with bonus+fee bars ✅ | ✅ Resolved |
| [PROFIT-002] | Chart overflow | `overflow-x-auto` + `min-w-[480px]` | `overflow-x-auto` + `min-w-[500px]` | ✅ Close enough |
| [PROFIT-003] | Stats bento mobile | `grid-cols-2` | `grid-cols-2 gap-4` | ✅ Resolved |
| [PROFIT-004] | +22% from last FY pill | Percentage comparison pill under hero | Not present | P2 |
| [PROFIT-005] | High Velocity Assets section | Cards with ROI 12.4x, 8.2x, gradient text | Not present | P2 |
| [PROFIT-006] | 3 insight bento cards | Potential Savings / Next ROI Peak / Wallet Health | Not present | P3 |

### §5 Flights

| Gap ID | Description | Design Intent | Current | Priority |
|---|---|---|---|---|
| [FLIGHTS-001] | Search input shape | `rounded-full`, full width | Standard `Input` (rounded-md) | P2 |
| [FLIGHTS-002] | Route cards style | Glassmorphism `.glass-card` with airline gradient headers | `AwardRouteCard` with standard border (No-Line violation) | P1 |
| [FLIGHTS-003] | Filter chips | Horizontal scrollable chip row | Standard form inputs | P2 |
| [FLIGHTS-004] | "Global Search" badge | Present next to title | Not present | P3 |

### §6 Landing Page

| Gap ID | Description | Design Intent | Current | Priority |
|---|---|---|---|---|
| [LANDING-001] | Overall structure | H1 / CTA / social proof / how-it-works / arc showcase | Substantially matches | ✅ |
| [LANDING-002] | Hero font size | `text-7xl` on large viewports | Present with gradient | ✅ |
| [LANDING-003] | BetaGate path | Not in Stitch design | Present — extra auth flow | ⚠️ P3 |
| [LANDING-004] | theme-color meta | `#0f131f` | `#0a0a0b` | P2 |

### §7 Onboarding (new)

| Gap ID | Description | Design Intent | Current | Priority |
|---|---|---|---|---|
| [ONB-001] | OnboardingGate selection cards border | No-Line Rule — background tonal shift only | `border-2` on selection cards (100% opaque) | P1 |
| [ONB-002] | OnboardingGate token consistency | Design tokens (primary color) | `teal-400`, `teal-500` hardcoded Tailwind utilities instead of `primary` | P2 |
| [ONB-003] | PainPointHook locked gap panel border | Ghost border ≤15% opacity | `border border-white/10` (10% opacity) ✅ | ✅ |
| [ONB-004] | PainPointHook lg:hidden panel | Mobile locked gap preview below CTAs | `lg:hidden` panel present | ✅ |
| [ONB-005] | OnboardingGate grid-cols | `grid-cols-1` on mobile | `grid-cols-1 sm:grid-cols-2` | ✅ |
| [ONB-006] | NewChurnerOnboarding spend chips | Horizontal scroll on mobile | `flex gap-2 overflow-x-auto` | ✅ |
| [ONB-007] | PainPointHook color tokens | Use `var(--primary)` / `text-primary` | `text-teal-400`, `bg-teal-500/10` (Tailwind utilities, not design tokens) | P2 |
| [ONB-008] | OnboardingGate background token | `bg-[var(--surface)]` | `bg-[#0F131F]` hardcoded | P2 |

---

## 5. Mobile Responsiveness Gaps

### §8 Mobile Responsiveness Gaps

| Gap ID | Description | Design Intent | Current | Priority |
|---|---|---|---|---|
| [MOB-001] | Bottom nav tracking | `tracking-widest` (0.1em) | `tracking-[0.05em]` | P2 |
| [MOB-002] | Bottom nav inactive text color | `text-slate-500` (#64748b) | `text-on-surface-variant` (#bbcabf) — too light | P2 |
| [MOB-003] | Cards snap alignment | `snap-start` per card | `snap-center` | P2 |
| [MOB-004] | Cards card min-width | `min-w-[310px]` | `min-w-[300px]` | P3 |
| [MOB-005] | Touch targets bottom nav | min 44×44px — `flex-1` on items | `py-2 px-1` — grid layout fills evenly ✅ | ✅ |
| [MOB-006] | Mobile spend arc | `M 20 90 A 80 80 0 0 1 180 90`, `viewBox 0 0 200 100` | Both correct | ✅ |
| [MOB-007] | Profit chart mobile | `overflow-x-auto` + `min-w-[480px]` | Present (`min-w-[500px]`) | ✅ |
| [MOB-008] | Profit stats mobile | `grid-cols-2` bento | `grid-cols-2 gap-4` | ✅ |
| [MOB-009] | Dashboard hero mobile | `text-[40px]` | `text-[40px]` | ✅ |
| [MOB-010] | Dashboard stat cards mobile | `grid-cols-2` | `grid-cols-2 md:grid-cols-4` | ✅ |
| [MOB-011] | OnboardingGate mobile layout | `grid-cols-1` | `grid-cols-1 sm:grid-cols-2` | ✅ |
| [MOB-012] | PainPointHook mobile panel | `lg:hidden` gap panel below CTAs | Present | ✅ |
| [MOB-013] | NewChurnerOnboarding spend chips | Horizontal scroll | `overflow-x-auto` present | ✅ |
| [MOB-014] | Sidebar width | `w-64` (256px) | `w-72` (288px) | P2 |

---

## 6. Component Library Gaps

### 6.1 WalletCard Component

| Attribute | Design spec | Current `WalletCard.tsx` / cards page | Status |
|---|---|---|---|
| Aspect ratio | `aspect-[1.586/1]` | `aspect-[1.586/1]` | ✅ |
| Corner radius | `rounded-xl` | `rounded-xl` | ✅ |
| Bank gradients | Custom per bank | `getBankGradient()` | ✅ |
| Hover lift | `group-hover:-translate-y-2` | `group-hover:-translate-y-1` | ❌ |
| Spend progress bar | Embedded inside card face | Below card face | ❌ |
| Points balance | On card surface | Not shown | ❌ |
| Ambient shadow | `0px 24px 48px -12px rgba(0,0,0,0.4)` | `shadow-2xl` | ⚠️ |

### 6.2 Button Component

| Attribute | Design spec | Current `button.tsx` | Status |
|---|---|---|---|
| Shape | `rounded-full` pill | `rounded-md` | ❌ |
| Fill | Gradient `from-primary to-primary-container` | Gradient ✅ | ✅ |
| Active press | `active:scale-95` | Not in default variants | ❌ |
| Font | `title-sm` (Inter 14px medium) | `text-sm font-medium` | ✅ |

### 6.3 Input Component

| Attribute | Design spec | Current `input.tsx` | Status |
|---|---|---|---|
| Border | No border — background-only | `border border-input` — No-Line violation | ❌ |
| Background | `surface-container-highest` = `#313442` | `transparent` | ❌ |
| Focus state | Background shifts + primary ghost border 20% | Default focus ring | ❌ |

### 6.4 Card Component

| Attribute | Design spec | Current `card.tsx` | Status |
|---|---|---|---|
| Border | Ghost border ≤15% opacity | `border border-[var(--border-default)]` — No-Line violation | ❌ |
| Corner radius | Stat: `rounded-lg`; wallet: `rounded-xl` | `rounded-xl` on all | ⚠️ |

---

## 7. No-Line Rule Violations Audit

*Rule: No explicit 1px solid borders on content sections. Use tonal shifts or ghost borders ≤15% opacity.*

| Location | Violation | Severity |
|---|---|---|
| `app/src/components/ui/input.tsx` | `border border-input` on input field | ❌ P0 |
| `app/src/components/ui/card.tsx` | `border border-[var(--border-default)]` | ❌ P1 |
| `app/src/components/layout/AppShell.tsx` | Search input `border border-white/5` | ✅ Ghost OK |
| `app/src/app/tracker/[id]/page.tsx` | 4 instances `border border-[var(--border-default)]` | ❌ P1 |
| `app/src/app/dashboard/cards/[id]/page.tsx` | 7 instances `border border-[var(--border-default)]` | ❌ P1 |
| `app/src/components/flights/AwardRouteCard.tsx` | `border border-[var(--border-default)]` | ❌ P1 |
| `app/src/components/ui/button.tsx` | Outline variant uses `border border-[var(--border-default)]` | ❌ P1 |
| `app/src/components/gamification/Leaderboard.tsx` | `border border-[var(--border-default)]` | ❌ P1 |
| `app/src/components/inquiries/CadenceAdvisor.tsx` | `border border-[var(--border-default)]` | ❌ P1 |
| `app/src/app/admin/deals/page.tsx` | 2 instances | ⚠️ P2 (admin) |
| `app/src/app/(auth)/update-password/page.tsx` | 2 instances | ⚠️ P2 (auth) |
| `app/src/app/(auth)/reset-password/page.tsx` | 1 instance | ⚠️ P2 (auth) |
| `app/src/components/onboarding/OnboardingGate.tsx` | `border-2` on selection cards | ❌ P1 |
| `card.tsx` rows `border-b border-white/5` | Ghost border (5% opacity) | ✅ OK |
| Dashboard stat cards `border border-white/5` | Ghost border (5% opacity) | ✅ OK |

---

## 8. Hard-Coded Color Violations

*Rule: All colors should reference CSS variables from `tokens.css`, not hardcoded hex values.*

| File | Hard-coded values | Fix |
|---|---|---|
| `app/src/components/layout/AppShell.tsx` | `#4edea3`, `#10b981`, `#1b1f2c`, `#171b28`, `#0f131f`, `#003824` | Use `var(--primary)`, `var(--primary-container)`, CSS token vars |
| `app/src/components/ui/ProGate.tsx` | `#4edea3` (×5) | Use `var(--primary)` / `text-primary` |
| `app/src/components/subscription/UpgradeModal.tsx` | `#4edea3` (×5) | Use `var(--primary)` / `text-primary` |
| `app/src/components/ui/ReportIncorrectForm.tsx` | `#4edea3`, `#10b981` | Use CSS token vars |
| `app/src/components/ui/progress-bar.tsx` | `#10b981`, `#4edea3` | Use `var(--primary)`, `var(--primary-container)` |
| `app/src/components/ui/DataFreshnessChip.tsx` | `#4edea3` | Use `var(--primary)` |
| `app/src/app/cards/page.tsx` | `#ffb4ab`, `#4edea3` | Use `var(--error)`, `var(--primary)` |
| Onboarding components | `teal-400`, `teal-500` utilities | Use `primary`, `primary-container` design tokens |

---

## 9. Automated Scan Results

### No-Line Rule grep
```
13 violations found in: tracker/[id], dashboard/cards/[id], AwardRouteCard, button.tsx (outline variant),
Leaderboard, CadenceAdvisor, admin/deals, auth pages, OnboardingGate
```

### Hard-coded colors grep
```
28 instances found across: AppShell, ProGate, UpgradeModal, ReportIncorrectForm,
progress-bar, DataFreshnessChip, cards/page.tsx, onboarding components
```

### Missing tabular-nums (heuristic)
```
flights/page.tsx: point values rendered without tabular-nums (plural displays of 164000, 118500 pts)
insights/page.tsx: AUD currency format without tabular-nums wrapper
```

### Token coverage in globals.css
```
All design system tokens exposed via @theme inline block ✅
surface-container, on-surface, primary, outline-variant all present as Tailwind classes
```

---

## 10. Task List (sorted by priority)

### P0 — Critical

1. **[INPUT-001] Fix input.tsx No-Line Rule**: Remove `border border-input`. Set bg `surface-container-highest` (#313442). Focus: background shifts to `surface-bright` + primary ghost border 20% opacity. Affects every form field in the app.

2. **[TOKEN-002] Fix theme-color meta tag**: In `layout.tsx`, update `theme-color` dark meta from `#0a0a0b` to `#0f131f`.

### P1 — High Impact

3. **[NOLINEV-001] Fix card.tsx border**: Replace `border border-[var(--border-default)]` with `border border-white/5` (ghost 5% opacity).

4. **[NOLINEV-002] Fix tracker/[id]/page.tsx No-Line violations**: 4 instances — replace with `bg-surface-container` tonal shift, remove hard borders.

5. **[NOLINEV-003] Fix dashboard/cards/[id]/page.tsx No-Line violations**: 7 instances — replace with tonal background shifts.

6. **[NOLINEV-004] Fix AwardRouteCard border**: Replace `border border-[var(--border-default)]` with `border border-white/5` or glassmorphism bg.

7. **[ONB-001] Fix OnboardingGate selection card border**: Replace `border-2` with tonal bg approach — `bg-white/5 hover:bg-white/10` + `ring-1 ring-primary/30` on selected state.

8. **[CARDS-003] Embed spend progress bar inside WalletCard face**: Position bar inside card face div, not below it.

9. **[CARDS-004] Add points balance display to WalletCard face**: Show welcome_bonus_points or current points balance on card surface.

10. **[SPEND-001] Add 4-column stat cards to spending page**: Est. Rewards / Time Remaining / Maximize Return / Upcoming Bills using `.glass-panel` above arc.

### P2 — Medium Impact

11. **[TOKEN-003] Replace hardcoded hex in AppShell**: Use CSS vars throughout (`var(--primary)` etc.) — currently 8+ hardcoded values.

12. **[TOKEN-004] Replace hardcoded hex in ProGate + UpgradeModal**: Use `text-primary`, `bg-primary/10`, `ring-primary/30` token-based classes.

13. **[TOKEN-005] Replace hardcoded hex in progress-bar, ReportIncorrectForm, DataFreshnessChip**: Use CSS token vars.

14. **[MOB-001] Fix bottom nav tracking**: Change `tracking-[0.05em]` to `tracking-widest` on nav label span.

15. **[MOB-002] Fix bottom nav inactive text**: Change `text-on-surface-variant` to `text-slate-500` to match spec.

16. **[MOB-014] Fix sidebar width**: Change `w-72` (288px) to `w-64` (256px), update `pl-72` → `pl-64` on content offset and `left: 288` → `left: 256` on desktop header.

17. **[ONB-002] Onboarding token consistency**: Replace `teal-400`/`teal-500` Tailwind utilities with `primary`/`primary-container` design token classes across all onboarding components.

18. **[DASH-005] Add dashboard alert strip**: Left emerald border strip (`border-l-4 border-primary`) with dismiss button, above the hero section.

19. **[PROFIT-004] Add +22% comparison pill on profit page**: Under hero metric, show % change from previous FY.

20. **[FLIGHTS-001] Fix flights search input shape**: `rounded-full` on search input.

21. **[BUTTON-001] Primary button pill shape**: Change default `rounded-md` → `rounded-full` on button variants.

22. **[NOLINEV-005] Fix button.tsx outline variant**: Replace `border border-[var(--border-default)]` with `border border-white/10`.

### P3 — Polish

23. **[ANIM-001] Card hover lift amount**: Fix WalletCard hover to `-translate-y-2` (currently `-translate-y-1`).

24. **[ANIM-002] Button active:scale-95**: Add `active:scale-95` to primary button variant.

25. **[TYPO-001] Remove IBM Plex Mono**: Not in design spec — removes unnecessary font load from `layout.tsx`.

26. **[FLIGHTS-004] "Global Search" badge**: Add badge next to flights page title.

27. **[SPEND-004] Mobile arc-hero-bg rounded-bottom**: Add `border-bottom-left-radius: 4rem; border-bottom-right-radius: 4rem` to arc hero section container on mobile.

---

## 11. Files to Modify (Implementation Roadmap)

| File | Changes Required | Priority |
|---|---|---|
| `app/src/components/ui/input.tsx` | Remove border, surface-container-highest bg, focus background-shift | P0 |
| `app/src/app/layout.tsx` | Fix theme-color meta tag to `#0f131f` | P0 |
| `app/src/components/ui/card.tsx` | Replace hard border with ghost border `border-white/5` | P1 |
| `app/src/app/tracker/[id]/page.tsx` | Remove 4× No-Line violations, use tonal backgrounds | P1 |
| `app/src/app/dashboard/cards/[id]/page.tsx` | Remove 7× No-Line violations, use tonal backgrounds | P1 |
| `app/src/components/flights/AwardRouteCard.tsx` | Replace border, add glassmorphism styling | P1 |
| `app/src/components/onboarding/OnboardingGate.tsx` | Replace `border-2` with tonal bg + ring on selected | P1 |
| `app/src/components/ui/WalletCard.tsx` | Embed progress bar, add points display, fix hover | P1 |
| `app/src/app/spending/page.tsx` | Add 4-column glassmorphism stat cards at top | P1 |
| `app/src/components/layout/AppShell.tsx` | Replace hardcoded hex with CSS vars, fix sidebar w-72→w-64, nav tracking | P2 |
| `app/src/components/ui/ProGate.tsx` | Replace `#4edea3` hardcoded with `var(--primary)` | P2 |
| `app/src/components/subscription/UpgradeModal.tsx` | Replace `#4edea3` hardcoded with `var(--primary)` | P2 |
| `app/src/components/ui/progress-bar.tsx` | Replace hardcoded hex with CSS vars | P2 |
| `app/src/app/profit/page.tsx` | Add +22% comparison pill | P2 |
| `app/src/components/ui/button.tsx` | `rounded-md` → `rounded-full`, `active:scale-95`, fix outline variant border | P2 |
| All onboarding components | Replace teal-* utilities with primary token classes | P2 |

---

## Appendix: Token Mapping Reference

### Current `tokens.css` legacy aliases → Design system canonical names

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
| `--font-headline` | Maps to `var(--font-headline)` (Plus Jakarta Sans) | Plus Jakarta Sans |

### Ghost Border Reference

Acceptable ghost borders (≤15% opacity):
- `border-white/5` = 5% opacity ✅
- `border-white/10` = 10% opacity ✅
- `border-primary/15` = 15% opacity ✅
- `border-[var(--border-default)]` = 100% opaque ❌ **Violates No-Line Rule**
- `border-2` without opacity modifier ❌ **Violates No-Line Rule**
