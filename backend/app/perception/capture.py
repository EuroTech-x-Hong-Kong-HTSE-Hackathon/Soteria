"""OpenCV webcam capture.

Yields frames from the local camera for the perception stage. Kept tiny and
synchronous-friendly so it can be driven from the pipeline loop or a script.
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from app.config import settings


class Camera:
    """Thin wrapper around ``cv2.VideoCapture``.

    Usage:
        with Camera() as cam:
            for frame in cam.frames():
                ...
    """

    def __init__(self, index: int | None = None) -> None:
        self.index = settings.camera_index if index is None else index
        self._cap: Any = None  # cv2.VideoCapture

    def open(self) -> None:
        """Open the capture device.

        TODO: ``import cv2; self._cap = cv2.VideoCapture(self.index)`` and
        raise if it fails to open.
        """
        raise NotImplementedError

    def read(self) -> Any:
        """Read a single frame (BGR ndarray). Returns None on failure.

        TODO: ``ok, frame = self._cap.read()``; return frame or None.
        """
        raise NotImplementedError

    def frames(self) -> Iterator[Any]:
        """Yield frames until the stream ends or is closed.

        TODO: loop calling ``read()`` and yield non-None frames.
        """
        raise NotImplementedError

    def release(self) -> None:
        """Release the capture device."""
        # TODO: self._cap.release() if open.

    def __enter__(self) -> "Camera":
        self.open()
        return self

    def __exit__(self, *exc: object) -> None:
        self.release()
