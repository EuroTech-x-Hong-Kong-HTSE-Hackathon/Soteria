"""Detector ABC + DetectionResult.

The extensibility seam for perception. Each ML model that watches the webcam
(fall detection now; intruder, heart-attack, etc. later) implements this
interface. The pipeline runs every enabled detector on every frame and treats
their outputs uniformly: an above-threshold positive becomes a candidate that
the agent verifies.

Adding a new detector is a 3-step pattern:
  1. Subclass :class:`Detector`, set ``name``, implement ``load`` + ``detect``.
  2. Add an entry to :data:`EVENT_KINDS` mapping its ``name`` to an EventLog
     kind string (declare the kind in ``app.event_log`` if it's new).
  3. Wire it into :func:`app.perception.registry.build_enabled_detectors` and
     add the name to ``settings.enabled_detectors``.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from app.event_log import FALL_CANDIDATE


@dataclass
class DetectionResult:
    """Outcome of running one detector on one frame."""

    detector: str          # detector name, e.g. "fall", "intruder"
    is_positive: bool      # above-threshold positive detection
    confidence: float      # max confidence across positives in the frame
    note: str = ""         # short human-readable context, optional
    raw: Any = None        # boxes / keypoints / mask, for overlay & debug


class Detector(ABC):
    """Base class for any perception model.

    Subclasses set ``name`` (str) and implement ``load`` + ``detect``.
    """

    name: str = ""
    threshold: float = 0.5

    @abstractmethod
    def load(self) -> None:
        """Load model weights. Called once before the pipeline starts."""

    @abstractmethod
    def detect(self, frame: Any) -> DetectionResult:
        """Run inference on a single frame and return a result."""


# Detector name -> EventLog kind to record when a candidate is confirmed.
# Future detectors register their kinds here; declare new kinds in
# ``app.event_log`` so the agent's tool layer also knows about them.
EVENT_KINDS: dict[str, str] = {
    "fall": FALL_CANDIDATE,
}
