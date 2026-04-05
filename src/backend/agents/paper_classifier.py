# ──────────────────────────────────────────────────────────────────────────────
# Sub-agent 1A — Paper Classifier
# Input:  first ~6 000 chars of paper text (abstract + intro)
# Output: lightweight classification dict  (~15 fields)
# ──────────────────────────────────────────────────────────────────────────────

import json

from prompts.classifier_prompts import CLASSIFIER_SYSTEM, CLASSIFIER_HUMAN
from utils.json_extractor import extract_json_robust
from utils.logger import get_logger, log_event
from utils.openrouter_client import get_openrouter_chat, invoke_with_retry

logger = get_logger("backend.agents.classifier")

# Only the abstract + introduction are needed — keep input small
_CLASSIFIER_CHAR_LIMIT = 6_000


def _default_classification() -> dict:
    return {
        "title": "Unknown",
        "authors": [],
        "year": "unknown",
        "domain": "Computer Science",
        "type": "HYBRID",
        "math_intensity": "medium",
        "difficulty": "advanced",
        "has_experiments": False,
        "has_proofs": False,
        "core_contribution": "See paper for details.",
        "why_it_matters": "See paper for details.",
        "estimated_study_time": "45 minutes",
        "recommended_prior": [],
    }


def classify_paper(text: str) -> dict:
    """
    Sub-agent 1A: classify the paper from its abstract / intro.
    Returns a lightweight metadata dict.  Never raises.
    """
    excerpt = text[:_CLASSIFIER_CHAR_LIMIT]

    messages = [
        {"role": "system", "content": CLASSIFIER_SYSTEM},
        {"role": "user",   "content": CLASSIFIER_HUMAN.format(text=excerpt)},
    ]

    try:
        model = get_openrouter_chat(temperature=0.0)
        response = invoke_with_retry(model, messages)
        raw = getattr(response, "content", "")
        if isinstance(raw, list):
            raw = "\n".join(str(x) for x in raw)

        result = extract_json_robust(str(raw))
        if not isinstance(result, dict):
            raise ValueError("Classifier returned non-dict JSON")

        log_event(logger, "classifier_done", title=result.get("title"), domain=result.get("domain"))
        return result

    except Exception as exc:
        log_event(logger, "classifier_failed", error=str(exc))
        return _default_classification()
