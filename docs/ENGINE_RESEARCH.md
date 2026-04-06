# Engine Research — AU Credit Card Cooling Periods & Compliance
**Date**: April 2026
**Purpose**: Pre-launch verification of cooling period data accuracy and legal compliance requirements for Reward Relay's recommendation engine.
**Researcher note**: This document draws on official bank T&C PDFs, ASIC guidance, and secondary compiled sources (Australian Frequent Flyer, Point Hacks, Finder, Canstar). Where bank PDFs were not directly extractable, secondary sources are cross-referenced and confidence levels are stated.

---

## Bank Cooling Periods (Official Sources)

| Bank | Period | Scope | Confidence | Source |
|------|--------|-------|------------|--------|
| American Express AU | 18 months | Per bank (any Amex AU card product) | High | americanexpress.com/en-au (official T&C text extracted via search) |
| ANZ | 24 months | Per bank family (Frequent Flyer + Rewards combined) | High | anz.com.au official T&C; confirmed via AFF community thread |
| Westpac | 24 months | Per bank family (Westpac, St.George, Bank of Melbourne, BankSA) | High | westpac.com.au official T&C |
| St.George | 24 months | Shared with Westpac group | High | stgeorge.com.au official T&C; mirrors Westpac group policy |
| Commonwealth Bank | 18 months | Per bank (any Awards card) | High | commbank.com.au; changed from 12 to 18 months effective 3 Dec 2024 |
| NAB | 24 months | Per bank (Qantas Rewards cards) | High | nab.com.au official T&C |
| Bankwest | 24 months | Per product (More Mastercard family) | Medium-High | bankwest.com.au T&C; Bankwest is a CommBank division but maintains its own 24-month period distinct from CommBank's 18 months |
| HSBC Australia | 12 months | Per bank (any principal HSBC AU card) | Medium-High | hsbc.com.au; Star Alliance card has an 18-month per-product exception |
| Virgin Money AU | None stated | Per product | Low-Medium | No official cooling period in T&C; community reports suggest discretionary Citi issuer risk policies apply |
| Macquarie | Not publicly stated | Unknown | Low | Macquarie cards restricted to home loan / business bank customers; no public bonus exclusion T&C found |

### Detailed Findings Per Bank

---

#### 1. American Express Australia

**Cooling Period**: 18 months from the date any Amex AU card was held.

**Scope**: Per bank. Applies across all card products issued by American Express Australia Limited.

**Official Quote (from search result, sourced from americanexpress.com/en-au)**:
> "Card Members who currently hold or who have previously held any Card product issued by American Express Australia Limited in the past 18 months are ineligible for this offer."

**Notes**: The 18-month exclusion applies broadly — holding any Amex AU product (including corporate or companion cards) resets the clock. Supplementary cardholders are treated differently and may still be eligible. The official Membership Rewards Terms & Conditions page at https://www.americanexpress.com/en-au/rewards/membership-rewards/terms is the canonical source.

**Confidence**: High. Official T&C language retrieved directly via site: search.

---

#### 2. ANZ

**Cooling Period**: 24 months (increased from 12 months in 2025).

**Scope**: Per bank family. ANZ changed the exclusion to cover **both** the Frequent Flyer and Rewards card families jointly — previously, holding a Rewards card did not disqualify you from a Frequent Flyer card bonus and vice versa.

**Official Quote (from anz.com.au T&C)**:
> "You are not eligible for this offer if you currently hold or have held an ANZ Frequent Flyer or ANZ Rewards credit card in the last 24 months."

**Source URLs**:
- https://www.anz.com.au/personal/credit-cards/frequent-flyer-black/
- https://www.anz.com.au/content/dam/anzcomau/documents/pdf/anz-qantas-frequent-flyer-terms-and-conditions.pdf
- https://www.anz.com.au/content/dam/anzcomau/documents/pdf/anz-ff-reward-tc.pdf
- Community confirmation: https://www.australianfrequentflyer.com.au/community/threads/anz-makes-it-harder-to-access-sign-up-bonus-points.117960/

**Notes**: This is a materially important recent change. Any data source capturing ANZ's old 12-month period is outdated. Supplementary cardholders (not primary) may still be eligible. The date of approval (disclosure date in Letter of Offer) is the reference point.

**Confidence**: High.

---

#### 3. Westpac

**Cooling Period**: 24 months (extended from 12 months in late 2024).

**Scope**: Per bank family — includes Westpac, St.George, Bank of Melbourne, and BankSA (all Westpac Group brands are treated as a single family).

**Official Quote (from westpac.com.au T&C)**:
> "Existing Westpac customers who currently hold an Earth Classic, Earth Platinum, Earth Platinum Plus, Earth Black, Altitude Classic, Altitude Platinum or Altitude Black credit card, or who have held one in the last 24 months, or Credit Card Product Switches, upgrades or Westpac group staff are not eligible for this offer."

**Source URLs**:
- https://www.westpac.com.au/personal-banking/credit-cards/reward/altitude-rewards-platinum/
- https://www.westpac.com.au/content/dam/public/wbc/documents/pdf/pb/credit-cards/westpac-altitude-terms-and-conditions.pdf

**Notes**: The Altitude Black offer has a higher spend threshold ($12k/12 months vs $3k/90 days for Platinum), but the 24-month exclusion applies across the board for all Westpac group brands.

**Confidence**: High.

---

#### 4. St.George

**Cooling Period**: 24 months. Shared Westpac Group policy.

**Scope**: Per bank family — same as Westpac above; holding a card from St.George, Bank of Melbourne, BankSA, or Westpac within 24 months disqualifies you from any other brand in the group.

**Official Quote (from stgeorge.com.au T&C)**:
> "Existing customers who currently hold an Amplify, Amplify Platinum or Amplify Signature card issued by St.George, Bank of Melbourne or BankSA, or who have held one in the last 24 months, or Credit Card Product Switches, upgrades or Westpac group staff are not eligible for this offer."

**Source URLs**:
- https://www.stgeorge.com.au/personal/credit-cards/rewards/amplify-rewards-platinum
- https://www.stgeorge.com.au/personal/credit-cards/rewards/amplify-signature

**Notes**: St.George's T&C explicitly names the cross-brand disqualification, confirming that the Westpac Group family exclusion is enforced at the card-agreement level, not merely as an internal policy.

**Confidence**: High.

---

#### 5. Commonwealth Bank

**Cooling Period**: 18 months (changed from 12 months effective 3 December 2024).

**Scope**: Per bank. Applies to all CommBank Awards card types (Ultimate Awards, Smart Awards, Awards).

**Official Quote (from commbank.com.au T&C)**:
> "To be eligible to receive 60,000 CommBank Awards points and $300 in Travel Credits via Travel Booking on a new Ultimate Awards card, you must spend at least $9,000 on eligible purchases within the first 90 days from the date your card is activated."

**Exclusion clause (from compiled sources — commbank.com.au T&C)**:
> "Customers are now ineligible for bonus points if they currently hold, or have held, any activated Awards card types in the 18 months prior as a primary cardholder or if they switch from other card types."

**Source URLs**:
- https://www.commbank.com.au/credit-cards/credit-cards-offers.html
- https://www.commbank.com.au/personal/apply-online/download-printed-forms/CommBankAwards-Ts&Cs.pdf
- Change history: https://www.australianfrequentflyer.com.au/community/threads/commbank-increases-sign-up-bonus-exclusion-period-to-18-months.116167/

**Notes**: CommBank and Bankwest are separate entities for exclusion period purposes despite Bankwest being a CommBank division. The 3 December 2024 change date is important — data predating that will show 12 months incorrectly.

**Confidence**: High.

---

#### 6. NAB

**Cooling Period**: 24 months.

**Scope**: Per bank (NAB Qantas Rewards card family). The search results confirmed this applies to all personal NAB Qantas Rewards credit cards jointly.

**Official Quote (from nab.com.au T&C)**:
> "Bonus points are not available to customers who currently hold, or have held, any personal NAB Qantas Rewards Credit Card in the last 24 months."

**Source URLs**:
- https://www.nab.com.au/personal/credit-cards/qantas-rewards/nab-qantas-rewards-signature-card
- https://www.nab.com.au/content/dam/nab/documents/terms-and-conditions/banking/qantas-rewards-tcs.pdf

**Notes**: The Signature card (100k + 30k retention bonus) and Premium card (60k + 40k retention bonus) both carry the 24-month exclusion. NAB Rewards cards (non-Qantas) may have a separate policy — the confirmed exclusion above is specifically for the Qantas Rewards family.

**Confidence**: High.

---

#### 7. St.George (see entry 4)

Covered above as part of the Westpac Group.

---

#### 8. Bankwest

**Cooling Period**: 24 months.

**Scope**: Per product family (More Mastercard). Note: Bankwest is a division of CommBank but operates its own exclusion period (24 months) that is stricter than CommBank's current 18-month period.

**Official Quote (from bankwest.com.au T&C)**:
> "Eligibility is restricted to new More Classic Mastercard customers who both apply for and open a new More Classic Mastercard on or after 3 November 2025 ... and have not held a More Mastercard account in the last 24 months."

**Source URLs**:
- https://www.bankwest.com.au/credit-cards/rewards
- https://www.bankwest.com.au/content/dam/bankwest/documents/legal-library/PDS_20080414-092046.pdf

**Notes**: Bankwest is narrowing its credit card offering (Bankwest exited the retail credit card market for new customers in 2023, but existing customers can still access some products). Verify whether Bankwest is still issuing new More Mastercard accounts as of 2026. The 24-month exclusion applies within the More Mastercard family specifically; no evidence found that a prior CommBank card triggers Bankwest exclusion or vice versa.

**Confidence**: Medium-High. Official T&C language retrieved; Bankwest's retail card strategy is in flux.

---

#### 9. HSBC Australia

**Cooling Period**: 12 months (standard). 18 months for specific cards (e.g., Star Alliance card — per-card rule).

**Scope**: Per bank (any principal HSBC AU card). Supplementary cardholders may still be eligible.

**Official Quote (from hsbc.com.au T&C)**:
> "Existing HSBC customers transferring from another HSBC credit card or customers who have held a HSBC Platinum Qantas Credit Card within the last 12 months are ineligible for this offer."

**Source URLs**:
- https://www.hsbc.com.au/credit-cards/products/platinum-qantas/
- https://www.hsbc.com.au/content/dam/hsbc/au/docs/pdf/premier-qantas-terms.pdf
- https://www.hsbc.com.au/content/dam/hsbc/au/docs/credit-cards/platinum-qantas/offers/2020-apr-rewards-terms-and-conditions.pdf

**Notes**: HSBC AU is an outlier — most major banks moved to 18–24 months but HSBC's standard period remains 12 months as of the most recent information available (April 2026). The Star Alliance card carries an 18-month per-product exclusion per community reports. Recommend checking the specific product's T&C at the time of any recommendation, as HSBC may align with industry peers.

**Confidence**: Medium-High. Official T&C language found for Platinum Qantas; Star Alliance variant sourced from secondary compilation (Australian Frequent Flyer).

---

#### 10. Virgin Money Australia

**Cooling Period**: None formally stated in T&C.

**Official Quote**: No cooling period language found in official Velocity Rewards Program Terms & Conditions or on the Virgin Money credit card product pages.

**Source URLs**:
- https://virginmoney.com.au/content/dam/virginmoney/vma-downloads/credit-cards/velocity-rewards-program-terms-and-conditions.pdf
- https://community.pointhacks.com/t/is-there-a-cooling-period-before-reapplying-for-a-virgin-money-credit-card/22646

**Notes**: Virgin Money credit cards are issued by Citibank/NAB (Virgin Money Australia's banking products are issued through a partnership arrangement). Community reports indicate that Citi's internal credit risk assessment — not a formal Virgin Money cooling period — is what governs reapplication. One community member reported successfully reapplying after only 3 months; the Point Hacks moderator found no mandatory cooling period in the T&C but recommended waiting "at least 4 months" as a practical matter. The card is listed as requiring "Offer not available to existing Virgin Money Credit Card holders (including upgrades)" but does not specify a historical period. **Treat this as: no formal exclusion period, but outcome is risk-based approval.**

**Confidence**: Low-Medium. No official T&C quote available. Data reflects community intelligence.

---

#### 11. Macquarie

**Cooling Period**: Not publicly stated.

**Official Quote**: None found. Macquarie's credit card pages do not contain welcome bonus offers or exclusion period language. The Black card page states only income eligibility criteria (min $70k p.a.) and requires being an existing Macquarie home loan customer or Business Bank client.

**Source URLs**:
- https://www.macquarie.com.au/everyday-banking/credit-cards/black-rewards.html
- https://www.macquarie.com.au/assets/bfs/documents/personal-direct/credit-cards/macquarie-black-rewards-terms-and-conditions.pdf

**Notes**: Macquarie's cards are not widely distributed (restricted to home loan customers); welcome bonus sign-up offers appear minimal or non-existent as of April 2026. The rewards program is ongoing earn-based (e.g., "up to $94 in gift cards when you spend $10,000/month") rather than a one-time sign-up bonus. **Recommendation: exclude Macquarie from the cooling period tracking engine until specific bonus offers are confirmed.**

**Confidence**: Low. No cooling period data found; product may not have a conventional sign-up bonus.

---

## Financial Advice Disclaimer Requirements

### ASIC Position on Credit Card Comparison Sites

Under Part 7.7 of the Corporations Act 2001, the key distinction is:

**Factual Information** (no AFSL required): Objective, verifiable information about a product — e.g., annual fee, earn rate, interest rate, bonus points amount. This is what comparison tables provide.

**General Advice** (AFSL or Authorised Representative status required): A recommendation or opinion that is intended to influence a person's decision, but does not take into account that person's individual circumstances. Credit card "best card" lists, scoring, and rankings that recommend products fall into this category.

**Personal Advice** (AFSL required + best interests duty): Advice that takes into account the specific client's objectives, financial situation, or needs — e.g., "based on your spending and travel goals, Card X is best for you."

Key regulatory references:
- **RG 244** (Giving information, general advice and scaled advice): Defines the factual/general/personal boundary. Available at https://www.asic.gov.au/regulatory-resources/find-a-document/regulatory-guides/rg-244-giving-information-general-advice-and-scaled-advice/
- **RG 36** (Licensing: Financial product advice and dealing): https://www.asic.gov.au/regulatory-resources/find-a-document/regulatory-guides/rg-36-licensing-financial-product-advice-and-dealing/
- **ASIC Corporations (Financial Services Guide, General Advice Warning and Advertising Related Relief) Instrument 2025/234**: The most recent instrument governing how the general advice warning must be presented.

A credit card recommendation engine that uses the user's card history to suggest which cards they should apply for next is most likely providing **general advice** (because it is making a recommendation) or potentially **personal advice** (if it considers their specific transaction history, spending goals, or travel plans). Reward Relay's engine — which tracks a user's own cards and recommends next cards based on spend patterns and points goals — sits firmly in the general-to-personal advice continuum and requires at minimum general advice compliance.

---

### Disclaimer Language from AU Comparison Sites

#### Canstar (AFSL and Australian Credit Licence No. 437917)

**Verbatim disclaimer** (extracted from https://www.canstar.com.au/credit-cards/):

> "This advice is general and has not taken into account your objectives, financial situation or needs. Consider whether this advice is right for you. Consider the product disclosure statement and target market determination before making a purchase decision. Canstar provides an information service. It is not a credit provider, and in giving you information about credit products Canstar is not making any suggestion or recommendation to you about a particular credit product. Research provided by Canstar Research AFSL and Australian Credit Licence No. 437917."

Additional notice:
> "This advice is general and has not taken into account your objectives, financial situation or needs. Consider whether this general financial advice is right for your personal circumstances."

Canstar also discloses referral fee arrangements: "Canstar may earn referral fees from Online Partners."

#### Finder (ACL 385509; Corporate Authorised Representative 432664 of Advice Evolution Pty Ltd AFSL 342880)

Finder's licensing structure is layered:
- Provides factual information and general advice on financial products as **Corporate Authorised Representative (432664)** of Advice Evolution Pty Ltd AFSL 342880
- Provides general advice on credit products under its own **Credit Licence ACL 385509**
- Is a **Corporate Authorised Representative** of Countrywide Insurance Group Pty Limited (ABN 49 625 733 539 AFSL 511363) for general insurance

Finder states: "Finder live tracks and crunches the data on 250+ cards every day."

Their standard disclaimer (sourced from search results referencing finder.com.au):
> "The information on this page is general in nature and has been prepared without considering your objectives, financial situation or needs. You should consider whether the information provided and the nature of the credit card product is suitable for you and seek independent financial advice if necessary."

Finder also notes its comparison service does not include all providers or all products in the market, and discloses commercial relationships with featured providers.

#### Point Hacks

Point Hacks does not appear to hold its own AFSL. Its content is structured as editorial/journalism. Their general disclaimer language (sourced from community posts and article footers):
> "Point Hacks' information may be regarded as general advice, and personal objectives, needs or financial situations were not taken into account when preparing this information. Readers should consider the appropriateness of any general advice provided, having regard to their own objectives, financial situation and needs before acting on it."

Point Hacks earns revenue from credit card referrals (affiliate/referral arrangements). It does not hold an AFSL and structures its content as editorial rather than financial advice. This is a higher-risk approach that relies on the "factual information" characterisation for most content.

---

### Recommended Disclaimer for Reward Relay

Based on the research above, the following disclaimer language should be displayed prominently on all pages where card recommendations are made, and in the app onboarding flow:

---

**Recommended Disclaimer Text:**

> **General Advice Warning**
>
> The information provided by Reward Relay is general in nature and does not take into account your personal objectives, financial situation, or needs. Before acting on any recommendation or applying for a credit card, you should consider the appropriateness of the information having regard to your own circumstances, and review the relevant Product Disclosure Statement (PDS) and Target Market Determination (TMD) for any product you are considering.
>
> Reward Relay does not hold an Australian Financial Services Licence (AFSL). The card data displayed, including bonus points, annual fees, earn rates, and eligibility criteria, is sourced from publicly available information and may not reflect the most current terms. Always verify current offers and eligibility directly with the card issuer before applying.
>
> Reward Relay may receive referral compensation when you apply for a credit card through a link on this platform. This may influence which cards are featured or how they are ranked. For a full list of commercial relationships, see our [Disclosure Policy].
>
> This is not personal financial advice. If you require personal financial advice, please consult a licensed financial adviser.

---

**Placement requirements**:
- Display on every card recommendation page (sticky footer or inline above CTA buttons)
- Include in app onboarding/terms acceptance flow
- Display on the `/recommendations`, `/flights`, `/compare`, and `/cards` routes
- Display in any email or push notification containing a card recommendation

---

### AFSL Requirement Assessment

**Does Reward Relay need an AFSL?**

**Current answer: Probably not, but the risk profile is elevated.**

Under ASIC's framework, an AFSL is not required to provide factual information. It IS required to provide general or personal advice about financial products (which includes credit cards).

Reward Relay's recommendation engine goes beyond factual information — it suggests specific cards based on a user's situation. This is at minimum **general advice** and potentially **personal advice** (if it considers their specific transaction history and financial goals, which it does).

**Options to manage this risk**:

1. **Do nothing, rely on "factual information" characterisation**: Highest legal risk. Not recommended given the engine's personalised recommendations.

2. **Become a Corporate Authorised Representative (CAR)**: Reward Relay can become a CAR under an existing AFSL holder's licence (similar to Finder's arrangement with Advice Evolution Pty Ltd). This is the most common path for comparison/fintech apps. Cost is typically $5,000–$15,000 p.a. for a CAR arrangement plus legal/compliance costs.

3. **Apply for own AFSL**: Full AFSL application takes 6–12 months and costs $50,000–$150,000+ in setup. Not practical for pre-launch stage.

4. **Structure as factual information only**: Remove personalised recommendations, replace with comparison tables only, and ensure no "you should apply for X" language. This significantly limits product differentiation.

**Recommended path**: Pursue a Corporate Authorised Representative arrangement before the community launch. In the interim, deploy the disclaimer above and avoid language that constitutes personal advice (do not say "we recommend this card for you based on your spending" — instead say "cards that match these criteria" or "cards frequently chosen by users with similar profiles").

**Also note**: Credit card comparison requires compliance with the **National Credit Act** (NCA) and **National Consumer Credit Protection Act 2009** as well as the Corporations Act. The comparison rate disclosure rules under the NCA apply when advertising fixed-term credit. A licensed credit representative arrangement (Australian Credit Licence) may also be required if Reward Relay facilitates applications.

---

## Data Freshness Standards

### Industry Practice

| Platform | Update Frequency | Method | Source |
|----------|-----------------|--------|--------|
| Finder | Daily (250+ cards) | Internal data team | finder.com.au (search result: "Finder live tracks and crunches the data on 250+ cards every day") |
| Canstar | Regular (frequency not publicly disclosed) | Canstar Research team; annual Star Ratings reviews | canstar.com.au editorial policy |
| Point Hacks | Ad hoc / editorial | Manual editorial updates triggered by bank announcements | pointhacks.com.au |
| Australian Frequent Flyer | Ad hoc / editorial | Community + editorial team | australianfrequentflyer.com.au |

Key industry observation: **Finder is the data freshness benchmark** — daily data updates across 250+ cards. Canstar publishes annual Star Ratings but updates underlying data on an ongoing basis. Editorial sites (Point Hacks, AFF) update on a news-cycle basis — typically within days of a bank announcement but not automated.

The rapid changes in exclusion periods in 2024–2025 (multiple banks changing within months) demonstrate that **welcome bonus terms are among the most volatile data points** and can change with little public notice. Cooling period changes observed in 2024–2025:
- CommBank: 12 → 18 months (December 2024)
- Westpac Group: 12 → 24 months (late 2024)
- ANZ: 12 → 24 months (2025)

---

### CDR / Open Banking Coverage of Credit Cards

**What CDR covers**: Australia's Consumer Data Right (CDR) mandates banks to make **Product Reference Data (PRD)** available via unauthenticated public APIs. This includes:
- Interest rates and fees
- Eligibility criteria (general)
- Card features and product descriptions
- Earn rates (where structured)

**What CDR does NOT reliably cover**:
- Time-limited welcome bonus offers (these are promotional, not part of permanent product data)
- Exclusion/cooling period terms (buried in T&C PDFs, not in structured PRD)
- Current vs. expired offer states

**CDR API endpoints**:
- `GET /banking/products` — list all products
- `GET /banking/products/{productId}` — product detail

These APIs are unauthenticated and publicly accessible. A demo app and payload viewer exist at https://obawv.app/ and the standards at https://consumerdatastandardsaustralia.github.io/standards/

**CDR rollout timeline relevant to credit cards**:
- Major banks (Big 4): CDR banking live since 2020
- Non-major ADIs: live since 2021
- Non-bank lenders: Version 8 Rules extend CDR to non-bank lenders from **July 2026**

**Key limitation**: The CDR PRD APIs provide baseline product features but are **not suitable as the sole data source for a welcome bonus / exclusion period tracking engine**. The promotional T&C that govern sign-up bonuses are not standardised in CDR. CDR consumer data sharing (with consent) would provide transaction data but not product eligibility rules.

---

### Recommended Refresh Cadence for Reward Relay

| Data Type | Recommended Refresh | Rationale |
|-----------|--------------------|-----------| 
| Welcome bonus points amounts | Weekly | Offers change frequently; Point Hacks/AFF cover changes quickly |
| Annual fees | Monthly | Relatively stable but do change |
| Earn rates | Monthly | Change with RBA interchange reform; more volatile from Oct 2026 |
| Cooling/exclusion periods | Monthly + event-driven | Changed 3× in 12 months (2024–2025); monitor bank T&C pages |
| Spend requirements for bonus | Weekly | Can be adjusted per promotional cycle |
| Card availability / discontinuation | Weekly | Banks discontinue cards with limited notice |

**Recommended data architecture**:
1. Use CDR PRD APIs as the baseline for fees, rates, and product IDs
2. Augment with manually curated T&C data for exclusion periods (CDR does not cover this)
3. Subscribe to Point Hacks and AFF RSS/newsletter for event-driven updates
4. Consider a Finder API partnership or data licensing arrangement for daily refresh coverage
5. Display a "data verified as of [date]" label on all card data and T&C fields; link to the official bank T&C PDF

---

## Automation & Data Extraction

### Feasibility of Automated T&C Extraction

**Technical feasibility**: Moderate. Bank T&Cs are typically published as:
- HTML product pages (scrapeable, but structure varies per bank)
- PDF documents linked from product pages (extractable with PDF parsing tools, but often image-based scans)
- Dynamic JavaScript-rendered pages (harder to scrape, requires headless browser)

**LLM/AI extraction**: Feasible for unstructured T&C text. An LLM can be prompted to extract structured fields (cooling period, scope, effective date) from a T&C PDF. Accuracy varies — always requires human review pass. Key challenge is detecting when a T&C has changed (requires version diffing).

**Reliability**: Low without validation. Bank T&C wording is precise; LLM extraction can hallucinate or misinterpret "in the last 24 months" vs. "24 calendar months." Manual verification of extracted cooling periods is essential.

---

### Robots.txt / Legal Considerations

**Australian legal framework for web scraping**:

1. **Copyright Act 1968 (Cth)**: Bank T&Cs contain original text that may be protected. Short factual extracts (fees, rates) are lower risk; verbatim reproduction of entire T&C documents is higher risk.

2. **Breach of contract**: Banks' website Terms of Use typically prohibit automated scraping. Violating these terms may constitute breach of contract.

3. **Criminal Code Act 1995 (Cth)**: Automated scraping that overrides anti-bot mechanisms (robots.txt, CAPTCHAs) could constitute unauthorised access to computer data.

4. **Privacy Act 1988 (Cth)**: Collecting personal information via scraping raises privacy issues, though T&C text is not personal information.

**CDR as the authorised alternative**: The CDR PRD APIs are explicitly designed for third-party consumption of bank product data and carry no scraping legal risk. For data that CDR covers, using the CDR API is always preferred over scraping.

**Screen scraping review**: Treasury's 2023 discussion paper on screen scraping flagged its risks, and the CDR framework is intended to replace screen scraping for consumer data. For product data, CDR PRD is the authorised channel.

**Source**: https://treasury.gov.au/sites/default/files/2023-08/c2023-436961-dp.pdf

---

### Recommended Approach for Reward Relay

**Tiered data sourcing strategy**:

1. **Layer 1 — CDR PRD APIs (authorised, unauthenticated)**: Use for base product data (fees, rates, product IDs). No legal risk. Start here for the Big 4 and major ADIs.

2. **Layer 2 — Manual T&C curation**: Assign a data steward role to manually check cooling period terms monthly against official bank T&C PDFs. Store canonical T&C quotes with effective dates and source URLs in the Supabase database. This is the only reliable method for exclusion period data given CDR coverage gaps.

3. **Layer 3 — Aggregator monitoring**: Use Point Hacks and AFF editorial updates as an early warning system for T&C changes. Set up RSS feeds or email alerts. When a change is reported, trigger a manual verification against the bank's official page.

4. **Layer 4 — LLM-assisted extraction (future)**: Build a pipeline to fetch bank T&C PDFs periodically, run LLM extraction of structured fields, diff against stored values, and flag changes for human review. Do not trust LLM output without human sign-off for cooling period data specifically.

5. **Do NOT**: Scrape bank websites programmatically for T&C text. The legal risk and reliability issues outweigh the benefits given the low volume of banks (10 primary banks) and the availability of CDR PRD.

**Data table recommendation for Supabase**:

```sql
CREATE TABLE card_tc_cooling_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  card_family text,
  cooling_period_months integer,
  scope text CHECK (scope IN ('per_card', 'per_bank', 'per_bank_family')),
  official_quote text,
  source_url text,
  effective_date date,
  verified_date date NOT NULL,
  verified_by text,
  confidence text CHECK (confidence IN ('high', 'medium_high', 'medium', 'low')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Gaps & Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| ANZ exclusion period data in Reward Relay is still 12 months (old) | Critical | Update to 24 months immediately. Old data will cause incorrect eligibility calculations. |
| CommBank exclusion period data is 12 months (pre-Dec 2024) | Critical | Update to 18 months. Change effective 3 Dec 2024. |
| Virgin Money has no formal cooling period — engine may incorrectly flag or clear users | Medium | Store as "none stated / discretionary" and surface the caveat in UI. Do not claim users are eligible. |
| Macquarie has no structured welcome bonus — engine may attempt to track non-existent offers | Low-Medium | Flag as "restricted distribution, no standard sign-up bonus" in card data. |
| AFSL/general advice compliance gap before launch | High | Deploy disclaimer immediately. Pursue CAR arrangement before community launch. |
| CDR PRD APIs do not include promotional T&C / cooling periods | Medium | Do not use CDR as sole source for this data; maintain manual T&C curation layer. |
| RBA interchange reform (Oct 2026) will reduce earn rates and change bonus values | Medium | Build earn rate data with version/effective date so changes can be tracked. Warn users of impending changes. |
| Bank T&C PDFs behind authentication or image-only (not text-extractable) | Medium | Fall back to HTML page scraping or manual entry; LLM cannot reliably extract from image PDFs. |
| Bankwest retail card market exit — product may no longer be issued to new customers | Medium | Verify Bankwest More Mastercard availability for new customers before including in recommendation engine. |
| HSBC exclusion period is 12 months but may increase to align with industry | Low-Medium | Monitor HSBC T&C; flag in data with a "watch" status. |
| Westpac group family exclusion is cross-brand — engine must detect Westpac/St.George/BOM/BankSA as one family | High | Implement bank_family grouping in the engine; a user who held a Westpac card cannot be recommended a St.George card within 24 months. |

---

## Sources

### Official Bank T&C Sources
- American Express AU: https://www.americanexpress.com/en-au/rewards/membership-rewards/terms
- ANZ Frequent Flyer Black: https://www.anz.com.au/personal/credit-cards/frequent-flyer-black/
- ANZ Frequent Flyer T&C PDF: https://www.anz.com.au/content/dam/anzcomau/documents/pdf/anz-qantas-frequent-flyer-terms-and-conditions.pdf
- ANZ Rewards T&C PDF: https://www.anz.com.au/content/dam/anzcomau/documents/pdf/anz-ff-reward-tc.pdf
- Westpac Altitude Terms PDF: https://www.westpac.com.au/content/dam/public/wbc/documents/pdf/pb/credit-cards/westpac-altitude-terms-and-conditions.pdf
- Westpac Altitude Platinum: https://www.westpac.com.au/personal-banking/credit-cards/reward/altitude-rewards-platinum/
- Westpac Altitude Black: https://www.westpac.com.au/personal-banking/credit-cards/reward/altitude-rewards-black/
- CommBank Awards T&C PDF: https://www.commbank.com.au/personal/apply-online/download-printed-forms/CommBankAwards-Ts&Cs.pdf
- CommBank Ultimate Awards: https://www.commbank.com.au/credit-cards/ultimate.html
- NAB Qantas Rewards T&C PDF: https://www.nab.com.au/content/dam/nab/documents/terms-and-conditions/banking/qantas-rewards-tcs.pdf
- NAB Qantas Rewards Signature: https://www.nab.com.au/personal/credit-cards/qantas-rewards/nab-qantas-rewards-signature-card
- St.George Amplify Rewards Platinum: https://www.stgeorge.com.au/personal/credit-cards/rewards/amplify-rewards-platinum
- St.George Amplify Signature: https://www.stgeorge.com.au/personal/credit-cards/rewards/amplify-rewards-signature
- Bankwest More Mastercard T&C PDF: https://www.bankwest.com.au/content/dam/bankwest/documents/legal-library/PDS_20080414-092046.pdf
- Bankwest Rewards Credit Card: https://www.bankwest.com.au/credit-cards/rewards
- HSBC Platinum Qantas: https://www.hsbc.com.au/credit-cards/products/platinum-qantas/
- HSBC Qantas T&C PDF: https://www.hsbc.com.au/content/dam/hsbc/au/docs/credit-cards/platinum-qantas/offers/2020-apr-rewards-terms-and-conditions.pdf
- HSBC Premier World Mastercard Qantas T&C: https://www.hsbc.com.au/content/dam/hsbc/au/docs/pdf/premier-qantas-terms.pdf
- Virgin Money Velocity Rewards T&C PDF: https://virginmoney.com.au/content/dam/virginmoney/vma-downloads/credit-cards/velocity-rewards-program-terms-and-conditions.pdf
- Macquarie Black Credit Card: https://www.macquarie.com.au/everyday-banking/credit-cards/black-rewards.html
- Macquarie Rewards T&C PDF: https://www.macquarie.com.au/assets/bfs/documents/personal-direct/credit-cards/macquarie-black-rewards-terms-and-conditions.pdf

### Regulatory Sources
- ASIC — Giving financial product advice: https://www.asic.gov.au/regulatory-resources/financial-services/giving-financial-product-advice/
- ASIC RG 244 (General vs Personal advice): https://www.asic.gov.au/regulatory-resources/find-a-document/regulatory-guides/rg-244-giving-information-general-advice-and-scaled-advice/
- ASIC RG 36 (Licensing — financial product advice): https://www.asic.gov.au/regulatory-resources/find-a-document/regulatory-guides/rg-36-licensing-financial-product-advice-and-dealing/
- ASIC — How ASIC regulates financial advice: https://www.asic.gov.au/regulatory-resources/financial-services/financial-advice/how-asic-regulates-financial-advice/
- Treasury Screen Scraping Discussion Paper: https://treasury.gov.au/sites/default/files/2023-08/c2023-436961-dp.pdf

### CDR / Open Banking Sources
- CDR Rollout: https://www.cdr.gov.au/rollout
- CDR Product Reference Data: https://cdr-support.zendesk.com/hc/en-us/articles/900004104506-Product-Reference-Data
- CDR PRD Endpoints: https://cdr-support.zendesk.com/hc/en-us/articles/900005460183-PRD-endpoints-and-public-endpoint-URI-discovery
- CDR Data Standards (authoritative): https://consumerdatastandardsaustralia.github.io/standards/
- Open Banking AU Payload Viewer: https://obawv.app/
- CDR Register API: https://consumerdatastandardsaustralia.github.io/register/

### Comparison Site Sources
- Canstar Credit Cards: https://www.canstar.com.au/credit-cards/
- Finder Credit Cards: https://www.finder.com.au/credit-cards
- Finder About / Licensing: Hive Empire Pty Ltd (ABN 18 118 785 121), CAR 432664 of Advice Evolution Pty Ltd AFSL 342880; ACL 385509
- Point Hacks Credit Cards: https://www.pointhacks.com.au/credit-cards/
- Australian Frequent Flyer — Exclusion Periods (last updated 12 March 2026): https://www.australianfrequentflyer.com.au/credit-cards/credit-card-exclusion-periods/

### Secondary Compiled Sources
- Raymond La Substack — Exclusion Periods Compilation: https://raymondla.substack.com/p/understanding-the-new-exclusion-periods
- OzBargain — ANZ 24 Month Exclusion Discussion: https://www.ozbargain.com.au/node/904455
- Point Hacks Community — Virgin Money Cooling Period: https://community.pointhacks.com/t/is-there-a-cooling-period-before-reapplying-for-a-virgin-money-credit-card/22646
- Australian Frequent Flyer — CommBank 18 Month Exclusion Change: https://www.australianfrequentflyer.com.au/community/threads/commbank-increases-sign-up-bonus-exclusion-period-to-18-months.116167/
- Point Hacks — Credit Card Changes May 2025: https://www.pointhacks.com.au/news/credit-card-changes-may-2025/
- Sprintlaw — Web Scraping Laws Australia: https://sprintlaw.com.au/articles/web-scraping-laws-in-australia-legal-risks-and-compliance/
