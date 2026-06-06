"""Scam-call detection (STRETCH GOAL — stub only).

Pipeline: pre-recorded audio sample -> local transcription (faster-whisper) ->
local LLM classifies scam likelihood and explains the red flags. Fully local,
like the rest of the sensitive data path.

DO NOT build this out for the MVP — the hero flow (fall -> alert) comes first.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config import settings


@dataclass
class ScamResult:
    """Outcome of analysing an audio sample."""

    is_scam: bool
    confidence: float
    transcript: str = ""
    rationale: str = ""


class ScamDetector:
    """faster-whisper transcription + LLM scam classification (stub)."""

    def __init__(self, whisper_model: str | None = None) -> None:
        self.whisper_model = whisper_model or settings.whisper_model
        self._model = None  # faster_whisper.WhisperModel

    def transcribe(self, audio_path: str) -> str:
        """Transcribe an audio file locally.

        TODO: ``from faster_whisper import WhisperModel`` and run inference.
        """
        raise NotImplementedError

    def analyze(self, audio_path: str) -> ScamResult:
        """Transcribe then classify whether the call is likely a scam.

        TODO: transcribe -> prompt the local LLM -> parse a ScamResult.
        """
        raise NotImplementedError
