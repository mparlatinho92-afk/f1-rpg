// entrant-analysis.js
// Alle Konstrukteur-Einsätze pro Rennwochenende aus F1DB-Entrant-Daten.
// Quelle: f1db-json-splitted/ (nicht HTML) → erfasst auch DNS/DNQ.
// Filter: kein Indy, kein Jahr >= 1992.
//
// Output:
//   entrant-analysis.csv   – pro Rennen pro Konstrukteur (Rohzählung)
//   entrant-summary.csv    – pro Saison pro Konstrukteur (min/max/avg)

'use strict';
const fs   = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'f1db-json-splitted');

// ── 1. Races laden: (year, round) → { raceId, name, isIndy } ────────────────
console.log('Lade f1db-races…');
const racesRaw = JSON.parse(fs.readFileSync(path.join(BASE, 'f1db-races.json'), 'utf8'));

const raceByYearRound = {}; // key: `${year}_${round}` → { id, name, isIndy }
const indyRaceIds     = new Set();

for (const r of racesRaw) {
    const isIndy = r.grandPrixId === 'indianapolis';
    const entry  = { id: r.id, name: r.officialName, round: r.round, isIndy };
    raceByYearRound[`${r.year}_${r.round}`] = entry;
    if (isIndy) indyRaceIds.add(r.id);
}

// ── 2. Entrant-Daten laden ────────────────────────────────────────────────────
console.log('Lade f1db-seasons-entrants-drivers…');
const sed = JSON.parse(
    fs.readFileSync(path.join(BASE, 'f1db-seasons-entrants-drivers.json'), 'utf8')
);

// ── 3. Zählung aufbauen ───────────────────────────────────────────────────────
// data[constructorId][year][raceId] = Set<driverId>
const data = {};
let totalEntries = 0;

for (const entry of sed) {
    const { year, constructorId, driverId, rounds, testDriver } = entry;
    if (testDriver) continue;       // Testfahrer nicht mitzählen
    if (year >= 1992) continue;     // ab 1992 Zweiwagen-Pflicht → kein Mehrwert

    for (const round of rounds) {
        const key  = `${year}_${round}`;
        const race = raceByYearRound[key];
        if (!race) continue;        // Runde existiert nicht (sollte nicht vorkommen)
        if (race.isIndy) continue;  // Indy rausfiltern

        if (!data[constructorId])            data[constructorId] = {};
        if (!data[constructorId][year])      data[constructorId][year] = {};
        if (!data[constructorId][year][race.id]) data[constructorId][year][race.id] = new Set();
        data[constructorId][year][race.id].add(driverId);
        totalEntries++;
    }
}

console.log(`Verarbeitet: ${totalEntries} Fahrer-Rennen-Einträge`);

// ── 4. CSV: rennen-genau ─────────────────────────────────────────────────────
const detailLines = [
    'constructor,year,round,race_id,race_name,n_entries,drivers'
];

// Runden-Lookup aus racesRaw
const roundByRaceId = {}; // raceId → round
const nameByRaceId  = {}; // raceId → officialName
for (const r of racesRaw) {
    roundByRaceId[r.id] = r.round;
    nameByRaceId[r.id]  = r.officialName;
}

const summaryRows = [];

for (const [constructorId, years] of Object.entries(data).sort(([a],[b]) => a.localeCompare(b))) {
    for (const [yearStr, races] of Object.entries(years).sort(([a],[b]) => +a - +b)) {
        const year = parseInt(yearStr, 10);

        // Rennen nach raceId sortiert (chronologisch)
        const sortedRaces = Object.entries(races).sort(([a],[b]) => +a - +b);
        const counts = sortedRaces.map(([,drivers]) => drivers.size);

        const min     = Math.min(...counts);
        const max     = Math.max(...counts);
        const avg     = (counts.reduce((s,v)=>s+v,0) / counts.length).toFixed(2);
        const changes = counts.filter((c,i) => i > 0 && c !== counts[i-1]).length;

        for (const [raceId, drivers] of sortedRaces) {
            const round    = roundByRaceId[raceId] || '?';
            const raceName = (nameByRaceId[raceId] || '').replace(/"/g, '""');
            const driverList = [...drivers].join('|');
            detailLines.push(
                `"${constructorId}",${year},${round},${raceId},"${raceName}",${drivers.size},"${driverList}"`
            );
        }

        const detail = sortedRaces.map(([raceId, drivers]) => {
            const rnd = roundByRaceId[raceId] || raceId;
            return `R${rnd}:${drivers.size}`;
        }).join(' ');

        summaryRows.push({ constructorId, year, races: sortedRaces.length, min, max, avg, changes, detail });
    }
}

// ── 5. CSV: Saison-Zusammenfassung ───────────────────────────────────────────
const summaryLines = [
    'constructor,year,n_races,min_entries,max_entries,avg_entries,entry_changes,detail'
];
for (const r of summaryRows) {
    summaryLines.push(
        `"${r.constructorId}",${r.year},${r.races},${r.min},${r.max},${r.avg},${r.changes},"${r.detail}"`
    );
}

// ── 6. Schreiben ──────────────────────────────────────────────────────────────
const outDetail  = path.join(__dirname, 'entrant-analysis.csv');
const outSummary = path.join(__dirname, 'entrant-summary.csv');
fs.writeFileSync(outDetail,  detailLines.join('\n'),  'utf8');
fs.writeFileSync(outSummary, summaryLines.join('\n'), 'utf8');

// ── 7. Konsolen-Übersicht ─────────────────────────────────────────────────────
const totalConYears = summaryRows.length;
const alwaysOne     = summaryRows.filter(r => r.max === 1);
const alwaysTwo     = summaryRows.filter(r => r.min >= 2 && r.max <= 2);
const bigField      = summaryRows.filter(r => r.max >= 10).sort((a,b) => b.max - a.max);

console.log(`\n${'─'.repeat(60)}`);
console.log(`Konstrukteur-Saison-Kombinationen gesamt: ${totalConYears}`);
console.log(`  Immer 1 Eintrag:     ${alwaysOne.length}`);
console.log(`  Immer 2 Einträge:    ${alwaysTwo.length}`);
console.log(`  Max ≥ 10 Einträge:   ${bigField.length}`);

console.log(`\nTop-20 Konstrukteure mit größtem Feld (max Einträge pro Rennen):`);
bigField.slice(0, 20).forEach(r =>
    console.log(`  ${r.constructorId.padEnd(25)} ${r.year}  max:${r.max}  ${r.detail}`)
);

console.log(`\n${'─'.repeat(60)}`);
console.log(`Output: ${outDetail}`);
console.log(`        ${outSummary}`);
