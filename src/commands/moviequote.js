export default {
  name: "moviequote",
  aliases: ["mquote"],
  async execute({ sock, message, args }) {
    try {
      const base="https://movie-quote-api.herokuapp.com/v1";
      const url=args.length ? `${base}/shows/${encodeURIComponent(args.join("-").toLowerCase())}` : `${base}/quote/`;
      const r=await fetch(url); if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const d=await r.json();
      await sock.sendMessage(message.key.remoteJid,{text:`🎬 *Movie Quote*\n\n“${d.quote||d.text||"No quote"}”\n\n— ${d.show||d.movie||d.series||"Unknown"}`},{quoted:message});
    } catch(error){console.error("Movie quote error:",error); await sock.sendMessage(message.key.remoteJid,{text:"❌ Couldn't fetch a movie quote."},{quoted:message});}
  },
};