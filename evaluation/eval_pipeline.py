from __future__ import annotations

import asyncio
from pathlib import Path
import sys
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "src" / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

FIXTURES_DIR = Path(__file__).parent / "fixtures"


async def _run_single(pdf_path: Path, agentic_generate: Any) -> dict:
    events = []
    data = pdf_path.read_bytes()

    async for event in agentic_generate(data):
        events.append(event)

    concepts_ready = next((event for event in events if event.get("type") == "CONCEPTS_READY"), None)
    concept_count = len((concepts_ready or {}).get("payload", {}).get("concept_sequence", []))

    artifact_events = [event for event in events if event.get("type") == "CONCEPT_READY"]
    valid_html_count = sum(1 for event in artifact_events if str(event.get("html", "")).lower().startswith("<!doctype html"))

    avg_quality = int(sum(event.get("quality", 0) for event in artifact_events) / len(artifact_events)) if artifact_events else 0

    return {
        "file": pdf_path.name,
        "concept_count": concept_count,
        "artifact_count": len(artifact_events),
        "valid_html_count": valid_html_count,
        "avg_quality": avg_quality,
        "pass_concepts": concept_count >= 6,
        "pass_quality": avg_quality >= 60,
    }


async def main():
    pdfs = sorted(FIXTURES_DIR.glob("*.pdf"))
    if not pdfs:
        print("No PDF fixtures found in evaluation/fixtures. Skipping.")
        return

    from pipeline.orchestrator import agentic_generate

    reports = []
    for pdf in pdfs:
        try:
            report = await _run_single(pdf, agentic_generate)
        except Exception as exc:
            report = {"file": pdf.name, "error": str(exc)}
        reports.append(report)

    for report in reports:
        print(report)


if __name__ == "__main__":
    asyncio.run(main())
