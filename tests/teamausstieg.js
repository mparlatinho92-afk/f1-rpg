// teamausstieg.js — Fahrer eines ausgestiegenen Teams im Saisonende-Fenster (Browser).
//
// ANLASS (Nutzer 05.11.2026): Gibt ein Team auf, war der Fahrer im Fenster entweder unsichtbar
// (aktiv, ohne Team, keine Zeile) oder als Nicht-Verlängerung/Entlassung verbucht. Seit
// v0.9.21.33 markiert applyTeamExits die Fahrer (_teamExit) und executeTransfer verbucht sie als
// 'teamexit'. Start 1980 (Shadow steigt aus), 12 Saisonenden.
//
// AUSGABE  exitFahrer (lebend), zeile = „Team ausgestiegen (Shadow) → ohne Cockpit", neuBei =
//          „Shadow ausgestiegen → <neues Team>", entlassen = am Saisonende als dismissed verbucht
//          (Entlassungen mitten in der Saison wegen Leistung zählen nicht).
//          kopfOk = Steckbrief-Kopf nennt „Shadow ausgestiegen" (mit UND ohne neues Team).
//          Sollstand: zeile + neuBei = exitFahrer = kopfOk, entlassen 0. Screenshots des ersten Falls nach
//          tests/output/teamausstieg-nachher-*.png.
// AUFRUF   node tests/teamausstieg.js
const { chromium } = require('playwright'); const path=require('path'); const {pathToFileURL}=require('url');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:900,height:1000}}); const err=[]; p.on('pageerror',e=>err.push(e.message));
await p.goto(pathToFileURL(path.join(process.cwd(),'index.html')).href,{waitUntil:'load'}); await p.waitForTimeout(2500);
const stat={laeufe:0,exitFahrer:0,zeile:0,entlassen:0,neuBei:0,kopfOk:0}; let found=null, foundNeu=null;
for(let v=0; v<12; v++){
 const r=await p.evaluate(async (brauche)=>{ window.alert=()=>{}; window.confirm=()=>true;
  initFromYear(1980); simulateSeasonRaces(); await showSeasonEndModal(); await new Promise(r=>setTimeout(r,1000));
  const ex=GAME_STATE.drivers.filter(d=>d._teamExit&&d._teamExit.year===GAME_STATE.currentYear&&d.status!=='deceased'&&d.status!=='retired');
  const lines=[...document.querySelectorAll('div.text-sm')].map(e=>e);
  const o={exit:ex.length,zeile:0,entl:0,neu:0,kopf:0,ziel:null,neuFall:null};
  for(const d of ex){ const l=lines.filter(e=>e.innerText.includes(d.name)).map(e=>e.innerText);
    if(l.some(t=>/Team ausgestiegen \(Shadow\) → ohne Cockpit/.test(t))) o.zeile++;
    if(l.some(t=>/Shadow ausgestiegen → (?!ohne)/.test(t))) o.neu++;
    if((GAME_STATE.seasonRetirements||[]).some(e=>e.driver===d.id&&e.type==='dismissed'&&!e.midSeason)) o.entl++;
    const w=offseasonTeamwechsel(d.id); if(w&&w.ausstieg==='Shadow ausgestiegen') o.kopf++; else if(!o.kopfFehlt) o.kopfFehlt=d.name+': w='+JSON.stringify(w)+' rz='+JSON.stringify(teamZurRennzeit(d.id))+' team='+d.team;
    if(d.team&&!o.neuFall) o.neuFall={id:d.id,name:d.name}; }
  if(brauche){ const z=ex.find(d=>!d.team); if(z){ const zl=lines.find(e=>/Team ausgestiegen/.test(e.innerText)&&e.innerText.includes(z.name)); if(zl){ zl.style.outline='3px solid #f59e0b'; zl.scrollIntoView({block:'center'}); o.ziel={id:z.id,name:z.name}; } } }
  return o; }, !found);
 stat.laeufe++; stat.exitFahrer+=r.exit; stat.zeile+=r.zeile; stat.entlassen+=r.entl; stat.neuBei+=r.neu; stat.kopfOk+=r.kopf; if(r.kopfFehlt) console.log('Kopf ohne Hinweis:', r.kopfFehlt);
 if(r.neuFall && !foundNeu){ foundNeu=r.neuFall; await p.evaluate(async (id)=>{ document.querySelectorAll('.fixed').forEach(e=>{ if(e.id!=='driverProfileModal') e.style.display='none'; }); await openDriverProfile(id); await new Promise(r=>setTimeout(r,800)); }, foundNeu.id);
   await p.screenshot({path:'tests/output/teamausstieg-nachher-steckbrief-neuesteam.png', clip:{x:0,y:0,width:900,height:420}});
   await p.evaluate(()=>{ if(typeof closeDriverProfile==='function') closeDriverProfile(); document.querySelectorAll('.fixed').forEach(e=>e.style.display=''); }); }
 if(r.ziel && !found){ found=r.ziel; await p.waitForTimeout(300); await p.screenshot({path:'tests/output/teamausstieg-nachher-saisonende.png'});
   await p.evaluate(async (id)=>{ document.querySelectorAll('.fixed').forEach(e=>{ if(e.id!=='driverProfileModal') e.style.display='none'; }); await openDriverProfile(id); await new Promise(r=>setTimeout(r,800)); }, found.id);
   await p.screenshot({path:'tests/output/teamausstieg-nachher-steckbrief.png', clip:{x:0,y:0,width:900,height:420}});
   await p.evaluate(()=>{ if(typeof closeDriverProfile==='function') closeDriverProfile(); document.querySelectorAll('.fixed').forEach(e=>e.style.display=''); }); }
}
console.log(JSON.stringify(stat), 'Fall:', found&&found.name, '| mit neuem Team:', foundNeu&&foundNeu.name); console.log(err.length?'pageerror '+err.slice(0,2).join(' | '):'kein pageerror'); await b.close();})();
