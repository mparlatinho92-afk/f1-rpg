/**
 * gen-debut-age.js — Messtest (kein Code-Eingriff): realisiertes Debütalter GENERIERTER Fahrer
 *
 * KONTEXT: Für die Talent/Free-Agent-Reform soll das Seed-Alter der Talente so gesetzt werden,
 *   dass das REALISIERTE Debütalter (Alter beim 1. echten F1-Start) im Schnitt auf ERA_ROOKIE_AGE
 *   landet. Weil ein Pool-Talent erst wartet (und altert), bevor ein Sitz frei wird, muss der Seed
 *   ETWAS UNTER ERA_ROOKIE_AGE liegen. Dieser Test misst den Ist-Zustand, damit der Offset nicht
 *   geraten, sondern justiert wird.
 *
 * MISST:
 *   1. Realisiertes Debütalter generierter Fahrer (gen-/exp-) je Ära vs. ERA_ROOKIE_AGE
 *   2. Vergreisung: Alter generierter, NIE-gefahrener Wartender (Free Agents team=null + reservePool)
 *
 * Verwendung: node tests/gen-debut-age.js [sims] [startYear] [seasons]
 *   default: 6 Sims, Start 2010, 30 Saisons (läuft bis 2040 – weit hinter Template-Horizont 2025,
 *   also generierten-dominiert)
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');

const N       = parseInt(process.argv[2]) || 6;
const START   = parseInt(process.argv[3]) || 2010;
const SEASONS = parseInt(process.argv[4]) || 30;
const END     = START + SEASONS - 1;
console.log(`\n═══ Generierte-Debütalter-Tracker | ${START}–${END} | ${N} Sims ═══\n`);

// Spiegelt index.html L3777 (ERA_ROOKIE_AGE) – Referenzanker, read-only.
const ERA_ROOKIE_AGE = {
    1950: 35.5, 1955: 30.6, 1960: 30.1, 1965: 29.1, 1970: 29.7, 1975: 28.2,
    1980: 26.8, 1985: 26.5, 1990: 26.9, 1995: 25.1, 2000: 24.5, 2005: 24.5,
    2010: 23.6, 2015: 22.6, 2020: 22.3, 2025: 21.5,
};
const ERA_RETIREMENT_AGE = {
    1950: 38.3, 1955: 35.0, 1960: 33.9, 1965: 32.9, 1970: 33.6, 1975: 31.3,
    1980: 30.9, 1985: 32.6, 1990: 30.9, 1995: 30.8, 2000: 28.9, 2005: 29.1,
    2010: 28.3, 2015: 26.6, 2020: 27.3, 2025: 28.0,
};
// "letzter Schlüssel ≤ Jahr" (wie getEraValue seit v0.9-Fix)
function eraVal(table, year) {
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    let v = table[keys[0]];
    for (const k of keys) { if (k <= year) v = table[k]; else break; }
    return v;
}

const ctx = getContext();

function simulateSeason(c) {
    const races = c.GAME_STATE.races;
    for (let i = 0; i < races.length; i++) {
        const rain = Math.random() < 0.15;
        try {
            if (c.simulateTraining) c.simulateTraining(i);
            c.simulateQualifying(i, rain);
            const r = c.simulateRace(i, rain);
            if (r) c.applyRaceResults(r);
        } catch (_) {}
    }
}
const isGen = d => d && /^(gen-|exp-)/.test(String(d.id));

// Debüts: { year, age, kind ('gen'|'exp') }
const debuts = [];
// Vergreisung: Alter nie-gefahrener Wartender am Sim-Ende
const waitingAges = [];
let okSims = 0, errSims = 0;

for (let sim = 0; sim < N; sim++) {
    try {
        ctx.initFromYear(START);
        const seenRaced = new Set();   // gen-ids die schon gefahren sind
        for (let year = START; year <= END; year++) {
            simulateSeason(ctx);

            // Debüt = erster Saison-Auftritt eines generierten Fahrers MIT Team (= gefahren)
            for (const d of ctx.GAME_STATE.drivers) {
                if (d.status && d.status !== 'active') continue;
                if (!d.team) continue;
                if (!isGen(d) || !d.birthYear) continue;
                if (seenRaced.has(d.id)) continue;
                seenRaced.add(d.id);
                debuts.push({ year, age: year - d.birthYear, kind: /^exp-/.test(d.id) ? 'exp' : 'gen' });
            }

            if (year >= END) {
                // Vergreisungs-Snapshot: generierte, nie-gefahrene Wartende
                const waiters = [
                    ...ctx.GAME_STATE.drivers.filter(d => (!d.status || d.status === 'active') && !d.team),
                    ...(ctx.GAME_STATE.reservePool || []),
                ];
                for (const d of waiters) {
                    if (!isGen(d) || !d.birthYear || seenRaced.has(d.id)) continue;
                    waitingAges.push(year - d.birthYear);
                }
                break;
            }

            if (ctx.updateDriverCareerScores)     ctx.updateDriverCareerScores();
            if (ctx.updateDriverReputations)      ctx.updateDriverReputations();
            if (ctx.processDriverPaceDevelopment) ctx.processDriverPaceDevelopment();
            if (ctx.checkCareerEnds)              ctx.checkCareerEnds();
            if (ctx.initReservePool)              ctx.initReservePool(year + 1);
            if (ctx._injectNewSeasonDrivers)      ctx._injectNewSeasonDrivers(year + 1);
            if (ctx.processTeamChanges)           ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        okSims++;
    } catch (e) { errSims++; if (errSims <= 3) console.log('  Fehler:', e.message); }
}

// ── Auswertung ──────────────────────────────────────────────────────────────
function stat(a) {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    const sum = s.reduce((x, y) => x + y, 0);
    return { n: s.length, min: s[0], max: s[s.length - 1], avg: sum / s.length, median: s[Math.floor(s.length / 2)] };
}
const fmt = s => s ? `n ${s.n} · Ø ${s.avg.toFixed(1)} · Median ${s.median} · min ${s.min} · max ${s.max}` : '–';

console.log(`${okSims}/${N} Sims ok. ${debuts.length} generierte Debüts erfasst.\n`);

console.log('── REALISIERTES DEBÜTALTER (generiert) vs. ERA_ROOKIE_AGE ──');
console.log(`  Gesamt:   ${fmt(stat(debuts.map(d => d.age)))}`);
console.log(`  Rookies (gen-): ${fmt(stat(debuts.filter(d => d.kind === 'gen').map(d => d.age)))}`);
console.log(`  Erfahren (exp-):${fmt(stat(debuts.filter(d => d.kind === 'exp').map(d => d.age)))}`);

// Je Ära-Fünfjahresblock: realisiertes Debütalter vs. Referenz
console.log('\n── DEBÜTALTER JE ÄRA (Ist Ø  vs  ERA_ROOKIE_AGE  → Δ) ──');
const eraBuckets = {};
for (const d of debuts) {
    const key = Math.floor(d.year / 5) * 5;
    (eraBuckets[key] = eraBuckets[key] || []).push(d.age);
}
for (const key of Object.keys(eraBuckets).map(Number).sort((a, b) => a - b)) {
    const s = stat(eraBuckets[key]);
    const ref = eraVal(ERA_ROOKIE_AGE, key);
    const delta = s.avg - ref;
    console.log(`  ${key}s: Ist Ø ${s.avg.toFixed(1).padStart(4)}  vs  Ref ${ref.toFixed(1)}   → Δ ${(delta >= 0 ? '+' : '') + delta.toFixed(1)}  (n ${s.n})`);
}

console.log('\n── VERGREISUNG: nie-gefahrene generierte Wartende (Sim-Ende) ──');
const wSt = stat(waitingAges);
console.log(`  Alter: ${fmt(wSt)}`);
if (wSt) {
    const retAnchor = eraVal(ERA_RETIREMENT_AGE, END);
    const overAged = waitingAges.filter(a => a > retAnchor).length;
    console.log(`  über Ära-Rentenalter (${retAnchor.toFixed(0)}): ${overAged}/${wSt.n}  (${(overAged / wSt.n * 100).toFixed(0)}%)  ← hoher Wert = Talente vergreisen im Pool`);
}
console.log();
