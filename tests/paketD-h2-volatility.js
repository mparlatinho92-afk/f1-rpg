/**
 * paketD-h2-volatility.js — misst die Team-Rang-Volatilität (Paket-D HOCH#2).
 * Anker (Report): Rang-Delta/Jahr real Median ±1, 95%-Perzentil ±3, >5 nur bei Reglement-Reset.
 * node tests/paketD-h2-volatility.js <start> <end> [sims]
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');
const START = parseInt(process.argv[2]) || 1990;
const END = parseInt(process.argv[3]) || 2014;
const N = parseInt(process.argv[4]) || 6;
const RESETS = new Set([1994, 1998, 2014, 2022, 2009]);
console.log(`\n═══ Paket-D HOCH#2 Rang-Volatilität | ${START}–${END} | ${N} Sims ═══\n`);
const ctx = getContext();
function simSeason(c) {
    for (let i = 0; i < c.GAME_STATE.races.length; i++) {
        const rain = Math.random() < 0.15;
        try { if (c.simulateTraining) c.simulateTraining(i); c.simulateQualifying(i, rain); const r = c.simulateRace(i, rain); if (r) c.applyRaceResults(r); } catch (_) {}
    }
}
const wccRankById = c => {
    const r = Object.entries(c.GAME_STATE.teamStandings || {}).map(([id, s]) => ({ id, p: s.points || 0 })).sort((a, b) => b.p - a.p);
    const m = {}; r.forEach((t, i) => m[t.id] = i + 1); return m;
};
const jumpsNonReset = [], jumpsReset = [];
let ok = 0;
for (let sim = 0; sim < N; sim++) {
    try {
        ctx.initFromYear(START);
        let prev = null;
        for (let y = START; y <= END; y++) {
            simSeason(ctx);
            const cur = wccRankById(ctx);
            if (prev) for (const id in cur) if (prev[id] != null) {
                const j = Math.abs(cur[id] - prev[id]);
                (RESETS.has(y) ? jumpsReset : jumpsNonReset).push(j);
            }
            prev = cur;
            if (y >= END) break;
            if (ctx.updateDriverCareerScores) ctx.updateDriverCareerScores();
            if (ctx.updateDriverReputations) ctx.updateDriverReputations();
            if (ctx.processDriverPaceDevelopment) ctx.processDriverPaceDevelopment();
            if (ctx.checkCareerEnds) ctx.checkCareerEnds();
            if (ctx.initReservePool) ctx.initReservePool(y + 1);
            if (ctx._injectNewSeasonDrivers) ctx._injectNewSeasonDrivers(y + 1);
            if (ctx.processTeamChanges) ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        ok++;
    } catch (e) { console.log('  Fehler:', e.message); }
}
function pct(arr, p) { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; }
const med = a => pct(a, 50), avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length) : 0;
function report(name, a) {
    console.log(`  ${name}: n=${a.length} · Median ${med(a)} · Ø ${avg(a).toFixed(2)} · 95% ${pct(a, 95)} · max ${a.length ? Math.max(...a) : 0}`);
    console.log(`     >3: ${(a.filter(j => j > 3).length / a.length * 100).toFixed(1)}% · >5: ${(a.filter(j => j > 5).length / a.length * 100).toFixed(1)}%`);
}
console.log(`${ok}/${N} Sims ok.\n`);
console.log('Ziel: Nicht-Reset Median ±1, 95% ±3, >5 selten');
report('Nicht-Reset-Jahre', jumpsNonReset);
report('Reset-Jahre      ', jumpsReset);
console.log();
