import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request

load_dotenv()

# ---------------------------------------------------------------------------
# LangSmith tracing — must be configured before any LangChain imports
# ---------------------------------------------------------------------------
if os.getenv("LANGSMITH_TRACING", "").lower() in ("true", "1", "yes"):
    os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
    os.environ.setdefault("LANGCHAIN_ENDPOINT", os.getenv("LANGSMITH_ENDPOINT", "https://eu.api.smith.langchain.com"))
    os.environ.setdefault("LANGCHAIN_API_KEY", os.getenv("LANGSMITH_API_KEY", ""))
    os.environ.setdefault("LANGCHAIN_PROJECT", os.getenv("LANGSMITH_PROJECT", "research"))

from routes.interact import router as interact_router
from routes.pipeline import router as pipeline_router
from routes.query_artifact import router as query_artifact_router
from routes.extend import router as extend_router
from utils.logger import get_logger, log_event

logger = get_logger("backend.main")

app = FastAPI(title="AI Research Canvas API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline_router)
app.include_router(interact_router)
app.include_router(query_artifact_router)
app.include_router(extend_router)


@app.middleware("http")
async def request_logger(request: Request, call_next):
    start = time.perf_counter()
    log_event(logger, "http_request_start", method=request.method, path=request.url.path)
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    log_event(
        logger,
        "http_request_done",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        elapsed_ms=elapsed_ms,
    )
    return response


@app.on_event("startup")
async def startup_event():
    tracing_on = os.getenv("LANGCHAIN_TRACING_V2") == "true"
    log_event(
        logger,
        "backend_startup",
        version="2.0.0",
        langsmith_tracing=tracing_on,
        langsmith_project=os.getenv("LANGCHAIN_PROJECT"),
    )


@app.on_event("shutdown")
async def shutdown_event():
    log_event(logger, "backend_shutdown")


@app.get("/api/health")
async def health():
    log_event(logger, "health_check")
    return {"status": "ok", "version": "2.0.0"}
