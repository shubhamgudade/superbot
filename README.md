# SuperBot

A clean WhatsApp bot built from scratch with Baileys.

## Current feature

- Pair WhatsApp using a pairing code.
- `+hi` replies with `Hi 👋`.

## Setup

1. Install Node.js 20 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`.
4. Set your WhatsApp number in `PHONE_NUMBER` using digits only, including the country code.
5. Start the bot:

   ```bash
   npm start
   ```

6. Open WhatsApp and go to **Linked devices -> Link a device -> Link with phone number**, then enter the pairing code shown in the terminal.

The session is stored locally in the `sessions/` directory, so you should not need to pair again after a normal restart.
