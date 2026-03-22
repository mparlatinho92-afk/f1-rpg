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
const indyMode = args.includes('--indy');

console.log(`\n═══════════════════════════════════════════════════`);
console.log(`  F1 RPG Monte-Carlo  |  Jahr: ${year}  |  Sims: ${N}`);
console.log(`  Szenario: ${indyMode ? 'INDY 500' : szenArg}`);
console.log(`═══════════════════════════════════════════════════\n`);

// ── Indy-Only-Modus ───────────────────────────────────────────────────────
if (indyMode) {
    const ctx2 = getContext();
    let indyDeaths = 0, indyAccidents = 0, indyStarts = 0, indyRaces = 0;
    let indyDeathsPerRace = [];
    console.log(`Simuliere ${N} Indianapolis-500-Rennen...\n`);
    for (let sim = 0; sim < N; sim++) {
        try {
            ctx2.initFromYear(year);
            const races = ctx2.GAME_STATE.races;
            const indyIdx = races.findIndex(r => r.isIndy || (r.name && r.name.includes('Indianapolis')));
            if (indyIdx === -1) { console.log(`[!] Kein Indy-Rennen in ${year} gefunden.`); process.exit(1); }
            ctx2.simulateQualifying(indyIdx, false);
            const result = ctx2.simulateRace(indyIdx, false);
            if (!result) continue;
            let deaths = 0, accidents = 0;
            for (const r of result.results) {
                indyStarts++;
                if (r.fatal) { indyDeaths++; deaths++; }
                if (r.dnf && r.dnfType === 'accident') { indyAccidents++; accidents++; }
            }
            indyDeathsPerRace.push(deaths);
            indyRaces++;
        } catch(e) { /* skip */ }
    }
    const avg = indyRaces ? indyDeaths / indyRaces : 0;
    const accAvg = indyRaces ? indyAccidents / indyRaces : 0;
    const fatalRate = indyAccidents > 0 ? (indyDeaths / indyAccidents * 100).toFixed(1) : '–';
    const zeroRaces = indyDeathsPerRace.filter(d => d === 0).length;
    const oneRaces  = indyDeathsPerRace.filter(d => d === 1).length;
    const twoPlus   = indyDeathsPerRace.filter(d => d >= 2).length;
    console.log(`╔═══════════════════════════════════════════════════╗`);
    console.log(`║  INDY 500 – ${year} (${indyRaces} Simulationen)`.padEnd(51) + `║`);
    console.log(`╠═══════════════════════════════════════════════════╣`);
    console.log(`║  Ø Tode pro Rennen:   ${avg.toFixed(3)}  (Ziel: ~0.636)`.padEnd(51) + `║`);
    console.log(`║  Ø Unfall-DNFs:       ${accAvg.toFixed(2)}`.padEnd(51) + `║`);
    console.log(`║  Fatal-Rate/Unfall:   ${fatalRate}%`.padEnd(51) + `║`);
    console.log(`║  Rennen ohne Tod:     ${zeroRaces} (${(zeroRaces/indyRaces*100).toFixed(0)}%)`.padEnd(51) + `║`);
    console.log(`║  Rennen mit 1 Tod:    ${oneRaces} (${(oneRaces/indyRaces*100).toFixed(0)}%)`.padEnd(51) + `║`);
    console.log(`║  Rennen mit ≥2 Tode:  ${twoPlus} (${(twoPlus/indyRaces*100).toFixed(0)}%)`.padEnd(51) + `║`);
    console.log(`║  Historisch (real):   ~0.636 Tode/Rennen (1950–60)`.padEnd(51) + `║`);
    const ok = Math.abs(avg - 0.636) <= 0.20;
    console.log(`║  Bewertung: ${ok ? '✓ Im Zielbereich' : '⚠ Abweichung >0.20'}`.padEnd(51) + `║`);
    console.log(`╚═══════════════════════════════════════════════════╝`);
    process.exit(0);
}

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
            c.simulateTraining(i);                       // Training → Qualifying → Rennen
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

            // DNF-Statistik (nur Rennergebnis, ohne Training/Qualifying)
            for (const r of result.results) {
                totalStarts++;
                if (r.dnf || r.fatal) totalDNFs++;
                if (r.dnf && r.dnfType === 'accident') totalAccidentDNFs++;
            }
        } catch(e) {
            // Einzelne Rennen überspringen
        }
    }

    // Todes-Statistik aus seasonDeaths – erfasst Training + Qualifying + Rennen
    const allDeaths = c.GAME_STATE.seasonDeaths || [];
    const totalDeaths        = allDeaths.length;
    const trainingDeaths     = allDeaths.filter(d => d.fatalSession === 'training').length;
    const qualifyingDeaths   = allDeaths.filter(d => d.fatalSession === 'qualifying').length;
    const raceDeaths         = allDeaths.filter(d => d.fatalSession === 'race').length;
    const indyDeaths         = allDeaths.filter(d => {
        const r = c.GAME_STATE.races[d.race];
        return r && (r.isIndy || (r.name && r.name.includes('Indianapolis')));
    }).length;
    const f1Deaths           = totalDeaths - indyDeaths;

    // Wie viele Privateers haben überhaupt je gemeldet?
    const privateersThatRaced = privateers.filter(d => d.firstRaceEntry !== undefined).length;

    return {
        totalStarts, totalDNFs,
        totalDeaths, totalAccidentDNFs,
        trainingDeaths, qualifyingDeaths, raceDeaths,
        indyDeaths, f1Deaths,
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
    deathsBySession: { training: [], qualifying: [], race: [] },
    indyDeathsPerSeason:        [],
    f1DeathsPerSeason:          [],

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
        results.deathsBySession.training.push(stats.trainingDeaths || 0);
        results.deathsBySession.qualifying.push(stats.qualifyingDeaths || 0);
        results.deathsBySession.race.push(stats.raceDeaths || 0);
        results.indyDeathsPerSeason.push(stats.indyDeaths || 0);
        results.f1DeathsPerSeason.push(stats.f1Deaths || 0);

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

// ── TODES-METRIKEN ────────────────────────────────────────────────────────
// Einzeljahr-Kontext (zu rauschbehaftet für Ziel-Vergleich)
console.log(`║`);
console.log(`║  TODE PRO SAISON`);
const avgDeaths    = avgN(results.deathsPerSeason);
const avgAccidents = avgN(results.accidentDNFsPerSeason);
const fatalAccRate = avgAccidents > 0 ? (avgDeaths / avgAccidents * 100).toFixed(1) : '–';
console.log(`║    Jahr ${year}: Ø ${avgDeaths.toFixed(2)} Tode | Unfall-DNFs Ø ${avgAccidents.toFixed(1)} | Fatal-Rate ${fatalAccRate}%`);

// ── ÄRA-SIMULATION (5-Jahres-Durchschnitt für stabilen Ziel-Vergleich) ──
// Einzeljahre schwanken stark (Grid-Größe, Rennanzahl, DNF-Rate variieren).
// → Alle 5 Jahre der Ära simulieren, Durchschnitt vs. Ziel vergleichen.
// Non-Indy F1 WM-Tode: reale Tode/Ära ÷ 5 Saisons (Indy 500 separat)
const ERA_DEATH_TARGETS = {
    1950: 0.4,   // 2 Tode (Fagioli/Marimón)
    1955: 0.6,   // 3 Tode (Musso/Collins/Lewis-Evans)
    1960: 0.8,   // 4 Tode (Bristow/Stacey/vTrips/deBeaufort)
    1965: 0.55,  // ~3 Tode (Bandini/Schlesser/Mitter)
    1970: 1.0,   // 5 Tode (Rindt/Courage/Williamson/Cevert/Koinigg)
    1975: 0.6,   // 3 Tode (Donohue/Pryce/Peterson)
    1980: 0.4,   // 2 Tode (Villeneuve/Paletti)
    1985: 0,
    1990: 0.4,   // 2 Tode (Ratzenberger/Senna – beide 1994)
    1995: 0,
    2000: 0,
};
// Indy 500: 7 Tode / 11 Rennen (1950–1960) = 0.636/Rennen → 0.636/Saison
const INDY_DEATH_TARGET = 0.636;
const getEraDeathTarget = (y) => {
    const keys = Object.keys(ERA_DEATH_TARGETS).map(Number).sort((a,b)=>a-b);
    let val = 0;
    for (const k of keys) { if (y >= k) val = ERA_DEATH_TARGETS[k]; }
    return val;
};

// Ära-Grenzen: 5-Jahres-Block in dem `year` liegt
const eraStart = Math.floor(year / 5) * 5;
const eraEnd   = eraStart + 4;
const eraYears = [];
for (let y = eraStart; y <= eraEnd; y++) {
    try { resetAndInit(ctx, y); eraYears.push(y); } catch(e) {}
}

const eraN = Math.max(10, Math.ceil(N / Math.max(1, eraYears.length)));
let eraTotalDeaths = 0, eraTotalF1Deaths = 0, eraTotalIndyDeaths = 0, eraTotalAcc = 0, eraSimsDone = 0;

if (eraYears.length > 0) {
    for (const y of eraYears) {
        for (let s = 0; s < eraN; s++) {
            try {
                resetAndInit(ctx, y);
                const st = simulateSeason(ctx);
                eraTotalDeaths      += st.totalDeaths;
                eraTotalF1Deaths    += st.f1Deaths || 0;
                eraTotalIndyDeaths  += st.indyDeaths || 0;
                eraTotalAcc         += st.totalAccidentDNFs;
                eraSimsDone++;
            } catch(e) {}
        }
    }
}

const eraAvgDeaths     = eraSimsDone > 0 ? eraTotalDeaths / eraSimsDone : avgDeaths;
const eraAvgF1Deaths   = eraSimsDone > 0 ? eraTotalF1Deaths / eraSimsDone : 0;
const eraAvgIndyDeaths = eraSimsDone > 0 ? eraTotalIndyDeaths / eraSimsDone : 0;
const f1Target         = getEraDeathTarget(eraStart);
const hasIndy          = eraStart <= 1960 && eraEnd >= 1950;
const indyTarget       = hasIndy ? INDY_DEATH_TARGET : 0;
const totalTarget      = f1Target + indyTarget;
const eraDelta         = (eraAvgDeaths - totalTarget).toFixed(2);
const eraTol           = totalTarget > 1.0 ? 0.4 : Math.max(0.15, totalTarget * 0.4);
const eraOk            = Math.abs(eraAvgDeaths - totalTarget) <= eraTol ? '✓'
                       : Math.abs(eraAvgDeaths - totalTarget) <= eraTol * 2 ? '~' : '⚠';

const indyStr = hasIndy ? ` | Indy: ${eraAvgIndyDeaths.toFixed(2)}` : '';
const indyTargetStr = hasIndy ? ` (F1 ~${f1Target} + Indy ~${indyTarget})` : ` (~${f1Target})`;
console.log(`║    Ära  ${eraStart}–${eraEnd}: Ø ${eraAvgDeaths.toFixed(2)} Tode | F1: ${eraAvgF1Deaths.toFixed(2)}${indyStr} | Ziel: ~${totalTarget.toFixed(2)}${indyTargetStr}`);
console.log(`║    Δ ${Number(eraDelta)>=0?'+':''}${eraDelta}  (Tol ±${eraTol.toFixed(2)})  ${eraOk}`);
console.log(`║    (${eraYears.length} Jahre × ${eraN} Sims = ${eraSimsDone} Saisons | deathRealism=${ctx.GAME_STATE?.deathRealism ?? 100}%)`);

// ── Session-Verteilung: Erwartung vs. Simulation ──────────────────────────
const totalSessionDeaths =
    avgN(results.deathsBySession.training) +
    avgN(results.deathsBySession.qualifying) +
    avgN(results.deathsBySession.race);

if (totalSessionDeaths > 0.05) {
    try {
        const raceFrac  = ctx.ERA_RACE_DEATH_FRACTION || 0.75;
        const trainFrac = ctx.ERA_TRAINING_FRACTION   || 0.50;
        const expRace   = raceFrac * 100;
        const expTrain  = (1 - raceFrac) * trainFrac * 100;
        const expQuali  = (1 - raceFrac) * (1 - trainFrac) * 100;

        const simRace   = avgN(results.deathsBySession.race)       / totalSessionDeaths * 100;
        const simTrain  = avgN(results.deathsBySession.training)   / totalSessionDeaths * 100;
        const simQuali  = avgN(results.deathsBySession.qualifying) / totalSessionDeaths * 100;

        const badge = (exp, sim) => Math.abs(sim - exp) < 5 ? '✓' : Math.abs(sim - exp) < 10 ? '~' : '⚠';
        console.log(`║`);
        console.log(`║  SESSION-VERTEILUNG DER TODE`);
        console.log(`║    (Erwartung aus ERA_RACE/TRAINING_FRACTION → Sim-Ergebnis)`);
        console.log(`║    Rennen:     ${expRace.toFixed(0).padStart(3)}% → ${simRace.toFixed(0).padStart(3)}%  ${badge(expRace, simRace)}`);
        console.log(`║    Training:   ${expTrain.toFixed(0).padStart(3)}% → ${simTrain.toFixed(0).padStart(3)}%  ${badge(expTrain, simTrain)}`);
        console.log(`║    Qualifying: ${expQuali.toFixed(0).padStart(3)}% → ${simQuali.toFixed(0).padStart(3)}%  ${badge(expQuali, simQuali)}`);
    } catch(e) { /* ERA-Konstanten nicht im Kontext */ }
} else {
    console.log(`║    (zu wenig Tode für Session-Verteilung)`);
}

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

    // Todes-Plausibilität (Ära-Durchschnitt ist aussagekräftiger als Einzeljahr)
    if (totalTarget > 0) {
        console.log(`║  ${eraOk} Ära ${eraStart}–${eraEnd} Tode/Saison: Ø ${eraAvgDeaths.toFixed(2)} vs. ~${totalTarget.toFixed(2)} (Δ ${Number(eraDelta)>=0?'+':''}${eraDelta})`);
    } else {
        const noDeathOk = eraAvgDeaths < 0.05 ? '✓' : '⚠';
        console.log(`║  ${noDeathOk} Ära ${eraStart}–${eraEnd} Tode/Saison: Ø ${eraAvgDeaths.toFixed(2)} (Ziel: 0)`);
    }
}

console.log(`╚═══════════════════════════════════════════════════╝`);
console.log(`\nTipp: node tests/generate-truth.js  →  historical_truth.json erzeugen`);
console.log(`      node tests/monte-carlo.js ${year} 100  →  mehr Simulationen`);
console.log(`      node tests/monte-carlo.js 1965 50   →  Privatfahrer-Test (viele Privateers)\n`);
