# Soteria

Privacy-preserving home-safety intelligence for elderly people living alone.
A fall is detected on-device, an agent verifies it locally, and only a minimal
text alert leaves the device — straight to a trusted contact.

> **Hero flow:** webcam → local fall detection (YOLO pose) → local LLM agent
> (Ollama) confirms with a verification timer (watching for recovery) → Telegram
> alert to a trusted contact. Everything on the sensitive data path stays local.

See **[CLAUDE.md](./CLAUDE.md)** for architecture, the agent's tools, setup &
run commands, conventions, and the definition of done.

## Quick start
```bash
python3 -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env          # add TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
ollama pull llama3.2
python scripts/walking_skeleton.py   # webcam → press 'f' to fake a fall → Telegram
```

## Status
🚧 Hackathon MVP scaffold — modules are stubs with signatures, docstrings, and
TODO markers. Build the walking skeleton first, then deepen each stage.

## Privacy
No third-party cloud touches video or audio. The only network
egress is the outbound, text-only alert channel (Telegram / optional Twilio).
Soteria **never** auto-contacts emergency services — it escalates to a
pre-approved trusted contact, keeping a human in the loop.
