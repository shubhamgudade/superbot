import hi from "./hi.js";
import setprefix from "./setprefix.js";
import sticker from "./sticker.js";
import opno from "./opno.js";

const commands = new Map();

for (const command of [hi, setprefix, sticker, opno]) {
  commands.set(command.name, command);

  for (const alias of command.aliases || []) {
    commands.set(alias, command);
  }
}

export function getCommand(name) {
  return commands.get(name.toLowerCase());
}
