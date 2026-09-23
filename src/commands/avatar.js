const API = "https://api.dicebear.com/9.x";

const STYLES = new Set([
  "adventurer",
  "bottts",
  "lorelei",
  "pixel-art",
  "fun-emoji",
  "thumbs",
]);

function cleanSeed(value) {
  return value.trim().replace(/\s+/g, "-").slice(0, 80);
}

export default {
  name: "avatar",
  aliases: ["av"],
  async execute({ sock, message, args }) {
    if (!args.length) {
      await sock.sendMessage(message.key.remoteJid, {
        text:
          "Usage: +avatar <name>\n" +
          "Example: +avatar shubham\n\n" +
          "Styles: adventurer, bottts, lorelei, pixel-art, fun-emoji, thumbs\n" +
          "Example: +avatar pixel-art shubham",
      });
      return;
    }

    let style = "adventurer";
    let seedParts = args;

    if (STYLES.has(args[0].toLowerCase())) {
      style = args[0].toLowerCase();
      seedParts = args.slice(1);
    }

    const seed = cleanSeed(seedParts.join(" "));
    if (!seed) {
      await sock.sendMessage(message.key.remoteJid, {
        text: "Give me a name/seed. Example: +avatar shubham",
      });
      return;
    }

    try {
      const url =
        `${API}/${style}/png?seed=${encodeURIComponent(seed)}&size=512`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`DiceBear returned ${response.status}`);
      }

      const image = Buffer.from(await response.arrayBuffer());

      await sock.sendMessage(message.key.remoteJid, {
        image,
        mimetype: "image/png",
        caption: `🎨 Avatar\nStyle: ${style}\nSeed: ${seed.replace(/-/g, " ")}`,
      });
    } catch (error) {
      console.error("[Avatar] ERROR", error);
      await sock.sendMessage(message.key.remoteJid, {
        text: "Couldn't generate that avatar right now.",
      });
    }
  },
};
