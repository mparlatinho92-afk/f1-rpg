'use strict';
/**
 * season-compare.js
 * Monte-Carlo-Vergleich: simulierte Saisonwertung vs. historische F1DB-Wertung.
 * Läuft für jedes Jahr von 1950–2024.
 *
 * Aufruf: node tests/season-compare.js [year] [N=50]
 * Beispiel: node tests/season-compare.js 1980 100
 */

const fs   = require('fs');
const path = require('path');
const { getContext } = require('./sim-core.js');

const year = parseInt(process.argv[2]) || 1984;
const N    = parseInt(process.argv[3]) || 50;

// ── Historische Wertung aus F1DB ──────────────────────────────────────────
const STANDINGS_FILE = path.join(__dirname, '..', 'f1db-json-splitted', 'f1db-seasons-driver-standings.json');
const allStandings   = JSON.parse(fs.readFileSync(STANDINGS_FILE, 'utf8'));
const histStandings  = allStandings
    .filter(r => r.year === year)
    .sort((a, b) => a.positionNumber - b.positionNumber);

if (!histStandings.length) {
    console.error(`Keine historischen Wertungsdaten für ${year}.`);
    process.exit(1);
}

// driverId (slug) → { pos, pts }
const histMap = {};
for (const r of histStandings) {
    histMap[r.driverId] = { pos: r.positionNumber, pts: r.points };
}

// ── Spielkontext laden ────────────────────────────────────────────────────
console.log(`Lade Spielkontext …`);
const ctx = getContext();
console.log(`Kontext geladen. Simuliere ${year}, ${N} Saisons.\n`);

// ── Hilfsfunktionen ───────────────────────────────────────────────────────
function runSeason(c) {
    const races = c.GAME_STATE.races;
    for (let i = 0; i < races.length; i++) {
        const isRain = Math.random() < 0.15;
        try {
            c.simulateTraining(i);
            c.simulateQualifying(i, isRain);
            const result = c.simulateRace(i, isRain);
            if (result) c.applyRaceResults(result);
        } catch (e) { /* überspringen */ }
    }
}

function getDriverStandings(c) {
    const st = c.GAME_STATE.driverStandings;
    return Object.entries(st)
        .map(([id, s]) => ({ id, pts: s.points || 0 }))
        .sort((a, b) => b.pts - a.pts);
}

// ── Simulation ────────────────────────────────────────────────────────────
// Für jeden Fahrer: Summe aller Sim-Punkte + Positionshäufigkeiten
const simPtsSum  = {};  // id → gesamte Punkte über alle Sims
const simPosFreq = {};  // id → { pos: count }
const simWins    = {};  // id → Anzahl Titel-Gewinne (P1 in Wertung)
let   runs = 0;

// Fahrer-ID → histId Mapping (nach erstem initFromYear)
let idToHistId = null;

for (let sim = 0; sim < N; sim++) {
    try {
        ctx.initFromYear(year);

        // Einmalig: Game-IDs zu histId-Slugs mappen
        if (!idToHistId) {
            idToHistId = {};
            for (const d of ctx.GAME_STATE.drivers || []) {
                if (d.histId) idToHistId[d.id] = d.histId;
            }
        }

        runSeason(ctx);
        const standings = getDriverStandings(ctx);

        for (let pos = 0; pos < standings.length; pos++) {
            const { id, pts } = standings[pos];
            simPtsSum[id]  = (simPtsSum[id]  || 0) + pts;
            simWins[id]    = (simWins[id]    || 0) + (pos === 0 ? 1 : 0);
            if (!simPosFreq[id]) simPosFreq[id] = {};
            const bucket = pos + 1;
            simPosFreq[id][bucket] = (simPosFreq[id][bucket] || 0) + 1;
        }
        runs++;
    } catch (e) { /* Saison überspringen */ }
}

if (runs === 0) {
    console.error('Alle Simulationen fehlgeschlagen.');
    process.exit(1);
}

// ── Durchschnittliche Sim-Platzierung berechnen ──────────────────────────
function avgSimPos(id) {
    const freq = simPosFreq[id];
    if (!freq) return 99;
    let wsum = 0, total = 0;
    for (const [pos, cnt] of Object.entries(freq)) {
        wsum  += parseInt(pos) * cnt;
        total += cnt;
    }
    return total ? wsum / total : 99;
}

// ── Ausgabe ───────────────────────────────────────────────────────────────
const G   = '\x1b[32m';
const Y   = '\x1b[33m';
const R   = '\x1b[31m';
const DIM = '\x1b[2m';
const RST = '\x1b[0m';
const B   = '\x1b[1m';
const CYN = '\x1b[36m';

function pad(s, n) { return String(s).padEnd(n); }
function lpad(s, n) { return String(s).padStart(n); }

// Alle Fahrer die in der Sim oder historisch vorkommen
const allDriverIds = new Set([
    ...Object.keys(simPtsSum),
    ...histStandings.map(r => {
        // histId aus driverId
        const entry = Object.entries(idToHistId || {}).find(([, slug]) => slug === r.driverId);
        return entry ? entry[0] : null;
    }).filter(Boolean),
]);

// Nach avg Sim-Pts sortieren (höchste oben)
const sorted = Array.from(allDriverIds)
    .map(id => ({
        id,
        histId: idToHistId?.[id] || null,
        simAvgPts: runs > 0 ? (simPtsSum[id] || 0) / runs : 0,
        simAvgPos: avgSimPos(id),
        simWinPct: Math.round(((simWins[id] || 0) / runs) * 100),
    }))
    .sort((a, b) => b.simAvgPts - a.simAvgPts);

// Sim-Rang
sorted.forEach((d, i) => { d.simRank = i + 1; });

// Fahrernamen aus GAME_STATE
const nameMap = {};
if (ctx.GAME_STATE && ctx.GAME_STATE.drivers) {
    for (const d of ctx.GAME_STATE.drivers) {
        nameMap[d.id] = d.name;
    }
}

console.log(`${B}═══ Saison ${year}: Simulation (${runs}×) vs. Historisch ═══${RST}\n`);
console.log(
    `${B}${pad('Sim', 4)} ${pad('Fahrer', 22)} ${lpad('∅Pts', 6)} ${lpad('∅Pos', 5)}  ` +
    `${lpad('WM%', 4)}  ${pad('Hist', 4)} ${lpad('echte Pts', 9)} Delta${RST}`
);
console.log('─'.repeat(74));

let matchSum = 0, matchCount = 0;

for (const d of sorted) {
    const name  = nameMap[d.id] || d.histId || d.id;
    const hist  = d.histId ? histMap[d.histId] : null;
    const hPos  = hist ? hist.pos  : '–';
    const hPts  = hist ? hist.pts  : '–';
    const delta = (hist && d.simRank && hist.pos) ? hist.pos - d.simRank : null;

    // Farbe für Delta (negativ = sim zu gut, positiv = sim zu schlecht)
    let dStr = '   ';
    if (delta !== null) {
        matchSum  += Math.abs(delta);
        matchCount++;
        if      (delta > 0)  dStr = `${G}+${delta}${RST}`;
        else if (delta < 0)  dStr = `${R}${delta}${RST}`;
        else                  dStr = `${DIM}  0${RST}`;
    }

    const rowColor = d.simWinPct >= 25 ? G : d.simWinPct >= 5 ? Y : '';

    console.log(
        `${rowColor}${lpad(d.simRank, 3)}. ` +
        `${pad(name.slice(0, 21), 22)} ` +
        `${lpad(d.simAvgPts.toFixed(1), 6)} ` +
        `${lpad(d.simAvgPos.toFixed(1), 5)}  ` +
        `${lpad(d.simWinPct + '%', 4)}  ` +
        `${pad(hPos, 4)} ` +
        `${lpad(String(hPts), 9)}  ` +
        `${dStr}${RST}`
    );
}

console.log('─'.repeat(74));
const mae = matchCount ? (matchSum / matchCount).toFixed(1) : '–';
console.log(`\nJahre simuliert: ${runs}/${N}   Fahrer verglichen: ${matchCount}`);
console.log(`Ø Rang-Abweichung (MAE): ${mae} Plätze`);
console.log(`${DIM}(Delta = hist.Pos − sim.Rang; + = Sim besser als real, − = Sim schlechter)${RST}\n`);

// Auffälligkeiten
const outliers = sorted.filter(d => {
    const hist = d.histId ? histMap[d.histId] : null;
    if (!hist || !d.simRank) return false;
    return Math.abs(hist.pos - d.simRank) >= 5;
});
if (outliers.length) {
    console.log(`${Y}Auffälligkeiten (≥5 Plätze Abweichung):${RST}`);
    for (const d of outliers) {
        const h = histMap[d.histId];
        const name = nameMap[d.id] || d.histId;
        const dir = h.pos > d.simRank ? 'sim zu hoch' : 'sim zu niedrig';
        console.log(`  ${name}: Sim P${d.simRank} vs. Hist P${h.pos} (${dir})`);
    }
}
