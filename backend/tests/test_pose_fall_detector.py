"""Tests for the YOLO-pose fall heuristic — no model required.

These exercise ``PoseFallDetector._score_person`` directly with synthetic COCO
keypoints, so the geometry (torso angle + bbox aspect) is validated offline with
no ultralytics weights, no webcam.

Run from the backend/ directory:
    python -m pytest tests/test_pose_fall_detector.py -v
"""

from __future__ import annotations

import numpy as np

from app.perception.pose_fall_detector import (
    _L_HIP,
    _L_SHOULDER,
    _R_HIP,
    _R_SHOULDER,
    PoseFallDetector,
)

_NOSE = 0


def _person(points: dict[int, tuple[float, float]]) -> np.ndarray:
    """Build a (17, 3) keypoint array; listed joints get conf=1.0, rest 0."""
    arr = np.zeros((17, 3), dtype=float)
    for idx, (x, y) in points.items():
        arr[idx] = (x, y, 1.0)
    return arr


def test_standing_person_scores_low():
    # Shoulders above hips, same x -> vertical torso. Tall bbox.
    person = _person(
        {
            _L_SHOULDER: (100, 100),
            _R_SHOULDER: (120, 100),
            _L_HIP: (100, 250),
            _R_HIP: (120, 250),
        }
    )
    bbox = np.array([95, 80, 125, 320])  # w=30, h=240 -> tall
    conf, _ = PoseFallDetector()._score_person(person, bbox)
    assert conf < 0.3


def test_fallen_person_scores_high():
    # Shoulders and hips at the same height, spread horizontally -> lying down.
    person = _person(
        {
            _L_SHOULDER: (100, 150),
            _R_SHOULDER: (100, 170),
            _L_HIP: (260, 150),
            _R_HIP: (260, 170),
        }
    )
    bbox = np.array([90, 140, 280, 190])  # w=190, h=50 -> wide
    conf, _ = PoseFallDetector()._score_person(person, bbox)
    assert conf >= 0.6


def test_only_legs_visible_stays_low_when_upright():
    # The original failure mode: only legs in frame, standing -> tall bbox,
    # no torso keypoints. Should NOT be flagged as a fall.
    person = _person({15: (100, 400), 16: (120, 400)})  # ankles only
    bbox = np.array([95, 200, 125, 420])  # w=30, h=220 -> tall
    conf, _ = PoseFallDetector()._score_person(person, bbox)
    assert conf < 0.3


def test_upper_body_upright_not_flagged():
    # The real desk-webcam bug: head + shoulders visible, hips out of frame,
    # wide upper-body bbox. Head is above shoulders -> upright -> must NOT flag.
    person = _person(
        {
            _NOSE: (110, 40),
            _L_SHOULDER: (90, 150),
            _R_SHOULDER: (130, 150),
        }
    )
    bbox = np.array([20, 20, 567, 278])  # w=547 h=258 ratio 2.12 (wide) but ignored
    conf, _ = PoseFallDetector()._score_person(person, bbox)
    assert conf < 0.3


def test_upper_body_lying_flagged():
    # Head beside shoulders (head-shoulder axis horizontal) -> lying down.
    person = _person(
        {
            _NOSE: (40, 150),
            _L_SHOULDER: (150, 140),
            _R_SHOULDER: (150, 160),
        }
    )
    conf, _ = PoseFallDetector()._score_person(person, bbox=None)
    assert conf >= 0.6


def test_single_keypoint_cannot_judge():
    # Only one body region visible -> not enough to judge posture -> not flagged.
    person = _person({_L_SHOULDER: (100, 150), _R_SHOULDER: (120, 150)})
    conf, note = PoseFallDetector()._score_person(person, bbox=None)
    assert conf == 0.0
    assert "insufficient" in note
