export default {
  name: "covid",
  aliases: ["covid19"],
  async execute(sock, message) {
    try {
      const r=await fetch("https://data.covid19india.org/v4/min/data.min.json");
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const d=await r.json();
      const states=Object.entries(d).filter(([k])=>k.length===2);
      const total=states.reduce((a,[,v])=>({confirmed:a.confirmed+(v.total?.confirmed||0),deceased:a.deceased+(v.total?.deceased||0),recovered:a.recovered+(v.total?.recovered||0)}),{confirmed:0,deceased:0,recovered:0});
      await sock.sendMessage(message.key.remoteJid,{text:`🦠 *COVID-19 India*\n\nConfirmed: ${total.confirmed}\nRecovered: ${total.recovered}\nDeceased: ${total.deceased}\n\n⚠️ Historical dataset; not live reporting.`},{quoted:message});
    } catch(error){console.error("COVID error:",error); await sock.sendMessage(message.key.remoteJid,{text:"❌ COVID India data is unavailable."},{quoted:message});}
  },
};