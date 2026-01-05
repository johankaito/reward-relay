# 🎯 Reward Relay

**The Ultimate Australian Credit Card Churning Manager**

Reward Relay helps Australian credit card churners maximize sign-up bonuses while staying organized and compliant with the 12-month rule. Track your cards, monitor spending requirements, get timely reminders, and visualize your churning timeline—all in one place.

---

## 🌟 What is Credit Card Churning?

Credit card churning is the practice of strategically applying for credit cards to earn their sign-up bonuses (often worth $500-2000 in points), then cancelling them before the second annual fee. In Australia, most banks enforce a **12-month rule**: you must wait 12 months after cancelling a card from a bank before applying for another card from that bank to be eligible for bonus points again.

**Reward Relay** automates the complex task of tracking multiple cards, their lifecycles, spending requirements, and eligibility windows.

---

## ✨ Features

### 🏠 Dashboard
- **Active Cards Overview** - See all your active cards at a glance
- **Quick Stats** - Total points earned, active spend requirements
- **Card Status Tracking** - Applied, approved, active, cancelled states
- **Net Value Calculations** - Automatic calculation of (bonus points × $0.01) - annual fee

### 💳 Card Management
- **Card Catalog** - Browse Australian credit cards with details
- **Add to Portfolio** - Track cards you've applied for or activated
- **Edit & Delete** - Update card details, notes, and dates
- **Status Updates** - Mark cards as applied, approved, active, or cancelled

### 📊 Spending Tracker
- **Progress Bars** - Visual tracking of minimum spend requirements
- **Deadline Alerts** - Color-coded urgency (green = on track, orange = warning, red = urgent)
- **Manual Entry** - Add individual transactions
- **CSV Import** - Bulk upload bank statements (CommBank, ANZ, NAB, Westpac)
- **Auto-Categorization** - Transactions automatically categorized (groceries, dining, travel, fuel)
- **Spending Insights** - Track current spend vs. target to earn bonuses

### 📅 Visual Churning Calendar
- **Timeline View** - See your entire card journey from application to re-eligibility
- **Bank Grouping** - Cards grouped by bank (12-month rule is per bank)
- **Lifecycle Stages**:
  - Applied → Approved → Active → Cancelled → Eligible Again
- **Color-Coded Status**:
  - ✅ Green: Completed stages
  - 🟡 Orange: Pending/in progress
  - 🔵 Blue: Eligible to reapply
  - 🔴 Red: Cancelled (not yet eligible)
- **Countdown Timers** - Days/months until you can reapply per bank

### 📄 CSV Statement Upload
- **Drag & Drop** - Easy file upload interface
- **Multi-Bank Support**:
  - Commonwealth Bank (CommBank)
  - Australia and New Zealand Banking Group (ANZ)
  - National Australia Bank (NAB)
  - Westpac Banking Corporation
- **Smart Parsing** - Automatically detects bank format and extracts transactions
- **Category Assignment** - Transactions automatically categorized
- **Preview & Edit** - Review and adjust categories before saving
- **Batch Upload** - Upload entire statements at once

### 📜 History & Eligibility
- **Churn History** - Complete record of all churned cards
- **Eligibility Calculator** - Automatic tracking of 12-month windows per bank
- **Re-Application Dates** - Know exactly when you can apply again
- **Points Totals** - Track lifetime points earned across all cards

### 🔍 Card Comparison
- **Side-by-Side Analysis** - Compare multiple cards at once
- **Net Value Ranking** - Cards ranked by (bonus - annual fee)
- **Eligibility Filtering** - Only show cards you're eligible for
- **Recommendation System** - Smart scoring based on:
  - Your eligibility status
  - Net value
  - Spending requirements vs. your typical spend
  - Current portfolio diversity

### 📧 Email Reminders (Automated)
- **30-Day Reminder** - Heads up about upcoming cancellation
- **14-Day Warning** - Time to finalize spending requirements
- **7-Day Urgent Alert** - Last chance to cancel before second annual fee
- **Spending Progress** - Each email includes your current spend vs. target
- **Beautiful Templates** - Professional HTML emails with gradient designs

### 📈 Smart Features
- **12-Month Rule Enforcement** - Automatic per-bank eligibility tracking
- **Spend Window Tracking** - Know how long you have to meet spending requirements
- **Points Valuation** - Standard $0.01 per point valuation (customizable concept)
- **Application History** - Never lose track of when you applied for what

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Lucide Icons** - Modern icon set

### Backend
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - Secure authentication and user management
- **Row Level Security (RLS)** - Database-level security policies
- **Database Triggers** - Automatic spend calculation

### Services
- **Resend** - Transactional email delivery
- **Playwright** - Web scraping for card data
- **Docker** - Containerized scraper deployment

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account
- (Optional) Resend account for email reminders

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/johankaito/reward-relay.git
   cd reward-relay/app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_role_key

   # Email (Optional)
   RESEND_API_KEY=your_resend_api_key
   CRON_SECRET=random_secret_for_cron

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run database migrations**
   ```bash
   npx supabase link --project-ref your_project_ref
   npx supabase db push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

---

## 📖 User Guide

### First Time Setup

1. **Create an Account**
   - Sign up with email and password
   - Verify your email (Supabase handles this)

2. **Add Your First Card**
   - Go to Cards → Browse the catalog
   - Click "Add to Portfolio" on a card
   - Fill in:
     - Application date
     - Approval date (if approved)
     - Status (applied/active/cancelled)
     - Annual fee paid
     - Notes (optional)

3. **Set Up Spending Tracking**
   - Go to Spending
   - Click "Add Spend" on a card
   - Enter transaction details, OR
   - Upload your bank statement CSV

### Daily Usage

**Check Your Dashboard**
- See all active cards
- Review spending progress
- Check upcoming deadlines

**Track Spending**
- **Manual Entry**: Click "Add Spend" on any card
- **CSV Upload**:
  1. Go to Statements
  2. Select your card
  3. Drag & drop your CSV file
  4. Review categorization
  5. Click "Upload Transactions"

**View Timeline**
- Go to Calendar
- See your entire churning journey
- Check when you'll be eligible per bank

**Compare Cards**
- Go to Compare
- View net value rankings
- See which cards you're eligible for
- Get personalized recommendations

### When to Cancel a Card

Reward Relay helps you time this perfectly:

1. **Check Email Reminders**
   - 30 days before: Plan your cancellation
   - 14 days before: Ensure spending requirements met
   - 7 days before: Final reminder to cancel

2. **Check Spending Progress**
   - Go to Spending
   - Verify progress bar is at 100%
   - If not, make final purchases

3. **Cancel the Card**
   - Call the bank
   - Update card status to "Cancelled"
   - Enter cancellation date

4. **Track Eligibility**
   - Go to Calendar
   - See countdown to re-eligibility (12 months)
   - Get notified when you can apply again

---

## 🎯 Churning Strategy Tips

### Maximize Your Returns

1. **Start with High-Value Cards**
   - Look for cards with 100k+ bonus points
   - Use Compare page to find best net value

2. **Meet Spending Requirements**
   - Track with Spending feature
   - Upload statements regularly
   - Set reminders for deadlines

3. **Respect the 12-Month Rule**
   - Wait full 12 months per bank
   - Use Calendar to track eligibility
   - Plan applications in advance

4. **Diversify Across Banks**
   - Don't put all cards with one bank
   - Spread applications across different banks
   - Maximize concurrent cards

5. **Time Your Applications**
   - Apply when you have upcoming large expenses
   - Coordinate with travel plans
   - Use Calendar to plan pipeline

### Common Pitfalls to Avoid

❌ **Applying too soon** - You won't get the bonus (12-month rule)
❌ **Missing spending deadlines** - You'll forfeit bonus points
❌ **Keeping cards too long** - You'll pay unnecessary annual fees
❌ **Poor record-keeping** - You'll lose track of what you've done

✅ **Use Reward Relay** - All of these are handled automatically!

---

## 🗂️ Project Structure

```
app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── cards/              # Card management
│   │   ├── spending/           # Spending tracker
│   │   ├── statements/         # CSV upload
│   │   ├── calendar/           # Visual timeline
│   │   ├── history/            # Churn history
│   │   ├── compare/            # Card comparison
│   │   └── api/                # API routes
│   │       └── reminders/      # Email reminder cron
│   ├── components/             # React components
│   │   ├── cards/              # Card-specific components
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/                    # Utilities
│   │   ├── email/              # Email templates
│   │   └── supabase/           # Supabase client
│   └── types/                  # TypeScript types
│       └── database.types.ts   # Supabase generated types
├── supabase/
│   └── migrations/             # Database migrations
├── public/                     # Static assets
└── README.md                   # This file

scraper/                        # Separate scraper service
├── scraper.ts                  # Main scraper logic
├── Dockerfile                  # Container config
├── docker-compose.yml          # Orchestration
└── DEPLOYMENT.md               # Scraper deployment guide
```

---

## 🔐 Security & Privacy

### Your Data is Secure
- **Row Level Security (RLS)** - Users can only access their own data
- **Supabase Auth** - Industry-standard authentication
- **Encrypted Connections** - All data encrypted in transit
- **No Card Numbers Stored** - Only card metadata (bank, name, dates)
- **Self-Hosted Option** - Deploy to your own infrastructure

### Best Practices
- Use strong passwords
- Enable 2FA on your Supabase account
- Don't share your Supabase service key
- Regularly review your data

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin master
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables
   - Deploy!

3. **Set up Cron Jobs** (for email reminders)
   - Create `vercel.json`:
     ```json
     {
       "crons": [{
         "path": "/api/reminders/check",
         "schedule": "0 3 * * *"
       }]
     }
     ```

### Deploy Scraper to Coolify

See [scraper/DEPLOYMENT.md](../scraper/DEPLOYMENT.md) for detailed instructions.

---

## 🤝 Contributing

This is currently a personal project, but contributions are welcome!

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Running Tests

```bash
# Run Puppeteer test suite
pnpm tsx test-runner.ts once

# Run in watch mode
pnpm tsx test-runner.ts watch
```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- Australian churning community on Reddit and forums
- PointsHacks and other card comparison sites
- Next.js, Supabase, and all open-source libraries used

---

## 📞 Support

For issues, questions, or feature requests:
- Open a GitHub issue
- Email: john.g.keto+rewardrelay@gmail.com

---

## 🗺️ Roadmap

### ✅ Completed (MVP)
- [x] User authentication
- [x] Card management (add, edit, delete)
- [x] Spending tracker with progress bars
- [x] CSV statement upload
- [x] Visual churning calendar
- [x] Email reminders (30/14/7 days)
- [x] Card comparison
- [x] History & eligibility tracking

### 🔜 Coming Soon
- [ ] **Conversational onboarding wizard** - Add cards in <5 minutes with guided flow
- [ ] **AI chatbot assistant** - Natural language data entry and queries
- [ ] Mobile app (PWA or React Native)
- [ ] Points valuation optimizer
- [ ] Travel redemption calculator
- [ ] Premium features (Stripe integration)
- [ ] Application document storage
- [ ] Card recommendation AI
- [ ] Bank scraper for live card offers

### 💡 Ideas
- Multi-user households
- Points transfer tracking
- Annual fee alerts
- Credit score integration
- Referral link management

---

## 🧪 Testing

Comprehensive automated testing suite using Puppeteer for E2E validation.

### Test Strategy: Login-Only

**Philosophy**: We test our application features, not Supabase's authentication.

Tests use a **pre-created test user** and login-only approach:
- No signup testing (Supabase handles this)
- No need to toggle email confirmation settings
- Repeatable and reliable tests
- Works with production auth configuration

### One-Time Setup

**Create test user once** (manually):
1. Visit `http://localhost:3000/signup`
2. Sign up with: `john.g.keto+rewardrelay-test@gmail.com`
3. Password: `TestPass123!`
4. Confirm email if required

**Optional**: Add to `.env.local`:
```bash
TEST_EMAIL=john.g.keto+rewardrelay-test@gmail.com
TEST_PASSWORD=TestPass123!
```

### Running Tests

```bash
# Full comprehensive test suite (all 7 features)
pnpm test

# Quick smoke tests (critical paths only)
pnpm test:smoke

# Regression tests before committing
pnpm test:regression

# Watch mode for continuous testing during development
pnpm test:watch
```

For detailed testing documentation, see [TESTING.md](../docs/TESTING.md).

---

## 📊 Project Status

**Current Version**: MVP Beta (90% Complete)
**Status**: Production Ready
**Next Steps**: Deploy scraper, configure email service, beta testing

See [../docs/PROJECT_STATUS.md](../docs/PROJECT_STATUS.md) for detailed progress tracking.

---

Made with ❤️ for the Australian churning community

**Start maximizing your credit card rewards today!** 🚀