/**
 * ticker-vs-sim.js — Sofort-Simulation, Live-Ticker und REALITÄT im Vergleich.
 *
 *   node tests/ticker-vs-sim.js [jahr] [rennen] [laeufe]
 *   node tests/ticker-vs-sim.js 1950 0 300              Silverstone 1950
 *   node tests/ticker-vs-sim.js 1950 0 300 --aera=1950-1959
 *
 * Prueft die VERBINDLICHE Regel aus CLAUDE.md: klassische Simulation und
 * Live-Ticker muessen fuer dasselbe Rennen identische Ergebnisse liefern.
 * Der Ticker ist nur das "Wie" — die Zahlen entstehen in EINER Engine.
 *
 * Gemessen wird nicht ein einzelnes Rennen (beide wuerfeln), sondern die
 * VERTEILUNG ueber viele Laeufe. Dazu die dritte Spalte: das echte Ergebnis
 * aus F1DB, einmal fuer genau dieses Rennen und einmal als Ära-Schnitt.
 *
 * ▶ Schwerpunkt QUALIFYING → RENNEN. Nicht nur wer gewinnt, sondern wie sich
 *   das Feld vom Startplatz aus entwickelt: bleibt der Polesetter vorn, kommt
 *   Startplatz 8 nach vorn, wie gross ist die Verschiebung ueberhaupt. Ein
 *   Modell kann die richtigen Sieger liefern und die Renndynamik verfehlen.
 *
 * Reale Referenz aus f1db-json-splitted/:
 *   f1db-races-starting-grid-positions.json  (Startaufstellung)
 *   f1db-races-race-results.json             (Zielergebnis)
 * positionNumber ist dort null bei Ausfall/nicht gewertet.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const JAHR = parseInt(args[0]) || 1950;
const RENNEN = parseInt(args[1]) || 0;
const N = parseInt(args[2]) || 200;
const aeraFlag = (flags.find(f => f.startsWith('--aera=')) || '').split('=')[1];
const [AERA_VON, AERA_BIS] = aeraFlag
    ? aeraFlag.split('-').map(Number)
    : [Math.floor(JAHR / 10) * 10, Math.floor(JAHR / 10) * 10 + 9];

const F1DB = path.join(__dirname, '..', 'f1db-json-splitted');
const lade = f => JSON.parse(fs.readFileSync(path.join(F1DB, f), 'utf8'));

/* ═══════════════ REALE DATEN ═══════════════ */
const races = lade('f1db-races.json');
const grids = lade('f1db-races-starting-grid-positions.json');
const ergs = lade('f1db-races-race-results.json');

const gridNachRace = new Map();
for (const x of grids) {
    if (!x.positionNumber) continue;
    if (!gridNachRace.has(x.raceId)) gridNachRace.set(x.raceId, new Map());
    gridNachRace.get(x.raceId).set(x.driverId, x.positionNumber);
}
const ergNachRace = new Map();
for (const r of ergs) {
    if (!ergNachRace.has(r.raceId)) ergNachRace.set(r.raceId, []);
    ergNachRace.get(r.raceId).push(r);
}

function realePaare(raceId) {
    const g = gridNachRace.get(raceId);
    const e = ergNachRace.get(raceId);
    if (!g || !e) return [];
    const paare = [];
    for (const r of e) {
        const gp = g.get(r.driverId);
        if (!gp) continue;                       // nicht gestartet
        const ziel = r.positionNumber;           // null = ausgefallen
        paare.push({ grid: gp, ziel: (ziel === null || ziel === undefined) ? null : ziel });
    }
    return paare;
}

/* ═══════════════ KENNZAHLEN ═══════════════ */
function neueBox() {
    return {
        laeufe: 0, starter: 0, dnf: 0,
        poleSiege: 0, poleLaeufe: 0,
        siegerGrid: [], verschiebung: [], netto: [],
        top3AusTop3: 0, top3Gesamt: 0,
        vonAcht: []
    };
}

function verrechne(box, paare) {
    if (!paare.length) return;
    box.laeufe++;
    const gewertet = paare.filter(p => p.ziel !== null);
    box.starter += paare.length;
    box.dnf += paare.length - gewertet.length;

    const pole = paare.find(p => p.grid === 1);
    if (pole) { box.poleLaeufe++; if (pole.ziel === 1) box.poleSiege++; }

    const sieger = gewertet.find(p => p.ziel === 1);
    if (sieger) box.siegerGrid.push(sieger.grid);

    for (const p of gewertet) {
        box.verschiebung.push(Math.abs(p.grid - p.ziel));
        box.netto.push(p.grid - p.ziel);
        if (p.ziel <= 3) { box.top3Gesamt++; if (p.grid <= 3) box.top3AusTop3++; }
    }
    const acht = paare.find(p => p.grid === 8);
    if (acht) box.vonAcht.push(acht.ziel);
}

const mittel = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
const proz = (t, g) => g ? (t / g * 100) : null;
const zeig = (v, nk) => (v === null || v === undefined) ? '–' : v.toFixed(nk);

/* ═══════════════ SPIEL-PFADE ═══════════════ */
const ctx = getContext();

/** Grid aus GAME_STATE.qualifyingResults — fuer beide Pfade identisch gelesen. */
function gridAusSpiel() {
    const q = (ctx.GAME_STATE.qualifyingResults || []).find(x => x.raceIndex === RENNEN);
    const m = new Map();
    if (q && q.results) q.results.forEach(r => { if (r.position) m.set(r.driver, r.position); });
    return m;
}

function paareAusErgebnis(results, gridMap) {
    const paare = [];
    for (const r of results) {
        const grid = gridMap.get(r.driver);
        if (!grid) continue;
        paare.push({ grid, ziel: r.dnf ? null : r.position });
    }
    return paare;
}

function laufSofort() {
    ctx.initFromYear(JAHR);
    if (ctx.applyGuestMoves) ctx.applyGuestMoves(RENNEN);
    if (ctx.simulateTraining) ctx.simulateTraining(RENNEN);
    ctx.simulateQualifying(RENNEN, false);
    const grid = gridAusSpiel();
    const r = ctx.simulateRace(RENNEN, false);
    if (!r || !r.results) return null;
    return paareAusErgebnis(r.results, grid);
}

function laufTicker() {
    ctx.initFromYear(JAHR);
    ctx.window.startLiveRace(RENNEN, false);   // ruft Training + Qualifying selbst
    const grid = gridAusSpiel();
    ctx.window.startRaceSimulation();
    const L = ctx.window.__liveState;
    let schutz = 0;
    while (!L().finished && schutz++ < 800) ctx.simulateLap();
    // Ergebnis aus liveRaceState.positions: am Rennende sortiert (Gefahrene nach
    // totalTime, danach die Ausfaelle). finishLiveRace ruft applyRaceResults aus
    // dem eigenen Scope, von aussen nicht abfangbar.
    const st = L();
    const results = [];
    st.positions.filter(p => !p.dnf).forEach((p, i) => results.push({ driver: p.driver, position: i + 1, dnf: false }));
    st.positions.filter(p => p.dnf).forEach(p => results.push({ driver: p.driver, position: 99, dnf: true }));
    return paareAusErgebnis(results, grid);
}

/* ═══════════════ LAUF ═══════════════ */
const race = races.find(r => r.year === JAHR && r.round === RENNEN + 1);
const bSofort = neueBox(), bTicker = neueBox(), bEcht = neueBox(), bAera = neueBox();

if (race) verrechne(bEcht, realePaare(race.id));
for (const r of races) {
    if (r.year < AERA_VON || r.year > AERA_BIS) continue;
    verrechne(bAera, realePaare(r.id));
}

let fehlerA = 0, fehlerB = 0;
process.stdout.write('Laeuft');
for (let i = 0; i < N; i++) {
    try { const p = laufSofort(); if (p && p.length) verrechne(bSofort, p); else fehlerA++; }
    catch (e) { fehlerA++; if (fehlerA === 1) console.log('\n[sofort] ' + e.message); }
    try { const p = laufTicker(); if (p && p.length) verrechne(bTicker, p); else fehlerB++; }
    catch (e) { fehlerB++; if (fehlerB === 1) console.log('\n[ticker] ' + e.message); }
    if (i % Math.max(1, Math.floor(N / 20)) === 0) process.stdout.write('.');
}
console.log('\n');

/* ═══════════════ BERICHT ═══════════════ */
console.log('═══ Qualifying → Rennen:  Sofort / Ticker / Realität ═══');
console.log('Rennen : ' + (race ? race.officialName : '?') + '   (F1DB raceId ' + (race ? race.id : '?') + ')');
console.log('Laeufe : ' + bSofort.laeufe + ' sofort, ' + bTicker.laeufe + ' ticker' +
    (fehlerA + fehlerB ? '   (Fehler ' + fehlerA + '/' + fehlerB + ')' : ''));
console.log('Real   : dieses Rennen einmal, Ära ' + AERA_VON + '–' + AERA_BIS + ' = ' + bAera.laeufe + ' Rennen');
console.log('');

const zeile = (name, f, nk) => {
    console.log(name.padEnd(32) +
        String(zeig(f(bSofort), nk)).padStart(9) +
        String(zeig(f(bTicker), nk)).padStart(9) +
        String(zeig(f(bEcht), nk)).padStart(10) +
        String(zeig(f(bAera), nk)).padStart(9));
};

console.log(' '.repeat(32) + '   sofort   ticker  dies.Rnn      Ära');
console.log('─'.repeat(69));
zeile('Polesetter gewinnt %', b => proz(b.poleSiege, b.poleLaeufe), 1);
zeile('Sieger kam von Startplatz Ø', b => mittel(b.siegerGrid), 2);
zeile('Podest aus Startplatz 1-3 %', b => proz(b.top3AusTop3, b.top3Gesamt), 1);
console.log('─'.repeat(69));
zeile('Ø |Verschiebung| Grid→Ziel', b => mittel(b.verschiebung), 2);
zeile('Ø netto (+ = gutgemacht)', b => mittel(b.netto), 2);
zeile('Startplatz 8 wird Ø', b => mittel(b.vonAcht.filter(x => x !== null)), 2);
zeile('  P8 faellt aus %', b => proz(b.vonAcht.filter(x => x === null).length, b.vonAcht.length), 1);
console.log('─'.repeat(69));
zeile('DNF-Rate %', b => proz(b.dnf, b.starter), 1);
zeile('Starter je Rennen', b => b.laeufe ? b.starter / b.laeufe : null, 1);
console.log('');

const dPole = Math.abs((proz(bSofort.poleSiege, bSofort.poleLaeufe) || 0) - (proz(bTicker.poleSiege, bTicker.poleLaeufe) || 0));
const dVersch = Math.abs((mittel(bSofort.verschiebung) || 0) - (mittel(bTicker.verschiebung) || 0));
const dDnf = Math.abs((proz(bSofort.dnf, bSofort.starter) || 0) - (proz(bTicker.dnf, bTicker.starter) || 0));
const dP8 = Math.abs((mittel(bSofort.vonAcht.filter(x => x !== null)) || 0) - (mittel(bTicker.vonAcht.filter(x => x !== null)) || 0));

console.log('PFAD-PARITÄT — muss stimmen (CLAUDE.md):');
console.log('  Polesieg-Quote     Δ ' + dPole.toFixed(1) + ' Punkte');
console.log('  Ø Verschiebung     Δ ' + dVersch.toFixed(2) + ' Plaetze');
console.log('  Startplatz 8       Δ ' + dP8.toFixed(2) + ' Plaetze');
console.log('  DNF-Rate           Δ ' + dDnf.toFixed(1) + ' Punkte');
console.log('  → ' + (dPole < 5 && dVersch < 0.5 && dDnf < 4 && dP8 < 0.8
    ? 'im Rahmen der Stichprobenstreuung'
    : 'DIVERGENZ zwischen den Pfaden'));
console.log('');
console.log('REALITÄTSNÄHE — Ära ' + AERA_VON + '–' + AERA_BIS + ' als Referenz:');
const rV = mittel(bAera.verschiebung), sV = mittel(bSofort.verschiebung), tV = mittel(bTicker.verschiebung);
if (rV !== null) {
    console.log('  Ø Verschiebung  real ' + rV.toFixed(2) + '  |  sofort ' + zeig(sV, 2) + '  |  ticker ' + zeig(tV, 2));
    if (sV !== null) console.log('    sofort mischt ' + (sV > rV ? 'STAERKER' : 'WENIGER') + ' durch als die Realität');
    if (tV !== null) console.log('    ticker mischt ' + (tV > rV ? 'STAERKER' : 'WENIGER') + ' durch als die Realität');
}
const rP = proz(bAera.poleSiege, bAera.poleLaeufe);
if (rP !== null) console.log('  Polesieg        real ' + rP.toFixed(1) + ' %  |  sofort ' +
    zeig(proz(bSofort.poleSiege, bSofort.poleLaeufe), 1) + ' %  |  ticker ' +
    zeig(proz(bTicker.poleSiege, bTicker.poleLaeufe), 1) + ' %');
const rD = proz(bAera.dnf, bAera.starter);
if (rD !== null) console.log('  DNF-Rate        real ' + rD.toFixed(1) + ' %  |  sofort ' +
    zeig(proz(bSofort.dnf, bSofort.starter), 1) + ' %  |  ticker ' +
    zeig(proz(bTicker.dnf, bTicker.starter), 1) + ' %');
