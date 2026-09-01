#!/usr/bin/env node
/**
 * RESET-CENTER: BLEIBEN DIE VIER STORES SYNCHRON?
 *
 * Prueft im ECHTEN Browser, ob Loeschen sauber raeumt — Saison fuer Saison und Rennen
 * fuer Rennen. Muss im Browser laufen: die Stores liegen in IndexedDB, sim-core sieht sie
 * nicht.
 *
 * Geprueft wird:
 *   1. deleteSelectedSeasons  → history, history_detail, junior_history, junior_detail
 *      stehen danach auf denselben Jahren wie GAME_STATE.history
 *   2. deleteLastRace         → Rennen, Qualifying UND Training verlieren denselben Index,
 *      und der Stand landet auch im Speicher (nicht nur im Arbeitsspeicher)
 *
 * ⚠ DIE ECHTEN FUNKTIONEN AUFRUFEN, NIEMALS NACHBAUEN. Beim ersten Anlauf hatte ich die
 *   Loeschung von Hand nachgestellt (history filtern + saveGame) und damit genau den
 *   Schritt uebersprungen, um den es ging — _reconcileJuniorStores haengt in
 *   deleteSelectedSeasons. Ergebnis war ein Fehlalarm "Junior-Stores bleiben stehen".
 *
 * Voraussetzung: ein Server auf Port 3000/3333/5000/8080  (npx serve . --listen 3333)
 *
 *   node tests/reset-integrity.js
 *   node tests/reset-integrity.js /archive/f1-rpg-v0.9.17.35.html   (gegen einen Altstand)
 *
 * Der zweite Aufruf ist die Gegenprobe: ein Pruefer, der nur OK sagen kann, ist wertlos.
 * Gegen .35 muessen genau zwei Zeilen ROT werden - der Absturz und das liegengebliebene
 * Training. Faellt dort nichts durch, prueft das Skript nichts.
 */
'use strict';
const { spawn } = require('child_process');
const path = require('path');

const TREIBER = path.join(__dirname, '..', '.claude', 'skills', 'run', 'driver.mjs');

// Jeder Schritt gibt ein JSON-Objekt mit `t` zurueck; alles andere aus dem Treiber ignorieren.
const SCHRITTE = [
    // Junior-Welt an, drei Saisons fahren
    `(async function(){
        GAME_STATE.juniorMode='world';
        await bootstrapJuniorWorld(GAME_STATE.currentYear);
        for(let k=0;k<3;k++){
            const n=GAME_STATE.races.length;
            for(let i=0;i<n;i++){ simulateTraining(i); simulateQualifying(i,false); applyRaceResults(simulateRace(i,false)); }
            updateDriverCareerScores&&updateDriverCareerScores();
            checkCareerEnds&&checkCareerEnds();
            initReservePool(GAME_STATE.currentYear+1);
            processTeamChanges();
            await startNewSeason();
        }
        await new Promise(r=>setTimeout(r,1500));
        await saveGame();
        return {t:'aufbau', jahre:GAME_STATE.history.map(h=>h.year)};
    })()`,

    // Saison loeschen — ueber die ECHTE Funktion, samt Radio-Button wie in der Oberflaeche
    `(function(){
        const j=GAME_STATE.history.map(h=>h.year).sort((a,b)=>a-b);
        const ab=j[1];
        const r=document.createElement('input');
        r.type='radio'; r.name='deleteSeason'; r.value=String(ab); r.checked=true;
        document.body.appendChild(r);
        window.confirm=function(){return true;}; window.alert=function(){};
        deleteSelectedSeasons();
        return {t:'saison_geloescht', ab};
    })()`,

    // Stores gegen den Arbeitsspeicher pruefen
    `(async function(){
        await new Promise(r=>setTimeout(r,2500));
        const st=['history','history_detail','junior_history','junior_detail'];
        const db=await idbOpen(); const o={};
        for(const s of st){
            o[s]=await new Promise(r=>{
                const tx=db.transaction(s,'readonly');
                const q=tx.objectStore(s).getAllKeys();
                q.onsuccess=()=>r(q.result.slice().sort((a,b)=>a-b));
                q.onerror=()=>r(null);
            });
        }
        return {t:'stores', stores:o, ram:GAME_STATE.history.map(h=>h.year).sort((a,b)=>a-b)};
    })()`,

    // Rennen fahren, dann das letzte ueber die ECHTE Funktion loeschen
    `(async function(){
        for(let i=0;i<6;i++){ simulateTraining(i); simulateQualifying(i,false); applyRaceResults(simulateRace(i,false)); }
        await saveGame();
        const vor={r:GAME_STATE.results.length,q:GAME_STATE.qualifyingResults.length,
                   tr:(GAME_STATE.trainingResults||[]).length,cr:GAME_STATE.currentRace};
        window.confirm=function(){return true;}; window.alert=function(){};
        let fehler=null;
        try{ deleteLastRace(); }catch(e){ fehler=e.message; }
        await new Promise(r=>setTimeout(r,800));
        const nach={r:GAME_STATE.results.length,q:GAME_STATE.qualifyingResults.length,
                    tr:(GAME_STATE.trainingResults||[]).length,cr:GAME_STATE.currentRace};
        const c=JSON.parse(await idbGetSafe('f1rpg_core')); const s=c.state||c;
        const store={r:(s.results||[]).length,q:(s.qualifyingResults||[]).length,
                     tr:(s.trainingResults||[]).length,cr:s.currentRace};
        const idx={r:GAME_STATE.results.map(x=>x.raceIndex),
                   q:GAME_STATE.qualifyingResults.map(x=>x.raceIndex),
                   tr:(GAME_STATE.trainingResults||[]).map(x=>x.raceIndex)};
        return {t:'rennen', vor, nach, store, idx, fehler};
    })()`,
];

// Ziel-Seite, z. B. archive/f1-rpg-v0.9.17.35.html. Fuehrender Schraegstrich wird
// ergaenzt: unter Git Bash macht MSYS aus '/archive/...' sonst einen Windows-Pfad
// ('C:/Program Files/Git/archive/...') und der Treiber navigiert ins Leere - der Lauf
// sieht dann gruen aus, weil er die aktuelle Seite geprueft hat.
let ZIEL = process.argv[2] || null;
if (ZIEL && !/^https?:/.test(ZIEL)) ZIEL = '/' + String(ZIEL).replace(/^.*?(archive\/|f1-rpg-)/, '$1').replace(/^\/+/, '');
const eingabe = ['launch', ...(ZIEL ? ['nav ' + ZIEL] : []), ...SCHRITTE.map(s => 'eval ' + s.replace(/\s*\n\s*/g, ' ')), 'errors', 'quit'].join('\n') + '\n';

const kind = spawn('node', [TREIBER], { stdio: ['pipe', 'pipe', 'inherit'] });
let ausgabe = '';
kind.stdout.on('data', c => { ausgabe += c; });
kind.stdin.write(eingabe);
kind.stdin.end();

kind.on('close', () => {
    const daten = {};
    for (const zeile of ausgabe.split('\n')) {
        const s = zeile.trim();
        if (!s.startsWith('{')) continue;
        try { const o = JSON.parse(s); if (o && o.t) daten[o.t] = o; } catch (e) { /* keine Nutzlast */ }
    }
    console.log('\n' + 'RESET-CENTER: RAEUMT DAS LOESCHEN SAUBER?' + (ZIEL ? '   |  Ziel: ' + ZIEL : '') + '\n');
    let fehler = 0;
    const zeigen = (ok, text) => { console.log('   ' + (ok ? '✅' : '❌') + ' ' + text); if (!ok) fehler++; };

    if (!daten.stores || !daten.rennen) {
        console.log('   ❌ Der Treiber hat keine verwertbare Antwort geliefert.');
        console.log('      Laeuft ein Server?  npx serve . --listen 3333\n');
        process.exit(1);
    }

    console.log('1) SAISON LOESCHEN  (deleteSelectedSeasons)');
    const { stores, ram } = daten.stores;
    console.log('   Arbeitsspeicher: [' + ram + ']');
    for (const [name, keys] of Object.entries(stores)) {
        const gleich = keys && keys.length === ram.length && keys.every((y, i) => y === ram[i]);
        zeigen(gleich, name.padEnd(15) + '[' + (keys || '?') + ']');
    }

    console.log('\n2) LETZTES RENNEN LOESCHEN  (deleteLastRace)');
    const { vor, nach, store, idx, fehler: crash } = daten.rennen;
    zeigen(!crash, crash ? 'Aufruf warf: ' + crash : 'Aufruf lief ohne Fehler durch');
    zeigen(nach.r === vor.r - 1, `Rennen ${vor.r} → ${nach.r}`);
    zeigen(nach.q === vor.q - 1, `Qualifying ${vor.q} → ${nach.q}`);
    zeigen(nach.tr === vor.tr - 1, `Training ${vor.tr} → ${nach.tr}   (blieb bis v0.9.17.36 liegen)`);
    zeigen(nach.cr === vor.cr - 1, `Rennzaehler ${vor.cr} → ${nach.cr}`);
    const gleicheIdx = JSON.stringify(idx.r) === JSON.stringify(idx.q) && JSON.stringify(idx.r) === JSON.stringify(idx.tr);
    zeigen(gleicheIdx, 'Rennen, Quali und Training tragen dieselben Indizes: [' + idx.r + ']');
    const imSpeicher = store.r === nach.r && store.q === nach.q && store.tr === nach.tr && store.cr === nach.cr;
    zeigen(imSpeicher, 'Der Stand liegt auch im Speicher, nicht nur im Arbeitsspeicher');

    console.log('');
    console.log(fehler === 0 ? 'OK: Loeschen raeumt sauber.' : `FEHLER: ${fehler} Pruefung(en) fehlgeschlagen.`);
    console.log('');
    process.exit(fehler === 0 ? 0 : 1);
});
