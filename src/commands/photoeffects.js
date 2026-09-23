import { downloadMediaMessage } from "@whiskeysockets/baileys";
import pino from "pino";
import ffmpeg from "fluent-ffmpeg";

const API = "https://api.some-random-api.com/canvas/overlay/jail";
const APHRO_WANTED = "https://aphro.vercel.app/generate/wanted";

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

function getQuotedMessage(message) {
  const context =
    message?.message?.extendedTextMessage?.contextInfo ||
    message?.message?.imageMessage?.contextInfo ||
    message?.message?.videoMessage?.contextInfo ||
    message?.message?.documentMessage?.contextInfo;

  return unwrapMessage(context?.quotedMessage);
}

function getImageMessage(message) {
  const content = unwrapMessage(message?.message);
  if (!content) return null;

  if (content.imageMessage) return content.imageMessage;
  if (content.viewOnceMessage?.message?.imageMessage) {
    return content.viewOnceMessage.message.imageMessage;
  }

  return null;
}

async function getImageBuffer(message) {
  const imageMessage = getImageMessage(message);
  if (!imageMessage) return null;

  return downloadMediaMessage(
    { message: unwrapMessage(message.message) },
    "buffer",
    {},
    {
      logger: pino({ level: "silent" }),
      reuploadRequest: async () => {},
    },
  );
}

async function toPng(buffer) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const command = ffmpeg()
      .input("pipe:0")
      .inputFormat("image2pipe")
      .outputFormat("png")
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks)));

    const output = command.pipe();
    output.on("data", (chunk) => chunks.push(chunk));
    output.on("error", reject);
    output.on("end", () => {});
    output.on("close", () => {});
    output.on("finish", () => {});
    output.on("drain", () => {});

    command.on("start", () => {});
    command.on("end", () => {});
    command._process?.stdin?.end(buffer);
  });
}

async function uploadImage(buffer) {
  const png = await toPng(buffer);
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "avatar.png");

  const response = await fetch("https://0x0.st", {
    method: "POST",
    body: form,
  });

  const url = (await response.text()).trim();
  if (!response.ok || !url.startsWith("http")) {
    throw new Error(`Image upload failed: ${url.slice(0, 200)}`);
  }

  return url;
}

async function getSourceImage(message) {
  const direct = getImageMessage(message);
  if (direct) return message;

  const context =
    message?.message?.extendedTextMessage?.contextInfo ||
    message?.message?.imageMessage?.contextInfo ||
    message?.message?.videoMessage?.contextInfo ||
    message?.message?.documentMessage?.contextInfo;

  const quoted = context?.quotedMessage;
  if (quoted && getImageMessage({ message: quoted })) {
    return { message: quoted };
  }

  return null;
}

async function requestImage(command, imageUrl) {
  let url;

  if (command === "wanted" || command === "criminal") {
    url = `${APHRO_WANTED}?avatar=${encodeURIComponent(imageUrl)}`;
  } else if (command === "jail") {
    url = `${API}?avatar=${encodeURIComponent(imageUrl)}`;
  } else {
    throw new Error("Unsupported photo effect");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image API returned ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function run({ sock, message, command }) {
  const source = await getSourceImage(message);

  if (!source) {
    await sock.sendMessage(message.key.remoteJid, {
      text: `Reply to an image with +${command}.`,
    });
    return;
  }

  try {
    const buffer = await getImageBuffer(source);
    if (!buffer) throw new Error("Could not download image");

    const imageUrl = await uploadImage(buffer);
    const output = await requestImage(command, imageUrl);

    await sock.sendMessage(message.key.remoteJid, {
      image: output,
      mimetype: "image/png",
      caption: `+${command} ✨`,
    });
  } catch (error) {
    console.error(`[${command}] ERROR`, error);
    await sock.sendMessage(message.key.remoteJid, {
      text: `Couldn't create the +${command} image right now.`,
    });
  }
}

export const wanted = {
  name: "wanted",
  aliases: [],
  async execute({ sock, message }) {
    await run({ sock, message, command: "wanted" });
  },
};

export const criminal = {
  name: "criminal",
  aliases: [],
  async execute({ sock, message }) {
    await run({ sock, message, command: "criminal" });
  },
};

export const jail = {
  name: "jail",
  aliases: [],
  async execute({ sock, message }) {
    await run({ sock, message, command: "jail" });
  },
};

export default wanted;
