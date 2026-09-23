export default {
  name: "translate",
  aliases: ["tr"],
  async execute({ sock, message, args }) {
    const target=args[0]; const text=args.slice(1).join(" ");
    if(!target || !text) return sock.sendMessage(message.key.remoteJid,{text:"❌ Usage: +translate <language> <text>"},{quoted:message});
    try {
      const body={q:text,source:"auto",target};
      if(process.env.LIBRETRANSLATE_API_KEY) body.api_key=process.env.LIBRETRANSLATE_API_KEY;
      const r=await fetch("https://libretranslate.com/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||`HTTP ${r.status}`);
      await sock.sendMessage(message.key.remoteJid,{text:`🌐 ${d.translatedText}`},{quoted:message});
    } catch(error){console.error("Translate error:",error); await sock.sendMessage(message.key.remoteJid,{text:"❌ Translation failed. If LibreTranslate asks for a key, add LIBRETRANSLATE_API_KEY to .env."},{quoted:message});}
  },
};