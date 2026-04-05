import re
from dataclasses import dataclass


PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+previous\s+instructions",
    r"forget\s+your\s+instructions",
    r"you\s+are\s+now",
    r"^system:\s*",
    r"jailbreak",
    r"base64",
]

HARMFUL_KEYWORDS = [
    "self-harm",
    "kill",
    "bomb",
    "hate speech",
    "illegal",
    "weapon",
]

OFFTOPIC_KEYWORDS = [
    "plan my vacation",
    "stock tips",
    "dating advice",
    "write malware",
]


@dataclass
class GuardrailResult:
    safe: bool
    reason: str
    category: str


def run_input_guard(text: str) -> GuardrailResult:
    normalized = (text or "").strip().lower()

    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, normalized, flags=re.IGNORECASE | re.MULTILINE):
            return GuardrailResult(False, "Potential prompt injection detected", "prompt_injection")

    for keyword in HARMFUL_KEYWORDS:
        if keyword in normalized:
            return GuardrailResult(False, "Potential harmful request detected", "harmful")

    for keyword in OFFTOPIC_KEYWORDS:
        if keyword in normalized:
            return GuardrailResult(False, "Query appears unrelated to research workflow", "irrelevant")

    return GuardrailResult(True, "ok", "none")
