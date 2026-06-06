"""YOLO-pose fall detection (local, via Ultralytics).

Runs a pose model on each frame and applies a simple heuristic to flag a likely
fall (e.g. torso near-horizontal, sudden vertical drop of keypoints, person
remaining low for several frames). The model weights are auto-downloaded by
Ultralytics on first use and cached locally — no inference leaves the device.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.config import settings


@dataclass
class FallResult:
    """Outcome of running the detector on one frame."""

    is_fall: bool
    confidence: float
    keypoints: Any = None  # raw pose keypoints for debugging / overlay


class FallDetector:
    """Wraps an Ultralytics YOLO-pose model + a fall heuristic."""

    def __init__(self, model_path: str | None = None, threshold: float | None = None) -> None:
        self.model_path = model_path or settings.yolo_pose_model
        self.threshold = (
            settings.fall_confidence_threshold if threshold is None else threshold
        )
        self._model: Any = None  # ultralytics.YOLO

    def load(self) -> None:
        """Load the pose model.

        TODO: ``from ultralytics import YOLO; self._model = YOLO(self.model_path)``.
        """
        raise NotImplementedError

    def detect(self, frame: Any) -> FallResult:
        """Run pose estimation on a frame and classify a fall.

        TODO:
          1. results = self._model(frame, verbose=False)
          2. Extract person keypoints (shoulders, hips, ankles).
          3. Heuristic: torso angle ~horizontal AND/OR low bbox height ratio.
          4. Return FallResult(is_fall=confidence >= self.threshold, ...).
        """
        raise NotImplementedError
