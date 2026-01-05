# 📊 Reward Relay - Project Status

**Last Updated**: January 5, 2026
**Current Phase**: Monetization & Engagement Optimization
**Target**: $50K MRR with 70% profit margin in 6 months

---

## 🎯 Strategic Goals

### Primary Objective
Build a profitable credit card churning SaaS for Australian users targeting:
- **Revenue Target**: $50K monthly recurring revenue (MRR)
- **Profit Margin**: 70% net (COGS: 9-10%, CAC: <$25)
- **Pricing**: $39/month Pro tier (freemium model)
- **Required Paying Users**: 1,282 users ($50K / $39)
- **Timeline**: 6 months to target

### Key Metrics to Track
- **CAC (Customer Acquisition Cost)**: Target <$25 blended
  - Organic: $0
  - Paid (Google/Facebook): $20-30
  - Referral: $5-10
- **Trial → Paid Conversion**: 18-25% (no credit card required)
- **Churn Rate**: <5% monthly
- **LTV:CAC Ratio**: >3:1
- **Daily Active Users (DAU)**: Track streak retention

---

## ✅ Completed Features (MVP + Engagement)

### Core MVP (90% Complete)
- [x] **User authentication** - Supabase Auth with email/password
- [x] **Card management** - Add, edit, delete, status tracking
- [x] **Card catalog** - Browse Australian credit cards
- [x] **Spending tracker** - Progress bars, manual entry
- [x] **CSV statement upload** - Multi-bank support (CommBank, ANZ, NAB, Westpac)
- [x] **Visual churning calendar** - Timeline view with bank grouping
- [x] **Email reminders** - 30/14/7 day alerts (Resend integration)
- [x] **Card comparison** - Net value rankings, recommendations
- [x] **History & eligibility** - 12-month rule tracking
- [x] **Dashboard** - Active cards overview, quick stats
- [x] **Projections** - Multi-card path calculator for travel goals

### 🆕 Engagement & Monetization System (January 2026)

#### Analytics Foundation
- [x] **PostHog Integration** - Event tracking for all user actions
  - `src/lib/analytics/posthog.ts` - Client initialization
  - `src/lib/analytics/events.ts` - Type-safe event definitions
  - `src/contexts/AnalyticsContext.tsx` - UTM tracking & attribution
  - `src/components/analytics/AnalyticsProvider.tsx` - App-wide wrapper
- [x] **CAC Tracking** - Source attribution for every signup
  - Organic, paid (Google/Facebook), referral, direct
  - First-touch attribution persisted in localStorage
  - CAC estimates by channel in event metadata
- [x] **Conversion Funnel Tracking**
  - Signup → Trial → Paid conversion events
  - Days to convert, total CAC per user
  - MRR tracking per subscription activation

#### Onboarding Quiz (Behavior-Focused)
- [x] **3-Question Quiz** - `src/components/onboarding/OnboardingQuiz.tsx`
  - Q1: Primary spending category (groceries/dining/travel/shopping/mixed)
  - Q2: Optimization goal (points/cashback/both)
  - Q3: Churning goal (domestic/international/cashback/unsure)
- [x] **Auto-Advance UI** - Smooth step-by-step flow
- [x] **Profile Storage** - Quiz answers saved to `user_profiles` table
- [x] **Analytics Tracking** - Each answer tracked for personalization insights

#### Database Schema (Engagement)
- [x] **Migration Applied** - `20250106000000_user_profiles_and_deals.sql`
- [x] **user_profiles Table**
  - Onboarding quiz answers (spending_category, optimization_goal, churning_goal)
  - Streak tracking (current_streak_days, longest_streak_days, last_active_date)
  - Free days earned (7-day streak = 1 free premium day)
  - Onboarding completion timestamp
- [x] **deals Table**
  - Curated card-linked offers from OzBargain
  - Merchant, card network, specific issuer matching
  - Valid from/until dates, is_active status
  - View count, click count for engagement tracking
  - Source tracking (ozbargain, manual, merchant)
- [x] **daily_insights Table**
  - Pre-computed personalized tips per user
  - Types: spending, fee_warning, churn_reminder, deal
  - Viewed/clicked timestamps for engagement metrics
  - Associated card and deal references
- [x] **Streak Function** - `update_user_streak(p_user_id UUID)`
  - Auto-increments streak on daily visits
  - Awards 1 free day every 7-day streak
  - Resets if user misses a day

#### OzBargain Deal Scraper
- [x] **Web Scraper** - `scripts/scrape-ozbargain.ts`
  - Searches credit card, AMEX, Mastercard, Visa, cashback, points
  - Extracts merchant from known Australian retailers (Woolworths, Coles, Myer, etc.)
  - Detects card network (AMEX, Visa, Mastercard) from title
  - Identifies specific issuers (ANZ, Westpac, CBA, NAB)
  - Rate-limited (2 seconds between requests)
  - De-duplicates by deal URL
  - Auto-expires deals after 7 days
- [x] **Database Integration** - Saves to `deals` table with full metadata
- [ ] **Cron Job** - TODO: Run daily at 6am to refresh deals

#### Daily Insights Dashboard
- [x] **DailyInsights Component** - `src/components/dashboard/DailyInsights.tsx`
  - **Streak Card**: Displays current streak, days until next free day, total free days earned
  - **Today's Insights**: Shows up to 3 personalized tips (spending, fee warnings, churn reminders, deals)
  - **Hot Deal of the Day**: Highest-clicked active deal with merchant, network, expiry
- [x] **Dashboard Integration** - Top of `/dashboard` page
- [x] **Auto-Streak Update** - Calls `update_user_streak()` on page load
- [x] **Analytics Tracking**
  - `daily_insights_viewed` - Count and types tracked
  - `daily_insight_clicked` - Tip type and title tracked
  - `deal_clicked` - Deal ID, title, merchant tracked
- [x] **Engagement Metrics**
  - Marks insights as viewed automatically
  - Tracks click-through rates
  - Increments deal click counters

#### Email Infrastructure
- [x] **Resend DNS Configuration** - Cloudflare setup complete
  - send.rewardrelay.app subdomain for outgoing (Resend)
  - rewardrelay.app main domain for incoming (Cloudflare Email Routing)
  - DKIM, SPF, MX records configured
- [ ] **⚠️ PRIORITY: Supabase Custom SMTP** - Configure Supabase Auth to use Resend ASAP
  - Auth emails (signup confirmation, password reset) must work
  - Currently using default Supabase SMTP (unreliable for production)
  - Need to test send/receive from third parties
- [ ] **Transactional Email Testing** - Verify all outgoing emails work
  - Signup confirmation emails
  - Password reset emails
  - Card reminder emails (30/14/7 day alerts)
  - Test delivery to Gmail, Outlook, Yahoo, etc.
- [ ] **Weekly Email Digest Template** - React Email template
  - Tease 3 of 5 deals to drive app opens
  - Include streak status and top insight
  - Send Mondays at 9am

---

## 🚧 In Progress

### ⚠️ Critical: Email System Setup
- [ ] **Configure Supabase Auth SMTP with Resend** - MUST WORK ASAP
  - Auth confirmation emails (signup verification)
  - Password reset emails
  - Test with Gmail, Outlook, Yahoo, ProtonMail
- [ ] **Test Transactional Email Delivery**
  - Verify deliverability to all major email providers
  - Check spam folder placement
  - Test from/reply-to addresses work correctly
  - Ensure email authentication (DKIM, SPF, DMARC) passes

### Trial Stickiness & Engagement
- [ ] **Daily Insights Generation Logic**
  - Build algorithm to create personalized tips
  - Based on: User profile (quiz answers), cards, upcoming dates
  - Types: Fee warnings (14 days before), churn reminders (when eligible), spending optimization
- [ ] **Weekly Email Digest**
  - Design Resend React Email template
  - Format: Show 3 deals, tease 2 more (drive app opens)
  - Include: Streak status, top personalized insight, hot deals
  - Schedule: Mondays at 9am
- [ ] **Deal Cron Job**
  - Run OzBargain scraper daily (e.g., 6am)
  - Auto-clean expired deals (older than 7 days)
  - Store new deals in database

### Subscription Infrastructure
- [ ] **Stripe Integration**
  - Checkout session creation
  - Webhook handling for subscription events
  - Customer portal for management
- [ ] **Subscription Lifecycle**
  - Trial management (5-day progressive trial)
  - Free days extension logic (earned from streaks)
  - Billing date calculations
- [ ] **Paywall Implementation**
  - Free tier: 2-3 card limit, basic tracking
  - Pro tier ($39/month): Unlimited cards, recommendations, projections, insights

---

## 📋 Backlog (Prioritized)

### Phase 1: Monetization Launch (Weeks 1-2)
- [ ] Stripe subscription integration
- [ ] Paywall UI components
- [ ] Free tier limitations
- [ ] Pro tier feature unlocks
- [ ] Upgrade prompts and CTAs

### Phase 2: Engagement Optimization (Weeks 3-4)
- [ ] Daily insights generation algorithm
- [ ] Weekly email digest template
- [ ] Email scheduling cron job
- [ ] OzBargain scraper cron job
- [ ] Deal display page (browse all deals)

### Phase 3: Trial Conversion (Weeks 5-6)
- [ ] Progressive trial feature unlocking (Days 1-5)
- [ ] Day 1: Immediate value + onboarding quiz
- [ ] Day 2: Unlock spending tracker
- [ ] Day 3: Unlock recommendations
- [ ] Day 4: Unlock projections
- [ ] Day 5: Unlock full access + upgrade prompt
- [ ] In-app upgrade prompts at strategic moments
- [ ] Testimonials & social proof
- [ ] Trial expiry notifications

### Phase 4: Growth & Acquisition (Weeks 7-8)
- [ ] Referral system (earn free months)
- [x] **Landing page optimization**
  - Professional icon library (Lucide React) instead of emojis
  - Comprehensive pricing section (Monthly $39, Annual $390)
  - Social proof section (3 trust signals)
  - Enhanced projections showcase (3 goals)
  - Feature highlights section (4 key features)
  - FAQ section (6 questions)
  - Sticky header navigation
  - Improved text selection visibility
- [ ] SEO optimization (OzBargain keywords)
- [ ] Content marketing (blog posts)
- [ ] Google Ads campaign setup
- [ ] Facebook Ads campaign setup
- [ ] Reddit community engagement

### Phase 5: Retention & Expansion (Weeks 9-12)
- [ ] Churn prediction model
- [ ] Win-back campaigns
- [ ] Annual subscription discount (save 20%)
- [ ] Premium features brainstorming
- [ ] Multi-user household plans
- [ ] Application document storage
- [ ] Points transfer tracking

---

## 🔮 Future Ideas (Not Prioritized)

### Advanced Features
- [ ] **AI Chatbot Assistant** - Natural language data entry
- [ ] **Mobile App** - PWA or React Native
- [ ] **Points Valuation Optimizer** - Custom redemption goals
- [ ] **Travel Redemption Calculator** - Point requirements for flights/hotels
- [ ] **Card Recommendation AI** - ML-based personalization
- [ ] **Bank Scraper** - Live card offers from bank websites
- [ ] **Credit Score Integration** - Equifax/Illion API
- [ ] **Browser Extension** - Shopping assistant (lightweight)

### Community Features
- [ ] **Referral Link Management** - Track referral signups
- [ ] **Community Forum** - Discussion board
- [ ] **User Leaderboards** - Gamify churning success
- [ ] **Success Stories** - User testimonials and case studies

---

## 📈 Success Metrics Dashboard

### Key Performance Indicators (KPIs)

#### Revenue Metrics
- **Current MRR**: $0 (pre-launch)
- **Target MRR**: $50K (6 months)
- **Paying Users**: 0
- **Target Paying Users**: 1,282 users
- **ARPU (Average Revenue Per User)**: $39/month
- **Churn Rate**: TBD (target <5%)
- **LTV (Lifetime Value)**: TBD (target >$117)

#### Acquisition Metrics
- **Total Signups**: TBD
- **Trial Signups**: TBD
- **Trial → Paid Conversion**: TBD (target 18-25%)
- **CAC by Channel**:
  - Organic: $0 (target 40% of signups)
  - Google Ads: TBD (target $25)
  - Facebook Ads: TBD (target $30)
  - Reddit: TBD (target $5)
  - Referral: TBD (target $10)
- **Blended CAC**: TBD (target <$25)

#### Engagement Metrics
- **DAU (Daily Active Users)**: TBD
- **7+ Day Streaks**: TBD (target 30% of users)
- **Daily Insights View Rate**: TBD (target 70%)
- **Deal Click-Through Rate**: TBD (target 20%)
- **Weekly Email Open Rate**: TBD (target 25%)
- **Weekly Email Click Rate**: TBD (target 10%)

#### Product Metrics
- **Cards Added Per User**: TBD (target 3-5)
- **CSV Uploads Per User**: TBD (target 2+)
- **Spending Tracker Usage**: TBD (target 60%)
- **Calendar Views**: TBD (target 50%)
- **Recommendations Clicked**: TBD (target 40%)

---

## 🎨 Design System

### Brand Identity
- **Primary Color**: Teal (#14b8a6)
- **Accent Color**: Purple (#8b5cf6)
- **Background**: Dark slate (#0f172a)
- **Typography**: Inter (sans-serif)
- **Style**: Modern, glassmorphism, gradient accents
- **Logo**: Currently SVG emoji (📊), considering professional logo generation
  - Options: Recraft.ai (free AI), Canva, logoipsum.com, DIY Figma

### Component Library
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React (replaced emojis throughout app)
- **Charts**: Recharts (for projections)
- **Animations**: Framer Motion (minimal, strategic)

---

## 🔐 Security & Compliance

### Data Protection
- [x] Row Level Security (RLS) enabled on all tables
- [x] Supabase Auth for authentication
- [x] No credit card numbers stored
- [x] Encrypted connections (HTTPS)
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] GDPR compliance (for international users)
- [ ] Data export functionality

### Monitoring
- [x] PostHog analytics (privacy-friendly)
- [ ] Sentry error tracking
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Performance monitoring (Vercel Analytics)

---

## 🚀 Deployment Status

### Infrastructure
- **Frontend**: Deployed on Vercel (production-ready)
- **Database**: Supabase (hosted PostgreSQL)
- **Email**: Resend (DNS configured, SMTP pending)
- **Analytics**: PostHog (configured)
- **Domain**: rewardrelay.app (configured)

### Environments
- **Production**: https://rewardrelay.app (live)
- **Staging**: TBD (optional)
- **Development**: http://localhost:3000

### CI/CD
- **GitHub Actions**: TBD (optional)
- **Vercel Auto-Deploy**: Enabled on push to master
- **Database Migrations**: Manual via `supabase db push`

---

## 📚 Documentation Status

### Developer Docs
- [x] README.md - Comprehensive project overview
- [x] TESTING.md - Test strategy and setup
- [x] PROJECT_STATUS.md - This file
- [ ] API.md - API endpoints documentation
- [ ] DEPLOYMENT.md - Production deployment guide
- [ ] CONTRIBUTING.md - Contribution guidelines

### User Docs
- [ ] Help Center (in-app)
- [ ] Video tutorials
- [ ] FAQ page
- [ ] Onboarding guide
- [ ] Best practices blog posts

---

## 👥 Team & Responsibilities

**Current Team**: Solo founder (John Keto)

**Roles**:
- Product strategy & design
- Full-stack development
- DevOps & infrastructure
- Marketing & growth
- Customer support

**Future Hiring** (when revenue justifies):
- Growth marketer ($50K+ MRR)
- Customer success manager ($100K+ MRR)
- Backend engineer ($150K+ MRR)

---

## 💰 Financial Projections

### Cost Structure (Monthly)
- **Infrastructure**: $50-100 (Supabase, Vercel, Resend)
- **Analytics**: $0 (PostHog free tier, 1M events/month)
- **Marketing Spend**: $500-2000 (Google/Facebook Ads)
- **Domain & DNS**: $2 (Cloudflare)
- **Total Fixed Costs**: ~$600-2200/month

### Revenue Milestones
- **Month 1**: $500 MRR (13 paying users)
- **Month 2**: $2K MRR (51 paying users)
- **Month 3**: $8K MRR (205 paying users)
- **Month 4**: $18K MRR (462 paying users)
- **Month 5**: $35K MRR (897 paying users)
- **Month 6**: $50K MRR (1,282 paying users) ✅ TARGET

### Profit Margins
- **Target**: 70% net profit margin
- **$50K MRR**: $35K net profit/month
- **Annual**: $600K MRR, $420K net profit

---

## 🎯 Next Sprint (Week of Jan 6-12, 2026)

### Priority 0: Email System (CRITICAL - Must Work ASAP)
1. Configure Supabase Auth to use Resend SMTP
2. Test signup confirmation emails
3. Test password reset emails
4. Verify deliverability to Gmail, Outlook, Yahoo, ProtonMail
5. Check spam folder placement and authentication
6. Test card reminder emails (30/14/7 day system)

### Priority 1: Stripe Integration
1. Set up Stripe account
2. Create product and pricing in Stripe
3. Build checkout session API route
4. Implement webhook handler
5. Create subscription status in database
6. Test full payment flow

### Priority 2: Paywall Implementation
1. Build paywall UI components
2. Add free tier limitations (2-3 cards max)
3. Add upgrade prompts throughout app
4. Create pricing page
5. Add "Pro" badges to features
6. Test free → paid upgrade flow

### Priority 3: Daily Insights Algorithm
1. Design insight generation logic
2. Build fee warning generator (14 days before)
3. Build churn reminder generator (when eligible)
4. Build spending optimization tips
5. Test with real user profiles
6. Schedule nightly generation cron job

---

## ✅ Definition of "Launch Ready"

### MVP Launch Checklist
- [x] Core features complete (card tracking, spending, calendar, recommendations)
- [ ] Stripe subscription working
- [ ] Paywall implemented
- [ ] Free tier limits enforced
- [ ] Analytics tracking all events
- [ ] Email system tested
- [ ] Landing page optimized
- [ ] Privacy policy & ToS published
- [ ] Error monitoring setup
- [ ] Beta user testing complete (5-10 users)

### Growth Ready Checklist
- [ ] Daily insights generation working
- [ ] Weekly email digest sending
- [ ] OzBargain scraper running daily
- [ ] Trial conversion optimized (>20%)
- [ ] Referral system live
- [ ] Marketing campaigns live
- [ ] Customer support process defined
- [ ] Churn mitigation strategies tested

---

## 📝 Change Log

### January 5, 2026 (Evening) - Landing Page & Navigation Polish
- ✅ Comprehensive landing page enhancements
  - Replaced all emojis with professional Lucide React icons
  - Added pricing section with Monthly ($39) and Annual ($390) options
  - Added social proof section with 3 trust signals
  - Enhanced projections showcase from 2 to 3 goals
  - Added feature highlights section (4 key features)
  - Added FAQ section (6 questions with accordion style)
  - Removed inappropriate "free forever" references
  - Removed Supabase security references
- ✅ Navigation consistency improvements
  - Created shared Header component (app/src/components/layout/Header.tsx)
  - Applied consistent sticky header across landing and auth pages
  - Logo clickable on auth pages, static on landing page
- ✅ UX improvements
  - Fixed text selection visibility (80% opacity teal highlight)
  - Ensured header stays sticky when scrolling
- 📝 Updated branding in README.md (REWARDIFY → REWARD RELAY)
- 🎨 Landing page now looks professional and conversion-optimized

### January 5, 2026 (Morning) - Engagement System Launch
- ✅ Implemented PostHog analytics with CAC tracking
- ✅ Built 3-question onboarding quiz
- ✅ Created database schema for profiles, deals, daily_insights
- ✅ Built OzBargain web scraper
- ✅ Implemented daily insights dashboard with streak tracking
- ✅ Configured Resend DNS for email
- 📝 Updated documentation (PROJECT_STATUS.md)

### December 2025 - MVP Foundation
- ✅ Built core card tracking features
- ✅ Implemented spending tracker with CSV upload
- ✅ Created visual churning calendar
- ✅ Designed card recommendation system
- ✅ Deployed to Vercel

---

**Last Updated**: January 5, 2026
**Next Review**: January 12, 2026

---

Made with ❤️ for the Australian churning community | [rewardrelay.app](https://rewardrelay.app)
