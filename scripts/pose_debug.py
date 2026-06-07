#!/usr/bin/env python3
"""One-shot diagnostic for the pose fall heuristic.

Grabs a single webcam frame, runs the pose detector, and prints exactly what
drove the score (keypoint visibility, bbox shape, torso angle, final note).
Stay in a NORMAL upright pose when running it to see why it (mis)fires.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))


def main() -> int:
    import cv2

    from app.perception.pose_fall_detector import _KP_CONF, PoseFallDetector

    d = PoseFallDetector()
    d.load()

    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    for _ in range(10):  # warm up the sensor
        cap.read()
    ok, frame = cap.read()

    if not ok or frame is None:
        print("could not grab a frame")
        cap.release()
        return 1
    print("frame shape:", frame.shape)

    # Raw model output for bbox + keypoint inspection.
    results = d._model(frame, verbose=False)
    cap.release()
    first = results[0]

    boxes = getattr(first, "boxes", None)
    if boxes is not None and len(boxes):
        for i, b in enumerate(boxes.xyxy.cpu().numpy()):
            w, h = b[2] - b[0], b[3] - b[1]
            print(f"person {i}: bbox w={w:.0f} h={h:.0f} ratio(w/h)={w / max(h,1):.2f}")

    kp = getattr(first, "keypoints", None)
    if kp is not None and kp.data is not None and len(kp.data):
        names = {5: "Lsh", 6: "Rsh", 11: "Lhip", 12: "Rhip", 15: "Lank", 16: "Rank"}
        for i, p in enumerate(kp.data.cpu().numpy()):
            vis = {n: round(float(p[idx][2]), 2) for idx, n in names.items()}
            print(f"person {i} keypoint conf: {vis}  (visible >= {_KP_CONF})")

    res = d.detect(frame)
    print(f"\nFINAL  confidence={res.confidence:.3f}  is_positive={res.is_positive}")
    print(f"note: {res.note}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
