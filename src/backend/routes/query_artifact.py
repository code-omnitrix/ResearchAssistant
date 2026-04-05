from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from agents.html_generator import generate_html_for_concept, fallback_html
from agents.validator import validate_html_artifact
from agents.repair_agent import repair_html_artifact
from guardrails.input_guard import run_input_guard
from utils.logger import get_logger, log_event

router = APIRouter(prefix="/api", tags=["query-artifact"])
logger = get_logger("backend.routes.query_artifact")


class QueryArtifactRequest(BaseModel):
    query: str
    paperIds: list[str] = []
    parentConceptIds: list[str] = []
    type: str = "query"  # query | comparison | equation | simulation
    paperMetadata: dict[str, Any] = {}
    concepts: list[dict[str, Any]] = []


@router.post("/query-artifact")
async def query_artifact(payload: QueryArtifactRequest):
    log_event(
        logger,
        "query_artifact_request",
        query_type=payload.type,
        query_len=len(payload.query),
        parent_count=len(payload.parentConceptIds),
    )
    guard = run_input_guard(payload.query)
    if not guard.safe:
        log_event(logger, "query_artifact_guardrail_blocked", reason=guard.reason, category=guard.category)
        return {"guardrail_blocked": True, "reason": guard.reason, "category": guard.category}

    # Build a synthetic concept from the query
    concept = {
        "id": f"query_{payload.type}",
        "title": payload.query[:80],
        "subtitle": f"Generated from user query",
        "phase": "QUERY" if payload.type == "query" else payload.type.upper(),
        "description": payload.query,
        "key_insight": payload.query,
        "real_world_analogy": "",
        "visualization_type": _type_to_viz(payload.type),
        "interaction_elements": ["click: explore", "hover: details"],
        "visual_elements": ["query visualization"],
        "mathematical_content": {"has_math": False, "equations": [], "visual_interpretation": "N/A"},
        "color_emphasis": "green" if payload.type == "query" else "orange",
        "connects_to": payload.parentConceptIds,
    }

    paper_metadata = payload.paperMetadata

    best_html = fallback_html(concept)
    best_quality = 0

    for attempt in range(2):
        log_event(logger, "query_artifact_attempt", attempt=attempt + 1)
        html = generate_html_for_concept(
            concept, paper_metadata, concept_index=0, total_concepts=1,
            previous_titles=[], attempt=attempt,
        )
        report = validate_html_artifact(html)

        candidate_html = html
        candidate_quality = report.quality_score

        if report.verdict != "PASS":
            log_event(logger, "query_artifact_repairing", quality=report.quality_score)
            repaired = repair_html_artifact(html, report)
            repaired_report = validate_html_artifact(repaired)
            if repaired_report.quality_score >= candidate_quality:
                candidate_html = repaired
                candidate_quality = repaired_report.quality_score

        if candidate_quality > best_quality:
            best_html = candidate_html
            best_quality = candidate_quality

        if candidate_quality >= 60:
            break

    log_event(logger, "query_artifact_done", best_quality=best_quality)
    return {
        "html": best_html,
        "quality": best_quality,
        "position": {"x": 400, "y": 400},
    }


def _type_to_viz(query_type: str) -> str:
    return {
        "query": "animation",
        "comparison": "comparison",
        "equation": "equation",
        "simulation": "simulation",
    }.get(query_type, "animation")
