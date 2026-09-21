import { setPrefix } from "../config/prefix.js";

export default {
  name: "setprefix",
  aliases: [],
  async execute({ sock, message, args }) {
    const newPrefix = args.join(" ").trim();

    if (!newPrefix || newPrefix.length > 3 || /\s/.test(newPrefix)) {
      await sock.sendMessage(message.key.remoteJid, {
        text: "Usage: setprefix <prefix>\nExample: setprefix !",
      });
      return;
    }

    await setPrefix(newPrefix);

    await sock.sendMessage(message.key.remoteJid, {
      text: `Prefix changed to: ${newPrefix}`,
    });
  },
};
