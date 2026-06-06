#!/usr/bin/env python3
"""Walking skeleton: webcam -> fake fall (keypress) -> Telegram alert.

This is the FIRST thing to get working in the build. It proves the end-to-end
pipe (camera in, alert out) before any real detection or agent logic exists.

What it does:
  - Opens the local webcam with OpenCV and shows the live feed.
  - Press 'f' to FAKE a fall -> sends a Telegram message to the trusted contact.
  - Press 'q' to quit.

Requirements: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in soteria/.env.

Run (from the soteria/ project root, venv active):
    python scripts/walking_skeleton.py

NOTE: this is a RUNNABLE stub. Capture + the alert call are implemented enough
to demo the pipe; swap the keypress for real fall detection later.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Allow importing the app package when run as a script from project root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))


def send_fake_fall_alert() -> None:
    """Send a single 'fall detected' alert via the configured channel."""
    from app.alerts.base import get_alerter

    result = get_alerter().send(
        "🚨 Soteria (demo): possible fall detected. This is a walking-skeleton test."
    )
    if result.ok:
        print("alert sent")
    else:
        print(f"alert FAILED: {result.detail}")


def main() -> int:
    """Show the webcam feed; 'f' fakes a fall, 'q' quits."""
    import cv2

    from app.config import settings

    cap = cv2.VideoCapture(settings.camera_index)
    if not cap.isOpened():
        print(f"could not open camera index {settings.camera_index}", file=sys.stderr)
        return 1

    print("Soteria walking skeleton — press 'f' to fake a fall, 'q' to quit.")
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("camera read failed", file=sys.stderr)
                return 1

            cv2.imshow("Soteria — walking skeleton", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("f"):
                send_fake_fall_alert()
            elif key == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
