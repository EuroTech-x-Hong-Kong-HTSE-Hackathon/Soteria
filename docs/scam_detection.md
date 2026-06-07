# Scam-call detection — work plan

> **Stretch goal.** The fall-detection hero flow comes first. This work is
> independent of perception, so it can land in parallel without blocking it.

## What we want

A local pipeline that takes a recorded phone-call audio sample and decides
whether it sounds like a scam, with a short rationale. Fully on-device:
**faster-whisper** for transcription + the same local LLM (Ollama) the agent
already uses for classification. Only the final alert (text only) leaves the
device, on the same `Alerter` interface as everything else.

## Where it plugs into the existing code

| Concern | Existing piece to reuse | File |
|---|---|---|
| Stub class with `transcribe` + `analyze` | `ScamDetector` (replace `NotImplementedError`s) | `backend/app/audio/scam_detector.py` |
| Whisper model name from config | `settings.whisper_model` (default `"base"`) | `backend/app/config.py` |
| Local LLM call | `OllamaChatBackend.chat(messages, tools=[])` | `backend/app/agent/backends.py` |
| Alerting | `get_alerter().send(text)` | `backend/app/alerts/base.py` |
| Dependency | `faster-whisper` (already in `requirements.txt`) | `backend/requirements.txt` |

**Don't add**: a new alerter, a new LLM backend, a new config system. Reuse
what's there — it's the privacy story.

## TODOs

### 1. Transcription — `ScamDetector.transcribe(audio_path) -> str`
- Lazy-load `faster_whisper.WhisperModel(self.whisper_model, device="cpu", compute_type="int8")` on first call; cache on `self._model`.
- Run `segments, info = self._model.transcribe(audio_path)`; join segment texts with spaces.
- Return the full transcript.
- Smoke test: `python -c 'from app.audio.scam_detector import ScamDetector; print(ScamDetector().transcribe("samples/scam_sample.wav"))'`

### 2. LLM classification — `ScamDetector.analyze(audio_path) -> ScamResult`
- Call `self.transcribe(audio_path)`.
- Build a prompt that asks the LLM to flag scam-call patterns (urgency, authority impersonation — "IRS", "police", "bank", payment in gift cards / crypto / wire, threats, requests for OTP / passwords, refusal to allow verification). The agent's existing `prompts.py` is a good style reference.
- Send via `OllamaChatBackend(settings.ollama_model, settings.ollama_host).chat(messages, [])`.
- Force a structured response (ask the LLM for JSON: `{"is_scam": bool, "confidence": float, "rationale": str}`); parse with `json.loads`. If parsing fails, default to `is_scam=False` with the raw text in `rationale` — don't crash.
- Populate `ScamResult(is_scam, confidence, transcript, rationale)`.

### 3. Demo entry point — `scripts/scam_demo.py` *(new)*
- Mirror `scripts/run_pipeline.py`'s shape (sys.path shim into `backend/`).
- CLI: `python scripts/scam_demo.py <path_to_audio.wav>`.
- Print the `ScamResult` and, if `is_scam` and confidence above a threshold, call `get_alerter().send(...)` with a short text alert (e.g. `"📞 Soteria: likely scam call detected — ..."`). Stay text-only — never include the transcript in the alert.

### 4. Sample audio
- Drop one or two `.wav` samples in `samples/` (gitignore them if they're large or sensitive — check first). Whisper handles 16kHz mono best; resample with `ffmpeg -i in.mp3 -ar 16000 -ac 1 out.wav` if needed.

### 5. Test — `backend/tests/test_scam_detector.py` *(new)*
- One unit test, no real model:
  - Patch `WhisperModel` to return a canned segment list with a transcript like `"This is the IRS, you owe taxes, send 500 in gift cards now"`.
  - Patch the Ollama backend to return a JSON `{"is_scam": true, "confidence": 0.9, "rationale": "..."}`.
  - Assert `analyze(...)` returns the right `ScamResult`.
- One unit test for the parsing fallback (LLM returns prose, not JSON) → defaults to `is_scam=False` with raw text in rationale.
- Run with the inline runner pattern in `backend/tests/test_agent.py`.

### 6. Config / env *(only if needed)*
- A scam-confidence threshold (e.g. `scam_confidence_threshold: float = 0.7`) if `analyze` should also short-circuit alerting. Add to `.env.example` if added.

## Out of scope (don't do this yet)

- **Live mic capture / call interception.** File-based input only for the MVP — a clear demo asset beats a half-working live integration.
- **Speaker diarization.** Single-stream transcript is enough for the prompt.
- **Sending audio anywhere.** Faster-whisper runs entirely on-device. Never POST a recording to a third-party service.
- **A web UI for this.** Surface it as a CLI demo first; UI later if there's time.

## Privacy guardrails (same as the rest of the app)

- No third-party AI on the sensitive path. faster-whisper runs locally; LLM
  calls go through the existing self-hosted Ollama. The Claude API fallback
  (per `CLAUDE.md`) is **demo-only** reliability insurance, not a production
  path.
- Only outbound text alerts cross the network — never the transcript or the
  audio itself.
- **Never auto-call emergency services.** Same rule as fall escalation.

## Hand-off

The stub at `backend/app/audio/scam_detector.py` is the entry point. Read
`CLAUDE.md` for the privacy guardrails and `docs/development_setup.md` for the
env / venv conventions. Ping for review before merging — this is a new
network-egress vector (the alert) and a new model dependency, so we want a
quick second look.
