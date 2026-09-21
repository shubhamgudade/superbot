import "dotenv/config";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";

const PREFIX = "+";
const phoneNumber = (process.env.PHONE_NUMBER || "").replace(/\D/g, "");

if (!phoneNumber) {
  throw new Error("PHONE_NUMBER is required in .env");
}

let pairingCodeRequested = false;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("sessions");

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
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log("Connection closed. Reconnecting...");
        pairingCodeRequested = false;
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

      if (text.trim().toLowerCase() !== PREFIX + "hi") continue;

      await sock.sendMessage(message.key.remoteJid, {
        text: "Hi 👋",
      });
    }
  });
}

startBot().catch((error) => {
  console.error("Failed to start SuperBot:", error);
  process.exit(1);
});
