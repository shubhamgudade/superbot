const MANIFEST_URL = "https://www.stardewvalleywiki.net/api/v1/manifest.json";

export default {
  name: "stardew",
  aliases: ["sdv"],
  async execute({ sock, message, args }) {
    try {
      const manifestResponse = await fetch(MANIFEST_URL);
      if (!manifestResponse.ok) {
        throw new Error(`Manifest HTTP ${manifestResponse.status}`);
      }

      const manifest = await manifestResponse.json();
      const kind = (args[0] || "fish").toLowerCase();

      const source = manifest[kind] || manifest.datasets?.[kind] || manifest.data?.[kind];

      if (!source) {
        return sock.sendMessage(
          message.key.remoteJid,
          { text: "❌ Use +stardew fish, +stardew crops, +stardew villagers, or +stardew gifts." },
          { quoted: message }
        );
      }

      const url = typeof source === "string" ? source : source.url;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Dataset HTTP ${response.status}`);
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : data.data || data.items || [];

      if (!items.length) {
        throw new Error("Dataset is empty");
      }

      const item = items[Math.floor(Math.random() * items.length)];
      const name = item.name || item.Name || item.displayName || "Unknown";
      const details = Object.entries(item)
        .filter(([key]) => !["name", "Name", "displayName"].includes(key))
        .slice(0, 5)
        .map(([key, value]) => `• ${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join("\n");

      await sock.sendMessage(
        message.key.remoteJid,
        { text: `🌾 *Stardew Valley — ${name}*\n\n${details}` },
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
