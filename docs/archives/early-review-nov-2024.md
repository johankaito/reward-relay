# Review Agent: Credit Card Churn Autopilot

## Context
- Inputs: `CREDIT_CARD_CHURN_PLAN.md`, the founder’s personal credit-churn experience from `ideas.txt:65-96`, and the “Entrepreneur Project” business list that already contains the same idea (credit card churning automation). This review agent treats those documents as the brief for the new company.

## Review Findings
1. **Problem clarity** – The plan correctly isolates the choke point: churn logistics, not budgeting. Narrowing the scope increases clarity for the onboarding AI, data model, and marketing messaging.
2. **Feasibility** – The feasibility assumptions (6-8 week MVP, Phase 0 manual entry, Phase 1 automation) align with your solo-founder capacity. Costs remain low because automation upgrades are staged (manual → CSV → scrape → open banking).
3. **Revenue logic** – The pricing/math in the plan (Base $39, Pro $79, AU TAM 100K) matches the founder’s capacity to reach $5–10K MRR before considering expansion. LTV:CAC looks healthy given high retention for niche automation tools.
4. **AI integration** – The new AI onboarding approach ties into the plan via structured onboarding sessions that feed constraints into the planner. This adds differentiation without needing a huge context window.
5. **Competitive posture** – The plan acknowledges AwardWallet/MaxRewards and positions the product as AU-first + automation/playbooks, which is defensible. No existing tool matches the combination of schedule, reminders, and AI-guided onboarding you’re building.

## Execution Strategy (Best Path Forward)
1. **Ship the minimal planner** with card catalog + manual tracker, validate with r/AusFinance/OzBargain, and gather testimonials/test data for friction points. Use this to prove onboarding logic + willingness to pay.
2. **Add the AI-guided setup wizard** so users can answer a few questions and watch the plan auto-populate; store reasoning metadata (rules applied, constraints honored). Keep costs low by batching prompts, caching outputs, and deferring expensive automation steps.
3. **Layer automation** gradually—first CSV/manual check-ins, then browser scraping for statements, eventually open banking. This sequencing keeps burn low and product usable for the early cohort.
4. **Monetize through premium features** (reminder automation, concierge help, AI insights) while maintaining a generous free tier for beta users. Pair with referral loops (give a month free per referral) to amplify adoption.
5. **Continually benchmark against the entrepreneur project list** to ensure the plan stays aligned with the broader portfolio; treat this review as the “go/no-go” checkpoint before committing more resources.

## Recommended Next Work
- Validate the plan with the first 20 users and observe the friction points the AI agent is meant to solve.
- Build the AI prompts + tooling inside the plan so the onboarding wizard reflects the actual card catalog with real rules.
- Keep the document set updated (plans, reviews, market research) so the entrepreneur project’s business list can track progress toward launch.
