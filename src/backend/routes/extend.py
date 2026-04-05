# ──────────────────────────────────────────────────────────────────────────────
# POST /api/extend — Canvas extension: comparison scenes, new papers, etc.
# ──────────────────────────────────────────────────────────────────────────────
import json
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from agents.html_generator import generate_html_for_concept, fallback_html
from agents.prose_generator import generate_prose, _default_prose
from agents.validator import validate_html_artifact
from agents.repair_agent import repair_html_artifact
from guardrails.input_guard import run_input_guard
from utils.logger import get_logger, log_event

router = APIRouter(prefix="/api", tags=["extend"])
logger = get_logger("backend.routes.extend")


class ExtendRequest(BaseModel):
    query: str
    type: str = "comparison"  # comparison | derivation | simulation | definition
    parentSceneIds: list[str] = []
    paperMetadata: dict[str, Any] = {}
    scenes: list[dict[str, Any]] = []
    equations: list[dict[str, Any]] = []
    paperExcerpt: str = ""


@router.post("/extend")
async def extend_canvas(payload: ExtendRequest):
    log_event(logger, "extend_request", query_type=payload.type, query_len=len(payload.query))
    guard = run_input_guard(payload.query)
    if not guard.safe:
        log_event(logger, "extend_guardrail_blocked", reason=guard.reason, category=guard.category)
        return {"guardrail_blocked": True, "reason": guard.reason, "category": guard.category}

    # Build a synthetic scene spec from the query
    scene_id = f"ext_{payload.type}_{len(payload.scenes) + 1:03d}"
    scene = {
        "id": scene_id,
        "title": payload.query[:80],
        "phase": payload.type.upper(),
        "description": payload.query,
        "key_insight": payload.query,
        "real_world_analogy": "",
        "visualization_type": _type_to_viz(payload.type),
        "color_emphasis": _type_to_color(payload.type),
        "connects_to": payload.parentSceneIds,
        "prose_outline": {"topics_to_cover": [payload.query]},
        "equations": [],
    }

    concept = {
        **scene,
        "interaction_elements": ["click: explore", "hover: details"],
        "visual_elements": [f"{payload.type} visualization"],
        "mathematical_content": {"has_math": False, "equations": [], "visual_interpretation": "N/A"},
    }

    # Generate artifact
    best_html = fallback_html(concept)
    best_quality = 0
    for attempt in range(2):
        try:
            html = generate_html_for_concept(
                concept, payload.paperMetadata,
                concept_index=0, total_concepts=1,
                previous_titles=[], attempt=attempt,
            )
            report = validate_html_artifact(html)
            candidate_html, candidate_quality = html, report.quality_score
            if report.verdict != "PASS":
                try:
                    repaired = repair_html_artifact(html, report)
                    rep_report = validate_html_artifact(repaired)
                    if rep_report.quality_score >= candidate_quality:
                        candidate_html = repaired
                        candidate_quality = rep_report.quality_score
                except Exception:
                    pass
            if candidate_quality > best_quality:
                best_html, best_quality = candidate_html, candidate_quality
            if candidate_quality >= 60:
                break
        except Exception as exc:
            log_event(logger, "extend_artifact_error", error=str(exc))

    # Generate prose
    try:
        prose_data = generate_prose(scene, payload.equations, payload.paperExcerpt[:4000])
    except Exception:
        prose_data = _default_prose(scene)

    # Compute position relative to parent scenes
    parent_positions = [
        s for s in payload.scenes if s.get("id") in payload.parentSceneIds
    ]
    if parent_positions:
        avg_x = sum(s.get("canvas_x", 200) for s in parent_positions) / len(parent_positions)
        avg_y = max(s.get("canvas_y", 80) for s in parent_positions)
        position = {"x": avg_x + 300, "y": avg_y + 200}
    else:
        position = {"x": 200, "y": 80 + len(payload.scenes) * 420}

    return {
        "sceneId": scene_id,
        "sceneSpec": scene,
        "artifactHtml": best_html,
        "proseBlocks": prose_data.get("prose_blocks", []),
        "formulaBlocks": prose_data.get("formula_blocks", []),
        "callouts": prose_data.get("callouts", []),
        "quality": best_quality,
        "position": position,
        "parentSceneIds": payload.parentSceneIds,
    }


def _type_to_viz(ext_type: str) -> str:
    return {
        "comparison": "side_by_side",
        "derivation": "flow_animation",
        "simulation": "interactive_sim",
        "definition": "simple_diagram",
    }.get(ext_type, "animation")


def _type_to_color(ext_type: str) -> str:
    return {
        "comparison": "orange",
        "derivation": "purple",
        "simulation": "green",
        "definition": "blue",
    }.get(ext_type, "gold")
