"""Pipeline orchestration: perception -> agent -> verify -> alert.

The spine of the hero flow. Three concurrent coroutines:

  - capture+detect: pulls frames, runs every enabled detector, emits events,
    enqueues a candidate when one persists above-threshold for long enough.
  - agent worker: pulls one candidate at a time, hands it to the verification
    agent (timer + escalate tools). One run at a time so the trusted contact
    isn't spammed.
  - display (optional): cv2 overlay window for the demo. ``q`` cancels.

Events are fanned out to subscribers (e.g. the dashboard ``/events`` WebSocket)
via per-subscriber asyncio queues.

Sensitive data path stays local. Only the final alert leaves the device.
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any

from app.agent.agent import VerificationAgent
from app.config import settings
from app.event_log import MOTION, RECOVERY, EventLog
from app.perception.base import EVENT_KINDS, DetectionResult, Detector
from app.perception.capture import Camera
from app.perception.registry import build_enabled_detectors

log = logging.getLogger(__name__)


@dataclass
class Event:
    """A single pipeline event broadcast to subscribers (e.g. the dashboard)."""

    type: str  # detection | candidate | agent_started | agent_done | alert | info
    payload: dict[str, Any] = field(default_factory=dict)


class Pipeline:
    """Orchestrates the end-to-end hero flow."""

    def __init__(
        self,
        camera: Camera | None = None,
        detectors: list[Detector] | None = None,
        event_log: EventLog | None = None,
        agent: VerificationAgent | None = None,
    ) -> None:
        self.event_log = event_log or EventLog()
        self.camera = camera or Camera()
        self.detectors = detectors if detectors is not None else build_enabled_detectors()
        self.agent = agent or VerificationAgent(
            event_log=self.event_log,
            on_event=self._emit_from_agent,
        )
        self._candidates: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        self._subscribers: list[asyncio.Queue[Event]] = []
        self._latest_frame: Any = None
        self._latest_results: dict[str, DetectionResult] = {}
        self._stop = asyncio.Event()

    # --- subscription ---------------------------------------------------------
    def subscribe(self) -> AsyncIterator[Event]:
        """Return an async iterator of events for a dashboard subscriber."""
        queue: asyncio.Queue[Event] = asyncio.Queue()
        self._subscribers.append(queue)

        async def iterator() -> AsyncIterator[Event]:
            try:
                while True:
                    yield await queue.get()
            finally:
                if queue in self._subscribers:
                    self._subscribers.remove(queue)

        return iterator()

    def _emit(self, event: Event) -> None:
        for q in list(self._subscribers):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                log.warning("subscriber queue full; dropping event %s", event.type)

    def _emit_from_agent(self, event_type: str, payload: dict[str, Any]) -> None:
        # The agent's on_event hook is sync-or-async; we just fan out as-is.
        self._emit(Event(type=f"agent_{event_type}" if not event_type.startswith("agent_") else event_type, payload=payload))

    # --- main loop ------------------------------------------------------------
    async def run(self) -> None:
        await asyncio.to_thread(self._load_detectors)
        self.camera.open()
        try:
            await asyncio.gather(
                self._capture_loop(),
                self._agent_worker(),
                self._display_loop(),
            )
        finally:
            self.camera.release()
            if settings.show_perception_window:
                try:
                    import cv2

                    cv2.destroyAllWindows()
                except Exception:
                    pass

    def _load_detectors(self) -> None:
        for d in self.detectors:
            d.load()

    # --- capture + detect -----------------------------------------------------
    async def _capture_loop(self) -> None:
        # Per-detector state: when did the current candidate start? have we already
        # enqueued it? Tracked separately so detectors don't interfere.
        candidate_started: dict[str, float | None] = {d.name: None for d in self.detectors}
        candidate_active: dict[str, bool] = {d.name: False for d in self.detectors}
        frame_count = 0
        log_every = 15  # frames; ~once per half-second at 30fps

        while not self._stop.is_set():
            frame = await asyncio.to_thread(self.camera.read)
            if frame is None:
                await asyncio.sleep(0.05)
                continue
            self._latest_frame = frame
            frame_count += 1

            for det in self.detectors:
                result = await asyncio.to_thread(det.detect, frame)
                self._latest_results[det.name] = result
                if frame_count % log_every == 0 or result.is_positive:
                    log.info(
                        "frame %d  %s: conf=%.3f%s",
                        frame_count, det.name, result.confidence,
                        "  POSITIVE" if result.is_positive else "",
                    )
                self._emit(Event(
                    type="detection",
                    payload={
                        "detector": result.detector,
                        "is_positive": result.is_positive,
                        "confidence": result.confidence,
                    },
                ))

                if result.is_positive:
                    if candidate_started[det.name] is None:
                        candidate_started[det.name] = time.time()
                    elapsed = time.time() - candidate_started[det.name]
                    if elapsed >= settings.pipeline_min_confirm_seconds and not candidate_active[det.name]:
                        candidate_active[det.name] = True
                        self._record_candidate(det.name, result)
                else:
                    if candidate_active[det.name]:
                        # Detector lost the positive — likely recovery / movement.
                        self.event_log.record(
                            RECOVERY,
                            is_fall=False,
                            note=f"{det.name} detector no longer positive",
                        )
                        self._emit(Event(type="recovery", payload={"detector": det.name}))
                        candidate_active[det.name] = False
                    elif candidate_started[det.name] is not None:
                        # Brief blip didn't persist — log motion only.
                        self.event_log.record(MOTION, is_fall=False)
                    candidate_started[det.name] = None

            # Yield to the loop so display + worker get scheduled.
            await asyncio.sleep(0)

    def _record_candidate(self, detector_name: str, result: DetectionResult) -> None:
        kind = EVENT_KINDS.get(detector_name, "info")
        self.event_log.record(
            kind,
            is_fall=detector_name == "fall",
            confidence=result.confidence,
            note=result.note or f"{detector_name} candidate",
        )
        candidate = {
            "detector": detector_name,
            "is_fall": detector_name == "fall",  # back-compat with current agent prompt
            "confidence": result.confidence,
            "note": result.note or f"{detector_name} candidate",
        }
        self._emit(Event(type="candidate", payload=candidate))
        self._candidates.put_nowait(candidate)

    # --- agent worker ---------------------------------------------------------
    async def _agent_worker(self) -> None:
        while not self._stop.is_set():
            try:
                candidate = await asyncio.wait_for(self._candidates.get(), timeout=0.5)
            except asyncio.TimeoutError:
                continue
            try:
                result = await self.agent.run(candidate)
                self._emit(Event(
                    type="alert" if result.escalated else "dismissed",
                    payload={"escalated": result.escalated, "summary": result.summary},
                ))
            except Exception as exc:
                log.exception("agent run failed")
                self._emit(Event(type="error", payload={"error": str(exc)}))

    # --- display loop (optional) ----------------------------------------------
    async def _display_loop(self) -> None:
        if not settings.show_perception_window:
            await self._stop.wait()
            return

        import cv2

        while not self._stop.is_set():
            frame = self._latest_frame
            if frame is not None:
                annotated = None
                if settings.show_detector_overlay:
                    # Use any detector's Results.plot() for native YOLO-style boxes.
                    for result in self._latest_results.values():
                        if hasattr(result.raw, "plot"):
                            annotated = result.raw.plot()
                            break
                if annotated is None:
                    annotated = frame.copy()
                for det_name, result in self._latest_results.items():
                    label = f"{det_name}: {result.confidence:.2f}"
                    color = (0, 0, 255) if result.is_positive else (0, 255, 0)
                    cv2.putText(
                        annotated, label, (10, 30 + 25 * list(self._latest_results).index(det_name)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2,
                    )
                cv2.imshow("Soteria - perception", annotated)
            if (cv2.waitKey(1) & 0xFF) == ord("q"):
                self._stop.set()
                break
            await asyncio.sleep(0.03)


pipeline = Pipeline()
