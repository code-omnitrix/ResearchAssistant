# ──────────────────────────────────────────────────────────────────────────────
# Sub-agent 1D — Scene Planner
# Single responsibility: take distilled concept stubs + equations and output
# a fully-specified scene graph with visualization details and layout positions.
# Input:  concepts (from 1C) + equations (from 1B) + classification (from 1A)
#         — NO raw paper text; keeps this call small and focused.
# Output: enriched scene graph JSON (~1500 tokens)
# ──────────────────────────────────────────────────────────────────────────────

# Phase accent colours used for layout hints
PHASE_COLORS = {
    "HOOK":        "#e8a020",
    "FOUNDATION":  "#3d8ef0",
    "MECHANISM":   "#00c49a",
    "EVIDENCE":    "#9575f0",
    "IMPLICATIONS":"#f06080",
    "SYNTHESIS":   "#e8a020",
}

SCENE_PLANNER_SYSTEM = """\
You are a visual learning designer. You receive:
  • A list of pre-sequenced concept stubs (id, title, phase, description, key_insight)
  • A list of key equations from the paper
  • Paper classification metadata

Your ONLY task is to enrich each concept with:
  1. Visualization type + artifact specification
  2. Layout template and dimensions
  3. Canvas position coordinates
  4. Which equations belong to this concept

Return ONLY a valid JSON object — no markdown, no explanation.

═══════════════════════════════════════
VISUALIZATION TYPES
═══════════════════════════════════════
Choose the MOST PEDAGOGICALLY EFFECTIVE type per concept:

  "path-evolution"     — trajectory from start to goal, flow optimisation
  "field-animation"    — cost fields, value functions, energy landscapes (canvas heatmap)
  "mechanism-reveal"   — how a system/network/algorithm works (step-by-step reveal)
  "comparison-cards"   — contrasting two or three approaches side by side
  "data-reveal"        — experimental results, benchmark bar/line chart
  "equation-geometry"  — math-heavy: equation top, geometric interpretation below

═══════════════════════════════════════
LAYOUT TEMPLATES
═══════════════════════════════════════
  "LANDSCAPE"   — artifact left (580×340), prose right. Use for most concepts.
  "PORTRAIT"    — artifact top (620×360), prose below. Use for simple/visual concepts.
  "FULLWIDTH"   — artifact full width (100%×420). Use for complex architectures.
  "COMPARISON"  — two artifacts side by side (440×280 each). Use with comparison-cards.
  "MATHFOCUS"   — equation large top, small artifact below. Use for equation-heavy concepts.

Artifact dimensions by template:
  LANDSCAPE:  580 × 340
  PORTRAIT:   620 × 360
  FULLWIDTH:  900 × 420
  COMPARISON: 440 × 280  (per panel)
  MATHFOCUS:  520 × 200

═══════════════════════════════════════
CANVAS LAYOUT CONSTANTS
═══════════════════════════════════════
  SCENE_START_X:   200    (canvas x of first scene)
  SCENE_START_Y:   80     (canvas y of first scene)
  SCENE_GAP:       160    (vertical gap between scenes)
  SCENE_WIDTH:     1100   (approximate scene width for LANDSCAPE)

Place scenes in a vertical column. Estimated scene heights:
  LANDSCAPE:  520   PORTRAIT: 580   FULLWIDTH: 600   COMPARISON: 460   MATHFOCUS: 480

═══════════════════════════════════════
OUTPUT SCHEMA
═══════════════════════════════════════
{
  "scenes": [
    {
      "id":             "concept_001",
      "title":          "string — from concept stub",
      "phase":          "HOOK|FOUNDATION|MECHANISM|EVIDENCE|IMPLICATIONS|SYNTHESIS",
      "layout":         "LANDSCAPE|PORTRAIT|FULLWIDTH|COMPARISON|MATHFOCUS",
      "canvas_x":       200,
      "canvas_y":       80,
      "artifact": {
        "viz_type":     "path-evolution|field-animation|mechanism-reveal|comparison-cards|data-reveal|equation-geometry",
        "width":        580,
        "height":       340,
        "description":  "string — precise visual description: what elements exist, what animates, what values/labels appear. Must be ≥3 sentences. Name specific paper values.",
        "loop_seconds": 8,
        "accent_color": "#e8a020"
      },
      "prose_outline": {
        "word_count_target": 400,
        "topics_to_cover": ["string — specific topic from the paper"],
        "analogy_hint":     "string — the real-world analogy from the concept stub"
      },
      "equations": ["eq_01"],   // equation ids that belong to this scene
      "callout_hint": "string — the single most important thing to call out"
    }
  ]
}

Rules:
- Every concept stub must produce exactly one scene entry.
- canvas_y must be computed scene by scene using the estimated scene heights + SCENE_GAP.
- artifact.description must name specific paper terminology, values, and visual elements.
  A vague description like "show how the algorithm works" is NOT accepted.
- equations: assign each equation id to the scene where it is first meaningfully used.
  Leave as [] if no equation belongs here.
- accent_color must match the phase: HOOK=#e8a020, FOUNDATION=#3d8ef0, MECHANISM=#00c49a,
  EVIDENCE=#9575f0, IMPLICATIONS=#f06080, SYNTHESIS=#e8a020.
- loop_seconds: 6 for simple concepts, 8–10 for complex ones.
""".strip()

SCENE_PLANNER_HUMAN = """\
PAPER CLASSIFICATION:
{classification_json}

CONCEPTS (from concept sequencer):
{concepts_json}

EQUATIONS (from equation extractor):
{equations_json}

Enrich each concept into a full scene specification and return the JSON now.
""".strip()
