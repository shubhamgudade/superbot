export default {
  name: "wiki",
  aliases: ["wikipedia"],
  async execute(sock, message, args) {
    if(!args.length) return sock.sendMessage(message.key.remoteJid,{text:"❌ Usage: +wiki search term"},{quoted:message});
    const url=new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action","query"); url.searchParams.set("list","search"); url.searchParams.set("srsearch",args.join(" ")); url.searchParams.set("srlimit","1"); url.searchParams.set("format","json"); url.searchParams.set("origin","*");
    try {
      const r=await fetch(url); const d=await r.json(); const hit=d.query?.search?.[0];
      if(!hit) return sock.sendMessage(message.key.remoteJid,{text:"❌ No Wikipedia result found."},{quoted:message});
      const title=hit.title; const page=new URL("https://en.wikipedia.org/w/api.php");
      page.searchParams.set("action","query"); page.searchParams.set("prop","extracts"); page.searchParams.set("exintro","1"); page.searchParams.set("explaintext","1"); page.searchParams.set("titles",title); page.searchParams.set("format","json"); page.searchParams.set("origin","*");
      const p=await (await fetch(page)).json(); const pages=Object.values(p.query.pages); const extract=pages[0]?.extract||"No summary.";
      await sock.sendMessage(message.key.remoteJid,{text:`📚 *${title}*\n\n${extract.slice(0,3500)}\n\n🔗 https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ","_"))}`},{quoted:message});
    } catch(error){console.error("Wiki error:",error); await sock.sendMessage(message.key.remoteJid,{text:"❌ Couldn't search Wikipedia."},{quoted:message});}
  },
};