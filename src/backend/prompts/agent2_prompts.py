# ──────────────────────────────────────────────────────────────────────────────
# Agent 2 — HTML Artifact Generator (V3 — Continuous Looping Animations)
# ──────────────────────────────────────────────────────────────────────────────

PHASE_COLORS = {
    "HOOK": "#f06080",
    "FOUNDATION": "#3d8ef0",
    "MECHANISM": "#00c49a",
    "EVIDENCE": "#e8a020",
    "IMPLICATIONS": "#9575f0",
    "SYNTHESIS": "#f07040",
}


def _accent_for(phase: str, fallback: str = "#e8a020") -> str:
    return PHASE_COLORS.get(phase.upper(), fallback)


FULL_GENERATOR_PROMPT = """\
You are generating a self-contained, continuously animated HTML artifact for an \
educational infinite-canvas lecture system.

The artifact is a FILM — it auto-plays in a continuous loop. \
There are NO prev/next buttons, NO step pills, NO navigation chrome. \
Think of it as a beautiful looping GIF rendered in SVG/Canvas.

## ABSOLUTE DIMENSION CONTRACT — VIOLATING THIS IS A CRITICAL FAILURE:
The Scene Planner specifies exact dimensions: width={W}px, height={H}px.
html, body {{ width: {W}px; height: {H}px; overflow: hidden; }}
NEVER use 100vh, 100vw, 100%, min-height, scrollbars, or values exceeding {W}px/{H}px.

## REQUIRED CSS RESET:
:root {{
  --W: {W}px;
  --H: {H}px;
  --ctrl-h: 28px;
  --viz-h: calc({H}px - 28px);
  --accent: {accent_color};
  --bg: rgba(12, 18, 32, 0.95);
  --surface: rgba(255,255,255,0.04);
  --text: #dde4f0;
  --text-2: #6e7d96;
  --text-3: #3a4558;
  --border: rgba(255,255,255,0.07);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; }}
#viz {{ width: {W}px; height: var(--viz-h); position: relative; overflow: hidden; }}
#ctrl {{ width: {W}px; height: var(--ctrl-h); display: flex; align-items: center; justify-content: center; gap: 12px; opacity: 0; transition: opacity 0.2s; background: rgba(0,0,0,0.4); }}
body:hover #ctrl {{ opacity: 1; }}
#ctrl button {{ background: none; border: 1px solid rgba(255,255,255,0.15); color: var(--text-2); border-radius: 4px; padding: 2px 10px; font-size: 10px; cursor: pointer; transition: 0.15s; letter-spacing: 0.05em; }}
#ctrl button:hover {{ border-color: var(--accent); color: var(--text); }}
#progress {{ height: 2px; background: var(--accent); width: 0%; position: absolute; bottom: 0; left: 0; opacity: 0.6; }}

## MANDATORY HTML SKELETON:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={W}">
  <style>/* CSS from above + your custom styles */</style>
</head>
<body>
  <div id="viz">
    <!-- ALL ANIMATED CONTENT HERE — SVG or Canvas -->
    <div id="progress"></div>
  </div>
  <div id="ctrl">
    <button id="btn-pause" onclick="togglePause()">⏸ pause</button>
    <span id="loop-count" style="font-size:10px;color:var(--text-3)">looping</span>
  </div>
  <script>
    // FILM ENGINE — see below
  </script>
</body>
</html>

## FILM ENGINE (mandatory — paste into <script>):
const LOOP_MS = {loop_duration_ms};
let startTime = null, paused = false, pauseOffset = 0, rafId = null, loopCount = 0;

const keyframes = [
  {{ t: 0,    fn: resetScene }},
  // ... define keyframes at specific ms offsets
  {{ t: LOOP_MS - 400, fn: fadeOutAll }}
];
let kfIndex = 0;

function tick(ts) {{
  if (!startTime) startTime = ts;
  if (paused) return;
  const elapsed = (ts - startTime - pauseOffset) % LOOP_MS;
  const progress = elapsed / LOOP_MS;
  var pb = document.getElementById('progress');
  if (pb) pb.style.width = (progress * 100) + '%';
  while (kfIndex < keyframes.length && elapsed >= keyframes[kfIndex].t) {{
    try {{ keyframes[kfIndex].fn(); }} catch(e) {{ console.warn('keyframe err', e); }}
    kfIndex++;
  }}
  var prevElapsed = ((ts - startTime - pauseOffset - 16) % LOOP_MS + LOOP_MS) % LOOP_MS;
  if (prevElapsed > elapsed) {{
    kfIndex = 0; loopCount++;
    var lc = document.getElementById('loop-count');
    if (lc) lc.textContent = loopCount === 1 ? 'looping' : 'loop ' + loopCount;
  }}
  rafId = requestAnimationFrame(tick);
}}

function togglePause() {{
  paused = !paused;
  var btn = document.getElementById('btn-pause');
  if (paused) {{ if (btn) btn.textContent = '▶ play'; cancelAnimationFrame(rafId); }}
  else {{ if (btn) btn.textContent = '⏸ pause'; startTime = null; pauseOffset = 0; rafId = requestAnimationFrame(tick); }}
}}

function safe(id) {{ var el = document.getElementById(id); if (!el) console.warn('Missing:', id); return el; }}
function show(id, anim) {{ var el = safe(id); if (el) {{ el.style.display = ''; if (anim) {{ el.style.animation = ''; el.offsetHeight; el.style.animation = anim; }} }} }}
function hide(id) {{ var el = safe(id); if (el) el.style.display = 'none'; }}
function animatePath(id, dur) {{ var el = safe(id); if (!el) return; var len = el.getTotalLength ? el.getTotalLength() : 500; el.style.strokeDasharray = len; el.style.strokeDashoffset = len; el.style.transition = 'stroke-dashoffset '+(dur||1.5)+'s var(--ease-out)'; el.offsetHeight; el.style.strokeDashoffset = 0; }}

function resetScene() {{ /* hide all animated elements, reset to initial */ }}
function fadeOutAll() {{ /* fade everything for smooth loop restart */ }}
function initVisuals() {{ /* set up SVG, initial display:none states */ }}
function showFallback() {{ var viz = document.getElementById('viz'); if (viz) viz.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-2);font-size:12px;flex-direction:column;gap:8px;"><div style="color:var(--accent);font-size:14px;">{concept_title}</div><div>{concept_key_insight}</div></div>'; }}

document.addEventListener('DOMContentLoaded', function() {{
  try {{ initVisuals(); rafId = requestAnimationFrame(tick); }}
  catch(e) {{ console.error('Init failed:', e); showFallback(); }}
}});

## STANDARD KEYFRAMES (include in <style>):
@keyframes fadeIn   {{ from{{opacity:0}} to{{opacity:1}} }}
@keyframes fadeOut  {{ from{{opacity:1}} to{{opacity:0}} }}
@keyframes slideUp  {{ from{{opacity:0;transform:translateY(12px)}} to{{opacity:1;transform:none}} }}
@keyframes pop      {{ 0%{{transform:scale(0);opacity:0}} 70%{{transform:scale(1.1)}} 100%{{transform:scale(1);opacity:1}} }}
@keyframes drawPath {{ from{{stroke-dashoffset:2000}} to{{stroke-dashoffset:0}} }}
@keyframes pulse    {{ 0%,100%{{opacity:0.5}} 50%{{opacity:1}} }}
@keyframes glow     {{ 0%,100%{{box-shadow:0 0 8px var(--accent)40}} 50%{{box-shadow:0 0 20px var(--accent)80}} }}
@keyframes grow     {{ from{{transform:scaleY(0);transform-origin:bottom}} to{{transform:scaleY(1);transform-origin:bottom}} }}

## ANIMATION TYPE PLAYBOOKS:

path-evolution: SVG paths that draw in sequentially. Start node pops in, suboptimal dashed paths appear, then the optimal path animates with stroke-dashoffset. A particle moves along the path.
field-animation: Canvas-based 2D heatmap that animates from neutral to shaped. Particles attracted toward minimum.
mechanism-reveal: SVG groups fade in sequentially — input layer → connections → hidden layers → output. Each group uses pop/slideUp animation.
comparison-cards: 2-3 panels side by side. Film sequence: neutral → highlight panel A limitation → highlight B → emphasize C advantage.
data-reveal: Canvas bar/line chart. Bars grow from bottom, "ours" bar gets glow highlight + value pop.
equation-geometry: Top 40% = KaTeX equation display, bottom 60% = animated SVG geometric interpretation. Terms highlight in sequence with matching geometry.

## MATH (if concept has_math is true):
Include KaTeX CDN links in <head>:
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>

Use programmatic rendering:
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

## DESIGN TOKENS:
Background: rgba(12, 18, 32, 0.95) (body)
Phase accent color: {accent_color}
Font sizes: ≤13px content, ≤11px labels, ≤9px annotations
SVG viewBox: "0 0 {W} {viz_h}" (viz_h = H - 28)
All SVG text: font-size max 13px for titles, 11px for labels, 9px for annotations.
Include at least 3 CSS animations. All SVG elements must have smooth transitions.

## CONTENT RULES:
1. All labels reference ACTUAL paper content — never generic "Node 1", "Item A".
2. Every animation serves a pedagogical purpose — no random motion.
3. The film must make sense without sound — visual storytelling only.
4. Loop restart must be smooth — fade out before LOOP_MS, fade in at t=0.
5. No Lorem Ipsum, no placeholder content, no "[TODO]".

## SCENE:
Title: {concept_title}
Phase: {concept_phase}
Description: {concept_description}
Key Insight: {concept_key_insight}
Animation Type: {animation_type}
Loop Duration: {loop_duration_ms}ms
Visual Elements: {visual_elements_json}
Color Palette: {color_palette}
Key Values: {key_values_json}
Has Math: {has_math}
Equations: {equations_json}

## OUTPUT: Return ONLY the complete HTML starting with <!DOCTYPE html>.
First character must be <. No explanation, no markdown, no fences.
""".strip()

SIMPLIFIED_GENERATOR_PROMPT = """\
Create a continuously looping HTML animation. Dimensions: {W}×{H}px. No scrollbars. \
No prev/next buttons. The artifact is a silent film that auto-plays and loops.

REQUIRED HTML skeleton:
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{{box-sizing:border-box;margin:0;padding:0;}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:rgba(12,18,32,0.95);color:#dde4f0;font-family:system-ui,sans-serif;}}
#viz{{width:{W}px;height:calc({H}px - 28px);position:relative;overflow:hidden;}}
#ctrl{{width:{W}px;height:28px;display:flex;align-items:center;justify-content:center;gap:12px;opacity:0;transition:opacity 0.2s;background:rgba(0,0,0,0.4);}}
body:hover #ctrl{{opacity:1;}}
#ctrl button{{background:none;border:1px solid rgba(255,255,255,0.15);color:#6e7d96;border-radius:4px;padding:2px 10px;font-size:10px;cursor:pointer;}}
#progress{{height:2px;background:{accent_color};width:0%;position:absolute;bottom:0;left:0;opacity:0.6;}}
@keyframes fadeIn{{from{{opacity:0}}to{{opacity:1}}}}
@keyframes slideUp{{from{{opacity:0;transform:translateY(12px)}}to{{opacity:1;transform:none}}}}
@keyframes pop{{0%{{transform:scale(0);opacity:0}}70%{{transform:scale(1.1)}}100%{{transform:scale(1);opacity:1}}}}
</style></head>
<body>
<div id="viz">
  <!-- SVG content here, viewBox="0 0 {W} {viz_h}" -->
  <div id="progress"></div>
</div>
<div id="ctrl">
  <button id="btn-pause" onclick="togglePause()">⏸ pause</button>
  <span id="loop-count" style="font-size:10px;color:#3a4558">looping</span>
</div>
<script>
const LOOP_MS={loop_duration_ms};
let startTime=null,paused=false,pauseOffset=0,rafId=null,loopCount=0,kfIndex=0;
const keyframes=[{{t:0,fn:resetScene}},/* YOUR KEYFRAMES */{{t:LOOP_MS-400,fn:fadeOutAll}}];
function tick(ts){{if(!startTime)startTime=ts;if(paused)return;var elapsed=(ts-startTime-pauseOffset)%LOOP_MS;var pb=document.getElementById('progress');if(pb)pb.style.width=(elapsed/LOOP_MS*100)+'%';while(kfIndex<keyframes.length&&elapsed>=keyframes[kfIndex].t){{try{{keyframes[kfIndex].fn();}}catch(e){{}}kfIndex++;}}var prev=((ts-startTime-pauseOffset-16)%LOOP_MS+LOOP_MS)%LOOP_MS;if(prev>elapsed){{kfIndex=0;loopCount++;}}rafId=requestAnimationFrame(tick);}}
function togglePause(){{paused=!paused;var btn=document.getElementById('btn-pause');if(paused){{if(btn)btn.textContent='▶ play';cancelAnimationFrame(rafId);}}else{{if(btn)btn.textContent='⏸ pause';startTime=null;pauseOffset=0;rafId=requestAnimationFrame(tick);}}}}
function safe(id){{return document.getElementById(id);}}
function show(id,a){{var el=safe(id);if(el){{el.style.display='';if(a){{el.style.animation='';el.offsetHeight;el.style.animation=a;}}}}}}
function hide(id){{var el=safe(id);if(el)el.style.display='none';}}
function resetScene(){{/* hide all */}}
function fadeOutAll(){{/* fade all */}}
document.addEventListener('DOMContentLoaded',function(){{try{{resetScene();rafId=requestAnimationFrame(tick);}}catch(e){{console.error(e);}}}});
</script></body></html>

Scene: {concept_title}
Key insight: {concept_key_insight}
Description: {concept_description}
Animation type: {animation_type}
Visual elements: {visual_elements_json}

Fill in the SVG content and keyframes. Return ONLY the complete HTML.
""".strip()

MINIMAL_GENERATOR_PROMPT = """\
Create a valid HTML page, EXACTLY {W}×{H}px, dark theme, no scrollbars.
The artifact must auto-loop — no navigation buttons.
Show: title="{concept_title}", insight="{concept_key_insight}"
Use at least one CSS animation (fadeIn or pulse). Include a progress bar at the bottom.
Accent color: {accent_color}

REQUIRED CSS:
*{{box-sizing:border-box;margin:0;padding:0;}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:rgba(12,18,32,0.95);color:#dde4f0;font-family:system-ui,sans-serif;}}

Return only HTML starting with <!DOCTYPE html>.
""".strip()


def build_agent2_input(
    paper_metadata: dict,
    scene: dict,
    index: int,
    total: int,
    previous_titles: list[str],
) -> str:
    """Build the user-message payload for Agent 2 from a V3 scene spec."""
    artifact_spec = scene.get("artifact_spec") or scene.get("artifact", {})
    visual_elements = artifact_spec.get("visual_elements", [])
    visuals = "\n  ".join(visual_elements) if visual_elements else "N/A"
    color_palette = artifact_spec.get("color_palette", "teal primary")
    key_values = artifact_spec.get("key_values", [])
    key_vals = "\n  ".join(key_values) if key_values else "N/A"
    equations = scene.get("equations", [])
    eq_str = ", ".join(equations) if equations else "none"
    prev = ", ".join(previous_titles) if previous_titles else "none (first scene)"

    return (
        f"PAPER CONTEXT\n"
        f"  Title            : {paper_metadata.get('title', 'Unknown')}\n"
        f"  Type             : {paper_metadata.get('type', 'HYBRID')}\n"
        f"  Core contribution: {paper_metadata.get('core_contribution', '')}\n"
        f"\nSCENE TO ANIMATE  ({index + 1} of {total})\n"
        f"  ID               : {scene.get('id')}\n"
        f"  Title            : {scene.get('title')}\n"
        f"  Subtitle         : {scene.get('subtitle', '')}\n"
        f"  Phase            : {scene.get('phase')}\n"
        f"  Description      : {scene.get('description')}\n"
        f"  Key insight      : {scene.get('key_insight')}\n"
        f"  Animation type   : {artifact_spec.get('animation_type', 'mechanism-reveal')}\n"
        f"  Loop duration    : {artifact_spec.get('loop_duration_ms', 8000)}ms\n"
        f"  Animation desc   : {artifact_spec.get('description', '')}\n"
        f"  Color palette    : {color_palette}\n"
        f"  Visual elements  :\n  {visuals}\n"
        f"  Key values       :\n  {key_vals}\n"
        f"  Equations        : {eq_str}\n"
        f"  Previous scenes  : {prev}\n"
        f"\nGenerate the complete HTML artifact now."
    )
