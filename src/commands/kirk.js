import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { downloadMediaMessage } from "@whiskeysockets/baileys";
import pino from "pino";
import { Client } from "magic-hour";

function unwrapContent(message) {
  let content = message?.message || message || null;

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

function getQuotedContent(message) {
  const context =
    message?.message?.extendedTextMessage?.contextInfo ||
    message?.message?.imageMessage?.contextInfo ||
    message?.message?.videoMessage?.contextInfo ||
    message?.message?.documentMessage?.contextInfo;

  return unwrapContent(context?.quotedMessage);
}

function getMediaType(content) {
  if (!content) return null;
  if (content.imageMessage) return "image";
  if (content.documentMessage?.mimetype?.toLowerCase().startsWith("image/")) return "image";
  return null;
}

function getTargetMessage(message) {
  const direct = unwrapContent(message);
  if (getMediaType(direct)) return { message, type: "image" };

  const quoted = getQuotedContent(message);
  if (getMediaType(quoted)) {
    return {
      message: {
        key: {
          remoteJid: message.key.remoteJid,
          id: "kirk-target",
          fromMe: false,
        },
        message: quoted,
      },
      type: "image",
    };
  }

  return null;
}

function getSourcePath() {
  return path.resolve(
    process.env.KIRK_SOURCE_IMAGE || "assets/kirk-source.jpg",
  );
}

async function createSwap(sourcePath, targetPath, outputDir) {
  const client = new Client({
    token: process.env.MAGIC_HOUR_API_KEY,
  });

  const result = await client.v1.faceSwapPhoto.generate(
    {
      assets: {
        faceSwapMode: "all-faces",
        sourceFilePath: sourcePath,
        targetFilePath: targetPath,
      },
      name: "SuperBot image",
    },
    {
      waitForCompletion: true,
      downloadOutputs: true,
      downloadDirectory: outputDir,
    },
  );

  const downloaded = result.downloadedPaths || [];
  if (!downloaded.length) {
    throw new Error("Magic Hour returned no output file.");
  }

  return downloaded[0];
}

export default {
  name: "kirk",
  aliases: [],
  async execute({ sock, message }) {
    const chatId = message.key.remoteJid;
    const target = getTargetMessage(message);

    if (!process.env.MAGIC_HOUR_API_KEY) {
      await sock.sendMessage(chatId, {
        text: "MAGIC_HOUR_API_KEY is missing in .env.",
      });
      return;
    }

    if (!target) {
      await sock.sendMessage(chatId, {
        text: "Send or reply to an image with +kirk.",
      });
      return;
    }

    const sourcePath = getSourcePath();

    try {
      await fs.access(sourcePath);
    } catch {
      await sock.sendMessage(chatId, {
        text: "The fixed +kirk source image is missing at assets/kirk-source.jpg.",
      });
      return;
    }

    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "superbot-kirk-"));
    const targetPath = path.join(workDir, "target.jpg");
    const outputDir = path.join(workDir, "output");

    try {
      await fs.mkdir(outputDir, { recursive: true });

      const buffer = await downloadMediaMessage(
        target.message,
        "buffer",
        {},
        {
          logger: pino({ level: "silent" }),
          reuploadRequest: sock.updateMediaMessage,
        },
      );

      await fs.writeFile(targetPath, buffer);

      console.log("[Kirk] Processing image...");
      const outputPath = await createSwap(sourcePath, targetPath, outputDir);
      const output = await fs.readFile(outputPath);

      await sock.sendMessage(chatId, {
        image: output,
        mimetype: "image/jpeg",
      });

      console.log("[Kirk] Image sent successfully");
    } catch (error) {
      console.error("[Kirk] Processing failed:", error);
      await sock.sendMessage(chatId, {
        text: "I couldn't process that image.",
      });
    } finally {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  },
};
