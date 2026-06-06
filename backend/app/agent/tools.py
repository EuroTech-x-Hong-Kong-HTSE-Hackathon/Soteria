"""The two tools the Soteria agent can call.

These are the agent's only way to act on a candidate fall:

    start_verification_timer()   -> begin grace period, then report recovery signs
    escalate()                   -> notify the trusted contact (Telegram)

The agent does *not* fetch detection history — detections are pushed in as the
initial user prompt by the perception pipeline (event-driven), and the timer
inspects the shared ``EventLog`` internally to decide whether the person
recovered during the grace window.

They are bundled in :class:`AgentTools`, which holds the shared state each tool
needs (the event log, the alert channel, the grace-period length). This keeps
the tools fully testable: a test can inject a fake event log + fake alerter and
drive them with no camera, no Ollama, and no real Telegram call.

``TOOL_SCHEMAS`` are the OpenAI/Ollama-style specs passed to the model; they must
stay in sync with the method signatures below.

NOTE: sensor fusion (door / pendant / radar as grounding tools) is future
roadmap, not Phase 1. The agent confirms a fall from vision alone: a verification
timer plus a recovery check over the event log.
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

from app.config import settings
from app.event_log import MOTION, RECOVERY, EventLog


class AgentTools:
    """Stateful bundle of the agent's two tools.

    Args:
        event_log: where detection events are read from. A fresh one is created
            if not supplied (the pipeline normally injects the shared log).
        alerter: outbound alert channel. If ``None``, one is built lazily from
            ``settings`` on first escalation (tests inject a fake here).
        timer_seconds: grace-period length; defaults to settings.
        sleep: awaitable sleep function (injectable so tests run instantly and
            can simulate recovery happening *during* the wait).
    """

    def __init__(
        self,
        event_log: EventLog | None = None,
        alerter: Any = None,
        timer_seconds: int | None = None,
        sleep: Callable[[float], Awaitable[None]] | None = None,
    ) -> None:
        self.event_log = event_log if event_log is not None else EventLog()
        self._alerter = alerter
        self.timer_seconds = (
            settings.verification_timer_seconds if timer_seconds is None else timer_seconds
        )
        self._sleep = sleep or asyncio.sleep

        # Observable outcomes, read by the agent after a run.
        self.escalated = False
        self.last_alert: dict[str, Any] | None = None

    # --- tool 1 -----------------------------------------------------------
    async def start_verification_timer(self, seconds: int | None = None) -> dict[str, Any]:
        """Run the grace period, then report whether the person recovered.

        Waits ``seconds`` (the grace window), then inspects events recorded
        *during* the wait. Recovery = any motion/recovery event seen since the
        timer started; otherwise the person appears to still be down.
        """
        secs = self.timer_seconds if seconds is None else seconds
        cursor = self.event_log.cursor
        await self._sleep(secs)

        events_since = self.event_log.since_cursor(cursor)
        recovered = any(
            e.kind in (RECOVERY, MOTION) and not e.is_fall for e in events_since
        )
        return {
            "elapsed_seconds": secs,
            "recovered": recovered,
            "still_down": not recovered,
            "events_since": [e.to_dict() for e in events_since],
        }

    # --- tool 2 -----------------------------------------------------------
    def escalate(self, reason: str, severity: str = "high") -> dict[str, Any]:
        """Escalate a confirmed fall to the trusted contact.

        GUARDRAIL: notifies a pre-approved trusted contact only — NEVER
        emergency services automatically.
        """
        alerter = self._alerter
        if alerter is None:
            from app.alerts.base import get_alerter

            alerter = self._alerter = get_alerter()

        message = f"🚨 Soteria: fall confirmed (severity: {severity}). {reason}"
        result = alerter.send(message)

        self.escalated = bool(result.ok)
        self.last_alert = {
            "sent": bool(result.ok),
            "detail": result.detail,
            "message": message,
            "severity": severity,
            "reason": reason,
        }
        return self.last_alert

    # --- dispatch ---------------------------------------------------------
    @property
    def registry(self) -> dict[str, Callable[..., Any]]:
        """Tool name -> bound callable, used by the agent loop to dispatch."""
        return {
            "start_verification_timer": self.start_verification_timer,
            "escalate": self.escalate,
        }


# --- Tool schemas for tool-calling --------------------------------------------
# OpenAI/Ollama-style function specs. Keep in sync with AgentTools above.
TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "start_verification_timer",
            "description": (
                "Start a grace period before escalating, then report whether the "
                "person recovered (got back up) or is still down."
            ),
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
