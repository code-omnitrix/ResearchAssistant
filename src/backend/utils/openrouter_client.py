import asyncio
import os
import re
import time
from collections.abc import Sequence

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from pydantic import SecretStr
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential
from utils.logger import get_logger, log_event

load_dotenv()

DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")
BASE_URL = "https://openrouter.ai/api/v1"
logger = get_logger("backend.openrouter")


class OpenRouterError(RuntimeError):
    pass


class RepetitionLoopError(OpenRouterError):
    """Raised when the model output appears to be stuck in a repetition loop."""
    pass


# ---------------------------------------------------------------------------
# Repetition-loop detector
# ---------------------------------------------------------------------------
# Strategy: split output into tokens (words + punctuation), then look for any
# n-gram of 1–6 tokens that appears more than MAX_REPEATS consecutive times.
_MAX_REPEATS = 30  # if a phrase repeats 30+ times in a row → hallucination


def _check_repetition(text: str) -> None:
    """Raise RepetitionLoopError if *text* contains a runaway repetition loop."""
    tokens = re.findall(r"\S+", text)
    n = len(tokens)
    if n < _MAX_REPEATS * 2:
        return  # too short to be a loop

    for gram_size in range(1, 7):
        i = 0
        while i <= n - gram_size:
            gram = tokens[i : i + gram_size]
            count = 1
            j = i + gram_size
            while j + gram_size <= n and tokens[j : j + gram_size] == gram:
                count += 1
                j += gram_size
                if count >= _MAX_REPEATS:
                    phrase = " ".join(gram)
                    raise RepetitionLoopError(
                        f"Model stuck in repetition loop: {repr(phrase)!s} repeated {count}+ times"
                    )
            i += 1


def get_openrouter_chat(model: str | None = None, temperature: float = 0.2) -> ChatOpenAI:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        log_event(logger, "openrouter_missing_api_key")
        raise OpenRouterError("OPENROUTER_API_KEY is not set")

    log_event(logger, "openrouter_chat_init", model=model or DEFAULT_MODEL, temperature=temperature)

    return ChatOpenAI(
        model=model or DEFAULT_MODEL,
        openai_api_base=BASE_URL,
        openai_api_key=SecretStr(api_key),
        temperature=temperature,
    )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def invoke_with_retry(model: ChatOpenAI, messages: Sequence):
    try:
        log_event(logger, "openrouter_invoke_start", message_count=len(messages))
        response = model.invoke(messages)
        text = response.content if hasattr(response, "content") else str(response)
        _check_repetition(str(text))
        return response
    except RepetitionLoopError:
        log_event(logger, "openrouter_repetition_loop_detected")
        raise
    except Exception as exc:
        text = str(exc).lower()
        log_event(logger, "openrouter_invoke_error", error=str(exc))
        if "429" in text or ("rate" in text and "limit" in text):
            log_event(logger, "openrouter_rate_limited_sleep", seconds=60)
            time.sleep(60)
        raise


async def invoke_async(model: ChatOpenAI, messages: Sequence):
    """
    Async wrapper around invoke_with_retry.
    Runs the synchronous call in the default thread-pool executor so multiple
    LLM calls can be awaited concurrently with asyncio.gather().
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, invoke_with_retry, model, messages)
