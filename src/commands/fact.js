export default {
  name: "fact",
  aliases: ["useless"],
  async execute(sock, message) {
    try {
      const response = await fetch(
        "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en",
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      await sock.sendMessage(
        message.key.remoteJid,
        { text: `🤓 ${data.text}` },
        { quoted: message }
      );
    } catch (error) {
      console.error("Fact command error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch a useless fact right now." },
        { quoted: message }
      );
    }
  },
};
