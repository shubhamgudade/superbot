export default {
  name: "gaanaapi",
  aliases: ["gaana"],
  async execute(sock, message, args) {
    const base=process.env.GAANA_API_URL;
    if(!base) return sock.sendMessage(message.key.remoteJid,{text:"❌ Gaana API is a self-hosted project. Set GAANA_API_URL in .env first."},{quoted:message});
    if(!args.length) return sock.sendMessage(message.key.remoteJid,{text:"❌ Usage: +gaana <Gaana song URL>"},{quoted:message});
    try {
      const url=new URL("/result/",base); url.searchParams.set("url",args[0]); url.searchParams.set("lyrics","true");
      const r=await fetch(url); if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const d=await r.json();
      await sock.sendMessage(message.key.remoteJid,{text:`🎵 *${d.title||"Gaana Song"}*\n👤 ${d.artist||"Unknown"}\n💿 ${d.album||"Unknown"}\n⏱️ ${d.duration||"Unknown"}`},{quoted:message});
    } catch(error){console.error("Gaana API error:",error); await sock.sendMessage(message.key.remoteJid,{text:"❌ Couldn't fetch Gaana data."},{quoted:message});}
  },
};