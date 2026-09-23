export default {
  name: "abhi",
  aliases: ["abhiapi"],
  async execute({ sock, message, args }) {
    const type = (args[0] || "joke").toLowerCase();

    const endpoints = {
      fact: "https://abhi-api.vercel.app/api/fun/facts",
      joke: "https://abhi-api.vercel.app/api/fun/jgeneral",
      roast: "https://abhi-api.vercel.app/api/fun/roast",
    };

    const url = endpoints[type];

    if (!url) {
      return sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Use: +abhi fact, +abhi joke, or +abhi roast" },
        { quoted: message }
      );
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const result =
        typeof data.result === "string"
          ? data.result
          : `😂 ${data.result?.setup}\n\n👉 ${data.result?.punchline}`;

      await sock.sendMessage(
        message.key.remoteJid,
        { text: result },
        { quoted: message }
      );
    } catch (error) {
      console.error("Abhi API command error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch Abhi API data right now." },
        { quoted: message }
      );
    }
  },
};
