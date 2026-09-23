export default {
  name: "card",
  aliases: ["tcg"],
  async execute(sock, message, args) {
    try {
      let card;

      if (args.length) {
        const name = args.join(" ");
        const response = await fetch(
          `https://digimoncard.io/api-public/search?n=${encodeURIComponent(name)}&limit=1`
        );

        const data = await response.json();

        if (!response.ok || !Array.isArray(data) || !data.length) {
          return sock.sendMessage(
            message.key.remoteJid,
            { text: `❌ No Digimon card found for: ${name}` },
            { quoted: message }
          );
        }

        card = data[0];
      } else {
        const response = await fetch(
          "https://digimoncard.io/api-public/getAllCards?series=Digimon%20Card%20Game&sort=name&sortdirection=asc"
        );

        const cards = await response.json();

        if (!response.ok || !Array.isArray(cards) || !cards.length) {
          throw new Error("No card list returned");
        }

        const picked = cards[Math.floor(Math.random() * cards.length)];

        const detailResponse = await fetch(
          `https://digimoncard.io/api-public/search?card=${encodeURIComponent(picked.cardnumber)}&limit=1`
        );

        const details = await detailResponse.json();

        if (!detailResponse.ok || !Array.isArray(details) || !details.length) {
          throw new Error("Card details unavailable");
        }

        card = details[0];
      }

      const caption = [
        `🃏 *${card.name}*`,
        `🔢 ID: ${card.id || "N/A"}`,
        `📦 Type: ${card.type || "N/A"}`,
        `🎨 Color: ${card.color || "N/A"}`,
        `⭐ Level: ${card.level ?? "N/A"}`,
        `⚡ Play Cost: ${card.play_cost ?? "N/A"}`,
        `💥 DP: ${card.dp ?? "N/A"}`,
        `💎 Rarity: ${card.rarity || "N/A"}`,
      ].join("\n");

      await sock.sendMessage(
        message.key.remoteJid,
        { text: `${caption}\n\n🔗 https://digimoncard.io/card/${card.pretty_url || ""}` },
        { quoted: message }
      );
    } catch (error) {
      console.error("Digimon TCG command error:", error);
      await sock.sendMessage(
        message.key.remoteJid,
        { text: "❌ Couldn't fetch a Digimon card right now." },
        { quoted: message }
      );
    }
  },
};
