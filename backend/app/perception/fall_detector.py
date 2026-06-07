"""YOLOv11 fall detector (Hugging Face: melihuzunoglu/human-fall-detection).

Loads the model once via ``huggingface_hub.hf_hub_download`` (cached under
``~/.cache/huggingface/``) and runs it through Ultralytics on each frame.
Single ``Detector`` implementation — adding more detectors is a new subclass,
not changes here.

Handles BOTH detection-head models (boxes) and classification-head models
(probs), so the same code path works whether the HF repo ships a YOLO-detect
or a YOLO-cls checkpoint.
"""

from __future__ import annotations

import logging
from typing import Any

from app.config import settings
from app.perception.base import Detector, DetectionResult

log = logging.getLogger(__name__)

# Lower than our trigger threshold so ultralytics doesn't silently drop
# borderline detections; we apply our real threshold ourselves.
_RAW_CONF_FLOOR = 0.05


class FallDetector(Detector):
    """Detector for human falls, backed by an HF YOLOv11 model."""

    name = "fall"

    def __init__(
        self,
        repo_id: str | None = None,
        filename: str | None = None,
        threshold: float | None = None,
    ) -> None:
        self.repo_id = repo_id or settings.fall_detector_repo
        self.filename = filename or settings.fall_detector_filename
        self.threshold = (
            settings.fall_confidence_threshold if threshold is None else threshold
        )
        self._model: Any = None
        self._fall_class_id: int | None = None
        self._task: str = ""  # "detect" | "classify" | "pose" | ...

    def load(self) -> None:
        from huggingface_hub import hf_hub_download
        from ultralytics import YOLO

        path = hf_hub_download(repo_id=self.repo_id, filename=self.filename)
        self._model = YOLO(path)

        self._task = getattr(self._model, "task", "") or ""
        names = getattr(self._model, "names", None) or {}
        log.info("FallDetector loaded: task=%s names=%s", self._task, names)

        if isinstance(names, dict):
            for class_id, label in names.items():
                if isinstance(label, str) and "fall" in label.lower():
                    self._fall_class_id = int(class_id)
                    break

    def detect(self, frame: Any) -> DetectionResult:
        if self._model is None:
            raise RuntimeError("FallDetector.load() must be called before detect().")

        results = self._model(frame, verbose=False, conf=_RAW_CONF_FLOOR)
        if not results:
            return DetectionResult(self.name, False, 0.0)

        first = results[0]
        confidence = 0.0
        raw: Any = None

        # Classification head (yolo11n-cls and similar): `.probs` carries
        # per-class probabilities; pick the fall class if known, else top-1.
        probs = getattr(first, "probs", None)
        if probs is not None:
            data = probs.data.tolist() if hasattr(probs.data, "tolist") else list(probs.data)
            if self._fall_class_id is not None and self._fall_class_id < len(data):
                confidence = float(data[self._fall_class_id])
            else:
                confidence = float(max(data)) if data else 0.0
            raw = probs

        # Detection head: `.boxes` carries per-detection conf + cls.
        boxes = getattr(first, "boxes", None)
        if boxes is not None and len(boxes) > 0:
            confs = boxes.conf.tolist() if hasattr(boxes.conf, "tolist") else list(boxes.conf)
            if self._fall_class_id is not None:
                cls = boxes.cls.tolist() if hasattr(boxes.cls, "tolist") else list(boxes.cls)
                fall_confs = [c for c, k in zip(confs, cls) if int(k) == self._fall_class_id]
                if fall_confs:
                    confidence = max(confidence, float(max(fall_confs)))
            elif confs:
                confidence = max(confidence, float(max(confs)))
            raw = boxes

        return DetectionResult(
            detector=self.name,
            is_positive=confidence >= self.threshold,
            confidence=confidence,
            raw=raw,
        )
