/**
 * generate-truth.js
 * Liest F1DB-Daten und erzeugt tests/historical_truth.json
 * Ausführen: node tests/generate-truth.js
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const DB = path.join(__dirname, '..', 'f1db-json-splitted');

const driverStandings     = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races-driver-standings.json'),      'utf8'));
const constructorStandings= JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races-constructor-standings.json'), 'utf8'));
const raceResults         = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races-race-results.json'),          'utf8'));
const races               = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races.json'),                       'utf8'));
const driversDb           = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-drivers.json'),                     'utf8'));
const constructorsDb      = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-constructors.json'),                 'utf8'));

// Name-Lookups für Matching in monte-carlo.js
const driverNames = {};
for (const d of driversDb) driverNames[d.id] = d.name;
const constructorNames = {};
for (const c of constructorsDb) constructorNames[c.id] = c.name;

// Letzter bekannter Round pro Jahr aus races
const maxRoundPerYear = {};
for (const r of races) {
    if (!maxRoundPerYear[r.year] || r.round > maxRoundPerYear[r.year]) {
        maxRoundPerYear[r.year] = r.round;
    }
}

const truth = {};

// ── Fahrer-Champion pro Jahr ──────────────────────────────────────────────
for (const e of driverStandings) {
    if (e.round !== maxRoundPerYear[e.year]) continue;
    if (e.positionNumber !== 1) continue;
    if (!truth[e.year]) truth[e.year] = {};
    truth[e.year].champion     = e.driverId;
    truth[e.year].championName = driverNames[e.driverId] || e.driverId;
    truth[e.year].championPoints = e.points;
}

// ── Top-5 Fahrer am Saisonende ────────────────────────────────────────────
const topDriversPerYear = {};
for (const e of driverStandings) {
    if (e.round !== maxRoundPerYear[e.year]) continue;
    if (!topDriversPerYear[e.year]) topDriversPerYear[e.year] = [];
    topDriversPerYear[e.year].push({ id: e.driverId, pos: e.positionNumber, pts: e.points });
}
for (const [year, list] of Object.entries(topDriversPerYear)) {
    list.sort((a, b) => a.pos - b.pos);
    if (truth[year]) truth[year].top5Drivers = list.slice(0, 5).map(d => d.id);
}

// ── Konstrukteur-Champion pro Jahr ────────────────────────────────────────
const maxRoundConstr = {};
for (const e of constructorStandings) {
    if (!maxRoundConstr[e.year] || e.round > maxRoundConstr[e.year]) {
        maxRoundConstr[e.year] = e.round;
    }
}
for (const e of constructorStandings) {
    if (e.round !== maxRoundConstr[e.year]) continue;
    if (e.positionNumber !== 1) continue;
    if (truth[e.year]) {
        truth[e.year].championTeam     = e.constructorId;
        truth[e.year].championTeamName = constructorNames[e.constructorId] || e.constructorId;
        truth[e.year].championTeamPts  = e.points;
    }
}

// ── Siege pro Team pro Jahr ───────────────────────────────────────────────
const winsPerTeam = {};
for (const e of raceResults) {
    if (e.positionNumber !== 1) continue;
    if (!winsPerTeam[e.year]) winsPerTeam[e.year] = {};
    winsPerTeam[e.year][e.constructorId] = (winsPerTeam[e.year][e.constructorId] || 0) + 1;
}
for (const [year, wins] of Object.entries(winsPerTeam)) {
    if (truth[year]) truth[year].winsPerTeam = wins;
}

// ── DNF-Rate pro Jahr ─────────────────────────────────────────────────────
const dnfStats = {};
for (const e of raceResults) {
    if (!dnfStats[e.year]) dnfStats[e.year] = { total: 0, dnf: 0 };
    dnfStats[e.year].total++;
    if (e.reasonRetired) dnfStats[e.year].dnf++;
}
for (const [year, s] of Object.entries(dnfStats)) {
    if (truth[year]) truth[year].dnfRate = parseFloat((s.dnf / s.total).toFixed(3));
}

// ── Rennen pro Jahr ───────────────────────────────────────────────────────
const raceCount = {};
for (const r of races) {
    raceCount[r.year] = (raceCount[r.year] || 0) + 1;
}
for (const [year, count] of Object.entries(raceCount)) {
    if (truth[year]) truth[year].raceCount = count;
}

// ── Ausgabe ───────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'historical_truth.json');
fs.writeFileSync(outPath, JSON.stringify(truth, null, 2));

const years = Object.keys(truth).sort();
console.log(`historical_truth.json generiert: ${years.length} Saisons (${years[0]}–${years[years.length-1]})`);
console.log('Beispiel 1967:', JSON.stringify(truth[1967], null, 2));
