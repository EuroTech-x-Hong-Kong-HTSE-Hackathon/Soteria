"""Local LLM agent loop with tool-calling.

Drives an LLM through a confirm-or-dismiss decision about a candidate fall. The
agent reasons over recent detection events, runs a verification timer, and
escalates only when a fall is confirmed.

The model is reached only through a ``ChatBackend`` (see ``backends.py``), so the
same loop runs against the local Ollama model (default, privacy path), a scripted
fake (tests/offline demo), or — DEMO ONLY — the Claude API as reliability
insurance. The production privacy story stays self-hosted OSS; no sensitive data
leaves the device on the default path.
"""

from __future__ import annotations

import inspect
import json
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

from app.agent import prompts
from app.agent.backends import ChatBackend, OllamaChatBackend
from app.agent.tools import TOOL_SCHEMAS, AgentTools
from app.config import settings
from app.event_log import EventLog

# Optional dashboard hook: on_event(event_type, payload) — may be sync or async.
EmitFn = Callable[[str, dict[str, Any]], Any]


@dataclass
class AgentResult:
    """Final outcome of an agent run."""

    confirmed: bool
    summary: str
    escalated: bool = False
    transcript: list[dict[str, Any]] = field(default_factory=list)


class VerificationAgent:
    """LLM agent that verifies falls before escalating.

    Args:
        backend: the LLM backend. Defaults to local Ollama.
        tools: the agent's tool bundle. Defaults to a fresh ``AgentTools`` over
            ``event_log``.
        event_log: shared detection-event log (the pipeline injects the real one).
        max_steps: safety cap on tool-calling rounds.
        on_event: optional callback to stream reasoning/actions to the dashboard.
    """

    def __init__(
        self,
        backend: ChatBackend | None = None,
        tools: AgentTools | None = None,
        event_log: EventLog | None = None,
        model: str | None = None,
        host: str | None = None,
        max_steps: int = 6,
        on_event: EmitFn | None = None,
    ) -> None:
        if event_log is not None:
            self.event_log = event_log
        elif tools is not None:
            self.event_log = tools.event_log
        else:
            self.event_log = EventLog()
        self.tools = tools if tools is not None else AgentTools(self.event_log)
        self.backend = backend or OllamaChatBackend(
            model or settings.ollama_model, host or settings.ollama_host
        )
        self.max_steps = max_steps
        self.on_event = on_event

    async def _emit(self, event_type: str, payload: dict[str, Any]) -> None:
        if self.on_event is None:
            return
        result = self.on_event(event_type, payload)
        if inspect.isawaitable(result):
            await result

    async def _dispatch(self, name: str, arguments: dict[str, Any]) -> Any:
        """Run one tool call, awaiting it if the tool is async."""
        fn = self.tools.registry.get(name)
        if fn is None:
            return {"error": f"unknown tool: {name}"}
        try:
            result = fn(**(arguments or {}))
            if inspect.isawaitable(result):
                result = await result
            return result
        except Exception as exc:  # surface tool errors to the model, don't crash
            return {"error": f"{type(exc).__name__}: {exc}"}

    async def run(self, detection: dict[str, Any]) -> AgentResult:
        """Run the tool-calling loop for one candidate fall."""
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": prompts.SYSTEM_PROMPT},
            {"role": "user", "content": prompts.build_user_prompt(detection)},
        ]
        await self._emit("agent_started", {"detection": detection})

        final_summary = ""
        for step in range(self.max_steps):
            response = self.backend.chat(messages, TOOL_SCHEMAS)

            assistant_msg: dict[str, Any] = {"role": "assistant", "content": response.content}
            if response.tool_calls:
                assistant_msg["tool_calls"] = [
                    {"function": {"name": tc.name, "arguments": tc.arguments}}
                    for tc in response.tool_calls
                ]
            messages.append(assistant_msg)

            if response.content:
                await self._emit("agent_reasoning", {"step": step, "text": response.content})

            if not response.tool_calls:
                final_summary = response.content
                break

            for tc in response.tool_calls:
                await self._emit("agent_action", {"tool": tc.name, "arguments": tc.arguments})
                result = await self._dispatch(tc.name, tc.arguments)
                await self._emit("tool_result", {"tool": tc.name, "result": result})
                messages.append(
                    {
                        "role": "tool",
                        "name": tc.name,
                        "content": json.dumps(result, default=str),
                    }
                )
        else:
            final_summary = final_summary or "Agent stopped after reaching max steps."

        result = AgentResult(
            confirmed=self.tools.escalated,
            escalated=self.tools.escalated,
            summary=final_summary or "(no summary)",
            transcript=messages,
        )
        await self._emit(
            "agent_done",
            {"confirmed": result.confirmed, "escalated": result.escalated, "summary": result.summary},
        )
        return result
