# Plan: Enable Persistent Telegram Bot Interaction

This plan fixes the issue where the Telegram bot is not responding because it wasn't running in the background. We will configure it to start automatically as an asynchronous background process whenever a Claude Code session begins.

## Context
The user wants to communicate with "SzeMan" (小敏) via Telegram. Currently, only a one-shot notification script runs at startup. The actual interactive bot (`telegram_bot.js`) needs to be running in the background to respond to messages.

## Implementation Steps

### 1. Rename and Support ESM
- Rename `telegram_bot.js` to `telegram_bot.mjs`.
- Reason: The script uses `import` statements which Node.js requires `.mjs` extension for (unless `package.json` specifies `type: module`).

### 2. Update Startup Notification Message
- Edit `send_startup_msg.mjs`.
- Action: Remove the sentence "如需發送 Telegram 指令，請確保啟動了 `telegram_bot.js`" because the bot will now start automatically.

### 3. Configure Background Hook
- Edit `.claude/settings.local.json`.
- Action: Add a new entry to the `SessionStart` hook:
    - `command`: `node telegram_bot.mjs`
    - `async`: `true`
    - `statusMessage`: "Starting SzeMan Telegram Bot..."

### 4. Verification
- Manually run `node telegram_bot.mjs` to ensure global dependencies (`telegraf`, `dotenv`) are correctly resolved in the current environment.
- Check the output for "✅ 小敏已成功連線至 Telegram。"

## Critical Files
- `telegram_bot.js` (to be renamed)
- `send_startup_msg.mjs`
- `.claude/settings.local.json`
