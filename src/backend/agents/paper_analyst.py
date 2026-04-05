from io import BytesIO

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

from guardrails.input_guard import run_input_guard
from prompts.agent1_prompts import build_agent1_messages
from utils.json_extractor import extract_json_robust
from utils.openrouter_client import get_openrouter_chat, invoke_with_retry, OpenRouterError


def _extract_pdf_text(pdf_bytes: bytes, page_limit: int = 200) -> str:
    if PdfReader is None:
        raise RuntimeError("pypdf is not installed")

    reader = PdfReader(BytesIO(pdf_bytes))
    pages = reader.pages[:page_limit]
    chunks = []
    for page in pages:
        chunks.append(page.extract_text() or "")
    return "\n".join(chunks).strip()


def analyze_paper(pdf_bytes: bytes) -> dict:
    text = _extract_pdf_text(pdf_bytes)
    guard = run_input_guard(text)
    if not guard.safe:
        raise ValueError(f"Input guard blocked paper text: {guard.category} - {guard.reason}")

    messages = build_agent1_messages(text)

    try:
        model = get_openrouter_chat(temperature=0.1)
        response = invoke_with_retry(model, messages)
        raw = getattr(response, "content", "")
        if isinstance(raw, list):
            raw = "\n".join(str(item) for item in raw)
        return extract_json_robust(str(raw))
    except OpenRouterError:
        return extract_json_robust(text)
    except Exception:
        return extract_json_robust(text)
