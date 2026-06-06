"""Tests for the verification agent + tools — no model server required.

Every test drives the agent with a ``ScriptedChatBackend`` (a deterministic fake
LLM) and a ``FakeAlerter`` (records sends instead of hitting Telegram). So this
suite runs offline, instantly, with no Ollama, no webcam, and no secrets.

Run from the backend/ directory:
    python -m pytest tests/test_agent.py -v
"""

from __future__ import annotations

import asyncio

from app.agent.agent import VerificationAgent
from app.agent.backends import ChatResponse, ScriptedChatBackend, ToolCall
from app.agent.tools import AgentTools
from app.alerts.base import AlertResult
from app.event_log import FALL_CANDIDATE, RECOVERY, STILL, EventLog


class FakeAlerter:
    """Stand-in Alerter that records messages instead of sending them."""

    def __init__(self, ok: bool = True) -> None:
        self.ok = ok
        self.sent: list[str] = []

    def send(self, message: str) -> AlertResult:
        self.sent.append(message)
        return AlertResult(ok=self.ok, detail="fake", raw=None)


async def _noop_sleep(_seconds: float) -> None:
    """Instant sleep so the verification timer doesn't actually wait."""
    return None


def _build(script, alerter=None, event_log=None, sleep=_noop_sleep, on_event=None):
    """Assemble an agent wired to a scripted backend + fake tools."""
    log = event_log or EventLog()
    tools = AgentTools(event_log=log, alerter=alerter or FakeAlerter(), sleep=sleep)
    agent = VerificationAgent(
        backend=ScriptedChatBackend(script),
        tools=tools,
        event_log=log,
        on_event=on_event,
    )
    return agent, tools, log


# --- tool-level unit tests ----------------------------------------------------


def test_get_recent_events_reads_log():
    log = EventLog()
    log.record(FALL_CANDIDATE, is_fall=True, confidence=0.8)
    log.record(STILL, is_fall=True, note="still down")
    tools = AgentTools(event_log=log, alerter=FakeAlerter())

    events = tools.get_recent_events(limit=10)

    assert len(events) == 2
    assert events[0]["kind"] == FALL_CANDIDATE
    assert events[-1]["note"] == "still down"


def test_timer_detects_recovery_during_wait():
    log = EventLog()

    # Simulate perception recording a recovery *while* the grace period runs.
    async def sleep_then_recover(_seconds):
        log.record(RECOVERY, is_fall=False, note="person got back up")

    tools = AgentTools(event_log=log, alerter=FakeAlerter(), sleep=sleep_then_recover)
    result = asyncio.run(tools.start_verification_timer(seconds=20))

    assert result["recovered"] is True
    assert result["still_down"] is False


def test_timer_reports_still_down_when_no_recovery():
    tools = AgentTools(event_log=EventLog(), alerter=FakeAlerter(), sleep=_noop_sleep)
    result = asyncio.run(tools.start_verification_timer(seconds=20))

    assert result["recovered"] is False
    assert result["still_down"] is True


def test_escalate_sends_alert_and_records_state():
    alerter = FakeAlerter()
    tools = AgentTools(event_log=EventLog(), alerter=alerter)

    out = tools.escalate(reason="No movement after 20s", severity="high")

    assert out["sent"] is True
    assert len(alerter.sent) == 1
    assert "fall confirmed" in alerter.sent[0].lower()
    assert tools.escalated is True


# --- full agent-loop tests ----------------------------------------------------


def test_confirmed_fall_escalates():
    """Timer -> still down -> escalate: alert is sent, result confirmed."""
    alerter = FakeAlerter()
    script = [
        ChatResponse(
            content="A fall was flagged. I'll start a verification timer.",
            tool_calls=[ToolCall("start_verification_timer", {"seconds": 20})],
        ),
        ChatResponse(
            content="No recovery seen — this looks real. Escalating.",
            tool_calls=[ToolCall("escalate", {"reason": "Still down after timer", "severity": "high"})],
        ),
        ChatResponse(content="Alert sent to the trusted contact. Done."),
    ]
    agent, tools, _ = _build(script, alerter=alerter, sleep=_noop_sleep)

    result = asyncio.run(agent.run({"is_fall": True, "confidence": 0.82}))

    assert result.confirmed is True
    assert result.escalated is True
    assert len(alerter.sent) == 1
    assert "trusted contact" in result.summary.lower()


def test_false_alarm_does_not_escalate():
    """Person recovers during the timer; agent dismisses, no alert sent."""
    alerter = FakeAlerter()
    log = EventLog()

    async def sleep_then_recover(_seconds):
        log.record(RECOVERY, is_fall=False, note="stood back up")

    script = [
        ChatResponse(
            content="Possible fall. Starting a grace period to watch for recovery.",
            tool_calls=[ToolCall("start_verification_timer", {"seconds": 20})],
        ),
        ChatResponse(content="The person got back up. False alarm — not alerting anyone."),
    ]
    agent, tools, _ = _build(script, alerter=alerter, event_log=log, sleep=sleep_then_recover)

    result = asyncio.run(agent.run({"is_fall": True, "confidence": 0.7}))

    assert result.confirmed is False
    assert result.escalated is False
    assert alerter.sent == []


def test_agent_can_inspect_events_before_deciding():
    """Agent calls get_recent_events, then dismisses based on context."""
    log = EventLog()
    log.record(FALL_CANDIDATE, is_fall=True, confidence=0.65)
    log.record(RECOVERY, is_fall=False, note="already up")

    script = [
        ChatResponse(
            content="Let me check recent activity first.",
            tool_calls=[ToolCall("get_recent_events", {"limit": 5})],
        ),
        ChatResponse(content="History shows they already recovered. No action needed."),
    ]
    agent, tools, _ = _build(script, event_log=log)

    result = asyncio.run(agent.run({"is_fall": True, "confidence": 0.65}))

    assert result.escalated is False


def test_on_event_streams_reasoning_and_actions():
    """The dashboard hook receives reasoning, actions, tool results, and done."""
    captured: list[tuple[str, dict]] = []

    def on_event(event_type, payload):
        captured.append((event_type, payload))

    script = [
        ChatResponse(
            content="Checking events.",
            tool_calls=[ToolCall("get_recent_events", {})],
        ),
        ChatResponse(content="All clear."),
    ]
    agent, _, _ = _build(script, on_event=on_event)
    asyncio.run(agent.run({"is_fall": True, "confidence": 0.5}))

    types = [t for t, _ in captured]
    assert "agent_started" in types
    assert "agent_reasoning" in types
    assert "agent_action" in types
    assert "tool_result" in types
    assert "agent_done" in types


def test_unknown_tool_is_handled_gracefully():
    """A bogus tool name returns an error to the model instead of crashing."""
    script = [
        ChatResponse(content="Trying something.", tool_calls=[ToolCall("does_not_exist", {})]),
        ChatResponse(content="Recovered and finished."),
    ]
    agent, _, _ = _build(script)

    result = asyncio.run(agent.run({"is_fall": True, "confidence": 0.9}))

    assert result.escalated is False
    assert "finished" in result.summary.lower()


def test_max_steps_prevents_infinite_tool_loops():
    """A model that always calls a tool is stopped by the max-steps cap."""
    loop_forever = [
        ChatResponse(content="again", tool_calls=[ToolCall("get_recent_events", {})])
        for _ in range(50)
    ]
    log = EventLog()
    tools = AgentTools(event_log=log, alerter=FakeAlerter(), sleep=_noop_sleep)
    agent = VerificationAgent(
        backend=ScriptedChatBackend(loop_forever),
        tools=tools,
        event_log=log,
        max_steps=4,
    )

    result = asyncio.run(agent.run({"is_fall": True, "confidence": 0.9}))

    assert result.escalated is False
    assert "max steps" in result.summary.lower()
