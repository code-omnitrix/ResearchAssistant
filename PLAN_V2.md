# AI Research Canvas — V2 Plan
> Complete redesign based on V1 audit. Fixes artifact sizing, canvas UX, chat placement, math rendering, multi-paper extensibility, and UI quality.

---

## V1 Audit: What's Broken

### Critical Bugs
| Issue | Root Cause | Impact |
|---|---|---|
| Artifacts render as full-page apps | Generator prompt says nothing about container size | User has to zoom in/out constantly |
| Artifacts ignore display window | No `window.innerWidth/innerHeight` awareness | Content clips, overflows, unreadable |
| Rigid left-to-right flow | Linear array of cards, no spatial freedom | Feels like a PowerPoint, not a canvas |
| Chat on wrong side | Right panel blocks canvas | Not discoverable; node-selection context lost |
| No math rendering | No KaTeX/MathJax, formulas are raw LaTeX strings | Math-heavy papers are unreadable |
| UI aesthetic | Space Grotesk + generic dark gray + orange = boring | Looks like a dashboard template from 2020 |
| No knowledge graph | Flat grid layout, no edges or relationships | Semantic structure of paper is lost |
| Single-paper session | Session tied to one PDF | Can't compare papers or extend an episode |

### UI Quality Problems (Current)
- Canvas cards all identical size with no visual hierarchy
- Pipeline feed (right) and agent log (bottom-left) overlap actual content
- Font choices uninspired — Space Grotesk + Inter is the most default possible
- Orange `#FF4500` is aggressive and clashes with dark backgrounds at high saturation
- No depth — everything sits on the same flat plane
- Nodes don't reflect their semantic phase (HOOK looks same as SYNTHESIS)
- Focus mode is just an iframe dump with no personality

---

## V2 Vision

> A **living knowledge graph** where each research concept is a compact, animated visual card floating in an infinite dark canvas. The left panel is a context-aware AI tutor that knows which nodes you've touched. The canvas can host multiple papers, draw relationships between them, and extend dynamically as the user asks follow-up questions.

---

## V2 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         V2 APPLICATION SHELL                             │
├────────────────┬────────────────────────────────────┬───────────────────┤
│  LEFT PANEL    │         INFINITE CANVAS             │   TOP RIGHT       │
│  (320px)       │   (fills remaining width)           │   (utility bar)   │
│                │                                     │                   │
│  ┌──────────┐  │  ┌──────────────────────────────┐  │ Search  Zoom  Add │
│  │ CHAT     │  │  │                              │  │ Paper   Reset     │
│  │ TUTOR    │  │  │   KNOWLEDGE GRAPH CANVAS     │  └───────────────────┘
│  │          │  │  │   ┌─────┐    ┌─────┐        │
│  │ Context- │  │  │   │ N1  │───▶│ N2  │        │
│  │ aware of │  │  │   └─────┘    └─────┘        │
│  │ selected │  │  │       ╲         │            │
│  │ node     │  │  │   ┌─────┐  ┌─────┐          │
│  │          │  │  │   │ N3  │  │ N4  │          │
│  │ Markdown │  │  │   └─────┘  └─────┘          │
│  │ response │  │  │                              │
│  │          │  │  │   [paper 2 cluster]          │
│  │ ─────── │  │  │   [comparison bridge]        │
│  │ Input    │  │  └──────────────────────────────┘
│  │ [    →] │  │
│  │          │  │  NODE ANATOMY:
│  │ Context  │  │  ┌─────────────────────────────┐
│  │ chips:   │  │  │ HOOK badge    Quality ●●●●○  │
│  │ #node1   │  │  │ ─────────────────────────── │
│  │ #compare │  │  │                             │
│  └──────────┘  │  │   COMPACT ARTIFACT          │
│                │  │   (440 × 320px iframe)       │
│  PAPERS        │  │                             │
│  ┌──────────┐  │  │   ─────────────────────── │
│  │ 📄 P1   │  │  │ Key insight text here       │
│  │ 📄 P2   │  │  └─────────────────────────────┘
│  │ + Add   │  │
│  └──────────┘  │
└────────────────┴────────────────────────────────────────────────────────┘
```

---

## Artifact Specification — THE MOST CRITICAL CHANGE

### Target Dimensions
Every generated artifact must render correctly inside a **440 × 320px** iframe. This is non-negotiable.

### What "Compact" Means

**BEFORE (wrong):** Full-page HTML with `height: 100vh`, `min-height: 600px`, scrollable content, 3rem padding, huge font sizes.

**AFTER (correct):** Bounded card with:
```
Total container: 440px wide × 320px tall
├── Visualization area: 440px × 220px (70%)
│   └── SVG/Canvas coordinate system: 440 × 220
├── Caption strip: 440px × 60px (19%)
│   └── Key insight text, max 2 lines
└── Navigation strip: 440px × 40px (13%)
    └── Step pills + prev/next arrows
```

The artifact must:
- **NEVER** use `100vh`, `100vw`, or values over `440px` width / `320px` height
- **NEVER** have scroll bars
- Use `const W = 440, H = 220` as coordinate constants in all drawing code
- Scale all SVG viewBoxes to `0 0 440 220`
- Use font sizes ≤ 13px for labels, ≤ 11px for annotations
- Use compact spacing: padding max 8px, gap max 6px

### Step-Based Navigation (mandatory internal structure)

All artifacts are step-based, like the reference images. Every artifact must have:

```javascript
const steps = [
  { title: "Step title", draw: () => { /* SVG manipulation */ }, caption: "short explanation" },
  // 2-5 steps per concept
];
let current = 0;

// Navigation
function goTo(n) {
  current = Math.max(0, Math.min(n, steps.length - 1));
  render();
  updatePills();
  updateCounter();
}

// UI elements (embedded in HTML)
// - prev/next buttons (30px height)
// - step pills (pill dots at bottom)
// - "X / N" counter text
// - auto-advance toggle
```

### Math Rendering
Inject KaTeX via CDN and render all LaTeX:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body, {delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]})">
</script>
```

For math-heavy concepts (equations, proofs), the artifact layout changes:
```
440 × 320:
├── Equation display area (KaTeX rendered): 440 × 120px
├── Visual interpretation (SVG geometric view): 440 × 120px  
└── Navigation + caption: 440 × 80px
```

---

## V2 Canvas: Knowledge Graph Design

### Node Types & Visual Language

```
Phase → Border color → Badge color → Icon
──────────────────────────────────────────
HOOK        → amber    → amber     → 🎯
FOUNDATION  → blue     → blue      → 🏗️
MECHANISM   → teal     → teal      → ⚙️
EVIDENCE    → violet   → violet    → 📊
IMPLICATIONS→ rose     → rose      → 🌟
SYNTHESIS   → amber    → amber     → 🔗
COMPARISON  → orange   → orange    → ⚖️
QUERY       → green    → green     → 💬
```

### Node Card Design (redesigned)

```
┌─────────────────────────────────────────┐  ← border: 1px phase-color at 40% opacity
│  HOOK ●●●●● Quality 94     📄 Paper 1  │  ← top strip: 36px
│ ───────────────────────────────────────│
│                                         │
│        COMPACT ARTIFACT HERE           │  ← iframe: 440×220px
│        (animated, no scroll)           │
│                                         │
│ ───────────────────────────────────────│
│  The Hamilton-Jacobi-Bellman equation  │  ← key insight: 2 lines max, 12px
│  defines the cost-to-go globally.      │  
│ ───────────────────────────────────────│
│  ◉ Expand  ↗ Focus  💬 Ask  ⋯ More   │  ← action strip: 32px
└─────────────────────────────────────────┘
```

Total node size: 460px × 360px (including outer card padding/shadow)

### Graph Edges
- Directed arrows from prerequisite → dependent concept
- Arrow style: 1.5px dashed, `rgba(255,255,255,0.15)`, with animated dashes
- Edge labels: tiny, e.g. "builds on", "validates", "compares"
- Multi-paper edges: thicker, orange, labeled "see also" / "contradicts" / "extends"

### Canvas Interactions
| Gesture | Action |
|---|---|
| Click node | Select → highlight edges → populate left chat context |
| Double-click | Open focus mode (full iframe overlay) |
| Drag node | Reposition freely on infinite canvas |
| Drag empty space | Pan canvas |
| Scroll | Zoom in/out (0.3× – 2×) |
| Right-click node | Context menu: Ask, Compare, Deep Dive, Remove |
| Drag paper onto canvas | Add new paper to episode |

### Knowledge Graph Layout
- **Automatic initial layout**: Sugiyama-style layered layout (top-to-bottom phases)
- **Force-directed refinement**: After initial placement, light spring forces keep nodes readable
- **Cluster by paper**: Each paper gets a soft background bubble (translucent, colored differently per paper)
- **User override**: Full drag-to-reposition at any time; layout locks after first drag

---

## V2 Left Panel: Contextual Chat

### Design
```
┌─────────────────────────────────────────────────────┐
│  RESEARCH TUTOR                            ⊘ Clear  │
│                                                     │
│  Context: The HJB Equation                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📌 Selected: concept_003                   │   │
│  │    "Optimal Control & HJB"                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🤖 The HJB equation V*(x) = min_u [l(x,u)  │   │
│  │    + ∇V·f(x,u)] can be interpreted as a    │   │
│  │    global map of "effort to reach goal"    │   │
│  │    from every state simultaneously.        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 👤 Compare this to NMPC approach            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🤖 Good question! Here's a new comparison   │   │
│  │    visualization:                           │   │
│  │    [📊 Inline mini-artifact generated]      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Quick actions:                                     │
│  [quiz me] [deeper] [simplify] [show math]         │
│                                                     │
│  ─────────────────────────────────────────────     │
│  [  Ask about this concept or paper...  ] [→]      │
└─────────────────────────────────────────────────────┘
```

### Chat-Driven Canvas Extension
When the AI tutor generates a response that warrants a new artifact:
1. A new node spawns on the canvas tagged `QUERY` (green border)
2. The node is connected to the node(s) that prompted the query
3. The chat panel scrolls to show a mini-preview of the generated artifact
4. User can drag it to any position

Triggers for new artifact generation:
- "Compare X and Y" → new COMPARISON node spanning both source nodes
- "Show me the math for..." → EQUATION node
- "What would happen if..." → SIMULATION node
- "Add this paper too" → new paper cluster + merge edges

---

## V2 Multi-Paper / Episode System

### Episode Model
```
Episode {
  id: string
  papers: PaperEntry[]     // multiple papers
  graph: KnowledgeGraph    // shared node/edge store
  queries: QueryEntry[]    // user-driven additions
}

PaperEntry {
  id: string
  title: string
  color: string            // teal/violet/rose per paper
  concepts: Concept[]
}
```

### Adding a Second Paper
1. User drags PDF onto canvas OR clicks `+ Add Paper` button
2. New paper cluster spawns bottom-right with semi-transparent paper color bubble
3. Agent 1 runs again for new paper
4. AI detects shared concepts / contradictions and auto-generates cross-paper edges
5. User can ask "compare paper 1 and paper 2 on X" → COMPARISON node created

### Cross-Paper Comparison Artifacts
A special artifact type for when two papers are being compared:
- Split-view layout: left half = paper 1's approach, right half = paper 2's approach
- Shared axis for quantitative comparison
- AI generates this as a single compact artifact (same 440×320 constraint)

---

## V2 UI Redesign

### Problems with Current UI
1. **Too much orange `#FF4500`** — used everywhere, loses meaning
2. **Space Grotesk is the single most overused font in developer tools** — immediately forgettable
3. **All surfaces same dark gray** — no depth perception
4. **Thin borders everywhere** — creates a "wireframe mockup" feel
5. **Pipeline feed overlaps canvas** — terrible information architecture
6. **Agent log at bottom-left** — buried, tiny, unreadable

### V2 Design Direction: "Research Lab at Night"

**Palette:**
```
Canvas background:    #080c14   (deep navy, not flat black)
Surface 1 (sidebar):  #0e1420   (slightly lighter navy)
Surface 2 (cards):    #131b2b   (card background)
Surface 3 (glass):    rgba(19, 27, 43, 0.85) + backdrop-blur(16px)

Phase accents (used only as thin borders + badges, not backgrounds):
  amber:  #e8a020   (HOOK, SYNTHESIS)
  blue:   #3d8ef0   (FOUNDATION)
  teal:   #00c49a   (MECHANISM)
  violet: #9575f0   (EVIDENCE)
  rose:   #f06080   (IMPLICATIONS)
  orange: #f07040   (COMPARISON — cross-paper)
  green:  #50c080   (QUERY nodes)

Text:
  Primary:   #dde4f0
  Secondary: #6e7d96
  Muted:     #3a4558
  
Glow accent (used VERY sparingly — only on active/selected nodes):
  box-shadow: 0 0 0 1px <phase-color>, 0 0 20px <phase-color>30
```

**Typography:**
```
Display (node titles):    'Instrument Serif', Georgia, serif
Body (text, chat):        'Geist', system-ui, sans-serif  
Mono (code, math labels): 'Berkeley Mono', 'JetBrains Mono', monospace
Micro (badges, labels):   'Geist', system-ui; weight 500; letter-spacing 0.08em

Google Fonts import:
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
```

**Motion Design:**
- Canvas pan/zoom: `transform` with `transition: none` during drag, `0.2s ease-out` on snap
- Node entrance: stagger 80ms apart, `translateY(24px) opacity(0)` → `translateY(0) opacity(1)`, `0.5s cubic-bezier(0.16, 1, 0.3, 1)`
- Edge draw: SVG stroke-dashoffset animation, `0.8s ease-out`, triggered when both nodes are visible
- Selection glow: `0.2s` glow pulse on click
- Iframe artifacts: fade-in `0.3s` after load
- Pipeline feed: slides in from right, `0.3s spring`

---

## V2 Project Structure

```
d:\om\Uptiq_ResearchAssistant\
│
├── src/
│   ├── backend/
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── pipeline.py            # POST /api/analyze → SSE
│   │   │   ├── interact.py            # POST /api/interact → tutor
│   │   │   └── query_artifact.py      # POST /api/query-artifact → on-demand node
│   │   ├── agents/
│   │   │   ├── paper_analyst.py
│   │   │   ├── html_generator.py      # V2: compact-only artifacts
│   │   │   ├── validator.py
│   │   │   ├── repair_agent.py
│   │   │   ├── tutor.py
│   │   │   └── graph_builder.py       # NEW: extracts edges between concepts
│   │   ├── pipeline/
│   │   │   └── orchestrator.py
│   │   ├── guardrails/
│   │   │   ├── input_guard.py
│   │   │   └── output_guard.py
│   │   ├── prompts/
│   │   │   ├── agent1_prompts.py
│   │   │   ├── agent2_prompts.py      # V2: compact artifact prompts
│   │   │   ├── agent2_math_prompts.py # NEW: specialized math artifact prompt
│   │   │   ├── agent3_prompts.py
│   │   │   ├── agent4_prompts.py
│   │   │   └── graph_prompts.py       # NEW: edge extraction prompt
│   │   └── utils/
│   │       ├── openrouter_client.py
│   │       ├── json_extractor.py
│   │       └── html_sanitizer.py      # V2: also checks for 100vh violations
│   │
│   └── frontend/
│       └── src/
│           ├── components/
│           │   ├── Canvas/
│           │   │   ├── InfiniteCanvas.tsx      # Pan/zoom root
│           │   │   ├── ConceptNode.tsx          # Node card + iframe
│           │   │   ├── GraphEdge.tsx            # SVG arrow between nodes
│           │   │   ├── PaperCluster.tsx         # Background bubble per paper
│           │   │   └── ComparisonNode.tsx       # Cross-paper comparison card
│           │   ├── Chat/
│           │   │   ├── ChatPanel.tsx            # Left panel tutor
│           │   │   ├── ChatMessage.tsx          # Message bubble (supports inline artifact)
│           │   │   └── ContextChip.tsx          # "#node-id" context reference
│           │   ├── Pipeline/
│           │   │   └── PipelineFeed.tsx         # Slide-in right panel during generation
│           │   ├── FocusMode/
│           │   │   └── FocusOverlay.tsx         # Full-screen node focus
│           │   └── TopBar.tsx
│           ├── hooks/
│           │   ├── useInfiniteCanvas.ts         # Pan, zoom, node drag logic
│           │   ├── useSSE.ts                    # SSE stream consumer
│           │   └── useGraph.ts                  # Knowledge graph state + layout
│           ├── store/
│           │   └── episodeStore.ts              # Zustand: multi-paper episode
│           └── services/
│               └── api.ts
│
└── AGENT_INSTRUCTIONS_V2.md
└── PLAN_V2.md
```

---

## V2 SSE Event Schema (extended)

```json
{ "type": "PAPER_RECEIVED",       "paperId": "p1",     "title": "..." }
{ "type": "GRAPH_READY",          "paperId": "p1",     "nodes": [...], "edges": [...] }
{ "type": "CONCEPTS_READY",       "paperId": "p1",     "payload": { paper_metadata, concept_sequence } }
{ "type": "GENERATING_START",     "conceptId": "c001", "paperId": "p1" }
{ "type": "CONCEPT_READY",        "conceptId": "c001", "paperId": "p1", "html": "...", "quality": 82, "position": {"x": 200, "y": 150} }
{ "type": "COMPARISON_READY",     "conceptIds": ["c001","c012"],       "html": "...", "quality": 90 }
{ "type": "QUERY_ARTIFACT_READY", "queryId": "q001",   "html": "...",  "parentIds": ["c003"] }
{ "type": "GUARDRAIL_BLOCKED",    "stage": "input",    "reason": "...", "category": "..." }
{ "type": "PIPELINE_COMPLETE",    "paperId": "p1",     "totalConcepts": 8 }
{ "type": "PIPELINE_ERROR",       "message": "..." }
```

---

## V2 Build Phases

### Phase 0: Pre-build (1 day)
- Audit and document all V1 artifact size violations
- Write test fixture: upload a known paper, assert NO generated HTML contains `100vh` or `height: 100%` on `body`
- Lock design tokens in `globals.css`

### Phase 1: Compact Artifact System (3 days) ← HIGHEST PRIORITY
1. Rewrite `agent2_prompts.py` with V2 compact constraint system
2. Add `agent2_math_prompts.py` for KaTeX-based math concepts
3. Update `html_sanitizer.py` to reject any HTML with `100vh` / scrollable body
4. Add size-check validation rule to Agent 3: "does artifact render within 440×320?"
5. Test against 5 papers: verify ALL artifacts fit card without scrollbars

### Phase 2: Knowledge Graph Backend (2 days)
1. `graph_builder.py`: LLM extracts edges (`concept_a → concept_b, type: "prerequisite|validates|extends"`)
2. Add `graph_prompts.py` with edge extraction prompt
3. Expose graph via `GRAPH_READY` SSE event
4. Add `/api/query-artifact` route for on-demand artifact generation

### Phase 3: Canvas Redesign (3 days)
1. `InfiniteCanvas.tsx`: pan (mouse drag), zoom (wheel), node placement
2. `ConceptNode.tsx`: new design, iframe embed, action strip
3. `GraphEdge.tsx`: animated SVG arrows
4. `PaperCluster.tsx`: translucent background bubbles
5. Layout engine: initial Sugiyama placement, then free drag

### Phase 4: Left Chat Panel (2 days)
1. `ChatPanel.tsx`: redesign, node selection context, inline artifact preview
2. Context chip system: clicking a node adds `#node-id` to chat context
3. Chat-driven canvas extension: generate QUERY/COMPARISON nodes from chat
4. `ContextChip.tsx`: clickable references in chat messages

### Phase 5: Multi-Paper System (2 days)
1. `episodeStore.ts`: multi-paper state, paper registry
2. Drag-to-add paper on canvas
3. Cross-paper edge detection
4. `ComparisonNode.tsx`: split-view card

### Phase 6: Focus Mode Redesign (1 day)
1. `FocusOverlay.tsx`: full-screen iframe + right metadata rail
2. Math rendering support in overlay
3. Export buttons (HTML, PNG via html2canvas)

### Phase 7: Pipeline Feed Redesign (1 day)
1. Slide-in from right, not overlaid on canvas
2. Dismissible per-event
3. Real-time quality score bar animation

### Phase 8: Polish + Eval (2 days)
1. Font imports, design token audit
2. Animation timing pass
3. Evaluation: artifact fit test, math rendering test, multi-paper test
4. Guardrail precision/recall tests

---

## V2 API Additions

| Endpoint | Method | Input | Output |
|---|---|---|---|
| `/api/analyze` | POST | PDF + `paperId` | SSE stream |
| `/api/interact` | POST | `{message, context, history}` | `{response, spawn_artifact?: {...}}` |
| `/api/query-artifact` | POST | `{query, paperIds, parentConceptIds, type}` | `{html, quality, position}` |
| `/api/health` | GET | — | `{status, version}` |

---

## V2 Evaluation Criteria

| Test | Metric | Pass Threshold |
|---|---|---|
| Artifact bounds: no `100vh` on body | Automated HTML scan | 100% compliance |
| Artifact fits 440×320 iframe | Visual regression (Playwright) | 0 scroll bars |
| Math renders (KaTeX) | Screenshot match | No raw LaTeX visible |
| Edge extraction accuracy | Manual review on 3 papers | ≥80% correct edges |
| Multi-paper merge | Integration test | 0 concept ID collisions |
| Guardrail injection detection | Precision/Recall | P≥90%, R≥85% |
| Generation throughput | Time per concept | <20s median |

---

## UI Comment on V1

The V1 UI looks like a generic dark SaaS admin panel. Problems:

1. **Orange `#FF4500`** used as both a navigation accent AND a primary CTA AND a hover color — it becomes noise. At full saturation on near-black, it causes eye strain.

2. **All cards identical height and width** in the grid view — a knowledge graph is supposed to communicate structure. When everything looks the same, there's no visual hierarchy and the user can't navigate by shape.

3. **Agent log + pipeline feed overlap the canvas** — this is the primary surface the user cares about and you're putting debug output on top of it. Move generation status out of the canvas entirely.

4. **Focus mode is just an iframe** — there's nothing that makes it feel like "focus mode." The right sidebar is a plain white box with some labels.

5. **Font pairing** (Space Grotesk + Inter) is the default choice every dev picks when they want a "professional" look. It communicates nothing about this being a research tool. Instrument Serif for titles communicates "academic document." Geist for UI communicates "precise, technical."

6. **No visual distinction between HOOK/FOUNDATION/MECHANISM** concepts on the canvas grid — all cards look identical. The phase badge is too small to read at a glance.

The V2 design addresses all of these by: replacing the orange accent with a per-phase color system, using serif display type for titles, building depth with navy layering instead of flat grays, and removing all canvas overlaps.
