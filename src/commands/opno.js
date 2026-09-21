import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import ffmpeg from "fluent-ffmpeg";

const TEMPLATE_URL = "https://i.imgflip.com/8wm7xw.jpg";
const TEMPLATE_FILE = path.join("data", "opno-template.jpg");

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

function wrapText(text, maxChars = 20) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    if (!line) {
      line = word;
      continue;
    }

    if ((line + " " + word).length <= maxChars) {
      line += " " + word;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);

  return lines.join("\n").slice(0, 220);
}

async function ensureTemplate() {
  try {
    await fs.access(TEMPLATE_FILE);
    return;
  } catch {
    // Download on first use.
  }

  console.log("[OpNo] Downloading meme template...");
  await fs.mkdir(path.dirname(TEMPLATE_FILE), { recursive: true });

  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error(`Template download failed: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(TEMPLATE_FILE, buffer);
  console.log(`[OpNo] Template saved: ${buffer.length} bytes`);
}

async function findFont() {
  const candidates = [
    "/system/fonts/Roboto-Regular.ttf",
    "/system/fonts/NotoSans-Regular.ttf",
    "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf",
  ];

  for (const font of candidates) {
    try {
      await fs.access(font);
      return font;
    } catch {
      // Try the next font.
    }
  }

  throw new Error("No usable Android font was found for +opno.");
}

async function createOpnoImage(text, output) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "superbot-opno-"));
  const textFile = path.join(workDir, "text.txt");

  try {
    await fs.writeFile(textFile, wrapText(text), "utf8");
    const font = await findFont();

    await new Promise((resolve, reject) => {
      ffmpeg(TEMPLATE_FILE)
        .outputOptions([
          "-frames:v 1",
          "-q:v 3",
        ])
        .videoFilters([
          `drawtext=fontfile='${font}':textfile='${textFile}':fontcolor=black:fontsize=28:line_spacing=4:box=1:boxcolor=white@0.88:boxborderw=10:x=385:y=305`,
        ])
        .on("end", resolve)
        .on("error", reject)
        .save(output);
    });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

export default {
  name: "opno",
  aliases: [],
  async execute({ sock, message }) {
    const logPrefix = "[OpNo]";
    console.log(`${logPrefix} Command received`);

    const text = getQuotedText(message);

    if (!text) {
      await sock.sendMessage(message.key.remoteJid, {
        text: "Reply to a text message with +opno.",
      });
      return;
    }

    try {
      console.log(`${logPrefix} Quoted text: ${text}`);
      await ensureTemplate();

      const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "superbot-opno-output-"));
      const output = path.join(workDir, "opno.jpg");

      try {
        console.log(`${logPrefix} Creating meme...`);
        await createOpnoImage(text, output);

        const buffer = await fs.readFile(output);
        console.log(`${logPrefix} Meme created: ${buffer.length} bytes`);
        console.log(`${logPrefix} Sending meme...`);

        await sock.sendMessage(message.key.remoteJid, {
          image: buffer,
          mimetype: "image/jpeg",
        });

        console.log(`${logPrefix} Meme sent successfully`);
      } finally {
        await fs.rm(workDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`${logPrefix} ERROR`);
      console.error(error);

      await sock.sendMessage(message.key.remoteJid, {
        text: "I couldn't create the opinion meme.",
      });
    }
  },
};
