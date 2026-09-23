export default {
  name: "movie",
  aliases: ["imdb"],
  async execute(sock, message, args) {
    const query = args.join(" ").trim();

    if (!query) {
      return sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Usage: +movie <title or IMDb ID>" },
        { quoted: message }
      );
    }

    const key = process.env.RAPIDAPI_KEY;

    if (!key) {
      return sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ RAPIDAPI_KEY is not configured in .env." },
        { quoted: message }
      );
    }

    try {
      const url = new URL("https://movie-database-alternative.p.rapidapi.com/");
      if (/^tt\d+$/i.test(query)) {
        url.searchParams.set("i", query);
      } else {
        url.searchParams.set("t", query);
      }
      url.searchParams.set("r", "json");
      url.searchParams.set("plot", "short");

      const response = await fetch(url, {
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "movie-database-alternative.p.rapidapi.com",
        },
      });

      const data = await response.json();

      if (!response.ok || data.Response === "False") {
        return sock.sendMessage(
          message.key.remoteJid,
          { text: `❌ Movie not found: ${query}` },
          { quoted: message }
        );
      }

      const caption = [
        `🎬 *${data.Title || "Unknown"}* (${data.Year || "N/A"})`,
        `⭐ IMDb: ${data.imdbRating || "N/A"}`,
        `🎭 Genre: ${data.Genre || "N/A"}`,
        `🎞️ Runtime: ${data.Runtime || "N/A"}`,
        `🎬 Director: ${data.Director || "N/A"}`,
        `👥 Cast: ${data.Actors || "N/A"}`,
        "",
        data.Plot || "No plot available.",
      ].join("\n");

      if (data.Poster && data.Poster !== "N/A") {
        await sock.sendMessage(
          message.key.remoteJid,
          { image: { url: data.Poster }, caption },
          { quoted: message }
        );
      } else {
        await sock.sendMessage(
          message.key.remoteJid,
          { text: caption },
          { quoted: message }
        );
      }
    } catch (error) {
      console.error("Movie command error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch movie information right now." },
        { quoted: message }
      );
    }
  },
};
