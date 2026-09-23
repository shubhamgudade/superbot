export default {
  name: "akshay",
  aliases: ["akshaykumar"],
  async execute(sock, message, args) {
    const code = args[0] || "200";
    try {
      const r = await fetch(`https://akshaykumar-rest.vercel.app/api/${encodeURIComponent(code)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      await sock.sendMessage(message.key.remoteJid,{text:`🎬 Akshay Kumar — HTTP ${code}\n\n${data.message || data.text || JSON.stringify(data)}`},{quoted:message});
    } catch(error){console.error("Akshay command error:",error); await sock.sendMessage(message.key.remoteJid,{text:"❌ Couldn't fetch Akshay Kumar data."},{quoted:message});}
  },
};