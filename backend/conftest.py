"""Pytest bootstrap: make the ``app`` package importable from the backend root."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
