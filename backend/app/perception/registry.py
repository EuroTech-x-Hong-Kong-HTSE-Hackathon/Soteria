"""Detector registry — turns ``settings.enabled_detectors`` into instances.

To add a new model: import it here and register it in ``_BUILDERS``. The name
must match what you put in ``settings.enabled_detectors`` and what you mapped
in ``perception.base.EVENT_KINDS``.
"""

from __future__ import annotations

import logging
from collections.abc import Callable

from app.config import settings
from app.perception.base import Detector
from app.perception.fall_detector import FallDetector
from app.perception.pose_fall_detector import PoseFallDetector

log = logging.getLogger(__name__)

_BUILDERS: dict[str, Callable[[], Detector]] = {
    "fall": PoseFallDetector,  # YOLO-pose + posture heuristic (default)
    "fall_box": FallDetector,  # legacy bounding-box classifier (fallback)
    # "intruder": IntruderDetector,
    # "heart_attack": HeartAttackDetector,
}


def build_enabled_detectors() -> list[Detector]:
    """Instantiate every detector named in ``settings.enabled_detectors``."""
    detectors: list[Detector] = []
    for name in settings.enabled_detectors:
        builder = _BUILDERS.get(name)
        if builder is None:
            log.warning("Unknown detector %r in enabled_detectors; skipping.", name)
            continue
        detectors.append(builder())
    return detectors
