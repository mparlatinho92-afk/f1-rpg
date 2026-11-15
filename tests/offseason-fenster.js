// offseason-fenster.js — die drei Off-Season-Fenster als Bild/Text (Browser).
//
// ANLASS (Nutzer 15.11.2026): Audi/Cadillac fehlten in den Fenstern; jede Fahrerbewegung soll
// Herkunft und Ziel zeigen, bei Tod/Ruecktritt das Team (bei mehreren: alle) der abgelaufenen Saison.
// ABLAUF   initFromYear(JAHR), Saison simulieren, Saisonende-Fenster, Bestaetigungsdialog (Text, als
//          nachgestelltes Bild), Saisonstart-Fenster. Dazu Konsolen-Pruefung: Fahrer mit mehreren
//          Teams, Tote/Ruecktritte mit Team-Label, Anzahl „ohne Cockpit“ bei Ruecktritten (Soll 0).
// AUSGABE  tests/output/offseason-<TAG>-1-saisonende.png, -2-bestaetigung.png/.txt,
//          -3a-saisonstart-oben.png, -3-saisonstart.png
// AUFRUF   node tests/offseason-fenster.js [Jahr=2025] [Tag=Jahr]   (1965: Tote und Mehrteam-Fahrer)
const { chromium } = require('playwright'); const path=require('path'); const {pathToFileURL}=require('url');
const JAHR = +(process.argv[2]||2025), TAG = process.argv[3]||String(JAHR);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1000,height:1300}}); const err=[]; p.on('pageerror',e=>err.push(e.message));
await p.goto(pathToFileURL(path.join(process.cwd(),'index.html')).href,{waitUntil:'load'}); await p.waitForTimeout(2500);
await p.evaluate(async(J)=>{ window.alert=()=>{}; window.__conf=[]; window.confirm=(m)=>{window.__conf.push(m); return true;};
  initFromYear(J); simulateSeasonRaces(); await showSeasonEndModal(); await new Promise(r=>setTimeout(r,1200)); }, JAHR);
// Fenster 1: Saisonende — ganzen Inhalt fotografieren
const shotModal = async (id, file) => { await p.evaluate(id=>{ const m=document.getElementById(id); m.style.position='absolute'; m.style.height='auto'; m.querySelectorAll('*').forEach(e=>{ const o=getComputedStyle(e).overflowY; if(o==='auto'||o==='scroll'){e.style.maxHeight='none'; e.style.overflow='visible';} const mh=getComputedStyle(e).maxHeight; if(mh&&mh!=='none'){e.style.maxHeight='none';} e.scrollTop=0; }); window.scrollTo(0,0); }, id);
  await p.waitForTimeout(300); const el = await p.$('#'+id+' > *'); await (el||await p.$('#'+id)).screenshot({path:file}); };
await shotModal('seasonEndModal', `tests/output/offseason-${TAG}-1-saisonende.png`);
const info1 = await p.evaluate(()=>{ const t=document.body.innerText; return { teamsBlock: (t.match(/🏁 Teams \d+[\s\S]{0,200}/)||[''])[0].slice(0,200) }; });
// Fenster 2: Bestaetigungsdialog (Text) -> Fenster 3 Saisonstart
await p.evaluate(()=>{ document.getElementById('seasonEndModal').style.display='none'; window.confirm=(m)=>{window.__conf.push(m); return true;}; createNewSeason(); });
await p.waitForTimeout(800);
const conf = await p.evaluate(()=>window.__conf[window.__conf.length-1]||'');
require('fs').writeFileSync(`tests/output/offseason-${TAG}-2-bestaetigung.txt`, conf);
{ const p2 = await b.newPage({viewport:{width:560,height:400}}); await p2.setContent(`<body style="margin:0;background:#202124;font:14px system-ui"><div style="margin:16px;padding:20px;border-radius:8px;background:#2d2e31;color:#e8eaed;box-shadow:0 4px 16px #0008"><div style="font-size:12px;color:#9aa0a6;margin-bottom:10px">Diese Seite meldet</div><pre style="white-space:pre-wrap;font:14px system-ui;margin:0">${conf.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</pre><div style="text-align:right;margin-top:14px"><span style="padding:6px 16px;border-radius:16px;background:#8ab4f8;color:#202124">OK</span> <span style="padding:6px 16px;border:1px solid #5f6368;border-radius:16px;color:#8ab4f8">Abbrechen</span></div></div></body>`); await p2.screenshot({path:`tests/output/offseason-${TAG}-2-bestaetigung.png`, fullPage:true}); await p2.close(); }
await p.screenshot({path:`tests/output/offseason-${TAG}-3a-saisonstart-oben.png`}); await shotModal('seasonStartModal', `tests/output/offseason-${TAG}-3-saisonstart.png`);
// Pruefung: Mehrteam-Fahrer und Tote/Ruecktritte mit Team
const chk = await p.evaluate(()=>{ const multi = GAME_STATE.drivers.concat(GAME_STATE.reservePool||[]).map(d=>({n:d.name, l:saisonTeamsVon(d.id)})).filter(x=>x.l.length>1);
  const tote=(GAME_STATE.seasonDeaths||[]).map(d=>d.name+' ('+saisonTeamLabel(d.driver,d.team)+')'); const rt=(GAME_STATE.seasonRetirements||[]).map(r=>r.name+' ('+saisonTeamLabel(r.driver)+')');
  return { multi: multi.slice(0,6).map(x=>x.n+': '+x.l.join(' / ')), tote, ruecktritte: rt.slice(0,8), ohneCockpit: rt.filter(x=>/ohne Cockpit/.test(x)).length }; });
console.log(JSON.stringify({info1, chk}, null, 1)); console.log('--- Bestätigung ---\n'+conf.split('\n').slice(0,40).join('\n'));
console.log(err.length?'pageerror '+err.slice(0,2).join(' | '):'kein pageerror'); await b.close();})();
