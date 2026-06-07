#!/usr/bin/env python3
"""Run the live perception pipeline.

Webcam -> enabled detectors -> agent (verification timer + escalate) -> Telegram.

First run downloads the HF model into ``~/.cache/huggingface/`` (a few hundred
MB depending on the model). Subsequent runs hit the cache.

Usage (from soteria/ project root, venv active):
    python scripts/run_pipeline.py

Press 'q' in the perception window to quit cleanly.
"""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    from app.pipeline import pipeline

    try:
        asyncio.run(pipeline.run())
    except KeyboardInterrupt:
        print("\ninterrupted")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
