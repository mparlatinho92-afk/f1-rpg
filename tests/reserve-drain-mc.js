/**
 * reserve-drain-mc.js — Messtest (kein Code-Eingriff): Reserve-Drain-Bug quantifizieren
 *
 * BEFUND (Code, fillEmptyTeamSeats L11726): der reservePool wird per .find() OHNE Alters-/
 *   Pace-Filter gezogen; generiert wird erst wenn der Pool LEER ist. FEEDER-Talente (~90,
 *   Seed 2025, versiegt) altern im Pace nicht (Phase 4b verarbeitet nur GAME_STATE.drivers).
 *   Folge (Nutzer): (1) Grid-Alters-Inflation, (2) Rücktritts-Klippe (10–15 Karriereenden
 *   gleichzeitig → Fahrermarkt spielt Jahre verrückt).
 *
 * MISST:
 *   1. Grid-Durchschnittsalter je Jahr (aktive Fahrer mit Team)  → Inflation?
 *   2. Turnover je Off-Season (Grid-Fahrer Jahr N, weg in N+1)   → Klippe?
 *   3. Reservepool: Größe + Ø-Alter je Jahr                       → Kohorte vergreist?
 *
 * Verwendung: node tests/reserve-drain-mc.js [sims] [startYear] [seasons]
 *   default: 6 Sims, Start 2015, 30 Saisons (bis 2044 – FEEDER-Pool versiegt, Bug voll sichtbar)
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');

const N       = parseInt(process.argv[2]) || 6;
const START   = parseInt(process.argv[3]) || 2015;
const SEASONS = parseInt(process.argv[4]) || 30;
const END     = START + SEASONS - 1;
console.log(`\n═══ Reserve-Drain-Bug-Tracker | ${START}–${END} | ${N} Sims ═══\n`);

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
const ageOf = (d, year) => (d && d.birthYear) ? year - d.birthYear : null;

// je Saison-Index (0..SEASONS-1): Sammel-Arrays über alle Sims
const gridAge = Array.from({ length: SEASONS }, () => []);
const poolSize = Array.from({ length: SEASONS }, () => []);
const poolAge = Array.from({ length: SEASONS }, () => []);
const turnover = [];          // Turnover-Zahl je Off-Season (alle Sims gepoolt)
let maxTurnover = 0, okSims = 0, errSims = 0;

for (let sim = 0; sim < N; sim++) {
    try {
        ctx.initFromYear(START);
        let prevGrid = null;   // Set aktiver Grid-Fahrer-ids Vorjahr
        for (let year = START; year <= END; year++) {
            simulateSeason(ctx);
            const yi = year - START;

            const grid = ctx.GAME_STATE.drivers.filter(d => d.team && (!d.status || d.status === 'active'));
            const ages = grid.map(d => ageOf(d, year)).filter(a => a !== null);
            if (ages.length) gridAge[yi].push(ages.reduce((x, y) => x + y, 0) / ages.length);

            const pool = ctx.GAME_STATE.reservePool || [];
            poolSize[yi].push(pool.length);
            const pAges = pool.map(d => ageOf(d, year)).filter(a => a !== null);
            if (pAges.length) poolAge[yi].push(pAges.reduce((x, y) => x + y, 0) / pAges.length);

            // Turnover ggü. Vorjahr
            const gridIds = new Set(grid.map(d => d.id));
            if (prevGrid) {
                let gone = 0;
                for (const id of prevGrid) if (!gridIds.has(id)) gone++;
                turnover.push(gone);
                if (gone > maxTurnover) maxTurnover = gone;
            }
            prevGrid = gridIds;

            if (year >= END) break;
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
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
function stat(a) {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    return { min: s[0], max: s[s.length - 1], avg: avg(s), median: s[Math.floor(s.length / 2)] };
}

console.log(`${okSims}/${N} Sims ok.\n`);

console.log('── GRID-Ø-ALTER + POOL je Jahr (Auszug alle 3 J.) ──');
console.log('  Jahr   GridØAlter   PoolGröße   PoolØAlter');
for (let yi = 0; yi < SEASONS; yi += 3) {
    const g = avg(gridAge[yi]), ps = avg(poolSize[yi]), pa = avg(poolAge[yi]);
    console.log(`  ${START + yi}    ${g ? g.toFixed(1).padStart(5) : '   – '}       ${ps !== null ? ps.toFixed(0).padStart(4) : '  – '}       ${pa ? pa.toFixed(1).padStart(5) : '   – '}`);
}

// Grid-Alter Frühphase vs. Spätphase
const early = [].concat(...gridAge.slice(0, 5));
const late = [].concat(...gridAge.slice(-5));
console.log(`\n  Grid-Ø-Alter Start-5J (${START}-${START + 4}): ${avg(early) ? avg(early).toFixed(1) : '–'}`);
console.log(`  Grid-Ø-Alter End-5J   (${END - 4}-${END}): ${avg(late) ? avg(late).toFixed(1) : '–'}   ← steigt = Inflation`);

console.log('\n── TURNOVER je Off-Season (Grid-Fahrer weg im Folgejahr) ──');
const tSt = stat(turnover);
console.log(`  ${tSt ? `Ø ${tSt.avg.toFixed(1)} · Median ${tSt.median} · min ${tSt.min} · max ${tSt.max}` : '–'}`);
const bigCliffs = turnover.filter(t => t >= 8).length;
console.log(`  Klippen ≥8 Abgänge/Jahr: ${bigCliffs}/${turnover.length}  (${(bigCliffs / turnover.length * 100).toFixed(1)}%)  ← Marktchaos-Indikator`);
console.log(`  größte Klippe: ${maxTurnover} Abgänge in einer Off-Season`);
console.log();
