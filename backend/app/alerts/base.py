"""Alerter interface + factory.

A common interface so the pipeline/agent can escalate without caring whether the
backend is Telegram or Twilio. Selected via ``settings.alert_channel``.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from app.config import settings


@dataclass
class AlertResult:
    """Result of attempting to send an alert."""

    ok: bool
    detail: str = ""
    raw: Any = None


class Alerter(ABC):
    """Abstract outbound alert channel."""

    @abstractmethod
    def send(self, message: str) -> AlertResult:
        """Send a minimal text alert to the trusted contact."""
        raise NotImplementedError


def get_alerter() -> Alerter:
    """Build the configured alerter.

    TODO: return TelegramAlerter() for "telegram"; TwilioAlerter() for "twilio".
    """
    channel = settings.alert_channel.lower()
    if channel == "telegram":
        from app.alerts.telegram import TelegramAlerter

        return TelegramAlerter()
    # TODO: implement and import TwilioAlerter behind this same interface.
    raise NotImplementedError(f"Unsupported alert channel: {channel!r}")
