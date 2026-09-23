export default {
  name: "musicapi",
  aliases: ["jiosaavn"],
  async execute({ sock, message, args }) {
    const base=process.env.JIOSAAVN_API_URL;
    if(!base) return sock.sendMessage(message.key.remoteJid,{text:"❌ JioSaavn API is a self-hosted project. Set JIOSAAVN_API_URL in .env first."},{quoted:message});
    if(!args.length) return sock.sendMessage(message.key.remoteJid,{text:"❌ Usage: +musicapi <song name or JioSaavn URL>"},{quoted:message});
    try {
      const url=new URL("/result/",base); url.searchParams.set("query",args.join(" ")); url.searchParams.set("lyrics","true");
      const r=await fetch(url); if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const d=await r.json(); const item=Array.isArray(d)?d[0]:d.data?.[0]||d;
      await sock.sendMessage(message.key.remoteJid,{text:`🎵 *${item?.title||item?.song||"Result"}*\n👤 ${item?.singers||item?.artist||"Unknown"}\n💿 ${item?.album||"Unknown"}`},{quoted:message});
    } catch(error){console.error("JioSaavn API error:",error); await sock.sendMessage(message.key.remoteJid,{text:"❌ Couldn't fetch JioSaavn data."},{quoted:message});}
  },
};