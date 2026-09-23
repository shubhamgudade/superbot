export default {
  name: "chuck",
  aliases: ["joke"],
  async execute(sock, message, args) {
    const category = args[0]?.toLowerCase();

    try {
      const url = category
        ? `https://api.chucknorris.io/jokes/random?category=${encodeURIComponent(category)}`
        : "https://api.chucknorris.io/jokes/random";

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return sock.sendMessage(
            message.key.remoteJid,
            { text: "❌ Invalid Chuck category. Try +chuck for a random joke." },
            { quoted: message }
          );
        }

        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      await sock.sendMessage(
        message.key.remoteJid,
        { text: `😂 ${data.value}` },
        { quoted: message }
      );
    } catch (error) {
      console.error("Chuck command error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch a Chuck Norris joke right now." },
        { quoted: message }
      );
    }
  },
};
