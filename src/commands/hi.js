export default {
  name: "hi",
  aliases: [],
  async execute({ sock, message }) {
    await sock.sendMessage(message.key.remoteJid, {
      text: "Hi 👋",
    });
  },
};
