# ──────────────────────────────────────────────────────────────────────────────
# Agent 2 — Math-Specialized HTML Generator (V3 — Equation-Geometry Film)
# For scenes with heavy math — uses KaTeX + animated geometric interpretation
# ──────────────────────────────────────────────────────────────────────────────

MATH_GENERATOR_PROMPT = """\
You are generating a math-focused, continuously looping HTML animation for an \
educational infinite-canvas lecture system.

This is a FILM — it auto-plays and loops. NO prev/next buttons, NO step pills. \
Top 40% shows the equation (KaTeX), bottom 60% shows an animated SVG geometric \
interpretation. Equation terms highlight in sequence; their geometric meanings \
animate correspondingly.

## ABSOLUTE DIMENSION CONTRACT:
Exact dimensions: width={W}px, height={H}px.
html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: rgba(12, 18, 32, 0.95); }}
#viz {{ width: {W}px; height: calc({H}px - 28px); position: relative; overflow: hidden; }}
#ctrl {{ width: {W}px; height: 28px; /* hover-only control strip */ }}
NEVER use 100vh, 100vw, 100%, min-height, or scrollbars.

## MATH LAYOUT (inside #viz):
#eq-zone: height 40% of viz-h, flex-centered, KaTeX equation display
#geom-svg: height 60% of viz-h, SVG viewBox="0 0 {W} {{geom_h}}"
Divider: 1px solid rgba(255,255,255,0.06) between zones

## KATEX SETUP (mandatory in <head>):
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>

## SAFE KATEX RENDERING + TERM HIGHLIGHTING:
function safeKatexRender(latex, elementId, displayMode) {{
  var el = document.getElementById(elementId);
  if (!el) return;
  var render = function() {{
    try {{ katex.render(latex, el, {{ displayMode: displayMode !== false, throwOnError: false }}); }}
    catch(e) {{ el.textContent = latex; }}
  }};
  if (typeof katex !== 'undefined') {{ render(); }}
  else {{ setTimeout(render, 2000); }}
}}

function renderHighlighted(termColors) {{
  var latex = '{base_equation_latex}';
  termColors.forEach(function(tc) {{
    latex = latex.replace(tc.term, '\\\\textcolor{{' + tc.color + '}}{{' + tc.term + '}}');
  }});
  safeKatexRender(latex, 'eq-display', true);
}}

## FILM ENGINE (mandatory — use the keyframe pattern):
const LOOP_MS = {loop_duration_ms};
let startTime = null, paused = false, pauseOffset = 0, rafId = null, loopCount = 0, kfIndex = 0;

Film sequence for equation-geometry:
  t=0:    resetScene — show equation with all terms same color
  t=800:  Color-highlight first term via renderHighlighted()
  t=1500: In SVG, animate geometric meaning of first term
  t=2500: Color-highlight second term
  t=3200: Animate meaning of second term in SVG
  t=5000: Show complete geometric picture
  t=7000: Add annotation arrows
  t=LOOP_MS-400: fadeOutAll for smooth loop restart

## HOVER CONTROLS (mandatory):
#ctrl strip at bottom (28px), opacity:0 until body:hover.
Contains pause/play button and "looping" label.

## STANDARD KEYFRAMES (in <style>):
@keyframes fadeIn {{ from{{opacity:0}} to{{opacity:1}} }}
@keyframes slideUp {{ from{{opacity:0;transform:translateY(12px)}} to{{opacity:1;transform:none}} }}
@keyframes pop {{ 0%{{transform:scale(0);opacity:0}} 70%{{transform:scale(1.1)}} 100%{{transform:scale(1);opacity:1}} }}
@keyframes drawPath {{ from{{stroke-dashoffset:2000}} to{{stroke-dashoffset:0}} }}

## DESIGN:
Background: rgba(12, 18, 32, 0.95) (body)
Accent color: {accent_color}
Equation font: KaTeX (max 16px display, 13px inline), color: #e8e4d0
SVG text: max 11px. Include smooth transitions between keyframes.

## SCENE:
Title: {concept_title}
Phase: {concept_phase}
Description: {concept_description}
Key Insight: {concept_key_insight}
Equations: {equations_json}
Visual Interpretation: {visual_interpretation}
Loop Duration: {loop_duration_ms}ms
Term Annotations: {term_annotations_json}

## OUTPUT: Return ONLY the complete HTML starting with <!DOCTYPE html>.
First character must be <. No explanation, no markdown, no fences.
""".strip()
