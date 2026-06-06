"""Shared in-memory event log.

A tiny ring-buffer of recent perception/activity events. The vision pipeline
*writes* events (fall candidates, motion, recovery); the agent *reads* them via
its ``get_recent_events`` tool and uses them to judge whether a person recovered
during the verification grace period.

Kept dependency-free and in-memory on purpose: it lives on-device, nothing here
ever leaves the machine.
"""

from __future__ import annotations

import time
from collections import deque
from dataclasses import asdict, dataclass, field

# Event kinds the pipeline may record. Not an enum so perception can add its own
# without touching this file, but these are the ones the agent reasons about.
FALL_CANDIDATE = "fall_candidate"  # vision flagged a possible fall
STILL = "still"  # person still appears down / not moving
MOTION = "motion"  # general movement seen
RECOVERY = "recovery"  # person got back up / cancelled
INFO = "info"  # free-form note


@dataclass
class DetectionEvent:
    """A single timestamped event in the log.

    ``seq`` is a monotonic insertion counter assigned by the log. It exists so
    callers can ask "what was added after this point?" without depending on
    wall-clock resolution (``ts`` can be too coarse to distinguish events that
    land in the same OS clock tick, especially on Windows).
    """

    kind: str
    is_fall: bool = False
    confidence: float = 0.0
    note: str = ""
    ts: float = field(default_factory=time.time)
    seq: int = 0

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


class EventLog:
    """Bounded, in-memory log of recent detection events."""

    def __init__(self, maxlen: int = 200) -> None:
        self._events: deque[DetectionEvent] = deque(maxlen=maxlen)
        self._seq = 0

    def add(self, event: DetectionEvent) -> DetectionEvent:
        """Append an already-built event, stamping it with the next ``seq``."""
        self._seq += 1
        event.seq = self._seq
        self._events.append(event)
        return event

    def record(self, kind: str, **fields: object) -> DetectionEvent:
        """Convenience: build + append an event in one call."""
        return self.add(DetectionEvent(kind=kind, **fields))  # type: ignore[arg-type]

    def recent(self, limit: int = 10) -> list[dict[str, object]]:
        """Return the most recent ``limit`` events, oldest-first, as dicts."""
        items = list(self._events)[-limit:]
        return [e.to_dict() for e in items]

    @property
    def cursor(self) -> int:
        """Current sequence position; pass to :meth:`since_cursor` later."""
        return self._seq

    def since_cursor(self, cursor: int) -> list[DetectionEvent]:
        """Return events added after the given ``cursor`` position."""
        return [e for e in self._events if e.seq > cursor]

    def since(self, ts: float) -> list[DetectionEvent]:
        """Return events recorded strictly after wall-clock ``ts``."""
        return [e for e in self._events if e.ts > ts]

    def clear(self) -> None:
        self._events.clear()

    def __len__(self) -> int:
        return len(self._events)
