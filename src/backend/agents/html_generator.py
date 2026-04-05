import html as html_mod
import json as _json

from guardrails.output_guard import run_output_guard
from prompts.agent2_prompts import (
    FULL_GENERATOR_PROMPT,
    SIMPLIFIED_GENERATOR_PROMPT,
    MINIMAL_GENERATOR_PROMPT,
    _accent_for,
    build_agent2_input,
)
from prompts.agent2_math_prompts import MATH_GENERATOR_PROMPT
from utils.html_sanitizer import sanitize_html
from utils.openrouter_client import get_openrouter_chat, invoke_with_retry


PROMPT_TIERS = [FULL_GENERATOR_PROMPT, SIMPLIFIED_GENERATOR_PROMPT, MINIMAL_GENERATOR_PROMPT]


def fallback_html(scene: dict) -> str:
    """V3 fallback artifact — static card with real content, matching scene dimensions."""
    title = html_mod.escape(scene.get("title", "Scene"))
    desc = html_mod.escape(scene.get("description", "Details unavailable."))
    insight = html_mod.escape(scene.get("key_insight", "Insight unavailable."))
    phase = html_mod.escape(scene.get("phase", "CONCEPT"))
    accent = _accent_for(phase)
    artifact_spec = scene.get("artifact_spec") or scene.get("artifact", {})
    w = artifact_spec.get("width", 580)
    h = artifact_spec.get("height", 340)
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><style>
*{{box-sizing:border-box;margin:0;padding:0;}}
html,body{{width:{w}px;height:{h}px;overflow:hidden;background:rgba(12,18,32,0.95);color:#dde4f0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;}}
.center{{text-align:center;padding:20px;max-width:{w-40}px;}}
.badge{{display:inline-block;background:{accent}22;color:{accent};border:1px solid {accent}44;border-radius:4px;padding:2px 10px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:14px;}}
h2{{font-size:16px;line-height:1.4;margin-bottom:10px;color:#e8edf5;}}
p{{font-size:12px;line-height:1.6;color:#6e7d96;}}
@keyframes fadeIn{{from{{opacity:0}}to{{opacity:1}}}}
.center{{animation:fadeIn 0.6s ease}}
</style></head>
<body><div class="center">
<div class="badge">{phase}</div>
<h2>{title}</h2>
<p>{insight}</p>
</div></body></html>"""


def _format_prompt(prompt_template: str, scene: dict, paper_metadata: dict) -> str:
    """Fill V3 template placeholders from scene spec."""
    artifact_spec = scene.get("artifact_spec") or scene.get("artifact", {})
    phase = scene.get("phase", "MECHANISM")
    accent = _accent_for(phase)
    w = artifact_spec.get("width", 580)
    h = artifact_spec.get("height", 340)
    viz_h = h - 28
    loop_ms = artifact_spec.get("loop_duration_ms", 8000)
    visual_elements = artifact_spec.get("visual_elements", [])
    key_values = artifact_spec.get("key_values", [])
    equations = scene.get("equations", [])
    has_math = bool(equations)

    return prompt_template.format(
        W=w,
        H=h,
        viz_h=viz_h,
        accent_color=accent,
        concept_title=scene.get("title", ""),
        concept_phase=phase,
        concept_description=scene.get("description", ""),
        concept_key_insight=scene.get("key_insight", ""),
        animation_type=artifact_spec.get("animation_type", "mechanism-reveal"),
        loop_duration_ms=loop_ms,
        visual_elements_json=_json.dumps(visual_elements),
        color_palette=artifact_spec.get("color_palette", "teal primary"),
        key_values_json=_json.dumps(key_values),
        has_math=has_math,
        equations_json=_json.dumps(equations),
    )


def _format_math_prompt(scene: dict, paper_metadata: dict) -> str:
    """Fill V3 math-specific prompt from scene spec."""
    artifact_spec = scene.get("artifact_spec") or scene.get("artifact", {})
    phase = scene.get("phase", "MECHANISM")
    accent = _accent_for(phase)
    w = artifact_spec.get("width", 580)
    h = artifact_spec.get("height", 340)
    loop_ms = artifact_spec.get("loop_duration_ms", 8000)
    equations = scene.get("equations", [])
    term_annotations = artifact_spec.get("term_annotations", [])
    base_eq = equations[0] if equations else ""

    return MATH_GENERATOR_PROMPT.format(
        W=w,
        H=h,
        accent_color=accent,
        concept_title=scene.get("title", ""),
        concept_phase=phase,
        concept_description=scene.get("description", ""),
        concept_key_insight=scene.get("key_insight", ""),
        equations_json=_json.dumps(equations),
        visual_interpretation=artifact_spec.get("visual_interpretation", ""),
        loop_duration_ms=loop_ms,
        base_equation_latex=base_eq,
        term_annotations_json=_json.dumps(term_annotations),
    )


def generate_html_for_scene(
    scene: dict,
    paper_metadata: dict,
    scene_index: int,
    total_scenes: int,
    previous_titles: list[str],
    attempt: int = 0,
) -> str:
    """Generate a V3 continuous-animation HTML artifact for a scene."""
    artifact_spec = scene.get("artifact_spec") or scene.get("artifact", {})
    animation_type = artifact_spec.get("animation_type", "mechanism-reveal")
    equations = scene.get("equations", [])
    is_math_heavy = animation_type == "equation-geometry" or len(equations) >= 2

    if is_math_heavy and attempt == 0:
        prompt = _format_math_prompt(scene, paper_metadata)
    else:
        tier = max(0, min(attempt, len(PROMPT_TIERS) - 1))
        prompt = _format_prompt(PROMPT_TIERS[tier], scene, paper_metadata)

    user_input = build_agent2_input(paper_metadata, scene, scene_index, total_scenes, previous_titles)

    try:
        model = get_openrouter_chat(temperature=0.35)
        response = invoke_with_retry(model, [
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_input},
        ])
        raw = getattr(response, "content", "")
        if isinstance(raw, list):
            raw = "\n".join(str(item) for item in raw)
        html = sanitize_html(str(raw))
    except Exception:
        html = fallback_html(scene)

    guarded = run_output_guard(html)
    if not guarded.safe and guarded.corrected:
        return sanitize_html(guarded.corrected)
    return html


# ── Backward-compatible alias ────────────────────────────────────────────────
def generate_html_for_concept(
    concept: dict,
    paper_metadata: dict,
    concept_index: int,
    total_concepts: int,
    previous_titles: list[str],
    attempt: int = 0,
) -> str:
    """Legacy V2 entry point — redirects to V3 generate_html_for_scene."""
    return generate_html_for_scene(
        concept, paper_metadata, concept_index, total_concepts, previous_titles, attempt
    )
