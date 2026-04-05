# AI Research Canvas — V3 Plan: The Lecture Canvas Paradigm
> Complete ground-up redesign. The metaphor shifts from "cards in a grid" to "a living academic lecture unrolled on an infinite whiteboard."

---

## The Fundamental Paradigm Shift

### What the current system does (wrong)
```
User uploads PDF
  → AI generates N isolated card nodes
  → User clicks a card
  → Modal opens with slides
  → User closes modal
  → User clicks another card
  → Repeat
```

This is a file browser, not a learning experience. The user is constantly navigating menus instead of studying.

### What V3 does (right)
```
User uploads PDF
  → AI generates a continuous SCENE GRAPH:
       ┌─────────────────────────────────────────────────────────┐
       │  [BIG SECTION TITLE]                                    │
       │                                                         │
       │  [ANIMATED ARTIFACT]    [Rich prose text flowing here   │
       │  (auto-playing,         naturally like a textbook.      │
       │  looping, alive)        Key ideas explained paragraph   │
       │                         by paragraph.]                  │
       │                                                         │
       │                         $$V^*(x) = \min_u [...]$$      │
       │                         (formula block, highlighted)    │
       │                                                         │
       │                         > Key Insight: ...             │
       │                           (callout box)                 │
       │         ↕ connecting thread                             │
       │  [ANIMATED ARTIFACT]    [Next concept's prose...]      │
       │  (different size,                                        │
       │  different animation)                                    │
       └─────────────────────────────────────────────────────────┘
  → Everything visible at once on infinite panning canvas
  → Artifacts auto-play — no clicking required
  → Prose surrounds each artifact naturally
  → User pans/zooms like reading a giant illuminated manuscript
  → Chat on left knows what's in your viewport
```

---

## The Mental Model

Think of it as: **3Blue1Brown meets Notion meets an infinite whiteboard.**

- The **animations** are the professor drawing on the board
- The **prose** is the professor speaking
- The **formula blocks** are the equations written large on the board
- The **callouts** are the professor circling something saying "this is the important bit"
- The **connecting threads** are the professor saying "building on that..."
- The **canvas** is the entire lecture, all at once, as a spatial document

### What this enables
| User intent | Action |
|---|---|
| "Where am I in the paper?" | Zoom out — see entire lecture canvas |
| "What was that equation?" | Scroll back — it's always there |
| "I don't understand this diagram" | Click chat, ask — AI sees which artifact you're near |
| "How does this connect to the next concept?" | Pan right — connecting thread leads to next scene |
| "I want to add a comparison" | Chat says "compare X and Y" — new scene materializes beside relevant artifacts |
| "I want to add another paper" | Drop PDF — new parallel row of scenes appears, with cross-paper bridges |

---

## Visual Language of a Scene

Each concept occupies one **Scene** on the canvas. A scene is NOT a card. It has no fixed boundary — it's a loose cluster of elements with negative space.

```
Scene layout (concept: "The HJB Equation"):

  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
  │                                                                                                                                                     │
  │   FOUNDATION           The HJB Equation                                                                                                             │
  │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                                              │
  │   Understanding the mathematical foundation of cost-to-go and optimal policies                                                                       │
  │                                                                                                                                                     │
  │   ┌───────────────────────────────────────┐      The Hamilton-Jacobi-Bellman equation is the                                                        │
  │   │                                       │      cornerstone of continuous-time optimal control.                                                     │
  │   │   ╭─────────╮   →  cost field         │      Unlike discrete dynamic programming, it works                                                      │
  │   │   │  x₀     │      shading from low   │      directly in continuous state and time spaces.                                                      │
  │   │   │ (start) │      to high cost        │                                                                                                        │
  │   │   ╰─────────╯        ╱╲                │      At each state x, V*(x) tells us: "if I start here                                                 │
  │   │        \            /  \               │      and play optimally forever, how much total cost                                                    │
  │   │   optimal path ─→  /    \   high cost  │      will I accumulate?" The equation says this value                                                  │
  │   │        \          ╱      ╲             │      must satisfy a self-consistency condition:                                                         │
  │   │         ╲────────→ x*(goal)            │                                                                                                        │
  │   │            (animated, looping)         │      ╔════════════════════════════════════════════╗                                                     │
  │   └───────────────────────────────────────┘      ║  0 = min_u [l(x,u) + ∇V*(x)ᵀ f(x,u)]     ║                                                     │
  │           ANIMATED ARTIFACT                       ╚════════════════════════════════════════════╝                                                     │
  │           (580 × 340px, auto-loop)                (formula block — KaTeX rendered, highlighted)                                                      │
  │                                                                                                                                                     │
  │                                              The term l(x,u) is the running cost — the                                                             │
  │                                              "pain" incurred at each moment. The gradient                                                           │
  │                                              term ∇V*·f(x,u) captures how the value changes                                                        │
  │                                              as the system evolves. At the optimal policy,                                                          │
  │                                              both terms balance to zero.                                                                            │
  │                                                                                                                                                     │
  │                                              ┌─────────────────────────────────────────┐                                                           │
  │                                              │ 💡 Think of it like water finding the    │                                                           │
  │                                              │ lowest path in a terrain — V*(x) is the  │                                                           │
  │                                              │ elevation map of effort.                  │                                                           │
  │                                              └─────────────────────────────────────────┘                                                           │
  │                                                        (callout box)                                                                                 │
  │                                                                                                                                                     │
  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                                                   |
                                          connecting thread
                                          (animated dashed line)
                                                   |
                              ↓ next scene: Mechanism — Learning System Dynamics
```

---

## Element Taxonomy

### 1. `artifact` — The Living Diagram
A self-contained, auto-playing animated HTML fragment. This is the core innovation.

**Key properties**:
- Auto-plays on mount, loops continuously
- Pauses on hover (hover shows a thin pause indicator)
- No navigation chrome — no prev/next, no step pills
- Size varies: `width: 320–900px, height: 200–500px` based on concept complexity
- Background: `rgba(14, 20, 36, 0.9)` — blends into canvas
- Subtle border: `1px solid rgba(255,255,255,0.06)`
- Drop shadow: `0 4px 40px rgba(0,0,0,0.5)`
- Rendered in a `<iframe sandbox="allow-scripts" style="border:none; background:transparent">`
- Draggable by user

**Animation style**: Continuous, cinematic. Think frame-by-frame animation of a concept. Not a step-through slideshow. A loop that teaches by repeated viewing, like a GIF but much richer.

### 2. `prose_block` — The Lecture Text
Rich text rendered with react-markdown + remark-math + rehype-katex.

**Properties**:
- Width: 360–480px (readable column width)
- Font: `'Lora', Georgia, serif` — academic, warm
- Body text: `15px`, line-height `1.85` — generous reading rhythm
- Inline math: KaTeX, styled to match text size
- Supports: `**bold**`, `*italic*`, `inline code`, headers, lists
- No fixed height — grows with content
- Subtle left border at concept phase color when selected

### 3. `formula_block` — The Equation On The Board
Display-math rendered by KaTeX, styled prominently.

**Properties**:
- Width: matches prose column (360–480px) or spans both columns (860px+) for major equations
- Background: `rgba(255,255,255,0.03)`
- Border: `1px solid rgba(255,255,255,0.1)`, left accent: `3px solid <phase-color>`
- Formula label: small caps above
- Annotation: optional color-coded term labels below
- Auto-numbered if it's a key equation from the paper

### 4. `callout` — The Highlighted Insight
A visually distinct box pulling out the single most important point.

**Variants**:
- `key-insight`: amber left border, 💡 icon
- `warning`: rose left border, ⚠️ icon
- `analogy`: teal left border, 🔄 icon
- `definition`: blue left border, 📖 icon
- `result`: violet left border, 📊 icon

### 5. `section_header` — The Lecture Chapter Title
Large typographic heading anchoring a scene.

**Properties**:
- Phase badge (HOOK / FOUNDATION / MECHANISM...)
- Main title: `'Instrument Serif', 28px`
- Subtitle: `'Lora', 15px, italic, muted`
- Subtle horizontal rule
- Spans the width of the scene

### 6. `connector` — The Narrative Thread
Visual lines connecting scenes, showing flow and relationships.

**Variants**:
- `sequential`: animated dashed vertical line between scenes (main flow)
- `dependency`: curved arrow from one element to another (references)
- `cross-paper`: thicker colored bridge between two papers
- `comparison`: horizontal bracket connecting two parallel artifacts

### 7. `annotation` — The Marginal Note
Small sticky-note-style element. User-created or AI-suggested.

**Properties**:
- 180px wide
- Handwriting-style font (`'Caveat'`)
- Rotated slightly
- User can add anywhere

---

## Canvas Architecture

### Coordinate System
The canvas is an infinite 2D space. All elements have `{x, y}` in canvas-space coordinates.

The viewport shows a window into this space via CSS `transform: translate(panX, panY) scale(zoom)`.

**Scene layout strategy**:
- Paper 1 scenes: vertical column, starting at `{x: 200, y: 80}`, each scene offset `{y: += sceneHeight + 120}`
- Paper 2 scenes: second column at `{x: 1600, y: 80}` (if added)
- Cross-paper comparison scenes: centered between columns `{x: 900}`
- AI-generated query scenes: free-placed near the scenes they reference

### Pan & Zoom
- **Pan**: Mouse drag on empty canvas area, or two-finger drag on trackpad
- **Zoom**: Scroll wheel, or pinch on trackpad, range `0.2× – 2.5×`
- **Minimap**: Bottom-right corner, 160×120px, shows all scenes with current viewport indicator
- **Fit to paper**: Button that animates zoom/pan to fit all scenes of current paper
- **Jump to concept**: Clicking concept title in left panel animates camera to that scene

### Interaction Model
| Gesture | Action |
|---|---|
| Drag empty space | Pan canvas |
| Scroll | Zoom |
| Drag element | Reposition element (any canvas element is draggable) |
| Click artifact | Artifact gets keyboard focus; spacebar toggles pause/play |
| Right-click element | Context menu: Ask AI, Annotate, Hide, Copy |
| Select text on prose | Selection toolbar: Ask AI about this, Highlight, Add note |
| Drag PDF file onto canvas | Add new paper to session |
| Double-click empty area | Open quick-add menu |

---

## Left Panel: The Context-Aware Tutor

The left panel is **always open**, **always visible**, and **always knows** where the user is looking.

```
┌────────────────────────────────────────┐
│ ≡  RESEARCH STUDIO              ✕ ←   │  ← panel title, close to make canvas wider
├────────────────────────────────────────┤
│  📄  Neural Dynamics Control           │  ← active paper
│  Concept 3 / 8 · In viewport: 3–5     │  ← viewport awareness
├────────────────────────────────────────┤
│                                        │
│  [chat messages with markdown + math]  │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ 🤖  The HJB equation encodes   │   │  ← AI response
│  │     the optimal value globally.│   │
│  │     Notice in the visualization│   │
│  │     how the cost field darkens │   │
│  │     as you move away from the  │   │
│  │     optimal path...            │   │
│  └────────────────────────────────┘   │
│                                        │
│  [user message]                        │
│                                        │
├────────────────────────────────────────┤
│  Context:                              │
│  [#hjb-equation] [#mechanism-1]        │  ← auto-chips from viewport
├────────────────────────────────────────┤
│  Quick actions:                        │
│  [deeper] [simplify] [prove it]        │
│  [show alternatives] [quiz me]         │
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐ │
│  │  Ask anything about the paper    │ │
│  │                               →  │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Viewport Awareness
The canvas tracks which scene elements are currently visible and sends this context to the tutor:

```typescript
// Runs on pan/zoom end
function getViewportContext(): ViewportContext {
  return {
    visibleScenes: scenes.filter(s => isInViewport(s.bounds)),
    mostProminentScene: getLargestVisibleScene(),
    visibleElements: elements.filter(e => isInViewport(e.bounds))
  };
}
```

This means the AI tutor always knows what you're looking at without you having to tell it.

### Chat-Driven Canvas Extension
When the AI's response warrants a new element on the canvas:

```
User: "Can you compare this to the NMPC approach?"
AI: "Great question — here's a comparison of HJB vs NMPC..."
    + generates new COMPARISON scene at canvas position adjacent to HJB scene
    + new scene appears with subtle materializing animation
    + thread connector drawn from HJB scene to comparison scene
```

Triggers for canvas extension:
- "Compare X and Y" → COMPARISON scene
- "Show me the derivation" → DERIVATION scene (long, math-heavy)
- "What would happen if..." → SIMULATION scene (interactive)
- "I don't understand [term]" → DEFINITION callout appears on canvas near relevant artifact
- "Add this paper" → new paper column materializes

---

## New Backend Architecture

### The Two-Phase Generation Model

**Phase A: Planning** (Agent 1)
The paper is analyzed and a complete Scene Graph JSON is produced. This includes:
- Concept decomposition (same as V2)
- Scene layout (x, y, width, height for each scene)
- Element specs (what goes in each scene)
- Artifact specs (what animation to generate)
- Prose outlines (what text to generate)
- Connector specs (how scenes connect)

**Phase B: Content Generation** (Agents 2 + 3, parallel where possible)
For each scene, concurrently:
- Agent 2 generates the artifact HTML
- Agent 3 generates the prose MDX
These are streamed to the frontend as they complete.

### Data Flow

```
POST /api/analyze (PDF)
  │
  ├─ SSE: PLANNING_START
  ├─ Agent 1: Scene Planner → scene_graph.json
  ├─ SSE: SCENE_GRAPH_READY {scenes, layout}
  │
  ├─ For each scene (streamed as completed):
  │   ├─ Agent 2: Artifact Generator → artifact.html
  │   ├─ Agent 3: Prose Generator → prose.mdx
  │   ├─ Agent 4 (Validator): validates artifact + prose
  │   ├─ Agent 4b (Repairer): fixes if needed
  │   └─ SSE: SCENE_READY {sceneId, artifactHtml, proseMdx, metadata}
  │
  └─ SSE: PIPELINE_COMPLETE
```

### Why parallel artifact + prose generation?
Previously, only artifacts were generated (slides). Now there are two separate content streams per concept. These can be generated in parallel (separate API calls) since the prose doesn't depend on the artifact HTML and vice versa. This cuts total generation time roughly in half.

---

## Project Structure V3

```
research-canvas/
│
├── backend/
│   ├── main.py                          # FastAPI, CORS, mounts, 50MB limit
│   ├── routes/
│   │   ├── analyze.py                   # POST /api/analyze → SSE
│   │   ├── interact.py                  # POST /api/interact → tutor response + optional new scene
│   │   └── extend.py                    # POST /api/extend → add paper / generate comparison
│   ├── agents/
│   │   ├── scene_planner.py             # Agent 1: full scene graph JSON from paper
│   │   ├── artifact_generator.py        # Agent 2: continuous animated HTML artifacts
│   │   ├── prose_generator.py           # Agent 3: rich MDX lecture prose
│   │   ├── validator.py                 # Agent 4: validates both artifact + prose
│   │   ├── repair_agent.py              # Agent 4b: surgical fixes
│   │   └── tutor.py                     # Agent 5: chat tutor with viewport context
│   ├── pipeline/
│   │   └── orchestrator.py              # Parallel generation, SSE emitter, retry logic
│   ├── guardrails/
│   │   ├── input_guard.py
│   │   └── output_guard.py
│   ├── prompts/
│   │   ├── scene_planner_prompts.py     # Agent 1 full/simplified/minimal prompts
│   │   ├── artifact_prompts.py          # Agent 2: continuous artifact prompts (by viz type)
│   │   ├── prose_prompts.py             # Agent 3: prose generation prompts
│   │   ├── validator_prompts.py         # Agent 4 prompts
│   │   └── tutor_prompts.py             # Agent 5 prompts + 7 response modes
│   └── utils/
│       ├── llm_client.py                # OpenRouter LangChain client + retry
│       ├── pdf_reader.py                # PyPDF text + metadata extraction
│       ├── json_extractor.py            # 4-strategy JSON rescue
│       └── html_sanitizer.py           # Extract HTML + validate artifact constraints
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                      # Single route: the canvas app
│   │   ├── canvas/
│   │   │   ├── InfiniteCanvas.tsx       # Root pan/zoom container
│   │   │   ├── useCanvasEngine.ts       # Pan, zoom, coordinate transforms
│   │   │   ├── Minimap.tsx              # Bottom-right overview
│   │   │   └── CanvasContextMenu.tsx    # Right-click menu
│   │   ├── elements/
│   │   │   ├── SceneContainer.tsx       # Groups elements of one concept
│   │   │   ├── ArtifactFrame.tsx        # iframe wrapper for animated artifact
│   │   │   ├── ProseBlock.tsx           # react-markdown + KaTeX prose
│   │   │   ├── FormulaBlock.tsx         # Display-mode KaTeX equation
│   │   │   ├── CalloutBox.tsx           # Key insight / analogy / warning box
│   │   │   ├── SectionHeader.tsx        # Phase badge + title + rule
│   │   │   ├── Connector.tsx            # SVG animated thread between scenes
│   │   │   └── Annotation.tsx           # User sticky note
│   │   ├── panel/
│   │   │   ├── TutorPanel.tsx           # Left sidebar chat
│   │   │   ├── ChatMessage.tsx          # Message bubble (markdown + math)
│   │   │   ├── ViewportContext.tsx       # Shows what AI can see
│   │   │   └── QuickActions.tsx         # deeper/simplify/quiz buttons
│   │   ├── overlays/
│   │   │   ├── UploadOverlay.tsx        # Initial upload screen
│   │   │   ├── GeneratingOverlay.tsx    # Loading state with progress
│   │   │   └── PaperSwitcher.tsx        # Multi-paper session manager
│   │   ├── store/
│   │   │   ├── canvasStore.ts           # Zustand: pan, zoom, selection
│   │   │   ├── sceneStore.ts            # Zustand: scenes, elements, layout
│   │   │   └── sessionStore.ts          # Zustand: papers, chat history
│   │   ├── services/
│   │   │   ├── api.ts                   # SSE consumer + REST calls
│   │   │   └── viewportTracker.ts       # Tracks visible elements, debounced
│   │   ├── types/
│   │   │   └── index.ts                 # All TypeScript types
│   │   └── styles/
│   │       ├── globals.css              # Design tokens, scrollbar, selection
│   │       └── canvas.css               # Dot-grid pattern, canvas background
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── .env
├── .env.example
├── requirements.txt
└── README.md
```

---

## Design System V3

### The "Illuminated Manuscript" Theme

The aesthetic goal: a 2024 research tool that feels as serious and beautiful as a well-typeset academic paper, but alive.

**Color Palette**:
```css
:root {
  /* Canvas itself */
  --canvas-bg:         #080c14;  /* deep navy — the page */
  --canvas-dot:        rgba(255,255,255,0.04);  /* subtle dot grid */

  /* Surfaces */
  --surface-artifact:  rgba(12, 18, 32, 0.95);  /* artifact background */
  --surface-prose:     transparent;  /* prose floats on canvas */
  --surface-formula:   rgba(255,255,255,0.025);
  --surface-callout:   rgba(255,255,255,0.03);
  --surface-panel:     #0a0f1e;

  /* Phase colors — used as accent only, never as fill */
  --phase-hook:        #e8a020;  /* amber */
  --phase-foundation:  #3d8ef0;  /* blue */
  --phase-mechanism:   #00c49a;  /* teal */
  --phase-evidence:    #9575f0;  /* violet */
  --phase-implications:#f06080;  /* rose */
  --phase-synthesis:   #e8a020;  /* amber (same as hook, closure) */
  --phase-comparison:  #f07040;  /* orange (cross-paper) */
  --phase-query:       #50c090;  /* green (user-generated) */

  /* Typography */
  --text-primary:      #dde4f0;
  --text-secondary:    #6e7d96;
  --text-muted:        #3a4558;
  --text-formula:      #e8e4d0;  /* slightly warm for math */

  /* Connectors */
  --connector-main:    rgba(255,255,255,0.12);
  --connector-active:  rgba(255,255,255,0.3);
}
```

**Fonts**:
```html
<!-- Prose text: academic, warm, excellent for reading -->
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap">

<!-- Section titles: authoritative, distinctive -->
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap">

<!-- UI elements: clean, modern -->
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap">

<!-- Annotations: handwriting feel -->
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&display=swap">

<!-- Code and math labels -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap">
```

**Prose typography**:
```css
.prose-block {
  font-family: 'Lora', Georgia, serif;
  font-size: 15px;
  line-height: 1.85;
  color: var(--text-primary);
  max-width: 460px;
}
.prose-block h3 {
  font-family: 'Instrument Serif', serif;
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 0.5em;
}
.prose-block strong { color: #e8edf8; font-weight: 600; }
.prose-block em { color: var(--text-secondary); }
.prose-block code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  background: rgba(255,255,255,0.06);
  padding: 1px 5px;
  border-radius: 4px;
}
```

---

## Scene Layout Engine

### Scene Size Calculation
Each scene's canvas footprint is determined by the Scene Planner (Agent 1), which outputs layout hints. The frontend then places elements within the scene's coordinate space.

**Scene layout templates**:

**Template A: Landscape (artifact left, text right)**
```
width: 1100, height: varies
x=0    artifact (580×340)
x=620  prose stack (460px wide):
         section header
         prose block(s)
         formula block(s)
         callout(s)
```

**Template B: Portrait (text top, artifact bottom)**
```
width: 700, height: varies
y=0    section header (700px wide)
y=80   prose block (700px wide)
y=prose_h+120  artifact (700×380)
y=...  formula + callout (700px wide)
```

**Template C: Full-width (for complex mechanisms)**
```
width: 1400, height: varies
y=0    section header (1400px wide)
y=100  artifact (900×500, centered)
y=...  two-column prose (2×460px side by side)
y=...  formula (full 1400px width, large display)
```

**Template D: Comparison (two artifacts side by side)**
```
width: 1300, height: varies
y=0    section header
y=80   [artifact A (550×300)] | [artifact B (550×300)]
y=...  prose explaining comparison
y=...  formula comparison table
```

The Scene Planner picks the template that best fits the concept type:
- HOOK, FOUNDATION → Template A or B
- MECHANISM → Template A or C
- EVIDENCE → Template D (comparing with baselines)
- SYNTHESIS → Template C or B (full-width diagram)

### Scene Spacing
Scenes stack vertically with `gap: 140px` between them. This gap is where the connector thread lives.

### Initial Camera Position
On load, the camera starts at the top of the first scene, zoomed to `0.85×` to show the first scene and the beginning of the next.

---

## Artifact Specification V3

### The Continuous Animation Model

**Key change from V2**: Artifacts are NO LONGER step-based. They are ONE continuous looping animation.

Think of them as high-quality animated illustrations that:
- Play automatically on mount
- Loop seamlessly
- Tell the visual story of the concept in 8–15 seconds per loop
- Can be paused (hover shows pause indicator at corner)
- Respond to hover (e.g., slow down animation, highlight hovered element)

**Animation structure**:
```javascript
// Each artifact is a "scene film" with timed keyframes
const film = [
  { t: 0,    action: () => showElement('start-node') },
  { t: 800,  action: () => animatePath('path-1') },
  { t: 2000, action: () => showCostField() },
  { t: 3500, action: () => highlightOptimal() },
  { t: 5000, action: () => fadeIn('label-optimal') },
  { t: 7000, action: () => resetForLoop() }  // loop back to t=0
];
```

This is more like a GIF/video but implemented in SVG/Canvas, so it's crisp, accessible, and themeable.

**Artifact sizing**:

| Concept complexity | Artifact size |
|---|---|
| Simple (one idea) | 420 × 260px |
| Standard (algorithm, process) | 580 × 340px |
| Complex (multi-part system) | 720 × 420px |
| Comparison (two side-by-side) | 900 × 300px |
| Full-width (architecture diagram) | 100% scene width × 400px |

The Scene Planner specifies exact dimensions. Agent 2 must respect them exactly.

**Transparency**: All artifacts have `background: rgba(12,18,32,0.9)` — close to canvas background but with slight depth.

**Hover behavior**:
```css
.artifact-frame:hover .artifact-overlay {
  opacity: 1;  /* shows ⏸ pause button, ↗ expand button */
}
.artifact-frame:hover iframe {
  /* optionally: slow animation */
}
```

---

## SSE Event Schema V3

```json
{"type":"PLANNING_START",    "message":"Analyzing paper structure..."}
{"type":"SCENE_GRAPH_READY", "scenes":[...], "totalScenes":8}
{"type":"SCENE_GENERATING",  "sceneId":"s001", "title":"The Control Dilemma"}
{"type":"ARTIFACT_READY",    "sceneId":"s001", "artifactHtml":"...", "dimensions":{"w":580,"h":340}}
{"type":"PROSE_READY",       "sceneId":"s001", "proseMdx":"...", "estimatedHeight":420}
{"type":"SCENE_READY",       "sceneId":"s001", "fullyRendered":true, "quality":88}
{"type":"CONNECTOR_READY",   "from":"s001", "to":"s002", "type":"sequential"}
{"type":"QUERY_SCENE_READY", "queryId":"q001", "parentSceneIds":["s003"], "sceneData":{...}}
{"type":"PIPELINE_COMPLETE", "totalScenes":8, "totalElements":47}
{"type":"PIPELINE_ERROR",    "sceneId":"s001", "message":"...", "usedFallback":true}
```

---

## Runtime Generation Budget

The earlier plan defined what to build, but not what runtime experience to target. V3 needs explicit latency budgets, otherwise the canvas vision will collapse into long waiting states.

### Target User-Perceived Latency

| Milestone | Target | Hard ceiling |
|---|---:|---:|
| Upload accepted + SSE starts | 1-2s | 4s |
| PDF text extraction complete | 3-6s | 10s |
| Scene graph visible on canvas | 10-18s | 25s |
| First scene fully usable | 22-40s | 55s |
| First 3 scenes visible | 40-70s | 90s |
| Full 8-scene paper complete | 95-180s | 240s |
| Chat-generated extension scene | 18-35s | 50s |

### Per-Stage Runtime Budget

| Runtime stage | Work | Typical | P90 |
|---|---|---:|---:|
| R0 | File ingest + input guard | 1-3s | 5s |
| R1 | PDF parse + metadata extraction | 2-5s | 8s |
| R2 | Scene planner LLM call | 8-16s | 22s |
| R3 | Layout normalization + scene queue build | <1s | 2s |
| R4a | Artifact generation per scene | 12-28s | 40s |
| R4b | Prose generation per scene | 6-14s | 20s |
| R5 | Validation per scene | 2-5s | 8s |
| R6 | Repair pass when needed | 0s most scenes / 8-18s when triggered | 25s |
| R7 | Frontend mount + first paint of scene | 1-2s | 4s |

### Concurrency Strategy

The system should not generate all scenes serially. The practical target is:

- Run the planner once, then enqueue all scenes immediately.
- Generate artifact and prose for the same scene in parallel.
- Process 2 scenes concurrently for normal hardware.
- Allow burst concurrency of 3 scenes only when provider rate limits and memory use stay stable.
- Emit partial results as soon as either artifact or prose is ready; do not wait for the entire paper.

### Generation Modes

To control latency, the orchestrator should support explicit fidelity modes:

| Mode | Intended use | Artifact complexity | Full 8-scene paper |
|---|---|---|---:|
| Draft | quick comprehension, internal testing | simple motion, lower ornamentation | 45-90s |
| Standard | default user mode | balanced prose + looping animation | 95-180s |
| Studio | polished export/demo mode | richer motion, denser annotations, more repair passes | 180-360s |

### Runtime Planning Rules

- The planner should assign each scene a `complexity_score` and `fidelity_hint`.
- Scenes tagged `HOOK`, `FOUNDATION`, or `DEFINITION` should default to faster templates.
- Only `MECHANISM`, `EVIDENCE`, and `COMPARISON` scenes should use the heaviest artifact pipelines.
- If generation exceeds the P90 budget for a scene, fall back to a simpler artifact template rather than stalling the whole paper.

---

## Delivery Plan V3

The original phase list was too coarse for execution. The rebuild should be managed as smaller delivery stages with explicit outcomes, dependencies, and latency impact.

### Stage 0: Product Contract and Schema Lock (1 day)

**Goal**: Freeze the scene model before implementation starts.

**Work**:
- Finalize scene JSON schema, element taxonomy, and SSE contract.
- Define artifact size bands and scene template rules.
- Decide generation modes: `draft`, `standard`, `studio`.

**Exit criteria**:
- One canonical TypeScript/Python schema shared across frontend and backend.
- No unresolved ambiguity around `scene`, `element`, `artifact`, `callout`, or `connector` payloads.

**Engineering time**: 1 day

### Stage 1: Latency-First Pipeline Skeleton (1.5 days)

**Goal**: Make the backend capable of streaming a fake scene graph and placeholder scenes end-to-end.

**Work**:
- Split routes into `analyze`, `interact`, and `extend`.
- Add SSE emitter utilities and placeholder event flow.
- Implement queue structure for planner -> scene workers -> validator.

**Exit criteria**:
- Frontend can receive `PLANNING_START`, `SCENE_GRAPH_READY`, `SCENE_READY`, and `PIPELINE_COMPLETE` from a mocked pipeline.
- The pipeline supports scene-level partial completion.

**Engineering time**: 1.5 days

### Stage 2: Canvas Engine Foundation (2 days)

**Goal**: Replace the current constrained node surface with a real infinite canvas.

**Work**:
- Build pan, zoom, coordinate transforms, and fit-to-content.
- Implement scene positioning in canvas coordinates.
- Add minimap and viewport bounds tracking.

**Exit criteria**:
- A paper with placeholder scenes can be navigated smoothly at `0.2x-2.5x` zoom.
- Canvas interactions feel stable on desktop trackpad and mouse.

**Engineering time**: 2 days

### Stage 3: Scene Primitive System (2.5 days)

**Goal**: Build the visual grammar of a scene before hooking it to AI output.

**Work**:
- Implement `SectionHeader`, `ProseBlock`, `FormulaBlock`, `CalloutBox`, `ArtifactFrame`, and `Connector`.
- Add selection, dragging, and base hover states.
- Lock typography, spacing, and color tokens.

**Exit criteria**:
- One hardcoded scene can render at production quality.
- Formula blocks and prose are readable without opening any modal.

**Engineering time**: 2.5 days

### Stage 4: Scene Planner (2 days)

**Goal**: Generate the scene graph, layout hints, and narrative ordering from the paper.

**Work**:
- Build `scene_planner.py` and prompt variants.
- Output scene sequence, template choice, dimensions, connection graph, and prose/artifact briefs.
- Attach complexity and fidelity hints for runtime cost control.

**Exit criteria**:
- A real paper produces a valid `scene_graph.json` with no manual patching.
- Layout hints are good enough that scenes do not overlap on initial render.

**Engineering time**: 2 days

### Stage 5: Prose and Formula Generator (1.5 days)

**Goal**: Produce the professor-style explanation stream independently of artifact generation.

**Work**:
- Build `prose_generator.py` and scene-grounded prompts.
- Extract and normalize formulas for `FormulaBlock` output.
- Generate callouts, analogies, and definitions as separate elements.

**Exit criteria**:
- Each scene yields markdown/MDX that reads like a coherent lecture, not a caption.
- Math renders cleanly with no raw LaTeX leakage.

**Engineering time**: 1.5 days

### Stage 6: Artifact Generator Foundation (3.5 days)

**Goal**: Replace slides with continuous-loop animated artifacts.

**Work**:
- Build artifact prompt families by visualization type.
- Support at least 4 strong artifact families first: `path-animation`, `field-animation`, `mechanism`, `comparison`.
- Enforce size, transparency, autoplay, and pause-on-hover behavior.
- Add fallback templates for over-budget scenes.

**Exit criteria**:
- Generated artifacts loop as a single teaching animation.
- No scene depends on step pills, modal focus, or manual next/previous interactions.

**Engineering time**: 3.5 days

### Stage 7: Validation, Repair, and Budget Enforcement (2 days)

**Goal**: Prevent slow or broken scenes from poisoning the entire paper.

**Work**:
- Validate artifact dimensions, animation contract, and prose completeness.
- Add repair prompts for malformed HTML/MDX.
- Add runtime budget checks with automatic downgrade to simpler templates.

**Exit criteria**:
- A bad scene fails locally and falls back cleanly.
- One broken artifact never blocks the full paper from streaming.

**Engineering time**: 2 days

### Stage 8: Tutor Panel and Viewport Context (2 days)

**Goal**: Make the tutor aware of what the user is looking at.

**Work**:
- Build the always-open tutor panel.
- Track visible scenes/elements after pan/zoom settle.
- Include viewport chips and quick actions in tutor requests.

**Exit criteria**:
- The tutor can explain the currently visible scene without the user naming it explicitly.
- Tutor replies can spawn a new scene request.

**Engineering time**: 2 days

### Stage 9: Canvas Extension and Multi-Paper Support (1.5 days)

**Goal**: Let the lecture canvas keep growing after first render.

**Work**:
- Add `extend.py` route for comparison, derivation, and new-paper requests.
- Place new scenes adjacent to their references.
- Support second-paper column and cross-paper connectors.

**Exit criteria**:
- Chat can generate a comparison scene beside an existing concept.
- Adding a second paper does not collide IDs or break layout.

**Engineering time**: 1.5 days

### Stage 10: Motion, Export, and UX Polish (2 days)

**Goal**: Make the system feel deliberate instead of technically functional.

**Work**:
- Add scene materialization motion, connector draw-in, and loading shimmer.
- Refine camera transitions and fit-to-scene behavior.
- Add export of scene or paper view as PNG/PDF.

**Exit criteria**:
- Generated scenes enter gracefully and remain readable while streaming.
- Export works for at least one scene and one full paper snapshot.

**Engineering time**: 2 days

### Stage 11: Evaluation and Hardening (2 days)

**Goal**: Validate that the new framework is usable, fast enough, and robust.

**Work**:
- Add tests for autoplay artifacts, prose rendering, math rendering, and multi-paper sessions.
- Measure first-scene time, full-paper time, and repair rate.
- Audit failure modes on 3-5 representative papers.

**Exit criteria**:
- Runtime metrics are recorded and compared against the latency budget.
- Known failure classes have fallback behavior.

**Engineering time**: 2 days

### Delivery Summary

| Milestone | Stages | Outcome | Effort |
|---|---|---|---:|
| Milestone A | 0-3 | static lecture canvas with hardcoded scenes | 7 days |
| Milestone B | 4-7 | real paper -> streamed scenes end-to-end | 9 days |
| Milestone C | 8-11 | tutor, extension, multi-paper, polish, evaluation | 7.5 days |

**Core implementation**: 23.5 engineering days

**Recommended buffer**: +15% integration and prompt-tuning slack

**Practical solo estimate**: 27-28 working days

### Fastest Credible MVP

If the goal is to see the new paradigm working quickly, the shortest credible cut is:

- Stages 0-3 for the canvas and scene primitives
- Stage 4 for scene planning
- Stage 5 for prose generation
- Stage 6 with only 2 artifact families
- Stage 7 with minimal validation

That yields a usable first version in **12-14 working days**, but without multi-paper, tutor extension depth, or full hardening.

---

## What "Free-Flowing" Actually Means

The user asked for "free-flowing." Here's how V3 achieves this at every level:

| Constraint | V2 | V3 |
|---|---|---|
| Artifact size | Fixed 440×320 | Variable 420×260 to 900×400 |
| Element position | Grid layout, fixed columns | Free placement, user can drag anything |
| Concept count | Fixed by AI | AI generates base; user/chat can add more |
| Papers | One at a time | Multiple, any time, added by dragging |
| Narrative flow | Linear card-by-card | Spatial — user reads in any order |
| Canvas boundary | Bounded scroll area | Truly infinite |
| Chat response | Text only | Text + optional new canvas elements |
| Formulas | Embedded in artifact | Separate highlighted formula blocks |
| AI additions | Fixed grid positions | Materialize at contextually appropriate positions |
| Zoom level | Fixed viewport | 0.2× to 2.5× — can zoom out to see whole paper |
| Sessions | Single paper | Multi-paper episodes with cross-references |

---

## The Complete Canvas At Full Zoom-Out

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         PAPER 1: Neural Dynamics Control            PAPER 2: [if added]  │
│                                                                                          │
│  ┌──────────────────────────────┐                                                        │
│  │  🎯 HOOK                     │                                                        │
│  │  [artifact] [prose+formulas] │                                                        │
│  └──────────────────────────────┘                                                        │
│                │                                                                          │
│                │ ─ ─ ─ sequential thread ─ ─ ─                                            │
│                │                                                                          │
│  ┌──────────────────────────────┐                                                        │
│  │  🏗️ FOUNDATION               │                                                        │
│  │  [artifact] [prose+formulas] │                                                        │
│  └──────────────────────────────┘                                                        │
│                │                                                                          │
│                │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                                              │
│                │                                                                          │
│  ┌──────────────────────────────┐                                                        │
│  │  ⚙️ MECHANISM                 │                                                        │
│  │  [wide artifact] [prose]     │             ←── [COMPARISON scene, AI-generated] ──→   │
│  │  [two-col formula]           │                                                        │
│  └──────────────────────────────┘                                                        │
│                │                                                                          │
│               ...                                                                         │
│                                                                                          │
│  ┌──────────────────────────────┐                                                        │
│  │  🔗 SYNTHESIS                 │                                                        │
│  │  [full-width architecture]   │                                                        │
│  └──────────────────────────────┘                                                        │
│                                                                                          │
│                                                        [minimap: 160×120px]              │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

This is what the user sees when they zoom out. The paper becomes a spatial document, a living lecture they can navigate freely.
