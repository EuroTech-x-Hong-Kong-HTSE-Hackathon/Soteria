#!/usr/bin/env python3
"""Local scam-call detection demo.

Recorded call audio -> local transcription (faster-whisper) -> local LLM
scam classification -> optional text alert to the trusted contact. Fully
on-device; only the final text alert (never the transcript/audio) leaves.

First run downloads the faster-whisper weights into the local cache. The LLM
classification needs Ollama running (see CLAUDE.md / docs/development_setup.md).

Usage (from soteria/ project root, venv active):
    python scripts/scam_demo.py samples/scam_sample.wav
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Detect whether a recorded call is a scam.")
    parser.add_argument("audio", help="Path to a call recording (e.g. samples/scam_sample.wav)")
    args = parser.parse_args()

    audio_path = Path(args.audio)
    if not audio_path.exists():
        print(f"error: audio file not found: {audio_path}", file=sys.stderr)
        return 2

    from app.audio.scam_detector import ScamDetector
    from app.config import settings

    detector = ScamDetector()
    result = detector.analyze(str(audio_path))

    print("\n--- Scam analysis ---")
    print(f"transcript : {result.transcript}")
    print(f"is_scam    : {result.is_scam}")
    print(f"confidence : {result.confidence:.2f}")
    print(f"rationale  : {result.rationale}")

    if result.is_scam and result.confidence >= settings.scam_confidence_threshold:
        # Text-only alert. Never include the transcript or the audio.
        message = (
            f"📞 Soteria: likely scam call detected "
            f"(confidence {result.confidence:.0%}). {result.rationale}"
        )
        try:
            from app.alerts.base import get_alerter

            send_result = get_alerter().send(message)
            status = "sent" if send_result.ok else f"failed ({send_result.detail})"
            print(f"\nalert      : {status}")
        except Exception as exc:  # missing alerter config shouldn't crash the demo
            print(f"\nalert      : could not send ({type(exc).__name__}: {exc})")
    else:
        print("\nalert      : not sent (below threshold or not a scam)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
