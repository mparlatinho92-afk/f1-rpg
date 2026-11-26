/**
 * pace-dauerlauf.js — Pace realer und generierter Fahrer über eine Saisonkette nach dem Datenende (26.11.2026)
 * Je Saison Median real/generiert, Top-5-Ø, Verlauf Pace/Potenzial der realen Fahrer des Startfelds (Sim 1).
 * Aufruf: SIMCORE_FROM_INDEX=1 node tests/pace-dauerlauf.js [Startjahr=2025] [Saisons=11] [Sims=2]
 */
const { getContext } = require('./sim-core');
const [JAHR=2025,SAISONS=11,SIMS=2]=process.argv.slice(2).map(Number);const ctx=getContext();
const med=a=>{const b=[...a].sort((x,y)=>x-y);return b.length?b[b.length>>1]:NaN};
const acc=[],verf={};
for(let s=0;s<SIMS;s++){ctx.initFromYear(JAHR);
for(let k=0;k<SAISONS;k++){const gs=ctx.GAME_STATE,y=gs.currentYear;
 const feld=gs.drivers.filter(d=>d.team&&(!d.status||d.status==='active'));const a=acc[k]??={jahr:y,real:[],gen:[],top:[]};
 for(const d of feld){(d.histId?a.real:a.gen).push(d.pace);}
 a.top.push(...feld.map(d=>d.pace).sort((x,y)=>y-x).slice(0,5));
 if(s===0)for(const d of feld)if(d.histId&&(k===0||verf[d.histId]))(verf[d.histId]??={b:d.birthYear,v:[]}).v[k]=Math.round(d.pace)+'/'+Math.round(d.potentialPace||0);
 if(k===SAISONS-1)break;
 for(let i=0;i<gs.races.length;i++){try{ctx.simulateTraining(i);ctx.simulateQualifying(i,false);const r=ctx.simulateRace(i,false);if(r)ctx.applyRaceResults(r);}catch(e){}}
 ctx.processSeasonEndEvents();ctx.startNewSeason();}}
console.log('Jahr  real-Median(n)  gen-Median(n)  Top5-Ø');
for(const a of acc)console.log(a.jahr,med(a.real),'('+a.real.length+')',med(a.gen),'('+a.gen.length+')',(a.top.reduce((s,x)=>s+x,0)/a.top.length).toFixed(1));
for(const[h,o]of Object.entries(verf).slice(0,22))console.log(h.padEnd(24),String(JAHR-o.b).padStart(3),o.v.map(x=>x==null?'   –   ':x.padStart(7)).join(''));
