'use strict';
/**
 * analyze-tenure.js
 * Analysiert wie lange Top-Fahrer bei Top-Teams bleiben (F1DB 1950–2025).
 * "Top-Team" = Konstrukteur der in mindestens einer Saison WCC gewann.
 * "Top-Fahrer" = Fahrer der in mindestens einer Saison WDC gewann ODER ≥10 Karrieresiege.
 *
 * Verwendung: node tests/analyze-tenure.js
 */

const path = require('path');
const db = p => require(path.join(__dirname, '..', 'f1db-json-splitted', p));

const entrantDrivers  = db('f1db-seasons-entrants-drivers.json');
const conStandings    = db('f1db-seasons-constructor-standings.json');
const driverStandings = db('f1db-seasons-driver-standings.json');
const raceResults     = db('f1db-races-race-results.json');
const races           = db('f1db-races.json');

// ── Top-Teams: alle die je WCC gewannen ──────────────────────────────────────
const topTeamIds = new Set(
    conStandings.filter(r => r.championshipWon).map(r => r.constructorId)
);

// ── Top-Fahrer: WDC-Gewinner ODER ≥10 Rennsiege ─────────────────────────────
const wdcDrivers = new Set(
    driverStandings.filter(r => r.championshipWon).map(r => r.driverId)
);

// Rennsiege zählen
const winsPerDriver = {};
const raceYearMap = {};
races.forEach(r => { raceYearMap[r.id] = r.year; });
raceResults.forEach(r => {
    if (r.positionNumber === 1 && !r.sharedDrive) {
        winsPerDriver[r.driverId] = (winsPerDriver[r.driverId] || 0) + 1;
    }
});
const multiWinDrivers = new Set(
    Object.entries(winsPerDriver).filter(([,w]) => w >= 10).map(([id]) => id)
);
const topDriverIds = new Set([...wdcDrivers, ...multiWinDrivers]);

// ── Fahrer-Team-Zuordnung pro Jahr aufbauen ───────────────────────────────────
// driverId → [{year, constructorId}]
const driverYears = {};
entrantDrivers.forEach(e => {
    if (e.testDriver) return;
    if (!driverYears[e.driverId]) driverYears[e.driverId] = [];
    driverYears[e.driverId].push({ year: e.year, team: e.constructorId });
});

// ── Ununterbrochene Strecken bei Top-Teams berechnen ─────────────────────────
// Nur Top-Fahrer × Top-Teams
const tenures = []; // {driverId, team, start, end, length}

topDriverIds.forEach(driverId => {
    const years = (driverYears[driverId] || [])
        .filter(e => topTeamIds.has(e.team))
        .sort((a, b) => a.year - b.year);

    // Zusammenhängende Blöcke pro Team finden
    // Ein Wechsel innerhalb einer Saison zu einem anderen Top-Team = neuer Block
    let i = 0;
    while (i < years.length) {
        const startTeam = years[i].team;
        const startYear = years[i].year;
        let endYear = startYear;
        let j = i + 1;
        while (j < years.length && years[j].team === startTeam && years[j].year <= endYear + 1) {
            endYear = years[j].year;
            j++;
        }
        const length = endYear - startYear + 1;
        tenures.push({ driverId, team: startTeam, start: startYear, end: endYear, length });
        i = j;
    }
});

// ── Statistiken ───────────────────────────────────────────────────────────────
const all = tenures.map(t => t.length);
const avg = all.reduce((a, b) => a + b, 0) / all.length;
const sorted = [...all].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];
const dist = {};
all.forEach(n => { dist[n] = (dist[n] || 0) + 1; });

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  Top-Fahrer × Top-Team Verweilzeiten (F1DB 1950–2025)');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`  Analysierte Tenures:  ${tenures.length}`);
console.log(`  Top-Teams:            ${topTeamIds.size}  (je mind. 1× WCC)`);
console.log(`  Top-Fahrer:           ${topDriverIds.size}  (WDC oder ≥10 Siege)`);
console.log(`\n  Ø Tenure-Länge:       ${avg.toFixed(2)} Jahre`);
console.log(`  Median:               ${median} Jahre`);

console.log('\n  Verteilung (Jahre → Anzahl Tenures):');
for (let n = 1; n <= Math.max(...all); n++) {
    if (!dist[n]) continue;
    const bar = '█'.repeat(Math.round(dist[n] / 2));
    console.log(`    ${String(n).padStart(2)}J: ${String(dist[n]).padStart(3)}  ${bar}`);
}

// ── Längste Tenures (Top 20) ─────────────────────────────────────────────────
console.log('\n  Längste Tenures (Top 20):');
tenures.sort((a, b) => b.length - a.length).slice(0, 20).forEach(t => {
    const flag = wdcDrivers.has(t.driverId) ? '🏆' : '  ';
    console.log(`    ${flag} ${t.driverId.padEnd(28)} @ ${t.team.padEnd(20)} ${t.start}–${t.end}  (${t.length}J)`);
});

// ── Verteilung nach Tenure-Buckets ───────────────────────────────────────────
const b = { '1': 0, '2': 0, '3': 0, '4-5': 0, '6+': 0 };
all.forEach(n => {
    if (n === 1) b['1']++;
    else if (n === 2) b['2']++;
    else if (n === 3) b['3']++;
    else if (n <= 5) b['4-5']++;
    else b['6+']++;
});
console.log('\n  Bucket-Verteilung:');
Object.entries(b).forEach(([k, v]) => {
    const pct = (v / all.length * 100).toFixed(1);
    console.log(`    ${k.padEnd(5)} Jahre: ${String(v).padStart(3)}  (${pct}%)`);
});

console.log('\n═══════════════════════════════════════════════════════════\n');
