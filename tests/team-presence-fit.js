#!/usr/bin/env node
/**
 * HAELT SICH EIN KONSTRUKTEUR AN SEIN REALES PROGRAMM?
 *
 * Nutzer-Grundsatz: „nicht-teilnahmen eines konstrukteurs über der ganzen saison werden
 * von der realität bestimmt und nicht intern vom spielstand."
 *
 * TEAM_PRESENCE (data/presence.js, aus F1DB) sagt für die meisten Team-Jahre, WELCHE
 * Strecken ein Rennstall bestritten hat. Der L1-Nachlauf in assignPrivateerSchedules
 * beschneidet die Meldepläne darauf — aber die Fueller liefen bis v0.9.17.30 daran vorbei:
 * fillGridEntries laeuft NACH assignPrivateerSchedules, fillGridFromPool sogar mitten im
 * Rennwochenende. Protos meldete dadurch 1967 zu sieben Rennen mit elf Fahrern; real war
 * es EIN Rennen mit zwei Wagen (TEAM_PRESENCE: protos 1967 = ["nurburgring"]).
 *
 * Gemessen wird nur, wo TEAM_PRESENCE eine STRECKENLISTE führt (Teilsaison). Teams mit
 * "volle Saison" oder ohne Eintrag sind ausgenommen — dort gibt es nichts zu verletzen.
 *
 *   node tests/team-presence-fit.js            1950, 20 Saisons
 *   node tests/team-presence-fit.js 1965 15
 *
 * ⚠ Gegen UNCOMMITTETE index.html-Aenderungen:  SIMCORE_FROM_INDEX=1 node tests/...
 */
'use strict';
const { getContext } = require('./sim-core');
const vm = require('vm'), fs = require('fs'), path = require('path');

const START = parseInt(process.argv[2]) || 1950;
const SEASONS = parseInt(process.argv[3]) || 20;

// TEAM_PRESENCE direkt aus der Datenquelle - `const` haengt nicht am VM-Objekt.
const pctx = {}; vm.createContext(pctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'presence.js'), 'utf8')
    + '; globalThis._P = TEAM_PRESENCE;', pctx);
const PRESENCE = pctx._P;

const ctx = getContext();
ctx.log = function () {};
console.log(`\nTREUE ZUM REALEN PROGRAMM  |  ab ${START}  |  ${SEASONS} Saisons\n`);
ctx.initFromYear(START);

let faelle = 0, zuViel = 0, exakt = 0, summeReal = 0, summeSpiel = 0;
const bsp = [];
for (let k = 0; k < SEASONS; k++) {
    const jahr = ctx.GAME_STATE.currentYear, n = (ctx.GAME_STATE.races || []).length;
    for (let i = 0; i < n; i++) {
        ctx.applyGuestMoves && ctx.applyGuestMoves(i);
        ctx.simulateTraining(i); ctx.simulateQualifying(i, false);
        ctx.applyRaceResults(ctx.simulateRace(i, false));
    }
    ctx.updateDriverCareerScores && ctx.updateDriverCareerScores();
    ctx.processDriverPaceDevelopment && ctx.processDriverPaceDevelopment();
    ctx.checkCareerEnds && ctx.checkCareerEnds();
    ctx.initReservePool && ctx.initReservePool(jahr + 1);
    ctx._injectNewSeasonDrivers && ctx._injectNewSeasonDrivers(jahr + 1);
    ctx.processTeamChanges && ctx.processTeamChanges();
    ctx.startNewSeason();

    const h = (ctx.GAME_STATE.history || []).find(x => x.year === jahr);
    if (!h || !PRESENCE[jahr]) continue;
    // Welche Strecken hat welcher Rennstall im Spiel bestritten? Meldungen, nicht Starter.
    const gefahren = {};
    for (const race of (h.results || [])) {
        const cid = String((h.races || [])[race.ri]?.circuitId || '').toLowerCase();
        if (!cid) continue;
        const merke = tn => { if (!tn) return;
            const key = String(tn).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            (gefahren[key] = gefahren[key] || new Set()).add(cid); };
        for (const e of (race.res || [])) merke(e.tmn);
        for (const tn of Object.values(race.tms || {})) merke(tn);
    }
    for (const [ctor, wert] of Object.entries(PRESENCE[jahr])) {
        if (!Array.isArray(wert)) continue;          // nur Teilsaisons
        const gef = gefahren[ctor];
        if (!gef || !gef.size) continue;             // Team gar nicht im Spiel
        faelle++;
        summeReal += wert.length; summeSpiel += gef.size;
        const fremd = [...gef].filter(c => !wert.includes(c));
        if (!fremd.length && gef.size <= wert.length) exakt++;
        if (fremd.length) {
            zuViel++;
            if (bsp.length < 10) bsp.push(`${jahr} ${ctor}: real ${wert.length} Rennen, im Spiel ${gef.size} (${fremd.length} fremde Strecken)`);
        }
    }
}
console.log(`Team-Saisons mit realer Streckenliste: ${faelle}`);
console.log(`  ${zuViel ? '⚠' : '✅'} mit Rennen ausserhalb der Liste: ${zuViel}`
    + (faelle ? `  (${(100 * zuViel / faelle).toFixed(1)} %)` : ''));
console.log(`  ✅ exakt oder knapper:            ${exakt}`);
console.log(`  Ø Rennen je Team-Saison: real ${(summeReal / (faelle || 1)).toFixed(2)} · Spiel ${(summeSpiel / (faelle || 1)).toFixed(2)}`);
bsp.forEach(b => console.log('     · ' + b));
console.log('');
process.exit(zuViel === 0 ? 0 : 1);
