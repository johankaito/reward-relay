# REWARDIFY - MVP FEATURE SPECIFICATION

**Version**: 1.0
**Target Launch**: Week 8 (Beta)
**Build Timeline**: 6-8 weeks
**Builder**: Solo founder (John Keto)

---

## MVP PHILOSOPHY

**Build Principle**: Solve ONE problem exceptionally well before adding features.

**Core Problem**: Churners manually track credit cards in spreadsheets and forget optimal cancel/apply dates.

**Core Solution**: Automated tracking + intelligent reminders.

**NOT in MVP**:
- ❌ Bank account integration (too risky, too slow)
- ❌ Mobile apps (web-first)
- ❌ Community features (add later)
- ❌ Advanced analytics (start simple)

---

## PHASE 1: CORE TRACKING (Weeks 1-4)

### Feature 1.1: User Authentication

**User Story**:
> As a churner, I want to securely sign up and log in so that my card data is private and accessible only to me.

**Requirements**:
- Email + password authentication
- Password reset flow
- Email verification (optional for MVP)
- Session management
- Secure credential storage

**Technical**:
- Supabase Auth
- JWT tokens
- HTTPS only

**Acceptance Criteria**:
- [ ] User can sign up with email/password
- [ ] User can log in
- [ ] User can reset password
- [ ] Session persists across page refreshes
- [ ] Logout works correctly

**Time Estimate**: 4-6 hours

**Priority**: 🔴 **Critical** (Week 1)

---

### Feature 1.2: Australian Card Database

**User Story**:
> As a churner, I want to see all Australian credit cards with their current offers so I can compare options.

**Requirements**:
- Database of 30-40 top Australian credit cards
- For each card:
  - Card name
  - Bank/issuer
  - Annual fee
  - Welcome bonus (points value)
  - Points earn rate (per $1 spend)
  - Minimum spend requirement
  - Eligibility criteria (text)
  - Churning rules (bank-specific)
  - Link to application
- Search/filter functionality
- Sort by various criteria

**Data Sources**:
- PointsHacks (manual entry)
- Bank websites (manual verification)
- Community input (later)

**Technical**:
- Supabase database table: `cards`
- Admin panel to add/edit cards (simple)
- Public API endpoint to fetch cards

**Initial Card List** (30 cards to start):
- AMEX: Platinum, Explorer, Essential, Qantas Ultimate
- ANZ: Frequent Flyer Black, Rewards Black, Platinum
- CommBank: Ultimate Awards, Platinum Awards
- NAB: Qantas Rewards Signature, Velocity Rewards Platinum
- Westpac: Altitude Black, Altitude Platinum
- Citi: Prestige, Premier, Rewards
- Virgin Money: Velocity High Flyer, Flyer
- Qantas: Premier, Ultimate
- [Add 10-15 more popular cards]

**Acceptance Criteria**:
- [ ] 30 cards in database with complete data
- [ ] Cards page shows all cards in table/grid view
- [ ] User can search by card name or bank
- [ ] User can filter by bank, annual fee range, bonus points
- [ ] User can sort by annual fee, bonus points, net value
- [ ] Card detail view shows full information

**Time Estimate**: 10-12 hours (research + data entry + UI)

**Priority**: 🔴 **Critical** (Week 1-2)

---

### Feature 1.3: Card Portfolio Tracker

**User Story**:
> As a churner, I want to add my current credit cards to my portfolio so I can track when I applied and when to cancel.

**Requirements**:
- "Add Card" form:
  - Select card from database
  - Application date (date picker)
  - Approval status (pending/approved/rejected)
  - Application notes (optional text)
- "My Cards" dashboard:
  - List of all tracked cards
  - Status indicator (active/cancelled/pending)
  - Days since application
  - Days until recommended cancellation
  - Action buttons (edit, mark as cancelled, delete)
- Edit card details
- Mark card as cancelled (date picker)
- Delete card from tracking

**Technical**:
- Supabase table: `user_cards`
- Foreign key to `cards` table
- Owner-based RLS (row-level security)

**Acceptance Criteria**:
- [ ] User can add a card they applied for
- [ ] User sees all their cards on dashboard
- [ ] Each card shows application date and status
- [ ] User can edit card details
- [ ] User can mark card as cancelled
- [ ] User can delete a card
- [ ] Dashboard empty state looks good (onboarding CTA)

**Time Estimate**: 8-10 hours

**Priority**: 🔴 **Critical** (Week 2)

---

### Feature 1.4: Churning Calendar

**User Story**:
> As a churner, I want to see a timeline of my cards so I know when to cancel and when I'm eligible to reapply.

**Requirements**:
- Visual timeline (horizontal or vertical)
- Each card as a bar/block:
  - Start: Application date
  - End: Recommended cancel date (12 months later)
  - Color-coded by status (active/cancelled/pending)
- Milestones:
  - "Cancel by" date (e.g., 12 months for most cards)
  - "Eligible to reapply" date (varies by bank)
- Today indicator
- Clickable cards (links to detail view)
- Filter by status

**Bank-Specific Churning Rules** (to implement):
- AMEX: 18 months between applications (same card)
- ANZ: 12 months
- CommBank: 12 months
- NAB: 12 months
- Westpac: 12 months
- Default: 12 months if unknown

**Technical**:
- Timeline component (could use library like `react-calendar-timeline`)
- Calculate dates based on application date + rules

**Acceptance Criteria**:
- [ ] User sees all cards on timeline
- [ ] Timeline shows "today" marker
- [ ] Each card shows recommended cancel date
- [ ] User can click card to see details
- [ ] Timeline is responsive (mobile-friendly)

**Time Estimate**: 12-15 hours

**Priority**: 🔴 **Critical** (Week 3)

---

### Feature 1.5: Cancellation Reminders

**User Story**:
> As a churner, I want to receive email reminders before my card's annual fee is due so I don't waste money.

**Requirements**:
- Email reminder 2 weeks before recommended cancel date
- Email reminder 1 week before recommended cancel date
- Email reminder 1 day before recommended cancel date
- Reminder includes:
  - Card name
  - Application date
  - Annual fee amount
  - Recommended action (cancel or keep)
  - Link to mark as cancelled
- User can configure reminder preferences (in settings)
- User can snooze reminders

**Technical**:
- Cron job (daily) to check upcoming cancel dates
- Email service (Supabase Edge Functions + Resend or SendGrid)
- Template system for emails

**Acceptance Criteria**:
- [ ] User receives email 2 weeks before cancel date
- [ ] User receives email 1 week before
- [ ] User receives email 1 day before
- [ ] Email has clear CTA and card details
- [ ] User can click to mark card as cancelled
- [ ] User can disable reminders in settings

**Time Estimate**: 8-10 hours

**Priority**: 🟠 **High** (Week 3-4)

---

## PHASE 2: OPTIMIZATION (Weeks 5-8)

### Feature 2.1: Card Comparison Tool

**User Story**:
> As a churner researching my next card, I want to compare multiple cards side-by-side so I can make the best choice.

**Requirements**:
- Select 2-5 cards to compare
- Side-by-side table view:
  - Annual fee
  - Welcome bonus
  - Points earn rate
  - Minimum spend
  - Net value (bonus - fee)
- Highlight best value
- Export comparison (PDF or image)
- Share comparison (link)

**Calculations**:
- **Net Value** = (Welcome Bonus Points × $0.01) - Annual Fee
- **Assumption**: 1 point = 1 cent (conservative)
- **Future**: User-configurable point value

**Acceptance Criteria**:
- [ ] User can select up to 5 cards to compare
- [ ] Side-by-side view shows all key metrics
- [ ] Net value is calculated and displayed
- [ ] Best value card is highlighted
- [ ] User can add/remove cards from comparison

**Time Estimate**: 8-10 hours

**Priority**: 🟠 **High** (Week 5)

---

### Feature 2.2: "Recommend Next Card" Algorithm

**User Story**:
> As a churner ready to apply for my next card, I want the app to recommend the best card for me based on my history.

**Requirements**:
- Algorithm considers:
  - Cards user hasn't applied for yet
  - Bank-specific waiting periods (eligibility)
  - Net value (bonus - fee)
  - User's application history
- Recommendation card:
  - Top recommended card
  - Reason for recommendation
  - Net value estimate
  - "Apply Now" CTA
- "See All Options" button (shows full ranked list)

**Algorithm Logic** (v1):
```
1. Filter out cards user has applied for within churning window
2. Calculate net value for remaining cards
3. Sort by net value (highest first)
4. Return top 3
```

**Future Enhancements**:
- Consider user's spending patterns
- Factor in card categories (travel, cashback, etc.)
- Machine learning based on similar users

**Acceptance Criteria**:
- [ ] Dashboard shows "Recommended Next Card"
- [ ] Recommendation explains why it's suggested
- [ ] User can see full ranked list
- [ ] Algorithm respects churning rules
- [ ] Recommendation updates when user adds new card

**Time Estimate**: 10-12 hours

**Priority**: 🟠 **High** (Week 5-6)

---

### Feature 2.3: Spending Category Input (Manual)

**User Story**:
> As a churner, I want to input my spending by category so the app can tell me which card to use for each type of purchase.

**Requirements**:
- Form to input monthly spending:
  - Groceries: $_____
  - Fuel: $_____
  - Dining: $_____
  - Travel: $_____
  - Other: $_____
- Store spending profile
- "Best Card for Spend" calculator:
  - Shows which card earns most points for each category
  - Calculates total points earned per card
  - Recommends optimal card allocation

**Example Output**:
```
Based on your spending:
- Use AMEX Platinum for Dining ($500/mo) → 1,500 points
- Use ANZ for Groceries ($800/mo) → 1,600 points
- Use Westpac for Everything Else ($1,200/mo) → 1,200 points
Total Monthly Points: 4,300 points ($43 value)
```

**Acceptance Criteria**:
- [ ] User can input monthly spending by category
- [ ] System calculates points per card
- [ ] System recommends best card for each category
- [ ] User sees total monthly points estimate
- [ ] User can update spending profile

**Time Estimate**: 10-12 hours

**Priority**: 🟡 **Medium** (Week 6-7)

---

### Feature 2.4: Statement Upload & Analysis (CSV)

**User Story**:
> As a churner, I want to upload my bank statement so the app can analyze my spending and recommend the best cards automatically.

**Requirements**:
- CSV file upload
- Parser for common AU bank formats:
  - CommBank
  - ANZ
  - Westpac
  - NAB
- LLM-powered category detection:
  - Use OpenAI or Anthropic to categorize transactions
  - Map to spending categories (groceries, fuel, etc.)
- Analysis output:
  - Spending breakdown by category
  - "You could have earned X more points with [Card Y]"
  - Recommendation to switch cards

**Technical**:
- File upload (Supabase Storage)
- CSV parser (Papa Parse)
- LLM API call (Claude or GPT-4)
- Prompt engineering for category detection

**Example Prompt**:
```
You are a transaction categorizer. Given this transaction:
"WOOLWORTHS 3456 SYDNEY"

Return ONLY the category: [Groceries, Fuel, Dining, Travel, Entertainment, Bills, Other]
```

**Acceptance Criteria**:
- [ ] User can upload CSV file
- [ ] System parses transactions
- [ ] LLM categorizes each transaction
- [ ] User sees spending breakdown
- [ ] User sees "missed points" analysis
- [ ] System recommends card changes

**Time Estimate**: 15-18 hours (complex)

**Priority**: 🟡 **Medium** (Week 7-8)

---

### Feature 2.5: Dashboard & Insights

**User Story**:
> As a churner, I want to see my overall stats so I know how well I'm optimizing my cards.

**Requirements**:
- Dashboard widgets:
  - Total cards tracked
  - Active cards vs cancelled cards
  - Points earned this year (estimate)
  - Upcoming actions (cards to cancel soon)
  - Recommended next card
- Charts:
  - Points earned over time
  - Annual fees paid vs points value
- Insights:
  - "You've earned X points this year ($Y value)"
  - "You could earn Z more points by switching cards"

**Technical**:
- Recharts or Chart.js for visualizations
- Calculate stats from user data
- Cache calculations for performance

**Acceptance Criteria**:
- [ ] Dashboard shows summary stats
- [ ] Charts are clear and useful
- [ ] Insights are actionable
- [ ] Dashboard loads quickly (<2s)

**Time Estimate**: 12-15 hours

**Priority**: 🟡 **Medium** (Week 8)

---

## FREE vs PRO TIER (Feature Gating)

### Free Tier (Forever Free)
**Goal**: Acquisition + proof of value before payment

**Features**:
- ✅ Track up to 3 cards
- ✅ Basic churning calendar
- ✅ Card comparison (up to 3 cards)
- ✅ Email reminders (1 week before only)
- ✅ Card database access
- ✅ “Proof” preview: show headline net value found (blur details) and next-card recommendation headline to demonstrate value before upgrade

**Limitations**:
- ⚠️ Max 3 cards tracked
- ⚠️ Limited reminders
- ⚠️ No spending optimization
- ⚠️ No statement analysis
- ⚠️ Limited comparison (max 3 cards)
- ⚠️ No cancel-by date details or eligibility rules beyond basics

---

### Pro Tier ($49/month)
**Goal**: Core monetization; pay-on-proof upgrade

**All Free Features PLUS**:
- ✅ Unlimited cards
- ✅ All reminders (2 weeks, 1 week, 1 day)
- ✅ Spending optimizer
- ✅ "Recommend next card" algorithm
- ✅ Comparison tool (unlimited cards)
- ✅ Statement upload & analysis
- ✅ Dashboard insights
- ✅ Priority email support
- ✅ Full “proof” details: net value breakdown, cancel-by dates per card, eligibility rules, full recommendations, CSV insights unlocked
- ✅ Remove comparison limit; unlock apply links

---

### Premium Tier ($99/month) - Post-MVP
**Goal**: Power users, highest LTV

**All Pro Features PLUS**:
- ✅ Bank blacklist tracker
- ✅ Points portfolio management
- ✅ Mobile app access
- ✅ Community features
- ✅ 1-on-1 strategy sessions (quarterly)
- ✅ Export all data
- ✅ API access

---

## NON-MVP FEATURES (Post-Launch)

**Good ideas but NOT in MVP**:

### Bank Account Integration
**Why Not in MVP**: Too risky (legal, security), too slow to build
**When to Add**: Month 6+ if users demand it

### Mobile Apps (iOS/Android)
**Why Not in MVP**: Web-first is faster, reaches more users
**When to Add**: Month 6-12 if traction proven

### Community Features
**Why Not in MVP**: Requires moderation, not core value
**When to Add**: Month 9-12 if scaling

### Points Portfolio Tracker
**Why Not in MVP**: Nice-to-have, not core pain
**When to Add**: Month 6-9 as Premium feature

### Bank Blacklisting Tracker
**Why Not in MVP**: Requires community data collection
**When to Add**: Month 6-12 when have enough data

---

## TECHNICAL STACK (Recommended)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Context + Zustand (if needed)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (for CSV uploads)
- **API**: Next.js API Routes
- **Edge Functions**: Supabase Edge Functions (for cron jobs)

### External Services
- **Email**: Resend or SendGrid
- **LLM**: Anthropic Claude or OpenAI GPT-4
- **Analytics**: Plausible or PostHog
- **Error Tracking**: Sentry
- **Payments**: Stripe

### Hosting
- **Frontend**: Vercel
- **Database**: Supabase (hosted)
- **Domain**: rewardify.com.au or rewardify.io

---

## DEVELOPMENT TIMELINE

### Week 1: Foundation
- [ ] Project setup (Next.js + Supabase)
- [ ] Auth flow (sign up, login, password reset)
- [ ] Card database schema + admin panel
- [ ] Landing page (simple)
- **Deliverable**: Can sign up and see card database

### Week 2: Core Tracking
- [ ] "Add Card" flow
- [ ] "My Cards" dashboard
- [ ] Card detail view
- [ ] Edit/delete cards
- **Deliverable**: Can track your own cards

### Week 3: Calendar & Reminders
- [ ] Churning calendar (timeline view)
- [ ] Cancel date calculations
- [ ] Email reminder system (cron job setup)
- [ ] Email templates
- **Deliverable**: See timeline + get reminders

### Week 4: Polish Phase 1
- [ ] UI improvements (empty states, loading states)
- [ ] Mobile responsiveness
- [ ] Bug fixes
- [ ] Onboarding flow
- **Deliverable**: Phase 1 feels polished

### Week 5: Comparison & Recommendation
- [ ] Card comparison tool
- [ ] "Recommend next card" algorithm
- [ ] Dashboard home page
- **Deliverable**: System recommends next card

### Week 6: Spending Optimizer
- [ ] Spending input form
- [ ] "Best card for spend" calculator
- [ ] Points estimate
- **Deliverable**: Know which card to use

### Week 7: Statement Analysis
- [ ] CSV upload
- [ ] Parser + LLM integration
- [ ] Spending breakdown
- [ ] "Missed points" analysis
- **Deliverable**: Upload statement, get insights

### Week 8: Launch Prep
- [ ] Free vs Pro tier gating
- [ ] Stripe integration
- [ ] Landing page improvements
- [ ] Beta testing with friends
- [ ] r/AusFinance launch post
- **Deliverable**: Public beta launch

---

## SUCCESS METRICS (MVP)

### Product Metrics
- **Activation**: % of users who add first card (target: 70%+)
- **Engagement**: % of users who return weekly (target: 40%+)
- **Feature Usage**: Which features are used most?
- **Drop-off**: Where do users abandon the flow?

### Business Metrics
- **Sign-ups**: Total free users (target: 100 by Week 8)
- **Conversion**: Free → Paid rate (target: 15-20%)
- **MRR**: Monthly recurring revenue (target: $1K by Month 3)
- **Churn**: Monthly churn rate (target: <5%)

### Validation Questions
- Do users actually track cards consistently?
- What features do they use most?
- What's the "aha moment"?
- Would they pay $49/month? Why or why not?

---

## MVP LAUNCH CHECKLIST

### Before Launch
- [ ] All Phase 1 features working
- [ ] At least 2 Phase 2 features working
- [ ] Stripe payment integration tested
- [ ] Email reminders working
- [ ] Mobile responsive
- [ ] Analytics installed
- [ ] Error tracking setup
- [ ] Landing page complete
- [ ] Privacy policy + terms
- [ ] Legal review (financial disclaimer)

### Launch Week
- [ ] 5-10 friends/family beta test
- [ ] Fix critical bugs
- [ ] r/AusFinance launch post ready
- [ ] Twitter account setup
- [ ] PointsHacks outreach email drafted
- [ ] Press list (if any)

### Post-Launch (Week 9-12)
- [ ] User interviews (10-15 users)
- [ ] Feature request tracking
- [ ] Bug fixes
- [ ] Analytics review
- [ ] Iterate based on feedback

---

## FEATURE PRIORITIZATION FRAMEWORK

**Use this to decide what to build next after MVP:**

### Must Build If:
- ✅ Multiple users request it
- ✅ Solves core pain point
- ✅ Reduces churn
- ✅ Drives free → paid conversion

### Should Build If:
- ⚠️ Improves engagement
- ⚠️ Competitive feature (others have it)
- ⚠️ Can build quickly (<1 week)

### Skip If:
- ❌ Only one user wants it
- ❌ "Nice to have" not "need to have"
- ❌ Complex to build (>2 weeks)
- ❌ Low ROI (doesn't move metrics)

---

## CONCLUSION

**MVP Goal**: Ship in 8 weeks with core value prop (automated tracking + reminders).

**Success = Validation**: 20 paying users by Month 3.

**Focus**: Nail ONE problem (tracking) before adding features.

**Remember**: You're building for YOU first. If it solves YOUR problem, it solves the problem for others like you.

---

**Document Status**: ✅ COMPLETE
**Last Updated**: 2025-12-10
**Next Review**: After Week 4 (mid-MVP check-in)
