export default {
  name: "digimon",
  aliases: ["digi"],
  async execute({ sock, message, args }) {
    try {
      const response = await fetch("https://digimon-api.vercel.app/api/digimon");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const digimon = await response.json();

      const requestedName = args.join(" ").trim().toLowerCase();

      const result = requestedName
        ? digimon.find((item) => item.name.toLowerCase() === requestedName)
        : digimon[Math.floor(Math.random() * digimon.length)];

      if (!result) {
        return sock.sendMessage(
          message.key.remoteJid,
          { text: "❌ Digimon not found. Try a name like +digimon Agumon." },
          { quoted: message }
        );
      }

      await sock.sendMessage(
        message.key.remoteJid,
        {
          image: { url: result.img },
          caption: `👾 *${result.name}*\n⭐ Level: ${result.level}`,
        },
        { quoted: message }
      );
    } catch (error) {
      console.error("Digimon command error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch Digimon right now." },
        { quoted: message }
      );
    }
  },
};
