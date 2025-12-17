# REWARDIFY - PARALLEL EXECUTION STRATEGY

**🚀 FOR SPEED**: Run multiple AI agents simultaneously on independent tasks
**⚡ GOAL**: Reduce 8 weeks to 4-6 weeks through parallelization
**🤖 AGENTS**: 3-4 AI coding assistants working concurrently

---

## 🎯 PARALLEL WORK STREAMS (Week 1 Example)

### Stream 1: Backend/Database Agent
**Focus**: Supabase setup, schema, data
**Independence**: No frontend dependencies

**Tasks**:
- Create Supabase project
- Design database schema
- Create tables with RLS
- Add 30 Australian card data
- Create database types export
- Test queries

**Time**: 4-6 hours
**Blocks**: Nothing (fully independent)

---

### Stream 2: Auth Agent
**Focus**: Authentication flow
**Independence**: Only needs Supabase credentials (from Stream 1)

**Tasks**:
- Setup Supabase Auth helpers
- Build login page
- Build signup page
- Build password reset
- Create auth context
- Protected route middleware

**Time**: 4-6 hours
**Depends On**: Stream 1 (Supabase credentials)

---

### Stream 3: UI/Components Agent
**Focus**: Design system, reusable components
**Independence**: Can build in isolation

**Tasks**:
- Setup shadcn/ui
- Install needed components (button, card, input, etc.)
- Create layout components (navbar, sidebar, footer)
- Create card components (CardItem, CardGrid)
- Create empty states
- Create loading skeletons

**Time**: 4-6 hours
**Blocks**: Nothing (UI components are standalone)

---

### Stream 4: Card Catalog Agent
**Focus**: Display Australian cards
**Depends On**: Stream 1 (database) + Stream 3 (UI components)

**Tasks**:
- Fetch cards from Supabase
- Build card catalog page
- Add search functionality
- Add filters (by bank)
- Add sorting
- Card detail view

**Time**: 3-4 hours
**Depends On**: Stream 1 + Stream 3

---

## 🔄 COORDINATION STRATEGY

### How Agents Coordinate:

**Option 1: Sequential Handoffs**
```
Agent 1 (Database) → Finish
  ↓ [Handoff: Supabase credentials + schema]
Agent 2 (Auth) → Start
Agent 3 (UI) → Start (parallel with Agent 2)
  ↓ [Both finish]
Agent 4 (Features) → Integrate Auth + UI
```

**Option 2: True Parallel (Recommended)**
```
Agent 1 (Database) ────→ [Creates schema, returns types]
                         ↓
Agent 2 (Auth) ─────────→ [Builds login, uses DB types]
                         ↓
Agent 3 (UI) ───────────→ [Builds components independently]
                         ↓
Agent 4 (Integration) ──→ [Assembles everything]
```

---

## 📋 TASK ASSIGNMENT MATRIX (Week 1)

| Task | Agent | Duration | Depends On | Deliverable |
|------|-------|----------|------------|-------------|
| **Project Setup** | Any | 30 min | None | Running Next.js app |
| **Supabase Schema** | Agent 1 (DB) | 2 hrs | Setup | Tables + RLS + 30 cards |
| **Auth Flow** | Agent 2 (Auth) | 3 hrs | Schema | Login/signup working |
| **shadcn/ui Setup** | Agent 3 (UI) | 2 hrs | Setup | Component library ready |
| **Card Components** | Agent 3 (UI) | 2 hrs | shadcn | CardItem, CardGrid |
| **Card Catalog Page** | Agent 4 (Features) | 3 hrs | DB + UI | Browse 30 cards |
| **Dashboard** | Agent 4 (Features) | 2 hrs | Auth + UI | Protected dashboard |

**Total Time (Sequential)**: 14 hours
**Total Time (Parallel)**: 6-7 hours (3-4 agents working simultaneously)

**Speed Improvement**: ~2x faster with parallelization

---

## 🏃 HOW TO RUN MULTIPLE AGENTS

### Setup (First Time):

**In Claude Code (or similar tool)**:

1. **Agent 1 - Database**:
   ```
   You are the Database Agent. Your mission: Setup Supabase schema.

   Read: ~/ideas/rewardify/FOR_AI_AGENTS.md (Stream 1 tasks)
   Execute: Database schema creation
   Deliver: Supabase credentials + schema confirmation
   ```

2. **Agent 2 - Auth** (in parallel window):
   ```
   You are the Auth Agent. Your mission: Build authentication.

   Read: ~/ideas/rewardify/FOR_AI_AGENTS.md (Stream 2 tasks)
   Wait for: Supabase credentials from Agent 1
   Execute: Auth flow (login, signup, protected routes)
   Deliver: Working auth system
   ```

3. **Agent 3 - UI** (in parallel window):
   ```
   You are the UI Agent. Your mission: Build design system.

   Read: ~/ideas/rewardify/FOR_AI_AGENTS.md (Stream 3 tasks)
   Execute: shadcn/ui setup + core components
   Deliver: Component library + layouts
   ```

4. **Agent 4 - Integration** (runs after 1-3 complete):
   ```
   You are the Integration Agent. Your mission: Assemble everything.

   Wait for: All 3 agents to complete
   Execute: Card catalog + dashboard integration
   Deliver: Working Week 1 deliverables
   ```

---

## 📝 HANDOFF PROTOCOL (Between Agents)

### When Agent Completes Task:

**Create Handoff Document**:
```markdown
## Agent 1 (Database) Handoff
**Date**: 2025-12-XX
**Status**: ✅ Complete

**What I Did**:
- Created Supabase project: [URL]
- Created schema (cards, user_cards, spending_profiles)
- Added RLS policies
- Inserted 30 Australian cards

**For Next Agent**:
Supabase credentials:
- URL: [supabase_url]
- Anon Key: [anon_key]
- Database types: Generated at src/types/database.types.ts

**What's Ready**:
- ✅ Cards table (30 cards)
- ✅ User cards table (ready for user data)
- ✅ RLS working (tested)

**What's Needed Next**:
- Auth flow (Agent 2)
- UI components (Agent 3)
- Card catalog page (Agent 4)

**Blockers**: None

**Files Modified**:
- .env.local (created)
- src/types/database.types.ts (generated)
```

**Save To**: `~/ideas/rewardify/handoffs/agent-1-database.md`

---

## 🔄 SESSION HANDOFF (New Claude Session Picks Up)

### For Continuity Between Sessions:

**Create**: `~/ideas/rewardify/CURRENT_STATE.md` (update after each session)

```markdown
# Rewardify - Current State

**Last Updated**: 2025-12-XX XX:XX
**Week**: X of 8
**Status**: [In Progress / Blocked / On Track]

## What's Complete:
- ✅ Project setup
- ✅ Auth flow
- ✅ Database schema
- ⚠️ Card catalog (70% done)
- ❌ Calendar (not started)

## What's In Progress:
- Card catalog page (Agent 3)
  - Status: Adding filters and search
  - Blocker: None
  - ETA: 2 hours

## What's Next:
1. Finish card catalog (2 hrs)
2. Start dashboard (3 hrs)
3. Card tracking form (4 hrs)

## Current Blockers:
- None / [Describe blocker]

## Files Modified This Session:
- src/app/(app)/cards/page.tsx
- src/components/cards/card-grid.tsx

## Next Session Should:
1. [Specific next task]
2. [Then this task]
3. Update this file when done

## Questions for Human:
- [Any questions that need human input]
```

**Update this file**:
- After every coding session
- When switching agents
- When hitting blocker
- End of each day

**New session reads this first** → knows exactly where to continue

---

## 🎨 DESIGN SPECIFICATION

### Visual Reference (Inspiration):

**Similar Apps (Study These)**:
- MaxRewards.com (US app) - Clean dashboard, card grid
- PointsHacks.com.au - Table layouts, comparison views
- Stripe Dashboard - Professional SaaS feel
- Linear.app - Modern, fast, polished

**Design Vibe**:
- Clean and professional (not playful)
- Data-dense but scannable
- Trust-building (financial tool)
- Fast and responsive

---

### Design System Specs:

**Typography**:
```css
H1: text-3xl font-bold (Dashboard headings)
H2: text-2xl font-semibold (Section headings)
H3: text-xl font-semibold (Card titles)
Body: text-base (Regular text)
Small: text-sm text-gray-600 (Meta info)
```

**Card Component Pattern**:
```tsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>AMEX Platinum</CardTitle>
    <p className="text-sm text-gray-500">American Express</p>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm">Welcome Bonus</span>
        <span className="font-semibold">150,000 pts</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm">Annual Fee</span>
        <span className="font-semibold">$1,295</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm">Net Value</span>
        <span className="font-semibold text-green-600">$205</span>
      </div>
    </div>
  </CardContent>
</Card>
```

**Status Badges**:
```tsx
// Active card
<Badge variant="default">Active</Badge>

// Cancelled
<Badge variant="secondary">Cancelled</Badge>

// Pending approval
<Badge variant="outline">Pending</Badge>
```

**Reference**: https://ui.shadcn.com/docs/components/badge

---

## 🎯 DESIGN MOCKUPS (Key Pages)

### Dashboard (Mobile & Desktop)

**Mobile (375px)**:
```
┌─────────────────────┐
│  ≡  Rewardify    🔔 │
├─────────────────────┤
│ Hi John             │
│                     │
│ ┌─────────────────┐ │
│ │ Recommended     │ │
│ │ ANZ Frequent    │ │
│ │ Flyer Black     │ │
│ │ 100K points     │ │
│ │ [Apply Now]     │ │
│ └─────────────────┘ │
│                     │
│ Your Cards (2)      │
│ ┌─────────────────┐ │
│ │ AMEX Platinum   │ │
│ │ Active • 245d   │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ ANZ Rewards     │ │
│ │ Cancel in 32d   │ │
│ └─────────────────┘ │
│                     │
│ [+ Add Card]        │
└─────────────────────┘
```

**Desktop (1024px)**:
```
┌──────────────────────────────────────────────────────┐
│  Rewardify          Dashboard  Cards  Calendar    🔔 │
├────────┬─────────────────────────────────────────────┤
│        │  Hi John, here's your overview             │
│ [Nav]  │                                             │
│        │  ┌─────────────┐  ┌─────────────┐          │
│ Dash   │  │ Active: 2   │  │ Points: 340K│          │
│ Cards  │  └─────────────┘  └─────────────┘          │
│ Compare│                                             │
│ Upload │  Recommended Next Card:                     │
│ Settings│  ┌──────────────────────────────────────┐ │
│        │  │ ANZ Frequent Flyer Black              │ │
│        │  │ 100,000 points • $375 fee = Net $625  │ │
│        │  │ [Compare Cards]  [Apply Now]          │ │
│        │  └──────────────────────────────────────┘ │
│        │                                             │
│        │  Your Cards:                                │
│        │  ┌──────┐  ┌──────┐                        │
│        │  │ AMEX │  │ ANZ  │                        │
│        │  │ 245d │  │ 32d  │                        │
│        │  └──────┘  └──────┘                        │
└────────┴─────────────────────────────────────────────┘
```

---

## 🤖 MULTI-AGENT WORK BREAKDOWN

### Week 1 Parallelization (4 Concurrent Agents)

#### Agent A: Database & Schema
**Work Stream**: Backend foundation
**Files**: Supabase (external), `src/types/database.types.ts`

**Tasks**:
1. Create Supabase project
2. Create tables (cards, user_cards, spending_profiles)
3. Add RLS policies
4. Insert 30 Australian cards
5. Generate TypeScript types
6. Create sample queries

**Deliverable File**: `handoffs/agent-a-database.md`

**Duration**: 3-4 hours

---

#### Agent B: Authentication
**Work Stream**: User auth system
**Files**: `src/app/(auth)/*`, `src/lib/supabase/*`

**Dependencies**: Needs Supabase credentials from Agent A

**Tasks**:
1. Create Supabase client helper
2. Build login page (`(auth)/login/page.tsx`)
3. Build signup page (`(auth)/signup/page.tsx`)
4. Build password reset
5. Create protected route wrapper
6. Test auth flow

**Deliverable File**: `handoffs/agent-b-auth.md`

**Duration**: 3-4 hours

---

#### Agent C: Design System & Components
**Work Stream**: UI foundation
**Files**: `src/components/ui/*`, `src/components/layout/*`

**Dependencies**: None (fully independent)

**Tasks**:
1. Initialize shadcn/ui (`npx shadcn-ui init`)
2. Add components:
   - `npx shadcn-ui add button card input label select dialog toast badge`
3. Create layout components:
   - Navbar (logo + nav links + user menu)
   - Sidebar (navigation for desktop)
   - Footer
4. Create card display components:
   - CardItem (single card display)
   - CardGrid (grid layout)
   - CardFilters (search + filter controls)
5. Create empty states component
6. Create loading skeleton components

**Deliverable File**: `handoffs/agent-c-ui.md`

**Duration**: 4-5 hours

---

#### Agent D: Integration & Pages
**Work Stream**: Assemble everything
**Files**: `src/app/(app)/*`

**Dependencies**: Needs A + B + C complete

**Tasks**:
1. Create app layout (uses Agent C's layout components)
2. Create dashboard page (uses Agent B's auth, Agent C's components)
3. Create cards catalog page (uses Agent A's data, Agent C's card components)
4. Implement search/filter (connects UI to data)
5. Test full user flow (signup → login → dashboard → browse cards)

**Deliverable File**: `handoffs/agent-d-integration.md`

**Duration**: 3-4 hours

---

## 📊 GANTT CHART (Week 1 Parallel Execution)

```
Hour   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14
       │────│────│────│────│────│────│────│────│────│────│────│────│────│────│
Setup  │■■──│────│────│────│────│────│────│────│────│────│────│────│────│────│ (Any agent, 30min)
       │    │    │    │    │    │    │    │    │    │    │    │    │    │    │
Agent A│────│■■■■│■■■■│────│────│────│────│────│────│────│────│────│────│────│ Database (4hrs)
Agent B│────│────│────│■■■■│■■■■│────│────│────│────│────│────│────│────│────│ Auth (4hrs, waits for A)
Agent C│────│■■■■│■■■■│■■──│────│────│────│────│────│────│────│────│────│────│ UI (5hrs, parallel with A)
Agent D│────│────│────│────│────│■■■■│■■■■│────│────│────│────│────│────│────│ Integration (4hrs, waits for A+B+C)
       │    │    │    │    │    │    │    │    │    │    │    │    │    │    │
TOTAL  │ 30m│  2h│  2h│  2h│  1h│  2h│  1h│────│────│────│────│────│────│────│ = 10.5 hours vs 14+ sequential
```

**Result**: Week 1 done in 10.5 hours instead of 14-16 hours (~25% faster)

---

## 🔗 HANDOFF FILE FORMAT (Standard)

Every agent creates a handoff file when done:

```markdown
# Agent [X] - [Stream Name] Handoff

**Date**: 2025-12-XX
**Agent**: [Database/Auth/UI/Integration]
**Status**: ✅ Complete / ⚠️ Blocked / ❌ Failed

## What I Built:
- [List files created/modified]
- [List features implemented]

## How to Use It:
[Instructions for next agent or human]

## Dependencies for Next Agent:
- [What they need from my work]
- [Where to find credentials/types/etc.]

## Blockers (if any):
- [What stopped me]
- [What human needs to resolve]

## Testing Done:
- [ ] Feature works manually
- [ ] No console errors
- [ ] Mobile responsive (if UI)

## Next Steps:
[What should happen next]

## Files Modified:
- src/...
- src/...

## Git Status:
- Committed: Yes/No
- Branch: main
- Latest commit: [hash]
```

**Save to**: `~/ideas/rewardify/handoffs/agent-[X]-[date].md`

---

## 🔄 SESSION CONTINUITY (New Session Picks Up)

### When Starting New Claude Code Session:

**You (Human) Say**:
```
I'm continuing work on Rewardify.

Context:
- Read: ~/ideas/rewardify/CURRENT_STATE.md (shows what's done)
- Read: ~/ideas/rewardify/handoffs/ (latest agent handoffs)
- Read: ~/ideas/rewardify/EXECUTION_TRACKER.md (progress log)

Current task: [What you want to work on]

Please continue from where we left off.
```

**AI Agent Reads**:
1. `CURRENT_STATE.md` - High-level status
2. Latest handoff files - Detailed state
3. `EXECUTION_TRACKER.md` - Historical context
4. `FOR_AI_AGENTS.md` - Technical standards

**Then**: Continues exactly where last session stopped

---

## 💎 DESIGN SPECIFICATION

### Color Palette (Tailwind)

**Primary Colors**:
```typescript
primary: {
  50: '#eff6ff',   // Very light blue
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',  // Main brand blue
  600: '#2563eb',  // Primary buttons
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
}
```

**Status Colors**:
```typescript
success: green-600   // #16a34a - Cards active, points earned
warning: yellow-600  // #ca8a04 - Action needed, cancel soon
error: red-600       // #dc2626 - Rejected, issues
info: blue-500       // #3b82f6 - General information
```

**Neutrals**:
```typescript
text: gray-900       // Primary text
textSecondary: gray-600  // Secondary text
border: gray-200     // Borders, dividers
background: gray-50  // Page background
surface: white       // Cards, modals
```

### Typography Scale

```css
Display: text-4xl font-bold tracking-tight      /* Landing page hero */
H1: text-3xl font-bold                          /* Page titles */
H2: text-2xl font-semibold                      /* Section headings */
H3: text-xl font-semibold                       /* Subsections */
H4: text-lg font-medium                         /* Card titles */
Body: text-base                                 /* Regular text (16px) */
Small: text-sm text-gray-600                    /* Meta info (14px) */
Tiny: text-xs text-gray-500                     /* Footnotes (12px) */
```

**Font**: Inter (from Google Fonts) or system default

**Reference**: https://tailwindcss.com/docs/font-size

### Spacing System (Tailwind)

```css
xs: 0.5rem (8px)    /* Tight spacing */
sm: 0.75rem (12px)  /* Small gaps */
md: 1rem (16px)     /* Default gap */
lg: 1.5rem (24px)   /* Section spacing */
xl: 2rem (32px)     /* Large spacing */
2xl: 3rem (48px)    /* Page margins */
```

**Mobile**: Reduce by 1 step (lg → md, xl → lg)

### Component Spacing Patterns:

**Card Padding**:
```tsx
<Card className="p-6">              {/* Desktop: 24px */}
<Card className="p-4 md:p-6">       {/* Mobile: 16px, Desktop: 24px */}
```

**Section Margins**:
```tsx
<div className="space-y-8">         {/* 32px between sections */}
<div className="space-y-4">         {/* 16px between items */}
```

---

### UI Patterns (Reusable)

**Stat Card**:
```tsx
<Card>
  <CardContent className="pt-6">
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-sm text-gray-500">{label}</p>
  </CardContent>
</Card>
```

**Data Row** (for card details):
```tsx
<div className="flex justify-between items-center py-2 border-b last:border-0">
  <span className="text-sm text-gray-600">{label}</span>
  <span className="font-medium">{value}</span>
</div>
```

**Empty State**:
```tsx
<div className="text-center py-12">
  <div className="text-gray-400 mb-4">
    <IconComponent className="w-12 h-12 mx-auto" />
  </div>
  <h3 className="text-lg font-semibold mb-2">No cards yet</h3>
  <p className="text-sm text-gray-500 mb-4">
    Add your first credit card to start tracking
  </p>
  <Button>Add Card</Button>
</div>
```

---

## 🎨 SCREEN-BY-SCREEN DESIGN SPECS

### 1. Landing Page (Public)

**Layout**:
```
Hero Section:
- H1: "Turn every credit card into maximum rewards"
- Subtext: "Australia's first automated credit card churning platform"
- CTA: "Start Free" (signup) + "See How It Works" (demo video)

Features Section:
- 3-column grid (1 column mobile)
- Icons + short descriptions

Social Proof:
- "Join 100+ Australian churners optimizing their cards"

Footer:
- Links, privacy, terms
```

**Mobile-First**: Stack vertically on mobile, grid on desktop

---

### 2. Dashboard (Protected)

**Layout**:
```
Sidebar (Desktop) / Bottom Nav (Mobile):
- Dashboard
- My Cards
- Compare Cards
- Calendar
- Upload Statement
- Settings

Main Content:
1. Greeting + Quick Stats Row
2. Recommended Card Widget (if applicable)
3. Your Cards Grid (2-3 columns desktop, 1 mobile)
4. Upcoming Actions (cancel dates)
5. Quick Add Card button (floating on mobile)
```

---

### 3. Card Catalog Page

**Layout**:
```
Header:
- Search bar (full-width mobile, 50% desktop)
- Filters: Bank dropdown, Sort dropdown

Card Grid:
- 3 columns desktop, 1 column mobile
- Each card shows:
  - Card name + bank logo
  - Annual fee
  - Welcome bonus
  - Net value (calculated)
  - "Compare" button

Pagination or Infinite Scroll:
- Load 12 cards at a time (performance)
```

---

### 4. Card Detail View (Modal or Page)

**Layout**:
```
Header:
- Card name (H2)
- Bank logo + name

Body (2 columns desktop, stack mobile):
Column 1:
- Annual fee
- Welcome bonus
- Min spend requirement
- Points earn rate
- Churning rule (12 or 18 months)

Column 2:
- Features list (travel insurance, etc.)
- Application link
- Terms link

Footer:
- "Add to Compare" button
- "Track This Card" button (if applied)
```

---

## 📱 MOBILE OPTIMIZATION

### Touch Targets (iOS Guidelines)
- **Minimum**: 44×44px
- **Buttons**: `className="px-4 py-3"` (at least)
- **Tap areas**: Use `<button>` or `<a>` with padding

**Reference**: https://developer.apple.com/design/human-interface-guidelines/buttons

### Mobile Navigation Pattern

**Bottom Tab Bar** (mobile only):
```tsx
<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
  <div className="flex justify-around p-2">
    <NavItem icon={Home} label="Dashboard" />
    <NavItem icon={CreditCard} label="Cards" />
    <NavItem icon={Calendar} label="Calendar" />
    <NavItem icon={Settings} label="Settings" />
  </div>
</nav>
```

**Sidebar** (desktop only):
```tsx
<aside className="hidden md:block w-64 border-r">
  {/* Sidebar navigation */}
</aside>
```

---

## ⚡ PERFORMANCE REQUIREMENTS

### Benchmarks (Lighthouse Scores):

- **Performance**: >90
- **Accessibility**: >95
- **Best Practices**: >90
- **SEO**: >90

### Specific Metrics:

- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Cumulative Layout Shift**: <0.1
- **Total Blocking Time**: <300ms

**How to Test**:
```bash
# Chrome DevTools
# Open page → Right-click → Inspect → Lighthouse tab → Analyze
```

**Fix Common Issues**:
- Images: Use Next.js `<Image>` component (auto-optimization)
- Fonts: Preload fonts, use font-display: swap
- JS: Code-split by route (Next.js does this automatically)

**Reference**: https://nextjs.org/docs/app/building-your-application/optimizing

---

## 🎨 VISUAL DESIGN PRINCIPLES

### 1. Clarity Over Cleverness
- Use standard patterns (don't reinvent UI)
- Clear labels (no mysterious icons without text)
- Obvious CTAs (buttons look clickable)

### 2. Data Density Done Right
- Show important info upfront
- Hide details behind "Show More" or detail pages
- Use progressive disclosure

### 3. Trust Through Design
- Professional (not playful)
- Consistent spacing
- No broken layouts
- Fast loading (nothing worse than slow financial app)

### 4. Mobile = Primary Experience
- Design mobile first
- Thumb-friendly navigation (bottom bar)
- Large touch targets
- Horizontal scrolling = bad (stack vertically)

---

## 🔧 AGENT COORDINATION PROTOCOL

### Starting Parallel Work:

**In Claude Code** (or similar):

**Terminal 1 - Agent A (Database)**:
```bash
cd ~/gits/src/github.com/johankaito/ideas/rewardify
# You are Agent A - Database
# Execute: Stream 1 tasks from PARALLEL_EXECUTION.md
# When done: Create handoffs/agent-a-database.md
```

**Terminal 2 - Agent C (UI)** (can start immediately):
```bash
cd ~/gits/src/github.com/johankaito/rewardify
# You are Agent C - UI
# Execute: Stream 3 tasks (independent)
# When done: Create handoffs/agent-c-ui.md
```

**Terminal 3 - Agent B (Auth)** (starts when A provides credentials):
```bash
# You are Agent B - Auth
# Wait for: Agent A to complete and provide Supabase credentials
# Then execute: Stream 2 tasks
# When done: Create handoffs/agent-b-auth.md
```

**Terminal 4 - Agent D (Integration)** (starts when A+B+C done):
```bash
# You are Agent D - Integration
# Wait for: Agents A, B, C to complete
# Execute: Assemble everything into working app
# When done: Create handoffs/agent-d-integration.md
```

---

## 📁 REQUIRED HANDOFF FILES

Create `~/ideas/rewardify/handoffs/` folder:

```bash
mkdir -p ~/ideas/rewardify/handoffs
```

**Each agent creates**:
- `agent-a-database-[date].md`
- `agent-b-auth-[date].md`
- `agent-c-ui-[date].md`
- `agent-d-integration-[date].md`

**Format**: See "HANDOFF FILE FORMAT" in this doc above

---

## 🎯 CURRENT STATE TRACKING

### Update After Every Session:

**File**: `~/ideas/rewardify/CURRENT_STATE.md`

```markdown
# Rewardify - Current State

**Last Updated**: 2025-12-17 15:30
**Week**: 1 of 8
**Overall**: 15% complete

## Completed:
- ✅ Business plan
- ✅ Platform decision (Next.js web)
- ✅ Engineering standards defined

## In Progress:
- 🔄 Week 1 Day 1 (Agent A working on database)

## Next:
- Agent B: Auth flow (waits for Agent A)
- Agent C: UI components (can start now)

## Blockers:
- None

## For Next Session:
Continue with Week 1 parallel execution.
Agents A and C can work in parallel.
```

**Update frequency**: After each agent completes, after each day, after each week

---

## 🎨 DESIGN ASSETS NEEDED

### Immediate (Week 1):
- Logo (simple text or icon+text)
- Favicon (can use emoji initially: 💳)
- Brand color: Blue-600 (#2563eb)

### Later (Week 4-8):
- Landing page hero image/illustration
- Feature icons (use Lucide icons initially)
- App screenshots (for marketing)

**For MVP**: Use Lucide icons (https://lucide.dev) + Tailwind - no custom illustrations needed

---

## ✅ SUMMARY: PARALLEL EXECUTION

**How This Works**:

1. **Setup** (30 min, any agent)
2. **Kick off 2-3 agents in parallel**:
   - Agent A (Database) - 4 hours
   - Agent C (UI) - 5 hours (parallel with A)
3. **Agent B starts** when A finishes (needs Supabase creds)
4. **Agent D integrates** when all done

**Result**: Week 1 complete in 10-12 hours vs 14-16 sequential

**Human's Role**:
- Monitor progress via handoff files
- Unblock if agents get stuck
- Make decisions at gates
- Update CURRENT_STATE.md

---

## 🚀 READY TO EXECUTE

**Next Command (You or Agent)**:
```bash
cd ~/gits/src/github.com/johankaito
npx create-next-app@latest rewardify --typescript --tailwind --app
```

**Then**:
- Follow FOR_AI_AGENTS.md (this file)
- Update EXECUTION_TRACKER.md daily
- Create handoff files when agents complete tasks
- Update CURRENT_STATE.md for session continuity

**Goal**: Ship Week 1 deliverables in 10-12 hours using parallel agents

---

**Document Status**: ✅ COMPLETE - Ready for Multi-Agent Execution
**Last Updated**: 2025-12-17
**Approved By**: John Keto
