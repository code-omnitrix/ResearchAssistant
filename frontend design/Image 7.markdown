# Design System Documentation: The Architect’s Canvas

## 1. Overview & Creative North Star
**Creative North Star: "The Technical Autopsy"**

This design system is engineered to feel less like a software interface and more like a high-end physical drafting table. It prioritizes the "Artifact" as a first-class citizen—floating, tangible, and mathematically precise. We move away from the "flat web" by utilizing a deep, infinite coordinate space defined by a dot-grid, where every interaction feels like adding a layer to a blueprint. 

To achieve a signature high-end feel, the system utilizes **Intentional Asymmetry** and **Tonal Depth**. While the background remains a static, deep void, the UI elements are treated as "optical glass" layers, using varying levels of transparency and refined light-refraction (via ghost borders) to signal hierarchy.

---

## 2. Colors: Tonal Architecture
The palette is rooted in a "True Dark" philosophy. We do not use grays to denote sections; we use varying densities of black and light-trapping transparency.

### The Palette
- **Background (`surface`):** `#0e0e0e` – A deep, light-absorbing base.
- **Primary Accent (`primary`):** `#FF4500` (Vibrant Orange) – Reserved strictly for momentum. Use this for the "Final Action" or the "Active Node."
- **Secondary/Tertiary:** Used for data visualization and status-level differentiation, keeping the primary orange as the undisputed king of the visual hierarchy.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for structural sectioning. To separate the sidebar from the canvas, or a header from a body, use **Background Color Shifts**. 
*   *Example:* Place a `surface-container-low` sidebar against a `surface` background. The shift in hex value is the boundary.

### Signature Textures & Glassmorphism
To create a premium feel, all floating artifacts must utilize **Glassmorphism**.
- **Surface Treatment:** Apply `surface-container` colors at 70-80% opacity.
- **Backdrop Blur:** Use a consistent `20px` to `40px` blur to soften the dot-grid underneath, creating a sense of physical thickness in the UI layers.

---

## 3. Typography: Technical Authority
We pair the geometric precision of **Space Grotesk** with the utilitarian clarity of **Inter**.

- **Space Grotesk (Display & Headlines):** Used for "Architectural" elements—titles, large headers, and branding. Its wide apertures and monospaced-adjacent rhythm give the UI a technical, "drafted" soul.
- **Inter (Body & UI):** Used for the "Work"—project descriptions, input text, and metadata. It provides the legibility required for high-density drafting.

**Hierarchy as Brand:**
- **Display-LG (3.5rem / Space Grotesk):** Use for "Welcome" states with extreme letter-spacing (-0.02em) to feel editorial.
- **Label-SM (0.6875rem / Space Grotesk):** All-caps for metadata, mimicking technical drawing annotations.

---

## 4. Elevation & Depth: Tonal Layering
In this system, elevation is not a shadow—it is a light state.

### The Layering Principle
Depth is achieved by "stacking" the `surface-container` tiers (Lowest to Highest). 
1.  **Level 0 (Canvas):** `surface` (#0e0e0e) + Dot Grid.
2.  **Level 1 (Sidebars/Persistent Nav):** `surface-container-low`.
3.  **Level 2 (Floating Artifacts):** `surface-container-high` + 80% Opacity + Backdrop Blur.

### Ambient Shadows
Shadows must be "Environmental," not "Structural." 
- **Value:** Use 4% opacity of the `on-surface` color.
- **Blur:** Large (32px - 64px) to simulate a soft ambient occlusion rather than a hard drop shadow.

### The "Ghost Border"
If a container requires a defined edge (e.g., a primary input field or a floating node), use a **Ghost Border**.
- **Token:** `outline-variant` at 15% opacity. 
- **Effect:** This mimics the edge of a pane of glass catching a sliver of light, rather than a drawn line.

---

## 5. Components

### Primary CTA (The "Ignition" Button)
- **Background:** `primary` (#FF4500).
- **Shape:** `full` (pill-shaped) to contrast against the sharp-edged grid.
- **Micro-gradient:** A subtle linear gradient from `primary` to `primary-container` top-to-bottom adds a "lathe-turned" premium finish.

### Input Fields (The "Drafting Box")
- **Base:** `surface-container-highest` at 40% opacity.
- **Border:** `outline-variant` at 20% (Ghost Border).
- **Typography:** `title-md` (Inter) for the input text.
- **State:** On focus, the border transitions to `primary` (#FF4500) at 100% opacity, signaling "System Active."

### Artifact Nodes (The "Floating Sheets")
- **Structure:** `lg` (1rem) rounded corners.
- **Header:** Use `label-md` (Space Grotesk) in All-Caps for the artifact type (e.g., "IMAGE.PNG" or "MARKDOWN").
- **Content Separation:** Forbid divider lines. Use `1.5rem` of vertical whitespace to separate header from body.

### Navigation Sidebar
- **State:** The "Active" project or tab should not use a box; it should use a `primary` vertical "light bar" (2px wide) on the far left of the item, paired with a `surface-bright` background shift.

---

## 6. Do's and Don'ts

### Do
- **DO** use the dot-grid as a functional alignment tool. Elements should "snap" to grid intersections.
- **DO** lean into "Airy" layouts. The space between artifacts is as important as the artifacts themselves.
- **DO** use high-contrast type scales. A very large headline next to very small metadata creates an editorial, high-end feel.

### Don't
- **DON'T** use pure white (#FFFFFF) for body text. Use `on-surface-variant` to reduce eye strain in the dark environment.
- **DON'T** use 100% opaque cards. The "Spatial" feel is lost if the user cannot see the grid faintly through the UI.
- **DON'T** use standard "Material" blue or "Bootstrap" colors. Every accent must be a derivative of the orange or neutral tonal scale.