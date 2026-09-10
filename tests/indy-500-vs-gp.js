/**
 * indy-500-vs-gp.js — WÄCHTER gegen die Indianapolis-Verwechslung.
 *
 *   node tests/indy-500-vs-gp.js
 *
 * In Indianapolis fanden ZWEI grundverschiedene Rennen statt, auf derselben
 * circuitId und mit demselben Rohflag in F1DB:
 *
 *   Indy 500 (1950-1960)  Oval, 200 Runden, per Reglement 33 Startplaetze,
 *                         eigenes Feld aus Indy-Teams. Die hohe Melderzahl
 *                         (~40-48) ist GEWOLLTE Halb-Fiktion: die offizielle
 *                         F1-Statistik kennt keine Indy-DNQs, weil Fahrer, die
 *                         es nie ins Rennen schafften, dort nie auftauchen.
 *   Indy GP  (2000-2007)  Infield-Rundkurs, ~73 Runden, normales F1-Feld mit
 *                         real 20-22 Startern.
 *
 * Bis v0.9.18.0 trugen BEIDE das Flag isIndy=true. Folge: der US-GP 2005 bekam
 * ein 33er-Feld (gemessen 27 Starter statt real 20), und die Todesraten-Logik
 * erzeugte ~5 Phantom-Tode je Jahrzehnt (HOCH#4-Befund).
 *
 * Seit v0.9.18.1 heisst das Feld isIndy500 bzw. isIndyGP und wird beim Aufbau
 * in getF1DBYear nach Jahr getrennt. Dieser Test haelt das fest.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');
const ctx = getContext();

const pruefungen = [];
const pr = (name, ist, soll, tol) => {
    const ok = (typeof soll === 'number' && typeof tol === 'number')
        ? Math.abs(ist - soll) <= tol
        : String(ist) === String(soll);
    pruefungen.push({ name, ist, soll: (tol ? soll + '±' + tol : soll), ok });
};

/* ── Indy 500: Flag, Deckel, gewollte Melder-Halbfiktion ── */
for (const jahr of [1952, 1955, 1958]) {
    ctx.initFromYear(jahr);
    const i = ctx.GAME_STATE.races.findIndex(r => /indianapolis 500/i.test(r.name || '') || r.isIndy500);
    if (i < 0) { pr(jahr + ' Indy 500 im Kalender', 'fehlt', 'vorhanden'); continue; }
    const race = ctx.GAME_STATE.races[i];
    pr(jahr + ' isIndy500', !!race.isIndy500, true);
    pr(jahr + ' isIndyGP', !!race.isIndyGP, false);
    pr(jahr + ' Deckel', ctx.getGridSize(jahr, race), 33);
    try {
        ctx.applyGuestMoves && ctx.applyGuestMoves(i);
        ctx.simulateTraining && ctx.simulateTraining(i);
        ctx.simulateQualifying(i, false);
        const r = ctx.simulateRace(i, false);
        const dnq = (r.dnq || []).length + (r.dnpq || []).length;
        const melder = r.results.length + dnq + (r.dns || []).length;
        // GEWOLLT: deutlich mehr Melder als Startplaetze. Nicht "reparieren".
        pr(jahr + ' Melder (gewollte Halbfiktion)', melder, 45, 6);
        pr(jahr + ' Starter', r.results.length, 33, 2);
    } catch (e) { pr(jahr + ' Rennen rechenbar', 'FEHLER: ' + e.message, 'ok'); }
}

/* ── Indy GP: normales Rennen, normales Feld ── */
const gpSoll = { 2003: 20, 2005: 20, 2007: 22 };
for (const jahr of [2003, 2005, 2007]) {
    ctx.initFromYear(jahr);
    const i = ctx.GAME_STATE.races.findIndex(r =>
        /indianapolis/i.test(r.circuit || r.circuitId || '') && !/indianapolis 500/i.test(r.name || ''));
    if (i < 0) { pr(jahr + ' Indy GP im Kalender', 'fehlt', 'vorhanden'); continue; }
    const race = ctx.GAME_STATE.races[i];
    pr(jahr + ' isIndy500', !!race.isIndy500, false);
    pr(jahr + ' isIndyGP', !!race.isIndyGP, true);
    pr(jahr + ' Deckel', ctx.getGridSize(jahr, race), gpSoll[jahr], 1);
    try {
        ctx.applyGuestMoves && ctx.applyGuestMoves(i);
        ctx.simulateTraining && ctx.simulateTraining(i);
        ctx.simulateQualifying(i, false);
        const r = ctx.simulateRace(i, false);
        pr(jahr + ' Starter', r.results.length, gpSoll[jahr], 3);
        pr(jahr + ' keine Indy-DNQ', (r.dnq || []).length, 0, 2);
    } catch (e) { pr(jahr + ' Rennen rechenbar', 'FEHLER: ' + e.message, 'ok'); }
}

console.log('\n═══ Indy 500 gegen Indy GP ═══\n');
let schlecht = 0;
pruefungen.forEach(p => {
    if (!p.ok) schlecht++;
    console.log((p.ok ? '  OK  ' : ' FEHL ') + p.name.padEnd(36) +
        'ist=' + String(p.ist).padEnd(10) + 'soll=' + p.soll);
});
console.log('\n' + (schlecht === 0
    ? 'GRUEN — Indy 500 und Indy GP werden sauber getrennt.'
    : schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN'));
process.exit(schlecht === 0 ? 0 : 1);
