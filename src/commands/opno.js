import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import ffmpeg from "fluent-ffmpeg";

const TEMPLATE_FILE = path.join("data", "dog-template.jpg");
const DUSTBIN_FILE = path.join("data", "dustbin.png");

// Bubble config — tweak these if placement feels off
const BUBBLE = {
  x: 255,
  y: 155,
  w: 210,
  h: 100,
  pad: 12,
};

const DUSTBIN = {
  x: 258,
  y: 235,
  w: 220,
  h: 220,
};
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

function wrapText(text, maxChars = 14) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
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
  return lines.slice(0, 6).join("\n");
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
    } catch {}
  }

  throw new Error("No usable font found.");
}

function runFfmpeg(command) {
  return new Promise((resolve, reject) => {
    command.on("end", resolve).on("error", reject);
  });
}

async function createOpnoImage(text, output) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "superbot-opno-"));
  const textFile = path.join(workDir, "text.txt");
  const withBubble = path.join(workDir, "bubble.jpg");

  try {
    // in wrapText call inside createOpnoImage
const wrapped = wrapText(text, 12);
    await fs.writeFile(textFile, wrapped, "utf8");
    const font = await findFont();

    const { x, y, w, h, pad } = BUBBLE;

    console.log("[OpNo] Step 1 — drawing bubble...");
    await runFfmpeg(
      ffmpeg(TEMPLATE_FILE)
        .outputOptions(["-frames:v 1", "-q:v 2"])
        .videoFilters([
          // White bubble box, sharp corners, simple and reliable
          `drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=white@1.0:t=fill`,
          // Small tail pointing down
          `drawbox=x=${x + 15}:y=${y + h}:w=14:h=10:color=white@1.0:t=fill`,
          // Text
          `drawtext=fontfile='${font}':textfile='${textFile}':fontcolor=black:fontsize=16:line_spacing=12:x=${x + pad}:y=${y + pad}`,
        ])
        .save(withBubble),
    );

    console.log("[OpNo] Step 2 — overlaying dustbin...");
    await runFfmpeg(
      ffmpeg(withBubble)
        .input(DUSTBIN_FILE)
        .complexFilter([
          `[1:v]scale=${DUSTBIN.w}:${DUSTBIN.h}[bin]`,
          `[0:v][bin]overlay=${DUSTBIN.x}:${DUSTBIN.y}:format=auto`,
        ])
        .outputOptions(["-frames:v 1", "-q:v 2"])
        .save(output),
    );

    console.log("[OpNo] Both steps done, output at:", output);
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

      const workDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "superbot-opno-output-"),
      );
      const output = path.join(workDir, "opno.jpg");

      try {
        console.log(`${logPrefix} Creating meme...`);
        await createOpnoImage(text, output);

        const buffer = await fs.readFile(output);
        console.log(`${logPrefix} Meme created: ${buffer.length} bytes`);

        await sock.sendMessage(message.key.remoteJid, {
          image: buffer,
          mimetype: "image/jpeg",
        });

        console.log(`${logPrefix} Meme sent`);
      } finally {
        await fs.rm(workDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`${logPrefix} ERROR`, error);

      await sock.sendMessage(message.key.remoteJid, {
        text: "couldn't create the meme.",
      });
    }
  },
};