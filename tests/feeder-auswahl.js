#!/usr/bin/env node
/**
 * feeder-auswahl.js — Warum kommen schwache Feeder in die F1? (09.10.2026)
 *
 * Verfolgt jede Feeder-Verpflichtung: wer stand im selben Moment im Pool, mit welchem SPIELWERT
 * (Marktwert 70 % Pace + 30 % Potenzial) und welchem Elo-Potenzial (data/feeder-elo.js)?
 * Gemessen an zwei Stellen: Saisonwechsel (processSeasonEndEvents + startNewSeason) und während
 * der Saison (Ersatz nach Entlassung/Tod). Pool-Schnappschuss jeweils VOR dem Schritt.
 *
 * Aufruf: node tests/feeder-auswahl.js [sims] [start] [saisons]     (index.html; SIMCORE_PATCH möglich)
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = process.env.SIMCORE_FROM_INDEX || '1';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { getContext } = require('./sim-core');
const a = process.argv.slice(2).filter(x => !x.startsWith('--'));
const N = +a[0] || 4, START = +a[1] || 2010, SAISONS = +a[2] || 30;
const ELO = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'feeder-elo.js'), 'utf8') + ';FEEDER_ELO');
const ctx = getContext();
const eff = d => { const c = d.currentPace || d.pace || 0; return c * 0.7 + (d.potentialPace || c) * 0.3; };
const isF = d => /^feeder-/.test(String(d.id));
const drittel = p => p >= 67 ? 'oben' : p <= 33 ? 'unten' : 'mitte';   // Elo-Perzentil (FEEDER_ELO[3]); bis 10.10.2026 Potenzial 74–92 mit 86/80

const picks = [];   // { phase, eloP, wert, rangWert, rangElo, poolN, gedaempft, bestEloWert }
function schnapp() {
    const pool = (ctx.GAME_STATE.reservePool || []).filter(isF).map(d => ({ id: d.id, name: d.name, wert: eff(d), elo: ELO[d.name]?.[3], gedaempft: !!d.preDebut, alter: ctx.GAME_STATE.currentYear - d.birthYear }));
    const imKader = new Set(ctx.GAME_STATE.drivers.filter(d => d.team).map(d => d.id));
    return { pool, imKader };
}
function vergleiche(vor, phase) {
    const jetzt = new Set(ctx.GAME_STATE.drivers.filter(d => d.team && (!d.status || d.status === 'active')).map(d => d.id));
    const kandidaten = vor.pool.filter(p => p.alter >= 19);
    for (const p of vor.pool) {
        if (!jetzt.has(p.id) || vor.imKader.has(p.id) || p.elo == null) continue;
        const nachWert = [...kandidaten].sort((x, y) => y.wert - x.wert), nachElo = [...kandidaten].filter(k => k.elo != null).sort((x, y) => y.elo - x.elo);
        const d = ctx.GAME_STATE.drivers.find(x => x.id === p.id) || {};
        const tr = [...(ctx.GAME_STATE.seasonTransfers || []), ...((ctx.GAME_STATE.history || []).slice(-1)[0]?.transfers || [])].filter(t => t.driverId === p.id).pop();
        const weg = d._gridFiller ? 'Startfeld-Füller' : tr ? tr.type : d.isPrivateer ? 'Privatier ohne Eintrag' : 'ohne Eintrag';
        picks.push({ phase, weg, id: p.id, name: p.name, jahr: ctx.GAME_STATE.currentYear, info: JSON.stringify({ g: d.poolGroup, pr: d.isPrivateer, gf: d._gridFiller, gr: d._genReason, res: d.isReserve, sched: (d.scheduledRaces || []).length, tm: d.team }), eloP: p.elo, wert: p.wert, gedaempft: p.gedaempft, alter: p.alter, poolN: kandidaten.length,
            rangWert: nachWert.findIndex(k => k.id === p.id) + 1, rangElo: nachElo.findIndex(k => k.id === p.id) + 1,
            obenImPool: kandidaten.filter(k => k.elo >= 67).length,
            obenUngedaempft: kandidaten.filter(k => k.elo >= 67 && !k.gedaempft).length,
            obenWertMax: Math.max(0, ...kandidaten.filter(k => k.elo >= 67).map(k => k.wert)) });
    }
}

for (let s = 0; s < N; s++) {
    ctx.initFromYear(START);
    for (let j = 0; j < SAISONS; j++) {
        const races = ctx.GAME_STATE.races;
        for (let i = 0; i < races.length; i++) {
            const vor = schnapp(), rain = Math.random() < 0.15;
            try { if (ctx.simulateTraining) ctx.simulateTraining(i); ctx.simulateQualifying(i, rain); const r = ctx.simulateRace(i, rain); if (r) ctx.applyRaceResults(r); } catch (_) {}
            vergleiche(vor, 'Saison');
        }
        const vor = schnapp();
        ctx.processSeasonEndEvents();
        const imPoolNachEnde = new Set((ctx.GAME_STATE.reservePool || []).map(d => d.id));
        ctx.startNewSeason();
        const n0 = picks.length;
        vergleiche(vor, 'Wechsel');
        for (const x of picks.slice(n0)) x.schritt = imPoolNachEnde.has(x.id) ? 'startNewSeason' : 'processSeasonEndEvents';
    }
}

const m = arr => arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : NaN;
const pct = (n, d) => d ? (100 * n / d).toFixed(0) + ' %' : '–';
console.log(`FEEDER-AUSWAHL ${START}+${SAISONS} × ${N} — ${picks.length} Verpflichtungen`);
for (const ph of ['Wechsel', 'Saison']) {
    const p = picks.filter(x => x.phase === ph); if (!p.length) continue;
    console.log(`\n── ${ph} (n ${p.length}) ──`);
    console.log(`  aus oberem / unterem Elo-Drittel: ${pct(p.filter(x => x.eloP >= 67).length, p.length)} / ${pct(p.filter(x => x.eloP <= 33).length, p.length)}`);
    console.log(`  Rang des Gewählten im Pool nach SPIELWERT: Ø ${m(p.map(x => x.rangWert)).toFixed(1)} · Platz 1 in ${pct(p.filter(x => x.rangWert === 1).length, p.length)}`);
    console.log(`  Rang nach ELO: Ø ${m(p.map(x => x.rangElo)).toFixed(1)} · Pool-Feeder ab 19 im Schnitt ${m(p.map(x => x.poolN)).toFixed(1)}`);
    console.log(`  Gewählter gedämpft (vor Reifejahr): ${pct(p.filter(x => x.gedaempft).length, p.length)} · Ø Alter ${m(p.map(x => x.alter)).toFixed(1)}`);
    const wege = {};
    for (const x of p) { const w = wege[x.weg] = wege[x.weg] || { n: 0, unten: 0, rang: 0 }; w.n++; w.rang += x.rangWert; if (x.eloP <= 33) w.unten++; }
    console.log('  Weg: ' + Object.entries(wege).sort((x, y) => y[1].n - x[1].n).map(([k, w]) => `${k} ${w.n} (unteres Drittel ${w.unten}, Ø Wertrang ${(w.rang / w.n).toFixed(0)})`).join(' · '));
    const unten = p.filter(x => x.eloP <= 33);
    if (unten.length) {
        console.log(`  Wahl aus unterem Drittel (n ${unten.length}): obere im Pool Ø ${m(unten.map(x => x.obenImPool)).toFixed(1)}, davon ungedämpft ${m(unten.map(x => x.obenUngedaempft)).toFixed(1)}; keiner oben im Pool: ${pct(unten.filter(x => !x.obenImPool).length, unten.length)}`);
        console.log(`    Wert Gewählter Ø ${m(unten.map(x => x.wert)).toFixed(1)} gegen bester Oberer Ø ${m(unten.filter(x => x.obenImPool).map(x => x.obenWertMax)).toFixed(1)}`);
    }
}
// Zu junge Verpflichtungen: Alter in der Saison, in der gefahren wird (beim Wechsel = Folgejahr)
const jung = picks.filter(x => x.alter + (x.phase === 'Wechsel' ? 1 : 0) < 19);
if (jung.length) {
    const w = {}; for (const x of jung) { const k = x.phase + ':' + x.weg; w[k] = (w[k] || 0) + 1; }
    console.log(`\nUnter 19 im Fahrjahr: ${jung.length} — ` + Object.entries(w).map(([k, n]) => `${k} ${n}`).join(' · '));
    for (const x of jung) console.log(`  ${x.name} ${x.jahr} Alter ${x.alter} · ${x.schritt || x.phase} · ${x.info}`);
}
