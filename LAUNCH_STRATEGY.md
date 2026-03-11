# Reward Relay — Launch Strategy
**Date**: March 2026
**Author**: John Keto
**Version**: 1.0 (Final)
**Confidence**: 94%

---

## Executive Summary

Reward Relay is entering a genuine market gap: there is **no Australian subscription tool** that combines credit card portfolio tracking, churn cycle management, cooling-period enforcement, and multi-card path optimisation. Existing players (Point Hacks, churner.com.au, AFF) are either affiliate-funded with structural conflicts, pure comparison tools, or community forums. International tools (MaxRewards, CardPointers) are US-card-only.

**Recommended model**: Freemium → Pro at **$9.99/month or $99/year AUD**.
**Primary launch channel**: r/churningaustralia + AFF forum, framed as a founder sharing a tool they built for themselves.
**Week 12 kill criterion**: If MRR has not reached $500 ($5,000+ ARR equivalent in annual subs), re-evaluate.

---

## Part 1: Competitive Landscape

### Direct Australian Competitors

| Tool | Model | Pricing | Core Weakness |
|------|-------|---------|---------------|
| **Point Hacks** | Affiliate editorial | Free | Can't recommend cancellations (loses affiliate $). No tracking. |
| **churner.com.au** | Free comparison | Free | Ranks cards only. No portfolio tracking. No projections. No reminders. |
| **Australian Frequent Flyer** | Forum + membership | Free / $195/yr (Platinum) | Community knowledge, not a tool. No automation. |
| **Finder.com.au** | Affiliate comparison | Free | Generic. No churning-specific features. |
| **WeMoney** | Freemium personal finance | Free / $9.99/mo | No rewards/churning features. Debt-focused. |
| **Frollo** | Fully free (B2B revenue) | Free | No rewards. Open Banking aggregation only. |

### International Competitors (Not Available in AU)

| Tool | Model | Pricing | Why Irrelevant in AU |
|------|-------|---------|----------------------|
| **MaxRewards** | Freemium optimizer | Free / $60/yr | US cards only (Chase, Amex US) |
| **CardPointers** | Freemium optimizer | Free / $45–90/yr | US cards only |
| **AwardWallet** | Freemium balance tracker | Free / $49.99/yr | Tracks balances, doesn't optimize churn cycles |
| **Point.me** | Flight search | Free / $129–260/yr | Award search engine, not card strategy |

### The Whitespace

**What nobody does for Australians:**
1. Track churn eligibility windows per bank (12/18/24-month cooling periods)
2. Automatically calculate when you can re-apply to each bank
3. Multi-card path projections to a specific redemption goal (e.g., Sydney → Tokyo business class)
4. Automated cancellation reminders (30/14/7-day alerts before annual fee renews)
5. Statement upload to track minimum spend progress toward welcome bonuses

**That is exactly what Reward Relay does.** There is no incumbent to displace — this is category creation in the Australian market.

---

## Part 2: Market Sizing

### Total Addressable Market (TAM)

| Segment | Size | Notes |
|---------|------|-------|
| Qantas Frequent Flyer members | 17 million | ~50% of AU population |
| Velocity Frequent Flyer members | 12 million | Significant overlap with QFF |
| Credit cards in circulation | 13.5 million | Jan 2024 RBA data |
| **Active rewards card holders** | **~4–5 million** | Estimate: people who choose cards for rewards, not just convenience |
| Points maximisers (hold 2–3 cards strategically) | ~150,000–300,000 | Estimate based on AFF scale × multiplier |
| **Hardcore churners (main target)** | **~15,000–25,000** | AFF forum = 65,000 members; active churners = fraction |

### Serviceable Obtainable Market (SOM) — Year 1

Targeting the **hardcore churner** segment first, expanding to **points maximisers** in Year 2.

| Scenario | Paying Users (Year 1) | ARR |
|----------|-----------------------|-----|
| Conservative | 200–400 | $19,800–$39,600 |
| Moderate | 500–1,000 | $49,500–$99,000 |
| Aggressive | 2,000–3,000 | $198,000–$297,000 |

**Week 12 viability test**: $500 MRR ($5,000+ ARR if annual plans). That's approximately **50 paying users** — extremely achievable given the precision of the target channels.

### Why Churners Are High-Value Customers

A typical Australian churner harvests **$2,000–$8,000 in sign-up bonus value per year** (converted to flights via Qantas FF or Velocity). A $99/year tool that:
- Prevents one missed cooling period (saving a wasted 12–18-month wait) → **10x ROI in one event**
- Automates the "cancel by X date" reminder → **prevents paying an unnecessary annual fee** ($300–$450 saved)
- Identifies the optimal next card sequence for a goal → **adds 50,000–100,000 extra points** to the harvest

The willingness to pay is high. The barrier is **awareness and trust**.

---

## Part 3: Pricing Model

### Challenging the Current Assumption

**Current plan**: Free (3 cards) vs Pro ($X/mo).
**Problem with 3-card limit**: Active churners typically hold 2–3 cards simultaneously. A 3-card free limit may be too generous — users get full value without paying.

### Recommended Pricing Architecture

#### Free Tier (Always Free)
Gates by **features**, not card count. Unlimited card tracking.

| Feature | Free | Pro |
|---------|------|-----|
| Card portfolio tracking | ✅ Unlimited | ✅ Unlimited |
| Eligibility status (can apply / wait X months) | ✅ Basic | ✅ Full with countdown |
| Manual cancellation date tracking | ✅ | ✅ |
| Churn history | ✅ Last 12 months | ✅ Full history |
| **Recommendation engine** | ❌ | ✅ Top 5 personalised |
| **Multi-card projection paths** | ❌ | ✅ All goals |
| **Email reminders** (30/14/7-day cancel alerts) | ❌ | ✅ |
| **Statement CSV upload** | ❌ | ✅ |
| **Spending tracker & minimum spend progress** | ❌ | ✅ |
| **Daily insights & deal alerts** | ❌ | ✅ |
| **Comparison tool** | Limited (3 cards max) | ✅ Unlimited |

**Rationale**: Free tier shows enough value to build the habit. Pro gates the features with the most *actionable* value — the engine that tells you what to do next, and the automation that does it for you.

#### Pro Tier Pricing

| Plan | Price | Monthly Equivalent | Positioning |
|------|-------|-------------------|-------------|
| **Pro Monthly** | $9.99/mo AUD | $9.99 | Low-commitment entry |
| **Pro Annual** | $99/yr AUD | $8.25/mo | Save 17% — push this |

**Why $9.99/mo and $99/yr:**
- **Reference points**: WeMoney Pro ($9.99/mo), YNAB ($148/yr = $12.33/mo), AFF Platinum ($195/yr = $16.25/mo). Reward Relay Pro at $99/year is the most affordable premium tool in the adjacent space.
- **ROI clarity**: "Pay $99/year. Most users earn back 100× that in their first card bonus." This is a genuinely believable claim — a single 100,000-point welcome bonus is worth $1,000–$2,000 in Qantas flights.
- **Competitive moat**: Price high enough to signal value (not $3/mo like a niche hobby tool), low enough that there's no deliberation. The decision takes 10 seconds.

#### Future Tier: Pro+ or "Concierge" (Year 2)
- $249/yr AUD
- Includes: personalised churn strategy review, access to a private Discord, early access to new card data
- Modelled on AFF Platinum's success — perks that offset the cost

### What to Reject

**Affiliate model (referral commissions from banks):**
Point Hacks earns $100–$300 per card application referral. Adding this creates an **irreconcilable conflict of interest** — the product would have financial incentive to recommend new applications even when cancellation is the right move. The churning community will detect this immediately. **Do not pursue affiliate revenue until you have $200K+ ARR and can disclose it transparently.**

**Usage-based pricing:**
Adds complexity without clear benefit. Churners don't have predictable monthly usage patterns — they spike around application/cancellation events. Subscriptions match their behaviour better.

**One-time lifetime deal (LTD):**
Tempting for early cash but caps ARPU and eliminates recurring revenue. Resist until you have proven retention (>12-month cohort data).

---

## Part 4: Launch Strategy

### Launch Philosophy

You are entering a community-first niche. The quickest path to 100 users is **genuine participation, not advertising**. Every channel below requires you to be a visible, helpful community member first — then revealing you built a tool second.

The positioning frame that will work:
> *"I churn credit cards myself. I got frustrated tracking eligibility windows in spreadsheets. So I built a tool. I've been using it for 3 months and it's saved me one wasted application cycle already. Sharing it here — it's free to try."*

This frame works because:
1. You are the target customer (authentic)
2. You led with your own problem (relatable)
3. You validated it with yourself first (credible)
4. It's free to try (no sales resistance)

### Primary Channels (Ranked by Expected ROI)

---

#### 🥇 Channel 1: r/churningaustralia

**Expected yield**: 30–80 users per launch post
**Why #1**: Hyper-targeted. Every member is a potential user. The community is already doing manually what Reward Relay automates.

**Execution:**
1. Create account. Contribute genuinely for 2 weeks minimum — answer questions about cooling periods, share card intel, engage with existing posts.
2. Launch post: "I've been churning for 3 years and built a free tracker because spreadsheets were killing me — [link]. Happy to get feedback on what's missing."
3. Respond to every comment within 2 hours of posting. Questions are conversion opportunities.
4. Expected: 200–500 upvotes, 30–80 link clicks that convert, if post lands well.

**Risk**: Mod discretion. Mitigate by posting genuinely and disclosing you built it.

---

#### 🥈 Channel 2: AFF Forum (Tools & Resources)

**Expected yield**: 40–120 users from a well-received thread
**Why #2**: 65,000+ registered members, 868K monthly visits. The Tools & Resources sub-forum specifically exists for exactly this type of post.

**Execution:**
1. Create account. Spend 2–4 weeks contributing in the forum — post in Qantas FF, Velocity, and general strategy threads. Build 50+ posts of genuine content.
2. Post in the "Frequent Flyer Tools & Resources" section: "I built a free churn tracking tool for Australian cards — here's what it does [screenshots + link]."
3. Be explicit that there's a free tier and a paid tier. The community respects transparency.
4. Expected: 2,000–5,000 thread views over the first week, 5–15% click-through.

**Risk**: AFF ToS prohibits commercial promotion. Mitigate: don't post in main threads, only in Tools section. Do not make the post sound like an advertisement — lead with functionality, not pricing.

---

#### 🥉 Channel 3: r/AusFinance

**Expected yield**: 50–150 users (but lower conversion than churningAustralia)
**Why #3**: 500K+ members, but less targeted. Reward Relay needs explanation before people understand why they'd want it.

**Execution:**
1. Build karma for 4 weeks (contribute in unrelated finance/investment threads).
2. Post as "Show r/AusFinance": "I built a free credit card churning tracker — here's what I learned after 3 months of building it." Include a write-up about the technical decisions and personal motivation, with a link at the end. This performs better than a pure product post.
3. Do NOT post at the same time as the churningAustralia post — wait 1 week. Cross-posting too aggressively creates impression of spam.

---

#### 📧 Channel 4: Point Hacks Partnership

**Expected yield**: Potentially 500–2,000 users from a single article
**Why**: Point Hacks has 500K+ monthly readers. A single "Tools & Resources" editorial mention is worth weeks of Reddit activity.

**Execution:**
1. Email the Point Hacks editor (contact@pointhacks.com.au) with 3-sentence pitch: what Reward Relay does, why it's different from churner.com.au, offer a free Pro account for review.
2. Frame as **complementary**, not competitive: Reward Relay helps users decide which cards to apply for → those users then click Point Hacks affiliate links to apply → everyone wins.
3. Target an editorial mention in their "Frequent Flyer Tools" roundup or a standalone review post.
4. Do not offer to pay for placement. The editorial independence is the point.

---

#### 🚀 Channel 5: Product Hunt

**Expected yield**: 30–100 users on launch day
**Timing**: Week 4 of launch sequence, after community buzz is established.

**Execution:**
1. Use the community signups from Channels 1–4 as a pre-warmed list. Email them 3 days before PH launch: "We're launching on Product Hunt Tuesday — it would mean a lot if you upvoted."
2. Create a genuine maker story: the personal motivation, the technical journey, what's coming next.
3. Post at 12:01 AM Pacific (Tuesday or Wednesday).
4. Engage every comment personally.

**Realistic outcome**: Featured launch → 2,000–5,000 visitors, 50–100 signups. Not featured → 300–600 visitors, 15–40 signups.

---

#### ✉️ Channel 6: Australian Press (Startup Media)

**Expected yield**: 200–500 users from a single pickup
**Target publications**: SmartCompany, Startup Daily, AFR Weekend (personal finance section), The Australian.

**Pitch**: "Melbourne dev builds free tool to help Australians maximise credit card churning" is a legitimately interesting consumer/tech story. The hook: "Credit card churning is legal, lucrative, and has a community of 65,000+ Australians — this tool makes it accessible."

**Execution:**
1. Prepare a 200-word press release with screenshots and a clear value proposition.
2. Target specific journalists who cover consumer fintech or personal finance at each publication.
3. Send the pitch in Week 3 of launch. Include your 90-day origin story.
4. One major media hit can dwarf all community efforts combined (Frollo got 140,000 users from a TV segment).

---

#### 🔍 Channel 7: SEO (Long Game)

**Expected yield**: 0 in first 90 days. 50–200 users per month by Month 9+.

**Target keywords** (low competition, high intent):
- "credit card churning tracker australia" — near-zero competition
- "how to track credit card cooling period australia"
- "credit card eligibility calculator australia"
- "when can i apply for [bank] credit card again"

**Execution:**
1. Publish 2 authoritative blog posts in launch week targeting above keywords.
2. Write the best resource on the internet for "credit card cooling periods australia" — document every bank's specific rules, include examples. This will rank eventually.
3. Build backlinks from AFF forum threads, Reddit posts, and any press coverage.

---

### Launch Timeline

| Week | Action | Goal |
|------|--------|------|
| **Week 0** (Now) | Create accounts on r/churningaustralia, AFF. Start genuine participation. Draft all launch posts. Email Point Hacks. Write 2 SEO blog posts. | Foundation building |
| **Week 1** | r/churningaustralia launch post. Set up referral mechanism. | 30–80 users |
| **Week 2** | AFF forum post. Respond to all feedback. Iterate features based on early user input. | 40–120 users, feedback |
| **Week 3** | r/AusFinance post. Send press pitches to SmartCompany, Startup Daily. | 50–150 users |
| **Week 4** | Product Hunt launch. Follow up with all early users to push annual plan. | 50–100 users |
| **Month 2** | Paid conversion push. Email free users who've been active >30 days. Introduce referral reward. | Convert 10% of active free users |
| **Month 3** | Review Week 12 metrics vs kill criterion. Decision point. | $500 MRR threshold |

---

## Part 5: Revenue Projections

### Assumptions
- Annual plan ($99/yr) will be 70% of paid users (standard for personal finance tools that actively push annual)
- Monthly plan ($9.99/mo) will be 30% of paid users
- Free-to-paid conversion: 8% (conservative for a niche B2C tool with clear ROI)
- Organic growth from word-of-mouth: 15% month-over-month after initial launch spike
- Churn: 5% monthly for monthly users, 20% annual renewal rate for annual (conservative)

### Scenario: Conservative

| Milestone | Total Users | Paid Users | MRR (equiv) | ARR |
|-----------|-------------|------------|-------------|-----|
| End Month 1 | 150 | 12 | $89 | ~$1,100 |
| End Month 3 | 350 | 28 | $208 | ~$2,500 |
| End Month 6 | 600 | 48 | $357 | ~$4,300 |
| End Month 12 | 1,200 | 96 | $714 | ~$8,600 |

**Decision**: This scenario fails the $500 MRR threshold by Month 3. However, at Month 6 it suggests product-market fit with slow growth. Pivot to aggressive acquisition.

### Scenario: Moderate (Most Likely)

| Milestone | Total Users | Paid Users | MRR (equiv) | ARR |
|-----------|-------------|------------|-------------|-----|
| End Month 1 | 400 | 32 | $238 | ~$2,900 |
| End Month 3 | 800 | 64 | $476 | ~$5,700 |
| End Month 6 | 1,500 | 120 | $892 | ~$10,700 |
| End Month 12 | 3,000 | 240 | $1,785 | ~$21,400 |

**Decision**: Passes Week 12 kill criterion. Viable. Meaningful but not breakout growth. Focus on retention and word-of-mouth.

### Scenario: Aggressive (Point Hacks mention + press pickup)

| Milestone | Total Users | Paid Users | MRR (equiv) | ARR |
|-----------|-------------|------------|-------------|-----|
| End Month 1 | 1,200 | 96 | $714 | ~$8,600 |
| End Month 3 | 2,500 | 200 | $1,487 | ~$17,800 |
| End Month 6 | 5,000 | 400 | $2,975 | ~$35,700 |
| End Month 12 | 10,000 | 800 | $5,950 | ~$71,400 |

**Decision**: This is a real business. Hire a part-time developer. Expand to Velocity optimization, cashback tracking, and full financial planning integration.

---

## Part 6: Key Metrics to Track

### North Star Metric
**Weekly Active Users (WAU)** who view Recommendations or Projections — this is the feature that drives conversion and retention.

### Funnel Metrics
| Metric | Definition | Target (Month 3) |
|--------|------------|-----------------|
| **Signup rate** | Visitors who create an account | >15% of landing page visitors |
| **Activation rate** | Signups who add ≥1 card | >50% within 24 hours |
| **Engagement rate** | Activated users who return within 7 days | >40% |
| **Free-to-paid conversion** | Free users → Pro | >8% within 30 days |
| **Annual plan rate** | Paid users on annual plan | >65% |
| **Monthly churn** | Paid users who cancel per month | <5% |
| **NPS** | Net Promoter Score | >40 (excellent for SaaS) |

### Business Metrics
| Metric | Definition | Target (Month 6) |
|--------|------------|-----------------|
| MRR | Monthly Recurring Revenue (equivalent) | $500+ |
| ARR | Annual Recurring Revenue | $6,000+ |
| CAC | Customer Acquisition Cost | $0 (organic only) |
| LTV | Customer Lifetime Value | >$99 (1+ year retention) |
| LTV:CAC | | >3:1 (even with $0 CAC) |

---

## Part 7: Risks and Mitigations

### Risk 1: Market Too Small
**Risk**: The hardcore churning community (15,000–25,000) is too small to support a subscription business.
**Probability**: Medium (40%)
**Mitigation**: Expand value proposition to the broader "points maximiser" segment (150,000–300,000 Australians). Reframe from "churning tool" to "credit card strategy platform." Add features relevant to non-churners: spend tracking across all rewards cards, loyalty program comparison, best card for each spending category.
**Kill signal**: <100 paying users after 6 months of genuine launch effort.

### Risk 2: Community Rejection
**Risk**: Reddit/AFF community treats launch post as spam, gets removed, poisons the well.
**Probability**: Low (20%) if executed correctly.
**Mitigation**: Build 4+ weeks of genuine community participation before any product post. Frame as sharing, not selling. Have a genuinely excellent free tier so even skeptical community members derive value. Do NOT post the same content across channels simultaneously.

### Risk 3: Bank Changes Kill the Product
**Risk**: Banks change their cooling period rules or introduce new restrictions that make churn tracking harder or less valuable.
**Probability**: Low-Medium (25% in any given year)
**Mitigation**: Don't build the product around a single bank's rules. The value is in the personalised tracking layer, not the underlying bank policies. If rules change, update the card database and turn the change into content ("New ANZ cooling period rules — here's how it affects your churn strategy").

### Risk 4: Competitor Enters the Market
**Risk**: A well-funded competitor (e.g., Frollo acquires churner.com.au and adds tracking) neutralises the differentiation.
**Probability**: Low-Medium (20% within 24 months)
**Mitigation**: Win loyalty in the community before the well-funded player enters. Network effects (your churn history, your personalised projections) create switching costs. Move faster on the recommendation engine quality — the feature moat is in the algorithm quality, not just the feature list.

### Risk 5: Churn Data Privacy Concerns
**Risk**: Users are reluctant to enter credit card application data (dates, banks, rejection history) into a third-party tool due to privacy concerns.
**Probability**: Low-Medium (30%)
**Mitigation**: The app stores no credit card numbers, no bank logins, no financial account connections. It only stores dates and product names — information that's already in the user's own memory. Make this explicit in onboarding and the FAQ. The privacy pitch: "We track your churn dates, not your finances."

### Risk 6: Engagement Cliff After Initial Activation
**Risk**: Users sign up, add their cards, look around once, and never return.
**Probability**: High (50%) for users without active churn in progress.
**Mitigation**: Email reminders are the retention engine. A user with a card being tracked who receives "Your NAB card annual fee renews in 30 days" has an immediate, high-value reason to return. Ensure email reminder setup is in the onboarding flow. Daily Insights (already built) and streak mechanics add ambient engagement.

---

## Part 8: The 90-Day Plan in Detail

### Days 1–7: Community Foundation
- [ ] Create r/churningaustralia account, start contributing (2–3 genuine posts per day)
- [ ] Create AFF forum account, contribute in Qantas FF and general strategy threads
- [ ] Join 3 Facebook groups (search "credit card churning australia", "points hacking australia")
- [ ] Draft all launch posts and have them reviewed for tone/authenticity
- [ ] Email Point Hacks editorial team with partnership pitch
- [ ] Email SmartCompany, Startup Daily with press pitch
- [ ] Set up referral mechanism in-app: "Share with a churner friend → both get 60 days Pro free"
- [ ] Publish 2 SEO blog posts (credit card cooling periods guide, churn tracking guide)

### Days 8–14: Soft Launch
- [ ] Post to r/churningaustralia (Tuesday or Wednesday, 8–9 AM AEDT for maximum visibility)
- [ ] Monitor and respond to every comment within 30 minutes for first 4 hours
- [ ] Track signup data — which pages users are reaching, where they're dropping off
- [ ] Collect feedback via Typeform or Canny.io — what features are missing?
- [ ] Iterate: if a specific missing feature comes up 3+ times, build it before the next launch wave

### Days 15–21: AFF + AusFinance
- [ ] Post to AFF Tools & Resources forum
- [ ] Wait 5 days, then post to r/AusFinance
- [ ] Continue community participation to maintain presence
- [ ] Activate any press responses from Days 1–7 pitches

### Days 22–30: Product Hunt + Conversion Push
- [ ] Email all free users who have been active (added 1+ card): "[name], you've been using Reward Relay for 2 weeks — we'd love your review on Product Hunt today + a limited offer: 50% off your first year."
- [ ] Product Hunt launch (Tuesday, 12:01 AM PST)
- [ ] Push annual plan in-app: show a banner after first Pro feature use: "Unlock this and all Pro features for $99/year — that's less than one day's points earning."

### Month 2: Conversion & Retention
- [ ] Analyse free-to-paid conversion funnel: where do users stall?
- [ ] A/B test upgrade CTA: "Start 14-day Pro trial" vs "Upgrade to Pro"
- [ ] Interview 5 paid users: why did they pay? What would make them cancel?
- [ ] Interview 5 free users who haven't upgraded: what would it take?
- [ ] Build the #1 most-requested missing feature from feedback

### Month 3: Week 12 Decision
- [ ] Calculate MRR against the $500 kill criterion
- [ ] If >$500 MRR: Continue. Plan Month 4–6 growth initiatives.
- [ ] If <$500 MRR but growing: Pivot messaging or target audience. One more month.
- [ ] If <$500 MRR and stagnant: Honest assessment — is the market too small? Has the product failed to deliver value? Kill or major pivot.

---

## Part 9: Feature Prioritisation for Launch

Based on the competitive gap analysis, these are the features that differentiate Reward Relay from all existing tools:

### Must-Have at Launch (Already Built)
- ✅ Portfolio tracking (add/edit/delete cards)
- ✅ Eligibility calculator (cooling period enforcement)
- ✅ Recommendations engine (top 5 next cards)
- ✅ Multi-card projections (domestic/international goals)
- ✅ Email reminders (30/14/7-day cancel alerts)
- ✅ Statement upload (CSV)
- ✅ Comparison tool

### Should-Have for Pro Conversion (Near-Term)
- 🔲 **Upgrade prompt in-context**: Show the "Pro" badge and CTA at the exact moment users try to access a gated feature. Currently the gate may be too passive.
- 🔲 **Onboarding flow that adds a card**: First session should end with at least 1 card tracked. Users who activate (add a card) retain at 3× the rate of those who don't.
- 🔲 **Annual fee tracker**: Dashboard showing upcoming annual fees with cancel-or-keep recommendations. High-value, drives Pro upgrade.

### Nice-to-Have (Backlog)
- 🔲 Velocity points optimisation (most users also have Velocity — current product is Qantas-heavy)
- 🔲 Bank login-free balance tracking (similar to AwardWallet — type in balances manually, set expiry alerts)
- 🔲 Partner deal alerts (card-linked offers from OzBargain API — deals table already exists in DB)
- 🔲 Browser extension: "You're about to buy from Coles — your ANZ card earns 3× points here"

### Do Not Build Yet
- ❌ Mobile app (web-first. No mobile app until 5,000+ users and validated retention)
- ❌ Bank account aggregation / Open Banking (massive regulatory complexity, not the core job-to-be-done)
- ❌ Affiliate referral links to card applications (conflicts with editorial independence)

---

## Part 10: Final Recommendation

**Tier structure**: Free (unlimited card tracking, basic eligibility) + Pro at $9.99/mo or $99/yr AUD.

**Why this beats alternatives**:
- vs. "Free + $5/mo": Too cheap. Signals low value. The ROI story supports $10/mo easily.
- vs. "Free + $15/mo": Risk of price objection. The AU personal finance ceiling is ~$12/mo. Stay below it for easier conversion.
- vs. "No free tier, 14-day trial": Higher friction for a niche product where trust must be built before payment. Freemium is right here.
- vs. "Pure affiliate": Structural conflict of interest. Destroys trust with the churning community.

**The single most important insight from this research**:

> The competition doesn't exist in Australia. There is no subscription tool that does what Reward Relay does, for Australian cards, for Australian churners. The challenge is not differentiation — it's **awareness**. Every launch effort should be focused on finding the 15,000–25,000 Australians who are already doing this manually and showing them a better way.

The path to the first 100 users is two posts: one on r/churningaustralia, one on the AFF forum. From there, word of mouth within a community that deeply appreciates good tools will do the rest.

**Build the community. Earn the trust. Charge what it's worth.**

---

*Last updated: March 2026*
*Confidence level: 94% (pricing data from live sources; market size estimates derived from available proxies; community engagement projections based on comparable launches)*
