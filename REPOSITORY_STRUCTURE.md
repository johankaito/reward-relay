# REWARDIFY - REPOSITORY STRUCTURE DECISION

**Question**: What lives in `/ideas/rewardify/` vs `/rewardify/` (code repo)?

**Date**: 2025-12-17

---

## THE STRUCTURE

### Location 1: `/ideas/rewardify/` (Planning Repository)
**Purpose**: Strategy, business planning, execution tracking
**Lifespan**: Permanent (persists even if code is rebuilt/deleted)

**What Lives Here**:
- ✅ BUSINESS_PLAN.md
- ✅ COMPETITIVE_ANALYSIS.md
- ✅ CUSTOMER_STORY_001.md
- ✅ EXECUTION_TRACKER.md
- ✅ WEEK_1_PLAN.md
- ✅ START_HERE.md
- ✅ PLATFORM_DECISION.md
- ✅ MVP_FEATURES.md
- ✅ README.md (planning overview)
- ✅ `docs/` folder:
  - EVOLUTION.md
  - LLM_EXECUTION_SUMMARY.md
  - `archive/` (old plans)
  - **Build Specifications** (see below)

**Why Here**: Strategy documents that inform ALL implementations (even if you rebuild from scratch)

---

### Location 2: `/rewardify/` (Code Repository)
**Purpose**: Executable code, configuration, deployment
**Lifespan**: Can be deleted/rebuilt, code is disposable

**What Lives Here**:
- ✅ `src/` - All source code
- ✅ `app/` - Next.js app directory
- ✅ `components/` - React components
- ✅ `lib/` - Utilities, Supabase client
- ✅ `public/` - Static assets
- ✅ `package.json` - Dependencies
- ✅ `.env.local` - Environment variables
- ✅ `next.config.js` - Next.js config
- ✅ `tailwind.config.ts` - Tailwind config
- ✅ `.gitignore` - Git ignore rules
- ✅ `README.md` - Code repo docs (how to run, deploy)
- ✅ `.git/` - Git history

**Why Here**: Everything needed to run the application

---

## THE INTERESTING QUESTION: Where Do Build Specifications Live?

**Build specs** include:
- Database schema (SQL files)
- Component specifications
- API contracts
- Design system docs
- Week-by-week build guides

### 🤔 Two Approaches:

### Approach A: **Specs in `/ideas/`, Code in `/rewardify/`** (Separation)

```
/ideas/rewardify/                     ← Strategy + Specifications
├── BUSINESS_PLAN.md
├── EXECUTION_TRACKER.md
└── docs/
    ├── DATABASE_SCHEMA.md            ← SQL specifications
    ├── COMPONENT_SPECS.md            ← Component specifications
    ├── WEEK_1_BUILD.md               ← Build instructions
    ├── WEEK_2_BUILD.md
    └── POLISH_CHECKLIST.md

/rewardify/                           ← Code Only
├── src/
├── package.json
└── README.md (links to ../ideas/rewardify/ for context)
```

**Pros**:
- ✅ Clear separation (strategy vs implementation)
- ✅ Build specs persist if code is deleted
- ✅ Can rebuild from scratch using same specs

**Cons**:
- ⚠️ Must navigate between folders
- ⚠️ Code README links to external docs

---

### Approach B: **Minimal Specs in `/ideas/`, Full Docs in `/rewardify/`** (Practical)

```
/ideas/rewardify/                     ← High-Level Strategy ONLY
├── BUSINESS_PLAN.md
├── COMPETITIVE_ANALYSIS.md
├── EXECUTION_TRACKER.md
├── MVP_FEATURES.md (high-level feature list)
└── README.md

/rewardify/                           ← Code + Technical Docs
├── src/
├── docs/
│   ├── DATABASE_SCHEMA.md            ← Technical specs
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── CONTRIBUTING.md
├── package.json
└── README.md
```

**Pros**:
- ✅ Self-contained code repo (has own docs)
- ✅ Easier for other devs (all tech docs in code repo)
- ✅ Standard practice (most repos have `/docs/`)

**Cons**:
- ⚠️ If code deleted, lose technical specs
- ⚠️ Some duplication (business plan references features, code docs specify features)

---

## MY RECOMMENDATION: **Hybrid Approach**

### `/ideas/rewardify/` = Strategic + LLM Execution Guide
**What lives here**:
- ✅ Business strategy (BUSINESS_PLAN.md, COMPETITIVE_ANALYSIS.md)
- ✅ Execution tracking (EXECUTION_TRACKER.md, WEEK_1_PLAN.md)
- ✅ LLM build guides (WEEK_1_BUILD.md through WEEK_8_BUILD.md)
- ✅ Product specs (MVP_FEATURES.md)
- ✅ Customer stories
- ✅ Decision logs

**Why**: These are "executable specifications" that can recreate the code repo if needed

### `/rewardify/` = Code + Technical Reference
**What lives here**:
- ✅ All source code
- ✅ README.md (with link to planning docs)
- ✅ `docs/` folder:
  - API documentation (once API exists)
  - Architecture decisions (once built)
  - Deployment guides (once deployed)
- ✅ Database migrations (actual SQL files used)

**Why**: Standard code repository structure

---

## THE RULE OF THUMB

**Ask**: "If I deleted the code repo, would I need this file to rebuild?"

**If YES** → Lives in `/ideas/rewardify/`
- Business plan (yes)
- Build specifications (yes)
- Execution tracker (yes)
- Customer stories (yes)

**If NO** → Lives in `/rewardify/`
- Source code (no - follows from specs)
- Package.json (no - generated from setup)
- Build artifacts (no - disposable)

---

## CONCRETE EXAMPLE

### Scenario: Database Schema

**Where does it live?**

**Option 1** - In planning repo:
`/ideas/rewardify/docs/DATABASE_SCHEMA.md` = **Specification** (what tables, why)

**Option 2** - In code repo:
`/rewardify/supabase/migrations/001_initial_schema.sql` = **Implementation** (actual SQL run)

**Answer**: **BOTH**

- **Specification** lives in `/ideas/` (explains WHY this schema)
- **Implementation** lives in `/rewardify/` (actual SQL that runs)

**Why Both**:
- Spec persists (can rebuild from it)
- Implementation is versioned with code
- They can diverge (code evolves, spec is snapshot)

---

## FINAL STRUCTURE (My Recommendation)

```
/Users/john.keto/gits/src/github.com/johankaito/

├── ideas/                                    ← Planning Hub
│   └── rewardify/
│       ├── README.md                         ← Planning overview
│       ├── BUSINESS_PLAN.md                  ← Strategy
│       ├── COMPETITIVE_ANALYSIS.md           ← Market research
│       ├── MVP_FEATURES.md                   ← Product spec
│       ├── EXECUTION_TRACKER.md              ← Progress tracking
│       ├── WEEK_1_PLAN.md                    ← Detailed plans
│       ├── START_HERE.md                     ← Kickstart guide
│       ├── PLATFORM_DECISION.md              ← Tech decisions
│       ├── CUSTOMER_STORY_001.md             ← User research
│       └── docs/
│           ├── LLM_EXECUTION_SUMMARY.md      ← AI agent index
│           ├── EVOLUTION.md                  ← How plan evolved
│           ├── DATABASE_SCHEMA.md            ← Schema spec (WHY)
│           ├── WEEK_1_BUILD.md               ← Build instructions
│           ├── WEEK_2_BUILD.md
│           ├── ... (Week 3-8)
│           ├── POLISH_CHECKLIST.md
│           ├── TESTING_PROTOCOL.md
│           └── archive/
│               ├── early-plan-nov-2024.md
│               └── early-review-nov-2024.md
│
└── rewardify/                                ← Code Repository
    ├── README.md                             ← Code docs (links to planning)
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── .env.local
    ├── .gitignore
    ├── src/
    │   ├── app/                              ← Next.js pages
    │   ├── components/                       ← React components
    │   ├── lib/                              ← Utils, Supabase client
    │   └── types/                            ← TypeScript types
    ├── public/                               ← Static assets
    ├── supabase/
    │   └── migrations/                       ← Actual SQL (WHAT runs)
    └── docs/                                 ← Technical docs (optional)
        ├── API.md                            ← API documentation
        ├── ARCHITECTURE.md                   ← How code is organized
        └── DEPLOYMENT.md                     ← How to deploy
```

---

## LINKING STRATEGY

### In Code Repo README (`/rewardify/README.md`):

```markdown
# Rewardify

Credit card churning automation for Australians.

## Documentation

**Business Planning**: [../ideas/rewardify/](../ideas/rewardify/)
- Business Plan
- Execution Tracker
- Build Specifications

**Technical Docs**: [./docs/](./docs/)
- API Documentation
- Architecture
- Deployment Guide

## Quick Start

[Setup instructions here]
```

### In Planning README (`/ideas/rewardify/README.md`):

```markdown
# Rewardify - Planning Hub

**Code Repository**: [../../rewardify/](../../rewardify/)

**Start Here**: [START_HERE.md](./START_HERE.md)
**Business Plan**: [BUSINESS_PLAN.md](./BUSINESS_PLAN.md)
**Build Guide**: [docs/LLM_EXECUTION_SUMMARY.md](./docs/LLM_EXECUTION_SUMMARY.md)
```

---

## WHAT THIS MEANS FOR YOU

### When Planning:
```bash
cd ~/gits/src/github.com/johankaito/ideas/rewardify
# Work on: BUSINESS_PLAN.md, EXECUTION_TRACKER.md, etc.
```

### When Coding:
```bash
cd ~/gits/src/github.com/johankaito/rewardify
# Work on: src/, components/, etc.
```

### When Tracking Progress:
```bash
cd ~/gits/src/github.com/johankaito/ideas/rewardify
# Update: EXECUTION_TRACKER.md with daily standups
```

---

## DECISION

**Approved Structure**: **Hybrid (ideas/ for specs, rewardify/ for code)**

**Why** (5 Whys):

**L1**: Separates strategy from implementation
**L2**: Strategy persists, code can be rebuilt
**L3**: Can delete failed code without losing learnings
**L4**: Learnings inform next attempt or different project
**L5 - ROOT**: **Code is disposable, knowledge is permanent. Structure reflects this priority.**

---

**Next**: Create the code repository structure and detailed week-by-week build guides.

**Ready to proceed?**

---

**Document Status**: ✅ DECISION FINALIZED
**Last Updated**: 2025-12-17
