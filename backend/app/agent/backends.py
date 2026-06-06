"""Pluggable chat backends for the verification agent.

The agent loop talks to an LLM only through the small ``ChatBackend`` protocol
below: given messages + tool schemas, return a normalized ``ChatResponse``
(assistant text + any requested tool calls). This keeps the agent independent of
*which* model answers, so we can swap:

  - ``OllamaChatBackend``   — the local, self-hosted model (production privacy path).
  - ``ClaudeChatBackend``   — DEMO-ONLY fallback if the local model is unreliable
                              (same prompts + tool schemas). Never on the
                              production sensitive-data path.
  - ``ScriptedChatBackend`` — a deterministic fake for tests + offline demos;
                              needs no model server at all.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable


@dataclass
class ToolCall:
    """A single tool the model wants to run."""

    name: str
    arguments: dict[str, Any] = field(default_factory=dict)


@dataclass
class ChatResponse:
    """Normalized one-turn model reply."""

    content: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)


@runtime_checkable
class ChatBackend(Protocol):
    """Anything that can answer one chat turn with optional tool calls."""

    def chat(
        self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]
    ) -> ChatResponse: ...


class ScriptedChatBackend:
    """Deterministic backend that replays a fixed list of ``ChatResponse``s.

    Each ``chat()`` call returns the next scripted response, ignoring the actual
    messages. Used by the test suite and the offline demo so the whole agent can
    run with no Ollama/Claude server present.
    """

    def __init__(self, script: list[ChatResponse]) -> None:
        self._script = list(script)
        self._i = 0
        self.calls: list[list[dict[str, Any]]] = []  # captured message histories

    def chat(
        self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]
    ) -> ChatResponse:
        self.calls.append(list(messages))
        if self._i >= len(self._script):
            # Safety net: end the loop rather than repeat the last tool call.
            return ChatResponse(content="(end of scripted conversation)")
        resp = self._script[self._i]
        self._i += 1
        return resp


class OllamaChatBackend:
    """Local LLM via the ``ollama`` Python client (no data leaves the device)."""

    def __init__(self, model: str, host: str | None = None) -> None:
        self.model = model
        self.host = host
        self._client: Any = None

    def _client_or_load(self) -> Any:
        if self._client is None:
            import ollama  # lazy: only needed when actually talking to a model

            self._client = ollama.Client(host=self.host) if self.host else ollama.Client()
        return self._client

    def chat(
        self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]
    ) -> ChatResponse:
        client = self._client_or_load()
        resp = client.chat(model=self.model, messages=messages, tools=tools)
        msg = resp["message"]
        tool_calls = [
            ToolCall(
                name=tc["function"]["name"],
                arguments=dict(tc["function"].get("arguments") or {}),
            )
            for tc in (msg.get("tool_calls") or [])
        ]
        return ChatResponse(content=msg.get("content", "") or "", tool_calls=tool_calls)


class ClaudeChatBackend:
    """DEMO-ONLY fallback to the Claude API (same prompts + tool schemas).

    Only use this as reliability insurance for the live demo — the production
    privacy story stays self-hosted OSS. Requires the ``anthropic`` package and
    an API key; imported lazily so it never burdens the default path.
    """

    def __init__(self, model: str = "claude-opus-4-8", api_key: str | None = None) -> None:
        self.model = model
        self.api_key = api_key
        self._client: Any = None

    def _client_or_load(self) -> Any:
        if self._client is None:
            import anthropic  # lazy

            self._client = anthropic.Anthropic(api_key=self.api_key)
        return self._client

    @staticmethod
    def _to_anthropic_tools(tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Convert OpenAI/Ollama-style tool specs to Anthropic's schema."""
        converted = []
        for t in tools:
            fn = t["function"]
            converted.append(
                {
                    "name": fn["name"],
                    "description": fn.get("description", ""),
                    "input_schema": fn.get("parameters", {"type": "object", "properties": {}}),
                }
            )
        return converted

    def chat(
        self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]
    ) -> ChatResponse:
        client = self._client_or_load()
        system = "\n".join(m["content"] for m in messages if m["role"] == "system")
        convo = [m for m in messages if m["role"] != "system"]
        resp = client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=system,
            messages=convo,
            tools=self._to_anthropic_tools(tools),
        )
        text_parts = [b.text for b in resp.content if getattr(b, "type", "") == "text"]
        tool_calls = [
            ToolCall(name=b.name, arguments=dict(b.input or {}))
            for b in resp.content
            if getattr(b, "type", "") == "tool_use"
        ]
        return ChatResponse(content=" ".join(text_parts), tool_calls=tool_calls)
