# ──────────────────────────────────────────────────────────────────────────────
# Sub-agent 1C — Concept Sequencer
# Input:  full paper text (up to 12 000 chars) + classification dict from 1A
# Output: ordered list of concept stubs  (no viz details — that is 1D's job)
# Runs in parallel with Sub-agent 1B (Equation Extractor).
# ──────────────────────────────────────────────────────────────────────────────

import json

from prompts.concept_sequencer_prompts import (
    CONCEPT_SEQUENCER_SYSTEM,
    CONCEPT_SEQUENCER_HUMAN,
)
from utils.json_extractor import extract_json_robust
from utils.logger import get_logger, log_event
from utils.openrouter_client import get_openrouter_chat, invoke_with_retry

logger = get_logger("backend.agents.concept_sequencer")

_SEQUENCER_CHAR_LIMIT = 12_000


def _fallback_concepts() -> list[dict]:
    """Minimal 6-concept fallback when the LLM call fails."""
    phases = ["HOOK", "FOUNDATION", "FOUNDATION", "MECHANISM", "EVIDENCE", "SYNTHESIS"]
    return [
        {
            "id": f"concept_{i+1:03d}",
            "title": f"Concept {i+1}",
            "subtitle": "See paper for details",
            "phase": phase,
            "description": "Content unavailable — see paper.",
            "key_insight": "See paper for details.",
            "real_world_analogy": "",
            "difficulty_level": 3,
            "estimated_minutes": 5,
            "connects_to": [f"concept_{i:03d}"] if i > 0 else [],
        }
        for i, phase in enumerate(phases)
    ]


def sequence_concepts(text: str, classification: dict) -> list[dict]:
    """
    Sub-agent 1C: decompose the paper into an ordered learning sequence.
    Returns a list of concept stub dicts.  Never raises.
    """
    truncated = text[:_SEQUENCER_CHAR_LIMIT]
    classification_json = json.dumps(classification, ensure_ascii=False)

    messages = [
        {"role": "system", "content": CONCEPT_SEQUENCER_SYSTEM},
        {
            "role": "user",
            "content": CONCEPT_SEQUENCER_HUMAN.format(
                classification_json=classification_json,
                text=truncated,
            ),
        },
    ]

    try:
        model = get_openrouter_chat(temperature=0.1)
        response = invoke_with_retry(model, messages)
        raw = getattr(response, "content", "")
        if isinstance(raw, list):
            raw = "\n".join(str(x) for x in raw)

        result = extract_json_robust(str(raw))

        # Normalise: accept {"concepts": [...]} or bare list
        if isinstance(result, dict):
            concepts = result.get("concepts", result.get("concept_sequence", []))
        elif isinstance(result, list):
            concepts = result
        else:
            concepts = []

        if len(concepts) < 6:
            log_event(logger, "concept_sequencer_too_few", count=len(concepts))
            return _fallback_concepts()

        log_event(logger, "concept_sequencer_done", count=len(concepts))
        return concepts

    except Exception as exc:
        log_event(logger, "concept_sequencer_failed", error=str(exc))
        return _fallback_concepts()
