// megasim-bedienung.js — Bedienung des Mega-Sim (Handout P7 aus Bundesliga Architect, Schritt 6), Browser.
//
//   node tests/megasim-bedienung.js      (~1 Min.)
//
// 1) 3 Saisons ab 1980: Dialogtext (Vorgabe 10, Obergrenze 250, Zielsaison), Zusammenfassung mit
//    Weltmeistern im Lauf, Knopf „Schließen"; Screenshot tests/output/megasim-zusammenfassung.png
// 2) 10 Saisons, nach der 2. „Stoppen": hält nach der laufenden Saison an (3 gerechnet), Knopf beim
//    Start wieder „⏹ Stoppen" (Lehre 2)
// 3) Schließen, sofort 1 Saison neu: es darf genau 1 Jahr dazukommen und nach dem Schließen keins mehr
//    (kein Lauf im Hintergrund, Lehre 2b). Dazu pageerror.
const { chromium } = require('playwright'); const path=require('path'); const {pathToFileURL}=require('url');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:900,height:900}}); const err=[]; p.on('pageerror',e=>err.push(e.message));
let antwort='3'; const prompts=[];
p.on('dialog', async d=>{ if(d.type()==='prompt'){ prompts.push(d.message()); await d.accept(antwort);} else await d.accept(); });
await p.goto(pathToFileURL(path.join(process.cwd(),'index.html')).href,{waitUntil:'load'}); await p.waitForTimeout(2500);
await p.evaluate(()=>{ initFromYear(1980); renderAll(); });
const warte = async (bed, ms=180000)=>{ const t=Date.now(); while(Date.now()-t<ms){ if(await p.evaluate(bed)) return true; await p.waitForTimeout(300);} return false; };
const zustand = ()=>p.evaluate(()=>({jahr:GAME_STATE.currentYear, c:document.getElementById('megasim-counter').innerText, s:document.getElementById('megasim-season').innerText, u:document.getElementById('megasim-uhr').innerText, btn:document.getElementById('megasim-btn').innerText.trim(), sum:document.getElementById('megasim-summary').innerText.replace(/\n+/g,' | ').slice(0,400)}));
// 1) 3 Saisons
await p.evaluate(()=>megaSim());
await warte(()=>document.getElementById('megasim-btn').innerText.includes('Schließen'));
console.log('1) Prompt:', prompts[0].replace(/\n/g,' / ')); console.log('1)', JSON.stringify(await zustand()));
await p.screenshot({path:'tests/output/megasim-zusammenfassung.png'});
await p.evaluate(()=>document.getElementById('megasim-btn').click());
// 2) 10 Saisons, nach der 2. stoppen
antwort='10'; const j0=await p.evaluate(()=>GAME_STATE.currentYear);
await p.evaluate(()=>megaSim());
console.log('2) Knopf beim Start:', (await zustand()).btn);
await warte(()=>/^2 \//.test(document.getElementById('megasim-counter').innerText));
await p.evaluate(()=>document.getElementById('megasim-btn').click());
await warte(()=>document.getElementById('megasim-btn').innerText.includes('Schließen'));
console.log('2)', JSON.stringify(await zustand()), 'Jahre gerechnet:', (await p.evaluate(()=>GAME_STATE.currentYear))-j0);
// 3) schliessen, sofort neu (1 Saison) -> danach darf das Jahr nur um 1 steigen
await p.evaluate(()=>document.getElementById('megasim-btn').click());
antwort='1'; const j1=await p.evaluate(()=>GAME_STATE.currentYear);
await p.evaluate(()=>megaSim());
await warte(()=>document.getElementById('megasim-btn').innerText.includes('Schließen'));
await p.waitForTimeout(1500);
console.log('3) Jahre gerechnet:', (await p.evaluate(()=>GAME_STATE.currentYear))-j1, JSON.stringify((await zustand()).c));
await p.evaluate(()=>document.getElementById('megasim-btn').click()); await p.waitForTimeout(1500);
console.log('3) nach Schliessen weiter gerechnet:', (await p.evaluate(()=>GAME_STATE.currentYear))-j1-1, '| Overlay sichtbar:', await p.evaluate(()=>document.getElementById('megasim-overlay').style.display));
console.log(err.length?'pageerror '+err.slice(0,2).join(' | '):'kein pageerror'); await b.close();})();
