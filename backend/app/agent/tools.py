"""The three tools the Soteria agent can call.

These are plain Python functions plus JSON-schema specs that get passed to
Ollama's tool-calling API. They are the agent's only way to observe the world
and to act.

Tools:
    get_recent_events()          -> recent detection/activity events for context
    start_verification_timer()   -> begin grace period before escalation
    escalate()                   -> notify the trusted contact (Telegram)

NOTE: sensor fusion (door / pendant / radar readings as grounding tools) is a
future-roadmap capability, not part of the Phase 1 MVP. Until then the agent
confirms a fall from vision alone: a verification timer plus recent detection
events (did the person get back up, or are they still down?).
"""

from __future__ import annotations

from typing import Any


def get_recent_events(limit: int = 10) -> list[dict[str, Any]]:
    """Return the most recent perception/activity events for context.

    These come from the vision pipeline — e.g. prior fall candidates, pose
    detections, and whether any motion has been seen since the candidate fall.

    TODO: pull from an in-memory event log maintained by the pipeline.
    """
    raise NotImplementedError


def start_verification_timer(seconds: int | None = None) -> dict[str, Any]:
    """Start the verification grace period before any escalation.

    Args:
        seconds: override for VERIFICATION_TIMER_SECONDS.

    TODO: kick off an async countdown, emit `verification` events to the
    dashboard each tick, and return a handle/id the agent can reference. While
    it runs, the pipeline keeps watching for recovery (the person getting up).
    """
    raise NotImplementedError


def escalate(reason: str, severity: str = "high") -> dict[str, Any]:
    """Escalate a confirmed fall to the trusted contact.

    GUARDRAIL: this notifies a pre-approved trusted contact only — NEVER
    emergency services automatically.

    TODO: build an Alerter from app.config.settings and send the message;
    return delivery status.
    """
    raise NotImplementedError


# --- Tool schemas for Ollama tool-calling -------------------------------------
# TODO: keep these in sync with the function signatures above. Ollama expects
# OpenAI-style function tool specs.
TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_recent_events",
            "description": "Get the most recent detection and activity events for context.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "How many events to return."}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "start_verification_timer",
            "description": "Start a grace period before escalating, to reduce false positives.",
            "parameters": {
                "type": "object",
                "properties": {
                    "seconds": {"type": "integer", "description": "Countdown length in seconds."}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "escalate",
            "description": "Notify the trusted contact about a confirmed fall. Trusted contact ONLY.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {"type": "string", "description": "Why escalation is warranted."},
                    "severity": {"type": "string", "enum": ["low", "medium", "high"]},
                },
                "required": ["reason"],
            },
        },
    },
]

# Name -> callable, used by the agent loop to dispatch tool calls.
TOOL_REGISTRY = {
    "get_recent_events": get_recent_events,
    "start_verification_timer": start_verification_timer,
    "escalate": escalate,
}
