import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";

const DEFAULT_PREFIX = "+";
const CONFIG_DIR = "data";
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const phoneNumber = (process.env.PHONE_NUMBER || "").replace(/\D/g, "");

if (!phoneNumber) {
  throw new Error("PHONE_NUMBER is required in .env");
}

async function getPrefix() {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf8");
    const config = JSON.parse(raw);

    if (typeof config.prefix === "string" && config.prefix.length > 0) {
      return config.prefix;
    }
  } catch {
    // Use the default when the config file does not exist or is invalid.
  }

  return DEFAULT_PREFIX;
}

async function setPrefix(prefix) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(
    CONFIG_FILE,
    JSON.stringify({ prefix }, null, 2) + "\n",
    "utf8",
  );
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

      const [command, ...args] = body.split(/\s+/);
      const commandName = command.toLowerCase();

      if (commandName === "setprefix") {
        const newPrefix = args.join(" ").trim();

        if (!newPrefix || newPrefix.length > 3 || /\s/.test(newPrefix)) {
          await sock.sendMessage(message.key.remoteJid, {
            text: "Usage: setprefix <prefix>\nExample: setprefix !",
          });
          continue;
        }

        await setPrefix(newPrefix);

        await sock.sendMessage(message.key.remoteJid, {
          text: `Prefix changed to: ${newPrefix}`,
        });
        continue;
      }

      if (commandName === "hi") {
        await sock.sendMessage(message.key.remoteJid, {
          text: "Hi 👋",
        });
      }
    }
  });
}

startBot().catch((error) => {
  console.error("Failed to start SuperBot:", error);
  process.exit(1);
});
