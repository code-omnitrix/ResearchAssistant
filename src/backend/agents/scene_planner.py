# ──────────────────────────────────────────────────────────────────────────────
# Sub-agent 1D — Scene Planner
# Input:  concepts list (from 1C) + equations list (from 1B) +
#         classification dict (from 1A)  — NO raw paper text
# Output: list of fully-specified scene dicts (viz type, dimensions, canvas
#         position, prose outline, equation assignments)
# Runs AFTER both 1B and 1C have completed.
# ──────────────────────────────────────────────────────────────────────────────

import json

from prompts.scene_planner_prompts import (
    SCENE_PLANNER_SYSTEM,
    SCENE_PLANNER_HUMAN,
    PHASE_COLORS,
)
from utils.json_extractor import extract_json_robust
from utils.logger import get_logger, log_event
from utils.openrouter_client import get_openrouter_chat, invoke_with_retry

logger = get_logger("backend.agents.scene_planner")

# Estimated scene heights by layout template (px) — used for canvas_y fallback
_SCENE_HEIGHTS = {
    "LANDSCAPE":   520,
    "PORTRAIT":    580,
    "FULLWIDTH":   600,
    "COMPARISON":  460,
    "MATHFOCUS":   480,
}
_SCENE_GAP     = 180
_LANE_START_X  = [180, 1360, 2540]
_LANE_START_Y  = [120, 320, 220]

_PHASE_LANES = {
    "HOOK": 1,
    "FOUNDATION": 0,
    "MECHANISM": 1,
    "EVIDENCE": 2,
    "IMPLICATIONS": 2,
    "SYNTHESIS": 1,
    "COMPARISON": 2,
    "DERIVATION": 1,
    "SIMULATION": 2,
    "DEFINITION": 0,
    "QUERY": 1,
}

# Artifact dimensions per layout template
_ARTIFACT_DIMS = {
    "LANDSCAPE":  (580, 340),
    "PORTRAIT":   (620, 360),
    "FULLWIDTH":  (900, 420),
    "COMPARISON": (440, 280),
    "MATHFOCUS":  (520, 200),
}


def _estimate_scene_height(scene: dict) -> int:
    layout = scene.get("layout", "LANDSCAPE")
    base_height = _SCENE_HEIGHTS.get(layout, 520)
    artifact = scene.get("artifact", {})
    artifact_height = int(artifact.get("height") or _ARTIFACT_DIMS.get(layout, (580, 340))[1])
    prose_target = int(scene.get("prose_outline", {}).get("word_count_target", 320) or 320)
    prose_height = max(200, min(360, int(prose_target * 0.4)))
    equation_bonus = 70 if scene.get("equations") else 0
    return max(base_height, artifact_height, prose_height + equation_bonus) + 180


def _compute_canvas_positions(scenes: list[dict]) -> list[dict]:
    """
    Place scenes across multiple lanes with staggered starts so the canvas feels
    spatial instead of like a single stacked report.
    """
    lane_y = list(_LANE_START_Y)

    for index, scene in enumerate(scenes):
        preferred_lane = _PHASE_LANES.get(scene.get("phase", "MECHANISM"), index % len(_LANE_START_X))
        lane = min(
            range(len(_LANE_START_X)),
            key=lambda candidate: lane_y[candidate] + abs(candidate - preferred_lane) * 180,
        )
        layer = index // len(_LANE_START_X)
        x_offset = 0 if (layer + lane) % 2 == 0 else 120
        if lane == 1:
            x_offset -= 80
        elif lane == 2:
            x_offset += 60

        scene["canvas_x"] = _LANE_START_X[lane] + x_offset
        scene["canvas_y"] = lane_y[lane]
        lane_y[lane] += _estimate_scene_height(scene) + _SCENE_GAP

    return scenes


def _merge_concept_fields(scenes: list[dict], concepts: list[dict]) -> list[dict]:
    """
    Merge fields from the concept stubs that the scene planner might have dropped
    (description, key_insight, real_world_analogy, etc.).
    """
    concept_by_id = {c.get("id"): c for c in concepts}
    for scene in scenes:
        stub = concept_by_id.get(scene.get("id"), {})
        for field in ("subtitle", "description", "key_insight", "real_world_analogy",
                      "difficulty_level", "estimated_minutes", "connects_to"):
            if field not in scene or not scene[field]:
                scene.setdefault(field, stub.get(field))
        # Ensure accent_color is set
        phase = scene.get("phase", "MECHANISM")
        scene.setdefault("accent_color", PHASE_COLORS.get(phase, "#00c49a"))
    return scenes


def _fallback_scenes(concepts: list[dict], equations: list[dict]) -> list[dict]:
    """
    Minimal scene graph built entirely from concept stubs — used when LLM fails.
    """
    eq_ids = [e.get("id", f"eq_{i+1:02d}") for i, e in enumerate(equations)]
    scenes = []
    y_cursor = _SCENE_START_Y

    for i, concept in enumerate(concepts):
        phase  = concept.get("phase", "MECHANISM")
        layout = "LANDSCAPE"
        w, h   = _ARTIFACT_DIMS[layout]

        scenes.append({
            "id":       concept.get("id", f"concept_{i+1:03d}"),
            "title":    concept.get("title", f"Concept {i+1}"),
            "subtitle": concept.get("subtitle", ""),
            "phase":    phase,
            "layout":   layout,
            "canvas_x": _LANE_START_X[i % len(_LANE_START_X)],
            "canvas_y": y_cursor,
            "description":       concept.get("description", ""),
            "key_insight":       concept.get("key_insight", ""),
            "real_world_analogy":concept.get("real_world_analogy", ""),
            "difficulty_level":  concept.get("difficulty_level", 3),
            "estimated_minutes": concept.get("estimated_minutes", 5),
            "connects_to":       concept.get("connects_to", []),
            "artifact": {
                "viz_type":    "mechanism-reveal",
                "width":       w,
                "height":      h,
                "description": concept.get("description", "Visualize this concept."),
                "loop_seconds": 8,
                "accent_color": PHASE_COLORS.get(phase, "#00c49a"),
            },
            "prose_outline": {
                "word_count_target": 400,
                "topics_to_cover":   [concept.get("description", "")],
                "analogy_hint":      concept.get("real_world_analogy", ""),
            },
            "equations":    eq_ids[:1] if i == 0 else [],
            "callout_hint": concept.get("key_insight", ""),
        })
        y_cursor += _SCENE_HEIGHTS[layout] + _SCENE_GAP

    return _compute_canvas_positions(scenes)


def plan_scenes(
    classification: dict,
    concepts: list[dict],
    equations: list[dict],
) -> list[dict]:
    """
    Sub-agent 1D: enrich concept stubs into fully-specified scenes.
    Returns a list of scene dicts.  Never raises.
    """
    classification_json = json.dumps(classification, ensure_ascii=False)
    # Only pass concept stub fields (not full text) to keep the prompt small
    concept_stubs = [
        {k: v for k, v in c.items()
         if k in ("id", "title", "subtitle", "phase", "description",
                  "key_insight", "real_world_analogy", "difficulty_level",
                  "estimated_minutes", "connects_to")}
        for c in concepts
    ]
    concepts_json  = json.dumps(concept_stubs, ensure_ascii=False, indent=2)
    equations_json = json.dumps(equations,     ensure_ascii=False, indent=2)

    messages = [
        {"role": "system", "content": SCENE_PLANNER_SYSTEM},
        {
            "role": "user",
            "content": SCENE_PLANNER_HUMAN.format(
                classification_json=classification_json,
                concepts_json=concepts_json,
                equations_json=equations_json,
            ),
        },
    ]

    try:
        model = get_openrouter_chat(temperature=0.15)
        response = invoke_with_retry(model, messages)
        raw = getattr(response, "content", "")
        if isinstance(raw, list):
            raw = "\n".join(str(x) for x in raw)

        result = extract_json_robust(str(raw))

        # Normalise: accept {"scenes": [...]} or bare list
        if isinstance(result, dict):
            scenes = result.get("scenes", [])
        elif isinstance(result, list):
            scenes = result
        else:
            scenes = []

        if len(scenes) < len(concepts):
            log_event(logger, "scene_planner_incomplete",
                      expected=len(concepts), got=len(scenes))
            # Fall back to auto-generated scenes for missing concepts
            scenes = _fallback_scenes(concepts, equations)

        # Always guarantee correct layout positions and merged concept fields
        scenes = _merge_concept_fields(scenes, concepts)
        scenes = _compute_canvas_positions(scenes)

        log_event(logger, "scene_planner_done", count=len(scenes))
        return scenes

    except Exception as exc:
        log_event(logger, "scene_planner_failed", error=str(exc))
        return _fallback_scenes(concepts, equations)
