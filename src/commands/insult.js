export default {
  name: "insult",
  aliases: ["roast"],
  async execute({ sock, message }) {
    try {
      const r=await fetch("https://evilinsult.com/generate_insult.php?lang=en&type=json");
      const d=await r.json();
      await sock.sendMessage(message.key.remoteJid,{text:`😈 ${d.insult||"No insult returned."}`},{quoted:message});
    } catch(error){console.error("Insult error:",error); await sock.sendMessage(message.key.remoteJid,{text:"❌ Couldn't generate an insult."},{quoted:message});}
  },
};