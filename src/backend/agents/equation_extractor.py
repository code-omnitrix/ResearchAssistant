# ──────────────────────────────────────────────────────────────────────────────
# Sub-agent 1B — Equation Extractor
# Input:  full paper text (up to 15 000 chars)
# Output: list of equation dicts with LaTeX + term annotations
# Runs in parallel with Sub-agent 1C (Concept Sequencer).
# ──────────────────────────────────────────────────────────────────────────────

from prompts.equation_extractor_prompts import (
    EQUATION_EXTRACTOR_SYSTEM,
    EQUATION_EXTRACTOR_HUMAN,
)
from utils.json_extractor import extract_json_robust
from utils.logger import get_logger, log_event
from utils.openrouter_client import get_openrouter_chat, invoke_with_retry

logger = get_logger("backend.agents.equation_extractor")

_EXTRACTOR_CHAR_LIMIT = 15_000


def extract_equations(text: str) -> list[dict]:
    """
    Sub-agent 1B: extract key equations from the paper.
    Returns a list of equation dicts.  Never raises.
    """
    truncated = text[:_EXTRACTOR_CHAR_LIMIT]

    messages = [
        {"role": "system", "content": EQUATION_EXTRACTOR_SYSTEM},
        {"role": "user",   "content": EQUATION_EXTRACTOR_HUMAN.format(text=truncated)},
    ]

    try:
        model = get_openrouter_chat(temperature=0.0)
        response = invoke_with_retry(model, messages)
        raw = getattr(response, "content", "")
        if isinstance(raw, list):
            raw = "\n".join(str(x) for x in raw)

        result = extract_json_robust(str(raw))

        # Normalise: accept either a bare list or {"equations": [...]}
        if isinstance(result, list):
            equations = result
        elif isinstance(result, dict):
            equations = result.get("equations", [])
        else:
            equations = []

        log_event(logger, "equation_extractor_done", count=len(equations))
        return equations

    except Exception as exc:
        log_event(logger, "equation_extractor_failed", error=str(exc))
        return []
