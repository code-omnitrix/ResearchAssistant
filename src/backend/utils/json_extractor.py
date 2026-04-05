import json
import re
from typing import Any


def _extract_code_fence_json(text: str) -> str | None:
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL)
    return match.group(1) if match else None


def _regex_concept_fallback(text: str) -> dict[str, Any]:
    title = "Untitled Paper"
    title_match = re.search(r'"title"\s*:\s*"(.*?)"', text)
    if title_match:
        title = title_match.group(1)

    concept_titles = re.findall(r'"title"\s*:\s*"(.*?)"', text)
    concepts = []
    for idx, concept_title in enumerate(concept_titles[:8]):
        concepts.append(
            {
                "id": f"concept_{idx + 1:03d}",
                "title": concept_title,
                "subtitle": f"Understand {concept_title}",
                "phase": "FOUNDATION" if idx < 2 else "MECHANISM",
                "description": f"Learn the core idea behind {concept_title}.",
                "key_insight": f"{concept_title} is important for understanding the paper.",
                "real_world_analogy": "Like understanding one part of a machine to understand the whole.",
                "visualization_type": "animation",
                "interaction_elements": ["click: reveal explanation", "hover: show details", "slider: control intensity"],
                "visual_elements": ["interactive concept card"],
                "mathematical_content": {"has_math": False, "equations": [], "visual_interpretation": "N/A"},
                "color_emphasis": "gold",
                "estimated_minutes": 3,
                "difficulty_level": 2,
                "connects_to": [f"concept_{idx:03d}"] if idx > 0 else [],
                "checkpoint_after": False,
            }
        )

    while len(concepts) < 6:
        i = len(concepts) + 1
        concepts.append(
            {
                "id": f"concept_{i:03d}",
                "title": f"Core Concept {i}",
                "subtitle": "Foundational understanding",
                "phase": "FOUNDATION" if i <= 2 else "MECHANISM",
                "description": "A key piece of the paper's reasoning.",
                "key_insight": "Each concept builds toward the main contribution.",
                "real_world_analogy": "Like assembling parts of a puzzle.",
                "visualization_type": "animation",
                "interaction_elements": ["click: reveal explanation"],
                "visual_elements": ["concept tile"],
                "mathematical_content": {"has_math": False, "equations": [], "visual_interpretation": "N/A"},
                "color_emphasis": "gold",
                "estimated_minutes": 3,
                "difficulty_level": 2,
                "connects_to": [f"concept_{i-1:03d}"] if i > 1 else [],
                "checkpoint_after": False,
            }
        )

    return {
        "paper_metadata": {
            "title": title,
            "authors": ["Unknown"],
            "year": "Unknown",
            "domain": "General",
            "type": "HYBRID",
            "mathematical_intensity": "medium",
            "difficulty": "intermediate",
            "estimated_study_time": "45 minutes",
            "core_contribution": "A structured contribution extracted from noisy output.",
            "why_it_matters": "Helps users understand complex research quickly.",
        },
        "concept_sequence": concepts,
        "learning_path": {
            "total_concepts": len(concepts),
            "estimated_total_minutes": len(concepts) * 3,
            "difficulty_curve": "gradual",
            "checkpoints": [],
            "recommended_prior_reading": [],
        },
    }


def extract_json_robust(raw_text: str) -> dict[str, Any]:
    # Strategy 1: JSON in code fences.
    fenced = _extract_code_fence_json(raw_text)
    if fenced:
        try:
            return json.loads(fenced)
        except json.JSONDecodeError:
            pass

    # Strategy 2: direct parse.
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    # Strategy 3: regex-assisted fallback.
    regex_result = _regex_concept_fallback(raw_text)
    if regex_result:
        return regex_result

    # Strategy 4: minimal hard fallback.
    return _regex_concept_fallback("{}")
