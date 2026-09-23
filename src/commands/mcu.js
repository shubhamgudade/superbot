export default {
  name: "mcu",
  aliases: ["marvel"],
  async execute(sock, message) {
    try {
      const response = await fetch("https://www.whenisthenextmcufilm.com/api");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      await sock.sendMessage(message.key.remoteJid, { text: `🎬 *Next MCU*\n\n*${data.title}*\n📅 ${data.release_date}\n⏳ ${data.days_until} days\n\n${data.overview || ""}` }, { quoted: message });
    } catch (error) {
      console.error("MCU command error:", error);
      await sock.sendMessage(message.key.remoteJid, { text: "❌ Couldn't fetch MCU countdown." }, { quoted: message });
    }
  },
};