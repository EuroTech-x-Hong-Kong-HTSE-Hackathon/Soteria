"""YOLO-pose fall detector.

Uses an Ultralytics YOLO-pose model (COCO 17 keypoints) plus a geometric
heuristic to decide whether a person is on the ground — instead of classifying a
bounding-box shape into fallen/sitting/standing. Reasoning about actual body
posture (the orientation of the vertical body axis) is far more robust to partial
views and odd framing than a box-shape classifier (the "only sees legs" problem).

The core signal is the angle of the body's vertical axis: take the highest and
lowest visible keypoints along the head -> shoulders -> hips -> knees -> ankles
chain and measure how far that axis tilts from vertical. Upright ~0deg, lying
down ~90deg. This works whether the full body or only the upper body is in frame
(a desk webcam typically only sees head + shoulders), which is exactly where a
bbox-aspect heuristic fails (a close-up upper body is "wide" but not fallen).

A single frame can only tell "horizontal" from "upright"; it cannot tell a
genuine fall from deliberately lying down. That fall-vs-rest judgement is the
agent's job (verification timer + recovery check). A temporal model that reads the
motion of the fall is the future-roadmap upgrade.
"""

from __future__ import annotations

import logging
from typing import Any

import numpy as np

from app.config import settings
from app.perception.base import Detector, DetectionResult

log = logging.getLogger(__name__)

# COCO keypoint indices (Ultralytics pose order).
_HEAD_IDS = (0, 1, 2, 3, 4)  # nose, eyes, ears
_L_SHOULDER, _R_SHOULDER = 5, 6
_L_HIP, _R_HIP = 11, 12
_L_KNEE, _R_KNEE = 13, 14
_L_ANKLE, _R_ANKLE = 15, 16

# Keypoints below this confidence are treated as not visible.
_KP_CONF = 0.3


class PoseFallDetector(Detector):
    """Fall detector backed by a YOLO-pose model + posture heuristic."""

    name = "fall"

    def __init__(self, model_name: str | None = None, threshold: float | None = None) -> None:
        self.model_name = model_name or settings.pose_model
        self.threshold = (
            settings.fall_confidence_threshold if threshold is None else threshold
        )
        self._model: Any = None

    def load(self) -> None:
        from ultralytics import YOLO

        # Official weights auto-download by name into the ultralytics cache.
        self._model = YOLO(self.model_name)
        log.info("PoseFallDetector loaded: %s", self.model_name)

    def detect(self, frame: Any) -> DetectionResult:
        if self._model is None:
            raise RuntimeError("PoseFallDetector.load() must be called before detect().")

        results = self._model(frame, verbose=False)
        if not results:
            return DetectionResult(self.name, False, 0.0)

        first = results[0]
        kp = getattr(first, "keypoints", None)
        boxes = getattr(first, "boxes", None)
        if kp is None or kp.data is None or len(kp.data) == 0:
            return DetectionResult(self.name, False, 0.0)

        kp_data = kp.data.cpu().numpy()  # (persons, 17, 3): x, y, conf
        boxes_xyxy = (
            boxes.xyxy.cpu().numpy() if boxes is not None and len(boxes) else None
        )

        # Most-fallen person wins — one person on the ground is the alarm.
        best_conf = 0.0
        best_note = ""
        for i, person in enumerate(kp_data):
            bbox = boxes_xyxy[i] if boxes_xyxy is not None and i < len(boxes_xyxy) else None
            conf, note = self._score_person(person, bbox)
            if conf > best_conf:
                best_conf, best_note = conf, note

        return DetectionResult(
            detector=self.name,
            is_positive=best_conf >= self.threshold,
            confidence=best_conf,
            note=best_note,
            raw=kp_data,
        )

    def _score_person(self, person: np.ndarray, bbox: np.ndarray | None) -> tuple[float, str]:
        """Return ``(fall_confidence, note)`` for one person's keypoints.

        Primary signal: tilt of the vertical body axis (topmost visible joint to
        bottommost visible joint along head->shoulder->hip->knee->ankle). When a
        full torso (shoulders + hips) is visible, the bbox aspect ratio
        corroborates; otherwise bbox is ignored because upper-body-only framing
        makes a wide-but-upright crop look "fallen".
        """
        head = _first_visible(person, _HEAD_IDS)
        shoulder = _midpoint(person, _L_SHOULDER, _R_SHOULDER)
        hip = _midpoint(person, _L_HIP, _R_HIP)
        knee = _midpoint(person, _L_KNEE, _R_KNEE)
        ankle = _midpoint(person, _L_ANKLE, _R_ANKLE)

        # Anatomical top -> bottom chain of whatever is visible.
        chain = [p for p in (head, shoulder, hip, knee, ankle) if p is not None]
        if len(chain) < 2:
            return 0.0, "insufficient keypoints to judge posture"

        top, bottom = chain[0], chain[-1]
        dx = abs(float(bottom[0] - top[0]))
        dy = abs(float(bottom[1] - top[1]))
        angle = float(np.degrees(np.arctan2(dx, dy + 1e-6)))  # 0 vertical .. 90 horizontal
        angle_score = _clamp(angle / 90.0)

        # Corroborate with bbox aspect ONLY with a full torso (shoulders + hips).
        if shoulder is not None and hip is not None and bbox is not None:
            w = float(bbox[2] - bbox[0])
            h = float(bbox[3] - bbox[1])
            ratio = w / h if h > 1 else 0.0
            bbox_score = _clamp((ratio - 0.7) / (1.4 - 0.7))
            confidence = 0.7 * angle_score + 0.3 * bbox_score
            return confidence, f"torso {angle:.0f}deg from vertical (+bbox {bbox_score:.2f})"

        return angle_score, f"body axis {angle:.0f}deg from vertical ({len(chain)} pts)"


def _midpoint(person: np.ndarray, a: int, b: int) -> np.ndarray | None:
    """Mean (x, y) of two keypoints, using only the ones above ``_KP_CONF``."""
    pts = [person[i][:2] for i in (a, b) if person[i][2] >= _KP_CONF]
    if not pts:
        return None
    return np.mean(pts, axis=0)


def _first_visible(person: np.ndarray, ids: tuple[int, ...]) -> np.ndarray | None:
    """(x, y) of the first keypoint in ``ids`` that is above ``_KP_CONF``."""
    for i in ids:
        if person[i][2] >= _KP_CONF:
            return person[i][:2]
    return None


def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, float(x)))
