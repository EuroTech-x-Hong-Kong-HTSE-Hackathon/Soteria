"""Tests for the scam-call detector — no real models required.

Transcription is bypassed by injecting a fake whisper model (an object with a
``transcribe`` method); classification is driven by a ``ScriptedChatBackend``.
So this suite runs offline, instantly, with no faster-whisper and no Ollama.

Run from the backend/ directory:
    python -m pytest tests/test_scam_detector.py -v
"""

from __future__ import annotations

from app.agent.backends import ChatResponse, ScriptedChatBackend
from app.audio.scam_detector import ScamDetector


class _FakeSegment:
    """Mimics a faster-whisper segment (only ``.text`` is used)."""

    def __init__(self, text: str) -> None:
        self.text = text


class _FakeWhisper:
    """Stand-in WhisperModel returning canned segments."""

    def __init__(self, segments: list[_FakeSegment]) -> None:
        self._segments = segments

    def transcribe(self, audio_path: str):  # noqa: ANN201 - mirrors the real API
        return list(self._segments), {"language": "en"}


def _detector_with(segments: list[_FakeSegment], backend) -> ScamDetector:
    detector = ScamDetector(backend=backend)
    detector._model = _FakeWhisper(segments)  # bypass real whisper load
    return detector


def test_transcribe_joins_segments():
    detector = _detector_with(
        [_FakeSegment("This is the IRS,"), _FakeSegment(" you owe taxes.")],
        backend=ScriptedChatBackend([]),
    )
    assert detector.transcribe("x.wav") == "This is the IRS, you owe taxes."


def test_analyze_flags_scam_from_json():
    backend = ScriptedChatBackend(
        [
            ChatResponse(
                content=(
                    '{"is_scam": true, "confidence": 0.9, '
                    '"rationale": "IRS impersonation and gift card demand"}'
                )
            )
        ]
    )
    detector = _detector_with(
        [_FakeSegment("This is the IRS, you owe taxes, send 500 in gift cards now")],
        backend,
    )

    result = detector.analyze("scam.wav")

    assert result.is_scam is True
    assert result.confidence == 0.9
    assert "IRS" in result.transcript
    assert "gift card" in result.rationale.lower()


def test_analyze_parses_json_wrapped_in_prose_or_fences():
    backend = ScriptedChatBackend(
        [
            ChatResponse(
                content=(
                    "Sure, here is my assessment:\n"
                    '```json\n{"is_scam": true, "confidence": 0.75, "rationale": "OTP request"}\n```'
                )
            )
        ]
    )
    detector = _detector_with([_FakeSegment("read me the code we just texted you")], backend)

    result = detector.analyze("scam.wav")

    assert result.is_scam is True
    assert result.confidence == 0.75


def test_analyze_falls_back_when_not_json():
    backend = ScriptedChatBackend(
        [ChatResponse(content="I think this might be suspicious but I'm not certain.")]
    )
    detector = _detector_with([_FakeSegment("hello, this is your bank")], backend)

    result = detector.analyze("call.wav")

    assert result.is_scam is False
    assert result.confidence == 0.0
    assert "suspicious" in result.rationale.lower()
    assert result.transcript == "hello, this is your bank"
