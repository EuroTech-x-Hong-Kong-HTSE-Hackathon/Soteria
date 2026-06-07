"""Telegram alert channel.

Sends minimal text alerts to a trusted contact via the Telegram Bot API. Text
is the default and the only egress on the privacy path. If the operator opts
in via ``settings.send_snapshot_on_alert`` AND the pipeline has wired a
snapshot provider, the alert at confirmation time is sent as a photo with the
text as the caption — the single documented exception to text-only egress.

Setup: create a bot with @BotFather, grab the token, and find your chat id
(e.g. message the bot then GET /getUpdates). Put both in .env.
"""

from __future__ import annotations

from collections.abc import Callable

import requests

from app.alerts.base import Alerter, AlertResult
from app.config import settings

SnapshotProvider = Callable[[], bytes | None]


class TelegramAlerter(Alerter):
    """Send alerts via the Telegram Bot API using ``requests``."""

    API_BASE = "https://api.telegram.org"
    TIMEOUT_SECONDS = 10

    def __init__(self, bot_token: str | None = None, chat_id: str | None = None) -> None:
        self.bot_token = bot_token or settings.telegram_bot_token
        self.chat_id = chat_id or settings.telegram_chat_id
        # Set externally (e.g. by the pipeline) when the operator has opted into
        # snapshot egress. None means "no snapshot available, text-only".
        self.snapshot_provider: SnapshotProvider | None = None

    def send(self, message: str) -> AlertResult:
        """POST the alert. Photo path if opted-in and a snapshot is available."""
        if not self.bot_token or not self.chat_id:
            return AlertResult(ok=False, detail="missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID")

        if settings.send_snapshot_on_alert and self.snapshot_provider is not None:
            try:
                snapshot = self.snapshot_provider()
            except Exception as exc:  # never let a bad provider block the alert
                snapshot = None
                fallback_detail = f"snapshot provider failed: {exc}; falling back to text"
            else:
                fallback_detail = ""
            if snapshot:
                return self._send_photo(message, snapshot)
            # Fall through to text if the provider returned nothing.
            text_result = self._send_text(message)
            if fallback_detail and text_result.ok:
                text_result = AlertResult(ok=True, detail=fallback_detail, raw=text_result.raw)
            return text_result

        return self._send_text(message)

    def _send_text(self, message: str) -> AlertResult:
        url = f"{self.API_BASE}/bot{self.bot_token}/sendMessage"
        payload = {"chat_id": self.chat_id, "text": message}
        try:
            resp = requests.post(url, json=payload, timeout=self.TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            return AlertResult(ok=False, detail=f"network error: {exc}")
        return self._parse_response(resp)

    def _send_photo(self, caption: str, image_bytes: bytes) -> AlertResult:
        url = f"{self.API_BASE}/bot{self.bot_token}/sendPhoto"
        # Telegram caps captions at 1024 chars; trim to avoid 400s on long agent summaries.
        if len(caption) > 1024:
            caption = caption[:1021] + "..."
        files = {"photo": ("snapshot.jpg", image_bytes, "image/jpeg")}
        data = {"chat_id": self.chat_id, "caption": caption}
        try:
            resp = requests.post(url, data=data, files=files, timeout=self.TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            return AlertResult(ok=False, detail=f"network error: {exc}")
        return self._parse_response(resp)

    def _parse_response(self, resp: requests.Response) -> AlertResult:
        try:
            body = resp.json()
        except ValueError:
            return AlertResult(
                ok=False,
                detail=f"non-JSON response ({resp.status_code}): {resp.text[:200]}",
                raw=resp.text,
            )
        ok = bool(body.get("ok"))
        detail = "" if ok else str(body.get("description", "unknown error"))
        return AlertResult(ok=ok, detail=detail, raw=body)
