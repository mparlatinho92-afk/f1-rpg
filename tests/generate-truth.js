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
const qualiResults        = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races-qualifying-results.json'),    'utf8'));

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
// Nenner = echte Starter. Frueher zaehlten DNQ/DNPQ mit und drueckten die
// Rate in Vor-Quali-Jahren (1989: 37 statt 54 %). Nicht gewertet = jede
// Nicht-Zahl (DNF, NC, DSQ). Indy 500 (1950-60) fliegt raus: F1DB fuehrt
// dort alle 33 Starter mit Platzziffer, Ausfaelle sind nicht erkennbar.
// Quelle von ERA_DNF_RATES in index.html.
const NICHT_GESTARTET = /^(DNQ|DNPQ|DNS|DNP|EX|WD)$/;
const indy500 = new Set(races.filter(r => r.circuitId === 'indianapolis' && r.year <= 1960).map(r => r.id));
// Unfall-Anteil: welcher Teil der Ausfälle auf Unfall/Kollision/Dreher geht.
// Quelle von ERA_DNF_ACCIDENT_SHARE; der Rest gilt im Spiel als technisch.
const UNFALL = /accident|collision|spun off|\bspin\b/i;
const dnfStats = {};
for (const e of raceResults) {
    if (NICHT_GESTARTET.test(e.positionText) || indy500.has(e.raceId)) continue;
    if (!dnfStats[e.year]) dnfStats[e.year] = { total: 0, dnf: 0, unfall: 0, rennUnfaelle: 0, rennTote: 0 };
    dnfStats[e.year].total++;
    // Tödlichkeit eines Rennunfalls, Quelle von ERA_ACCIDENT_LETHALITY.
    // Nenner nur Unfall-AUSFÄLLE: im Spiel kann nur ein Ausfall ein Unfall sein.
    // Zähler alle Renntoten, auch gewertete (Bianchi 2014 steht als 20.).
    if (/^fatal/i.test(e.reasonRetired || '')) dnfStats[e.year].rennTote++;
    if (!/^\d+$/.test(e.positionText) && UNFALL.test(e.reasonRetired || '')) dnfStats[e.year].rennUnfaelle++;
    if (!/^\d+$/.test(e.positionText)) {
        dnfStats[e.year].dnf++;
        if (UNFALL.test(e.reasonRetired || '')) dnfStats[e.year].unfall++;
    }
}
for (const [year, s] of Object.entries(dnfStats)) {
    if (!truth[year]) continue;
    truth[year].dnfRate = parseFloat((s.dnf / s.total).toFixed(3));
    truth[year].accidentShare = parseFloat((s.unfall / s.dnf).toFixed(3));
    truth[year].raceAccidents = s.rennUnfaelle;
    truth[year].raceDeaths    = s.rennTote;
}

// ── Rennen pro Jahr ───────────────────────────────────────────────────────
const raceCount = {};
for (const r of races) {
    raceCount[r.year] = (raceCount[r.year] || 0) + 1;
}
for (const [year, count] of Object.entries(raceCount)) {
    if (truth[year]) truth[year].raceCount = count;
}

// ── Reale Ø-Pol-Zeit pro Jahr (exkl. Indy 500) ────────────────────────────
// timeMillis = pre-2014 (einzel Session); q3Millis = ab 2014 (Q3-Zeit)
const raceLookup = {};
for (const r of races) raceLookup[r.id] = r;

const poleTimesPerYear = {};
for (const q of qualiResults) {
    if (q.positionNumber !== 1) continue;
    const timeMs = q.timeMillis || q.q3Millis;
    if (!timeMs) continue;
    const race = raceLookup[q.raceId];
    if (!race || race.circuitId === 'indianapolis') continue;
    if (!poleTimesPerYear[q.year]) poleTimesPerYear[q.year] = [];
    poleTimesPerYear[q.year].push(timeMs);
}
for (const [year, times] of Object.entries(poleTimesPerYear)) {
    if (truth[year]) {
        truth[year].avgPoleMs     = Math.round(times.reduce((a,b)=>a+b,0) / times.length);
        truth[year].poleTimeCount = times.length;
    }
}

// ── Reale Ø-Sieger-Rundenzeit pro Jahr (winner_time_ms / laps, exkl. Indy) ──
const raceLapTimesPerYear = {};
for (const r of raceResults) {
    if (r.positionNumber !== 1) continue;
    if (!r.timeMillis) continue;
    const race = raceLookup[r.raceId];
    if (!race || race.circuitId === 'indianapolis') continue;
    const laps = race.scheduledLaps || race.laps;
    if (!laps) continue;
    if (!raceLapTimesPerYear[r.year]) raceLapTimesPerYear[r.year] = [];
    raceLapTimesPerYear[r.year].push(r.timeMillis / laps);
}
for (const [year, times] of Object.entries(raceLapTimesPerYear)) {
    if (truth[year]) {
        truth[year].avgRaceLapMs    = Math.round(times.reduce((a,b)=>a+b,0) / times.length);
        truth[year].raceTimeCount   = times.length;
    }
}

// ── Ausgabe ───────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'historical_truth.json');
fs.writeFileSync(outPath, JSON.stringify(truth, null, 2));

const years = Object.keys(truth).sort();
console.log(`historical_truth.json generiert: ${years.length} Saisons (${years[0]}–${years[years.length-1]})`);
console.log('Beispiel 1967:', JSON.stringify(truth[1967], null, 2));
