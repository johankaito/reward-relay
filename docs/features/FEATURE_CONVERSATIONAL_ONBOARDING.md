# Feature: Conversational Onboarding & Data Entry

**Status**: 📋 Documented (Build After Validation)
**Priority**: High (Post-MVP Enhancement)
**Timeline**: Phase 2 (After core platform validation)
**Last Updated**: 2024-12-31

---

## 🎯 Vision

Replace manual data entry with seamless conversational flow that minimizes friction while collecting all necessary churning information. Users describe their situation naturally, system extracts structured data and confirms before saving.

**User Story**:
> "As a credit card churner, I want to quickly tell the platform about my cards in plain English, so I can start getting value without tedious form filling."

---

## 🚀 Phased Implementation

### Phase 1: Core Platform (NOW)
**Status**: ✅ Complete
- Manual form-based entry (AddCardForm, etc.)
- CSV import for transactions
- Standard UI for all features

**Purpose**: Validate core value proposition before investing in conversational UX

---

### Phase 2: Simple Wizard Onboarding (NEXT)
**Status**: 📋 Planned
**Timeline**: After MVP validation (Week 10-12)
**Cost**: Low (no LLM API costs)

**Features**:
- Step-by-step guided questions
- Smart date parsing ("last month", "3 weeks ago")
- Card name autocomplete from catalog
- Bank detection and validation
- Progress indicator
- Review & confirm before save
- Skip/back navigation

**User Flow Example**:
```
Welcome! Let's set up your card portfolio.

Step 1/5: Current Cards
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Do you have any active credit cards?
[Yes] [No, start fresh]

→ User clicks: Yes

Great! What's the first card you'd like to add?
[Start typing card name...]
→ User types: "AMEX Platinum"
→ Autocomplete shows: "American Express Platinum Edge"

✓ AMEX Platinum Edge

When did you apply for this card?
[Calendar picker] OR [Type like "3 months ago"]
→ User types: "June 2024"
→ System parses: 2024-06-01

✓ Application date: June 1, 2024

Is this card still active?
[Active] [Cancelled]
→ User clicks: Active

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Review Your Card:
  Card: AMEX Platinum Edge
  Bank: American Express
  Applied: June 1, 2024
  Status: Active

[Looks good] [Edit] [Cancel]

→ User clicks: Looks good

✓ Card saved!

Add another card? [Yes] [No, I'm done]
```

**Technical Implementation**:
- React state machine for wizard flow
- Zod schema for validation
- Date parsing library (chrono-node or similar)
- Algolia or Fuse.js for fuzzy card search
- Local state (no backend until confirmation)
- Progressive enhancement (works without JS)

**Estimated Effort**: 2-3 days

---

### Phase 3: LLM Chatbot Everywhere (LATER)
**Status**: 💡 Future Enhancement
**Timeline**: After Phase 2 success + revenue validation
**Cost**: Medium (LLM API usage)

**Features**:
- Natural language chat interface
- Context-aware conversations
- Extract structured data from freeform text
- Handle complex queries: "Show me which cards I'm eligible for that have over 100k points"
- Chat widget available on all pages
- Quick actions: "Add my latest CommBank statement"
- Smart suggestions based on context

**User Flow Example**:
```
💬 Chat: Hi! I just got approved for the ANZ Rewards Black.
          Applied last week, got instant approval.
          Need to spend $4k in 3 months for 120k points.

🤖 Bot: Great! Let me add that for you.

     ┌─────────────────────────────────┐
     │ Extracted Information:          │
     │                                 │
     │ Card: ANZ Rewards Black         │
     │ Applied: ~Dec 24, 2024         │
     │ Approved: ~Dec 24, 2024        │
     │ Status: Active                  │
     │ Min Spend: $4,000              │
     │ Deadline: ~Mar 24, 2025        │
     │ Bonus: 120,000 points          │
     └─────────────────────────────────┘

     Is this correct?
     [Yes, save it] [No, let me edit]

💬 User: Yes, save it

🤖 Bot: ✓ ANZ Rewards Black added!
        I've set a reminder for your $4k spending deadline.

        You have 90 days to spend $4,000. Want to:
        • Track spending manually?
        • Upload a statement?
        • Set up transaction alerts?
```

**LLM Integration**:
- Claude API (preferred) or OpenAI
- Structured output with function calling
- Conversation history and context
- Fallback to wizard if extraction confidence low
- Cost controls: rate limiting, caching, smart routing

**Advanced Features**:
- Voice input (Web Speech API)
- Multi-turn conversations
- Learning from corrections
- Proactive suggestions
- Export conversation history

**Estimated Effort**: 1-2 weeks

---

## 🎨 Design Principles

### Extract + Confirm Pattern
**Never save without confirmation**

1. **Extract**: Parse user input into structured data
2. **Display**: Show what was understood (visual confirmation)
3. **Confirm**: User approves before database write
4. **Correct**: Easy editing if extraction wrong

**Example**:
```
User input: "I got the Westpac Altitude Black in March"

Extracted:
┌─────────────────────────────────┐
│ Card: Westpac Altitude Black    │ ← Matched from catalog
│ Bank: Westpac                   │ ← Auto-detected
│ Applied: March 2024             │ ← Parsed to 2024-03-01
│ Status: Active (assumed)        │ ← Inferred
└─────────────────────────────────┘

✓ Looks good? [Yes] [Edit] [Cancel]
```

### Progressive Disclosure
**Don't overwhelm with all fields at once**

Show fields as needed:
1. Essential: Card name, application date
2. If approved: Approval date, spending requirements
3. If cancelled: Cancellation date, eligibility countdown
4. Optional: Notes, custom tags

### Conversational Not Interrogative
**Make it feel like helping, not interviewing**

❌ Bad: "Enter card name"
✅ Good: "Which card would you like to add?"

❌ Bad: "Application date (YYYY-MM-DD)"
✅ Good: "When did you apply? (like 'last month' or 'June 15')"

### Forgiving Input
**Accept natural language, normalize behind scenes**

Date formats accepted:
- "last month" → Parse relative date
- "3 weeks ago" → Calculate date
- "June 2024" → 2024-06-01
- "15/6/24" → 2024-06-15
- "2024-06-15" → 2024-06-15

Card names accepted:
- Partial matches: "AMEX Plat" → American Express Platinum Edge
- Common abbreviations: "CBA Ult" → Commonwealth Bank Ultimate Awards
- Fuzzy matching: "Wesptac Altitude" → Westpac Altitude Black

---

## 📊 Success Metrics

### Phase 2 (Wizard)
- **Onboarding time**: <5 minutes average (vs 15 min forms)
- **Completion rate**: >80% (vs ~50% for long forms)
- **Error rate**: <5% (incorrect data entered)
- **User satisfaction**: >4/5 on post-onboarding survey

### Phase 3 (LLM Chatbot)
- **LLM API cost**: <$0.10 per user onboarding
- **Extraction accuracy**: >95% first-try
- **Natural language usage**: >60% prefer chat over forms
- **Feature adoption**: >30% use chat for ongoing tasks

---

## 🛠️ Technical Architecture

### Phase 2: Wizard Components

**Files to Create**:
```
src/
├── components/
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx       # Main wizard wrapper
│   │   ├── StepIndicator.tsx          # Progress UI
│   │   ├── steps/
│   │   │   ├── WelcomeStep.tsx        # Step 1: Intro
│   │   │   ├── CardSelectionStep.tsx  # Step 2: Pick card
│   │   │   ├── DateEntryStep.tsx      # Step 3: Dates
│   │   │   ├── StatusStep.tsx         # Step 4: Status
│   │   │   └── ReviewStep.tsx         # Step 5: Confirm
│   │   └── hooks/
│   │       ├── useWizardState.ts      # State machine
│   │       └── useDateParser.ts       # Natural date parsing
├── lib/
│   ├── parsers/
│   │   ├── dateParser.ts              # Natural language dates
│   │   └── cardMatcher.ts             # Fuzzy card matching
│   └── validation/
│       └── wizardSchemas.ts           # Zod validation per step
```

**State Machine**:
```typescript
type WizardStep =
  | 'welcome'
  | 'card-selection'
  | 'date-entry'
  | 'status-entry'
  | 'review'
  | 'complete'

interface WizardState {
  currentStep: WizardStep
  data: Partial<CardInput>
  errors: Record<string, string>
  canGoBack: boolean
  canGoForward: boolean
}

const wizardMachine = createMachine({
  initial: 'welcome',
  states: {
    welcome: {
      on: { NEXT: 'card-selection' }
    },
    'card-selection': {
      on: {
        NEXT: 'date-entry',
        BACK: 'welcome'
      }
    },
    // ... etc
  }
})
```

### Phase 3: LLM Integration

**Architecture**:
```
┌──────────────┐
│ User Message │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ Conversation Manager     │ ← Handles context, history
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ LLM API (Claude/GPT)     │ ← Extract structured data
│ - Function calling       │
│ - Structured outputs     │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Validation Layer         │ ← Zod + business rules
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Confirmation UI          │ ← Show extracted data
└──────┬───────────────────┘
       │
       ▼ (user approves)
┌──────────────────────────┐
│ Database Write           │
└──────────────────────────┘
```

**API Route**:
```typescript
// app/api/chat/extract/route.ts
export async function POST(req: Request) {
  const { message, context } = await req.json()

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      ...context,
      { role: "user", content: message }
    ],
    tools: [
      {
        name: "extract_card_data",
        description: "Extract credit card information",
        input_schema: CardExtractionSchema
      }
    ]
  })

  return NextResponse.json({
    extracted: response.tool_calls[0]?.input,
    confidence: calculateConfidence(response),
    needsClarification: response.stop_reason === 'end_turn'
  })
}
```

---

## 💰 Cost Analysis

### Phase 2: Wizard (Zero Ongoing Cost)
- **Development**: 2-3 days × $200/day = $400-600
- **Maintenance**: Minimal (standard React components)
- **Ongoing**: $0 (no external APIs)

### Phase 3: LLM Chatbot
- **Development**: 1-2 weeks × $200/day × 5 days = $1,000-2,000
- **LLM Costs**: ~$0.05-0.10 per onboarding
  - 100 users/month × $0.08 = $8/month
  - 1,000 users/month = $80/month
  - 10,000 users/month = $800/month
- **Break-even**: Need sufficient revenue to justify API costs

**Decision Point**: Build Phase 3 only if:
- Phase 2 wizard proves onboarding is still painful
- MRR > $2,000/month (LLM costs < 5% revenue)
- User feedback strongly requests natural language

---

## 📝 Implementation Checklist

### Phase 2: Wizard Onboarding

**Foundation** (Day 1):
- [ ] Create wizard state machine with XState or Zustand
- [ ] Build StepIndicator component
- [ ] Set up routing (/onboarding route)
- [ ] Create WelcomeStep component

**Core Steps** (Day 1-2):
- [ ] CardSelectionStep with fuzzy search
- [ ] DateEntryStep with natural language parsing
- [ ] StatusStep (active/cancelled/pending)
- [ ] ReviewStep with edit capability

**Polish** (Day 2-3):
- [ ] Add animations/transitions between steps
- [ ] Mobile responsiveness
- [ ] Keyboard navigation (Enter, Esc)
- [ ] Error handling and validation
- [ ] Success celebration (confetti!)
- [ ] Skip onboarding option for advanced users

**Testing**:
- [ ] E2E test full wizard flow
- [ ] Test natural date parsing edge cases
- [ ] Test card matching accuracy
- [ ] Test mobile UX
- [ ] User testing with 5 real churners

### Phase 3: LLM Chatbot

**Foundation** (Week 1):
- [ ] Set up Anthropic/OpenAI API integration
- [ ] Create chat UI component
- [ ] Build conversation manager
- [ ] Design extraction prompts

**Extraction** (Week 1):
- [ ] Implement structured output parsing
- [ ] Add confidence scoring
- [ ] Build confirmation UI
- [ ] Handle ambiguous cases

**Advanced** (Week 2):
- [ ] Multi-turn conversations
- [ ] Context awareness
- [ ] Proactive suggestions
- [ ] Voice input (optional)

**Cost Controls** (Week 2):
- [ ] Rate limiting per user
- [ ] Response caching
- [ ] Smart routing (use wizard for simple cases)
- [ ] Usage analytics

---

## 🎓 Learning & Iteration

### User Feedback Loop
1. **Track onboarding metrics** in analytics
2. **Record drop-off points** in wizard
3. **Collect qualitative feedback** post-onboarding
4. **A/B test** different question phrasings
5. **Iterate monthly** based on data

### Questions to Answer:
- Which steps cause most confusion?
- Where do users backtrack most?
- What dates/names fail to parse?
- Do users prefer wizard or skip to forms?
- Is natural language better than dropdowns?

---

## 🚀 Go-To-Market

### Phase 2 Launch
**Positioning**: "Add your cards in under 5 minutes"

**Marketing Copy**:
> "Skip the forms. Just tell us about your cards, and we'll handle the rest. Most users are tracking their portfolio in under 5 minutes."

### Phase 3 Launch
**Positioning**: "Your AI churning assistant"

**Marketing Copy**:
> "Chat with Reward Relay like you'd chat with a friend. 'I just got approved for ANZ Rewards Black' → Done. Your assistant handles the details."

---

## 📚 References

### Natural Date Parsing:
- **chrono-node**: https://github.com/wanasit/chrono
- **date-fns**: For date manipulation

### Fuzzy Matching:
- **Fuse.js**: Lightweight fuzzy search
- **flexsearch**: Fast full-text search

### LLM Integration:
- **Anthropic Claude**: Structured outputs, function calling
- **OpenAI GPT-4**: Alternative with JSON mode
- **Vercel AI SDK**: Unified interface for multiple LLMs

### State Machines:
- **XState**: Formal state machine library
- **Zustand**: Lightweight state management

---

**Document Status**: ✅ Complete
**Next Action**: Test MVP manually, validate core value, then build Phase 2 wizard
**Owner**: John Keto
**Review Date**: After 50+ signups (Week 10-12)
