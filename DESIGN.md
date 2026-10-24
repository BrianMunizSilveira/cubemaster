```markdown
# Design System Document: The Kinetic Laboratory

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Laboratory"**

This design system is engineered for elite cubing performance. It moves away from the "hobbyist tool" aesthetic toward a high-stakes, diagnostic environment. We treat cubing data as mission-critical telemetry. The visual language breaks the standard "web template" look by utilizing intentional asymmetry, monolithic dark surfaces, and high-energy accents of electric cyan.

Instead of a traditional grid, we use a "Modular Command Center" approach. Elements are grouped into high-density clusters, using negative space not just for "breathing room," but as a structural separator that emphasizes the importance of the data it surrounds. The experience should feel like a high-end racing HUD—precise, cold, and lightning-fast.

---

## 2. Colors & Surface Logic

### The Palette
The core of the system is built on **Deep Slates** (`background`: #0b1326) and the **Electric Cyan Pulse** (`primary_container`: #00ffc2).

*   **Primary Pulse:** Use `#00ffc2` exclusively for active states, successful solves, and primary calls to action.
*   **The Slates:** Our neutrals are not grey; they are deep, blue-tinted slates that provide a more sophisticated "midnight" atmosphere than pure black.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are prohibited for sectioning. Boundaries must be defined solely through background color shifts. 
*   Place a `surface-container-low` section sitting directly on a `surface` background to create a change in zone. 
*   If two areas need separation, use a 32px or 64px gutter of the background color rather than a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following hierarchy to define importance:
1.  **Level 0 (Base):** `surface-container-lowest` (#060e20) – Use for the main background of the entire app.
2.  **Level 1 (Sections):** `surface-container-low` (#131b2e) – Use for large layout blocks (e.g., the Solve List sidebar).
3.  **Level 2 (Cards/Widgets):** `surface-container` (#171f33) – Use for individual diagnostic widgets.
4.  **Level 3 (Interactive):** `surface-container-highest` (#2d3449) – Use for hover states or "pop-out" utility panels.

### The "Glass & Gradient" Rule
Floating elements (Modals, Hover Tooltips) should utilize **Glassmorphism**.
*   **Fill:** `surface-variant` (#2d3449) at 60% opacity.
*   **Effect:** `backdrop-blur` (12px to 20px).
*   **Signature Texture:** For primary CTAs, use a subtle linear gradient from `primary_fixed_dim` (#00e1ab) to `primary_container` (#00ffc2) at a 45-degree angle. This provides "soul" and depth to the high-performance aesthetic.

---

## 3. Typography

The typography strategy pairs technical precision with editorial authority.

*   **Space Grotesk (The Technical Engine):** Used for all `display`, `headline`, and `label` styles. Its geometric quirks reflect the mechanical nature of speedcubing. 
    *   *Usage:* Use `display-lg` (3.5rem) for the main timer. It should feel massive, dominating the viewport.
*   **Inter (The Utility Engine):** Used for `body` and `title` styles. Inter provides the legibility required for high-density data tables and settings.

**The Editorial Scale:**
*   **High Contrast:** Pair a `label-sm` (all caps, tracked out 10%) directly above a `headline-lg`. This creates a "spec sheet" look common in high-end engineering documents.
*   **Monospace Logic:** While Inter is the body font, use a monospace font-variant for solve times and millisecond counters to prevent "jitter" during active timing.

---

## 4. Elevation & Depth

We avoid traditional material shadows in favor of **Tonal Layering**.

*   **Layering Principle:** Depth is achieved by stacking. A `surface-container-highest` card sitting on a `surface-container-low` section creates a natural "lift."
*   **Ambient Shadows:** If a floating element requires a shadow (e.g., a modal), use a highly diffused glow instead of a black shadow. 
    *   *Spec:* `box-shadow: 0 20px 40px rgba(0, 255, 194, 0.08);` (A faint cyan glow that mimics light reflecting off the "Electric Cyan" components).
*   **The Ghost Border:** If a border is required for accessibility, it must be a "Ghost Border."
    *   *Spec:* `outline-variant` (#3a4a43) at 15% opacity. This creates a suggestion of a container without breaking the monolithic flow.

---

## 5. Components

### The Timer (Signature Component)
The centerpiece. Use `display-lg` in `primary_container`. During the inspection phase, the color should shift to `tertiary_container` (Yellow/Lime), and upon "Ready," it should pulse with a subtle `primary` glow.

### Buttons
*   **Primary:** Solid `primary_container` background with `on_primary_container` text. Radius: `sm` (0.125rem) for a sharp, technical look.
*   **Secondary:** Ghost Border style. No background fill. Text in `primary`.
*   **Tertiary:** No background, no border. `label-md` uppercase text with an arrow icon (→).

### Analytical Chips
Use for solve tags (e.g., "+2", "DNF", "PB"). 
*   **Style:** `surface-container-highest` background, no border. 
*   **Typography:** `label-sm`. 
*   **Accent:** A 2px vertical "status bar" on the left edge of the chip using the `secondary` or `error` tokens.

### Data Visualization & Charts
For cubing progress charts:
*   **Line Color:** `primary` (#fbfffa) with a `primary_container` (#00ffc2) outer glow.
*   **Grid Lines:** `outline-variant` (#3a4a43) at 10% opacity.
*   **Fill:** A gradient fade from `primary_container` (10% opacity) at the top to transparent at the bottom.

### Cards & Solve Lists
*   **Rule:** No dividers. 
*   **Separation:** Use `body-sm` for the date header and group solves under it. Use a slight background shift (`surface-container-low` to `surface-container-lowest`) on hover to indicate selection.

---

## 6. Do's and Don'ts

### Do
*   **DO** use extreme typographic scale. A 10pt label next to a 56pt time creates a professional, diagnostic feel.
*   **DO** use "Electric Cyan" sparingly. It is a high-energy signal; if everything is cyan, nothing is important.
*   **DO** lean into asymmetry. For example, align the Scramble text to the left but the Statistics panel to the right to create visual tension.

### Don't
*   **DON'T** use rounded corners larger than `md` (0.375rem). This system should feel "sharp" and "precise," not "soft" and "friendly."
*   **DON'T** use pure black (#000000). It kills the depth of the slate tones. Always use the `surface` tokens.
*   **DON'T** use 1px dividers between list items. Use vertical spacing (8px or 12px) to let the data breathe.
*   **DON'T** use standard blue for links. Use `secondary` (#bec2ff) for a more sophisticated, "pro-tool" violet-tinted blue.

---

## 7. Interaction Design
Transitions between "Timer" and "Statistics" views should be instantaneous or use a "shutter" effect (quick 150ms opacity/scale shift). The user is a high-performance athlete; the interface must never lag or feel "bouncy." Avoid playful animations; stick to linear, high-speed transitions.```