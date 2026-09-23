export default {
  name: "iquote",
  aliases: ["indianquote","quote"],
  async execute(sock, message) {
    try {
      const r=await fetch("https://indian-quotes-api.vercel.app/api/quotes/random");
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const d=await r.json();
      await sock.sendMessage(message.key.remoteJid,{text:`🇮🇳 *${d.quote}*\n\n— ${d.author?.name||"Unknown"}`},{quoted:message});
    } catch(error){console.error("Indian quote error:",error); await sock.sendMessage(message.key.remoteJid,{text:"❌ Couldn't fetch an Indian quote."},{quoted:message});}
  },
};