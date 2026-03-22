/**
 * monte-carlo.js  –  F1 RPG Simulations-Testmaschine
 *
 * Verwendung:
 *   node tests/monte-carlo.js <jahr> [simulationen] [--szenario=NAME]
 *
 * Beispiele:
 *   node tests/monte-carlo.js 1967 50
 *   node tests/monte-carlo.js 1984 100 --szenario=dominanz
 *   node tests/monte-carlo.js 1965 50  --szenario=privateers
 *
 * Szenarien (--szenario):
 *   dominanz   – Top-Team-Dominanz und Titelverteilung
 *   balance    – DNF-Rate, Punkte-Spreizung, Pace-Verteilung
 *   privateers – Privatfahrer-System (Meldequote, Grid-Fülle, DNQ-Mix)
 *   (ohne)     – Vollbericht (alle Kennzahlen)
 */
'use strict';
const path = require('path');
const fs   = require('fs');
const { getContext } = require('./sim-core');

// ── Argumente parsen ──────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const year     = parseInt(args[0]) || 1967;
const N        = parseInt(args[1]) || 50;
const szenArg  = (args.find(a => a.startsWith('--szenario=')) || '').split('=')[1] || 'alle';

console.log(`\n═══════════════════════════════════════════════════`);
console.log(`  F1 RPG Monte-Carlo  |  Jahr: ${year}  |  Sims: ${N}`);
console.log(`  Szenario: ${szenArg}`);
console.log(`═══════════════════════════════════════════════════\n`);

// ── Kontext laden ─────────────────────────────────────────────────────────
const ctx = getContext();

// ── Historical Truth laden (falls vorhanden) ──────────────────────────────
const truthPath = path.join(__dirname, 'historical_truth.json');
const truth = fs.existsSync(truthPath)
    ? JSON.parse(fs.readFileSync(truthPath, 'utf8'))[year] || null
    : null;

if (!truth) {
    console.log(`[!] Kein Historical-Truth für ${year} – nur Simulation, kein Abgleich.`);
    console.log(`    Tipp: node tests/generate-truth.js\n`);
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function resetAndInit(c, y) {
    try {
        c.initFromYear(y);
    } catch(e) {
        console.error('[sim] initFromYear Fehler:', e.message);
        throw e;
    }
}

function simulateSeason(c) {
    const races    = c.GAME_STATE.races;
    let totalStarts = 0;
    let totalDNFs   = 0;
    let totalDeaths        = 0;
    let totalAccidentDNFs  = 0;

    // Privateer-Metriken
    const drivers = c.GAME_STATE.drivers || [];
    const privateers = drivers.filter(d => d.isPrivateer);
    const works     = drivers.filter(d => !d.isPrivateer && (!d.status || d.status === 'active'));

    let privateerQualifyingEntries = 0;   // wie oft hat ein Privateer tatsächlich gemeldet
    let privateerMaxEntries        = 0;   // Obergrenze (privateerCount × Rennen)
    let worksQualifyingEntries     = 0;
    let privateerDNQs              = 0;
    let worksDNQs                  = 0;
    let totalGridEntries           = [];  // Feld-Größe pro Rennen (Qualifizierte + DNQs)

    const privateerIds  = new Set(privateers.map(d => d.id));
    const worksIds      = new Set(works.map(d => d.id));

    for (let i = 0; i < races.length; i++) {
        const isRain = Math.random() < 0.15;
        try {
            const qResult = c.simulateQualifying(i, isRain);
            const result  = c.simulateRace(i, isRain);
            if (!result) continue;
            c.applyRaceResults(result);

            // Quali-Einträge zählen
            if (qResult && qResult.results) {
                for (const r of qResult.results) {
                    if (privateerIds.has(r.driver)) privateerQualifyingEntries++;
                    else if (worksIds.has(r.driver)) worksQualifyingEntries++;
                }
                totalGridEntries.push(qResult.results.length);
            }

            // Max-Einträge: alle Privateers könnten theoretisch melden
            privateerMaxEntries += privateers.length;

            // DNQs aufteilen
            for (const dnqId of (result.dnq || [])) {
                if (privateerIds.has(dnqId)) privateerDNQs++;
                else worksDNQs++;
            }

            // DNF-Statistik + Todes-Metriken
            for (const r of result.results) {
                totalStarts++;
                if (r.dnf || r.fatal) totalDNFs++;
                if (r.fatal) totalDeaths++;
                if (r.dnf && r.dnfType === 'accident') totalAccidentDNFs++;
            }
        } catch(e) {
            // Einzelne Rennen überspringen
        }
    }

    // Wie viele Privateers haben überhaupt je gemeldet?
    const privateersThatRaced = privateers.filter(d => d.firstRaceEntry !== undefined).length;

    return {
        totalStarts, totalDNFs,
        totalDeaths, totalAccidentDNFs,
        privateerCount:             privateers.length,
        worksCount:                 works.length,
        privateerQualifyingEntries,
        privateerMaxEntries,
        worksQualifyingEntries,
        privateerDNQs,
        worksDNQs,
        privateersThatRaced,
        avgGridSize: totalGridEntries.length
            ? totalGridEntries.reduce((a,b)=>a+b,0) / totalGridEntries.length
            : 0,
        raceCount: races.length,
    };
}

function getChampion(c) {
    const standings = c.GAME_STATE.driverStandings;
    let best = null;
    for (const [id, s] of Object.entries(standings)) {
        if (!best || s.points > best.points) best = { id, ...s };
    }
    return best;
}

function getTopTeam(c) {
    const standings = c.GAME_STATE.teamStandings;
    let best = null;
    for (const [id, s] of Object.entries(standings)) {
        if (!best || s.points > best.points) best = { id, ...s };
    }
    return best;
}

// ── Simulation laufen lassen ───────────────────────────────────────────────
console.log(`Simuliere ${N} Saisons...`);
const progress = Math.max(1, Math.floor(N / 10));

const results = {
    champions:     {},
    championTeams: {},
    teamWins:      {},
    driverWins:    {},
    dnfRates:      [],
    championPoints:[],
    raceCount:      0,

    // Todes-Metriken
    deathsPerSeason:            [],
    accidentDNFsPerSeason:      [],

    // Privateer-Metriken (Summen über alle Sims)
    privateerCounts:            [],
    worksCounts:                [],
    privateerEntryRates:        [],   // tatsächlich / möglich
    avgGridSizes:               [],
    privateerDNQRates:          [],   // privateer-DNQs / alle DNQs
    privateersThatRacedRates:   [],   // wie viele Privateers je mind. 1 Rennen hatten
};

let successfulSims = 0;

for (let sim = 0; sim < N; sim++) {
    if (sim % progress === 0) process.stdout.write(`  ${Math.round(sim/N*100)}%... `);

    try {
        resetAndInit(ctx, year);
        const stats = simulateSeason(ctx);

        const champ   = getChampion(ctx);
        const topTeam = getTopTeam(ctx);

        if (champ) {
            results.champions[champ.id]     = (results.champions[champ.id] || 0) + 1;
            results.championPoints.push(champ.points);
        }
        if (topTeam) {
            results.championTeams[topTeam.id] = (results.championTeams[topTeam.id] || 0) + 1;
        }

        for (const [dId, s] of Object.entries(ctx.GAME_STATE.driverStandings)) {
            if (s.wins > 0) results.driverWins[dId] = (results.driverWins[dId] || 0) + s.wins;
        }
        for (const [tId, s] of Object.entries(ctx.GAME_STATE.teamStandings)) {
            if (s.wins > 0) results.teamWins[tId] = (results.teamWins[tId] || 0) + s.wins;
        }

        if (stats.totalStarts > 0)
            results.dnfRates.push(stats.totalDNFs / stats.totalStarts * 100);
        results.raceCount = stats.raceCount;

        // Todes-Metriken
        results.deathsPerSeason.push(stats.totalDeaths);
        results.accidentDNFsPerSeason.push(stats.totalAccidentDNFs);

        // Privateer-Metriken
        results.privateerCounts.push(stats.privateerCount);
        results.worksCounts.push(stats.worksCount);
        results.avgGridSizes.push(stats.avgGridSize);

        if (stats.privateerMaxEntries > 0) {
            results.privateerEntryRates.push(
                stats.privateerQualifyingEntries / stats.privateerMaxEntries * 100
            );
        }
        const totalDNQs = stats.privateerDNQs + stats.worksDNQs;
        if (totalDNQs > 0) {
            results.privateerDNQRates.push(stats.privateerDNQs / totalDNQs * 100);
        }
        if (stats.privateerCount > 0) {
            results.privateersThatRacedRates.push(
                stats.privateersThatRaced / stats.privateerCount * 100
            );
        }

        successfulSims++;
    } catch(e) {
        if (successfulSims === 0 && sim < 3) {
            console.error(`  [Sim ${sim}] Fehler: ${e.message}`);
        }
    }
}
console.log(`\n  Fertig. ${successfulSims}/${N} Saisons erfolgreich.\n`);

// ── Bericht ───────────────────────────────────────────────────────────────
const pct  = (n) => (n / successfulSims * 100).toFixed(1) + '%';
const avg  = (arr) => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '–';
const avgN = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const sort = (obj) => Object.entries(obj).sort((a,b)=>b[1]-a[1]);

const nameOf = (id) => {
    const d = (ctx.GAME_STATE.drivers||[]).find(d=>d.id===id);
    return d ? d.name : id;
};
const teamNameOf = (id) => {
    const t = (ctx.GAME_STATE.teams||[]).find(t=>t.id===id);
    return t ? t.name : id;
};
const findChampIdByName = (realName) => {
    if (!realName) return null;
    const needle = realName.toLowerCase();
    for (const id of Object.keys(results.champions)) {
        if (nameOf(id).toLowerCase() === needle) return id;
    }
    const lastName = needle.split(' ').pop();
    for (const id of Object.keys(results.champions)) {
        if (nameOf(id).toLowerCase().includes(lastName)) return id;
    }
    return null;
};
const findTeamIdByName = (realName) => {
    if (!realName) return null;
    const needle = realName.toLowerCase();
    for (const id of Object.keys(results.championTeams)) {
        if (teamNameOf(id).toLowerCase().includes(needle) || needle.includes(teamNameOf(id).toLowerCase())) return id;
    }
    return null;
};

console.log(`╔═══════════════════════════════════════════════════╗`);
console.log(`║  BERICHT: ${year} (${successfulSims} Simulationen)`.padEnd(51) + `║`);
console.log(`╠═══════════════════════════════════════════════════╣`);

// Fahrer-WM
const realChampGameId = truth ? findChampIdByName(truth.championName) : null;
console.log(`║  FAHRER-WM TITELVERTEILUNG`);
const champEntries = sort(results.champions).slice(0, 8);
for (const [id, n] of champEntries) {
    const real = realChampGameId === id ? ` ← REAL (${truth.championName})` : '';
    console.log(`║    ${nameOf(id).padEnd(25)} ${pct(n).padStart(6)}${real}`);
}

// Konstrukteur-WM
const realTeamGameId = truth ? findTeamIdByName(truth.championTeamName) : null;
console.log(`║`);
console.log(`║  KONSTRUKTEUR-WM TITELVERTEILUNG`);
const teamChampEntries = sort(results.championTeams).slice(0, 6);
for (const [id, n] of teamChampEntries) {
    const real = realTeamGameId === id ? ` ← REAL (${truth.championTeamName})` : '';
    console.log(`║    ${teamNameOf(id).padEnd(25)} ${pct(n).padStart(6)}${real}`);
}

// Siege pro Team
console.log(`║`);
console.log(`║  SIEGE PRO TEAM (Ø pro Saison)`);
const teamWinEntries = sort(results.teamWins).slice(0, 8);
for (const [id, total] of teamWinEntries) {
    const avgWins = (total / successfulSims).toFixed(1);
    const realWins = truth?.winsPerTeam?.[id];
    const realStr  = realWins != null ? ` (real: ${realWins})` : '';
    console.log(`║    ${teamNameOf(id).padEnd(25)} Ø ${avgWins.padStart(4)} Siege${realStr}`);
}

// DNF-Rate
console.log(`║`);
const simDNF = parseFloat(avg(results.dnfRates));
const realDNF = truth?.dnfRate;
const dnfDelta = realDNF != null ? ` | real: ${(realDNF*100).toFixed(1)}% | Δ ${(simDNF - realDNF*100).toFixed(1)}%` : '';
console.log(`║  DNF-RATE`);
console.log(`║    Sim:  ${(simDNF).toFixed(1)}%${dnfDelta}`);

// Todes-Metriken
console.log(`║`);
console.log(`║  TODE PRO SAISON`);
const avgDeaths     = avgN(results.deathsPerSeason);
const avgAccidents  = avgN(results.accidentDNFsPerSeason);
const fatalAccRate  = avgAccidents > 0 ? (avgDeaths / avgAccidents * 100).toFixed(1) : '–';

// Historische Zielwerte (Tode/Jahr) – abgeleitet aus ERA_DEATH_RATES × Unfall-DNFs/Saison
// getEraValue() nutzt "letzter Schlüssel ≤ Jahr" → 5-Jahres-Stützstellen werden genutzt.
// Formel: target = ERA_DEATH_RATES[stützstelle] × Ø(histGrid/gridCap) × accident_DNFs
// Verifiziert mit Monte-Carlo nach getEraValue-Fix (v0.9.9.14):
//   1952: rate=0.10, gridNorm=24/24=1.0, accDNFs≈32 → ~3.2/Jahr
//   1967: rate=0.033 (1965-stützstelle!), gridNorm=19/19=1.0, accDNFs≈50 → ~1.65/Jahr
//   1973: rate=0.018, gridNorm=24/24=1.0, accDNFs≈76 → ~1.37/Jahr
const DEATH_TARGETS = {
    1950: 3.5,   // ERA_DEATH_RATES[1950]=0.10; 1950er Grid 20–24
    1955: 2.5,   // ERA_DEATH_RATES[1955]=0.07; kleinere Grids, weniger Rennen
    1960: 2.0,   // ERA_DEATH_RATES[1960]=0.047; frühe 60er
    1965: 1.5,   // ERA_DEATH_RATES[1965]=0.033; späte 60er – Safety-Bewusstsein steigt
    1970: 1.2,   // ERA_DEATH_RATES[1970]=0.018; frühe 70er (Rindt, Cevert…)
    1975: 0.8,   // ERA_DEATH_RATES[1975]=0.011; Safety-Reformen (Peterson, Pryce…)
    1980: 0.3,   // ERA_DEATH_RATES[1980]=0.005; 80er (Paletti, de Angelis…)
    1985: 0.13,  // ERA_DEATH_RATES[1985]=0.002; späte 80er
    1990: 0.05,  // ERA_DEATH_RATES[1990]=0.001; frühe 90er
    1995: 0.02,  // ERA_DEATH_RATES[1995]=0.0005; nach Imola-Reformen
    2000: 0,     // 2000+ nahezu 0
};
const getDeathTarget = (y) => {
    const keys = Object.keys(DEATH_TARGETS).map(Number).sort((a,b)=>a-b);
    let val = 0;
    for (const k of keys) { if (y >= k) val = DEATH_TARGETS[k]; }
    return val;
};
const deathTarget = getDeathTarget(year);
const deathDelta  = (avgDeaths - deathTarget).toFixed(2);
// Toleranz: ±50% des Ziels (min 0.2 für Niedrig-Raten), ±1.0 für hohe Raten
const tol = deathTarget > 1.0 ? 0.5 : Math.max(0.2, deathTarget * 0.5);
const deathOk = Math.abs(avgDeaths - deathTarget) <= tol ? '✓'
              : Math.abs(avgDeaths - deathTarget) <= tol * 2 ? '~' : '⚠';
const deathLable = deathTarget > 0
    ? ` | Ziel: ~${deathTarget} | Δ ${Number(deathDelta) > 0 ? '+' : ''}${deathDelta}  (Tol ±${tol.toFixed(2)})`
    : ' | Ziel: 0';

console.log(`║    Sim:  Ø ${avgDeaths.toFixed(2)} Tode/Saison${deathLable}  ${deathOk}`);
console.log(`║    Unfall-DNFs: Ø ${avgAccidents.toFixed(1)} | Fatal-Rate: ${fatalAccRate}%`);
console.log(`║    (deathRealism=${ctx.GAME_STATE?.deathRealism ?? 100}%)`);

// Champion-Punkte
console.log(`║`);
console.log(`║  CHAMPION-PUNKTE`);
const pts = results.championPoints;
if (pts.length) {
    pts.sort((a,b)=>a-b);
    const median = pts[Math.floor(pts.length/2)];
    const realPts = truth?.championPoints;
    const realStr = realPts != null ? ` | real: ${realPts}` : '';
    console.log(`║    Ø ${avg(pts)} Pkt  |  Median: ${median}  |  Min: ${pts[0]}  |  Max: ${pts[pts.length-1]}${realStr}`);
}

// ── PRIVATEER-BERICHT ─────────────────────────────────────────────────────
if (results.privateerCounts.some(n => n > 0)) {
    console.log(`║`);
    console.log(`╠═══════════════════════════════════════════════════╣`);
    console.log(`║  PRIVATFAHRER-SYSTEM`);

    const avgPrivateers = avgN(results.privateerCounts).toFixed(1);
    const avgWorks      = avgN(results.worksCounts).toFixed(1);
    console.log(`║    Werksfahrer:       Ø ${avgWorks} pro Saison`);
    console.log(`║    Privatfahrer:      Ø ${avgPrivateers} pro Saison`);

    const avgGrid = avgN(results.avgGridSizes).toFixed(1);
    const gridSize = ctx.GAME_STATE.races?.length > 0
        ? (() => { try { return ctx.getGridSize(year, ctx.GAME_STATE.races[0]); } catch(e) { return '?'; } })()
        : '?';
    console.log(`║    Ø Feld pro Rennen: ${avgGrid} Fahrer  (Grid-Cap: ${gridSize})`);

    if (results.privateerEntryRates.length) {
        const entryRate = avgN(results.privateerEntryRates).toFixed(1);
        console.log(`║    Privateer-Meldequote: Ø ${entryRate}%  (pro Rennen)`);
    }

    if (results.privateersThatRacedRates.length) {
        const racedRate = avgN(results.privateersThatRacedRates).toFixed(1);
        console.log(`║    Privateers mit ≥1 Rennen: Ø ${racedRate}%  (erscheinen in Matrix)`);
    }

    if (results.privateerDNQRates.length) {
        const dnqShare = avgN(results.privateerDNQRates).toFixed(1);
        const workShare = (100 - parseFloat(dnqShare)).toFixed(1);
        console.log(`║    DNQ-Verteilung:   Privateer ${dnqShare}%  /  Works ${workShare}%`);
    }

    // Plausibilitäts-Check
    console.log(`║`);
    const avgGridNum = avgN(results.avgGridSizes);
    const gridCapNum = typeof gridSize === 'number' ? gridSize : 0;
    const fillRate   = gridCapNum > 0 ? (avgGridNum / gridCapNum * 100).toFixed(0) : '?';
    const fillOk     = gridCapNum > 0 && avgGridNum >= gridCapNum * 0.85;
    console.log(`║    Grid-Auslastung: ${fillRate}%  ${fillOk ? '✓' : '⚠ unter 85% – zu wenig Meldungen'}`);

    const entryRateNum = avgN(results.privateerEntryRates);
    const entryOk = entryRateNum >= 30 && entryRateNum <= 85;
    console.log(`║    Meldequote plausibel: ${entryOk ? '✓' : '⚠ außerhalb 30–85%'}`);
} else {
    console.log(`║`);
    console.log(`║  (Kein Privatfahrer-System aktiv für ${year})`);
}

// Realitäts-Abweichungen
if (truth) {
    console.log(`║`);
    console.log(`╠═══════════════════════════════════════════════════╣`);
    console.log(`║  REALITÄTS-ABGLEICH ${year}`);

    const realChampPct = realChampGameId && results.champions[realChampGameId]
        ? pct(results.champions[realChampGameId]) : '0.0%';
    const champOk = parseFloat(realChampPct) >= 20 ? '✓' : '⚠';
    console.log(`║  ${champOk} Realchampion ${truth.championName || truth.champion}: ${realChampPct} der Sims`);

    const realTeamPct = realTeamGameId && results.championTeams[realTeamGameId]
        ? pct(results.championTeams[realTeamGameId]) : '0.0%';
    const teamOk = parseFloat(realTeamPct) >= 20 ? '✓' : '⚠';
    console.log(`║  ${teamOk} Real-Konstrukteur ${truth.championTeamName || truth.championTeam}: ${realTeamPct} der Sims`);

    if (realDNF != null) {
        const delta = Math.abs(simDNF - realDNF * 100);
        const dnfOk = delta < 5 ? '✓' : delta < 10 ? '~' : '⚠';
        console.log(`║  ${dnfOk} DNF-Abweichung: ${delta.toFixed(1)}% (${delta < 5 ? 'ok' : delta < 10 ? 'tolerabel' : 'zu groß'})`);
    }

    for (const [id, n] of sort(results.championTeams).slice(0, 3)) {
        if (id !== realTeamGameId && n / successfulSims > 0.25) {
            console.log(`║  ⚠ ${teamNameOf(id)} zu dominant: ${pct(n)} (real nicht Champion)`);
        }
    }

    // Todes-Plausibilität im Realitäts-Abgleich
    if (deathTarget > 0) {
        console.log(`║  ${deathOk} Tode/Saison: Sim Ø ${avgDeaths.toFixed(2)} vs. ~${deathTarget}/Jahr (Δ ${Number(deathDelta) > 0 ? '+' : ''}${deathDelta})`);
    } else {
        const noDeathOk = avgDeaths < 0.1 ? '✓' : '⚠';
        console.log(`║  ${noDeathOk} Tode/Saison: Sim Ø ${avgDeaths.toFixed(2)} (Ziel: 0 ab 2000)`);
    }
}

console.log(`╚═══════════════════════════════════════════════════╝`);
console.log(`\nTipp: node tests/generate-truth.js  →  historical_truth.json erzeugen`);
console.log(`      node tests/monte-carlo.js ${year} 100  →  mehr Simulationen`);
console.log(`      node tests/monte-carlo.js 1965 50   →  Privatfahrer-Test (viele Privateers)\n`);
