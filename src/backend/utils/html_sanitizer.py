import re


MINIMAL_HTML = """<!DOCTYPE html>
<html lang="en">
<head><meta charset='UTF-8'></head>
<body style='width:580px;height:340px;overflow:hidden;background:rgba(12,18,32,0.95);color:#dde4f0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;'>
<p style='font-size:12px;color:#6e7d96;'>Visualization unavailable.</p>
</body>
</html>
"""


def extract_html(raw_text: str) -> str:
    match = re.search(r"```(?:html)?\s*(<!DOCTYPE html[\s\S]*?)\s*```", raw_text, flags=re.IGNORECASE)
    if match:
        return match.group(1)

    doctype_idx = raw_text.lower().find("<!doctype html")
    if doctype_idx >= 0:
        return raw_text[doctype_idx:]

    if "<html" in raw_text.lower():
        return "<!DOCTYPE html>\n" + raw_text

    return MINIMAL_HTML


def has_balanced_tags(html: str) -> bool:
    lowered = html.lower()
    required_pairs = [
        ("<html", "</html>"),
        ("<head", "</head>"),
        ("<body", "</body>"),
    ]
    return all(start in lowered and end in lowered for start, end in required_pairs)


def check_dimension_violations(html: str, max_w: int = 0, max_h: int = 0) -> list[str]:
    """Check for V3 dimension contract violations.

    Args:
        html: The HTML string to check.
        max_w: Maximum allowed width in px (scene spec). 0 = skip width checks.
        max_h: Maximum allowed height in px (scene spec). 0 = skip height checks.
    """
    violations = []
    lowered = html.lower()

    # Check for 100vh on body — always forbidden
    if "100vh" in lowered:
        if re.search(r'(?:html|body)\s*\{[^}]*100vh', lowered):
            violations.append("body uses 100vh — CRITICAL")
        elif "height:100vh" in lowered.replace(" ", "") or "height: 100vh" in lowered:
            violations.append("element uses 100vh — CHECK")

    # Check for 100vw — always forbidden
    if "100vw" in lowered:
        if re.search(r'(?:html|body)\s*\{[^}]*100vw', lowered):
            violations.append("body uses 100vw — CRITICAL")

    # Check for scrollable overflow on body
    if re.search(r'body\s*\{[^}]*overflow\s*:\s*(scroll|auto)', lowered):
        violations.append("body has scrollable overflow — CRITICAL")

    # Check for min-height on body
    if re.search(r'body\s*\{[^}]*min-height', lowered):
        violations.append("body has min-height — should be fixed height")

    # Check for height:100% on body
    if re.search(r'body\s*\{[^}]*height\s*:\s*100%', lowered):
        violations.append("body uses height:100% — CRITICAL")

    # Dynamic width check — only if scene spec provides max_w
    if max_w > 0:
        width_matches = re.findall(r'width\s*:\s*(\d+)px', lowered)
        for w in width_matches:
            if int(w) > max_w:
                violations.append(f"element width {w}px exceeds scene spec {max_w}px — CHECK")

    # Dynamic height check — only if scene spec provides max_h
    if max_h > 0:
        height_matches = re.findall(r'height\s*:\s*(\d+)px', lowered)
        for h in height_matches:
            if int(h) > max_h:
                violations.append(f"element height {h}px exceeds scene spec {max_h}px — CHECK")

    return violations


def sanitize_html(raw_text: str) -> str:
    html = extract_html(raw_text).strip()
    if not html.lower().startswith("<!doctype html"):
        html = "<!DOCTYPE html>\n" + html
    if not has_balanced_tags(html):
        return MINIMAL_HTML
    return html
