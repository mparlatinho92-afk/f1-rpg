// generiert-herkunft.js — Wer erzeugt generierte Fahrer, und woher kommen die Debütanten?
//
// ANLASS (Nutzer 05.11.2026): Spielstand Start 1980, Echt-Anteil 100 % — trotzdem drei gen-Fahrer
// (Fricke, Connolly, Fitzgerald). Ursache: Debüt mitten in der Saison (_debuetAusfuehren →
// acquireSeatDriver rookie:true) fand nie einen echten Neuling, weil _isBeginner ein debutYear
// verlangt; der Pool „kommend" hat keins. Sollstand seit dem Fix: bis zur jüngsten echten Saison
// (SEASON_DATA) generiert kein Debüt.
//
// AUSGABE  Debüts je Saison + davon generiert; Herkunft des Debüt-Platzes (Anfänger / kommend mit
//          Abstand zum realen Debüt / Ex-Fahrer / ausgefallen / generiert); ob +1-Einspringer im
//          Folgejahr ein Cockpit haben (Verknüpfung über histId — IDs sind nicht stabil); jeder
//          generateDriver-Aufruf mit Aufrufstapel und Beispieljahren.
// AUFRUF   SIMCORE_FROM_INDEX=1 node tests/generiert-herkunft.js <sims=4> <start=1980> <saisons=5>
const { getContext } = require('./sim-core'); const vm=require('vm');
const ctx = getContext(); const G=()=>ctx.GAME_STATE;
const orig = ctx.generateDriver; const calls=[];
ctx.generateDriver = function(...a){ const d=orig.apply(this,a); if(d){ const st=new Error().stack.split('\n').slice(2,6).map(s=>s.trim().replace(/^at /,'').replace(/\(.*index[^:]*:(\d+):\d+\)/,'@$1')).join(' < '); calls.push({id:d.id,y:G().currentYear,r:G().currentRace||0,st}); } return d; };
let deb=0,debGen=0; const od=ctx._debuetAusfuehren; ctx._debuetAusfuehren=function(...a){const r=od.apply(this,a); if(r){deb++; const id=a[1]&&a[1].fahrerId; if(id&&/^gen-|^exp-/.test(id)) debGen++;} return r;};
const herk={}; const frueh=[]; let fruehMit=0, fruehOhne=0; const fruehBsp=[]; const oa=ctx.acquireSeatDriver; ctx.acquireSeatDriver=function(t,y,o={}){const r=oa.apply(this,arguments); if(o.rookie){const d=r&&r.driver; const k=!d?'ausgefallen':/^gen-|^exp-/.test(d.id)?'generiert':(d.debutYear&&(y-d.debutYear)<1)?'Anfaenger':(!d.debutYear&&!d.lastRacedYear)?('kommend, Debuet real '+((d.nextCockpit&&d.nextCockpit.year)?((d.nextCockpit.year-y>=0?'+':'')+(d.nextCockpit.year-y)):'?')):'Ex-Fahrer'; herk[k]=(herk[k]||0)+1; if(d&&d.nextCockpit&&d.nextCockpit.year===y+1) frueh.push({id:d.id,h:d.histId,name:d.name,ziel:d.nextCockpit.teamName,y:y+1});} return r;};
const SIMS=+process.argv[2]||4, START=+process.argv[3]||1980, SEAS=+process.argv[4]||5;
const agg={}; let saisons=0;
for(let s=0;s<SIMS;s++){ calls.length=0; frueh.length=0; ctx.initFromYear(START);
  const sr=G().simRules; if(s===0) console.log('simRules', JSON.stringify(sr));
  for(let k=0;k<SEAS;k++){ const races=G().races||[];
    for(let i=0;i<races.length;i++){ try{ ctx.applyGuestMoves(i); ctx.simulateTraining(i); const rain=Math.random()<.15; ctx.simulateQualifying(i,rain); const r=ctx.simulateRace(i,rain); if(r) ctx.applyRaceResults(r);}catch(e){} }
    saisons++; ctx.processSeasonEndEvents(); ctx.startNewSeason();
    for(const e of frueh.filter(e=>e.y===G().currentYear)){ const d=G().drivers.find(x=>x.histId&&x.histId===e.h); const tn=d&&d.team&&(G().teams.find(t=>t.id===d.team)||{}).name; if(tn) fruehMit++; else fruehOhne++; if(fruehBsp.length<8) fruehBsp.push(e.name+': real '+e.ziel+', Spiel '+(tn||'ohne Cockpit')); } }
  const ids=new Set([...(G().drivers||[]),...(G().reservePool||[])].map(d=>d.id));
  // auch archivierte Ergebnisse: wer jemals im Feld? -> einfach: alle Aufrufe zaehlen + ob noch existent
  for(const c of calls){ const k=c.st; agg[k]=agg[k]||{n:0,bsp:[]}; agg[k].n++; if(agg[k].bsp.length<3) agg[k].bsp.push(c.y+'R'+c.r+(ids.has(c.id)?'':' (weg)')); }
}
console.log(`Debuets ${deb} (${(deb/saisons).toFixed(2)} je Saison), davon generiert ${debGen}`);
console.log(`+1-Einspringer im Folgejahr: mit Cockpit ${fruehMit}, ohne ${fruehOhne}`); fruehBsp.forEach(b=>console.log('   '+b));
console.log('Herkunft Debuet-Platz:', JSON.stringify(herk));
console.log(`ab ${START}, ${SIMS}x${SEAS} = ${saisons} Saisons`);
for(const [k,v] of Object.entries(agg).sort((a,b)=>b[1].n-a[1].n)) console.log(v.n, k, '|', v.bsp.join(', '));
