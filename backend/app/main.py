"""FastAPI app exposing health + a WebSocket event stream for the dashboard.

The dashboard subscribes to ``/events`` and receives JSON messages describing
perception detections, the agent's reasoning, verification countdowns, and
alerts. This module is a STUB: it wires up the surface area only.

Run (from backend/):
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.config import settings

app = FastAPI(title="Soteria", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok", "service": "soteria"}


@app.websocket("/events")
async def events(ws: WebSocket) -> None:
    """Stream pipeline events to the dashboard.

    TODO: subscribe this socket to the pipeline's event bus and forward
    perception/agent/verify/alert events as JSON. For now it just accepts the
    connection and echoes a hello so the dashboard can prove connectivity.
    """
    await ws.accept()
    try:
        await ws.send_json({"type": "hello", "service": "soteria"})
        # TODO: replace echo loop with real event-bus subscription.
        while True:
            msg = await ws.receive_text()
            await ws.send_json({"type": "echo", "data": msg})
    except WebSocketDisconnect:
        # TODO: unsubscribe from the event bus.
        return


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
