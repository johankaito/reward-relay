# REWARDIFY - COMPLETE BUILD SPECIFICATION
## LLM-Executable Technical Blueprint

**Purpose**: Complete technical specification for building Rewardify
**Audience**: AI coding assistants (Claude Code, ChatGPT, Cursor, etc.)
**Format**: Atomic, executable tasks with exact code and success criteria
**Timeline**: 8 weeks (10-15 hours/week)

**Last Updated**: 2025-12-17
**Version**: 1.0 - Complete Specification

---

## EXECUTIVE SUMMARY FOR AI AGENTS

You are building **Rewardify** - a web application that helps Australians optimize credit card churning.

**Core Features**:
1. Track credit cards (application dates, status)
2. Churning calendar (visual timeline)
3. Email reminders (before annual fees due)
4. Card comparison (which card to get next)
5. Spending optimizer (which card for which purchase)
6. Statement analysis (CSV upload + LLM categorization)

**Platform**: Next.js 14 web app (mobile-responsive)
**Timeline**: 8 weeks to launch
**Quality**: Must be polished (not just functional)

**Your Mission**: Build this following the specifications below, ensuring quality at every step.

---

## PREREQUISITES

Before starting, verify:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] Git installed and configured
- [ ] Supabase account created (supabase.com)
- [ ] VS Code or preferred editor
- [ ] Terminal access
- [ ] Working directory: `~/gits/src/github.com/johankaito/`

**If any missing, install before proceeding.**

---

## TECH STACK (Exact Versions)

```json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/auth-ui-react": "^0.4.7",
    "@supabase/auth-ui-shared": "^0.1.8",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.439.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "date-fns": "^3.6.0",
    "recharts": "^2.12.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "resend": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.2.0"
  }
}
```

