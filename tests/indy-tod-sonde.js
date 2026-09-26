#!/usr/bin/env node
/**
 * indy-tod-sonde.js — Todesfälle je Indy-500-Wochenende, isoliert.
 *
 * Simuliert N-mal Training/Quali/Rennen des Indy 500 (1955) und zählt Tote je Session,
 * Unfall-Ausfälle, Rennen ohne Unfall-Ausfall und markierte-aber-nicht-gebuchte Opfer.
 * Soll: INDY_DEATH_RATE 0.636 je Wochenende, davon 75 % im Rennen (0.477).
 * Fand am 23.09.2026, dass Gastfahrer-Opfer (Reserve-Pool) nie gebucht wurden
 * (103 von 427) → _bucheGastTod. BEFUNDE.md „Todesfälle je Ebene".
 *
 * Aufruf: node tests/indy-tod-sonde.js   (misst immer index.html)
 */
process.env.SIMCORE_FROM_INDEX = '1';
const path = require('path');
const { getContext } = require('./sim-core');
const ctx = getContext();
const N = 1000;
const z = { wochenenden: 0, training: 0, quali: 0, rennen: 0, unfallDNF: 0, keinUnfall: 0, starter: 0, dnf: 0, keineIndy: 0 };
for (let i = 0; i < N; i++) {
    ctx.initFromYear(1955);
    ctx.GAME_STATE.deathRealism = 100;
    const idx = ctx.GAME_STATE.races.findIndex(r => ctx.istIndy500(r, 1955));
    if (idx < 0) { z.keineIndy++; continue; }
    z.wochenenden++;
    const vor = (ctx.GAME_STATE.seasonDeaths || []).length;
    ctx.simulateTraining(idx);
    ctx.simulateQualifying(idx, false);
    const r = ctx.simulateRace(idx, false);
    for (const d of (ctx.GAME_STATE.seasonDeaths || []).slice(vor)) {
        if (d.fatalSession === 'training') z.training++;
        else if (d.fatalSession === 'qualifying') z.quali++;
        else if (d.fatalSession === 'race') z.rennen++;
    }
    if (r) {
        const u = r.results.filter(x => x.dnf && x.dnfType === 'accident').length;
        z.unfallDNF += u; if (!u) z.keinUnfall++; for (const x of r.results.filter(x => x.fatal)) { z.markiert = (z.markiert||0)+1; const d = ctx.GAME_STATE.drivers.find(q => q.id === x.driver); if (!d) z.nichtImKader = (z.nichtImKader||0)+1; if (x.isGuest) z.gast = (z.gast||0)+1; }
        z.starter += r.results.length; z.dnf += r.results.filter(x => x.dnf).length;
    }
}
const w = z.wochenenden;
console.log(z);
console.log('Tote je Wochenende', ((z.training + z.quali + z.rennen) / w).toFixed(3), '(Soll 0.636)',
    '| Rennen', (z.rennen / w).toFixed(3), '(Soll 0.477) | Starter', (z.starter / w).toFixed(1),
    '| DNF', (z.dnf / w).toFixed(1), '| Unfall-DNF', (z.unfallDNF / w).toFixed(2), '| ohne Unfall', (z.keinUnfall / w * 100).toFixed(0) + ' %');
