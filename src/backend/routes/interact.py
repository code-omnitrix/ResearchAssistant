from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from agents.tutor import tutor_agent
from guardrails.input_guard import run_input_guard
from utils.logger import get_logger, log_event

router = APIRouter(prefix="/api", tags=["interact"])
logger = get_logger("backend.routes.interact")


class ViewportContext(BaseModel):
    visibleSceneIds: list[str] = []
    mostProminentSceneId: str | None = None
    visibleElementIds: list[str] = []
    selectedElementId: str | None = None


class InteractRequest(BaseModel):
    message: str
    paperMetadata: dict[str, Any] = {}
    currentScene: dict[str, Any] = {}
    allScenes: list[dict[str, Any]] = []
    viewport: ViewportContext = ViewportContext()
    history: list[dict[str, Any]] = []
    # V2 compat
    currentConcept: dict[str, Any] = {}
    allConcepts: list[dict[str, Any]] = []


@router.post("/interact")
async def interact(payload: InteractRequest):
    log_event(logger, "interact_request", message_len=len(payload.message), history_len=len(payload.history))
    guard = run_input_guard(payload.message)
    if not guard.safe:
        log_event(logger, "interact_guardrail_blocked", reason=guard.reason, category=guard.category)
        return {"guardrail_blocked": True, "reason": guard.reason, "category": guard.category}

    # Build context with viewport awareness
    context = {
        "paperMetadata": payload.paperMetadata,
        "currentScene":  payload.currentScene or payload.currentConcept,
        "allScenes":     payload.allScenes or payload.allConcepts,
        "viewport":      payload.viewport.model_dump(),
        "history":       payload.history,
    }

    response = tutor_agent.respond(payload.message, context)
    log_event(logger, "interact_response_generated", response_len=len(response))

    return {"response": response}
