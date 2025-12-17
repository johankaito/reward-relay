# REWARDIFY - WEEK 1 EXECUTION PLAN

**Your Situation**: You have 2 credit cards NOW, ready to churn the next one, keeping AMEX permanent.

**Week 1 Goal**: Build JUST enough to help YOU make your next churning decision.

---

## THE STRATEGY: Build for YOUR Immediate Need

**Traditional MVP approach**: Build full tracking system → then use it
**Your approach**: Build what you need TODAY → then add features

**What You Need RIGHT NOW**:
1. ✅ Track your current 2 cards (AMEX + one other)
2. ✅ See when you last churned
3. ✅ Compare cards you haven't churned recently
4. ✅ Decide which card to apply for next

**What You DON'T Need Yet**:
- ❌ Reminders (not urgent)
- ❌ Spending optimization (nice-to-have)
- ❌ Statement analysis (later)

**Week 1 delivers JUST #1-4. Nothing more.**

---

## YOUR CURRENT CARDS (Document Now)

**Card 1 (AMEX - Keeping)**:
- Card name: _____________________
- Application date: _____________________
- Annual fee: $_____
- Points earned: _____
- Status: Active/Permanent

**Card 2 (Churning)**:
- Card name: _____________________
- Application date: _____________________
- Annual fee: $_____
- Points earned: _____
- When to cancel: _____________________

**Cards You've Previously Churned**:
1. Card: _____________________ | Applied: _____ | Cancelled: _____
2. Card: _____________________ | Applied: _____ | Cancelled: _____
3. Card: _____________________ | Applied: _____ | Cancelled: _____

**Next Churn Decision**:
- When do you need to decide? _____________________
- What banks are you considering? _____________________
- What's blocking your decision? _____________________

---

## WEEK 1 DAY-BY-DAY PLAN (10-15 hours total)

### Day 1 (Monday): Project Setup (2 hours)

**Morning** (1 hour):
```bash
# 1. Create new repo
cd ~/gits/src/github.com/johankaito
npx create-next-app@latest rewardify
cd rewardify

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/auth-ui-react
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install tailwindcss shadcn/ui

# 3. Initialize git
git init
git add .
git commit -m "Initial commit: Rewardify"
```

**Evening** (1 hour):
- Set up Supabase project at supabase.com
- Copy API keys to `.env.local`
- Test connection (simple query)
- **Done when**: App runs locally with Supabase connected

**Deliverable**: Project runs on `localhost:3000`

---

### Day 2 (Tuesday): Auth + Database (2-3 hours)

**Morning** (1.5 hours):
- Implement Supabase Auth (email + password)
- Create sign-up page
- Create login page
- Test: You can sign up and log in

**Evening** (1-1.5 hours):
- Create `cards` table in Supabase:
  ```sql
  create table cards (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    bank text not null,
    annual_fee int not null,
    welcome_bonus int not null,
    min_spend int not null,
    points_rate decimal not null
  );
  ```
- Add 10 Australian cards manually (AMEX, ANZ, CommBank, NAB, Westpac)

**Deliverable**: You have an account + 10 cards in database

---

### Day 3 (Wednesday): Track YOUR Cards (2 hours)

**Morning** (1 hour):
- Create `user_cards` table:
  ```sql
  create table user_cards (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    card_id uuid references cards not null,
    application_date date not null,
    status text default 'active'
  );
  ```
- Create "Add Card" form

**Evening** (1 hour):
- Build card list view (dashboard)
- **USE IT**: Add YOUR 2 current cards
- Display: Card name, application date, days since applied

**Deliverable**: You see YOUR cards on the dashboard

---

### Day 4 (Thursday): Churn History (2 hours)

**Morning** (1 hour):
- Add "Date Cancelled" field to user_cards
- Build "Mark as Cancelled" flow
- **USE IT**: Mark your previously churned cards as cancelled

**Evening** (1 hour):
- Create view: "Active" vs "Cancelled" cards
- Calculate: Last time you applied to each bank
- Display: "Eligible to churn again in X days" (12-month rule)

**Deliverable**: You see your churn history + eligibility

---

### Day 5 (Friday): Card Comparison (2-3 hours)

**Morning** (1.5 hours):
- Build card comparison page
- Show: All cards you HAVEN'T churned recently
- Filter: Only cards you're eligible for (12+ months since last)

**Evening** (1-1.5 hours):
- Add net value calculation:
  ```
  Net Value = (Welcome Bonus Points × 0.01) - Annual Fee
  ```
- Sort cards by net value (highest first)
- **USE IT**: See which card you should apply for next

**Deliverable**: You know which card to apply for

---

### Day 6 (Saturday): Polish + Use (2 hours)

**Morning** (1 hour):
- Fix any bugs you found during the week
- Make it mobile-friendly (you'll check on your phone)
- Add basic styling (doesn't need to be perfect)

**Evening** (1 hour):
- **DECIDE**: Which card will you apply for?
- Document your decision in CUSTOMER_STORY_001.md
- Apply for the card (if ready)
- Track it in the app

**Deliverable**: You've made your next churning decision using your own tool

---

### Day 7 (Sunday): Reflect + Plan Week 2 (1 hour)

**Morning** (30 min):
- Review what you built
- List what was painful (these become features)
- List what was missing (these become backlog)

**Evening** (30 min):
- Share with 2 churner friends: "I built this for myself, want to try?"
- Get their feedback
- Plan Week 2 based on feedback

**Deliverable**: 2 friends have accounts + you have Week 2 priorities

---

## SUCCESS METRICS (End of Week 1)

**Must Have**:
- ✅ YOU can track your 2 current cards
- ✅ YOU can see your churn history
- ✅ YOU can compare eligible cards
- ✅ YOU made your next churn decision using the tool

**Nice to Have**:
- ⚠️ 2 friends signed up
- ⚠️ Friends found it useful

**Failure States**:
- ❌ Tool doesn't help YOU make a decision
- ❌ You didn't use it for your own churn
- ❌ It's slower than your spreadsheet

**If failure state = true**: Stop and analyze why before Week 2.

---

## TECHNICAL DECISIONS (Pre-Made to Save Time)

### Tech Stack (Final Decision)
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel (frontend), Supabase (backend)
- **Email**: Resend (for reminders later)
- **Analytics**: Plausible (simple, privacy-first)

**Why This Stack**:
- ✅ You can build alone
- ✅ Deploys in minutes
- ✅ Costs <$50/month
- ✅ Scales to 1,000+ users easily
- ✅ No DevOps required

### Database Schema (Week 1 Only)

```sql
-- Cards (global catalog)
create table cards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  bank text not null,
  annual_fee int not null,
  welcome_bonus int not null,
  min_spend int not null,
  points_rate decimal not null,
  churning_rule_months int default 12
);

-- User's cards
create table user_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  card_id uuid references cards not null,
  application_date date not null,
  cancellation_date date,
  status text default 'active',
  notes text
);

-- Row Level Security
alter table user_cards enable row level security;

create policy "Users can only see their own cards"
  on user_cards for all
  using (auth.uid() = user_id);
```

---

## WHEN YOU GET STUCK

### Blocker: "I don't know how to do X in Next.js"
**Solution**:
1. Check Next.js docs first (docs.nextjs.org)
2. Ask Claude Code (me!) for specific help
3. Use v0.dev to generate component quickly
4. Don't spend >30 min stuck - ask for help

### Blocker: "Supabase isn't working"
**Solution**:
1. Check API keys are in `.env.local`
2. Check RLS policies are correct
3. Use Supabase dashboard SQL editor to test queries
4. Ask me if still stuck after 15 min

### Blocker: "I don't have time this day"
**Solution**:
- Skip that day, but make it up on weekend
- Minimum viable week = 10 hours total
- If you can't do 10 hours, this project isn't your priority (be honest)

### Blocker: "This is taking longer than planned"
**Solution**:
- Cut scope - remove nice-to-haves
- Focus ONLY on helping yourself make next churn decision
- Shipping something > perfect plan

---

## WHAT YOU'LL HAVE BY END OF WEEK 1

**A tool that**:
- Tracks your current cards (AMEX + other)
- Shows your churn history
- Recommends next card to apply for
- Helps you make your REAL churn decision

**You'll have used it for YOUR actual need.**

**This isn't a demo. It's a real tool solving your real problem TODAY.**

---

## WEEK 2 PREVIEW (Based on What You Learn)

After Week 1, you'll know:
- What features you ACTUALLY need (vs what you planned)
- What's painful without automation
- What your friends want (if you shared with them)

Week 2 will build whatever you discovered you needed most:
- Maybe: Reminders (if you almost missed a cancel date)
- Maybe: Spending tracker (if you need to hit minimum spend)
- Maybe: Better comparison (if choosing was still hard)

**Let Week 1 inform Week 2. Don't follow the plan blindly.**

---

## THE COMMITMENT

**This week, you will**:
- Build for YOUR need (not theory)
- Use it for YOUR actual churn decision
- Ship something working by Day 6
- Share with 2 friends by Day 7

**At the end of Week 1, you'll have**:
- ✅ A working tool
- ✅ Used it for real
- ✅ 2 data points from friends
- ✅ Confidence to continue

**If you don't have these, Week 2 doesn't start. Fix Week 1 first.**

---

## DAILY STANDUP (Copy This Each Day)

### Day: ___ (Mon/Tue/Wed/Thu/Fri/Sat/Sun)

**Time available today**: _____ hours

**Planned**:
1. _____________________
2. _____________________

**Actually shipped**:
1. _____________________
2. _____________________

**Blocker**: _____________________

**Did I use the tool for my own cards?**: Yes / No / Not yet

**Ready for tomorrow**: Yes / No

---

**Document Status**: ✅ Ready to Execute
**Start Date**: [Fill in when you start Day 1]
**Your Current Churn Need**: Ready to churn next card (keeping AMEX)

**This plan is optimized for YOUR ACTUAL SITUATION, not theory.**

**Start Monday. By Friday, you'll know which card to apply for next.**
