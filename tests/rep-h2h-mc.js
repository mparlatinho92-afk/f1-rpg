/**
 * rep-h2h-mc.js  –  Reputation & H2H-Einfluss-Analyse (Welle 2)
 *
 * Misst, welchen Einfluss die Teamkollegen-H2H-Duelle (h2hSeason) auf den neuen
 * driver.reputation-Skalar haben – gegen die UNCOMMITTETE index.html (SIMCORE_FROM_INDEX).
 *
 * Verwendung:
 *   node tests/rep-h2h-mc.js <startJahr> <endJahr> [simulationen]
 * Beispiel:
 *   node tests/rep-h2h-mc.js 1990 2000 15
 *
 * Methodik:
 *   - Jede Saison wird voll simuliert; danach updateDriverCareerScores + updateDriverReputations
 *     (REP_DEBUG=on → legt Komponenten in driver._repParts offen).
 *   - Schatten-Reputation "ohne H2H" wird parallel per identischer EMA geführt.
 *   - Report: H2H-Abdeckung, Termgrößen, und wie oft H2H die Gameplay-Schwellen
 *     (rep≥75 Champion-Floor / rep<35 leicht ersetzbar) kippt.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';   // gegen index.html testen, nicht gegen alten Monolith
const { getContext } = require('./sim-core');

const args      = process.argv.slice(2);
const startYear = parseInt(args[0]) || 1990;
const endYear   = parseInt(args[1]) || startYear + 10;
const N         = parseInt(args[2]) || 15;

console.log(`\n═══════════════════════════════════════════════════════════`);
console.log(`  Reputation × H2H-Einfluss  |  ${startYear}→${endYear}  |  ${N} Sims`);
console.log(`═══════════════════════════════════════════════════════════\n`);

const ctx = getContext();
ctx.REP_DEBUG = true;   // Instrumentierung in updateDriverReputations aktivieren

// Muss identisch zu seedReputationFromPace() in index.html sein → saubere H2H-Isolierung
// (Schatten-Reputation seedet aus derselben Pace-Prognose wie die echte).
function seedFromPace(d) {
    const p = (d && (d.currentPace || d.pace)) || 75;
    return Math.max(32, Math.min(72, Math.round(50 + (p - 75) * 1.2)));
}

function simulateSeason(c) {
    const races = c.GAME_STATE.races;
    for (let i = 0; i < races.length; i++) {
        const isRain = Math.random() < 0.15;
        try {
            if (typeof c.simulateTraining === 'function') c.simulateTraining(i);
            c.simulateQualifying(i, isRain);
            const result = c.simulateRace(i, isRain);
            if (!result) continue;
            c.applyRaceResults(result);
        } catch (_) { /* einzelnes Rennen überspringen */ }
    }
}

// ── Aggregatoren ────────────────────────────────────────────────────────────
const samples = [];          // ein Eintrag je (Fahrer, Saison) mit Datenbasis
let totalDriverSeasons = 0;  // alle _repParts-Samples
let h2hCountedCount = 0;     // davon mit ≥6 Duellen
let simErrors = 0, okSims = 0;

// Schwellen-Kippungen (Gameplay-Konsequenz)
let flip75 = 0, flip35 = 0, thresholdSamples = 0;

for (let sim = 0; sim < N; sim++) {
    try {
        ctx.initFromYear(startYear);
        const shadowRep = {};   // driver.id → Reputation OHNE H2H (parallele EMA)

        for (let year = startYear; year <= endYear; year++) {
            simulateSeason(ctx);

            // _repParts vor Neuberechnung leeren → keine Stale-Reads
            for (const d of ctx.GAME_STATE.drivers) delete d._repParts;

            if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
            ctx.updateDriverReputations();

            // Samples einsammeln + Schatten-Reputation fortschreiben
            for (const d of ctx.GAME_STATE.drivers) {
                const p = d._repParts;
                if (!p) continue;
                totalDriverSeasons++;
                if (p.h2hCounted) h2hCountedCount++;

                const prevShadow = (typeof shadowRep[d.id] === 'number') ? shadowRep[d.id] : seedFromPace(d);
                const newShadow  = Math.round(0.65 * prevShadow + 0.35 * p.baseNoH2H);
                shadowRep[d.id]  = newShadow;

                const real = p.reputation;   // geglättete Reputation MIT H2H
                thresholdSamples++;
                if ((real >= 75) !== (newShadow >= 75)) flip75++;
                if ((real <  35) !== (newShadow <  35)) flip35++;

                samples.push({
                    h2hCounted: p.h2hCounted,
                    h2hTerm: p.h2hTerm,
                    absH2H: Math.abs(p.h2hTerm),
                    absOverperf: Math.abs(p.overperfTerm),
                    absTitle: Math.abs(p.titleTerm),
                    absWin: Math.abs(p.winTerm),
                    absPodium: Math.abs(p.podiumTerm),
                    repDiff: real - newShadow,        // Einfluss von H2H auf geglättete Reputation
                });
            }

            if (year >= endYear) break;

            // ── Saison-Übergang (wie monte-carlo-multi, ohne erneuten careerScores-Call) ──
            if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
            if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
            if (typeof ctx.initReservePool === 'function') ctx.initReservePool(year + 1);
            if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(year + 1);
            if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        okSims++;
    } catch (e) {
        simErrors++;
        if (simErrors <= 3) console.log(`  [Sim ${sim}] Fehler: ${e.message}`);
    }
}

// ── Auswertung ──────────────────────────────────────────────────────────────
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
const fmt  = (v, d = 2) => v.toFixed(d);
const counted = samples.filter(s => s.h2hCounted);

console.log(`\n  ${okSims}/${N} Sims ok.  Fahrer-Saisons mit Datenbasis: ${totalDriverSeasons}\n`);

console.log('── H2H-ABDECKUNG ──────────────────────────────────────────');
console.log(`  ≥6 Duelle (H2H gewertet):   ${h2hCountedCount}/${totalDriverSeasons}  (${fmt(h2hCountedCount / totalDriverSeasons * 100, 1)}%)`);
console.log(`  darunter (Rauschen, term=0): ${totalDriverSeasons - h2hCountedCount}\n`);

console.log('── MITTLERE |TERM|-GRÖSSE (nur gewertete Samples) ─────────');
console.log(`  Ø |Überperformance|:  ${fmt(mean(counted.map(s => s.absOverperf)))}`);
console.log(`  Ø |Titel|:            ${fmt(mean(counted.map(s => s.absTitle)))}`);
console.log(`  Ø |Siege|:            ${fmt(mean(counted.map(s => s.absWin)))}`);
console.log(`  Ø |Podien|:           ${fmt(mean(counted.map(s => s.absPodium)))}`);
console.log(`  Ø |H2H|:              ${fmt(mean(counted.map(s => s.absH2H)))}   ← Fokus`);
console.log(`  H2H-Term Spanne:      ${fmt(Math.min(...counted.map(s => s.h2hTerm)), 1)} … ${fmt(Math.max(...counted.map(s => s.h2hTerm)), 1)}\n`);

// H2H-Term Histogramm
const buckets = { '≤-7': 0, '-7…-3': 0, '-3…0': 0, '0': 0, '0…3': 0, '3…7': 0, '≥7': 0 };
for (const s of counted) {
    const t = s.h2hTerm;
    if (t <= -7) buckets['≤-7']++;
    else if (t < -3) buckets['-7…-3']++;
    else if (t < 0) buckets['-3…0']++;
    else if (t === 0) buckets['0']++;
    else if (t <= 3) buckets['0…3']++;
    else if (t < 7) buckets['3…7']++;
    else buckets['≥7']++;
}
console.log('── H2H-TERM VERTEILUNG (gewertete Samples) ────────────────');
for (const [k, v] of Object.entries(buckets)) {
    const pct = counted.length ? v / counted.length * 100 : 0;
    const bar = '█'.repeat(Math.round(pct / 2));
    console.log(`  ${k.padStart(6)}: ${String(v).padStart(5)}  ${fmt(pct, 1).padStart(5)}%  ${bar}`);
}
console.log();

console.log('── EINFLUSS AUF GEGLÄTTETE REPUTATION (mit vs. ohne H2H) ───');
const absDiffs = samples.map(s => Math.abs(s.repDiff));
console.log(`  Ø |Δ Reputation| (alle Samples):     ${fmt(mean(absDiffs))} Punkte`);
console.log(`  Ø |Δ Reputation| (nur gewertete):    ${fmt(mean(counted.map(s => Math.abs(s.repDiff))))} Punkte`);
console.log(`  max |Δ Reputation|:                  ${fmt(Math.max(...absDiffs), 1)} Punkte\n`);

console.log('── GAMEPLAY-KONSEQUENZ (Schwellen-Kippung durch H2H) ──────');
console.log(`  Champion-Floor rep≥75 gekippt:   ${flip75}/${thresholdSamples}  (${fmt(flip75 / thresholdSamples * 100, 2)}%)`);
console.log(`  Leicht-ersetzbar rep<35 gekippt: ${flip35}/${thresholdSamples}  (${fmt(flip35 / thresholdSamples * 100, 2)}%)`);
console.log(`\n  (Kippung = H2H verschiebt die Reputation über/unter die Schwelle,`);
console.log(`   die in processTeamChanges Transfers steuert → direkte Spielwirkung.)\n`);
