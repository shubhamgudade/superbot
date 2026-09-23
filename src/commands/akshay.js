export default {
  name: "akshay",
  aliases: ["akshaykumar"],
  async execute({ sock, message, args }) {
    const code = args[0] || "200";

    try {
      const response = await fetch(
        `https://akshaykumar-rest.vercel.app/api/${encodeURIComponent(code)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("image/")) {
        const imageBuffer = Buffer.from(await response.arrayBuffer());

        await sock.sendMessage(
          message.key.remoteJid,
          {
            image: imageBuffer,
            caption: `🎬 Akshay Kumar — HTTP ${code}`,
          },
          { quoted: message }
        );
        return;
      }

      const raw = await response.text();

      let output = raw;
      try {
        const data = JSON.parse(raw);
        output = data.message || data.text || JSON.stringify(data, null, 2);
      } catch {
        // Some API responses are plain text rather than JSON.
      }

      await sock.sendMessage(
        message.key.remoteJid,
        {
          text: `🎬 Akshay Kumar — HTTP ${code}\n\n${output}`,
        },
        { quoted: message }
      );
    } catch (error) {
      console.error("Akshay command error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch Akshay Kumar data right now." },
        { quoted: message }
      );
    }
  },
};
