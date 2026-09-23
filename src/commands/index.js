import hi from "./hi.js";
import setprefix from "./setprefix.js";
import sticker from "./sticker.js";
import opno from "./opno.js";
import kirk from "./kirk.js";
import carbon from "./carbon.js";
import pokemon from "./pokemon.js";
import avatar from "./avatar.js";
import chuck from "./chuck.js";
import joke from "./joke.js";
import fact from "./fact.js";
import digimon from "./digimon.js";
import tcg from "./tcg.js";
import stardew from "./stardew.js";
import mcu from "./mcu.js";
import lyrics from "./lyrics.js";
import wiki from "./wiki.js";
import insult from "./insult.js";
import indianquote from "./indianquote.js";
import moviequote from "./moviequote.js";
import covid from "./covid.js";
import akshay from "./akshay.js";
import translate from "./translate.js";
import musicapi from "./musicapi.js";
import gaanaapi from "./gaanaapi.js";
import { wanted, criminal, jail } from "./photoeffects.js";

const commands = new Map();

for (const command of [hi, setprefix, sticker, opno, kirk, carbon, pokemon, avatar, chuck, joke, fact, digimon, tcg, stardew, mcu, lyrics, wiki, insult, indianquote, moviequote, covid, akshay, translate, musicapi, gaanaapi, wanted, criminal, jail]) {
  commands.set(command.name, command);

  for (const alias of command.aliases || []) {
    commands.set(alias, command);
  }
}

export function getCommand(name) {
  return commands.get(name.toLowerCase());
}
