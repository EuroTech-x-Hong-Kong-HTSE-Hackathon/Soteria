# Soteria — Privacy-Preserving Home-Safety Intelligence

## Overview
Soteria is a privacy-preserving home-safety intelligence layer for elderly people
living alone. Everything on the sensitive data path — webcam frames, the
reasoning LLM, and speech transcription — runs **locally** on an
edge device (a laptop for the demo) using self-hosted, open-source models. No
third-party cloud touches the sensitive data. Only minimal **text** alerts ever
leave the device.

**HERO FLOW:**
`webcam → local fall detection (YOLO pose) → agentic layer (local LLM via Ollama)
confirms the fall with a verification timer (watching for recovery via recent
detection events) → if confirmed, escalate a Telegram alert to a trusted
contact's phone → all local.`

## Architecture
```
perception ──▶ agent ──▶ verify ──▶ alert      (all local except the final alert)
   │             │          │           │
 webcam     local LLM    grace      Telegram
 + YOLO     (Ollama)     timer      (text only)
 pose       + tools                 to trusted contact
```
- **perception** — OpenCV captures frames; a YOLO-pose model + heuristic flags a
  likely fall (all on-device; weights cached locally).
- **agent** — a local LLM (Ollama, tool-calling) reviews the detection, checks
  recent detection events, runs a verification timer, and decides.
- **verify** — a configurable grace period cuts false positives; the person can
  recover or cancel before anyone is disturbed.
- **alert** — on confirmation, a minimal text alert goes to a pre-approved
  trusted contact via Telegram. This is the only egress.

> **Sensor fusion is a future-roadmap feature, not Phase 1.** The long-term
> vision grounds vision in real sensors (door / radar / pendant) as agent tools
> for fewer false positives. The MVP has no sensor hardware, so it confirms falls
> from vision alone (verification timer + recovery check). See the roadmap in the
> Notion "Final Idea Page".

## Tech stack
- Python 3.11+ backend
- OpenCV (webcam capture)
- Ultralytics YOLO-pose (fall detection)
- Ollama for the local LLM agent with tool-calling
- FastAPI + WebSocket backend streaming events to a dashboard
- Plain HTML/JS dashboard (live feed, events, agent reasoning, countdown, alert log)
- Telegram Bot API for alerts (Twilio optional, same interface)
- faster-whisper for the scam-call stretch goal

### Directory map
```
soteria/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + WebSocket /events
│   │   ├── config.py          # typed settings from .env (pydantic-settings)
│   │   ├── pipeline.py        # orchestrates perception → agent → verify → alert
│   │   ├── perception/        # capture.py (OpenCV), fall_detector.py (YOLO pose)
│   │   ├── agent/             # agent.py (Ollama loop), tools.py, prompts.py
│   │   ├── alerts/            # base.py (interface), telegram.py
│   │   └── audio/             # scam_detector.py (STRETCH, stub)
│   ├── tests/
│   └── requirements.txt
├── frontend/index.html        # minimal dashboard
├── scripts/walking_skeleton.py# webcam → fake fall (keypress) → Telegram
├── .env.example
├── CLAUDE.md
└── README.md
```

## Setup & run
```bash
# 1. From the soteria/ project root: create + activate a venv
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Configure secrets
cp .env.example .env                # then fill in TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID

# 4. Pull the local LLM model (requires Ollama installed + running)
ollama pull llama3.2

# 5. Prove the end-to-end pipe (webcam → fake fall on 'f' → Telegram)
python scripts/walking_skeleton.py

# 6. Run the backend (FastAPI + WebSocket)
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 7. Open the dashboard
open frontend/index.html            # or just double-click it
```

## The agent's 3 tools
- **`get_recent_events()`** — recent detection events for context (prior fall
  candidates, and whether any motion/recovery has been seen since this one).
- **`start_verification_timer()`** — begin a grace period before escalation, so a
  recoverable stumble or a false positive doesn't alarm anyone.
- **`escalate()`** — notify the trusted contact (Telegram). Confirmed falls only.

## Conventions
- Type hints on public functions; small, single-purpose modules.
- **NO cloud calls on the sensitive data path** — perception, agent, and audio
  all run locally. Only the alert channel reaches the network, with text only.
- Secrets live only in `.env` (never committed); read them via `app.config.settings`.
- Keep the `Alerter` interface backend-agnostic (Telegram now, Twilio behind it).

## Guardrails
- **16-hour build.** Prefer stubs + the walking skeleton first; make the pipe work
  end-to-end before deepening any one stage.
- **Local / OSS only** on the sensitive data path. No third-party cloud inference.
- Don't add heavy dependencies without a clear reason.
- **NEVER auto-call emergency services.** Soteria escalates to pre-approved trusted
  contacts only — a human stays in the loop for any 911/112 decision.

## Definition of done
A live (and recorded) demo where: a fall happens → it's detected → the agent
verifies it with a timer (watching for recovery) → a Telegram alert reaches a
trusted contact's phone — with a visible proof that all sensitive processing
stayed local.
