Got it. If the previous slate was too close to a traditional, heavy dark mode, we can lift the brightness into a **"Dim" or "Twilight"** range. This sits comfortably between a standard dark mode and a light mode, drastically reducing contrast glare while avoiding that deep, heavy black feel. 

Here is a revised, lighter "Soft Stone" palette:

```markdown
# Design System: "Soft Stone" (Dim Dark Mode)

This palette lifts the background colors out of the deep shadows. It acts as a "dim" mode—similar to a dimly lit room or soft clay—making it feel much lighter and airier without switching to a blinding light mode.

## 1. Core Backgrounds (The Canvas)
Noticeably lighter than standard dark mode, using mid-tone warm grays.

* **App Background:** `#3C3B39` — A soft, mid-toned taupe/gray. The main canvas.
* **Surface / Panel:** `#464543` — Lighter panels for your editor, sidebar, or cards.
* **Elevated Surface:** `#53514E` — For pop-ups, context menus, and floating toolbars.

## 2. Typography (The Content)
Because the background is lighter, the text doesn't need to be pure white to be readable. 

* **Primary Text:** `#F2EFE9` — Soft cream. Highly readable without stinging the eyes.
* **Secondary Text:** `#B8B5B0` — A balanced, warm gray for metadata and inactive tabs.
* **Disabled Text:** `#858380` — Pushed back for placeholder text or unavailable options.

## 3. Accents & Interactive Elements
These are adjusted to pop cleanly against the lighter background without clashing.

* **Primary Accent (Soft Clay):** `#E08A78` — A gentle, earthy orange/coral for main actions and active states.
* **Secondary Accent (Dusty Blue):** `#7A9BBC` — A calm, muted blue for informational highlights or secondary buttons.
* **Tertiary Accent (Muted Matcha):** `#9DB396` — A soft green for success states, additions, or subtle math highlights.

## 4. Borders & Dividers
Visible enough to provide structure, but soft enough to blend.

* **Subtle Divider:** `#5C5A57` — For standard section borders.
* **Input Border:** `#6B6966` — For text fields, dropdowns, and interactive boundaries.

---

## Implementation: CSS Variables Example

```css
:root {
  /* Backgrounds */
  --bg-canvas: #3C3B39;
  --bg-surface: #464543;
  --bg-elevated: #53514E;

  /* Typography */
  --text-primary: #F2EFE9;
  --text-secondary: #B8B5B0;
  --text-disabled: #858380;

  /* Accents */
  --accent-clay: #E08A78;
  --accent-blue: #7A9BBC;
  --accent-matcha: #9DB396;

  /* Borders */
  --border-subtle: #5C5A57;
  --border-input: #6B6966;
}
```
```