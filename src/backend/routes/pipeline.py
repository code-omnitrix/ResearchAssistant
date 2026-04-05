import json

from fastapi import APIRouter, File, HTTPException, UploadFile
from sse_starlette.sse import EventSourceResponse

from guardrails.input_guard import run_input_guard
from pipeline.orchestrator import agentic_generate
from utils.logger import get_logger, log_event

router = APIRouter(prefix="/api", tags=["pipeline"])
logger = get_logger("backend.routes.pipeline")

MAX_BYTES = 50 * 1024 * 1024


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    log_event(logger, "analyze_request_received", filename=file.filename, content_type=file.content_type)
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        log_event(logger, "analyze_rejected_content_type", content_type=file.content_type)
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    payload = await file.read()
    log_event(logger, "analyze_payload_read", bytes=len(payload))
    if len(payload) > MAX_BYTES:
        log_event(logger, "analyze_rejected_size", bytes=len(payload), max_bytes=MAX_BYTES)
        raise HTTPException(status_code=413, detail="File exceeds 50MB limit")

    file_guard = run_input_guard(f"filename={file.filename}; size={len(payload)}")
    if not file_guard.safe:
        log_event(logger, "analyze_guardrail_blocked", reason=file_guard.reason, category=file_guard.category)
        async def blocked_stream():
            event = {
                "type": "GUARDRAIL_BLOCKED",
                "stage": "input",
                "reason": file_guard.reason,
                "category": file_guard.category,
            }
            yield {"data": json.dumps(event)}

        return EventSourceResponse(blocked_stream())

    async def stream():
        log_event(logger, "analyze_stream_started")
        async for event in agentic_generate(payload):
            log_event(logger, "analyze_stream_event", type=event.get("type"), stage=event.get("stage"))
            yield {"data": json.dumps(event)}
        log_event(logger, "analyze_stream_completed")

    return EventSourceResponse(stream())
