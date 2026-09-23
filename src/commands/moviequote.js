export default {
  name: "moviequote",
  aliases: ["mquote"],
  async execute({ sock, message, args }) {
    try {
      const requestedMovie = args.join(" ").trim();
      const url = new URL("https://movie-quotes-api.vercel.app/api/v1/quotes");
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const quotes = Array.isArray(data)
        ? data
        : Array.isArray(data.quotes)
          ? data.quotes
          : data.quote
            ? [data]
            : [];

      if (!quotes.length) {
        throw new Error("No quotes returned");
      }

      const matches = requestedMovie
        ? quotes.filter((item) =>
            String(item.movie || item.title || "")
              .toLowerCase()
              .includes(requestedMovie.toLowerCase())
          )
        : quotes;

      if (!matches.length) {
        return sock.sendMessage(
          message.key.remoteJid,
          { text: `❌ No movie quote found for: ${requestedMovie}` },
          { quoted: message }
        );
      }

      const quote = matches[Math.floor(Math.random() * matches.length)];

      await sock.sendMessage(
        message.key.remoteJid,
        {
          text: `🎬 *Movie Quote*\n\n“${quote.quote || quote.text || "No quote"}”\n\n— ${quote.movie || quote.title || "Unknown"}`,
        },
        { quoted: message }
      );
    } catch (error) {
      console.error("Movie quote error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch a movie quote right now." },
        { quoted: message }
      );
    }
  },
};
