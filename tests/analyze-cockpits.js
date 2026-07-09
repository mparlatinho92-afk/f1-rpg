// analyze-cockpits.js
// Cockpit-Anzahl pro Konstrukteur, pro Rennen, pro Saison – aus F1DB_RESULTS
//
// Output:
//   cockpit-analysis.csv  – rennen-genau (eine Zeile pro Rennen pro Konstrukteur)
//   cockpit-summary.csv   – pro Saison-Zusammenfassung (min/max/Wechsel)
//
// Cockpit-Logik:
//   Primär: Anzahl eindeutiger Startpositionen (gridPos > 0) → geteilte Autos korrekt als 1 gezählt
//   Fallback: Anzahl eindeutiger Fahrer (wenn keine gridPos vorhanden)
//   Geteiltes Auto: zwei Fahrer, selbe Endposition + selber Konstrukteur = 1 Cockpit

'use strict';
const fs   = require('fs');
const path = require('path');

// ── 1. HTML einlesen ─────────────────────────────────────────────────────────
const htmlPath = path.join(__dirname, '..', 'index.html');
console.log('Lese HTML…');
const html = fs.readFileSync(htmlPath, 'utf8');

// ── 2. JSON-Konstanten extrahieren ───────────────────────────────────────────
function extractJson(src, name) {
    // Sucht "const NAME" gefolgt von "=" und nimmt alles bis zum nächsten ";"
    // Robust gegen Leerzeichen und CRLF/LF
    const markerIdx = src.indexOf(`const ${name}`);
    if (markerIdx === -1) return null;
    const eqIdx = src.indexOf('=', markerIdx + name.length + 5);
    if (eqIdx === -1) return null;
    // Finde das öffnende { oder [
    const openIdx = src.indexOf('{', eqIdx);
    const openIdxArr = src.indexOf('[', eqIdx);
    const start = (openIdxArr !== -1 && openIdxArr < openIdx) ? openIdxArr : openIdx;
    if (start === -1) return null;
    // Balanciertes Klammer-Ende suchen
    const open = src[start];
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    for (let i = start; i < src.length; i++) {
        if (src[i] === open)  depth++;
        if (src[i] === close) { depth--; if (depth === 0) return src.slice(start, i + 1); }
    }
    return null;
}

console.log('Extrahiere F1DB_RACES…');
const racesStr = extractJson(html, 'F1DB_RACES');
if (!racesStr) { console.error('F1DB_RACES nicht gefunden'); process.exit(1); }

console.log('Extrahiere F1DB_RESULTS…');
const resultsStr = extractJson(html, 'F1DB_RESULTS');
if (!resultsStr) { console.error('F1DB_RESULTS nicht gefunden'); process.exit(1); }

console.log('Parse JSON…');
const F1DB_RACES   = JSON.parse(racesStr);
const F1DB_RESULTS = JSON.parse(resultsStr);

// ── 3. Renndaten: raceId → { year, name, round, isIndy } ────────────────────
// F1DB_RACES format: { raceId: [name, date, circuit, isIndy, scheduledLaps] }
const raceInfo = {}; // raceId → { year, name, isIndy }
for (const [rid, meta] of Object.entries(F1DB_RACES)) {
    raceInfo[rid] = {
        name:   meta[0],
        date:   meta[1],
        isIndy: meta[3] === 1,
        year:   parseInt((meta[1] || '').slice(0, 4), 10) || 0,
    };
}

// ── 4. Cockpit-Analyse ───────────────────────────────────────────────────────
// F1DB_RESULTS[year] = [ [raceId, raceNrInYear, entries[]], … ]
// entry: [raceId, posNr, posText, driverId, constructorId, laps, time, gap, ?, ?, points, gridPos, …]

// data[constructorId][year][raceId] = { drivers: Set, gridPositions: Set, sharedPositions: Map<posNr→count> }
const data = {};

let totalEntries = 0;

for (const [yearStr, races] of Object.entries(F1DB_RESULTS)) {
    const year = parseInt(yearStr, 10);
    if (year >= 1992) continue; // ab 1992 Zweiwagen-Pflicht → nur Anomalien, kein Mehrwert
    for (const raceArr of races) {
        const raceId   = String(raceArr[0]);
        const entries  = raceArr[2] || [];

        // Zwischenstruktur: constructorId → { drivers, gridPos, positionCounts }
        const perCon = {};

        // Indy 500 raus
        if (raceInfo[raceId] && raceInfo[raceId].isIndy) continue;

        for (const e of entries) {
            const driverId     = e[3];
            const constructorId = e[4];
            if (!constructorId || !driverId) continue;

            const posNr  = e[1];   // Endposition (null = DNF/NC)
            const gridPos = e[11]; // Startposition (0 = keine / geteilt)

            if (!perCon[constructorId]) {
                perCon[constructorId] = {
                    drivers:   new Set(),
                    gridPos:   new Set(),
                    posGroups: new Map(), // posNr → Set<driverId> (für Shared-Car-Erkennung)
                };
            }
            const c = perCon[constructorId];
            c.drivers.add(driverId);
            if (gridPos && gridPos > 0) c.gridPos.add(gridPos);

            // Shared-Car-Erkennung: zwei Fahrer, gleiche Endposition
            if (posNr !== null && posNr !== undefined) {
                if (!c.posGroups.has(posNr)) c.posGroups.set(posNr, new Set());
                c.posGroups.get(posNr).add(driverId);
            }
            totalEntries++;
        }

        // Cockpits berechnen und speichern
        for (const [constructorId, c] of Object.entries(perCon)) {
            // Cockpit-Zählung:
            // a) Primär: eindeutige gridPositionen > 0
            // b) Falls keine gridPos: Fahrer minus Shared-Car-Abzüge
            let cockpits;
            if (c.gridPos.size > 0) {
                cockpits = c.gridPos.size;
            } else {
                // Shared cars ermitteln: Positionen mit > 1 Fahrer
                let sharedDeductions = 0;
                for (const [, drivers] of c.posGroups) {
                    if (drivers.size > 1) sharedDeductions += (drivers.size - 1);
                }
                cockpits = Math.max(1, c.drivers.size - sharedDeductions);
            }

            if (!data[constructorId]) data[constructorId] = {};
            if (!data[constructorId][year]) data[constructorId][year] = {};
            data[constructorId][year][raceId] = {
                cockpits,
                drivers:  [...c.drivers],
                gridPos:  [...c.gridPos],
            };
        }
    }
}

console.log(`Verarbeitet: ${totalEntries} Einträge`);

// ── 5. CSV: rennen-genau ──────────────────────────────────────────────────────
const detailLines = [
    'constructor,year,round,race_id,race_name,is_indy,cockpits,n_drivers,drivers,grid_positions'
];

// Runden-Nummern pro Jahr berechnen (Reihenfolge = chronologisch nach raceId)
const roundByRaceId = {}; // raceId → round in year
for (const [yearStr, races] of Object.entries(F1DB_RESULTS)) {
    let round = 0;
    for (const raceArr of races) {
        round++;
        roundByRaceId[String(raceArr[0])] = round;
    }
}

const summaryRows = []; // für Summary-CSV

for (const [constructorId, years] of Object.entries(data).sort(([a],[b]) => a.localeCompare(b))) {
    for (const [yearStr, races] of Object.entries(years).sort(([a],[b]) => +a - +b)) {
        const year = parseInt(yearStr, 10);

        // Rennen sortiert nach raceId (aufsteigend = chronologisch)
        const sortedRaces = Object.entries(races).sort(([a],[b]) => +a - +b);

        const counts = sortedRaces.map(([,r]) => r.cockpits);
        const min = Math.min(...counts);
        const max = Math.max(...counts);
        const avg = (counts.reduce((s,v)=>s+v,0) / counts.length).toFixed(2);

        // Fluktuation: Saisonwechsel in der Cockpit-Zahl
        const changes = counts.filter((c, i) => i > 0 && c !== counts[i-1]).length;

        // Unique Fahrer über die gesamte Saison (für Fluktuation in einem Sitz)
        const allDrivers = new Set(sortedRaces.flatMap(([,r]) => r.drivers));
        const driverFluct = allDrivers.size - max; // Fahrer über das "Maximum" hinaus

        for (const [raceId, r] of sortedRaces) {
            const info = raceInfo[raceId] || {};
            const round = roundByRaceId[raceId] || '?';
            detailLines.push(
                `"${constructorId}",${year},${round},${raceId},"${(info.name||'').replace(/"/g,'""')}",${info.isIndy?1:0},${r.cockpits},${r.drivers.length},"${r.drivers.join('|')}","${r.gridPos.join('|')}"`
            );
        }

        // Detail-String für Summary: R1:2 R2:1 …
        const detail = sortedRaces.map(([raceId,r]) => {
            const rnd = roundByRaceId[raceId] || raceId;
            return `R${rnd}:${r.cockpits}`;
        }).join(' ');

        summaryRows.push({
            constructorId, year, races: sortedRaces.length,
            min, max, avg, changes, driverFluct,
            detail,
        });
    }
}

// ── 6. CSV: Saison-Zusammenfassung ───────────────────────────────────────────
const summaryLines = [
    'constructor,year,n_races,min_cockpits,max_cockpits,avg_cockpits,seat_changes,driver_fluct,detail'
];
for (const r of summaryRows) {
    summaryLines.push(
        `"${r.constructorId}",${r.year},${r.races},${r.min},${r.max},${r.avg},${r.changes},${r.driverFluct},"${r.detail}"`
    );
}

// ── 7. Schreiben ─────────────────────────────────────────────────────────────
const outDetail  = path.join(__dirname, 'cockpit-analysis.csv');
const outSummary = path.join(__dirname, 'cockpit-summary.csv');
fs.writeFileSync(outDetail,  detailLines.join('\n'),  'utf8');
fs.writeFileSync(outSummary, summaryLines.join('\n'), 'utf8');

// ── 8. Konsolen-Übersicht ────────────────────────────────────────────────────
const totalConYears = summaryRows.length;
const alwaysOne     = summaryRows.filter(r => r.max === 1);
const mixed         = summaryRows.filter(r => r.min === 1 && r.max > 1);
const alwaysTwo     = summaryRows.filter(r => r.min >= 2 && r.max <= 2);
const threeOrMore   = summaryRows.filter(r => r.max >= 3);
const highFluct     = summaryRows.filter(r => r.driverFluct >= 2).sort((a,b) => b.driverFluct - a.driverFluct);

console.log(`\n${'─'.repeat(60)}`);
console.log(`Konstrukteur-Saison-Kombinationen gesamt: ${totalConYears}`);
console.log(`  Immer 1 Cockpit:         ${alwaysOne.length}`);
console.log(`  Gemischt (1 + 2+):       ${mixed.length}`);
console.log(`  Immer 2 Cockpits:        ${alwaysTwo.length}`);
console.log(`  Max ≥ 3 Cockpits:        ${threeOrMore.length}`);
console.log(`  Hohe Fahrer-Fluktuation: ${highFluct.length} (≥2 Extra-Fahrer im selben Sitz)`);

console.log(`\nTop-15 Fluktuation in einem Sitz (driverFluct = Fahrer über Cockpit-Max hinaus):`);
highFluct.slice(0, 15).forEach(r =>
    console.log(`  ${r.constructorId.padEnd(25)} ${r.year}  cockpits:${r.min}-${r.max}  fluct:${r.driverFluct}  ${r.detail}`)
);

console.log(`\nGemischte Konstrukteure (1 Cockpit + gelegentlich 2):`);
mixed.slice(0, 30).forEach(r =>
    console.log(`  ${r.constructorId.padEnd(25)} ${r.year}  ${r.detail}`)
);

console.log(`\n${'─'.repeat(60)}`);
console.log(`Output gespeichert:`);
console.log(`  ${outDetail}`);
console.log(`  ${outSummary}`);
