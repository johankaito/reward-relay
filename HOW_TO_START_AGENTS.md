# HOW TO START AI AGENTS FOR REWARDIFY

**Purpose**: Instructions for starting AI coding agents that pick up from current state
**Use When**: Starting new Claude Code session, or running multiple agents in parallel

---

## 🤖 SINGLE AGENT MODE (Continue Where You Left Off)

### Starting a New Claude Code Session:

**What You Say**:
```
I'm continuing work on Rewardify - credit card churning SaaS for Australia.

Please read these files to understand current state:
1. ~/gits/src/github.com/johankaito/ideas/rewardify/CURRENT_STATE.md
2. ~/gits/src/github.com/johankaito/ideas/rewardify/EXECUTION_TRACKER.md
3. ~/gits/src/github.com/johankaito/ideas/rewardify/FOR_AI_AGENTS.md

Then:
- Continue from where the last session stopped
- Follow the engineering standards in FOR_AI_AGENTS.md
- Update CURRENT_STATE.md as you make progress
- Update EXECUTION_TRACKER.md with daily standup

Current task: [Tell it what to work on, or let it read from CURRENT_STATE.md]
```

**Claude Will**:
1. Read CURRENT_STATE.md (understand what's done)
2. Read latest handoff file (if exists)
3. Read EXECUTION_TRACKER.md (historical context)
4. Continue building from current state
5. Update docs as it works

---

## ⚡ MULTI-AGENT MODE (Parallel Execution)

### Week 1 Example (4 Agents in Parallel):

#### Terminal 1 - Agent A (Database)

**Open Claude Code → Say**:
```
You are Agent A - Database Specialist for Rewardify.

Your mission: Setup Supabase database and schema.

Read:
- ~/ideas/rewardify/PARALLEL_EXECUTION.md (your tasks are in "Stream 1")
- ~/ideas/rewardify/FOR_AI_AGENTS.md (engineering standards)

Execute:
1. Create Supabase project "rewardify-prod"
2. Create database schema (cards, user_cards, spending_profiles tables)
3. Add RLS policies
4. Insert 30 Australian credit cards (sample data in FOR_AI_AGENTS.md)
5. Generate TypeScript types
6. Test queries

When done:
- Create: ~/ideas/rewardify/handoffs/agent-a-database-[date].md
- Include: Supabase credentials for Agent B
- Update: ~/ideas/rewardify/CURRENT_STATE.md

Start now.
```

#### Terminal 2 - Agent C (UI) [PARALLEL with A]

**Open New Claude Code Window → Say**:
```
You are Agent C - UI Specialist for Rewardify.

Your mission: Setup design system and build UI components.

Read:
- ~/ideas/rewardify/PARALLEL_EXECUTION.md (your tasks are in "Stream 3")
- ~/ideas/rewardify/FOR_AI_AGENTS.md (design system standards)
- ~/ideas/rewardify/POLISH_CHECKLIST.md (quality requirements)

Execute:
1. Navigate to ~/gits/src/github.com/johankaito/rewardify
2. Setup shadcn/ui: npx shadcn-ui@latest init
3. Add components: button, card, input, label, select, dialog, toast, badge
4. Create layout components (Navbar, Sidebar, Footer)
5. Create card components (CardItem, CardGrid, CardFilters)
6. Create empty state components
7. Create loading skeleton components

When done:
- Create: ~/ideas/rewardify/handoffs/agent-c-ui-[date].md
- List: All components created
- Update: ~/ideas/rewardify/CURRENT_STATE.md

Start now (you don't need Agent A to finish first).
```

#### Terminal 3 - Agent B (Auth) [WAITS for A]

**Open Claude Code → Say**:
```
You are Agent B - Auth Specialist for Rewardify.

Your mission: Build authentication system.

Wait for Agent A to complete and create handoff file.

Then:
1. Read: ~/ideas/rewardify/handoffs/agent-a-database-[latest].md
2. Get Supabase credentials from Agent A's handoff
3. Read: ~/ideas/rewardify/PARALLEL_EXECUTION.md (Stream 2 tasks)

Execute:
1. Create Supabase client helper (src/lib/supabase/client.ts)
2. Build login page (src/app/(auth)/login/page.tsx)
3. Build signup page (src/app/(auth)/signup/page.tsx)
4. Build password reset flow
5. Create protected route wrapper
6. Test auth flow end-to-end

When done:
- Create: ~/ideas/rewardify/handoffs/agent-b-auth-[date].md
- Update: ~/ideas/rewardify/CURRENT_STATE.md

Waiting for Agent A...
```

#### Terminal 4 - Agent D (Integration) [WAITS for A+B+C]

**Open Claude Code → Say**:
```
You are Agent D - Integration Specialist for Rewardify.

Your mission: Assemble all components into working application.

Wait for Agents A, B, and C to complete.

Then:
1. Read all handoff files:
   - ~/ideas/rewardify/handoffs/agent-a-database-[date].md
   - ~/ideas/rewardify/handoffs/agent-b-auth-[date].md
   - ~/ideas/rewardify/handoffs/agent-c-ui-[date].md

Execute:
1. Create app layout (uses Agent C's layout components)
2. Create dashboard page (uses Agent B's auth)
3. Create cards catalog page (uses Agent A's data + Agent C's components)
4. Connect everything (fetch cards from database, display in UI)
5. Test complete user flow (signup → login → dashboard → browse cards)
6. Fix any integration issues

When done:
- Create: ~/ideas/rewardify/handoffs/agent-d-integration-[date].md
- Update: ~/ideas/rewardify/CURRENT_STATE.md
- Mark Week 1 complete in EXECUTION_TRACKER.md

Waiting for Agents A, B, C...
```

---

## 🔄 UPDATING DOCS (Agent Responsibility)

**Every AI Agent MUST update these files**:

### 1. CURRENT_STATE.md (After Every Major Change)

**What to Update**:
```markdown
**Last Updated**: [Current timestamp]
**Week**: X of 8
**Overall Progress**: Y% complete

## In Progress:
- 🔄 [Current task]
- Agent: [Which agent]
- Status: [On track / Blocked]

## Completed This Session:
- ✅ [What you just finished]

## Next:
- [What should happen next]
```

---

### 2. EXECUTION_TRACKER.md (Daily Standup)

**Format**:
```markdown
### Date: 2025-12-XX

**Time Today**: 2 hours
**Agent**: Agent A (Database) or Human (John)

**Shipped**:
- Database schema created
- 30 Australian cards added
- RLS policies configured

**Blockers**:
- None / [Describe blocker]

**Tomorrow**:
- Agent B will use these credentials for auth
```

---

### 3. handoffs/agent-X-[date].md (When Agent Completes)

**Create New File**:
```markdown
# Agent A - Database Handoff

**Date**: 2025-12-XX
**Status**: ✅ Complete

## What I Built:
- Supabase project: [URL]
- Database schema (cards, user_cards, spending_profiles)
- RLS policies
- 30 Australian cards inserted

## Credentials (For Next Agent):
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

## Files Created/Modified:
- .env.local (created with credentials)
- Database schema (in Supabase dashboard)

## Testing Done:
- ✅ Can query cards table
- ✅ RLS working (can't see other users' data)
- ✅ 30 cards inserted correctly

## For Next Agent:
Agent B (Auth) can now:
- Use Supabase credentials above
- Build auth flow against this database
- Reference schema in handoff

Agent C (UI) can work in parallel (doesn't need this)

## Next Steps:
1. Agent B: Build auth
2. Agent C: Build UI (parallel)
3. Agent D: Integrate (after B + C done)
```

---

## 📊 AGENT COORDINATION EXAMPLE

### Real Scenario: Week 1 Execution

**Monday 9am - Start**:

**You (Human)**:
- Open 2 Claude Code windows
- Start Agent A (Database) in Window 1
- Start Agent C (UI) in Window 2 (parallel)

**Monday 11am - Agents Report**:

**Agent A**: ✅ Complete
- Created handoff: `handoffs/agent-a-database-2025-12-17.md`
- Supabase credentials ready

**Agent C**: 🔄 In progress (70% done)
- Components created
- Still adding layouts

**Monday 12pm - Start Agent B**:

**You**:
- Open Window 3
- Give Agent B the credentials from Agent A's handoff
- Agent B starts building auth

**Monday 2pm - All Report**:

**Agent A**: ✅ Done (idle)
**Agent B**: ✅ Complete - Created handoff
**Agent C**: ✅ Complete - Created handoff

**Monday 3pm - Start Agent D**:

**You**:
- Open Window 4 (or reuse Window 1)
- Give Agent D all 3 handoff files
- Agent D integrates everything

**Monday 6pm - Week 1 Complete**:

**Agent D**: ✅ Done
- Full integration working
- Can sign up, login, browse 30 cards
- Week 1 deliverables shipped!

**You Update**:
- EXECUTION_TRACKER.md (Week 1 retrospective)
- CURRENT_STATE.md (Week 1 complete, Week 2 next)

**Total Time**: ~9 hours (4 agents working 2-3 hours each, with some parallel time)
**vs Sequential**: Would have taken 14-16 hours

**Savings**: 30-40% faster with parallelization

---

## 🔄 SESSION CONTINUITY (How New Agent Picks Up)

### When Starting New Session (Next Day, Week, etc.):

**You Say to New Claude Code Session**:
```
Continuing Rewardify build.

Context files (read in order):
1. ~/ideas/rewardify/CURRENT_STATE.md (current progress)
2. ~/ideas/rewardify/EXECUTION_TRACKER.md (history)
3. ~/ideas/rewardify/handoffs/ (latest agent handoffs)

Current week: [Check CURRENT_STATE.md]
Current task: [From CURRENT_STATE.md "Next Actions"]

Continue building. Follow standards in FOR_AI_AGENTS.md.

Update CURRENT_STATE.md and EXECUTION_TRACKER.md as you work.
```

**Agent Reads**:
1. CURRENT_STATE.md → "Oh, Week 1 is 100% done, Week 2 is next"
2. EXECUTION_TRACKER.md → "Week 1 retrospective shows auth works great"
3. Latest handoffs → "Agent D integrated everything, here's what exists"
4. FOR_AI_AGENTS.md → "Here are the engineering standards to follow"

**Agent Continues**: Picks up Week 2 tasks exactly where Week 1 left off

**No Context Loss**: Complete continuity between sessions

---

## 📋 UPDATE PROTOCOL (For AI Agents)

### After Each Coding Session:

1. **Update CURRENT_STATE.md**:
   ```markdown
   **Last Updated**: [Current timestamp]
   **In Progress**: [What you just worked on]
   **Completed This Session**: [What you finished]
   **Next**: [What should happen next]
   ```

2. **Update EXECUTION_TRACKER.md**:
   ```markdown
   ### Date: [Today]
   **Time Today**: [Hours worked]
   **Shipped**: [List deliverables]
   **Blockers**: [Any issues]
   **Tomorrow**: [Next tasks]
   ```

3. **Create Handoff** (if completing major component):
   - File: `handoffs/agent-[name]-[date].md`
   - Content: What you built, how to use it, what's next

**This ensures next session can continue seamlessly.**

---

## 🎯 EXAMPLE: Starting Day 1 RIGHT NOW

### Terminal Command:

```bash
cd ~/gits/src/github.com/johankaito

# Option 1: You build yourself
npx create-next-app@latest rewardify --typescript --tailwind --app

# Option 2: Ask Claude Code to build
# (Open Claude Code and paste the Agent A prompt from above)
```

### Then Update Docs:

**CURRENT_STATE.md**:
```markdown
**Last Updated**: 2025-12-17 15:45
**Week**: 1 of 8
**Overall**: 5% complete (project created)

## In Progress:
- 🔄 Week 1 Day 1 - Project setup complete
- Next: Supabase setup (Agent A) or Auth (if doing solo)
```

**EXECUTION_TRACKER.md**:
```markdown
### Wed Dec 17, 2025

**Time Today**: 30 minutes
**Agent**: Human (John)

**Shipped**:
- Created Next.js project (rewardify/)
- Installed dependencies
- Verified app runs on localhost:3000

**Blockers**: None

**Tomorrow**:
- Setup Supabase (Agent A task)
- Or build auth flow (if solo)
```

---

## 🚀 QUICK START COMMANDS (Copy-Paste)

### Option 1: Solo Build (Traditional)

```bash
# Create project
cd ~/gits/src/github.com/johankaito
npx create-next-app@latest rewardify --typescript --tailwind --app

# Install deps
cd rewardify
npm install @supabase/supabase-js @supabase/auth-ui-react
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install react-hook-form @hookform/resolvers zod lucide-react

# Setup shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select toast

# Run
npm run dev

# Update tracking
cd ~/gits/src/github.com/johankaito/ideas/rewardify
# Edit CURRENT_STATE.md and EXECUTION_TRACKER.md
```

---

### Option 2: Multi-Agent (Parallel)

**Terminal 1 - Agent A**:
```
[Paste Agent A prompt from PARALLEL_EXECUTION.md]
```

**Terminal 2 - Agent C** (can start immediately):
```
[Paste Agent C prompt from PARALLEL_EXECUTION.md]
```

**Terminal 3 - Agent B** (starts after A finishes):
```
[Paste Agent B prompt, referencing Agent A's handoff]
```

---

## 📝 AGENT HANDOFF TEMPLATE (For AI Agents)

**When You (AI Agent) Complete Your Task**:

Create file: `~/ideas/rewardify/handoffs/agent-[name]-[date].md`

```markdown
# Agent [X] - [Stream Name] Handoff

**Date**: [Timestamp]
**Agent**: [Database / Auth / UI / Integration]
**Duration**: [Hours worked]
**Status**: ✅ Complete

---

## ✅ What I Built:

### Files Created:
- path/to/file.ts
- path/to/file.tsx

### Features Implemented:
- [Feature 1]
- [Feature 2]

---

## 🔑 Important Info for Next Agent:

[If you're Agent A - Database]:
**Supabase Credentials**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

[If you're Agent B - Auth]:
**Auth is working**:
- Login: /login
- Signup: /signup
- Protected routes: Use middleware in src/middleware.ts

[If you're Agent C - UI]:
**Components available**:
- All shadcn/ui components in src/components/ui/
- Layout components in src/components/layout/
- Card components in src/components/cards/

---

## ✅ Testing Done:

- [ ] Feature works manually (tested)
- [ ] No console errors
- [ ] Mobile responsive (if UI work)
- [ ] TypeScript compiles (`npm run build`)

---

## 🚨 Blockers Encountered:

[None / Describe blocker and how you resolved it]

---

## 📋 Next Steps:

**For Next Agent**:
1. [What they should do next]
2. [What depends on my work]

**For Human**:
- Review this handoff
- Approve/request changes
- Start next agent

---

## 📂 Files Modified:

- src/...
- src/...

**Git Status**:
- Committed: [Yes/No]
- Branch: main
- Commit message: "[If committed]"

---

**Handoff Complete**: ✅
**Next Agent Can Start**: [Yes/No - specify which agent]
```

---

## 🔄 CONTINUITY CHECKLIST

**Before Ending ANY Session (AI or Human)**:

- [ ] Update CURRENT_STATE.md with latest progress
- [ ] Update EXECUTION_TRACKER.md with daily standup
- [ ] Create handoff file (if completed major component)
- [ ] Commit code (if code was written)
- [ ] Note blockers (if any)
- [ ] Note next steps clearly

**This 5-minute discipline ensures next session continues smoothly.**

---

## 🎯 CONTEXT REFRESH (For AI Agents)

**When You (AI Agent) Start a New Session**:

### Step 1: Read Current State (30 seconds)
```bash
cat ~/ideas/rewardify/CURRENT_STATE.md
```
**Learn**: What's done, what's in progress, what's next

### Step 2: Read Latest Handoff (if exists) (1 minute)
```bash
ls ~/ideas/rewardify/handoffs/ | tail -1
cat ~/ideas/rewardify/handoffs/[latest-file]
```
**Learn**: Detailed state from last agent

### Step 3: Read Execution Tracker (2 minutes)
```bash
tail -50 ~/ideas/rewardify/EXECUTION_TRACKER.md
```
**Learn**: Recent progress, blockers, decisions

### Step 4: Confirm Engineering Standards (1 minute)
```bash
grep "Engineering Standards" ~/ideas/rewardify/FOR_AI_AGENTS.md -A 20
```
**Learn**: Code style, patterns to follow

**Total**: 5 minutes of reading → Full context → Continue building

---

## 🚀 START NOW

**Your Next Command** (Human):

```bash
cd ~/gits/src/github.com/johankaito
npx create-next-app@latest rewardify --typescript --tailwind --app
```

**Then**:
Open Claude Code and say:
```
I just created the Rewardify project.

Continue with Week 1 Day 1 tasks from:
~/ideas/rewardify/WEEK_1_PLAN.md

Update:
- CURRENT_STATE.md
- EXECUTION_TRACKER.md

Follow standards in:
- FOR_AI_AGENTS.md

Start building the auth flow.
```

**Claude will**:
- Read the docs
- Build auth flow
- Update tracking docs
- Create handoff when done

---

## ✅ SUCCESS PATTERN

**Good Execution Looks Like**:

```
Day 1:
- Human creates project
- Agent A builds database (4 hrs)
- Agent C builds UI (parallel, 5 hrs)
- CURRENT_STATE.md updated: "Week 1 40% complete"

Day 2:
- Agent B builds auth (4 hrs, uses A's credentials)
- EXECUTION_TRACKER.md updated with standup

Day 3:
- Agent D integrates (4 hrs)
- Week 1 COMPLETE (tested, works, polished)
- EXECUTION_TRACKER.md: Week 1 retrospective filled

Day 4-7:
- Week 2 starts immediately (no gap)
- Momentum maintained
```

**Key**: Continuous updates to tracking docs = no context loss

---

## 🎉 YOU'RE READY

You now have:
- ✅ Complete business plan
- ✅ Complete technical specs
- ✅ Complete execution system
- ✅ Multi-agent strategy
- ✅ Session continuity system
- ✅ Quality checklists
- ✅ **Signed commitment**

**The system is designed so you CANNOT fail silently.**

**Every decision gate forces a check. Every update maintains continuity.**

**Start today. Run the command. Build for 2 hours. Update the docs.**

**Then do it again tomorrow. And the next day.**

**In 90 days: Either you have revenue or you have learnings. Both are wins.**

---

**Document Status**: ✅ COMPLETE
**Last Updated**: 2025-12-17
**Your Next Action**: Run `npx create-next-app@latest rewardify` NOW
