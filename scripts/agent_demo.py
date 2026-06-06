#!/usr/bin/env python3
"""Watch the Soteria verification agent reason about a fall — end to end.

Two modes:

  (default, offline)  Uses a SCRIPTED fake LLM + a fake alerter. Needs no Ollama,
                      no webcam, no Telegram secrets. Great for showing the agent
                      logic + dashboard event stream anywhere.

      python scripts/agent_demo.py

  (--live)            Uses the real local Ollama model + the configured alerter.
                      Requires Ollama running with the model pulled, and (if you
                      let it escalate) Telegram secrets in .env.

      python scripts/agent_demo.py --live

It runs two scenarios — a genuine fall (escalates) and a false alarm (recovers) —
and prints every event the agent emits, exactly as the dashboard would receive it.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

# Allow importing the app package when run as a script from the project root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

# Windows consoles default to cp1252 and can't print emoji/arrows; force UTF-8.
try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
except Exception:  # pragma: no cover - best effort
    pass

from app.agent.agent import VerificationAgent  # noqa: E402
from app.agent.backends import ChatResponse, ScriptedChatBackend, ToolCall  # noqa: E402
from app.agent.tools import AgentTools  # noqa: E402
from app.alerts.base import AlertResult  # noqa: E402
from app.event_log import FALL_CANDIDATE, RECOVERY, EventLog  # noqa: E402


class PrintingAlerter:
    """Fake alerter for the offline demo — prints instead of hitting Telegram."""

    def send(self, message: str) -> AlertResult:
        print(f"      📲  [Telegram → trusted contact]  {message}")
        return AlertResult(ok=True, detail="demo")


# Pretty labels for the event types the agent emits.
_LABELS = {
    "agent_started": "▶️  AGENT WOKEN",
    "agent_reasoning": "🧠 REASONING",
    "agent_action": "🔧 TOOL CALL",
    "tool_result": "📥 TOOL RESULT",
    "agent_done": "✅ DECISION",
}


def make_printer():
    """Build an on_event callback that prints the dashboard event stream."""

    def on_event(event_type: str, payload: dict) -> None:
        label = _LABELS.get(event_type, event_type)
        if event_type == "agent_reasoning":
            print(f"   {label}: {payload['text']}")
        elif event_type == "agent_action":
            print(f"   {label}: {payload['tool']}({payload.get('arguments', {})})")
        elif event_type == "tool_result":
            print(f"   {label}: {payload['tool']} -> {payload['result']}")
        elif event_type == "agent_done":
            verdict = "ESCALATED 🚨" if payload["escalated"] else "no alert (stood down)"
            print(f"   {label}: {verdict}")
            print(f"            summary: {payload['summary']}")
        elif event_type == "agent_started":
            print(f"   {label}: detection={payload['detection']}")

    return on_event


async def _noop_sleep(_seconds: float) -> None:
    """Skip the real countdown so the demo runs instantly (offline mode)."""
    return None


def build_offline_genuine_fall() -> VerificationAgent:
    """Scenario A: a real fall — timer elapses with no recovery -> escalate."""
    log = EventLog()
    log.record(FALL_CANDIDATE, is_fall=True, confidence=0.86, note="collapsed near kitchen")
    tools = AgentTools(event_log=log, alerter=PrintingAlerter(), sleep=_noop_sleep)
    script = [
        ChatResponse(
            content="A fall was flagged with high confidence. I'll start a verification "
            "timer and watch whether they get back up before alerting anyone.",
            tool_calls=[ToolCall("start_verification_timer", {"seconds": 20})],
        ),
        ChatResponse(
            content="The grace period elapsed with no movement — they're still down. "
            "This is a real fall. Escalating to the trusted contact.",
            tool_calls=[
                ToolCall("escalate", {"reason": "No recovery after 20s grace period", "severity": "high"})
            ],
        ),
        ChatResponse(
            content="Alert delivered to the trusted contact. Confirmed fall handled."
        ),
    ]
    return VerificationAgent(
        backend=ScriptedChatBackend(script), tools=tools, event_log=log, on_event=make_printer()
    )


def build_offline_false_alarm() -> VerificationAgent:
    """Scenario B: a stumble — person recovers during the timer -> no alert."""
    log = EventLog()
    log.record(FALL_CANDIDATE, is_fall=True, confidence=0.64, note="dropped to floor")

    async def sleep_then_recover(_seconds: float) -> None:
        # Simulate perception spotting the person getting back up mid-countdown.
        log.record(RECOVERY, is_fall=False, note="stood back up and walked off")

    tools = AgentTools(event_log=log, alerter=PrintingAlerter(), sleep=sleep_then_recover)
    script = [
        ChatResponse(
            content="Possible fall, moderate confidence. Before alarming anyone I'll "
            "start the grace period and watch for recovery.",
            tool_calls=[ToolCall("start_verification_timer", {"seconds": 20})],
        ),
        ChatResponse(
            content="Recent events show the person got back up during the grace period. "
            "This was a false alarm — I will NOT disturb the trusted contact."
        ),
    ]
    return VerificationAgent(
        backend=ScriptedChatBackend(script), tools=tools, event_log=log, on_event=make_printer()
    )


def build_live_agent(detection_note: str, confidence: float) -> VerificationAgent:
    """Real local LLM (Ollama) + configured alerter. Requires Ollama running."""
    from app.event_log import EventLog as _EventLog

    log = _EventLog()
    log.record(FALL_CANDIDATE, is_fall=True, confidence=confidence, note=detection_note)
    # alerter=None -> built from settings on escalation (needs Telegram secrets).
    tools = AgentTools(event_log=log)
    return VerificationAgent(tools=tools, event_log=log, on_event=make_printer())


async def run_scenario(title: str, agent: VerificationAgent, detection: dict) -> None:
    print("\n" + "=" * 70)
    print(f"SCENARIO: {title}")
    print("=" * 70)
    result = await agent.run(detection)
    print(
        f"\n   → confirmed={result.confirmed}  escalated={result.escalated}  "
        f"({len(result.transcript)} messages exchanged)"
    )


async def main_async(live: bool) -> None:
    if live:
        print("LIVE mode: using local Ollama + configured alerter.\n")
        await run_scenario(
            "Genuine fall (live LLM)",
            build_live_agent("collapsed near kitchen", 0.86),
            {"is_fall": True, "confidence": 0.86, "note": "collapsed near kitchen"},
        )
        return

    print("OFFLINE demo: scripted LLM + fake alerter (no Ollama / Telegram needed).")
    await run_scenario(
        "Genuine fall → should ESCALATE",
        build_offline_genuine_fall(),
        {"is_fall": True, "confidence": 0.86, "note": "collapsed near kitchen"},
    )
    await run_scenario(
        "False alarm (recovers) → should STAY QUIET",
        build_offline_false_alarm(),
        {"is_fall": True, "confidence": 0.64, "note": "dropped to floor"},
    )
    print("\nDone. This is exactly the event stream the dashboard renders live.\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Soteria verification-agent demo.")
    parser.add_argument(
        "--live", action="store_true", help="Use the real local Ollama model + configured alerter."
    )
    args = parser.parse_args()
    asyncio.run(main_async(args.live))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
