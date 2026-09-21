import fs from "node:fs/promises";
import path from "node:path";

const triggers = [
  {
    name: "unemployed",
    keywords: ["unemployed", "nalla", "berojgar", "faltu"],
    image: path.join("data", "unemployed.jpg"),
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
}

function containsKeyword(text, keyword) {
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}_])${escapeRegExp(keyword)}([^\\p{L}\\p{N}_]|$)`,
    "iu",
  );

  return pattern.test(text);
}

export async function handleImageTrigger({ sock, message, text }) {
  const normalized = text.replace(/\\s+/g, " ").trim();
  if (!normalized) return false;

  for (const trigger of triggers) {
    if (!trigger.keywords.some((keyword) => containsKeyword(normalized, keyword))) {
      continue;
    }

    try {
      const image = await fs.readFile(trigger.image);

      await sock.sendMessage(message.key.remoteJid, {
        image,
        mimetype: "image/jpeg",
      });

      console.log(
        `[ImageTrigger] ${trigger.name} matched: ${normalized}`,
      );
    } catch (error) {
      console.error(
        `[ImageTrigger] Could not load ${trigger.image}`,
        error,
      );
    }

    return true;
  }

  return false;
}
