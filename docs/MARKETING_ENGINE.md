# Reward Relay — AI Marketing Engine

## Overview

All marketing assets are produced through a Claude + Midjourney review loop before publishing. No copy or visual goes live without passing through this pipeline.

**Stack**:
- Claude: copy drafts, community posts, email sequences, video scripts, prompt engineering for Midjourney
- Midjourney: hero images, social cards, app UI mockups with lifestyle context
- Review loop: Claude drafts → Midjourney generates → Claude critiques both for AU churning community fit → human approval → publish

---

## The 4-Phase Launch Model

### Phase 1 — Dog-food (Week 1–2)
**Owner**: John only  
**Goal**: Find what breaks before anyone else sees it  
**Definition of done**: New user gets a meaningful recommendation within 3 minutes of sign-up

Actions:
- Use the app daily for real churning decisions
- Log confusing moments, wrong recommendations, missing data in a notes doc
- Triage: only fix things that block the AHA moment
- Do NOT share publicly yet

Success metric: Can you go from fresh login → "here's your next card and why" in under 3 minutes?

---

### Phase 2 — Friends (Week 3–4)
**Owner**: John + 5–10 trusted churners  
**Goal**: Validate the AHA moment works for people who aren't you  
**Definition of done**: 3 people got a recommendation they trusted and came back the next day

Actions:
- Personal DMs only — no forms, no waitlist yet
- Pick friends who actually churn, not just tech-curious friends
- Watch them use it (sit with them or Loom)
- Collect 2–3 testimonials ("saved me from applying to ANZ I wasn't eligible for")
- Start building Phase 3 assets: demo video, community post draft

Marketing assets to produce in this phase:
- Demo video script (Claude drafts, you record)
- Community intro post draft (Claude drafts, tuned for AFF/Reddit tone)
- 2–3 social proof quotes

Success metric: NPS-style — "would you recommend this to another churner?" target 8+/10

---

### Phase 3 — Churning Community (Week 5–8, invite-only)
**Owner**: John + community members  
**Goal**: Get distribution in the community that matters most long-term  
**Definition of done**: 50 active users from churning community, 5+ unprompted recommendations/posts

Channels (in priority order):
1. Australian Frequent Flyer (AFF) forums — most credible AU churning community
2. r/churningaustralia — fastest distribution
3. Facebook: "Points Hacking Australia", "Credit Card Churning Australia"
4. Private Discord servers in AU points space

Pre-requisites before posting (all must be true):
- [ ] Demo video live (60–90 seconds, real data, real onboarding)
- [ ] 2–3 social proof quotes from Phase 2
- [ ] 50+ AFF posts (community credibility threshold)
- [ ] Invite mechanic live (first 50 from thread get access)
- [ ] Referral system: existing users get invite links; inviter gets extra card slots or "founding member" badge

Launch post formula:
1. Personal story of the problem (specific, real — "got declined because I forgot ANZ Black 20 months ago")
2. What you built + core insight (cooling periods + recommendations, one place)
3. Proof (video link + 2 testimonial quotes)
4. Invite offer + ask for feedback, not money
5. No pricing mention

Marketing assets to produce in this phase:
- Demo video (Loom/QuickTime, 60–90s)
- AFF launch post (Claude-drafted, AFF-tone)
- Reddit launch post (Claude-drafted, Reddit-tone — different voice)
- Social cards for Facebook groups (Midjourney-generated)
- Invite page (minimal: what it does in 3 bullets + waitlist)

Success metric: 50 active users, 5 unprompted shares

---

### Phase 4 — Controlled Public Push (Month 3+)
**Owner**: John + growth loop  
**Goal**: Scale what worked in Phase 3 without losing community trust  
**Definition of done**:  MRR (kill criterion from LAUNCH_EXECUTION_PLAN.md), sustainable acquisition loop

Channels:
- Waitlist → invite waves (50–100/week)
- SEO: "credit card churning tracker Australia", "ANZ cooling period calculator", "when can I churn ANZ again"
- YouTube explainer (3–5 min — will rank, thin competition)
- AU personal finance newsletters: Equity Mates, Rask, Money Flamingo — offer write-up or collab
- Reddit ads to r/churningaustralia (small budget, hyper-targeted)
- Only introduce paid plans after community trust is established

Marketing assets to produce in this phase:
- SEO landing pages for key search terms (Claude-drafted)
- YouTube script (Claude-drafted, 3–5 min)
- Newsletter pitch email template
- Referral page copy

Success metric:  MRR by Week 12 (per LAUNCH_EXECUTION_PLAN.md kill criterion)

---

## AI Creative Review Loop

### Copy Review (every piece of copy before publishing)

Run all copy through Claude with this prompt before publishing:

> "Review this as a skeptical AFF forum member who has seen 10 overpromised apps. You've been churning for 5 years and you're tired of tools that don't understand AU-specific rules (Amex 18-month, ANZ 24-month, etc.). What's unconvincing? What's missing? What would make you trust this enough to sign up?"

Then revise and re-run until there are no objections.

### Visual Review (Midjourney assets)

Workflow:
1. Claude writes the Midjourney prompt based on asset brief
2. Generate 4 variants in Midjourney
3. Claude critiques each variant: "Does this look like something a serious AU churner would trust, or does it look like a generic fintech ad?"
4. Pick best variant, human final approval

Midjourney prompt template for app screenshots:
> "Clean dark UI screenshot of a personal finance app showing credit card recommendations with cooling period eligibility dates, minimal design, dark navy background, teal accent colors, professional fintech aesthetic, no people, --ar 16:9 --v 6"

### Asset Checklist (before each phase)

| Asset | Claude drafted | Midjourney generated | Copy reviewed | Human approved |
|-------|---------------|---------------------|---------------|----------------|
| Demo video script | [ ] | n/a | [ ] | [ ] |
| AFF launch post | [ ] | n/a | [ ] | [ ] |
| Reddit launch post | [ ] | n/a | [ ] | [ ] |
| Social cards (3x) | n/a | [ ] | [ ] | [ ] |
| Invite page copy | [ ] | n/a | [ ] | [ ] |
| Onboarding email 1 | [ ] | n/a | [ ] | [ ] |
| Onboarding email 2 | [ ] | n/a | [ ] | [ ] |
| YouTube script | [ ] | n/a | [ ] | [ ] |
| SEO landing pages | [ ] | n/a | [ ] | [ ] |

---

## Referral Mechanic (Phase 3+)

- Every user gets a personal invite link after sign-up
- When someone signs up via their link: referrer gets +5 card slots (or next tier feature unlock)
- Founding member badge visible on their profile for first 100 users
- Tracks: invites sent, invites accepted, inviter retention (measure whether referrers stay engaged)

---

## Startup Agent Activation

This document is the source of truth for launch execution. The startup-accelerator agent (~/.claude/agents/startup-accelerator/) should be invoked for:
- Reviewing launch decisions against the 4-phase model
- Drafting any marketing copy
- Evaluating channel prioritisation
- Running the copy review loop (skeptical AFF member prompt)
- Advising on pricing and monetisation timing

To activate: mention "launch", "marketing", "community", "growth", or "startup" in any task — the startup-accelerator agent will be automatically consulted.

---
*Last updated: April 2026*
*Cross-reference: docs/LAUNCH_EXECUTION_PLAN.md*
