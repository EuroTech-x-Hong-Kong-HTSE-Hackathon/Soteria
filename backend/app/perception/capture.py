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
        """Open the capture device. Raises if it fails.

        On Windows the default MSMF backend is flaky (intermittent
        ``can't grab frame`` errors and clashes when a device is briefly held by
        another process), so prefer DirectShow there and fall back to the
        default backend if it won't open.
        """
        import sys

        import cv2

        if sys.platform == "win32":
            self._cap = cv2.VideoCapture(self.index, cv2.CAP_DSHOW)
            if not self._cap.isOpened():
                self._cap.release()
                self._cap = cv2.VideoCapture(self.index)  # fall back to default
        else:
            self._cap = cv2.VideoCapture(self.index)

        if not self._cap.isOpened():
            self._cap = None
            raise RuntimeError(f"could not open camera index {self.index}")

    def read(self) -> Any:
        """Read a single frame (BGR ndarray). Returns None on failure."""
        if self._cap is None:
            return None
        ok, frame = self._cap.read()
        return frame if ok else None

    def frames(self) -> Iterator[Any]:
        """Yield frames until the stream ends or is closed."""
        while True:
            frame = self.read()
            if frame is None:
                return
            yield frame

    def release(self) -> None:
        """Release the capture device."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def __enter__(self) -> "Camera":
        self.open()
        return self

    def __exit__(self, *exc: object) -> None:
        self.release()
