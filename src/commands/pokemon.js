const API = "https://pokeapi.co/api/v2/pokemon/";

function titleCase(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getPokemon(name) {
  const response = await fetch(API + encodeURIComponent(name.toLowerCase()));
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`PokéAPI returned ${response.status}`);
  }
  return response.json();
}

function formatTypes(pokemon) {
  return pokemon.types
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => titleCase(entry.type.name))
    .join(" / ");
}

function formatStats(pokemon) {
  const labels = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Attack",
    "special-defense": "Sp. Defense",
    speed: "Speed",
  };

  return pokemon.stats
    .map((entry) => `${labels[entry.stat.name] || titleCase(entry.stat.name)}: ${entry.base_stat}`)
    .join(" • ");
}

export default {
  name: "pokemon",
  aliases: ["poke"],
  async execute({ sock, message, args }) {
    const name = args.join("-").trim();

    if (!name) {
      await sock.sendMessage(message.key.remoteJid, {
        text: "Usage: +pokemon <name>\nExample: +pokemon pikachu",
      });
      return;
    }

    try {
      const pokemon = await getPokemon(name);

      if (!pokemon) {
        await sock.sendMessage(message.key.remoteJid, {
          text: `Pokémon "${name.replace(/-/g, " ")}" was not found.`,
        });
        return;
      }

      const imageUrl =
        pokemon.sprites?.other?.["official-artwork"]?.front_default ||
        pokemon.sprites?.front_default;

      if (!imageUrl) {
        throw new Error("Pokémon has no usable image.");
      }

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Image returned ${imageResponse.status}`);
      }

      const image = Buffer.from(await imageResponse.arrayBuffer());

      const abilities = pokemon.abilities
        .map((entry) => titleCase(entry.ability.name))
        .join(", ");

      const caption = [
        `⚡ *#${String(pokemon.id).padStart(4, "0")} ${titleCase(pokemon.name)}*`,
        "",
        `🏷️ Type: ${formatTypes(pokemon)}`,
        `📏 Height: ${(pokemon.height / 10).toFixed(1)} m`,
        `⚖️ Weight: ${(pokemon.weight / 10).toFixed(1)} kg`,
        `✨ Abilities: ${abilities}`,
        "",
        `📊 ${formatStats(pokemon)}`,
      ].join("\n");

      await sock.sendMessage(message.key.remoteJid, {
        image,
        mimetype: imageResponse.headers.get("content-type") || "image/png",
        caption,
      });
    } catch (error) {
      console.error("[Pokemon] ERROR", error);
      await sock.sendMessage(message.key.remoteJid, {
        text: "Couldn't fetch that Pokémon right now.",
      });
    }
  },
};
