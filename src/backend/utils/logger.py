import json
import logging
import os
from datetime import datetime, timezone
from typing import Any


_LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()


def _configure_root() -> None:
    if logging.getLogger().handlers:
        return
    logging.basicConfig(
        level=getattr(logging, _LOG_LEVEL, logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


def get_logger(name: str) -> logging.Logger:
    _configure_root()
    return logging.getLogger(name)


def log_event(logger: logging.Logger, event: str, **fields: Any) -> None:
    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        **fields,
    }
    logger.info(json.dumps(payload, default=str))
