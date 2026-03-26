# Design System Specification

## 1. Overview & Creative North Star: "The Sovereign Ledger"

The Creative North Star for this design system is **The Sovereign Ledger**. In the world of high-end finance, prestige isn't signaled by loud patterns, but by quiet authority, intentional depth, and flawless legibility. This system rejects the "standard" SaaS dashboard look—characterized by thin grey lines and flat boxes—in favor of a bespoke editorial experience.

We achieve this through **Atmospheric Depth**. By utilizing tonal shifts rather than structural lines, the UI feels like a series of layered, translucent surfaces. Asymmetry in data visualization and high-contrast typography scales (Plus Jakarta Sans vs. Inter) move the interface away from a generic "template" and toward a signature digital experience that feels custom-built for the financial elite.

---

## 2. Color & Tonal Architecture

This system relies on a sophisticated hierarchy of dark surfaces to guide the eye.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` sidebar (#171B28) should sit directly against the `surface` background (#0F131F) without a stroke. This creates a more organic, seamless transition that feels premium and modern.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. Use the following tokens to define importance:
- **`surface` (#0F131F):** The global canvas.
- **`surface-container-low` (#171B28):** Regional blocks like Sidebars or Page Headers.
- **`surface-container` (#1B1F2C):** Primary content cards and interactive modules.
- **`surface-container-highest` (#313442):** Active states, hover overlays, and small popovers.

### The Glass & Gradient Rule
To prevent the interface from feeling "heavy," we use light and transparency:
- **CTAs:** Use a 135-degree linear gradient (`#4EDEA3` to `#10B981`) to provide visual "soul" and a sense of energy that flat colors lack.
- **Overlays:** Use Glassmorphism for modals: `rgba(27, 31, 44, 0.6)` with a `backdrop-blur: 20px`. This allows the "glow" of the data beneath to bleed through, maintaining a sense of place.

---

## 3. Typography: The Financial Voice

Our typography balances the aggressive precision of financial data with the refined elegance of editorial headlines.

| Level | Token | Font Family | Size | Case/Style |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Plus Jakarta Sans | 3.5rem | Extrabold |
| **Headline** | `headline-md` | Plus Jakarta Sans | 1.75rem | Extrabold |
| **Title** | `title-lg` | Inter | 1.375rem | Medium |
| **Body** | `body-md` | Inter | 0.875rem | Regular |
| **Label/Cap** | `label-sm` | Inter | 0.6875rem | Uppercase / 5% Letter Spacing |

**The Tabular Rule:** All financial figures, balances, and numerical data must use the `tabular-nums` CSS property. This ensures that columns of numbers align perfectly, conveying a sense of professional-grade accuracy.

---

## 4. Elevation & Depth

In the absence of traditional borders, depth is our primary tool for information architecture.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. Place a `surface-container` card on a `surface-container-low` section to create a soft, natural lift. 

### Ambient Shadows
When an element must float (e.g., a primary card or dropdown), use the "Atmospheric Shadow": 
- **Value:** `0px 24px 48px -12px rgba(0, 0, 0, 0.4)`
- This shadow should feel like a soft glow of darkness, mimicking ambient light rather than a harsh drop shadow.

### The "Ghost Border" Fallback
If accessibility requirements or complex data density necessitate a border, use a **Ghost Border**:
- **Token:** `outline-variant` at 15% opacity.
- **Application:** This is a suggestion of a line, not a boundary. It should disappear into the background at a distance.

---

## 5. Signature Components

### Buttons & Interaction
- **Primary CTA:** Pill shape (`border-radius: 9999px`), `on-primary` text (#003824), and the 135° emerald gradient. 
- **Secondary CTA:** Ghost style with the 15% opacity `outline-variant` border and `primary` (#4EDEA3) text.
- **State Changes:** Hover states should involve a subtle scale-up (1.02x) rather than just a color change to maintain the premium feel.

### The Navigation Anchor
- **Sidebar:** Fixed to the left at exactly 256px. 
- **Background:** `surface-container-low`.
- **Styling:** No right-side border. Use a vertical typography rhythm to define space. Active links use a 4px `primary` emerald vertical pill on the far left.

### Financial Data Cards
- **Construction:** `surface-container` background with `lg` (2rem) rounded corners.
- **Separation:** Strictly forbid divider lines between list items in a card. Use `8` (2rem) spacing from the Spacing Scale to separate content items.

### Glass Modals
All popovers and modals must use the glassmorphic spec:
- **Surface:** `rgba(27, 31, 44, 0.6)`
- **Blur:** `20px`
- **Border:** Ghost border (15% `outline-variant`) to catch the light on the edge.

---

## 6. Do's and Don'ts

### Do
- **Do** use `secondary` (Indigo #D0BCFF) for subtle accents like trend lines or secondary data points to provide a sophisticated "cool" counterpoint to the emerald green.
- **Do** lean into intentional white space. High-end design breathes.
- **Do** use the `20` (5rem) spacing token to separate major layout sections.

### Don't
- **Don't** use 100% opaque borders. They clutter the UI and break the "Sovereign Ledger" aesthetic.
- **Don't** use standard "drop shadows" on flat surfaces. Only floating elements receive elevation.
- **Don't** use Inter for large display numbers. Plus Jakarta Sans Extrabold is required for the brand's authoritative voice.
- **Don't** use sharp corners. Use the `DEFAULT` (1rem) or `lg` (2rem) roundedness scale to soften the financial data.