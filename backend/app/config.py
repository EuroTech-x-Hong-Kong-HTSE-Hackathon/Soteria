"""Typed application settings loaded from environment / .env via pydantic-settings.

All configuration funnels through a single ``Settings`` object so the rest of the
codebase never reads ``os.environ`` directly. Import the shared instance with:

    from app.config import settings

PRIVACY NOTE: nothing here should point the sensitive data path (video, audio)
at a third-party cloud. Only outbound *alert* channels
(Telegram / Twilio) are allowed to leave the device.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# .env lives at the project root (soteria/.env), regardless of where the
# process is launched from. Anchor to that absolute path so `python -c ...`
# from backend/ and `uvicorn` from root both pick up the same file.
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_ENV_FILE = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Single typed settings object for the whole backend."""

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- App ---
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"

    # --- Camera / perception ---
    camera_index: int = 0
    pose_model: str = "yolo11n-pose.pt"  # default detector: Ultralytics YOLO-pose (auto-downloaded)
    fall_detector_repo: str = "melihuzunoglu/human-fall-detection"  # legacy "fall_box" model
    fall_detector_filename: str = "best.pt"
    fall_confidence_threshold: float = 0.6
    enabled_detectors: list[str] = ["fall"]
    show_perception_window: bool = True
    show_detector_overlay: bool = False
    pipeline_min_confirm_seconds: float = 1.0
    verification_timer_seconds: int = 20

    # --- Agent (Ollama, local) ---
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # --- Alerts (Telegram) ---
    alert_channel: str = "telegram"  # telegram | twilio
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    # --- Alerts (Twilio, optional) ---
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from: str = ""
    twilio_to: str = ""

    # --- Scam-call stretch ---
    whisper_model: str = "base"
    scam_confidence_threshold: float = 0.7  # alert only at/above this confidence


@lru_cache
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance."""
    return Settings()


# Shared instance for convenient imports.
settings = get_settings()
