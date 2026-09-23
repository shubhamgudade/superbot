import hi from "./hi.js";
import setprefix from "./setprefix.js";
import sticker from "./sticker.js";
import opno from "./opno.js";
import kirk from "./kirk.js";
import carbon from "./carbon.js";
import pokemon from "./pokemon.js";
import { wanted, criminal, jail } from "./photoeffects.js";

const commands = new Map();

for (const command of [hi, setprefix, sticker, opno, kirk, carbon, pokemon, wanted, criminal, jail]) {
  commands.set(command.name, command);

  for (const alias of command.aliases || []) {
    commands.set(alias, command);
  }
}

export function getCommand(name) {
  return commands.get(name.toLowerCase());
}
