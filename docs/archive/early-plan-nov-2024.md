# Credit Card Churning Autopilot – Execution Plan

## Core Thesis
- Narrow the product to **credit card churning logistics**—skip general budgeting/wealth tracking.
- Build an Australia-first “churn autopilot” that keeps a living database of AU cards, models the optimal sequence, tracks minimum spend progress, and automates reminders.
- Use your own workflow as the proving ground; every feature ships only once it solves a real churn pain you experience.

## Target Personas
1. **Expert churners** – already running 3–6 cards, high spend, active on r/AusFinance/OzBargain. Value: never missing bonuses, optimized sequencing, community-sourced tactics.
2. **Aspiring churners** – understand points arbitrage but fear logistics. Value: prescriptive plan + reminders that reduce mistakes and analysis paralysis.

## MVP Scope (6-week build)
- **Card Intelligence**: Structured catalog for AU issuers (bonus size, min spend, fee, eligibility, notable rules).
- **Planner**: Intake spend capacity, credit score band, loyalty goal → output 6–12 month churn schedule with value estimates.
- **Bonus Tracker**: Manual entry first (card, min spend target, deadline, progress). Exportable to CSV.
- **Reminder Engine**: Notifications for application windows, spend milestones, statement close, cancellation.
- **Embedded Playbooks**: Opinionated tips per card (waive fee tactics, family pooling rules) to differentiate from raw comparison tables.

## Data & Automation Roadmap
1. Manual inputs / CSV upload (Phase 0–1).
2. Browser automation for statement downloads + transaction parsing (Phase 2 once ≥50 paying users).
3. Open-Banking integration via AU CDR providers (Phase 3 when budget allows).

## Market Size & Pricing
- AU serious churners ≈ 100K. Goal: capture 1–5% (1K–5K subscribers) before global expansion.
- Pricing hypothesis: $39/mo Base, $79/mo Pro (automation + concierge reminders). Annual plans = 2 months free.
- Revenue math: 100 users → $6K MRR; 500 users → $30K; 1,000 users → $60K. Expanding to US/UK unlocks 20× TAM.

## Validation Milestones
1. **Weeks 1–2**: Card DB + planner prototype; test with your own data, share loom to 5 churner friends.
2. **Week 4**: Beta with 20 r/AusFinance/OzBargain members; target activation (plan created + first card tracked).
3. **Week 8**: Launch paid tier; goal 10 paying users (~$600 MRR) with churn <10%.
4. **Month 3–4**: Release reminder automation + testimonials; reach 50 paying users.
5. **Month 6**: Evaluate automation roadmap + compliance path; target $5K MRR to justify scaling/expansion.

## Competitive Positioning
- **AwardWallet / MaxRewards**: Successful US loyalty trackers (millions of accounts, $MM ARR) but no AU support, no sequenced plans. Use their existence as proof of demand.
- **PointsHacks / Finder / Canstar**: Content/comparison only—no operational layer. Your edge: “Do this next” guidance plus automation.
- **Budget apps (PocketSmith, Frollo)**: Cash flow focus, not churn logistics.

## Market Research To Do Next
1. **Card Catalogue Audit**: Capture every AU issuer + bonus (Amex, Big 4, Citi, Macquarie, smaller credit unions). Track historical bonus changes to show authority.
2. **Community Interviews**: 10 conversations (mix of expert + aspiring churners) about pain points: sequencing, tracking, reminders, tax treatment.
3. **Pricing Survey**: Conjoint-style poll in r/AusFinance “card churn” threads testing $29/$39/$59 tiers and must-have features for each.
4. **Compliance Recon**: Talk to AU financial-services lawyer re: “information vs advice” wording, disclaimers, potential AFSL requirements.
5. **Distribution Map**: List top Reddit threads, OzBargain forums, podcasts, and finance newsletters for launch + referral loops.
6. **Competitive Monitoring**: Quarterly check on AwardWallet/MaxRewards product updates; set Google Alerts for “Australian credit card bonus tracker.”

## Next Work Items
1. **Spec & Design**: Finalize data model (cards, users, schedules) + UI wireframes for planner/tracker.
2. **Build Sprint**: 6-week focus on card DB, planner logic, manual tracker, reminders MVP.
3. **Beta Funnel**: Landing page, onboarding survey, Discord/Slack feedback loop, referral incentive.
4. **Legal & Security**: Draft disclaimers, consult lawyer, document data-handling policy (esp. for statement uploads later).
5. **Content Prep**: Write launch posts (“How I run a 6-card churn stack in Australia”), gather screenshots/gifs for marketing.

Use this document as the seed artifact for the upcoming project repo—everything here maps directly into epics, tasks, and validation checkpoints.
