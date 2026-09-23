import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CARBON_API = "https://carbonara.solopov.dev/api/cook";

function unwrapMessage(message) {
  let content = message || null;

  for (let i = 0; i < 6 && content; i += 1) {
    if (content.ephemeralMessage?.message) {
      content = content.ephemeralMessage.message;
      continue;
    }
    if (content.viewOnceMessage?.message) {
      content = content.viewOnceMessage.message;
      continue;
    }
    if (content.viewOnceMessageV2?.message) {
      content = content.viewOnceMessageV2.message;
      continue;
    }
    if (content.viewOnceMessageV2Extension?.message) {
      content = content.viewOnceMessageV2Extension.message;
      continue;
    }
    break;
  }

  return content;
}

function getQuotedText(message) {
  const context =
    message?.message?.extendedTextMessage?.contextInfo ||
    message?.message?.imageMessage?.contextInfo ||
    message?.message?.videoMessage?.contextInfo ||
    message?.message?.documentMessage?.contextInfo;

  const quoted = unwrapMessage(context?.quotedMessage);
  if (!quoted) return "";

  return (
    quoted.conversation ||
    quoted.extendedTextMessage?.text ||
    quoted.imageMessage?.caption ||
    quoted.videoMessage?.caption ||
    quoted.documentMessage?.caption ||
    ""
  ).trim();
}

async function fetchWithTimeout(url, options = {}, ms = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function createCarbonImage(code) {
  const response = await fetchWithTimeout(CARBON_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "image/png",
    },
    body: JSON.stringify({
      code,
      theme: "seti",
      fontFamily: "Hack",
      fontSize: "14px",
      lineHeight: "133%",
      paddingHorizontal: "56px",
      paddingVertical: "56px",
      exportSize: "2x",
      windowControls: true,
      windowTheme: "none",
      lineNumbers: false,
      dropShadow: true,
      watermark: false,
      widthAdjustment: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Carbon service returned ${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : ""}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

export default {
  name: "carbon",
  aliases: ["codepic"],
  async execute({ sock, message, args }) {
    const directText = args.join(" ").trim();
    const quotedText = getQuotedText(message);
    const code = quotedText || directText;

    if (!code) {
      await sock.sendMessage(message.key.remoteJid, {
        text: "Reply to a code/text message with +carbon, or use +carbon <code>.",
      });
      return;
    }

    if (code.length > 12000) {
      await sock.sendMessage(message.key.remoteJid, {
        text: "That code is too long for a Carbon image. Keep it under 12000 characters.",
      });
      return;
    }

    try {
      console.log(`[Carbon] Generating image (${code.length} chars)...`);
      const buffer = await createCarbonImage(code);

      const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "superbot-carbon-"));
      const output = path.join(workDir, "carbon.png");

      try {
        await fs.writeFile(output, buffer);
        await sock.sendMessage(message.key.remoteJid, {
          image: buffer,
          mimetype: "image/png",
          caption: "Carbon ✨",
        });
      } finally {
        await fs.rm(workDir, { recursive: true, force: true });
      }

      console.log("[Carbon] Image sent.");
    } catch (error) {
      console.error("[Carbon] ERROR", error);
      await sock.sendMessage(message.key.remoteJid, {
        text: "Couldn't generate the Carbon image right now. Please try again.",
      });
    }
  },
};
