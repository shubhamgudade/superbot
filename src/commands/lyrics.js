export default {
  name: "lyrics",
  aliases: ["lyric"],
  async execute({ sock, message, args }) {
    if (!args.length) return sock.sendMessage(message.key.remoteJid,{text:"❌ Usage: +lyrics Song Name - Artist"}, {quoted:message});
    const parts=args.join(" - ").split(" - ");
    const track_name=parts[0].trim();
    const artist_name=(parts[1]||"").trim();
    try {
      const url=new URL("https://lrclib.net/api/get");
      url.searchParams.set("track_name",track_name);
      if(artist_name) url.searchParams.set("artist_name",artist_name);
      const response=await fetch(url,{headers:{"User-Agent":"Superbot/0.1.0 (https://github.com/shubhamgudade/superbot)"}});
      if(!response.ok) return sock.sendMessage(message.key.remoteJid,{text:"❌ Lyrics not found."},{quoted:message});
      const data=await response.json();
      await sock.sendMessage(message.key.remoteJid,{text:`🎵 *${data.trackName||track_name}*${data.artistName?" - "+data.artistName:""}\n\n${data.plainLyrics||"Lyrics unavailable."}`},{quoted:message});
    } catch(error){ console.error("Lyrics error:",error); await sock.sendMessage(message.key.remoteJid,{text:"❌ Couldn't fetch lyrics."},{quoted:message}); }
  },
};