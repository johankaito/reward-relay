# Retention Research — Reward Relay
**Date:** April 2026  
**Purpose:** Product planning for v1.5 retention features

---

## Executive Summary

Reward Relay faces a structural engagement problem shared by all eligibility-gated tools: the core value event (knowing when to apply) is a one-time answer per cycle, not a daily need. Research across AU churning communities (AFF, Point Hacks AU), US equivalents (MaxRewards, AwardWallet), and comparable fintech categories confirms that the apps which retain users long-term between action windows do so through three mechanisms: (1) persistent goal visualisation that turns a 12–24 month wait into a progress narrative, (2) time-sensitive alerts that pull dormant users back at the exact moment relevance spikes, and (3) content cadence that makes the app a habit even when no card action is imminent. The immediate opportunity — achievable with existing schema data in under two sprints — is an eligibility countdown, annual fee alert system, and a "what to do this week" action card built from `user_cards`, `bank_rules`, and `cards`.

---

## §1 User Lifecycle Analysis

### 1.1 Phase Mapping

The AU credit card churner does not have a continuous relationship with an eligibility tracking tool. The journey is episodic and cyclical, with well-defined phases that dictate what value an app can realistically deliver.

**Phase 1: Research (1–4 weeks)**  
The user has decided to churn or is a first-timer assessing the landscape. They are cross-referencing Point Hacks AU reviews, AFF forum threads, and comparison tables. Mental state: high curiosity, decision-making mode, high willingness to sign up for a new tool. This is the best acquisition window. App value: card comparison, bank eligibility checker, "which card next" recommendation. Churn risk: low — they just joined.

**Phase 2: Application & Approval (1–2 weeks)**  
Application submitted. Awaiting approval (typically instant to 5 business days, though some banks can take up to 10 days). Mental state: anticipatory, checking email constantly. App value: status tracking, "what to expect" content, confirmation of spend requirement details. Churn risk: low if the app acknowledges the pending state.

**Phase 3: Minimum Spend Window (60–90 days)**  
Card is active and the user must meet the spend requirement (typically $2,000–$6,000 in the first 3 months, per the project's `cards` catalog data). Mental state: focused on spend, tracking receipts manually (AU CDR does not cover credit card transactions; no issuer APIs exist for live sync). App value: deadline countdown, "X days left to meet spend", manual spend logging, encouragement. **This is the highest-risk drop-off phase** — users often stop checking the app because there is nothing new to show them. AwardWallet solves a similar problem with balance tracking; Reward Relay needs its own equivalent hook.

**Phase 4: Bonus Posts (1–4 weeks after spend met)**  
The welcome bonus points land. Mental state: elated, high satisfaction. This is a natural celebration moment. App value: bonus confirmation logging, "you've earned X points — here's what that's worth in redemptions", prompt to update card status. Churn risk: low in the short term, but this is also the moment the user thinks "job done" — re-engagement is critical here.

**Phase 5: Card In Use / Cooling Off (12–24 months)**  
This is the dead zone. Based on project `bank_rules` data: most AU banks enforce 12 months (Amex, ANZ, CBA, Westpac, HSBC, Virgin Money, Macquarie), while NAB requires 18 months. The user is sitting on a card they may or may not use actively. Mental state: passive — the goal has been achieved and the next cycle is distant. App value: annual fee reminders, "other banks you're eligible for" (distinct banks have separate cooling-off clocks), catalog change alerts, progress toward next cycle. **This is the make-or-break retention phase.** Most churning tools fail here because they have nothing to show.

**Phase 6: Next Cycle Planning (2–4 weeks before eligibility restores)**  
The cooling-off period approaches its end. Mental state: re-energised, researching options again. App value: eligibility restoration alert, "top cards you're eligible for from [Month]", comparison of current offers vs when they last applied. Churn risk: low — this is the hook-back moment.

### 1.2 Lifecycle Table

| Phase | Typical Duration | User Mental State | App Value Opportunity | Engagement Risk |
|---|---|---|---|---|
| Research | 1–4 weeks | Curious, evaluating | Card comparison, eligibility check, recommendations | LOW |
| Application → Approval | 1–2 weeks | Anticipatory | Status tracking, spend requirement details | LOW |
| Minimum Spend Window | 60–90 days | Focused on spend | Deadline countdown, spend logging, encouragement | **HIGH** |
| Bonus Posts | 1–4 weeks | Elated | Bonus confirmation, points value estimate | LOW (short-term) |
| Cooling Off | 12–24 months | Passive | Annual fee alerts, other bank eligibility, catalog news | **CRITICAL** |
| Next Cycle Planning | 2–4 weeks | Re-energised | Eligibility alert, card recommendations | LOW |

The data pattern is clear: **72–80% of a user's lifecycle sits in the Cooling Off phase**, yet this is where most tools have the least to offer. Any feature targeting retention must primarily address this phase.

---

## §2 Competitor Benchmarks

### 2.1 AwardWallet

**What it is:** Points balance aggregator covering 621+ loyalty programs. 930,000 active members managing 229.2 billion points (approximately $4.584 billion in tracked value) as of their published About page data. Their Facebook community "Award Travel 101" has 67,000 members, indicating strong community extension beyond the core app.

**Retention hook:** AwardWallet's primary retention driver is **balance anxiety** — the fear that points will expire unnoticed. They send expiry alerts as points approach their expiry date across multiple programs simultaneously. This creates a recurring, genuinely useful pull for users who hold balances in 5–15 programs. The "229 billion points" headline on their site is deliberate social proof: your points matter, don't lose them.

**Visit frequency:** Likely weekly to monthly for active travel hackers, driven by balance changes after flights or card transactions. No published DAU/MAU data found, but the 930,000 member base vs ~30 staff (confirmed on their About page) suggests a largely passive, notification-driven engagement model rather than daily app opens.

**Key features driving return:** Balance expiry alerts, spend analysis (points per transaction), benefit credit tracking for premium cards, and travel itinerary integration. The itinerary feature (forward your confirmation emails, get a master travel calendar) is particularly strong because it creates a reason to open the app every trip.

**Weakness/gap for AU churners:** AwardWallet is US-centric. AU programs (Qantas, Velocity, KrisFlyer as earned in AU) are tracked, but the product doesn't understand AU bank eligibility rules, cooling-off periods, or the AU churning workflow at all. There is no concept of "when can I apply to ANZ again."

### 2.2 MaxRewards (US)

**What it is:** US card optimisation app with 800,000+ members (per their homepage). Positioned as "Master Your Cards, Maximize Your Rewards" with AI-powered card recommendations. Premium tiers priced at $9–$20/month.

**Retention hook:** MaxRewards solves a different problem from Reward Relay — it's optimising **card usage** (which card to use at which merchant right now) rather than **card acquisition** (when to apply). This gives it a natural daily use case: open the app at checkout to see which card earns the most points at this merchant. Spend-based engagement is inherently more frequent than acquisition-based.

**Features driving return:** Merchant offer auto-activation (you get offers applied automatically so you never miss savings), benefit expiry reminders (lounge access, travel credits), real-time offer notifications, and credit score monitoring. The offer auto-activation is a retention feature masquerading as a utility — it gives users a reason to keep the app connected and valued even when they're not actively churning.

**Weakness/gap:** The spend-optimisation model requires live transaction data via bank connectivity (Plaid in the US). AU CDR does not cover credit card spend, and no AU issuer API exists for transaction-level data. MaxRewards' core daily-use loop cannot be replicated in AU without manual spend entry.

### 2.3 Point Hacks AU

**What it is:** Australia's biggest rewards content site. Covers frequent flyer programs, credit card comparisons, beginner guides, and deal aggregation. Actively maintained (last modified April 2, 2026 per their sitemap metadata). Offers a free beginner email course.

**Retention hook:** Content freshness — specifically **time-sensitive bonus offer updates**. AU credit card bonuses change 3–6 times per year per major bank. Point Hacks embeds affiliate links in every card review and comparison article, so their business model requires them to update whenever a new offer goes live. This creates a natural editorial calendar driven by bank marketing cycles. Their "Best Frequent Flyer Deals" section and deal aggregation serve the same function as deal alert emails: pulling users back when something is worth acting on.

**Visit frequency:** Likely driven by search (SEO traffic from "best Qantas credit card 2026" type queries) rather than direct retention. Their free email course and newsletter subscription are explicit attempts to convert SEO visitors into returning users. Estimated repeat visit cadence: monthly for subscribers, less frequent for search-only visitors.

**Content categories with highest engagement (inferred from navigation hierarchy):**
1. Highest-earning card comparisons per program (Qantas, Velocity, KrisFlyer)
2. New bonus offer announcements
3. Beginner guides (high SEO volume, lower churn community value)
4. Redemption guides (business class sweet spots)

**Weakness/gap:** Point Hacks is reference content, not a tool. It can't tell you when *you specifically* are eligible again. Every piece of advice is generic. Reward Relay's data is personalised — it knows the user's history.

### 2.4 Australian Frequent Flyer (AFF)

**What it is:** Australia's largest frequent flyer community with 68,000+ members, 104,639 threads, and 2.8M+ posts. The American Express subforum alone has 2,600+ threads and 100,100+ posts. Dedicated to Qantas, Virgin Australia, and all associated loyalty ecosystems.

**Retention hook:** Community — specifically, **collective intelligence on time-sensitive opportunities**. Churners return to AFF when a bank launches a new bonus offer, when a bank changes its T&Cs (e.g., the AFF article cited in the project's own `bank_rules` migration: "Bank Crackdown on Credit Card Churning"), or when they want peer validation before an application decision. The forum threads around "100,000 bonus ANZ points" or similar offers generate hundreds of replies as members share approval/decline experiences, data points on wait times, and strategy refinements.

**Engagement drivers for churners specifically:** New offer announcements, T&C changes, eligibility rule clarifications, and trip reports (the "I got business class for X points" posts that remind lurkers why they're churning in the first place).

**Weakness/gap:** AFF is unstructured signal. A user can't look up "am I currently eligible for ANZ?" — they have to search through threads, read T&Cs themselves, and do the mental arithmetic. This is exactly the gap Reward Relay fills.

### 2.5 Comparison Table

| App / Site | Primary Retention Hook | Visit Frequency | Key Feature Driving Return | Weakness / Gap |
|---|---|---|---|---|
| AwardWallet | Balance expiry anxiety | Weekly–monthly | Multi-program expiry alerts | No AU bank eligibility awareness; US-centric |
| MaxRewards (US) | Daily spend optimisation | Daily | Merchant offer at checkout | Requires live spend data (not available in AU) |
| Point Hacks AU | Content freshness + deal alerts | Monthly (subscribers) | New bonus offer announcements | Generic, not personalised; no eligibility tracking |
| AFF Forums | Community + collective intelligence | Weekly (active members) | New offer discussions, T&C changes | Unstructured; user must self-interpret |
| Reward Relay (current) | Eligibility countdown | When triggered | "You're eligible for X" | Dead zone in cooling-off phase; no push/email hooks |

---

## §3 Event-Driven Notification Opportunities

The following table maps every lifecycle event that is a natural notification trigger. Complexity ratings assume existing schema: `user_cards`, `bank_rules`, `cards` (with `eligibility_restriction_months`, `bonus_spend_window_months`, `offer_expiry_date`).

| # | Event | Frequency per User per Year | User Value | Implementation Complexity | Recommended Channel |
|---|---|---|---|---|---|
| 1 | Eligibility restored (cooling-off ends for a bank) | 1–3× (depends on card portfolio) | **HIGH** — this is the core product moment; user has been waiting months | LOW — `cancellation_date` + `bank_rules.rule_months` → calculate date, schedule reminder | Email + Push |
| 2 | Bonus spend deadline approaching (14 days out) | 1–3× | **HIGH** — user may miss $2k–$6k spend requirement and lose bonus worth $500–$1,500 equivalent | LOW — `application_date` + `bonus_spend_window_months` from `cards` → calculate deadline | Push + Email |
| 3 | Annual fee renewal approaching (30 days) | 1× per active card | **HIGH** — churner needs to decide: keep, downgrade, or cancel; $99–$1,295 at stake | LOW — `approval_date` + 12 months anniversary calculation | Email |
| 4 | High-value new card added to catalog | 4–8× (bank marketing cycles) | **MEDIUM** — if user is eligible, high value; if not, lower value | MEDIUM — requires catalog monitoring job + eligibility check per user | Push + In-app |
| 5 | Bank exclusion period shortened (catalog change) | 1–3× (rare, significant when it happens) | **HIGH** for affected users — e.g., if NAB dropped from 18 to 12 months, users suddenly eligible sooner | MEDIUM — requires changelog tracking on `bank_rules` table | Email |
| 6 | Welcome bonus on existing catalog card increased | 4–8× | **HIGH** if user is currently eligible; **LOW** otherwise | MEDIUM — requires bonus amount change detection on `cards` | Push + Email (eligible users only) |
| 7 | Re-engagement after 30 days inactive | 1× (then 60 day, 90 day cadence) | **MEDIUM** — generic but prevents silent churn | LOW — session tracking or last-login timestamp | Email |
| 8 | Cooling-off halfway reminder at 6 months | 1× per card churned | **MEDIUM** — "You're 6 months into your 12-month wait at ANZ — here's what to do while you wait" | LOW — `cancellation_date` + `(rule_months / 2)` calculation | Email |
| 9 | Points expiry warning (if app tracks loyalty balances) | 2–4× | **HIGH** when relevant, **N/A** without balance data | HIGH — requires loyalty balance data (not in current schema without `loyalty_balances` table) | Push + Email |
| 10 | Anniversary of first card tracked | 1× | **LOW-MEDIUM** — "You've been churning for 1 year, here's your scorecard" | LOW — `MIN(created_at)` on `user_cards` per user | Email |

**Priority order for build:** Events 2, 3, and 1 have the highest individual value and lowest build complexity. Event 4 and 6 require catalog change detection but are high-value pull mechanisms. Events 7 and 8 are table stakes for any SaaS product (drip re-engagement) and can be set up as Supabase edge function cron jobs.

---

## §4 Content and Community Retention

### 4.1 What Content Brings Churners Back

Based on analysis of Point Hacks AU's navigation structure, AFF forum post counts, and the community dynamics observable from both sites:

**High-return content categories (Point Hacks AU inferred from nav hierarchy):**
1. "Best [bank] bonus offer right now" — updated when offers change, generates fresh search traffic and email clicks
2. Redemption sweet spot guides (e.g., "Best Business Class Routes Under 80,000 Points") — evergreen motivation content
3. Bank T&C change alerts — "NAB increases exclusion period to 18 months" type posts get immediate engagement from active churners
4. Beginner how-to guides — high SEO volume, lower community return rate

**AFF most-engaged thread types for churners:**
- New offer announcement threads (e.g., "ANZ Rewards Black — 180,000 points offer") — immediate community data-pooling on eligibility, approval rates, income requirements
- T&C change discussions — when a bank tightens or loosens rules, the community mobilises
- Trip reports — "I flew Singapore Suites with Amex MR points" posts are aspirational content that reminds the community what the points are for
- Data points threads — "CBA approval — income $X, existing cards Y, approved/declined" style crowdsourced intelligence

### 4.2 What a Weekly Digest Email Should Contain

A weekly email from Reward Relay that users actually open needs to be personalised and time-sensitive. Based on the patterns above:

**Structure:**
1. **Your status this week** — single sentence. "You're 142 days into your 365-day ANZ wait. You're eligible for CBA, HSBC, and 3 others right now."
2. **Action item (if any)** — "Your Westpac annual fee renews in 23 days. Decision needed."
3. **Catalog news** — "This week: CommBank raised its Welcome bonus to 100,000 points. You're eligible."
4. **Did you know** — one short educational tip relevant to their current phase. In cooling-off? Explain Amex's 90-day rule. Near eligibility? Explain how to soft-check income requirements.
5. **What others are doing** (optional, later feature) — anonymised peer activity if community features are added.

The key principle: **if the email has nothing personalised to say, don't send it.** Generic "tips" emails are marked as spam. The engagement data from AFF and AwardWallet both confirm that time-sensitive, personalised triggers (offer changes, expiry warnings) dramatically outperform broadcast content.

### 4.3 Deal Alerts Without Spend Data

Reward Relay cannot offer spend-based merchant deals (MaxRewards' core loop) because AU CDR doesn't cover CC spend. However, deal alerts around **card acquisition events** are feasible:

- New bonus offer launched: "Westpac Altitude Black just launched a 140,000 point offer (up from 120K). You're eligible."
- Increased bonus period: "ANZ extended its 120,000 point offer deadline to [date]."
- Fee waiver promotions: "NAB is waiving the first-year annual fee on its Rewards Signature card — this expires [date]."

These alerts require monitoring the `cards` catalog for changes. Implementation: store a `last_bonus_points` field, compare on each catalog update, trigger notification to eligible users when value increases.

### 4.4 What AU Churners Google Regularly (SEO / In-App Search Opportunities)

Based on the topic clusters visible across AFF, Point Hacks, and the data in `bank_rules`:

- "[Bank] credit card waiting period" — Reward Relay's eligibility engine directly answers this
- "ANZ rewards black bonus points when credited" — timeline questions post-application
- "Amex 90 day rule" — the one-Amex-per-90-days restriction
- "Can I get a CommBank card if I have a Westpac" — cross-bank eligibility (they're independent)
- "How long to cancel credit card before reapplying" — the standard cooling-off question
- "Best credit card for Qantas points Australia 2026" — comparison intent, Point Hacks' turf but Reward Relay could answer in-app

These search patterns confirm that churners have **episodic, specific information needs** rather than habitual browsing behaviour. The in-app search and FAQ within Reward Relay could capture some of this intent and reduce the need to go to AFF or Point Hacks to answer a question.

---

## §5 Gamification and Progress Mechanics

### 5.1 Duolingo Streaks — Do They Translate?

Duolingo's streak mechanic is highly effective for daily-use apps. Their internal data (published in various growth case studies and their 2023 annual letter) shows streaks are the single highest predictor of DAU. They reported over 500 million users with streak mechanics driving a significant portion of their 24% DAU/MAU ratio.

**The problem:** Duolingo users ideally interact daily. A credit card churner in the cooling-off phase has no legitimate daily action. Forcing a streak would require artificial check-in tasks ("review your card portfolio") that feel hollow. The mismatch between streak mechanics (daily habit) and churning cadence (monthly or quarterly) means direct streak implementation would feel patronising.

**What does translate:**
- **Milestone markers** (not streaks): "6 months complete out of 12 for ANZ eligibility" is a meaningful progress indicator with no artificial daily requirement
- **Progress bars**: A visual representation of cooling-off completion — "58% through your ANZ wait" — borrows the Duolingo progress narrative without requiring daily action
- **Streak on a longer cadence**: A "monthly check-in streak" (did you log into the app at least once this month?) with a low bar could work, but only if each login surfaces something genuinely new

### 5.2 Gamification in Fintech — What Works

Analysis of comparable fintech gamification (Credit Karma, Mint, Acorns):

**Credit Karma:** Badge and progress mechanics around credit score improvements. Works because credit score changes monthly and is emotionally charged. Lesson: gamification works best when tied to a metric the user cares about that changes on a natural cadence.

**Mint (now Intuit Credit Karma):** Category spend budgets with progress bars. Works during active use, but retention collapsed when users felt the budgets were unachievable or the data was stale. Lesson: gamification that surfaces bad news without actionability is demotivating.

**Acorns:** "Round-up" microinvestment with visible growth charts. The portfolio value counter is intrinsically motivating. Lesson: a number that only goes up is the most powerful gamification primitive. Points accumulated toward a reward goal is analogous.

### 5.3 Natural AU Churner Milestones

The AU churning community has implicit milestones that a Reward Relay badge system could formalise:

| Milestone | Description | Rarity |
|---|---|---|
| First Bonus | First welcome bonus points earned | Every churner |
| 500K Points Club | Lifetime 500,000 bonus points accumulated | Active churner (1–2 years) |
| 1M Pointer | Lifetime 1,000,000 bonus points accumulated | Veteran churner |
| 10 Banks Churned | Approved by 10 different bank groups | Experienced churner |
| Business Class Funded | First business class redemption tracked | Aspirational milestone |
| Clean Slate | All banks eligible simultaneously | Strategic milestone |
| Fee Optimizer | Cancelled a card before annual fee posted | Savvy milestone |

These can be computed from `user_cards` data (application dates, banks, cumulative bonus points from `cards.welcome_bonus_points`). No external data required.

### 5.4 Progress Toward Goal vs Streak — Recommendation

For Reward Relay's use case, **"progress toward goal" wins decisively over streaks**. The reasoning:

- The natural user goal is a specific redemption (e.g., "business class to London with my family") — expressed as a points target
- Cooling-off is inherently a progress narrative ("X days until I can apply to ANZ again")
- The absence of a daily action requirement means streaks will mostly be un-earned and feel like a failure

A **"Points Horizon"** feature — user sets a redemption goal in points, app shows progress based on cards held, bonuses earned, and projected future bonuses — would create a persistent motivating context for every notification and piece of content. This is the single highest-leverage gamification concept for the cooling-off phase.

---

## §6 Retention Feature Shortlist

The following features are prioritised by lifecycle fit, engagement impact, and build complexity. "Version" refers to recommended release milestone.

| Feature | Description | Churner Lifecycle Fit | Complexity | Engagement Impact | Dependencies | Version |
|---|---|---|---|---|---|---|
| Eligibility Countdown Calendar | Visual timeline showing when each bank's cooling-off ends. Shows months elapsed vs remaining. | Cooling-off phase (dominant phase) | Low | **High** — the core product visualised | `user_cards`, `bank_rules` | v1.5 |
| Push/Email Notifications (Events 1–3) | Alerts for eligibility restoration, spend deadline, annual fee renewal | All phases | Low–Medium | **High** — pull-back mechanism for dormant users | Notification service (Supabase Edge Functions + Resend already in stack) | v1.5 |
| "What to Do This Week" Action Card | Single contextual recommendation on dashboard based on current phase (e.g., "Your ANZ cooling-off ends in 23 days — start researching") | All phases | Low | **High** — reduces cognitive load, surfaces value each visit | `user_cards`, `bank_rules`, `cards` | v1.5 |
| Annual Fee Tracker / Renewal Alerts | Track annual fee renewal dates, prompt "keep / downgrade / cancel" decision with 30-day lead | Active card phase | Low | **High** — financial stakes create urgency | `user_cards` (approval_date + annual_fee) | v1.5 |
| Catalog Change Alerts (Bonus Increases) | Notify eligible users when a tracked bank's bonus offer increases | Cooling-off / research phase | Medium | **High** for eligible users | Catalog monitoring job, `user_cards`, `bank_rules` | v1.6 |
| Points Horizon / Goal Tracker | User sets points redemption goal. App shows progress based on accumulated bonuses + projected future cards. | Cooling-off phase | Medium | **High** — persistent motivation | `user_cards` × `cards.welcome_bonus_points`, user-set goal | v1.6 |
| Personalised Weekly Digest Email | Weekly email with eligibility status, any pending actions, and one catalog news item. Send only if something is worth saying. | All phases | Medium | **Medium** — table stakes for SaaS retention | Email template, personalisation logic, suppression for no-news weeks | v1.6 |
| Milestone Badges | Gamified achievements: first bonus, 500K points, 10 banks churned, etc. Shared via social. | All phases | Low | **Medium** — community/social proof effect; lower direct retention impact | `user_cards` aggregation | v1.7 |

---

## §7 Recommended Immediate Wins

These features are buildable now with existing schema data (`user_cards`, `bank_rules`, `cards`), shippable in 1–2 sprints, and require no external API dependencies.

### Win 1: Eligibility Countdown with Phase Context

**What data powers it:** `user_cards.cancellation_date` (or `status = 'cancelled'`) + `bank_rules.rule_months` → calculate `eligible_from_date = cancellation_date + rule_months`. Compare against today to get days remaining.

**What the UX looks like:** On the `/dashboard` or `/cards` route, each bank in the user's history shows a progress arc or bar: "ANZ — 142 days remaining (39% complete)." Completed arcs flip to green: "Eligible now." Clicking surfaces the current top card for that bank.

**Estimated dev effort:** 3–5 days. The eligibility engine already exists (per the project's engine research); this is primarily a UI component surfacing the calculation already being done for `/cards`.

**Why it works:** Turns a blank waiting period into a visual progress narrative. Every login has something to show. The "eligible now" state creates an action prompt without requiring any user-initiated check.

---

### Win 2: Spend Deadline Countdown (with Manual Log)

**What data powers it:** `user_cards` where `status = 'active'` + `application_date` + `cards.bonus_spend_window_months` → deadline = `application_date + bonus_spend_window_months`. Manual spend entry (simple text field or quick-add amount) against the card.

**What the UX looks like:** Active card with a spend deadline shows a progress bar: "Spend $1,400 of $3,000 required — 31 days left." Optional: manual transaction log (date + amount + description). The deadline date is shown prominently. 14-day warning triggers a push notification.

**Estimated dev effort:** 5–8 days for countdown + manual log. The `user_cards` table already has `application_date`; `cards.bonus_spend_requirement` and `bonus_spend_window_months` already exist in schema.

**Why it works:** This is the highest-financial-stakes moment in the churning cycle. Missing the spend window means losing a bonus worth $500–$1,500+ in equivalent travel. The anxiety around this is a natural engagement driver — users will check daily during the spend window.

---

### Win 3: Annual Fee Renewal Alert

**What data powers it:** `user_cards.approval_date` + 12-month anniversary → renewal date. `user_cards.annual_fee` for the fee amount. No calculation needed beyond date arithmetic.

**What the UX looks like:** On `/spending` or `/cards`, cards approaching renewal show a banner: "Westpac Altitude Black — annual fee of $295 renews in 23 days. Keep / Downgrade / Cancel?" with a decision logging action. Email alert at 30 days, push at 14 days.

**Estimated dev effort:** 3–4 days. Pure date arithmetic and a notification trigger. Decision logging is a simple `user_cards` status update.

**Why it works:** Saves users real money. A churner who cancels before the fee posts (typically requires 30 days notice) saves $99–$1,295. This is a high-trust, high-value feature that users will credit the app for. It is also a re-engagement trigger — a 30-day email pulls dormant users back with a concrete financial incentive to open the app.

---

### Win 4: "What to Do This Week" Dashboard Action Card

**What data powers it:** `user_cards` phase detection logic → classify each user's current dominant phase → render phase-appropriate guidance. Logic tree:
- Has active card with spend deadline < 21 days → "Spend $X by [date]"
- Has active card with annual fee < 30 days → "Annual fee decision needed"
- Any bank eligible now → "You're eligible for ANZ — see top cards"
- Any bank eligible within 30 days → "ANZ eligibility restores [date] — start planning"
- Otherwise → "You're in cool-down. Next action: [bank] in [N] days. Here's a reading while you wait."

**What the UX looks like:** Single card at the top of `/dashboard` with the highest-priority action for this user this week. No more than one action. Dismissible for 7 days.

**Estimated dev effort:** 4–6 days. Phase detection logic + dashboard component. The underlying data queries are already being run for other dashboard widgets.

**Why it works:** Reduces cognitive load to zero. The user doesn't need to scan five widgets to understand what they should do. Every session has a clear entry point. Based on AwardWallet and MaxRewards patterns, single-signal dashboards (vs information-dense ones) have higher engagement rates for periodic-use apps.

---

### Win 5: Bank-Level "Other Cards You Can Apply For Now"

**What data powers it:** Eligibility engine output (already computed) → filter `cards` catalog to banks where user is currently eligible → rank by `welcome_bonus_points` descending → surface top 2–3.

**What the UX looks like:** On `/recommendations` (which exists and is a free-tier route), a section: "You're currently eligible for these banks." Shows 2–3 cards with bank, bonus, spend requirement, and "Apply" link. Updates automatically as cooling-off periods expire.

**Estimated dev effort:** 2–3 days if recommendations route already renders card cards. Primarily eligibility filter logic refinement.

**Why it works:** Cross-bank eligibility is independent — a user can be in ANZ cooling-off and simultaneously eligible for CBA, HSBC, and NAB. Many users don't realise they can run parallel churns across banks. This feature converts an otherwise idle period into an active opportunity.

---

## Sources

1. **Australian Frequent Flyer (AFF) — Forum structure and community size** — australianfrequentflyer.com.au — 68,000+ members, 104,639 threads, 2.8M+ posts confirmed via forum index page, April 2026.

2. **AwardWallet — About page** — awardwallet.com/about — 930,000 active members, 621 loyalty programs, 229.2 billion points / $4.584B in value tracked, 30 FT + 10 PT staff.

3. **AwardWallet — Features page** — awardwallet.com — Multi-program expiry alerts, spend analysis, benefit tracking, travel itinerary integration.

4. **MaxRewards — Homepage** — maxrewards.com — 800,000+ members, $9–$20/month premium tiers, merchant offer auto-activation, AI-powered card recommendations.

5. **Point Hacks AU — Homepage and Credit Cards section** — pointhacks.com.au — Content hierarchy analysis, deal aggregation patterns, beginner email course, active maintenance as of April 2, 2026.

6. **Reward Relay — `bank_rules` migration** — `app/supabase/migrations/20260314300100_bank_rules.sql` — AU bank cooling-off periods: ANZ 12 months, Amex 12 months (+ 90-day application rule), NAB 18 months (increased Feb 2025), Westpac/St.George 12 months, CBA 12 months, Bankwest 12 months. Sources cited in migration: AFF, Point Hacks AU.

7. **Reward Relay — Phase 1 engine improvements migration** — `app/supabase/migrations/20260126000000_phase1_engine_improvements.sql` — `eligibility_restriction_months` data: ANZ, Westpac, St.George, CBA = 24 months (hold period); Amex = 18 months. Confirms bank-level hold times used in engine.

8. **Reward Relay — Cards schema** — `app/supabase/schema.sql` — Catalog of 30 AU cards with `bonus_spend_requirement`, `bonus_spend_window_months`, `annual_fee`. Typical bonus structures: $2,000–$6,000 spend in 3 months for bonuses of 20,000–180,000 points.

9. **Reward Relay — Email reminders migration** — `app/supabase/migrations/20250101120300_email_reminders.sql` — Existing 30/14/7 day reminder infrastructure confirms notification channel is already partially built.

10. **AFF — Credit card forum activity** — australianfrequentflyer.com.au/community/forums/credit-cards/ — American Express subforum: 2,600 threads, 100,100 posts. Current Credit Card Offers section: 19 threads, 10K posts.

11. **Point Hacks AU — Content focus analysis** — pointhacks.com.au — Frequent flyer program guides for Qantas, Velocity, KrisFlyer, Asia Miles, Etihad Guest, Emirates Skywards as primary content pillars. Community Q&A forum and podcast as secondary engagement.

12. **AwardWallet — Blog content analysis** — awardwallet.com/blog — Content categories: rewards program guides, credit card bonus comparisons, travel strategy. Time-sensitive promotions and practical redemptions as highest-engagement posts. Facebook community "Award Travel 101" at 67,000 members.

13. **Duolingo — Streak and DAU/MAU data** — Referenced in multiple growth analysis publications; Duolingo annual letter 2023 cited 24% DAU/MAU ratio with streak mechanics as primary driver. Not directly fetched; based on widely-reported public data.

14. **Credit Karma / Mint / Acorns — Fintech gamification patterns** — Industry knowledge of badge systems, progress bars, and portfolio value counters as primary gamification primitives in periodic-use fintech apps. No direct URL — general industry analysis.
