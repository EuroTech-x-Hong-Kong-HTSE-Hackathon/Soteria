"""Ollama agent loop with tool-calling.

Drives a local LLM (via the ``ollama`` Python client) through a confirm-or-dismiss
decision about a candidate fall. The agent reasons over recent detection events,
can start a verification timer, and escalates only when a fall is confirmed.

Runs against a LOCAL Ollama server — no data leaves the device here.

DEMO FALLBACK: if the local model proves too inaccurate or non-deterministic,
swap the chat backend for Claude API calls (keep the same system prompt + tool
schemas). This is a demo-only reliability contingency — the production privacy
story stays self-hosted OSS (our own models, never a third-party AI provider).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.agent import prompts
from app.agent.tools import TOOL_REGISTRY, TOOL_SCHEMAS
from app.config import settings


@dataclass
class AgentResult:
    """Final outcome of an agent run."""

    confirmed: bool
    summary: str
    escalated: bool = False
    transcript: list[dict[str, Any]] = field(default_factory=list)


class VerificationAgent:
    """Local LLM agent that verifies falls before escalating."""

    def __init__(self, model: str | None = None, host: str | None = None) -> None:
        self.model = model or settings.ollama_model
        self.host = host or settings.ollama_host
        self._client: Any = None  # ollama.Client

    def _ensure_client(self) -> Any:
        """Lazily build the Ollama client.

        TODO: ``import ollama; self._client = ollama.Client(host=self.host)``.
        """
        raise NotImplementedError

    async def run(self, detection: dict[str, Any]) -> AgentResult:
        """Run the tool-calling loop for one candidate fall.

        TODO:
          1. messages = [system, user(detection)].
          2. Loop: chat(model, messages, tools=TOOL_SCHEMAS).
          3. If the response requests tool calls, dispatch via TOOL_REGISTRY,
             append tool results, and continue.
          4. Stop when the model returns a final answer (no tool calls).
          5. Emit reasoning to the dashboard along the way.
          6. Return AgentResult with confirmed/escalated/summary.
        """
        _ = (prompts.SYSTEM_PROMPT, TOOL_REGISTRY, TOOL_SCHEMAS)  # referenced for wiring
        raise NotImplementedError
