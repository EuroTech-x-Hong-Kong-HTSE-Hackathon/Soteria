"""Pipeline orchestration: perception -> agent -> verify -> alert.

This is the spine of the hero flow. The pipeline pulls frames from the camera,
runs fall detection, and on a candidate fall hands control to the agentic layer,
which confirms via a verification timer and recent detection events (did the
person get back up?), and escalates a Telegram alert if the fall is confirmed.

Everything on the sensitive data path (video frames) stays local. Only the
final alert leaves the device.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Event:
    """A single pipeline event broadcast to subscribers (e.g. the dashboard)."""

    type: str  # detection | agent_reasoning | verification | alert | info
    payload: dict[str, Any] = field(default_factory=dict)


class Pipeline:
    """Orchestrates the end-to-end hero flow.

    TODO: wire together capture -> fall_detector -> agent -> alerter, and
    publish ``Event``s to subscribers as each stage runs.
    """

    def __init__(self) -> None:
        # TODO: construct camera capture, fall detector, agent, and alerter
        # from app.config.settings.
        self._subscribers: list[Any] = []

    def subscribe(self) -> "AsyncIterator[Event]":
        """Return an async iterator of events for a dashboard WebSocket.

        TODO: back this with an asyncio.Queue per subscriber.
        """
        raise NotImplementedError

    async def run(self) -> None:
        """Main loop: capture -> detect -> (on fall) agent -> verify -> alert.

        TODO:
          1. Iterate frames from capture.
          2. Run fall_detector; emit a `detection` event.
          3. On a candidate fall above threshold, invoke the agent.
          4. Agent runs a verification timer + checks recent events for recovery.
          5. If confirmed, call the alerter; emit an `alert` event.
        """
        raise NotImplementedError


pipeline = Pipeline()
