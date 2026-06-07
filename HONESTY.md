# HONESTY.md

> Mandatory disclosure for the hackathon. Disclosed shortcuts cost nothing;
> hidden ones are penalized. This file is written from the **executed code
> path**, not from `README.md` claims, planning docs, or commit messages —
> every entry below is verifiable against `file:line`.

---

## 0. Project origin declaration

This project was conceived entirely during the hackathon. Prior to the event, team members had not planned, designed, prototyped, or developed this idea in any form.

**What existed before the hackathon.** Nothing related to this project existed before the hackathon. There were no prior codebases, prototypes, designs, business plans, research projects, or implementations associated with this idea.

**What was built during the hackathon.** All brainstorming, planning, design decisions, development work, documentation, and project materials were created during the hackathon period.

**Pre-existing assets, libraries, or components.** No custom pre-existing assets, proprietary components, or previously developed project code were brought into the hackathon. The project uses standard publicly available tools, frameworks, libraries, or services commonly used for software development, but no project-specific work was prepared in advance.

**Functional status.** All work associated with this project was created during the hackathon.

**Mocked, simulated, or unfinished components.** There were no pre-built mocked or simulated components brought into the event. Any incomplete functionality reflects work that remained unfinished during the hackathon itself; §3 below is the full disclosure of which parts that affects.

**Declaration.** We affirm that this project idea originated during the hackathon and was not pre-planned, pre-developed, or prepared beforehand. To the best of our knowledge, all project-specific work was initiated and carried out during the official hackathon period.

---


## 1. Team — who did what

`git shortlog -sn` snapshot at write time:

| Member | GitHub handle | Email | Commits | Main contributions |
|---|---|---|---|---|
| Declan Kene Chukwu | (declan-chukwu / repo owner) | declan.chukwu@ucdconnect.ie | 32 | Project scaffold, alerts (Telegram backend + snapshot path), perception pipeline orchestration (`pipeline.py` candidate queue + agent worker + recovery debounce + display loop), config + .env handling, walking skeleton, run_pipeline entry, fall-box detector (HF), CLAUDE.md / README / docs. Authored the **B2C** front-end via Lovable.dev (committed locally as `af02bf0 b2c frontend imported`). |
| Abdul (`Asav23`) | Asav23 | wma.adesanya@gmail.com | 5 | Local LLM agent loop (Ollama tool-calling, `agent/agent.py` + `agent/backends.py` + `agent/tools.py`), event-log primitive, scam-call detector (`audio/scam_detector.py`), pose-based fall detector (`perception/pose_fall_detector.py` — the **default** in production), FastAPI MJPEG `/video` + `/events` WebSocket wiring (`app/main.py`), B2C live-feed page wiring (`routes/family.live.tsx`). |
| Sarthak | (no direct git commits) | — | 0 (via tools, see below) | **Designed both front-ends in Google Stitch** (`frontend/STITCH_PROMPTS.md` is his prompt set). Authored the **B2B** operator dashboard via Lovable.dev; the generated code reached this repo when Declan pulled it down and committed it locally as `678f510 added b2b frontend`. |
| Abdellahi | (no direct git commits) | — | 0 | **Ideation** (helped shape the problem framing and product scope), **business pitch video**, and **technical demo video**. Did not commit code. |

Sarthak does not appear in `git shortlog` because his contributions shipped
through Stitch (design output committed by Declan) and Lovable.dev (project
generated under his account, then pulled into this repo). Abdellahi's
contributions are off-repo (video + ideation), so he also doesn't appear in
the commit log. We're disclosing both explicitly so the contributor list
reflects the real team, not just who pushed.

---

## 2. What is fully working

End-to-end on real input, with real logic, no canned data.

- **Live fall detection** — Ultralytics YOLO11-pose runs on every webcam frame
  in `PoseFallDetector.detect()` (`backend/app/perception/pose_fall_detector.py:64`),
  computes a real posture score from real keypoint coordinates
  (`_score_person`, line 100), and produces a real per-frame confidence. Default
  detector enabled via `ENABLED_DETECTORS=["fall"]`
  (`backend/app/config.py:47`) → resolved to `PoseFallDetector` in
  `backend/app/perception/registry.py:21`.
- **Persistence + recovery debounce** — `Pipeline._capture_loop`
  (`backend/app/pipeline.py:152`) tracks per-detector candidate state with real
  `time.time()` timestamps. A real candidate must persist above-threshold for
  `PIPELINE_MIN_CONFIRM_SECONDS` (default 1.0s) to trigger; a real recovery
  must persist sub-threshold for `PIPELINE_RECOVERY_SECONDS` (default 1.5s)
  to fire.
- **Verification timer** — `AgentTools.start_verification_timer`
  (`backend/app/agent/tools.py:68`) does `await self._sleep(secs)` (real
  `asyncio.sleep` by default) then inspects the shared `EventLog` for actual
  `RECOVERY` / `MOTION` events recorded by the pipeline during the wait. Not
  hardcoded.
- **Local LLM agent** — `VerificationAgent.run`
  (`backend/app/agent/agent.py:97`) drives a real tool-calling loop against
  `OllamaChatBackend` (`backend/app/agent/backends.py:72`). The Ollama HTTP
  call is at line 91 (`client.chat(model=..., messages=..., tools=...)`). The
  default model is `llama3.2` (qwen3 / qwen2.5 ≥ 3B also tested).
- **Telegram alert delivery** — `TelegramAlerter.send`
  (`backend/app/alerts/telegram.py:32`) is a real HTTPS POST to
  `https://api.telegram.org/bot<TOKEN>/sendMessage` with the bot token + chat
  ID from `.env`. Verified live multiple times during testing.
- **Optional snapshot attachment** — when `SEND_SNAPSHOT_ON_ALERT=true` and
  the pipeline has wired `_get_snapshot_bytes` (`pipeline.py:84`), the
  alerter routes through `/sendPhoto` with a real cv2-JPEG-encoded frame
  taken at the moment of escalation.
- **MJPEG live feed for the dashboard** — `_mjpeg_stream` in
  `backend/app/main.py:113` reads real frames from `pipeline.snapshot()`,
  annotates them with real per-detector confidence + pose-keypoint dots
  (`_annotate`, line 82), and serves a real `multipart/x-mixed-replace`
  response. The `<img src>` in `family.live.tsx:53` consumes it.
- **WebSocket event stream** — `/events` (`app/main.py:139`) really fans
  pipeline `Event`s to subscribers via per-subscriber asyncio queues
  (`Pipeline.subscribe`, `pipeline.py:69`). The endpoint works; **see §3 for
  the catch.**
- **Scam-call detector (CLI only)** — `ScamDetector.analyze`
  (`backend/app/audio/scam_detector.py:107`) runs real `faster-whisper`
  transcription (line 96, `model.transcribe(audio_path)`) and a real Ollama
  classification call (line 115, `backend.chat(messages, [])`). Reachable
  only from `scripts/scam_demo.py`. **Not wired into the dashboard** — see §3.
- **Walking skeleton smoke test** — `scripts/walking_skeleton.py` opens a
  real cv2 webcam, sends a real Telegram message on `f` keypress.
- **Test suite** — 9 unit tests cover the agent's tool-dispatch loop, the
  verification timer's recovery check, and the escalation path
  (`backend/tests/test_agent.py`). Tests inject deterministic chat responses
  so the suite stays hermetic — the **production path against Ollama is the
  same code, just with a real backend**.

---

## 3. What is mocked, stubbed, or hardcoded

| What is faked | Where (file:line) | Why we mocked it | What the real version would do |
|---|---|---|---|
| **B2C dashboard alert page** — countdown timer, agent reasoning quote, "privacy view" image, all action buttons (Call Margaret / I'm aware / Forward to Tom / Mark false alarm) | `frontend/b2c-frontend/src/routes/family.alert.tsx` (entire file) | Page came pre-designed from Lovable; we ran out of time to wire it to the backend | Subscribe to `/events` WebSocket, render real countdown driven by the agent's `start_verification_timer`, show the real agent summary and (opt-in) the real snapshot image. Buttons would post back to a `/dismiss` or `/escalate-now` endpoint |
| **B2C "All quiet" home page** — "Last activity 3 minutes ago", Care Circle avatars (Tom / Margaret / Dr. P), "Margaret is moving normally around the lounge" status, "Say hi" send button | `frontend/b2c-frontend/src/routes/family.index.tsx:52, 67, 76-80, 99-101` | Home page is the marketing/calm-state surface; we kept it static for the demo | Pull live status from the pipeline's `/events` stream and a real care-circle backend |
| **B2C resident pages** — countdown timer, "I'm OK" buttons, weather/schedule, support tiles | `frontend/b2c-frontend/src/routes/resident.*.tsx` | Same — pre-designed pages, no time to wire | Push notifications + WebSocket subscription, real check-in roundtrip |
| **B2B operator dashboard** — every metric, alert, camera tile, cluster | `frontend/b2b-frontend/` (entire app) | Declared out of scope for the demo in `TODO.md`; the resident-side B2C is the demo target | Multi-tenant backend with cluster registration, fleet status, alert history |
| **The "trusted contact"** | `.env` `TELEGRAM_CHAT_ID` | The "trusted contact" in the demo is the developer's own Telegram chat ID. Onboarding flow (BotFather link → contact taps Start → backend captures their chat ID) is not built | Real onboarding to bind a contact to a resident |
| **`/events` WebSocket has no consumer** | Backend at `app/main.py:139` works; **no frontend code subscribes** (verified: `grep -rn "WebSocket\|/events" frontend/b2c-frontend/src` returns nothing) | We built the seam, demo skipped wiring it up | B2C alert page would consume events to drive the countdown / agent reasoning live |
| **The agent's user prompt** drops the candidate dict into a string template via Python `f"{detection}"` | `backend/app/agent/prompts.py:38` (TODO marker on line 38) | Good enough for the demo; no structured fields to the LLM | Build a structured prompt with confidence, timestamps, keypoint summary |
| **`get_alerter()` factory** — only "telegram" branch implemented | `backend/app/alerts/base.py:37, 44` (TODO markers) | Twilio is roadmap; we only need Telegram for the demo | Implement `TwilioAlerter` behind the same interface |
| **HF "fall_box" detector** | `backend/app/perception/fall_detector.py` (whole file) | Wired into the registry as `"fall_box"` for fallback but **`ENABLED_DETECTORS=["fall"]` does NOT include it** — pose detector is the default | Either keep both running for ensemble or drop the box one entirely |
| **Scam detector not in main flow** | `backend/app/audio/scam_detector.py` is real but only reached from `scripts/scam_demo.py`. Not surfaced anywhere in the B2C dashboard, not part of `pipeline.run()` | Scoped as a stretch; UI integration handed off (see `docs/scam_detection.md`) but UI was not built | Wire scam detector into a separate audio pipeline; render results on a dashboard surface |
| **Voice-clone / audio-deepfake detection** | Not in the codebase at all | Was floated in planning, never implemented | Add a separate model + classification step |
| **Intrusion / inactivity / activity-baseline** | Not in the codebase. The detector ABC supports it (`enabled_detectors` is a list) but no `IntruderDetector` / `InactivityDetector` exists | Scoped down to fall + scam for the demo | Add new `Detector` subclasses, register, enable in `.env` |

---

## 4. External APIs, services & data sources

| Service / model | Used for | Real call? | Auth | Notes |
|---|---|---|---|---|
| **Ollama** (local HTTP, default `http://localhost:11434`) | Agent verification reasoning + scam classification | **Real** | None (loopback) | `OllamaChatBackend` (`agent/backends.py:72`), default model `llama3.2`. Tested with `qwen3` family too. |
| **Telegram Bot API** (`api.telegram.org`) | Alert delivery (`/sendMessage` + `/sendPhoto`) | **Real** | Bot token from `.env`, real chat ID | The single permitted egress on the privacy path. |
| **Hugging Face Hub** (`huggingface.co`) | One-time download of `melihuzunoglu/human-fall-detection` weights for the legacy `fall_box` detector | Real but **not on the demo path** (default detector is pose, weights from Ultralytics releases) | Anonymous (HF "unauthenticated request" warning logged) | Code in `perception/fall_detector.py` imports `huggingface_hub`. Only triggered if `enabled_detectors` includes `"fall_box"`. |
| **Ultralytics YOLO** (auto-downloads weights from `github.com/ultralytics/assets`) | Pose model `yolo11n-pose.pt` | **Real** | None | License: **AGPL-3.0** — a strict copyleft. Material to disclose. |
| **faster-whisper** (downloads from HF / CT2 backend) | Scam-call transcription via `WhisperModel(self.whisper_model, device="cpu", compute_type="int8")` | **Real** but only via `scripts/scam_demo.py` | None | License: MIT (the lib); models inherit OpenAI Whisper licenses. |
| **Anthropic / Claude API** | Documented "demo-only fallback" | **Wired but unreachable** — `anthropic` not in `requirements.txt`; `ClaudeChatBackend` would `ImportError` if `_client_or_load` ran | API key env var declared but not used | Honest: the privacy story does not depend on this and the demo never touches it. |
| **OpenAI / other AI providers** | None | Not used | — | Codebase has zero references to OpenAI APIs. |
| **Database** | None | The `EventLog` (`backend/app/event_log.py`) is an **in-memory ring buffer** (a `collections.deque`, max 200 entries). No persistence across restarts | — | Honest: there is no DB. |
| **Lovable.dev** | UI generation tool used to scaffold the B2B and B2C frontends | Generated code, no live API call | — | See §5. |
| **Stitch (Google)** | Design-time prompt tool used during the hack window | Used to author `frontend/STITCH_PROMPTS.md` and inform the Lovable prompts | — | See §5. |

---

## 5. Pre-existing code

First commit timestamp: **2026-06-06 20:56:47 +0200** — the start of our hack window. Every commit after that is within the window.

| Item | Source | Roughly how much | License |
|---|---|---|---|
| **B2B operator dashboard scaffold** | Authored by **Sarthak** in **Lovable.dev** during the hack window; pulled into this repo by Declan as commit `678f510 added b2b frontend` (2026-06-07 03:08, ~30k+ lines including `bun.lock` + shadcn/ui components). `.lovable/project.json` and `lovable-error-reporting.ts` are tells | Most of `frontend/b2b-frontend/` is Lovable-generated; we did not modify the route logic — it stays mocked by design (see §3) | Generated for our project; Lovable terms apply; shadcn/ui components are MIT |
| **B2C resident/family dashboard** | Authored by **Declan** in **Lovable.dev** from Stitch designs by **Sarthak**; bulk-imported in commit `af02bf0 b2c frontend imported` (2026-06-07 04:47, 14 files). Only `family.live.tsx` was hand-edited (by Abdul) to wire the real MJPEG feed | All `frontend/b2c-frontend/src/routes/*.tsx` started as generated code; only `family.live.tsx` has live backend wiring | Same as above |
| **Stitch design prompts** | Authored by **Sarthak** in Google Stitch; committed as `frontend/STITCH_PROMPTS.md` (513 lines, commit `e334929 Added prompts for frontend`) — these prompts produced the dashboard mockups that fed into Lovable | Working artifact, not runtime code | n/a |
| **Ultralytics YOLO11 pose weights** | Auto-downloaded from `github.com/ultralytics/assets/releases` on first run | 6 MB `.pt` file (gitignored) | **AGPL-3.0** (Ultralytics) — copyleft. We use Ultralytics through its Python API; this should be disclosed if any commercial deployment plan is presented. |
| **HF model `melihuzunoglu/human-fall-detection`** | Downloaded by `huggingface_hub.hf_hub_download` for the `fall_box` legacy detector path (not enabled by default) | Single `.pt` file from HF | License: per HF model card — we did not verify; **flag for the judges**. |
| **Stub scaffold** | `cf186e3 Scaffold implementation` (24 files, 1044 lines) was Claude-Code-assisted scaffolding generated in the first hour of the hack window. Every file in that commit raised `NotImplementedError`; the substance of every implementation came in later commits. | The directory shape + dataclass signatures + docstrings | Written during the hack |

**No code from outside the hack window was brought in.** The "imports" above are all dated within `2026-06-06 20:56` → present.

**AI-assisted authorship:** every contributor used AI assistance (Claude Code for the Python backend; Lovable + Stitch for the frontends). All output was reviewed and edited by the human contributors. We treat this as authoring within the hack window, not pre-existing code, but disclose it for completeness.

---

## 6. Known limitations & next steps

- **The B2C dashboard, except the live feed, is a static mockup.** A judge clicking around will see hardcoded text and dead buttons. This is the single biggest gap between the README's pitch and the executed code path.
- **No persistence.** A restart wipes the event log; "alert history" doesn't exist.
- **No multi-resident / multi-camera support.** `Camera()` opens index 0; one pipeline = one webcam. The detector ABC supports adding detectors but not adding cameras.
- **Onboarding for the trusted contact is unbuilt.** The chat ID lives in `.env`; in production this would need a "scan QR → tap Start in Telegram → backend captures your chat ID" flow.
- **Rate limiting / dedup on alerts.** The single-flight queue keeps one agent run at a time, but two distinct fall events back-to-back will both alert. No cooldown.
- **Privacy claim caveat:** the on-device claim is true for the **default** path. If `SEND_SNAPSHOT_ON_ALERT=true`, the JPEG of the moment of escalation goes through Telegram's servers. We document this as the one explicit exception.
- **No automatic 911 / 112.** By design — escalation goes only to the trusted contact. Any emergency-services call is a human decision.
- **AGPL-3.0 implications.** Ultralytics is AGPL — any production deployment using their `ultralytics` package needs to either ship source under AGPL or buy a commercial license. Not a hackathon problem; flagging for completeness.

---

## Discrepancies & risks (read this first)

Things a judge could legitimately flag if we didn't disclose them. We're surfacing them up front.

1. **The B2C alert page in the demo video shows a fall, a countdown, and an agent quote — but those are all client-side useState values, not the real pipeline.** The hardcoded agent quote `"I saw Margaret go to the floor in the lounge and she has not moved."` is in `frontend/b2c-frontend/src/routes/family.alert.tsx:127`. The countdown is `useState(14)` (line 20) — local React state, no backend hookup. The "privacy view" image is a Google Cloud `lh3.googleusercontent.com` URL, not the real snapshot. **The actual confirmed-fall escalation is real and lands on the trusted contact's phone via Telegram — that part of the demo is genuine.** The alert *page* is decoration.
2. **The dashboard's "Live" feed is real; the dashboard's "Home" status is not.** "All quiet" + "Last activity 3 minutes ago" don't reflect anything; they're string literals.
3. **The B2B operator dashboard is fully mocked** but is openly declared as such in `TODO.md`. The demo video does not feature it.
4. **AI-assisted code generation was used for the frontends** (Lovable.dev) and for parts of the backend scaffold (Claude Code). All within the hack window. No pre-existing project code was brought in.
5. **The Claude API fallback** referenced in `CLAUDE.md` and the agent's `backends.py` is **dead code on the demo path** — `anthropic` isn't installed and the default agent path is 100% local Ollama. The privacy claim ("no third-party AI provider on the sensitive data path") holds.
6. **The scam-call detector works as a CLI** (`scripts/scam_demo.py`) but is **not surfaced in the dashboard** — if the demo video implies otherwise, that's the gap.
7. **The "trusted contact" in the demo is the developer's own Telegram account.** No multi-user binding exists.

If the demo video shows any of #1, #2, or #6 in a way that implies live pipeline data, this disclosure is the difference between honest framing and a faked demo.
