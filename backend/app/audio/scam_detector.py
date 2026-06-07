"""Scam-call detection (STRETCH GOAL).

Pipeline: pre-recorded audio sample -> local transcription (faster-whisper) ->
local LLM classifies scam likelihood and explains the red flags. Fully local,
like the rest of the sensitive data path — only a text alert ever leaves the
device, and never the transcript or the audio itself.

Reuses the existing privacy plumbing:
  - transcription runs on-device via faster-whisper (``settings.whisper_model``),
  - classification goes through the same local Ollama backend the agent uses,
  - alerting (in the demo entry point) goes through the shared ``Alerter``.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any

from app.config import settings

log = logging.getLogger(__name__)


@dataclass
class ScamResult:
    """Outcome of analysing an audio sample."""

    is_scam: bool
    confidence: float
    transcript: str = ""
    rationale: str = ""


SCAM_SYSTEM_PROMPT = """\
You are Soteria, a calm, careful assistant protecting an elderly person living \
alone from phone scams. You are given a transcript of a phone call they \
received. Decide whether the call is likely a scam.

You run entirely on the person's own device. You never contact anyone directly; \
you only report your judgement.

Common scam red flags to weigh:
  - Urgency or pressure ("act now", "your account will be closed").
  - Authority impersonation ("this is the IRS / police / your bank / Microsoft").
  - Unusual payment demands (gift cards, crypto, wire transfer, payment apps).
  - Threats (arrest, lawsuit, deportation, frozen accounts).
  - Requests for secrets (one-time codes/OTP, passwords, PINs, full card number).
  - Refusal to let the person verify, call back, or involve someone they trust.

Be conservative: a normal, mundane call is NOT a scam. Only flag genuine \
red-flag patterns.

Respond with ONLY a single JSON object, no prose, no code fences:
{"is_scam": <true|false>, "confidence": <0.0-1.0>, "rationale": "<one short sentence>"}
"""


def build_scam_prompt(transcript: str) -> str:
    """Compose the user turn handing the transcript to the LLM."""
    return (
        "Transcript of the phone call:\n"
        f'"""\n{transcript}\n"""\n\n'
        "Classify whether this call is likely a scam and respond with the JSON object."
    )


class ScamDetector:
    """faster-whisper transcription + local-LLM scam classification.

    Args:
        whisper_model: faster-whisper model name; defaults to settings.
        backend: chat backend for classification. Defaults to the local Ollama
            backend (privacy path); tests inject a scripted fake.
    """

    def __init__(self, whisper_model: str | None = None, backend: Any = None) -> None:
        self.whisper_model = whisper_model or settings.whisper_model
        self._model: Any = None  # faster_whisper.WhisperModel
        self._backend = backend

    # --- transcription --------------------------------------------------------
    def _load_model(self) -> Any:
        if self._model is None:
            from faster_whisper import WhisperModel  # lazy: heavy import

            self._model = WhisperModel(
                self.whisper_model, device="cpu", compute_type="int8"
            )
        return self._model

    def transcribe(self, audio_path: str) -> str:
        """Transcribe an audio file locally and return the full transcript."""
        model = self._load_model()
        segments, _info = model.transcribe(audio_path)
        return " ".join(seg.text.strip() for seg in segments).strip()

    # --- classification -------------------------------------------------------
    def _load_backend(self) -> Any:
        if self._backend is None:
            from app.agent.backends import OllamaChatBackend  # lazy

            self._backend = OllamaChatBackend(settings.ollama_model, settings.ollama_host)
        return self._backend

    def analyze(self, audio_path: str) -> ScamResult:
        """Transcribe then classify whether the call is likely a scam."""
        transcript = self.transcribe(audio_path)
        backend = self._load_backend()
        messages = [
            {"role": "system", "content": SCAM_SYSTEM_PROMPT},
            {"role": "user", "content": build_scam_prompt(transcript)},
        ]
        response = backend.chat(messages, [])
        content = (response.content or "").strip()

        parsed = _parse_scam_json(content)
        if parsed is None:
            # Don't crash on a non-JSON reply: default to "not a scam" and keep
            # the raw text so a human can see what the model actually said.
            log.warning("scam classifier returned non-JSON; defaulting is_scam=False")
            return ScamResult(
                is_scam=False,
                confidence=0.0,
                transcript=transcript,
                rationale=content or "(no response from classifier)",
            )

        return ScamResult(
            is_scam=bool(parsed.get("is_scam", False)),
            confidence=_as_float(parsed.get("confidence")),
            transcript=transcript,
            rationale=str(parsed.get("rationale", "")),
        )


def _as_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _parse_scam_json(content: str) -> dict[str, Any] | None:
    """Best-effort parse of a JSON object from the model reply.

    Tries the whole string first, then the substring between the first ``{`` and
    last ``}`` (handles stray prose or ```json fences around the object).
    """
    if not content:
        return None
    candidates = [content]
    start, end = content.find("{"), content.rfind("}")
    if 0 <= start < end:
        candidates.append(content[start : end + 1])
    for candidate in candidates:
        try:
            obj = json.loads(candidate)
        except (ValueError, TypeError):
            continue
        if isinstance(obj, dict):
            return obj
    return None
