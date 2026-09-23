export default {
  name: "lyrics",
  aliases: ["lyric"],
  async execute({ sock, message, args }) {
    if (!args.length) {
      return sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Usage: +lyrics Song Name - Artist" },
        { quoted: message }
      );
    }

    const input = args.join(" ").trim();
    const parts = input.split(/\s+-\s+/, 2);
    const trackName = parts[0].trim();
    const artistName = (parts[1] || "").trim();

    try {
      const searchUrl = new URL("https://lrclib.net/api/search");
      searchUrl.searchParams.set("track_name", trackName);
      if (artistName) searchUrl.searchParams.set("artist_name", artistName);

      const response = await fetch(searchUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "SuperBot/0.1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const results = await response.json();

      if (!Array.isArray(results) || !results.length) {
        return sock.sendMessage(
          message.key.remoteJid,
          { text: "❌ Lyrics not found. Try: +lyrics Song Name - Artist" },
          { quoted: message }
        );
      }

      const data =
        results.find((item) => item.plainLyrics || item.syncedLyrics) ||
        results[0];

      const lyrics = data.plainLyrics || data.syncedLyrics;

      if (!lyrics) {
        return sock.sendMessage(
          message.key.remoteJid,
          { text: "❌ Lyrics were found, but no lyric text is available." },
          { quoted: message }
        );
      }

      const title = data.trackName || trackName;
      const artist = data.artistName || artistName;

      await sock.sendMessage(
        message.key.remoteJid,
        {
          text: `🎵 *${title}*${artist ? ` - ${artist}` : ""}\n\n${lyrics}`,
        },
        { quoted: message }
      );
    } catch (error) {
      console.error("Lyrics error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch lyrics right now." },
        { quoted: message }
      );
    }
  },
};
