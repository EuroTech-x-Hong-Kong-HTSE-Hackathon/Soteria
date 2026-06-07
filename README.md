# Soteria

**Privacy-preserving home-safety intelligence for elderly people living alone.**

Soteria watches a webcam on the resident's own device, detects falls locally,
asks a local LLM agent to confirm before disturbing anyone, and — only on
confirmation — sends a minimal text alert to a pre-approved trusted contact.
No frame, no audio, no transcript ever leaves the home.

> **Hero flow:** webcam → on-device fall detection (YOLOv11 pose) → local LLM
> agent (Ollama) runs a verification timer and watches for recovery → Telegram
> alert to a trusted contact. Everything on the sensitive data path stays on
> the device.

---

## Privacy claim

This is the thing that makes Soteria different from a regular monitoring
camera, so we're loud about it:

- **No third-party AI provider** sees video, audio, or transcripts. Perception
  (YOLOv11), the agent (Ollama, llama3 family), and audio (faster-whisper)
  all run on our own open-source models on infrastructure we control.
- **Only outbound text alerts** cross the network. The Telegram bot is the
  single permitted egress.
- **Operator-opt-in exception:** `SEND_SNAPSHOT_ON_ALERT=true` attaches the
  frame at the moment of confirmed escalation as a JPEG. Off by default;
  documented as the one explicit departure from text-only egress.
- **No automatic 911 / 112.** Soteria escalates to a pre-approved trusted
  contact only — a human stays in the loop for any emergency-services call.

## Architecture

```
perception ──▶ agent ──▶ verify ──▶ alert      (all local except the final alert)
   │             │          │           │
 webcam     local LLM    grace      Telegram
 + YOLO     (Ollama)     timer      (text only)
 pose       + tools                 to trusted contact
```

Detector outputs queue into the agent one at a time; the agent runs a
verification timer that watches for recovery before deciding whether to
escalate. The full design rationale lives in [`CLAUDE.md`](./CLAUDE.md).

## Repo map

```
soteria/
├── backend/                       # Python 3.11+, FastAPI, asyncio
│   ├── app/
│   │   ├── main.py                # FastAPI: /health, /video MJPEG, /events WebSocket
│   │   ├── pipeline.py            # capture → detectors → candidate queue → agent
│   │   ├── config.py              # pydantic-settings, reads .env at project root
│   │   ├── event_log.py           # in-memory ring buffer of detection events
│   │   ├── perception/            # Detector ABC + YOLOv11 pose / fall-box detectors
│   │   ├── agent/                 # Ollama-backed LLM agent + verification tools
│   │   ├── alerts/                # Alerter interface + Telegram backend
│   │   └── audio/                 # faster-whisper scam-call stretch (stub)
│   ├── tests/                     # pytest-style; runnable inline (see below)
│   └── requirements.txt
├── frontend/
│   ├── b2c-frontend/              # ✨ Mobile dashboard for the trusted contact (demo)
│   └── b2b-frontend/              # Operator dashboard (mocked for demo)
├── scripts/
│   ├── walking_skeleton.py        # webcam → press 'f' → Telegram (pipe-only smoke test)
│   ├── run_pipeline.py            # full hero flow — the demo entry point
│   ├── agent_demo.py              # offline agent scenarios (no camera, no Ollama)
│   ├── scam_demo.py               # whisper transcription demo (stretch)
│   └── pose_debug.py              # quick tool to eyeball pose-keypoint output
├── docs/
│   ├── development_setup.md       # bench-tests for alerts + perception, "adding a new detector"
│   └── scam_detection.md          # whisper hand-off spec
├── samples/                       # audio / video fixtures
├── .env.example                   # config + privacy toggles documented inline
├── CLAUDE.md                      # architecture, agent design, conventions, guardrails
├── TODO.md                        # current punch-list
└── README.md
```

## Quick start

### Prerequisites

- **Python 3.11+** with `pip` and `venv`.
- **Ollama** running locally with a tool-capable model pulled
  (`ollama pull llama3.2` or any qwen3 / qwen2.5 ≥ 3B).
  ```bash
  brew install ollama && ollama serve
  ollama pull llama3.2
  ```
- **Bun** for the front-end dashboards (preferred — `bun.lock` is the
  source of truth):
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- A working webcam and a Telegram bot (see
  [`docs/development_setup.md`](./docs/development_setup.md) for the
  10-minute BotFather → token → chat-ID walkthrough).

### Backend setup (one-time)

```bash
# from the project root
python3 -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env                    # then fill in TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
```

### B2C front-end setup (one-time)

```bash
cd frontend/b2c-frontend
bun install
```

## Run it

### 1. Smoke-test the alert channel (30 seconds)

Confirms your Telegram credentials work before involving the camera or
the agent:

```bash
cd backend
python -c 'from app.alerts.base import get_alerter; print(get_alerter().send("Soteria smoke test"))'
# expect: AlertResult(ok=True, ...) and a buzz on your phone
```

### 2. Run the full hero flow (the demo)

In **three terminals**, all from the project root:

```bash
# Terminal 1 — Ollama
ollama serve

# Terminal 2 — backend (FastAPI + perception pipeline)
source venv/bin/activate
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 3 — B2C dashboard
cd frontend/b2c-frontend && bun run dev
```

Open `http://localhost:5173/family/live` to see the live feed with pose
overlays and the alert log. Fall in front of the camera and stay down —
the trusted contact's phone gets the Telegram alert after the verification
timer elapses.

### 3. Or just the pipeline + perception window (no dashboard)

```bash
source venv/bin/activate
python scripts/run_pipeline.py
```

Same flow, but the live overlay shows in a native cv2 window instead of
the browser dashboard. Press `q` to quit.

### What you'll see in the console

For a confirmed fall:

```
frame N fall: conf=0.93 POSITIVE
worker: picked up candidate {...}
agent: started for {...}
agent: tool start_verification_timer args={}
agent: tool start_verification_timer result={'recovered': False, ...}
agent: tool escalate args={'reason': '...', 'severity': 'high'}
worker: alert — Alert sent to the trusted contact.
```

For a false alarm (you got back up in time): same flow, ending with
`worker: dismissed — ...` and no alert.

## Testing

The agent + tools have an offline test suite that runs without Ollama or a
webcam. From `backend/`:

```bash
python -c "
import importlib, traceback
m = importlib.import_module('tests.test_agent')
fns = [(n, getattr(m, n)) for n in dir(m) if n.startswith('test_')]
fail = 0
for n, f in fns:
    try: f()
    except Exception:
        fail += 1; traceback.print_exc()
print(f'{len(fns)-fail}/{len(fns)} passed')
"
# expect: 9/9 passed
```

(There's no `pytest` in the requirements — the tests are plain assert-style
functions; the inline runner above keeps the dev install lean.)

## Tech stack

| Layer | Tool |
|---|---|
| Perception | OpenCV + Ultralytics YOLOv11 (pose) |
| Agent | Ollama (llama3 / qwen3 family) with tool-calling |
| Backend | FastAPI + asyncio + pydantic-settings |
| Alerts | Telegram Bot API |
| Audio (stretch) | faster-whisper for scam-call detection |
| Front-end | TanStack Start, React 19, Tailwind v4, shadcn/ui |
| Run-time | Python 3.11+, Bun for the front-ends |

## Documentation

| File | Purpose |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Architecture, agent design, privacy guardrails, conventions |
| [`docs/development_setup.md`](./docs/development_setup.md) | Bench-test recipes (Telegram, perception); "adding a new detector" walkthrough |
| [`docs/scam_detection.md`](./docs/scam_detection.md) | Whisper / scam-call hand-off spec |
| [`frontend/b2c-frontend/README.md`](./frontend/b2c-frontend/README.md) | B2C dashboard run instructions |
| [`frontend/b2b-frontend/README.md`](./frontend/b2b-frontend/README.md) | B2B dashboard run instructions |
| [`TODO.md`](./TODO.md) | What's shipped, what's still in flight |

## Status

End-to-end happy path works on real webcam input.
