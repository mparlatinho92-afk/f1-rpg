/**
 * monte-carlo.js  –  F1 RPG Simulations-Testmaschine
 *
 * Verwendung:
 *   node tests/monte-carlo.js <jahr> [simulationen] [--szenario=NAME]
 *
 * Beispiele:
 *   node tests/monte-carlo.js 1967 50
 *   node tests/monte-carlo.js 1984 100 --szenario=dominanz
 *
 * Szenarien (--szenario):
 *   dominanz   – Top-Team-Dominanz und Titelverteilung
 *   balance    – DNF-Rate, Punkte-Spreizung, Pace-Verteilung
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
    // Spielstand zurücksetzen und Saison initialisieren
    // initFromYear setzt GAME_STATE komplett neu auf
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

    for (let i = 0; i < races.length; i++) {
        const isRain = Math.random() < 0.15;
        try {
            c.simulateQualifying(i, isRain);
            const result = c.simulateRace(i, isRain);
            if (!result) continue;
            c.applyRaceResults(result);

            // DNF-Statistik sammeln
            for (const r of result.results) {
                totalStarts++;
                if (r.dnf || r.fatal) totalDNFs++;
            }
        } catch(e) {
            // Einzelne Rennen können selten fehler haben – überspringen
        }
    }

    return { totalStarts, totalDNFs };
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

function getDriverName(c, id) {
    const d = (c.GAME_STATE.drivers || []).find(d => d.id === id);
    return d ? d.name : id;
}

// ── Simulation laufen lassen ───────────────────────────────────────────────
console.log(`Simuliere ${N} Saisons...`);
const progress = Math.max(1, Math.floor(N / 10));

const results = {
    champions:     {},  // driverId → Anzahl Titel
    championTeams: {},  // teamId   → Anzahl Titel
    teamWins:      {},  // teamId   → Gesamtsiege
    driverWins:    {},  // driverId → Gesamtsiege
    dnfRates:      [],  // pro Saison
    championPoints:[],  // Punkte des Champions pro Saison
    raceCount:      0,
};

let successfulSims = 0;

for (let sim = 0; sim < N; sim++) {
    if (sim % progress === 0) process.stdout.write(`  ${Math.round(sim/N*100)}%... `);

    try {
        resetAndInit(ctx, year);
        const { totalStarts, totalDNFs } = simulateSeason(ctx);

        const champ    = getChampion(ctx);
        const topTeam  = getTopTeam(ctx);

        if (champ) {
            results.champions[champ.id]     = (results.champions[champ.id] || 0) + 1;
            results.championPoints.push(champ.points);
        }
        if (topTeam) {
            results.championTeams[topTeam.id] = (results.championTeams[topTeam.id] || 0) + 1;
        }

        // Siege sammeln
        for (const [dId, s] of Object.entries(ctx.GAME_STATE.driverStandings)) {
            if (s.wins > 0) results.driverWins[dId] = (results.driverWins[dId] || 0) + s.wins;
        }
        for (const [tId, s] of Object.entries(ctx.GAME_STATE.teamStandings)) {
            if (s.wins > 0) results.teamWins[tId] = (results.teamWins[tId] || 0) + s.wins;
        }

        if (totalStarts > 0) results.dnfRates.push(totalDNFs / totalStarts);
        results.raceCount = ctx.GAME_STATE.races.length;

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
const sort = (obj) => Object.entries(obj).sort((a,b)=>b[1]-a[1]);

// Fahrernamen nachschlagen (letzter Spielstand)
const nameOf = (id) => {
    const d = (ctx.GAME_STATE.drivers||[]).find(d=>d.id===id);
    return d ? d.name : id;
};

// Team-Namen nachschlagen
const teamNameOf = (id) => {
    const t = (ctx.GAME_STATE.teams||[]).find(t=>t.id===id);
    return t ? t.name : id;
};

// Hilfsfunktion: Game-Champion-ID anhand des Real-Namens finden
const findChampIdByName = (realName) => {
    if (!realName) return null;
    const needle = realName.toLowerCase();
    // Exakter Treffer zuerst
    for (const id of Object.keys(results.champions)) {
        if (nameOf(id).toLowerCase() === needle) return id;
    }
    // Teilstring-Treffer (Nachname)
    const lastName = needle.split(' ').pop();
    for (const id of Object.keys(results.champions)) {
        if (nameOf(id).toLowerCase().includes(lastName)) return id;
    }
    return null;
};

// Hilfsfunktion: Game-Team-ID anhand des Real-Namens finden
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
const simDNF = parseFloat(avg(results.dnfRates) );
const realDNF = truth?.dnfRate;
const dnfDelta = realDNF != null ? ` | real: ${(realDNF*100).toFixed(1)}% | Δ ${((simDNF - realDNF*100)).toFixed(1)}%` : '';
console.log(`║  DNF-RATE`);
console.log(`║    Sim:  ${(simDNF).toFixed(1)}%${dnfDelta}`);

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

// Realitäts-Abweichungen
if (truth) {
    console.log(`║`);
    console.log(`╠═══════════════════════════════════════════════════╣`);
    console.log(`║  REALITÄTS-ABGLEICH ${year}`);

    // Champion richtig?
    const realChampPct = realChampGameId && results.champions[realChampGameId]
        ? pct(results.champions[realChampGameId]) : '0.0%';
    const champOk = parseFloat(realChampPct) >= 20 ? '✓' : '⚠';
    console.log(`║  ${champOk} Realchampion ${truth.championName || truth.champion}: ${realChampPct} der Sims`);

    // Top-Team richtig?
    const realTeamPct = realTeamGameId && results.championTeams[realTeamGameId]
        ? pct(results.championTeams[realTeamGameId]) : '0.0%';
    const teamOk = parseFloat(realTeamPct) >= 20 ? '✓' : '⚠';
    console.log(`║  ${teamOk} Real-Konstrukteur ${truth.championTeamName || truth.championTeam}: ${realTeamPct} der Sims`);

    // DNF-Abgleich
    if (realDNF != null) {
        const delta = Math.abs(simDNF - realDNF*100);
        const dnfOk = delta < 5 ? '✓' : delta < 10 ? '~' : '⚠';
        console.log(`║  ${dnfOk} DNF-Abweichung: ${delta.toFixed(1)}% (${delta < 5 ? 'ok' : delta < 10 ? 'tolerabel' : 'zu groß'})`);
    }

    // Überraschende Dominatoren (sim stark, real nicht)
    for (const [id, n] of sort(results.championTeams).slice(0, 3)) {
        if (id !== realTeamGameId && n / successfulSims > 0.25) {
            console.log(`║  ⚠ ${teamNameOf(id)} zu dominant: ${pct(n)} (real nicht Champion)`);
        }
    }
}

console.log(`╚═══════════════════════════════════════════════════╝`);
console.log(`\nTipp: node tests/generate-truth.js  →  historical_truth.json erzeugen`);
console.log(`      node tests/monte-carlo.js ${year} 100  →  mehr Simulationen\n`);
