#!/usr/bin/env node
/**
 * vorzeitige-debuets.js — Wie oft fahren echte Fahrer VOR ihrem realen Debütjahr? (08.10.2026)
 *
 * Anlass: Brabham Anfang der 50er, Prost Mitte der 70er standen ständig im Cockpit. Der Pool
 * lädt echte Fahrer bis 5 Jahre vor dem Debüt (Gruppe C); seit PRE_DEBUT_PACE_STEP wird ihre
 * Pace dort gedämpft.
 * Reales Debüt = erstes Jahr in PACE_RATINGS. Gezählt wird je Saison jeder echte Fahrer mit
 * mindestens einem Start vor diesem Jahr — Stammfahrer = mindestens die halbe Saison.
 *
 * Aufruf: node tests/vorzeitige-debuets.js [startjahr] [saisons] [laeufe]          (index.html)
 *         node tests/vorzeitige-debuets.js 1950 8 3 --vorher   (letzter Monolith = Stand davor)
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!process.argv.includes('--vorher')) process.env.SIMCORE_FROM_INDEX = process.env.SIMCORE_FROM_INDEX || '1';
const { getContext } = require('./sim-core');
const START = Number(args[0] || 1950), SAISONS = Number(args[1] || 8), LAEUFE = Number(args[2] || 3);
const ctx = getContext();

// HIST_NAMES und PACE_RATINGS liegen nicht auf dem vm-Kontext von sim-core → direkt aus data/*.js
const _lade = (datei, name) => vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'data', datei), 'utf8') + ';' + name, { window: {} });
const HIST_NAMES = _lade('hist.js', 'HIST_NAMES');
const PR = _lade('f1db.js', 'PACE_RATINGS');
const debutByName = {};
for (const [slug, name] of Object.entries(HIST_NAMES)) {
    const jahre = PR[slug] && Object.keys(PR[slug]).map(Number);
    if (jahre && jahre.length) debutByName[name.toLowerCase().trim()] = Math.min(...jahre);
}

let saisons = 0, fahrer = 0, stamm = 0;
const jahreFrueh = {}, namen = {};
for (let l = 0; l < LAEUFE; l++) {
    ctx.initFromYear(START);
    for (let s = 0; s < SAISONS; s++) {
        const gs = ctx.GAME_STATE, jahr = gs.currentYear;
        ctx.simulateSeasonRaces();
        const starts = {}, rennen = (gs.results || []).length;
        for (const r of gs.results || []) for (const e of r.results || []) starts[e.name] = (starts[e.name] || 0) + 1;
        for (const [name, n] of Object.entries(starts)) {
            const debut = debutByName[String(name).toLowerCase().trim()];
            if (!debut || jahr >= debut) continue;
            fahrer++;
            if (n >= rennen / 2) stamm++;
            const k = Math.min(debut - jahr, 6);
            jahreFrueh[k] = (jahreFrueh[k] || 0) + 1;
            namen[name] = (namen[name] || 0) + 1;
        }
        saisons++;
        ctx.processSeasonEndEvents();
        ctx.startNewSeason();
    }
}
console.log(`VORZEITIGE DEBÜTS ${START}+${SAISONS} × ${LAEUFE}${process.argv.includes('--vorher') ? ' (Monolith = vorher)' : ' (index.html)'}`);
console.log(`  echte Fahrer vor ihrem realen Debütjahr: ${(fahrer / saisons).toFixed(2)} je Saison, davon Stammfahrer ${(stamm / saisons).toFixed(2)}`);
console.log('  Jahre zu früh: ' + Object.keys(jahreFrueh).sort((a, b) => a - b).map(k => `${k === '6' ? '6+' : k}: ${(jahreFrueh[k] / saisons).toFixed(2)}`).join(' · '));
console.log('  häufigste: ' + Object.entries(namen).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, c]) => `${n} ${c}`).join(', '));
