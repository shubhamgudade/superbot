import fetch from "node-fetch";

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || "https://gif-middleware.onrender.com";

async function fetchWithTimeout(url, options = {}, ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function getRandomGif() {
  const res = await fetchWithTimeout(
    `${MIDDLEWARE_URL}/gif`,
    { headers: { Authorization: `Bearer ${GIPHY_API_KEY}` } }
  );

  if (!res.ok) {
    console.error(`[Random] Middleware error: ${res.status}`);
    return null;
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function fireRandomGif(sock, remoteJid, quotedMessage = null) {
  const logPrefix = "[Random]";

  try {
    const buffer = await getRandomGif();
    if (!buffer) {
      console.log(`${logPrefix} No gif returned`);
      return;
    }

    await sock.sendMessage(
      remoteJid,
      {
        image: buffer,
        mimetype: "image/jpeg",
      },
      quotedMessage ? { quoted: quotedMessage } : {}
    );

    console.log(`${logPrefix} Sent to ${remoteJid}`);
  } catch (error) {
    console.error(`${logPrefix} ERROR`, error);
  }
}

export default {
  name: "random",
  aliases: ["r", "rand"],
  async execute({ sock, message }) {
    await fireRandomGif(sock, message.key.remoteJid, message);
  },
};