#!/usr/bin/env node
/**
 * echt-anteil.js — Sitzen in den echten Jahren die echten Fahrer im Cockpit? (10.10.2026)
 *
 * Anlass: Nutzer-Spielstand 2018–2025 — nur 39–45 % der realen Stammfahrer fuhren, Feeder in bis zu 17 von 20
 * Cockpits (BEFUNDE.md 10.10.2026 (3)). Je Saison: reale Fahrer des Jahres (Eintrag in PACE_RATINGS) mit
 * mindestens halber Saison im Spiel, dazu Feeder- und generierte Stammfahrer. Zuordnung über den NAMEN —
 * Feeder und manche Pool-Fahrer tragen keine histId.
 *
 * Aufruf: node tests/echt-anteil.js [start] [saisons] [laeufe]     (index.html; SIMCORE_PATCH möglich)
 *         node tests/echt-anteil.js 2018 8 3
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = process.env.SIMCORE_FROM_INDEX || '1';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { getContext } = require('./sim-core');
const a = process.argv.slice(2).filter(x => !x.startsWith('--'));
const START = +a[0] || 2018, SAISONS = +a[1] || 8, LAEUFE = +a[2] || 3;
const _lade = (datei, name) => vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'data', datei), 'utf8') + ';' + name, { window: {} });
const PR = _lade('f1db.js', 'PACE_RATINGS'), HN = _lade('hist.js', 'HIST_NAMES');
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ jr\.?$/, '').trim();
const ctx = getContext();

const proJahr = {}, fehlt = {};
for (let l = 0; l < LAEUFE; l++) {
    ctx.initFromYear(START);
    for (let s = 0; s < SAISONS; s++) {
        const gs = ctx.GAME_STATE, jahr = gs.currentYear;
        ctx.simulateSeasonRaces();
        const rennen = (gs.results || []).length, starts = {}, ids = {};
        for (const r of gs.results || []) for (const e of r.results || []) { starts[norm(e.name)] = (starts[norm(e.name)] || 0) + 1; ids[norm(e.name)] = e.driverId || e.id; }
        const real = Object.keys(PR).filter(sl => PR[sl][String(jahr)]).map(sl => norm(HN[sl] || sl));
        const p = proJahr[jahr] = proJahr[jahr] || { real: 0, stamm: 0, feeder: 0, gen: 0, n: 0 };
        p.n++; p.real += real.length;
        for (const n of real) { if ((starts[n] || 0) >= rennen / 2) p.stamm++; else fehlt[n] = (fehlt[n] || 0) + 1; }
        for (const d of gs.drivers) {
            if (!((starts[norm(d.name)] || 0) >= rennen / 2)) continue;
            if (/^feeder-/.test(String(d.id))) p.feeder++; else if (/^(gen-|exp-)/.test(String(d.id))) p.gen++;
        }
        ctx.processSeasonEndEvents();
        ctx.startNewSeason();
    }
}
console.log(`ECHT-ANTEIL ${START}+${SAISONS} × ${LAEUFE}${process.env.SIMCORE_PATCH ? ' (Patch)' : ''}: reale Stammfahrer des Jahres im Cockpit`);
let sr = 0, ss = 0;
for (const [j, p] of Object.entries(proJahr)) {
    sr += p.real; ss += p.stamm;
    console.log(`  ${j}: ${(p.stamm / p.n).toFixed(1)} von ${(p.real / p.n).toFixed(0)} (${(100 * p.stamm / p.real).toFixed(0)} %) · Feeder-Stamm ${(p.feeder / p.n).toFixed(1)} · generiert ${(p.gen / p.n).toFixed(1)}`);
}
console.log(`  gesamt ${(100 * ss / sr).toFixed(0)} %  ·  am häufigsten ohne Cockpit: ${Object.entries(fehlt).sort((x, y) => y[1] - x[1]).slice(0, 12).map(([n, c]) => `${n} ${c}`).join(', ')}`);
