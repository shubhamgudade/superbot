import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import { downloadMediaMessage } from "@whiskeysockets/baileys";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";\nimport pino from "pino";

const MAX_VIDEO_SECONDS = 6;

function getMessageContent(message) {
  let content = message?.message || message;

  if (!content) return null;

  if (content.ephemeralMessage?.message) {
    content = content.ephemeralMessage.message;
  }

  if (content.viewOnceMessage?.message) {
    content = content.viewOnceMessage.message;
  }

  if (content.viewOnceMessageV2?.message) {
    content = content.viewOnceMessageV2.message;
  }

  if (content.viewOnceMessageV2Extension?.message) {
    content = content.viewOnceMessageV2Extension.message;
  }

  return content;
}

function getMediaType(content) {
  if (!content) return null;

  if (content.imageMessage) return "image";
  if (content.videoMessage) return "video";

  if (
    content.documentMessage &&
    content.documentMessage.mimetype?.toLowerCase() === "image/gif"
  ) {
    return "gif";
  }

  return null;
}

function getQuotedContent(message) {
  const context =
    message?.message?.extendedTextMessage?.contextInfo ||
    message?.message?.imageMessage?.contextInfo ||
    message?.message?.videoMessage?.contextInfo ||
    message?.message?.documentMessage?.contextInfo;

  return context?.quotedMessage || null;
}

function buildQuotedMessage(message, quotedContent) {
  return {
    key: {
      remoteJid: message.key.remoteJid,
      id: "quoted",
      fromMe: false,
    },
    message: quotedContent,
  };
}

async function getMedia(message) {
  const directContent = getMessageContent(message);
  const directType = getMediaType(directContent);

  if (directType) {
    return { message, type: directType };
  }

  const quotedContent = getQuotedContent(message);
  const quotedType = getMediaType(quotedContent);

  if (quotedType) {
    return {
      message: buildQuotedMessage(message, quotedContent),
      type: quotedType,
    };
  }

  return null;
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

async function imageToSticker(input, output) {
  await sharp(input)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 90 })
    .toFile(output);
}

async function animatedToSticker(input, output) {
  await runFfmpeg([
    "-y",
    "-i",
    input,
    "-t",
    String(MAX_VIDEO_SECONDS),
    "-vf",
    "fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0",
    "-c:v",
    "libwebp",
    "-lossless",
    "0",
    "-q:v",
    "60",
    "-compression_level",
    "4",
    "-loop",
    "0",
    "-an",
    output,
  ]);
}

export default {
  name: "sticker",
  aliases: ["s", "st"],
  async execute({ sock, message }) {
    const media = await getMedia(message);

    if (!media) {
      await sock.sendMessage(message.key.remoteJid, {
        text: "Send or reply to an image, video, or GIF with +sticker.",
      });
      return;
    }

    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "superbot-sticker-"));
    const input = path.join(workDir, "input");
    const output = path.join(workDir, "sticker.webp");

    try {
      const buffer = await downloadMediaMessage(
        media.message,
        "buffer",
        {},
        {
          logger: pino({ level: "silent" }),
          reuploadRequest: sock.updateMediaMessage,
        },
      );

      await fs.writeFile(input, buffer);

      if (media.type === "image") {
        await imageToSticker(input, output);
      } else {
        await animatedToSticker(input, output);
      }

      await sock.sendMessage(message.key.remoteJid, {
        sticker: await fs.readFile(output),
      });
    } catch (error) {
      console.error("Sticker conversion failed:", error);
      await sock.sendMessage(message.key.remoteJid, {
        text: "I couldn't convert that media into a sticker.",
      });
    } finally {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  },
};
