# Development setup

Notes for getting the dev environment ready and smoke-testing pieces of the
pipeline in isolation. Read [CLAUDE.md](../CLAUDE.md) first for the high-level
architecture; this doc is just the practical bench-test recipes.

## Testing the Telegram alert channel

The alert channel is the only network egress, so it's worth proving end-to-end
on its own before wiring it into the perception/agent pipeline.

### 1. Create the bot and get a token
1. In Telegram, message **@BotFather** → `/newbot` → follow the prompts.
2. Save the token it gives you (looks like `123456:ABC-DEF…`). Treat it like a
   password — don't commit it.

### 2. Get your chat ID
1. Open a chat with your new bot and send it any message (e.g. `hi`). Bots
   can't initiate conversations — you must message it first.
2. Either:
   - Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` and find
     `"chat":{"id": 12345678, …}`, or
   - Message **@userinfobot** in Telegram, which replies with your numeric
     user ID. Same value.

### 3. Put the credentials in `.env`
The `.env` lives at the **project root** (`soteria/.env`), not inside
`backend/`. `app/config.py` resolves to that path regardless of where the
process is launched from.

```bash
cp .env.example .env
# edit .env and fill in:
#   TELEGRAM_BOT_TOKEN=...
#   TELEGRAM_CHAT_ID=...
```

### 4. Smoke-test with `curl` (no Python yet)
Confirms the credentials work before any code is involved:

```bash
curl -s -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"<CHAT_ID>","text":"Soteria smoke test"}'
```

Expect `{"ok":true,"result":{…}}` and a buzz on your phone. If `ok` is
`false`, the `description` field tells you what's wrong (`chat not found` →
wrong chat ID, `Unauthorized` → wrong token).

### 5. Smoke-test the Python alerter
From `backend/` with the venv active:

```bash
python -c 'from app.alerts.base import get_alerter; print(get_alerter().send("hello from soteria"))'
```

Expected: `AlertResult(ok=True, detail='', raw={…})` and another buzz.
Common failure modes:

| Output | Cause |
|---|---|
| `ok=False, detail='missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID'` | `.env` missing or in the wrong directory |
| `ok=False, detail='Unauthorized'` | Bad token (re-copy from BotFather) |
| `ok=False, detail='chat not found'` | Wrong chat ID, or you haven't messaged the bot yet |
| `ok=False, detail='network error: …'` | DNS/firewall — the host can't reach `api.telegram.org` |

### 6. Smoke-test the walking skeleton
Once the alerter works in isolation, run the full skeleton — webcam in,
Telegram out, no detection yet:

```bash
python scripts/walking_skeleton.py
# press 'f' to fake a fall → Telegram alert fires
# press 'q' to quit
```

## Notes & gotchas

- **Don't paste the bot token in chats, screenshots, or commits.** If it
  leaks, revoke it: BotFather → `/mybots` → your bot → API Token → Revoke.
- **zsh `!` history expansion** will mangle messages containing `!` inside
  double quotes. Use single quotes around the `python -c` argument, or
  `setopt no_bang_hist` for the session.
- **One venv at the project root** (`soteria/venv/`), not inside `backend/`.
  Scripts in `scripts/` and the backend share dependencies.
