"""Telegram alert channel.

Sends minimal text alerts to a trusted contact via the Telegram Bot API. This is
an outbound-only, text-only channel — the single permitted egress point. No raw
video or audio is ever sent.

Setup: create a bot with @BotFather, grab the token, and find your chat id
(e.g. message the bot then GET /getUpdates). Put both in .env.
"""

from __future__ import annotations

import requests

from app.alerts.base import Alerter, AlertResult
from app.config import settings


class TelegramAlerter(Alerter):
    """Send alerts via the Telegram Bot API using ``requests``."""

    API_BASE = "https://api.telegram.org"
    TIMEOUT_SECONDS = 10

    def __init__(self, bot_token: str | None = None, chat_id: str | None = None) -> None:
        self.bot_token = bot_token or settings.telegram_bot_token
        self.chat_id = chat_id or settings.telegram_chat_id

    def send(self, message: str) -> AlertResult:
        """POST a text message to the configured chat via ``sendMessage``."""
        if not self.bot_token or not self.chat_id:
            return AlertResult(ok=False, detail="missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID")

        url = f"{self.API_BASE}/bot{self.bot_token}/sendMessage"
        payload = {"chat_id": self.chat_id, "text": message}

        try:
            resp = requests.post(url, json=payload, timeout=self.TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            return AlertResult(ok=False, detail=f"network error: {exc}")

        try:
            body = resp.json()
        except ValueError:
            return AlertResult(ok=False, detail=f"non-JSON response ({resp.status_code}): {resp.text[:200]}", raw=resp.text)

        # Telegram always returns a JSON envelope with an `ok` boolean; trust it
        # over the HTTP status code (some errors return 200 with ok=false).
        ok = bool(body.get("ok"))
        detail = "" if ok else str(body.get("description", "unknown error"))
        return AlertResult(ok=ok, detail=detail, raw=body)
