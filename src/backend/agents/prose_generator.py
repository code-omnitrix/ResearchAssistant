# ──────────────────────────────────────────────────────────────────────────────
# Agent 3 — Prose Generator
# Generates professor-quality lecture prose for a single scene.
# Runs in parallel with the Artifact Generator (Agent 2) for each scene.
# ──────────────────────────────────────────────────────────────────────────────

import json

from prompts.prose_prompts import PROSE_SYSTEM, PROSE_HUMAN
from utils.json_extractor import extract_json_robust
from utils.logger import get_logger, log_event
from utils.openrouter_client import get_openrouter_chat, invoke_with_retry

logger = get_logger("backend.agents.prose_generator")


def _default_prose(scene: dict) -> dict:
    """Minimal fallback prose when LLM call fails."""
    title = scene.get("title", "Concept")
    insight = scene.get("key_insight", scene.get("callout_hint", ""))
    desc = scene.get("description", "")
    return {
        "prose_blocks": [
            {
                "id": "prose_001",
                "markdown": f"**{title}**\n\n{desc}",
                "estimated_height": 180,
            }
        ],
        "formula_blocks": [],
        "callouts": [
            {
                "id": "callout_001",
                "variant": "key-insight",
                "icon": "\U0001f4a1",
                "content": insight or desc[:200],
            }
        ],
    }


def generate_prose(scene: dict, equations: list[dict], paper_excerpt: str) -> dict:
    """
    Generate prose, formula blocks, and callouts for one scene.
    Returns a dict matching the prose output schema. Never raises.
    """
    # Build the topics list from the scene's prose_outline
    outline = scene.get("prose_outline", {})
    topics = outline.get("topics_to_cover", [scene.get("description", "")])
    topics_str = "\n  - ".join(topics) if topics else scene.get("description", "")

    # Filter equations assigned to this scene
    scene_eq_ids = set(scene.get("equations", []))
    scene_equations = [eq for eq in equations if eq.get("id") in scene_eq_ids]
    if not scene_equations:
        scene_equations = equations[:2]  # fallback: give first 2

    human_content = PROSE_HUMAN.format(
        title=scene.get("title", ""),
        phase=scene.get("phase", ""),
        description=scene.get("description", ""),
        key_insight=scene.get("key_insight", scene.get("callout_hint", "")),
        analogy=scene.get("real_world_analogy", outline.get("analogy_hint", "")),
        topics=topics_str,
        equations_json=json.dumps(scene_equations, ensure_ascii=False, indent=2),
        paper_excerpt=paper_excerpt[:4000],
    )

    try:
        model = get_openrouter_chat(temperature=0.25)
        response = invoke_with_retry(model, [
            {"role": "system", "content": PROSE_SYSTEM},
            {"role": "user",   "content": human_content},
        ])
        raw = getattr(response, "content", "")
        if isinstance(raw, list):
            raw = "\n".join(str(x) for x in raw)

        result = extract_json_robust(str(raw))
        if not isinstance(result, dict):
            raise ValueError("Prose generator returned non-dict")

        # Ensure required keys exist
        result.setdefault("prose_blocks", [])
        result.setdefault("formula_blocks", [])
        result.setdefault("callouts", [])

        log_event(logger, "prose_generator_done",
                  scene_id=scene.get("id"),
                  blocks=len(result["prose_blocks"]),
                  formulas=len(result["formula_blocks"]),
                  callouts=len(result["callouts"]))
        return result

    except Exception as exc:
        log_event(logger, "prose_generator_failed", scene_id=scene.get("id"), error=str(exc))
        return _default_prose(scene)
