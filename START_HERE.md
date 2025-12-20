# START HERE - Reward Relay Execution

**You're ready to churn your next card. Build the tool that helps YOU decide.**

**Validation-first**: Ship the fastest Next.js web version; defer any mobile build until after Week 1 success signals. Keep logic in `lib/`, use a thin Supabase client, and stay responsive-but-web-first.

---

## YOUR SITUATION RIGHT NOW

✅ You have 2 credit cards (AMEX + one other)
✅ You've churned cards before (experienced)
✅ You need to decide which card to apply for next
✅ Manual tracking/comparison is taking time

**Perfect timing. Build what you need THIS WEEK.**

---

## STEP 1: Make the Commitment (5 minutes)

1. Open `EXECUTION_TRACKER.md`
2. Fill in your name and date
3. Sign the commitment
4. **This makes it real**

---

## STEP 2: Document Your Current Cards (10 minutes)

1. Open `CUSTOMER_STORY_001.md`
2. Fill out:
   - Your AMEX card details
   - Your card to churn
   - Previous cards you've churned
3. **This becomes your test data**

---

## STEP 3: Review Week 1 Plan (15 minutes)

1. Open `WEEK_1_PLAN.md`
2. Read the day-by-day breakdown
3. Block time on your calendar:
   - Mon: 2 hours (setup)
   - Tue: 2-3 hours (auth + database)
   - Wed: 2 hours (track your cards)
   - Thu: 2 hours (churn history)
   - Fri: 2-3 hours (comparison)
   - Sat: 2 hours (polish + use)
   - Sun: 1 hour (reflect)

**Total: 13-15 hours this week**

**Can you commit to this?** Yes / No

If No: Don't start. Figure out your priorities first.
If Yes: Continue to Step 4.

---

## STEP 4: Day 1 - Start Building (TODAY)

**Don't wait for Monday. Start TODAY if it's before 8pm.**

###  Commands to Run:

```bash
# 1. Navigate to your workspace
cd ~/gits/src/github.com/johankaito

# 2. Create Next.js app
npx create-next-app@latest rewardify
# Select: Yes to TypeScript, Yes to Tailwind, Yes to App Router

# 3. Navigate into project
cd rewardify

# 4. Install Supabase
npm install @supabase/supabase-js @supabase/auth-ui-react

# 5. Run the app
npm run dev

# 6. Open browser to localhost:3000
# You should see the Next.js welcome page
```

###  Set Up Supabase (15 minutes):

1. Go to [supabase.com](https://supabase.com)
2. Create new project: "rewardify"
3. Wait for database to provision (2-3 minutes)
4. Copy API keys
5. Create `.env.local` in your project:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```

###  First Commit:

```bash
git add .
git commit -m "Initial commit: Reward Relay - helping myself churn smarter"
git branch -M main
```

**Day 1 Done**: You have a running Next.js app with Supabase connected.

**Time spent**: ~2 hours

---

## STEP 5: Daily Standup (Every Day You Work)

Before you start coding:

1. Open `EXECUTION_TRACKER.md`
2. Copy the "Daily Standup Template"
3. Fill in:
   - What you're shipping today
   - Hours available
   - Any blockers

After you finish:

1. Update: Did you ship what you planned?
2. If No: Why not? What blocked you?
3. Plan tomorrow

**This 5-minute habit keeps you on track.**

---

## STEP 6: Use It for YOUR Next Churn (By Day 6)

By Saturday (Day 6), you will:

1. Have YOUR 2 cards tracked in the app
2. See YOUR churn history
3. Compare cards YOU haven't churned
4. **Decide which card to apply for next**

**If the tool doesn't help you decide, it's not working. Fix it.**

---

## STEP 7: Share with 2 Friends (Day 7)

Sunday:

1. Send link to 2 churner friends
2. Ask: "I built this for myself, want to try?"
3. Get their feedback
4. Use feedback to plan Week 2

---

## WHEN YOU GET STUCK

### "I don't have time"
**Reality check**:
- Week 1 needs 10-15 hours
- That's ~2 hours/day for 6 days
- OR ~5 hours Sat + 5 hours Sun + 3 hours weeknights
- If you can't find 10 hours, this isn't your priority

**Solution**: Be honest. Archive this project and work on what matters more.

---

### "I'm stuck on [technical issue]"
**Rules**:
1. Google it first (5 minutes max)
2. Check Next.js / Supabase docs (10 minutes max)
3. Ask Claude Code (me!) for specific help
4. **DON'T spend >30 minutes stuck**

**How to ask me**:
```
I'm stuck on [specific issue]
What I'm trying to do: [goal]
What I tried: [attempts]
Error message: [copy/paste]
```

---

### "This is taking longer than planned"
**Cut scope aggressively**:
- Week 1 goal: Help YOU decide next card
- Everything else is optional
- Ship something working > perfect plan

---

### "I lost motivation"
**Why?** (Answer honestly):
- [ ] Realized I don't actually need this tool
- [ ] Too hard technically
- [ ] Another project distracted me
- [ ] Work/family took priority
- [ ] Got stuck and gave up

**If you check ANY box**: Stop and reflect before continuing.

---

## SUCCESS METRICS (End of Week 1)

✅ **Must Have**:
- Tool runs locally
- YOU can track your cards
- YOU can see churn history
- YOU can compare eligible cards
- YOU used it to decide next card

❌ **Failure States**:
- Didn't ship anything working
- Tool doesn't help YOUR decision
- Slower than your current method
- Didn't actually use it

**If you hit failure state**: Don't start Week 2. Fix Week 1 or stop.

---

## THE 90-DAY TIMELINE

**Week 1**: Build for yourself
**Week 2-3**: Add features you discover you need
**Week 4**: 5 friends using it
**Week 5-7**: Optimization features
**Week 8**: Launch publicly on r/AusFinance
**Week 9-12**: Get 10-20 paying customers ($500-1K MRR)

**Week 12 Decision**: Continue (if $500+ MRR) or Kill (if <$500)

---

## THE COMMITMENT

**Before you start**:

- [ ] I've signed EXECUTION_TRACKER.md
- [ ] I've documented my current cards
- [ ] I've blocked 10-15 hours this week on calendar
- [ ] I've told someone I'm doing this (accountability)
- [ ] I will NOT work on other projects for 90 days
- [ ] I understand the kill criteria (Week 12: <$500 MRR = stop)

**If ALL boxes checked**: Start Day 1 NOW.

**If ANY box unchecked**: Don't start until you can check all boxes.

---

## WHAT HAPPENS NEXT

**Today**: Set up project (Day 1)
**This Week**: Build basic tracking
**By Saturday**: Use it for YOUR next churn decision
**By Sunday**: 2 friends have tried it

**In 90 days**: Either you have $500+ MRR or you've learned why not.

**Either outcome is success** (revenue or learning).

**The only failure is not starting or quitting without learning.**

---

## READY?

If yes: Run the commands in Step 4 RIGHT NOW.

If no: Close this file and be honest about your priorities.

**Don't plan more. Execute.**

---

**Last Updated**: 2025-12-10
**Status**: Ready to Start
**Your Next Action**: Run `npx create-next-app@latest rewardify`
