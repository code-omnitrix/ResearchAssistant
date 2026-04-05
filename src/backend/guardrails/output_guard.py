from dataclasses import dataclass


UNSAFE_MARKERS = [
    "guaranteed cure",
    "legal advice",
    "financial advice",
    "fabricated citation",
]


@dataclass
class OutputGuardResult:
    safe: bool
    flagged_segments: list[str]
    corrected: str | None


def _minimal_safe_response() -> str:
    return "I can only provide paper-grounded educational content. Please ask about the uploaded paper."


def run_output_guard(text: str, context: str | None = None) -> OutputGuardResult:
    lowered = (text or "").lower()
    flagged = [marker for marker in UNSAFE_MARKERS if marker in lowered]

    if flagged:
        corrected = _minimal_safe_response()
        return OutputGuardResult(False, flagged, corrected)

    return OutputGuardResult(True, [], None)
