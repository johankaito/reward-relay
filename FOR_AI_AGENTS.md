# FOR AI CODING ASSISTANTS - START HERE

**🤖 YOU ARE AN AI AGENT** tasked with building Rewardify

**📋 THIS FILE**: Your master execution guide
**✅ FOLLOW**: Every specification exactly
**📊 UPDATE**: EXECUTION_TRACKER.md daily

---

## 🎯 YOUR MISSION

Build **Rewardify** - a polished web app for Australian credit card churning automation.

**Founder**: John Keto (solo, 10-20 hrs/week)
**Timeline**: 8 weeks to launch
**Success**: $500+ MRR by Week 12 or kill
**Quality**: Must be polished, production-ready (not just functional)

---

## 📚 DOCUMENTATION INDEX (Read in Order)

### 1. UNDERSTAND THE BUSINESS (30 min read)
- `BUSINESS_PLAN.md` - Strategy, market, financials
- `COMPETITIVE_ANALYSIS.md` - Zero AU competitors (greenfield!)
- `CUSTOMER_STORY_001.md` - Founder is Customer #1 (build for his need)

**Key Insight**: Founder actively churns cards NOW. Build what HE needs THIS WEEK.

### 2. TECHNICAL DECISIONS (10 min read)
- `PLATFORM_DECISION.md` - Why Next.js web (not mobile/RN Web)
- `REPOSITORY_STRUCTURE.md` - What lives where (planning vs code)

**Key Decisions**:
- ✅ Next.js 14 web app (mobile-responsive)
- ✅ React Context + useState (state)
- ✅ React Hook Form + Zod (forms)
- ✅ shadcn/ui (components)
- ✅ Direct Supabase calls (no API routes)

### 3. BUILD SPECIFICATIONS (Read as you build)
- `MVP_FEATURES.md` - Complete feature list
- `WEEK_1_PLAN.md` - Day-by-day for Week 1
- `BUILD_NOW.md` - This file (master spec)

### 4. EXECUTION TRACKING (Update daily)
- `EXECUTION_TRACKER.md` - Daily standups, weekly retros
- Track: Hours spent, features shipped, blockers

---

## 🛠️ ENGINEERING STANDARDS

### Follow These Official Docs:

| Tech | Docs | When to Reference |
|------|------|-------------------|
| **Next.js 14** | https://nextjs.org/docs | Routing, pages, deployment |
| **React 18** | https://react.dev | Hooks, components, patterns |
| **TypeScript** | https://www.typescriptlang.org/docs | Type definitions, strict mode |
| **Tailwind CSS** | https://tailwindcss.com/docs | Styling, responsive design |
| **shadcn/ui** | https://ui.shadcn.com | Component library (copy-paste) |
| **Supabase** | https://supabase.com/docs | Database, auth, RLS |
| **React Hook Form** | https://react-hook-form.com | Form handling |
| **Zod** | https://zod.dev | Validation schemas |

### Code Standards (John's Preferences):

**File Naming**:
- Components: `PascalCase.tsx` (CardList.tsx)
- Utils: `camelCase.ts` (formatDate.ts)
- Pages: Next.js convention (`page.tsx`)

**Import Order**:
1. React/Next
2. Third-party libs
3. Internal utils
4. Components
5. Types

**TypeScript**:
- Strict mode enabled
- No `any` types (use proper types)
- Export interfaces

**Error Handling**:
- Try/catch all async operations
- User-friendly error messages
- Log errors to console (will add Sentry later)

**Loading States**:
- Every async action shows loading
- Disable buttons during loading
- Use skeletons for data loading

---

## 🚀 QUICK START (First 30 Minutes)

### Step 1: Create Project

```bash
cd ~/gits/src/github.com/johankaito

npx create-next-app@latest rewardify \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm

cd rewardify
npm install
```

### Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label @radix-ui/react-slot @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install react-hook-form @hookform/resolvers zod date-fns recharts resend
```

### Step 3: Setup shadcn/ui

```bash
npx shadcn-ui@latest init

# When prompted:
# Style: Default
# Base color: Slate
# CSS variables: Yes

# Add initial components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast
```

**Reference**: https://ui.shadcn.com/docs/installation/next

### Step 4: Setup Supabase

**Manual (in browser)**:
1. Go to https://supabase.com/dashboard
2. Create project: "rewardify-prod"
3. Region: Sydney (or closest)
4. Wait 3-5 min for provisioning
5. Get credentials: Settings → API → Copy URL + anon key

**In terminal**:
```bash
cat > .env.local << 'ENV'
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY_HERE
ENV

# Ensure .env.local is gitignored
echo ".env.local" >> .gitignore
```

### Step 5: Create Supabase Client

Create `src/lib/supabase/client.ts`:
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

export const supabase = createClientComponentClient<Database>()
```

**Reference**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs

### Step 6: Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

**Definition of Done**:
- ✅ App runs without errors
- ✅ Sees Next.js welcome page
- ✅ No console errors
- ✅ Supabase credentials configured

**First Commit**:
```bash
git add .
git commit -m "Initial setup: Next.js + Supabase + shadcn/ui"
```

---

## 📅 WEEK 1: FOUNDATION (10-15 hours)

**Goal**: Auth + Card catalog with 30 AU cards

### Day 1: Auth Flow (2-3 hours)

**Create**: `src/app/(auth)/login/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({ title: 'Welcome back!' })
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Rewardify</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>

            <p className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Create**: `src/app/(auth)/signup/page.tsx` (similar structure, use `signUp` instead)

**Reference**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs

**Definition of Done**:
- [ ] Can navigate to /login and /signup
- [ ] Can create account
- [ ] Can log in with created account
- [ ] Redirects to /dashboard after login
- [ ] Shows error if invalid credentials
- [ ] Loading state works
- [ ] Mobile responsive

---

### Day 2: Database Schema + Seed Data (2-3 hours)

**Run in Supabase Dashboard → SQL Editor**:

See full schema in BUILD_NOW.md (cards, user_cards, spending_profiles tables + RLS)

**Then add 30 AU cards** (sample data provided above)

**Definition of Done**:
- [ ] All tables created
- [ ] RLS policies active (test: can't see other users' cards)
- [ ] 30 cards in database
- [ ] Can query cards from frontend

---

### Day 3: Card Catalog UI (2-3 hours)

**Create**: `src/app/(app)/cards/page.tsx`

Show all 30 Australian cards in a filterable grid.

**Features**:
- Grid layout (3 columns desktop, 1 column mobile)
- Search by card name or bank
- Filter by bank (dropdown)
- Sort by annual fee, welcome bonus, net value
- Click card → see details

**Components to create**:
- `CardGrid.tsx` - Grid container
- `CardItem.tsx` - Individual card display
- `CardFilters.tsx` - Search + filter controls

**Definition of Done**:
- [ ] See all 30 cards
- [ ] Can search by name
- [ ] Can filter by bank
- [ ] Can sort by different criteria
- [ ] Mobile responsive (1 column on mobile)
- [ ] Click card shows detail view

**Reference**: https://ui.shadcn.com/docs/components/card

---

### Day 4-5: Protected Routes + Dashboard (3-4 hours)

**Create**: `src/app/(app)/layout.tsx` - Auth-protected layout

```typescript
// Force authentication for all /app routes
// Redirect to /login if not authenticated
```

**Create**: `src/app/(app)/dashboard/page.tsx`

**Dashboard Widgets**:
1. Welcome message ("Hi John, you have X cards")
2. Quick stats (Active cards, Total points earned est.)
3. Recommended next card (if algorithm ready, else placeholder)
4. Upcoming actions (cards to cancel soon)
5. Recent activity

**Definition of Done**:
- [ ] Can't access dashboard without login
- [ ] Dashboard shows user's name
- [ ] Shows stats (even if 0)
- [ ] Mobile responsive
- [ ] Fast loading (<1s)

---

## ⚡ QUALITY GATES (Check Before Each Commit)

### Before Committing ANY Code:

1. **Functional**:
   - [ ] Feature works on happy path
   - [ ] Feature handles errors gracefully
   - [ ] No console errors/warnings

2. **Visual**:
   - [ ] Looks good on mobile (375px width)
   - [ ] Looks good on desktop (1024px width)
   - [ ] Loading states implemented
   - [ ] Empty states helpful

3. **Performance**:
   - [ ] Page loads <2s
   - [ ] No layout shift
   - [ ] Smooth interactions

4. **Code Quality**:
   - [ ] TypeScript: No `any` types
   - [ ] No unused imports
   - [ ] Consistent formatting
   - [ ] Meaningful variable names

**If ANY box unchecked, don't commit. Fix first.**

---

## 🎨 DESIGN REFERENCE

### Brand Colors (Tailwind)
```typescript
Primary: blue-600      // CTAs, links
Secondary: gray-600    // Text, icons
Success: green-600     // Confirmations
Warning: yellow-600    // Warnings
Error: red-600         // Errors
```

### Component Patterns (shadcn/ui)

**Button Variants**:
```tsx
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="destructive">Delete</Button>
```

**Card Layout**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

**Reference**: https://ui.shadcn.com/docs/components

---

## 📊 COMPLETE TECHNICAL SPEC

Due to size, the complete specification is distributed:

**Database**: See `BUILD_NOW.md` for complete SQL schema + sample cards

**Week 1-8 Build**: Each week has:
- Sprint goal
- Features to build
- Code examples
- Success criteria

**Breakdown**:
- Week 1: Auth + Card catalog → See `WEEK_1_PLAN.md`
- Week 2: Card tracking → (Implement based on MVP_FEATURES.md)
- Week 3: Calendar + Reminders → (Implement)
- Week 4: Beta polish + 5 users → (Polish checklist)
- Week 5: Comparison + Recommendation → (Algorithm spec)
- Week 6: Spending optimizer → (Calculator spec)
- Week 7: Statement analysis → (LLM integration spec)
- Week 8: Launch prep + Stripe → (Payment integration)

**For detailed specs**: Reference `MVP_FEATURES.md` and implement iteratively.

---

## 🤖 AI AGENT PROTOCOLS

### Daily Workflow:

**Morning** (Start of coding session):
1. Open `EXECUTION_TRACKER.md`
2. Add daily standup entry:
   ```
   ### Date: 2025-12-XX
   **Time Today**: 2 hours
   **Shipping**: [What you'll build]
   **Blockers**: [None or describe]
   ```
3. Refer to current week's goal
4. Build features for the day

**Evening** (End of session):
1. Update standup: What did you actually ship?
2. Test feature (all 4 states: loading, success, error, empty)
3. Verify mobile responsiveness
4. Commit if quality gates pass
5. Plan tomorrow

### Weekly Workflow:

**Sunday Evening** (Week planning):
1. Review last week's retrospective
2. Read next week's goal (EXECUTION_TRACKER.md)
3. Understand deliverables
4. Note any questions for human

**End of Week** (Saturday/Sunday):
1. Test all week's features together
2. Fill out week retrospective in EXECUTION_TRACKER.md
3. Verify week goal achieved
4. If not achieved: Document why, adjust next week

---

## 🚨 DECISION GATES (Ask Human)

### Gate 1 (Week 4): Beta Users
**Check**: Do 5 friends actively use the app?
**If No**: Stop and analyze why (UX issue? Not useful? Technical problem?)

### Gate 2 (Week 8): Launch
**Check**: Is app polished enough for public?
**If No**: Extend 1-2 weeks, focus on polish

### Gate 3 (Week 12): Validation
**Check**: $500+ MRR (10+ paying users)?
**If No**: Human decides: Kill, Pivot, or Give 4 More Weeks

---

## 📈 SUCCESS METRICS (Track Weekly)

### Build Phase (Weeks 1-8):
- Features completed vs planned
- Hours spent per week
- Bugs found and fixed
- Code commits per week

### Launch Phase (Week 8):
- Free signups (Day 1, Week 1)
- Activation rate (% who add first card)
- Return rate (Day 7)

### Validation Phase (Weeks 9-12):
- Free users total
- Paying users
- MRR (monthly recurring revenue)
- Churn rate (% cancelling)

**Target Week 12**: $500-1,000 MRR

---

## 🛑 WHEN TO STOP AND ASK HUMAN

**Stop coding and escalate if**:

1. **Stuck >1 hour** on technical issue
2. **Week goal at risk** (falling >50% behind)
3. **Major UX decision** needed (multiple valid approaches)
4. **Scope question**: Feature taking 3x longer, cut it?
5. **External dependency issue**: Supabase down, API broken, etc.

**Don't ask for**:
- Minor styling decisions (use best judgment)
- Which shadcn component to use (reference docs)
- Standard implementation questions (Google first)

---

## ✅ COMPLETE BUILD SEQUENCE

### Phase 1: Foundation (Week 1)
1. Setup project (Day 0-1)
2. Auth flow (Day 1)
3. Database schema (Day 2)
4. Card catalog UI (Day 3)
5. Protected routes (Day 4)
6. Dashboard shell (Day 5)

**Deliverable**: Can sign up, see 30 Australian cards

---

### Phase 2: Core Tracking (Week 2)
1. Add card form
2. User cards list
3. Card detail view
4. Edit/delete cards
5. Status tracking (active/cancelled)

**Deliverable**: User can track their credit cards

---

### Phase 3: Automation (Week 3)
1. Churning calendar (timeline view)
2. Cancel date calculations
3. Email reminder system (Resend integration)
4. Reminder cron job (Supabase Edge Function)

**Deliverable**: Visual timeline + email reminders work

---

### Phase 4: Beta Polish (Week 4)
1. Onboarding flow
2. Empty states
3. Loading states
4. Error handling
5. Mobile optimization
6. Get 5 friends to sign up

**🚨 Gate**: If <5 friends using, stop and analyze

---

### Phase 5: Optimization (Week 5)
1. Card comparison (side-by-side)
2. "Recommend next card" algorithm
3. Net value calculation
4. Dashboard recommendation widget

**Deliverable**: App tells user which card to get next

---

### Phase 6: Spending (Week 6)
1. Spending profile input form
2. "Best card for spend" calculator
3. Points estimate
4. Save spending profile

**Deliverable**: Know which card to use for each purchase

---

### Phase 7: Statement Analysis (Week 7)
1. CSV upload (Supabase Storage)
2. CSV parser (for AU banks)
3. Claude API integration (categorization)
4. Spending breakdown display
5. "Missed points" analysis

**Deliverable**: Upload statement → see insights

---

### Phase 8: Launch (Week 8)
1. Free vs Pro tier gating
2. Stripe integration (payments)
3. Landing page (marketing copy)
4. Privacy policy + terms
5. r/AusFinance launch post
6. Analytics (Plausible)

**Deliverable**: Public launch + payment works

---

## 🎯 FOUNDER USE CASE (Build for This FIRST)

**John's Immediate Need**:
- Has: 2 cards (AMEX + one other)
- Needs: Decide which card to apply for next
- Pain: Manual comparison takes time

**Week 1 Must Solve**:
By Day 6, John should be able to:
1. Add his 2 current cards
2. See which cards he hasn't churned
3. Compare eligible cards
4. Decide which to apply for next

**If tool doesn't help John make this decision, it's not working.**

---

## 📦 DELIVERABLES SUMMARY

| Week | Main Deliverable | Definition of Done |
|------|------------------|-------------------|
| 1 | Auth + Card catalog | 30 cards visible, can sign up |
| 2 | Card tracking | User tracks their cards |
| 3 | Calendar + Reminders | Timeline + emails work |
| 4 | Beta (5 users) | 5 friends actively using |
| 5 | Recommendations | App suggests next card |
| 6 | Spending optimizer | Know which card for spend |
| 7 | Statement upload | CSV → insights |
| 8 | Launch | r/AusFinance post + payment |

**Quality Standard**: Every deliverable must be POLISHED (mobile-responsive, handles errors, looks professional)

---

## 🚀 START BUILDING

**Your next command**:
```bash
cd ~/gits/src/github.com/johankaito
npx create-next-app@latest rewardify --typescript --tailwind --app
```

**Then**:
1. Follow Day 0-1 setup above
2. Update `EXECUTION_TRACKER.md` with Day 1 standup
3. Build auth flow
4. Commit daily

**Track progress in**: `~/gits/src/github.com/johankaito/ideas/rewardify/EXECUTION_TRACKER.md`

---

**Document Status**: ✅ COMPLETE - Ready for AI Execution
**Last Updated**: 2025-12-17
**Approved By**: John Keto (Founder)
