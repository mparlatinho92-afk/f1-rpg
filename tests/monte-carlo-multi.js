/**
 * monte-carlo-multi.js  –  Multi-Saison-Simulationstest
 *
 * Verwendung:
 *   node tests/monte-carlo-multi.js <startJahr> <endJahr> [simulationen]
 *
 * Beispiele:
 *   node tests/monte-carlo-multi.js 1967 1975 10
 *   node tests/monte-carlo-multi.js 1983 1994 20
 *   node tests/monte-carlo-multi.js 1950 1965 5
 *
 * Testet vor allem:
 *   - Phase 4b: Fahrer-Pace + Team-carSpeed Update per Jahr (PACE_RATINGS)
 *   - Phase 4c: Chassis-Würfel für nicht-Elo-Teams
 *   - Phase 4d: Era-Reset (1961, 1966, 1968 ...)
 *   - Phase 4e: Anti-Snowball / Dynasty-Bremse
 *   - processTeamChanges() + checkCareerEnds() zwischen Saisons
 */
'use strict';
const path = require('path');
const fs   = require('fs');
const { getContext } = require('./sim-core');

// ── Argumente parsen ──────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const startYear = parseInt(args[0]) || 1967;
const endYear   = parseInt(args[1]) || startYear + 5;
const N         = parseInt(args[2]) || 10;

if (endYear <= startYear) {
    console.error('Fehler: endJahr muss größer als startJahr sein.');
    process.exit(1);
}

const yearSpan = endYear - startYear + 1;

console.log(`\n═══════════════════════════════════════════════════════════`);
console.log(`  F1 RPG Multi-Saison-MC  |  ${startYear}→${endYear}  |  ${N} Sims`);
console.log(`  ${yearSpan} Saisons pro Durchlauf, Phase 4b/c/d/e Prüfung`);
console.log(`═══════════════════════════════════════════════════════════\n`);

const ctx = getContext();

// ── Datenstrukturen ───────────────────────────────────────────────────────

// Pro Jahr: Häufigkeiten und Metriken
const yearStats = {};
for (let y = startYear; y <= endYear; y++) {
    yearStats[y] = {
        champions:     {},   // driverId → Titelanzahl
        championTeams: {},   // teamId   → Titelanzahl
        carSpeedAvg:   [],   // Ø carSpeed aller Teams
        carSpeedTop:   [],   // bestes Team carSpeed
        carSpeedSpread:[],   // Top−Flop carSpeed (Spread)
        dnfRates:      [],
        driverCount:   [],
        teamCount:     [],
    };
}

// Globale Metriken über alle Sims
const dynastyMaxLengths = [];   // längste Siegesserie pro Sim
const dynastyRuns3plus  = [];   // hatte diese Sim eine ≥3-Saison-Serie?
const eraResetChecks    = {};   // Jahr → [carSpeedAvg vor / nach] – prüft ob Reset feuert

const ERA_RESETS = [1961,1966,1968,1983,1989,1994,1998,2014,2022];
ERA_RESETS.forEach(y => { if (y > startYear && y <= endYear) eraResetChecks[y] = { before: [], after: [] }; });

let successfulSims  = 0;
let totalSimErrors  = 0;
const firstErrors   = [];

// ── Hilfsfunktionen ───────────────────────────────────────────────────────

function simulateSeason(c) {
    const races = c.GAME_STATE.races;
    let totalStarts = 0, totalDNFs = 0;
    for (let i = 0; i < races.length; i++) {
        const isRain = Math.random() < 0.15;
        try {
            if (typeof c.simulateTraining === 'function') c.simulateTraining(i);
            c.simulateQualifying(i, isRain);
            const result = c.simulateRace(i, isRain);
            if (!result) continue;
            c.applyRaceResults(result);
            for (const r of result.results) {
                totalStarts++;
                if (r.dnf || r.fatal) totalDNFs++;
            }
        } catch(_) { /* einzelne Rennen überspringen */ }
    }
    return { totalStarts, totalDNFs };
}

function getChampion(c) {
    let best = null;
    for (const [id, s] of Object.entries(c.GAME_STATE.driverStandings || {})) {
        if (!best || s.points > best.points) best = { id, ...s };
    }
    return best;
}

function getTopTeam(c) {
    let best = null;
    for (const [id, s] of Object.entries(c.GAME_STATE.teamStandings || {})) {
        if (!best || s.points > best.points) best = { id, ...s };
    }
    return best;
}

function getCarSpeedStats(c) {
    const speeds = (c.GAME_STATE.teams || [])
        .map(t => t.carSpeed || 70)
        .sort((a, b) => b - a);
    if (!speeds.length) return { avg: 0, top: 0, spread: 0 };
    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    return {
        avg:    Math.round(avg * 10) / 10,
        top:    speeds[0],
        spread: speeds[0] - speeds[speeds.length - 1],
    };
}

// Namens-Cache aufbauen während der Simulation (GAME_STATE ändert sich)
const nameCache = {};
const teamCache = {};

function cacheNames(c) {
    for (const d of (c.GAME_STATE.drivers || [])) {
        if (d.id && d.name) nameCache[d.id] = d.name;
    }
    for (const t of (c.GAME_STATE.teams || [])) {
        if (t.id && t.name) teamCache[t.id] = t.name;
    }
}

function nameOf(id)     { return nameCache[id] || id; }
function teamNameOf(id) { return teamCache[id] || id; }

// ── Haupt-Simulation ──────────────────────────────────────────────────────

const progressStep = Math.max(1, Math.floor(N / 10));
console.log(`Simuliere ${N} Durchläufe...`);

for (let sim = 0; sim < N; sim++) {
    if (sim % progressStep === 0) process.stdout.write(`  ${Math.round(sim / N * 100)}%... `);

    try {
        ctx.initFromYear(startYear);

        let dynastyTeamId = null;
        let dynastyCount  = 0;
        let maxDynasty    = 0;

        for (let year = startYear; year <= endYear; year++) {
            const yd = yearStats[year];

            // carSpeed VOR Era-Reset festhalten (für Vergleich)
            // Reset feuert beim Übergang year→year+1, wenn year+1 in ERA_RESETS
            const csBeforeReset = ERA_RESETS.includes(year + 1) && eraResetChecks[year + 1]
                ? getCarSpeedStats(ctx)
                : null;

            const stats   = simulateSeason(ctx);
            const champ   = getChampion(ctx);
            const topTeam = getTopTeam(ctx);
            const cs      = getCarSpeedStats(ctx);

            cacheNames(ctx);

            // Kennzahlen sammeln
            if (champ)   yd.champions[champ.id]       = (yd.champions[champ.id]       || 0) + 1;
            if (topTeam) yd.championTeams[topTeam.id] = (yd.championTeams[topTeam.id] || 0) + 1;
            yd.carSpeedAvg.push(cs.avg);
            yd.carSpeedTop.push(cs.top);
            yd.carSpeedSpread.push(cs.spread);
            if (stats.totalStarts > 0)
                yd.dnfRates.push(stats.totalDNFs / stats.totalStarts * 100);
            yd.driverCount.push((ctx.GAME_STATE.drivers || []).length);
            yd.teamCount.push((ctx.GAME_STATE.teams || []).length);

            // Dynasty-Tracking (nach Saison-Ende, Konstrukteurs-WM)
            if (topTeam && topTeam.id === dynastyTeamId) {
                dynastyCount++;
                if (dynastyCount > maxDynasty) maxDynasty = dynastyCount;
            } else {
                dynastyTeamId = topTeam?.id || null;
                dynastyCount  = 1;
            }

            if (year >= endYear) break;

            // ── Saison-Übergang ────────────────────────────────────────────
            // 1. Karriere-Scores aktualisieren (benötigt aiSimulation=true)
            if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
            // 2. Pace-Entwicklung für generierte Fahrer
            if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
            // 3. Karriere-Enden
            if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
            // 4. Teamwechsel
            if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();

            // Era-Reset-Prüfung: carSpeed VOR startNewSeason speichern
            if (csBeforeReset && eraResetChecks[year + 1]) {
                eraResetChecks[year + 1].before.push(csBeforeReset.avg);
            }

            // 5. Neue Saison starten (Phase 4b/c/d/e)
            ctx.startNewSeason();

            // Era-Reset-Prüfung: carSpeed NACH startNewSeason
            if (eraResetChecks[year + 1]) {
                eraResetChecks[year + 1].after.push(getCarSpeedStats(ctx).avg);
            }
        }

        dynastyMaxLengths.push(maxDynasty);
        dynastyRuns3plus.push(maxDynasty >= 3 ? 1 : 0);
        successfulSims++;

    } catch(e) {
        totalSimErrors++;
        if (firstErrors.length < 3) {
            firstErrors.push(`[Sim ${sim}] ${e.message}\n  ${e.stack?.split('\n')[1] || ''}`);
        }
    }
}

console.log(`\n  Fertig. ${successfulSims}/${N} Durchläufe erfolgreich.\n`);
if (firstErrors.length > 0) {
    console.log('  Erste Fehler:');
    firstErrors.forEach(e => console.log('    ' + e));
    console.log();
}

if (successfulSims === 0) {
    console.error('Keine erfolgreichen Simulationen – Abbruch.');
    process.exit(1);
}

// ── Ausgabe-Hilfsfunktionen ───────────────────────────────────────────────

const avg    = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const avgFmt = (arr, dec=1) => arr.length ? avg(arr).toFixed(dec) : '–';
const pctFmt = (n, total) => total ? (n / total * 100).toFixed(1) + '%' : '–';
const sortDesc = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
const W = 61;  // Breite der Box

function boxLine(text) {
    return `║  ${text}`.padEnd(W - 1) + '║';
}
function boxSep() {
    return '╠' + '═'.repeat(W - 2) + '╣';
}
function boxTop() {
    return '╔' + '═'.repeat(W - 2) + '╗';
}
function boxBot() {
    return '╚' + '═'.repeat(W - 2) + '╝';
}

// ── Bericht ───────────────────────────────────────────────────────────────

console.log(boxTop());
console.log(boxLine(`MULTI-SAISON BERICHT: ${startYear}–${endYear}  (${successfulSims} Sims, ${yearSpan} Saisons)`));
console.log(boxSep());

// Saison-Übersicht pro Jahr
console.log(boxLine('SAISON-ÜBERSICHT'));
console.log(boxLine(`  Jahr   Konstrukteur (häufigst)     Win%  csAvg csTop DNF%`));
console.log(boxLine(`  ─────  ──────────────────────────  ────  ───── ───── ────`));

for (let y = startYear; y <= endYear; y++) {
    const yd       = yearStats[y];
    const entries  = sortDesc(yd.championTeams);
    const topId    = entries[0]?.[0] ?? '?';
    const topCount = entries[0]?.[1] ?? 0;
    const name     = teamNameOf(topId).substring(0, 24).padEnd(24);
    const winPct   = pctFmt(topCount, successfulSims).padStart(5);
    const csAvg    = avgFmt(yd.carSpeedAvg).padStart(5);
    const csTop    = avgFmt(yd.carSpeedTop).padStart(5);
    const dnfAvg   = avgFmt(yd.dnfRates).padStart(4);
    const era      = ERA_RESETS.includes(y) ? '⚡' : '  ';
    console.log(boxLine(`  ${era}${y}  ${name}  ${winPct}  ${csAvg} ${csTop} ${dnfAvg}%`));
}

// Era-Reset-Prüfung
const resetYears = Object.keys(eraResetChecks).filter(y => eraResetChecks[y].before.length > 0);
if (resetYears.length > 0) {
    console.log(boxSep());
    console.log(boxLine('ERA-RESET PRÜFUNG (⚡ = Regelwechsel, carSpeed davor→danach)'));
    for (const y of resetYears) {
        const rc = eraResetChecks[y];
        const before = avgFmt(rc.before);
        const after  = avgFmt(rc.after);
        const drop   = rc.before.length ? (avg(rc.before) - avg(rc.after)).toFixed(1) : '?';
        const ok     = parseFloat(drop) > 2 ? '✓ Reset sichtbar' : '⚠ kein/kleiner Drop';
        console.log(boxLine(`  ${y}: ${before} → ${after}  (Δ −${drop})  ${ok}`));
    }
}

// Dynasty-Analyse
const avgDyn     = avgFmt(dynastyMaxLengths);
const maxDyn     = dynastyMaxLengths.length ? Math.max(...dynastyMaxLengths) : 0;
const d3Count    = dynastyRuns3plus.reduce((a, b) => a + b, 0);
console.log(boxSep());
console.log(boxLine('DYNASTY-ANALYSE  (Konstrukteurs-Titelserien)'));
console.log(boxLine(`  Ø längste Serie pro Sim:  ${avgDyn} Saisons`));
console.log(boxLine(`  Längste beobachtete:      ${maxDyn} Saisons`));
console.log(boxLine(`  Sims mit ≥3 in Folge:     ${d3Count}/${successfulSims}  (${pctFmt(d3Count, successfulSims)})`));
const antiSnowballOk = d3Count / successfulSims < 0.35;
console.log(boxLine(`  Anti-Snowball (Ziel <35%): ${antiSnowballOk ? '✓' : '⚠ zu viele Dynastien'}`));

// carSpeed-Entwicklung – prüft ob Phase 4b/4c wirkt
console.log(boxSep());
console.log(boxLine('CARSPEED-ENTWICKLUNG  (Phase 4b/4c)'));
console.log(boxLine(`  Jahr   Ø carSpeed  Top  Spread`));
console.log(boxLine(`  ─────  ──────────  ───  ──────`));
for (let y = startYear; y <= endYear; y += Math.max(1, Math.floor(yearSpan / 8))) {
    const yd = yearStats[y];
    if (!yd.carSpeedAvg.length) continue;
    const csAvg    = avgFmt(yd.carSpeedAvg).padStart(5);
    const csTop    = avgFmt(yd.carSpeedTop).padStart(3);
    const csSpread = avgFmt(yd.carSpeedSpread).padStart(6);
    const era      = ERA_RESETS.includes(y) ? '⚡' : '  ';
    console.log(boxLine(`  ${era}${y}   ${csAvg}       ${csTop}  ${csSpread}`));
}

// Top-Fahrertitel über alle Jahre
const allChampions = {};
for (let y = startYear; y <= endYear; y++) {
    for (const [id, n] of Object.entries(yearStats[y].champions)) {
        allChampions[id] = (allChampions[id] || 0) + n;
    }
}
console.log(boxSep());
console.log(boxLine('TOP-FAHRER (alle Saisons gesamt)'));
const topDrivers = sortDesc(allChampions).slice(0, 8);
for (const [id, n] of topDrivers) {
    const name = nameOf(id).substring(0, 22).padEnd(22);
    const titlesPerSim = (n / successfulSims).toFixed(2);
    const totalTitles  = n;
    console.log(boxLine(`  ${name}  ${titlesPerSim} T/Sim  (${totalTitles} total)`));
}

// Top-Konstrukteursteam über alle Jahre
const allTeamTitles = {};
for (let y = startYear; y <= endYear; y++) {
    for (const [id, n] of Object.entries(yearStats[y].championTeams)) {
        allTeamTitles[id] = (allTeamTitles[id] || 0) + n;
    }
}
console.log(boxSep());
console.log(boxLine('TOP-KONSTRUKTEURE (alle Saisons gesamt)'));
const topTeams = sortDesc(allTeamTitles).slice(0, 6);
for (const [id, n] of topTeams) {
    const name = teamNameOf(id).substring(0, 22).padEnd(22);
    const titlesPerSim = (n / successfulSims).toFixed(2);
    console.log(boxLine(`  ${name}  ${titlesPerSim} T/Sim  (${n} total)`));
}

console.log(boxBot());
console.log();
