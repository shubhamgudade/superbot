import { crops, fish, villagers, universalGifts } from "stardew-valley-data";

export default {
  name: "stardew",
  aliases: ["sdv"],
  async execute({ sock, message, args }) {
    try {
      const kind = (args[0] || "fish").toLowerCase();

      let item;

      if (kind === "fish") {
        const items = fish().get();
        item = items[Math.floor(Math.random() * items.length)];
      } else if (kind === "crops") {
        const items = crops().get();
        item = items[Math.floor(Math.random() * items.length)];
      } else if (kind === "villagers") {
        const items = villagers().get();
        item = items[Math.floor(Math.random() * items.length)];
      } else if (kind === "gifts") {
        const data = universalGifts();
        const keys = ["loved", "liked", "neutral", "disliked", "hated"];
        const available = keys.filter((key) => Array.isArray(data[key]) && data[key].length);
        const key = available[Math.floor(Math.random() * available.length)];
        const items = data[key];
        const gift = items[Math.floor(Math.random() * items.length)];
        item = { name: gift, category: key };
      } else {
        return sock.sendMessage(
          message.key.remoteJid,
          { text: "❌ Use +stardew fish, +stardew crops, +stardew villagers, or +stardew gifts." },
          { quoted: message }
        );
      }

      if (!item) throw new Error("No Stardew data returned");

      const details = Object.entries(item)
        .filter(([key, value]) => key !== "name" && value !== undefined && value !== null)
        .slice(0, 6)
        .map(([key, value]) => {
          const formatted = Array.isArray(value) ? value.join(", ") : String(value);
          return `• ${key}: ${formatted}`;
        })
        .join("\n");

      await sock.sendMessage(
        message.key.remoteJid,
        {
          text: `🌾 *Stardew Valley — ${item.name || "Random Entry"}*\n\n${details || "No extra details available."}`,
        },
        { quoted: message }
      );
    } catch (error) {
      console.error("Stardew command error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch Stardew Valley data right now." },
        { quoted: message }
      );
    }
  },
};
