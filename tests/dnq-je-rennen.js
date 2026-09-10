/**
 * dnq-je-rennen.js — Melder und DNQ je EINZELNEM Rennen, real gegen Spiel.
 *
 *   node tests/dnq-je-rennen.js [jahr] [sims]
 *
 * Der Jahresschnitt verdeckt das Wesentliche: real war DNQ nicht gleichmaessig
 * verteilt, sondern an wenigen Rennen geballt (Monaco 1958: 27 Melder auf 16
 * Plaetze). Erst je Rennen sieht man, ob das Spiel die Ballung nachbildet oder
 * ueberall gleichmaessig zu viele meldet.
 *
 * Referenz ist die Nutzer-Tabelle tools/quellen/renn-meldungen.csv
 * (Summenzeilen mit Anfuehrungszeichen herausfiltern).
 *
 * Befund 1958 (v0.9.18.0): der Deckel getGridSize trifft die reale Starterzahl
 * rennengenau (0,00 Abweichung), die Ballung an Monaco wird nachgebildet - aber
 * Indianapolis bekommt 45 Melder fuer ein 33er-Feld und damit 12 DNQ, wo real
 * null waren. Dazu ueberall ein bis drei Melder zu viel.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX='1';
const fs=require('fs'), path=require('path');
const {getContext}=require('./sim-core');
const ctx=getContext();
const roh=fs.readFileSync(path.join(__dirname,'..','tools','quellen','renn-meldungen.csv'),'utf8');
const liste=new Map();
for (const z of roh.split(/\r?\n/).slice(1)) {
  if (!z||z.includes('"')) continue;
  const f=z.split(','); const jahr=+f[0],runde=+f[1],c=(f[3]||'').trim();
  if(!jahr||!runde||!c||/^[\d.,]*$/.test(c)) continue;
  const gem=+f[4], start=+f[7];
  if(Number.isFinite(start)&&start>0) liste.set(jahr+'|'+runde,{gem,start,dnq:Math.max(0,gem-start)});
}
const JAHR=parseInt(process.argv[2])||1958;
const SIMS=parseInt(process.argv[3])||3;
ctx.initFromYear(JAHR);
console.log('\n1958: Melder und DNQ je Rennen — real gegen Spiel (3 Sims gemittelt)\n');
console.log('R  Strecke               Deckel | real: Meld  DNQ | Spiel: Meld  DNQ  Start');
console.log('─'.repeat(76));
const acc={};
for (let s=0;s<SIMS;s++){
  ctx.initFromYear(JAHR);
  for (let i=0;i<ctx.GAME_STATE.races.length;i++){
    try{
      ctx.applyGuestMoves&&ctx.applyGuestMoves(i);
      ctx.simulateTraining&&ctx.simulateTraining(i);
      ctx.simulateQualifying(i,false);
      const r=ctx.simulateRace(i,false);
      if(!r||!r.results) continue;
      const dnq=(r.dnq||[]).length+(r.dnpq||[]).length, dns=(r.dns||[]).length;
      acc[i]=acc[i]||{meld:0,dnq:0,start:0,n:0};
      acc[i].meld+=r.results.length+dnq+dns; acc[i].dnq+=dnq; acc[i].start+=r.results.length; acc[i].n++;
      ctx.applyRaceResults(r);
    }catch(_){}
  }
}
ctx.initFromYear(JAHR);
let rDnq=0,sDnq=0;
for (let i=0;i<ctx.GAME_STATE.races.length;i++){
  const race=ctx.GAME_STATE.races[i];
  const l=liste.get(JAHR+'|'+(i+1)); const a=acc[i];
  let deckel='?'; try{ deckel=ctx.getGridSize(JAHR,race); }catch(_){}
  if(l) rDnq+=l.dnq;
  if(a&&a.n) sDnq+=a.dnq/a.n;
  console.log(String(i+1).padEnd(3)+String(race.name||'').slice(0,21).padEnd(22)+
    String(deckel).padStart(6)+' |'+
    String(l?l.gem:'-').padStart(11)+String(l?l.dnq:'-').padStart(5)+' |'+
    (a&&a.n?(a.meld/a.n).toFixed(1):'-').padStart(12)+
    (a&&a.n?(a.dnq/a.n).toFixed(1):'-').padStart(5)+
    (a&&a.n?(a.start/a.n).toFixed(1):'-').padStart(7));
}
console.log('─'.repeat(76));
console.log('DNQ gesamt ueber die Saison:  real '+rDnq.toFixed(0)+'   Spiel '+sDnq.toFixed(0));
