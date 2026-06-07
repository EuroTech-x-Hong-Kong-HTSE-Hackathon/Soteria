# Soteria — what's left

Status snapshot before the demo. Each item links to where work happens.

## 🟡 Verify the end-to-end flow

Walk a real fall through: webcam → fall detector → `EventLog` → agent
verification timer → escalation. Confirm both branches:

- **Genuine fall** (stay down through the timer) → Telegram alert lands.
- **False alarm** (recover during the timer) → no alert; agent dismisses
  with a recovery summary.

Make sure Ollama is up first (`ollama list` shows `llama3.2`). Run
`python scripts/run_pipeline.py` and watch the console for `candidate` →
`agent_started` → `agent_action` → `alert` / `dismissed` events. If the
agent does anything weird, capture the transcript from the console.

## 🟡 Mobile B2C front-end

The trusted-contact-facing app. Doesn't exist yet — `frontend/b2b-frontend/`
is the *operator* side. Scope for the demo:

- A single screen that subscribes to backend events (see below).
- Live status: "monitored", "verifying — Xs left", "alert sent".
- Minimal styling; the demo video will be the showcase.

Decide stack first (React Native / Expo? PWA? Plain mobile-styled
React + Vite?). Whatever ships fastest given the time left.

## 🟡 Wire the B2C front-end as a pipeline subscriber

Backend already supports it — `Pipeline.subscribe()` returns an
`AsyncIterator[Event]` keyed off an `asyncio.Queue` per subscriber. The
WebSocket handler at `backend/app/main.py` `/events` is still a hello+echo
stub; replace it with:

```python
async for event in pipeline.subscribe():
    await ws.send_json({"type": event.type, "payload": event.payload})
```

…and forward the same JSON to the B2C client. That's the only seam.

## 🟢 Whisper / scam-call detection

**Owner: Apple.** Hand-off lives in `docs/scam_detection.md`. Six scoped
TODOs there; reach out if blocked.

## 🟢 B2B operator front-end

**Stays mocked.** Not in the demo video — too complex to walk through
inside the time budget. Leave hard-coded data in
`frontend/b2b-frontend/`. We'll wire it to the backend post-demo if time.

---

## Pointers

- Architecture + guardrails: [`CLAUDE.md`](./CLAUDE.md)
- Bench-test recipes (Telegram, perception): [`docs/development_setup.md`](./docs/development_setup.md)
- Scam-call hand-off: [`docs/scam_detection.md`](./docs/scam_detection.md)
- B2B front-end run instructions: [`frontend/b2b-frontend/README.md`](./frontend/b2b-frontend/README.md)
