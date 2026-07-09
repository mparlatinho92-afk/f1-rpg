/**
 * death-era-mc.js — Messtest (kein Code-Eingriff): Todesfälle-Verteilung je Dekade (HOCH#4)
 *
 * 4 KATEGORIEN:
 *   1 F1 WM-Rennwochenende          (ERA_DEATH_RATES, pro Rennen)
 *   2 F1 außerhalb WM               (ERA_NONWM_F1_DEATH_RATE, pro Fahrer/Saison – Test/Sportwagen)
 *   3 Indy 500 (WM-Runde ≤1960)     (INDY_DEATH_RATE, pro Rennen)
 *   4 Indy außerhalb 500 (≤1960)    (ERA_NONWM_INDY_DEATH_RATE, pro Fahrer/Saison – AAA/Midget)
 *
 * REALE ANKER (F1 = WM+nonWM kombiniert, Report + Motorsport-Historie):
 *   50er 11 · 60er 12 · 70er 10 · 80er 4 · 90er 2 · 2000er 0 · 2010er 1
 *   Indy (500+non500) 1950–60 kombiniert ~16 (davon ~7 am 500).
 *
 * Verwendung: node tests/death-era-mc.js [sims]   (default 15, Start 1950 → 2025)
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');

const N = parseInt(process.argv[2]) || 15;
const START = 1950, END = 2025;
console.log(`\n═══ Todesfälle-Ära-Verteilung (HOCH#4, 4 Kategorien) | ${START}–${END} | ${N} Sims ═══\n`);

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
const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
const decadeOf = y => Math.floor(y / 10) * 10;
function classify(d) {
    if (d.fatalSession === 'nonwm') return d.nonwmType === 'indy' ? 'indyNon500' : 'f1NonWM';
    return /indianapolis|indy 500/i.test((d.raceName || d.race || '') + '') ? 'indy500' : 'f1WM';
}
// je Dekade → { f1WM, f1NonWM, indy500, indyNon500 } je Sim-Summe
const CATS = ['f1WM', 'f1NonWM', 'indy500', 'indyNon500'];
const data = {}; // decade → cat → [count je Sim]
for (const dec of DECADES) { data[dec] = {}; for (const c of CATS) data[dec][c] = []; }
let okSims = 0, errSims = 0;

for (let sim = 0; sim < N; sim++) {
    const tally = {}; for (const dec of DECADES) { tally[dec] = { f1WM: 0, f1NonWM: 0, indy500: 0, indyNon500: 0 }; }
    try {
        ctx.initFromYear(START);
        ctx.GAME_STATE.deathRealism = 100;
        for (let year = START; year <= END; year++) {
            ctx.GAME_STATE.deathRealism = 100;
            simulateSeason(ctx);   // Non-WM-Tode feuern automatisch in applyRaceResults (terminiert)
            const dec = decadeOf(ctx.GAME_STATE.currentYear);
            for (const d of (ctx.GAME_STATE.seasonDeaths || [])) {
                const cat = classify(d);
                if (tally[dec]) tally[dec][cat]++;
            }
            if (year >= END) break;
            if (ctx.checkCareerEnds)         ctx.checkCareerEnds();
            if (ctx.initReservePool)         ctx.initReservePool(year + 1);
            if (ctx._injectNewSeasonDrivers) ctx._injectNewSeasonDrivers(year + 1);
            if (ctx.processTeamChanges)      ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        for (const dec of DECADES) for (const c of CATS) data[dec][c].push(tally[dec][c]);
        okSims++;
    } catch (e) { errSims++; if (errSims <= 3) console.log('  Fehler:', e.message); }
}

const avg = a => (a && a.length) ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const REAL_F1 = { 1950: 11, 1960: 12, 1970: 10, 1980: 4, 1990: 2, 2000: 0, 2010: 1, 2020: 0 };

console.log(`${okSims}/${N} Sims ok.\n`);
console.log('── TODE JE DEKADE (Ø/Sim über 10 Jahre) ──');
console.log('  Dekade  F1-WM  F1-nonWM  │ F1 gesamt  Real  Δ         │ Indy500  Indy-non500');
for (const dec of DECADES) {
    const wm = avg(data[dec].f1WM), nw = avg(data[dec].f1NonWM);
    const i5 = avg(data[dec].indy500), iN = avg(data[dec].indyNon500);
    const f1tot = wm + nw, real = REAL_F1[dec], delta = f1tot - real;
    const mark = Math.abs(delta) <= 3 ? '✓' : (delta < 0 ? '↓' : '↑');
    console.log(`  ${dec}s  ${wm.toFixed(1).padStart(4)}   ${nw.toFixed(1).padStart(4)}    │  ${f1tot.toFixed(1).padStart(5)}    ${String(real).padStart(3)}  ${((delta >= 0 ? '+' : '') + delta.toFixed(1)).padStart(5)} ${mark}   │  ${i5.toFixed(1).padStart(4)}     ${iN.toFixed(1).padStart(4)}`);
}
const sum = c => DECADES.reduce((s, d) => s + avg(data[d][c]), 0);
console.log(`\n  Summe: F1-WM ${sum('f1WM').toFixed(1)} · F1-nonWM ${sum('f1NonWM').toFixed(1)} · Indy500 ${sum('indy500').toFixed(1)} · Indy-non500 ${sum('indyNon500').toFixed(1)}`);
console.log(`  F1 gesamt ${(sum('f1WM') + sum('f1NonWM')).toFixed(1)} (real ~40)  ·  Indy gesamt ${(sum('indy500') + sum('indyNon500')).toFixed(1)} (real ~16, nur 1950–60)\n`);
