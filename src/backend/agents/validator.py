from pydantic import BaseModel, Field

from utils.html_sanitizer import check_dimension_violations


class QualityIssue(BaseModel):
    severity: str
    description: str
    location: str
    fix: str


class ValidationReport(BaseModel):
    is_valid: bool
    quality_score: int = Field(ge=0, le=100)
    verdict: str
    critical_issues: list[str]
    quality_issues: list[QualityIssue]
    specific_fixes: list[str]
    passed_checks: dict[str, bool]
    confidence: float = Field(ge=0.0, le=1.0)


def validate_html_artifact(html: str, expected_w: int = 0, expected_h: int = 0) -> ValidationReport:
    """Validate a V3 continuous-animation HTML artifact.

    Args:
        html: The generated HTML string.
        expected_w: Expected width from scene spec (0 = skip width check).
        expected_h: Expected height from scene spec (0 = skip height check).
    """
    critical = []
    lowered = html.lower()

    # V3 dimension contract checks (dynamic, based on scene spec)
    dim_violations = check_dimension_violations(html, max_w=expected_w, max_h=expected_h)
    dimension_ok = len(dim_violations) == 0
    for v in dim_violations:
        if "CRITICAL" in v:
            critical.append(v)

    # Structure checks — V3 requires #viz + #ctrl, no #root/#nav/#caption
    has_viz = "id=\"viz\"" in lowered or "id='viz'" in lowered
    has_ctrl = "id=\"ctrl\"" in lowered or "id='ctrl'" in lowered
    has_progress = "id=\"progress\"" in lowered or "id='progress'" in lowered

    # V3 continuous animation checks
    has_film_engine = "requestanimationframe" in lowered and "loop_ms" in lowered
    has_keyframes_array = "keyframes" in html and "kfindex" in lowered
    has_toggle_pause = "togglepause" in lowered
    has_no_step_pills = "pill" not in lowered and "prev-btn" not in lowered and "next-btn" not in lowered

    checks = {
        "html_structure": "<html" in lowered and "</html>" in lowered,
        "js_syntax": "<script" not in lowered or "</script>" in lowered,
        "dark_theme": "rgba(12" in lowered or "#0d1117" in lowered or "#131b2b" in lowered or "#0a0e1a" in lowered,
        "has_animations": "@keyframes" in html or "animation:" in html or "transition:" in html,
        "educational_content": len(html) > 200,
        "dimension_contract": dimension_ok,
        "has_viz_container": has_viz,
        "film_engine": has_film_engine,
        "continuous_loop": has_keyframes_array,
        "hover_controls": has_ctrl and has_toggle_pause,
        "no_step_nav": has_no_step_pills,
        "progress_bar": has_progress,
    }

    if "<!doctype html" not in lowered:
        critical.append("Missing DOCTYPE declaration")

    if not checks["html_structure"]:
        critical.append("Missing required html/body structure")

    # Scoring: start at 20, accumulate
    score = 20
    score += 8 if checks["dark_theme"] else 0
    score += 8 if checks["has_animations"] else 0
    score += 5 if checks["educational_content"] else 0
    score += 5 if checks["js_syntax"] else 0
    score += 12 if checks["dimension_contract"] else 0
    score += 8 if checks["has_viz_container"] else 0
    score += 12 if checks["film_engine"] else 0
    score += 8 if checks["continuous_loop"] else 0
    score += 6 if checks["hover_controls"] else 0
    score += 4 if checks["no_step_nav"] else 0
    score += 4 if checks["progress_bar"] else 0

    has_critical_dim = any("CRITICAL" in v for v in dim_violations)
    verdict = "PASS" if not critical and not has_critical_dim and score >= 70 else "FIX_NEEDED"

    quality_issues = []
    specific_fixes = []

    if not checks["dimension_contract"]:
        for v in dim_violations:
            quality_issues.append(
                QualityIssue(severity="critical", description=v, location="CSS", fix="Fix dimension contract violation")
            )
            specific_fixes.append(f"Fix: {v}")

    if not checks["has_viz_container"]:
        quality_issues.append(
            QualityIssue(severity="high", description="Missing #viz container", location="HTML", fix="Add <div id='viz'> as the main visualization container")
        )
        specific_fixes.append("Add #viz container for the animated content")

    if not checks["film_engine"]:
        quality_issues.append(
            QualityIssue(severity="high", description="Missing film engine (requestAnimationFrame loop)", location="JS", fix="Add the continuous animation film engine with LOOP_MS, tick(), and keyframes[]")
        )
        specific_fixes.append("Add requestAnimationFrame-based film engine with LOOP_MS constant and tick() function")

    if not checks["continuous_loop"]:
        quality_issues.append(
            QualityIssue(severity="medium", description="Missing keyframes[] array for timed animation", location="JS", fix="Add keyframes array with {t, fn} entries for the animation timeline")
        )
        specific_fixes.append("Add keyframes[] array defining the animation timeline")

    if not checks["no_step_nav"]:
        quality_issues.append(
            QualityIssue(severity="medium", description="V2 step navigation detected (pills/prev/next). V3 uses continuous auto-looping film — remove step chrome.", location="HTML/JS", fix="Remove step pills, prev/next buttons. Use keyframe-based film engine instead.")
        )
        specific_fixes.append("Remove V2 step pills and prev/next buttons — artifact must be a continuous auto-looping film")

    if not checks["hover_controls"]:
        quality_issues.append(
            QualityIssue(severity="low", description="Missing hover control strip (#ctrl with pause/play)", location="HTML", fix="Add #ctrl div with pause button, visible only on hover")
        )
        specific_fixes.append("Add hover-only #ctrl strip with pause/play button")

    if not checks["has_animations"]:
        quality_issues.append(
            QualityIssue(severity="medium", description="No CSS animation detected", location="style block", fix="Add fadeIn, slideUp, pop, or other CSS keyframe animations")
        )
        specific_fixes.append("Add at least CSS @keyframes fadeIn and slideUp animations")

    return ValidationReport(
        is_valid=not critical,
        quality_score=max(0, min(100, score)),
        verdict=verdict,
        critical_issues=critical,
        quality_issues=quality_issues,
        specific_fixes=specific_fixes,
        passed_checks=checks,
        confidence=0.85,
    )
