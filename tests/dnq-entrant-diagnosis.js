// dnq-entrant-diagnosis.js
// DIAGNOSE (kein Fix): Wie viele Autos MELDET das Spiel pro Rennen in der
// klassischen Ära gegen die reale F1DB-Meldeliste?
//
//   node tests/dnq-entrant-diagnosis.js            → Detail 1952/1968/1985 + Sweep 1950–1989
//   node tests/dnq-entrant-diagnosis.js 1961 1970  → nur diese Jahre im Detail
//
// Spiel-Seite: expandSeasonData(year) baut die Frisch-Saison (Werksfahrer +
//   Privateers + homeOnly + Kleinstkonstrukteure, 0-Meldungs-Pruning). Pro Rennen
//   wird die Meldeliste EXAKT wie in simulateRace gefiltert:
//   Indy raus → privateerEntersRace → applyConstructorCarCap.
//   Gemittelt über N Läufe (Startpläne sind zufällig → nie aus einem Lauf schließen).
// Referenz: f1db-json-splitted/ — "Gemeldet" = distinct Fahrer je Runde
//   (entrants-drivers, Testfahrer + Indy raus), "Starter" = starting-grid-positions.
//   Das ist dieselbe Quelle wie die Google-Referenztabelle des Nutzers.
'use strict';
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');

const BASE = path.join(__dirname, '..', 'f1db-json-splitted');
const args = process.argv.slice(2).map(Number).filter(Boolean);
const DETAIL_YEARS = args.length ? args : [1952, 1968, 1985];
const SWEEP = []; for (let y = 1950; y <= 1989; y++) SWEEP.push(y);
const N_DETAIL = 400;
const N_SWEEP = 120;

// ── Referenz aus F1DB ────────────────────────────────────────────────────────
const races = JSON.parse(fs.readFileSync(path.join(BASE, 'f1db-races.json'), 'utf8'));
const sed = JSON.parse(fs.readFileSync(path.join(BASE, 'f1db-seasons-entrants-drivers.json'), 'utf8'));
const grid = JSON.parse(fs.readFileSync(path.join(BASE, 'f1db-races-starting-grid-positions.json'), 'utf8'));

// year+round → circuitId ; und Indy-Runden markieren
const roundKey = {};                        // `${y}_${r}` → circuitId (null wenn Indy)
const raceIdCircuit = {};                    // raceId → circuitId
for (const r of races) {
    const indy = r.grandPrixId === 'indianapolis';
    roundKey[`${r.year}_${r.round}`] = indy ? null : r.circuitId;
    raceIdCircuit[r.id] = indy ? null : r.circuitId;
}
// ref[year][circuitId] = { entered:Set, starters:Set }
const ref = {};
function refCell(year, cid) {
    if (!cid) return null;
    (ref[year] = ref[year] || {});
    return (ref[year][cid] = ref[year][cid] || { entered: new Set(), starters: new Set() });
}
for (const e of sed) {
    if (e.testDriver) continue;
    for (const rd of e.rounds) {
        const cid = roundKey[`${e.year}_${rd}`];
        const cell = refCell(e.year, cid);
        if (cell) cell.entered.add(e.driverId);
    }
}
for (const g of grid) {
    const cid = roundKey[`${g.year}_${g.round}`];       // Grid-Datei hat year+round direkt
    const cell = refCell(g.year, cid);
    if (cell) cell.starters.add(g.driverId);
}

// ── Spiel-Seite ──────────────────────────────────────────────────────────────
const ctx = getContext();
const { expandSeasonData, privateerEntersRace, applyConstructorCarCap,
        getGridSize, isIndyOnlyConstructor } = ctx;

function isIndyDriver(d, teams) {
    if (d.isIndyOnly) return true;
    const t = teams.find(x => x.id === d.team);
    return !!t && (isIndyOnlyConstructor(t.id) || isIndyOnlyConstructor(t.histId));
}

// Ein Saisonlauf → pro Nicht-Indy-Rennen die gemeldete Autozahl (wie simulateRace)
function runSeason(year) {
    const s = expandSeasonData(year);
    if (!s) return null;
    const out = [];
    for (const race of s.races) {
        if (race.isIndy) continue;
        let active = s.drivers.filter(d => (!d.status || d.status === 'active') && d.team);
        active = active.filter(d => !isIndyDriver(d, s.teams));
        active = active.filter(d => privateerEntersRace(d, race));
        active = applyConstructorCarCap(active, s.teams, year);
        out.push({ cid: (race.circuitId || '').toLowerCase(), grid: getGridSize(year, race), n: active.length });
    }
    return out;
}

// Mittelt N Läufe → circuitId → {entries, dnq}
function measure(year, N) {
    const acc = {};   // cid → { entries:[], dnq:[] , grid }
    let ok = 0;
    for (let k = 0; k < N; k++) {
        const rows = runSeason(year);
        if (!rows) return null;
        ok++;
        for (const r of rows) {
            const a = (acc[r.cid] = acc[r.cid] || { es: 0, dq: 0, grid: r.grid });
            a.es += r.n;
            a.dq += Math.max(0, r.n - r.grid);
        }
    }
    const res = {};
    for (const cid in acc) {
        res[cid] = { entries: acc[cid].es / ok, dnq: acc[cid].dq / ok, grid: acc[cid].grid };
    }
    return res;
}

// ── Detail-Ausgabe je Jahr ───────────────────────────────────────────────────
function refDNQ(cell) { return Math.max(0, cell.entered.size - cell.starters.size); }

for (const year of DETAIL_YEARS) {
    const game = measure(year, N_DETAIL);
    if (!game || !ref[year]) { console.log(`\n${year}: keine Daten`); continue; }
    console.log(`\n${'═'.repeat(74)}`);
    console.log(`${year}  (Ø aus ${N_DETAIL} Läufen)   Indy ausgeschlossen`);
    console.log('Strecke           │ Spiel-Meld │ real Meld │  Δ    │ Grid │ Spiel-DNQ │ real-DNQ');
    console.log('─'.repeat(84));
    let sg = 0, sr = 0, ng = 0, sdq = 0, rdq = 0;
    // Reihenfolge: nach realem Kalender (circuit order aus races)
    const order = races.filter(r => r.year === year && r.grandPrixId !== 'indianapolis')
                       .sort((a, b) => a.round - b.round).map(r => r.circuitId);
    for (const cid of order) {
        const g = game[cid.toLowerCase()];
        const c = ref[year][cid];
        if (!c) continue;
        const gm = g ? g.entries : NaN;
        const rm = c.entered.size;
        const d = gm - rm;
        sg += gm; sr += rm; ng++;
        sdq += g ? g.dnq : 0; rdq += refDNQ(c);
        const nm = cid.padEnd(17).slice(0, 17);
        console.log(`${nm} │ ${gm.toFixed(1).padStart(9)} │ ${String(rm).padStart(8)} │ ${(d >= 0 ? '+' : '') + d.toFixed(1)} `.padEnd(0) +
            `│ ${String(g ? g.grid : '?').padStart(4)} │ ${(g ? g.dnq.toFixed(1) : '?').padStart(9)} │ ${String(refDNQ(c)).padStart(8)}`);
    }
    console.log('─'.repeat(84));
    console.log(`Ø / Rennen        │ ${(sg / ng).toFixed(1).padStart(9)} │ ${(sr / ng).toFixed(1).padStart(8)} │ ${((sg - sr) / ng >= 0 ? '+' : '') + ((sg - sr) / ng).toFixed(1)} │      │ ${(sdq / ng).toFixed(1).padStart(9)} │ ${(rdq / ng).toFixed(1).padStart(8)}`);
}

// ── Sweep 1950–1989: Dekaden-Aggregat ────────────────────────────────────────
console.log(`\n${'═'.repeat(74)}`);
console.log(`SWEEP 1950–1989  (Ø aus ${N_SWEEP} Läufen/Jahr)   Δ = Spiel-Meldungen − real`);
console.log('Dekade │ Ø Spiel-Meld │ Ø real-Meld │  Δ Meld │ Ø Spiel-DNQ │ Ø real-DNQ');
console.log('─'.repeat(72));
const dec = {};
for (const year of SWEEP) {
    if (!ref[year]) continue;
    const game = measure(year, N_SWEEP);
    if (!game) continue;
    const d = Math.floor(year / 10) * 10;
    const D = (dec[d] = dec[d] || { g: 0, r: 0, gdq: 0, rdq: 0, n: 0 });
    for (const cid in ref[year]) {
        const c = ref[year][cid];
        const g = game[cid.toLowerCase()];
        if (!g) continue;
        D.g += g.entries; D.r += c.entered.size; D.gdq += g.dnq; D.rdq += refDNQ(c); D.n++;
    }
}
for (const d of [1950, 1960, 1970, 1980]) {
    const D = dec[d]; if (!D) continue;
    console.log(`${d}s  │ ${(D.g / D.n).toFixed(1).padStart(12)} │ ${(D.r / D.n).toFixed(1).padStart(11)} │ ${((D.g - D.r) / D.n >= 0 ? '+' : '') + ((D.g - D.r) / D.n).toFixed(1).padStart(6)} │ ${(D.gdq / D.n).toFixed(1).padStart(11)} │ ${(D.rdq / D.n).toFixed(1).padStart(10)}`);
}
console.log('\nHinweis: Grid-Füller (nur fortgesetzte Saisons) sind hier NICHT aktiv –');
console.log('sie füllen nur AUF die Gridgröße, erzeugen also keinen Melder-Überschuss.');
console.log('Diese Messung ist der Frisch-Saison-Fall (= expandSeasonData-Sweep aus dem Memo).');
