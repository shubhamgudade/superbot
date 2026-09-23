export default {
  name: "joke",
  aliases: ["jokes"],
  async execute({ sock, message, args }) {
    const category = args[0] || "Any";

    try {
      const response = await fetch(
        `https://v2.jokeapi.dev/joke/${encodeURIComponent(category)}?safe-mode&lang=en`
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        return sock.sendMessage(
          message.key.remoteJid,
          { text: "❌ Invalid joke category. Try +joke, +joke programming, or +joke misc." },
          { quoted: message }
        );
      }

      const joke =
        data.type === "twopart"
          ? `😂 ${data.setup}\n\n👉 ${data.delivery}`
          : `😂 ${data.joke}`;

      await sock.sendMessage(
        message.key.remoteJid,
        { text: joke },
        { quoted: message }
      );
    } catch (error) {
      console.error("JokeAPI command error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch a joke right now." },
        { quoted: message }
      );
    }
  },
};
