export default {
  name: "gender",
  aliases: ["genderize"],
  async execute({ sock, message, args }) {
    const name = args.join(" ").trim();

    if (!name) {
      return sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Usage: +gender <name>" },
        { quoted: message }
      );
    }

    try {
      const url = new URL("https://api.genderize.io");
      url.searchParams.set("name", name);

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (!data.gender) {
        return sock.sendMessage(
          message.key.remoteJid,
          { text: `❓ No gender prediction available for "${name}".` },
          { quoted: message }
        );
      }

      const percent = Math.round((data.probability || 0) * 100);

      await sock.sendMessage(
        message.key.remoteJid,
        {
          text: `🔎 *Genderize — ${data.name}*\n\nPrediction: ${data.gender}\nProbability: ${percent}%\nData points: ${data.count}`,
        },
        { quoted: message }
      );
    } catch (error) {
      console.error("Genderize command error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch the name prediction right now." },
        { quoted: message }
      );
    }
  },
};
