# Design System Strategy: The Financial Luminary

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **The Financial Luminary**. In the world of high-stakes credit card churning, users aren't just looking for a tool; they are looking for a sophisticated command center that feels both authoritative and ethereal. 

This system breaks the "template" look by moving away from rigid, boxy grids in favor of **Tonal Fluidity**. We achieve this through "The Linear Influence"—utilizing ultra-wide margins, sidebar rails that feel like part of the background, and asymmetric typography scales. By layering deep charcoals with glassmorphism, we create a UI that doesn't just sit on the screen but feels like a physical stack of premium materials—matte metal, frosted glass, and ink-rich paper.

---

## 2. Color & Surface Architecture
We prioritize a "Dark Mode First" philosophy. Our palette is not just black; it is a deep, atmospheric charcoal (`#0f131f`) that provides the canvas for our vibrant Emerald and Indigo accents.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For instance, a `surface-container-low` section should sit directly on a `surface` background to create a soft, seamless edge.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the Material surface tokens to define "importance" through depth rather than lines:
- **Base Layer:** `surface` (`#0f131f`) for the global background.
- **Structural Rails:** `surface-container-low` (`#171b28`) for sidebars.
- **Content Cards:** `surface-container` (`#1b1f2c`) for standard modules.
- **Active Modals:** `surface-container-highest` (`#313442`) for focused overlays.

### The "Glass & Gradient" Rule
To elevate the experience, all floating elements (Modals, Tooltips, Popovers) must use **Glassmorphism**. Apply a semi-transparent surface color with a `backdrop-blur: 20px`.
- **Signature Textures:** Main CTAs should never be flat. Use a subtle linear gradient transitioning from `primary` (`#4edea3`) at the top-left to `primary-container` (`#10b981`) at the bottom-right to add "soul" and professional polish.

---

## 3. Typography: Editorial Authority
Our typography pairs the technical precision of **Inter** with the rhythmic, premium feel of **Plus Jakarta Sans**. 

- **Display & Headlines (Plus Jakarta Sans):** Used for high-impact metrics and section titles. The generous x-height and modern curves convey a sense of "New Money" sophistication. Use `display-lg` (3.5rem) for hero point totals.
- **Body & Labels (Inter):** Reserved for technical data and long-form text. Inter’s neutrality ensures readability in complex financial tables.
- **The Tabular Rule:** All numbers—especially point balances and interest rates—**must** use tabular figures (`font-variant-numeric: tabular-nums`). This ensures that as numbers update, the layout remains rock-solid and aligned.

---

## 4. Elevation & Depth: Tonal Layering
We reject traditional drop shadows. We create depth through light and material properties.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural "lift." The contrast is felt, not seen.
- **Ambient Shadows:** For floating "Apple Wallet" cards, use extra-diffused shadows. 
    - *Shadow Token:* `0px 24px 48px -12px rgba(0, 0, 0, 0.4)`. The shadow must feel like an ambient occlusion rather than a harsh silhouette.
- **The "Ghost Border" Fallback:** If accessibility requires a container edge, use a "Ghost Border." Apply `outline-variant` at **15% opacity**. Never use 100% opaque borders.

---

## 5. Signature Components

### Stat Cards
Stat cards should utilize `surface-container` with a `lg` (2rem) roundedness. Avoid headers; use `label-md` for the title and `display-sm` for the value. Positive metrics use `primary` text; info states use `secondary`.

### Wallet-Style Credit Cards
These are the hero elements. Each bank requires a custom gradient (e.g., Amex: Deep Gold to Bronze). 
- **The Progress Bar:** Nested within the card, use a semi-transparent `on-surface` track with a `primary` fill to show "Spend Progress" toward a sign-up bonus.
- **Radius:** Always use the `xl` (3rem) corner radius for these cards to mimic the premium feel of physical cards.

### Linear-Style Navigation
- **The Rail:** Use `surface-container-low` with no border. Icons should be `outline` color when inactive and `primary` when active.
- **Interaction:** Hover states should use a subtle `surface-bright` background shift with a `sm` (0.5rem) radius.

### High-Impact Data Visualizations
Charts should be "Ink-on-Glass." Use `primary` for lines, but fill the area underneath with a gradient fading from `primary` (20% opacity) to `transparent`. Avoid grid lines; use only the Y-axis labels for a minimal "Stripe-like" aesthetic.

### Buttons & Inputs
- **Primary Button:** Gradient fill, `full` (pill) roundedness, and `title-sm` typography. 
- **Input Fields:** Use `surface-container-highest` backgrounds. No borders. On focus, transition the background to `surface-bright` and add a "Ghost Border" of `primary` at 20% opacity.

---

## 6. Do’s and Don'ts

### Do
- **Do** use generous vertical white space (`spacing-12` or `spacing-16`) to separate distinct financial sections.
- **Do** lean into asymmetry. For example, left-aligning large display numbers while right-aligning secondary action chips.
- **Do** use "Ambient Light" effects. A subtle glow of `primary` (5% opacity) behind a card can signal it is "active" or "unlocked."

### Don't
- **Don't** use 1px dividers between list items. Use `spacing-3` of empty space and a subtle background hover state instead.
- **Don't** use pure black `#000000`. It kills the depth of the gradients. Always start from `surface-dim`.
- **Don't** use high-contrast "Success/Error" boxes. Convey status through text color and iconography rather than heavy background fills.