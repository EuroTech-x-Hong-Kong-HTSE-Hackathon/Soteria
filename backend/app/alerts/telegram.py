"""Telegram alert channel.

Sends minimal text alerts to a trusted contact via the Telegram Bot API. This is
an outbound-only, text-only channel — the single permitted egress point. No raw
video or audio is ever sent.

Setup: create a bot with @BotFather, grab the token, and find your chat id
(e.g. message the bot then GET /getUpdates). Put both in .env.
"""

from __future__ import annotations

from app.alerts.base import Alerter, AlertResult
from app.config import settings


class TelegramAlerter(Alerter):
    """Send alerts via the Telegram Bot API using ``requests``."""

    API_BASE = "https://api.telegram.org"

    def __init__(self, bot_token: str | None = None, chat_id: str | None = None) -> None:
        self.bot_token = bot_token or settings.telegram_bot_token
        self.chat_id = chat_id or settings.telegram_chat_id

    def send(self, message: str) -> AlertResult:
        """POST a text message to the configured chat.

        TODO:
          1. url = f"{self.API_BASE}/bot{self.bot_token}/sendMessage"
          2. requests.post(url, json={"chat_id": self.chat_id, "text": message}, timeout=10)
          3. Return AlertResult(ok=resp.ok, detail=resp.text, raw=resp.json()).
        """
        raise NotImplementedError
