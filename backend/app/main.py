"""FastAPI app: health, a live MJPEG video feed, and a WebSocket event stream.

The B2C dashboard shows the resident's camera via the ``/video`` MJPEG endpoint
(annotated with pose keypoints + fall confidence) and subscribes to ``/events``
for detections/agent reasoning/alerts. The perception pipeline runs as a
background task for the app's lifetime, so a single process both watches the
webcam and serves the dashboard.

PRIVACY NOTE: ``/video`` is the on-device preview for the demo. In production the
raw frames stay on the edge device; only text alerts leave. Run the backend on
the same machine as the camera.

Run (from backend/):
    uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
from collections.abc import AsyncIterator
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config import settings
from app.pipeline import pipeline

# Make our app loggers visible regardless of how the process is launched.
# uvicorn's own log config doesn't reach `app.*` loggers by default — without
# this, the perception/agent/alert lifecycle lines (frame N..., agent: ...,
# worker: ...) silently disappear under the uvicorn launcher.
logging.getLogger("app").setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))
if not logging.getLogger().handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

log = logging.getLogger(__name__)


async def _run_pipeline_guarded() -> None:
    """Run the perception pipeline, surviving environment gaps.

    A missing camera / CV deps must not take down the API; we log and stop the
    pipeline task, leaving the dashboard connectable (the video feed just stays
    blank until the environment is ready).
    """
    try:
        await pipeline.run()
    except asyncio.CancelledError:
        raise
    except Exception:
        log.exception("perception pipeline stopped; API stays up, feed idle")


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Start the pipeline on startup; cancel it cleanly on shutdown."""
    task = asyncio.create_task(_run_pipeline_guarded(), name="soteria-pipeline")
    try:
        yield
    finally:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app = FastAPI(title="Soteria", version="0.1.0", lifespan=lifespan)

# The dashboard is served from a different origin (the vite dev server), so allow
# cross-origin calls. The MJPEG <img> tag itself needs no CORS, but /events and
# any fetch() do.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok", "service": "soteria"}


def _annotate(frame: Any, results: dict[str, Any]) -> Any:
    """Overlay keypoints, per-detector confidence, and a fall banner on a frame."""
    import cv2
    import numpy as np

    img = frame.copy()
    y = 30
    fallen = False
    for name, res in results.items():
        color = (0, 0, 255) if res.is_positive else (0, 200, 0)
        fallen = fallen or res.is_positive
        cv2.putText(
            img, f"{name}: {res.confidence:.2f}", (10, y),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2,
        )
        y += 28
        raw = res.raw
        if isinstance(raw, np.ndarray) and raw.ndim == 3:  # pose keypoints (persons, 17, 3)
            for person in raw:
                for px, py, pc in person:
                    if pc >= 0.3:
                        cv2.circle(img, (int(px), int(py)), 3, color, -1)

    if fallen:
        cv2.putText(
            img, "FALL DETECTED", (10, img.shape[0] - 20),
            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3,
        )
    return img


async def _mjpeg_stream() -> AsyncIterator[bytes]:
    """Yield the latest annotated frame as an MJPEG multipart stream."""
    import cv2

    while True:
        frame, results = pipeline.snapshot()
        if frame is None:
            await asyncio.sleep(0.05)
            continue
        ok, buf = cv2.imencode(".jpg", _annotate(frame, results), [cv2.IMWRITE_JPEG_QUALITY, 80])
        if ok:
            yield (
                b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n"
            )
        await asyncio.sleep(0.05)  # ~20 fps cap


@app.get("/video")
async def video() -> StreamingResponse:
    """Live MJPEG camera feed with detection overlays (for the dashboard)."""
    return StreamingResponse(
        _mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.websocket("/events")
async def events(ws: WebSocket) -> None:
    """Stream pipeline events to the dashboard as JSON."""
    await ws.accept()
    await ws.send_json({"type": "hello", "service": "soteria"})

    stream = pipeline.subscribe()
    try:
        async for event in stream:
            await ws.send_text(
                json.dumps({"type": event.type, "payload": event.payload}, default=str)
            )
    except WebSocketDisconnect:
        pass
    except Exception:
        log.exception("/events forwarding failed; closing socket")
    finally:
        with contextlib.suppress(Exception):
            await stream.aclose()


def main() -> None:
    """Entry point for ``python -m app.main`` style launches."""
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
