from agents.validator import ValidationReport
from guardrails.output_guard import run_output_guard
from prompts.agent3_prompts import REPAIR_SYSTEM_PROMPT, REPAIR_HUMAN_TEMPLATE
from utils.html_sanitizer import sanitize_html
from utils.openrouter_client import get_openrouter_chat, invoke_with_retry


def repair_html_artifact(html: str, report: ValidationReport) -> str:
    if report.verdict == "PASS":
        return html

    report_summary = (
        f"specific_fixes: {report.specific_fixes}\n"
        f"critical_issues: {report.critical_issues}\n"
        f"score: {report.quality_score}\n"
        f"verdict: {report.verdict}"
    )
    human_content = REPAIR_HUMAN_TEMPLATE.format(report=report_summary, html=html)

    try:
        model = get_openrouter_chat(temperature=0.1)
        response = invoke_with_retry(model, [
            {"role": "system", "content": REPAIR_SYSTEM_PROMPT},
            {"role": "user", "content": human_content},
        ])
        raw = getattr(response, "content", "")
        if isinstance(raw, list):
            raw = "\n".join(str(item) for item in raw)
        candidate = sanitize_html(str(raw))
    except Exception:
        candidate = sanitize_html(html)

    guarded = run_output_guard(candidate)
    if not guarded.safe and guarded.corrected:
        return sanitize_html(guarded.corrected)
    return candidate
