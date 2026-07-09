/**
 * rep-retention-mc.js  –  Langzeit-Regressionstest der reputationsabhängigen Retention (Welle 2)
 *
 * Prüft über viele Saisons zwei Kernversprechen aus Paket G:
 *   1) Champion → Auto-Tier der Folgesaison. Ziel: ein amtierender Champion landet fast nie
 *      in einem Backmarker-Auto (Paket G: P(≥Mittelfeld) ≈ 0.96, Backmarker ≈ 4% und meist
 *      nur durch Team-Kollaps, nicht durch aktiven Wechsel).
 *   2) Underdog-Aufstieg: Fahrer mit hohem Ansehen (rep≥70) in NICHT-Top-Autos → wie oft
 *      steigen sie eine Auto-Klasse auf? (Reputations-Upgrade-Pfad wirkt.)
 *
 * Auto-Tier = carSpeed-Ranking (top = getTopTeamCount, mid = bis 70%, back = Rest).
 *
 * Verwendung:  node tests/rep-retention-mc.js <startJahr> <endJahr> [sims]
 * Beispiel:    node tests/rep-retention-mc.js 1995 2012 12
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');

const args      = process.argv.slice(2);
const startYear = parseInt(args[0]) || 1995;
const endYear   = parseInt(args[1]) || startYear + 17;
const N         = parseInt(args[2]) || 12;

console.log(`\n═══════════════════════════════════════════════════════════`);
console.log(`  Reputation-Retention (Langzeit)  |  ${startYear}→${endYear}  |  ${N} Sims`);
console.log(`═══════════════════════════════════════════════════════════\n`);

const ctx = getContext();

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
        } catch (_) {}
    }
}
function getChampion(c) {
    let best = null;
    for (const [id, s] of Object.entries(c.GAME_STATE.driverStandings || {})) {
        if (!best || (s.points || 0) > (best.points || 0)) best = { id, points: s.points || 0 };
    }
    return best && best.points > 0 ? best : null;
}
// Auto-Tier je Team über carSpeed-Ranking
function teamTierMap(c) {
    const teams = (c.GAME_STATE.teams || []).slice().sort((a, b) => (b.carSpeed || 70) - (a.carSpeed || 70));
    const n = teams.length || 1;
    const topN = typeof c.getTopTeamCount === 'function' ? c.getTopTeamCount(n) : Math.max(2, Math.ceil(0.3 * n));
    const midN = Math.max(4, Math.ceil(0.7 * n));
    const map = {};
    teams.forEach((t, i) => { map[t.id] = i < topN ? 'top' : i < midN ? 'mid' : 'back'; });
    return map;
}
const TIER_RANK = { back: 0, mid: 1, top: 2 };

// ── Aggregatoren ────────────────────────────────────────────────────────────
const champNext = { top: 0, mid: 0, back: 0, leftF1: 0 };   // Champion Y → Auto-Tier Y+1
let champTotal = 0;
const champByFromTier = { top: {}, mid: {}, back: {} };     // wo der Champion herkam → wohin

let underdogTotal = 0, underdogUp = 0, underdogSame = 0, underdogDown = 0, underdogLeft = 0;
let okSims = 0, simErrors = 0;

for (let sim = 0; sim < N; sim++) {
    try {
        ctx.initFromYear(startYear);

        for (let year = startYear; year <= endYear; year++) {
            simulateSeason(ctx);
            const champ = getChampion(ctx);

            if (year >= endYear) break;

            // Reputationen VOR den Transfers aktualisieren (wie im echten Saisonende)
            if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
            ctx.updateDriverReputations();

            // Snapshot am Ende von Jahr Y (vor Transfers)
            const tierBefore = teamTierMap(ctx);
            const drvById = id => (ctx.GAME_STATE.drivers || []).find(d => d.id === id);
            const champTeamY = champ ? (drvById(champ.id) || {}).team : null;
            const champFromTier = champTeamY ? tierBefore[champTeamY] : null;

            // Underdog-Kandidaten: rep≥70 in nicht-Top-Auto
            const underdogs = (ctx.GAME_STATE.drivers || [])
                .filter(d => (!d.status || d.status === 'active') && d.team &&
                             typeof d.reputation === 'number' && d.reputation >= 70 &&
                             tierBefore[d.team] && tierBefore[d.team] !== 'top')
                .map(d => ({ id: d.id, fromTier: tierBefore[d.team] }));

            // Saison-Übergang
            if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
            if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
            if (typeof ctx.initReservePool === 'function') ctx.initReservePool(year + 1);
            if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(year + 1);
            if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();
            ctx.startNewSeason();

            const tierAfter = teamTierMap(ctx);

            // Champion-Übergang bewerten
            if (champ && champFromTier) {
                champTotal++;
                const d2 = drvById(champ.id);
                if (!d2 || (d2.status && d2.status !== 'active') || !d2.team) {
                    champNext.leftF1++;
                } else {
                    const t2 = tierAfter[d2.team] || 'back';
                    champNext[t2]++;
                    champByFromTier[champFromTier][t2] = (champByFromTier[champFromTier][t2] || 0) + 1;
                }
            }

            // Underdog-Aufstieg bewerten
            for (const u of underdogs) {
                underdogTotal++;
                const d2 = drvById(u.id);
                if (!d2 || (d2.status && d2.status !== 'active') || !d2.team) { underdogLeft++; continue; }
                const t2 = tierAfter[d2.team] || 'back';
                const delta = TIER_RANK[t2] - TIER_RANK[u.fromTier];
                if (delta > 0) underdogUp++;
                else if (delta === 0) underdogSame++;
                else underdogDown++;
            }
        }
        okSims++;
    } catch (e) {
        simErrors++;
        if (simErrors <= 3) console.log(`  [Sim ${sim}] Fehler: ${e.message}`);
    }
}

// ── Auswertung ──────────────────────────────────────────────────────────────
const pct = (n, t) => t ? (n / t * 100).toFixed(1) + '%' : '–';
console.log(`\n  ${okSims}/${N} Sims ok.\n`);

console.log('── CHAMPION → AUTO-TIER DER FOLGESAISON ───────────────────');
console.log(`  Champions beobachtet: ${champTotal}`);
console.log(`  → Top-Auto:    ${champNext.top}   (${pct(champNext.top, champTotal)})`);
console.log(`  → Mittelfeld:  ${champNext.mid}   (${pct(champNext.mid, champTotal)})`);
console.log(`  → Backmarker:  ${champNext.back}   (${pct(champNext.back, champTotal)})   ← Ziel: sehr niedrig`);
console.log(`  → Verlässt F1: ${champNext.leftF1}   (${pct(champNext.leftF1, champTotal)}, Rücktritt/Tod)`);
const champStay = champNext.top + champNext.mid;
console.log(`  ≥ Mittelfeld (Paket G Ziel ≈96%): ${pct(champStay, champTotal - champNext.leftF1)}  (von Angetretenen)`);

console.log('\n  Herkunft → Ziel (Auto-Tier):');
for (const from of ['top', 'mid', 'back']) {
    const row = champByFromTier[from];
    const tot = Object.values(row).reduce((a, b) => a + b, 0);
    if (!tot) continue;
    console.log(`    aus ${from.padEnd(4)}: ` +
        `top ${pct(row.top || 0, tot)} · mid ${pct(row.mid || 0, tot)} · back ${pct(row.back || 0, tot)}  (n=${tot})`);
}

console.log('\n── UNDERDOG-AUFSTIEG (rep≥70 in nicht-Top-Auto) ───────────');
console.log(`  Kandidaten-Saisons: ${underdogTotal}`);
console.log(`  ⬆️  Klasse rauf:   ${underdogUp}   (${pct(underdogUp, underdogTotal)})`);
console.log(`  ➡️  gleich:        ${underdogSame}   (${pct(underdogSame, underdogTotal)})`);
console.log(`  ⬇️  runter:        ${underdogDown}   (${pct(underdogDown, underdogTotal)})`);
console.log(`  🚪 verlässt F1:    ${underdogLeft}   (${pct(underdogLeft, underdogTotal)})`);
console.log();
