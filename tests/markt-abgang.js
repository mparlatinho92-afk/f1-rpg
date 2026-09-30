#!/usr/bin/env node
/**
 * markt-abgang.js — Stammfahrer-Bewegungen im Spiel, GENAU wie tests/markt-real.js gemessen (27.09.2026)
 *
 * Gegenstück zu markt-real.js, gleiche Definitionen:
 *   - Team-Drittel nach mittlerem Startplatz der Saison (Teams mit ≥ 8 Startplätzen)
 *   - Stammfahrer = ≥ halbe Saison im Hauptteam (Team mit den meisten Starts)
 *   - bleibt / nach oben / gleich / nach unten / weg — „weg" = im Folgejahr KEIN Start
 * Die ältere Probe in markt-ab.js drittelte nach carSpeed und zählte „ohne Team zu
 * Saisonbeginn" als weg — beides weicht von der realen Messung ab.
 * Zusätzlich: der Zustand der Verschwundenen direkt nach dem Saisonwechsel (Abgangsweg).
 *
 * Aufruf: node tests/markt-abgang.js [startjahr] [saisons] [laeufe]   (misst index.html)
 *         node tests/markt-abgang.js 1975 8 4
 * Zugang (28.09.2026): Herkunft der Stammfahrer je Drittel — Gegenstück zu markt-real.js --zugang.
 * Dazu „weg" je Altersband (≤27 / 28–31 / 32–35 / 36+) — Gegenstück zu markt-real.js --alter.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = process.env.SIMCORE_FROM_INDEX || '1';
const { getContext } = require('./sim-core');
const START = Number(process.argv[2] || 1975), SAISONS = Number(process.argv[3] || 8), LAEUFE = Number(process.argv[4] || 4);
const ctx = getContext();

// Eine Saison auswerten: Hauptteam und Starts je Fahrer (über den NAMEN — IDs sind nicht stabil),
// Team-Drittel nach mittlerem Startplatz
function saisonAuswerten(gs) {
    const starts = {}, gridSum = {}, gridN = {};
    for (const r of gs.results || []) for (const e of r.results || []) {
        (starts[e.name] = starts[e.name] || {})[e.team] = (starts[e.name][e.team] || 0) + 1;
        if (e.qualiPos > 0) { gridSum[e.team] = (gridSum[e.team] || 0) + e.qualiPos; gridN[e.team] = (gridN[e.team] || 0) + 1; }
    }
    const l = Object.keys(gridSum).filter(t => gridN[t] >= 8).map(t => [t, gridSum[t] / gridN[t]]).sort((a, b) => a[1] - b[1]);
    const n3 = Math.round(l.length / 3), drittel = {};
    l.forEach(([t], i) => drittel[t] = i < n3 ? 0 : i >= l.length - n3 ? 2 : 1);
    const haupt = {};
    for (const [name, h] of Object.entries(starts)) { const [t, n] = Object.entries(h).sort((a, b) => b[1] - a[1])[0]; haupt[name] = { t, n }; }
    return { rennen: (gs.results || []).length, drittel, haupt };
}

function zustand(gs, name) {
    const alle = (gs.drivers || []).concat(gs.reservePool || []).filter(d => d.name === name);
    if (!alle.length) return 'nicht gefunden';
    const d = alle.find(x => x.status && x.status !== 'active') || alle[0];
    if (d.status === 'deceased') return 'tot';
    if (d.status === 'retired') return 'Rücktritt:' + (d.retirementReason || '?');
    if (d.status === 'dismissed') return 'entlassen:' + (d.retirementReason || 'kein Vertrag');
    if ((gs.reservePool || []).includes(d)) return 'Reserve';
    return d.team ? 'hat Team (fuhr nicht)' : 'aktiv ohne Team';
}

const Z = [0, 1, 2].map(() => ({ n: 0, bleibt: 0, oben: 0, gleich: 0, unten: 0, weg: 0 }));
const ZU = [0, 1, 2].map(() => ({ n: 0, eigen: 0, stamm: 0, teilzeit: 0, ohne: 0 }));   // Zugang, wie markt-real.js --zugang
const wege = {}, ALT = {}, WEGALTER = [];   // ALT: drittel|band → [n, weg]
const BAND = a => a <= 27 ? '≤27' : a <= 31 ? '28–31' : a <= 35 ? '32–35' : '36+';
for (let l = 0; l < LAEUFE; l++) {
    ctx.initFromYear(START);
    let vorher = null, zustandNachWechsel = null, alterVorher = null;
    for (let s = 0; s <= SAISONS; s++) {
        const gs = ctx.GAME_STATE;
        ctx.simulateSeasonRaces();
        const jetzt = saisonAuswerten(gs);
        if (vorher) for (const [name, a] of Object.entries(vorher.haupt)) {
            if (a.n < vorher.rennen / 2) continue;
            const td = vorher.drittel[a.t]; if (td === undefined) continue;
            const b = jetzt.haupt[name], z = Z[td]; z.n++;
            const alt = alterVorher.get(name); if (alt) { const k = td + '|' + BAND(alt); const a = ALT[k] = ALT[k] || [0, 0]; a[0]++; if (!b) { a[1]++; WEGALTER.push(alt); } }
            if (!b) { z.weg++; const w = zustandNachWechsel.get(name) || '?'; (wege[w] = wege[w] || [0, 0, 0])[td]++; }
            else if (b.t === a.t) z.bleibt++;
            else { const nd = jetzt.drittel[b.t]; if (nd === undefined || nd > td) z.unten++; else if (nd < td) z.oben++; else z.gleich++; }
        }
        if (vorher) for (const [name, b] of Object.entries(jetzt.haupt)) {
            if (b.n < jetzt.rennen / 2) continue;
            const td = jetzt.drittel[b.t]; if (td === undefined) continue;
            const a = vorher.haupt[name], z = ZU[td]; z.n++;
            z[!a ? 'ohne' : a.t === b.t ? 'eigen' : a.n >= vorher.rennen / 2 ? 'stamm' : 'teilzeit']++;
        }
        if (s === SAISONS) break;
        const alterJetzt = new Map(gs.drivers.filter(d => d.birthYear).map(d => [d.name, gs.currentYear - d.birthYear]));
        ctx.processSeasonEndEvents();
        const g = ctx.GAME_STATE;
        zustandNachWechsel = new Map(Object.keys(jetzt.haupt).map(n => [n, zustand(g, n)]));
        ctx.startNewSeason();
        vorher = jetzt; alterVorher = alterJetzt;
    }
}
const N = ['stark', 'mittel', 'schwach'];
const p = (z, k) => (z[k] / z.n * 100).toFixed(1).padStart(5) + ' %';
console.log('SPIEL ' + START + '+' + SAISONS + ' × ' + LAEUFE + ' · bleibt / nach oben / gleich / nach unten / weg (Vergleich: node tests/markt-real.js)');
for (let t = 0; t < 3; t++) console.log('  Team ' + N[t].padEnd(8), p(Z[t], 'bleibt'), '/', p(Z[t], 'oben'), '/', p(Z[t], 'gleich'), '/', p(Z[t], 'unten'), '/', p(Z[t], 'weg'), '  n ' + Z[t].n);
{ // Wechselquote wie markt-real.js: Teamwechsel unter denen, die im Folgejahr noch fahren (28.09.2026)
    const w = Z.reduce((s, z) => s + z.oben + z.gleich + z.unten, 0), b = Z.reduce((s, z) => s + z.bleibt, 0);
    console.log('  Wechselquote ' + (w / (w + b) * 100).toFixed(1) + ' % · je Drittel ' + Z.map(z => (100 * (z.oben + z.gleich + z.unten) / (z.n - z.weg)).toFixed(0) + ' %').join(' / ')); }
console.log('Abgangsweg der Verschwundenen (Anteil an den Stammfahrern des Drittels):');
for (const [k, v] of Object.entries(wege).sort((a, b) => b[1].reduce((x, y) => x + y) - a[1].reduce((x, y) => x + y)))
    console.log('  ' + k.padEnd(30) + v.map((x, i) => (x / Z[i].n * 100).toFixed(1).padStart(5) + ' %').join(' / '));
console.log('„weg" je Altersband, stark / mittel / schwach (n):');
for (const b of ['≤27', '28–31', '32–35', '36+']) console.log('  ' + b.padEnd(6) + [0, 1, 2].map(t => { const a = ALT[t + '|' + b] || [0, 0]; return (a[0] ? (a[1] / a[0] * 100).toFixed(0).padStart(3) + ' %' : '   –') + (' (' + a[0] + ')').padEnd(7); }).join(' / '));
{ const w = WEGALTER.sort((x, y) => x - y); if (w.length) console.log('  Median-Alter der Verschwundenen: ' + w[Math.floor(w.length / 2)] + ' (n ' + w.length + ')'); }
console.log('ZUGANG — Stammfahrer nach Herkunft im Vorjahr: eigenes Team / anderes Team (Stamm) / Teilzeit / kein Start (Vergleich: markt-real.js --zugang)');
for (let t = 0; t < 3; t++) console.log('  Team ' + N[t].padEnd(8), p(ZU[t], 'eigen'), '/', p(ZU[t], 'stamm'), '/', p(ZU[t], 'teilzeit'), '/', p(ZU[t], 'ohne'), '  n ' + ZU[t].n);
