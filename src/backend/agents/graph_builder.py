# ──────────────────────────────────────────────────────────────────────────────
# Agent 5 — Graph Builder
# Extracts edges between concepts for the knowledge graph canvas
# ──────────────────────────────────────────────────────────────────────────────

import json

from prompts.graph_prompts import GRAPH_BUILDER_SYSTEM, GRAPH_BUILDER_HUMAN
from utils.openrouter_client import get_openrouter_chat, invoke_with_retry


def _linear_fallback(concepts: list[dict]) -> dict:
    """Fallback: linear chain of prerequisite edges."""
    edges = []
    layout_hints = {}
    phase_layer = {
        "HOOK": 0, "FOUNDATION": 1, "MECHANISM": 2,
        "EVIDENCE": 3, "IMPLICATIONS": 4, "SYNTHESIS": 5,
    }

    col_counters: dict[int, int] = {}
    for i, c in enumerate(concepts):
        cid = c.get("id", f"concept_{i + 1:03d}")
        layer = phase_layer.get(c.get("phase", "MECHANISM"), 2)
        col = col_counters.get(layer, 0)
        col_counters[layer] = col + 1
        layout_hints[cid] = {"layer": layer, "column": col}

        if i > 0:
            prev_id = concepts[i - 1].get("id", f"concept_{i:03d}")
            edges.append({
                "source": prev_id,
                "target": cid,
                "type": "prerequisite",
                "label": "builds on",
            })

    return {"edges": edges, "layout_hints": layout_hints}


def build_graph(concepts: list[dict]) -> dict:
    """Extract edges between concepts using LLM, with fallback to linear chain."""
    if not concepts:
        return {"edges": [], "layout_hints": {}}

    concepts_summary = []
    for c in concepts:
        concepts_summary.append({
            "id": c.get("id"),
            "title": c.get("title"),
            "phase": c.get("phase"),
            "description": c.get("description", ""),
            "connects_to": c.get("connects_to", []),
        })

    human_content = GRAPH_BUILDER_HUMAN.format(concepts_json=json.dumps(concepts_summary, indent=2))

    for attempt in range(2):
        try:
            model = get_openrouter_chat(temperature=0.1)
            response = invoke_with_retry(model, [
                {"role": "system", "content": GRAPH_BUILDER_SYSTEM},
                {"role": "user", "content": human_content},
            ])
            raw = getattr(response, "content", "")
            if isinstance(raw, list):
                raw = "\n".join(str(item) for item in raw)

            # Try to extract JSON from response
            text = str(raw).strip()
            # Strip markdown fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

            result = json.loads(text)

            # Validate structure
            if "edges" in result and isinstance(result["edges"], list):
                # Ensure no self-loops
                result["edges"] = [e for e in result["edges"] if e.get("source") != e.get("target")]
                if "layout_hints" not in result:
                    result["layout_hints"] = {}
                return result

        except Exception:
            if attempt == 0:
                continue
            break

    return _linear_fallback(concepts)
