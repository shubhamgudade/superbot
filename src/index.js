import "dotenv/config";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";

import { getPrefix } from "./config/prefix.js";
import { getCommand } from "./commands/index.js";

const phoneNumber = (process.env.PHONE_NUMBER || "").replace(/\D/g, "");

if (!phoneNumber) {
  throw new Error("PHONE_NUMBER is required in .env");
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("sessions");
  let pairingCodeRequested = false;

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, qr, lastDisconnect }) => {
    if (qr && !state.creds.registered && !pairingCodeRequested) {
      pairingCodeRequested = true;

      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("\nPairing code:", code);
        console.log(
          "On WhatsApp: Linked devices -> Link a device -> Link with phone number.\n",
        );
      } catch (error) {
        pairingCodeRequested = false;
        console.error("Failed to generate pairing code:", error);
      }
    }

    if (connection === "open") {
      console.log("SuperBot connected.");
      console.log("Prefix:", await getPrefix());
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log("Connection closed. Reconnecting...");
        startBot().catch(console.error);
      } else {
        console.log("Logged out. Delete the sessions folder and pair again.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const message of messages) {
      if (message.key.fromMe || !message.message) continue;

      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        "";

      const prefix = await getPrefix();
      const input = text.trim();

      if (!input.startsWith(prefix)) continue;

      const body = input.slice(prefix.length).trim();
      if (!body) continue;

      const [commandName, ...args] = body.split(/\s+/);
      const command = getCommand(commandName);

      if (!command) continue;

      try {
        await command.execute({
          sock,
          message,
          args,
          commandName: commandName.toLowerCase(),
          prefix,
        });
      } catch (error) {
        console.error(`Command failed: ${command.name}`, error);

        await sock.sendMessage(message.key.remoteJid, {
          text: "Something went wrong while running that command.",
        });
      }
    }
  });
}

startBot().catch((error) => {
  console.error("Failed to start SuperBot:", error);
  process.exit(1);
});
