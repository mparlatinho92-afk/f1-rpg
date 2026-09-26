#!/usr/bin/env node
/**
 * regel-aeren.js — was macht eine Regel-Ära real aus? (Grundlage für Zukunfts-Ären)
 *
 * Misst aus F1DB und historical_truth.json:
 *   1. Ära-Längen zwischen den großen Regelumbrüchen (REAL_ERA_CHANGES im Spiel)
 *   2. DNF-Rate und Quali-Abstand des schwachen Drittels je Jahr IN der Ära,
 *      relativ zum Ära-Mittel (Zusammenrücken? Zuverlässigkeit nach Regelwechsel?)
 *   3. Stabilität der Teamreihenfolge Vorjahr → Jahr (Spearman, mittlerer Startplatz)
 *      in Wechseljahren gegen sonst
 *   4. Wechsel des Konstrukteurs-Meisters und des schnellsten Teams, Wechseljahre gegen sonst
 *
 * Ergebnis 24.09.2026 (BEFUNDE.md „Was eine Regel-Ära real ausmacht"):
 *   Länge Ø 5,8 (σ 3,7) · DNF Jahr 0/1: ×1,12/×1,08, danach ~0,95 · kein Zusammenrücken ·
 *   Reihenfolge in Wechseljahren eher STABILER (0,765 gegen 0,675) · Meister wechselt
 *   64 % gegen 46 % (n 11, nicht belastbar).
 * ⚠ WECHSEL unten ist eine Kopie von REAL_ERA_CHANGES in index.html.
 *
 * Aufruf: node tests/regel-aeren.js   (vorher node tests/generate-truth.js)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const DB = path.join(__dirname, '..', 'f1db-json-splitted');
const L = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));
const truth = require('./historical_truth.json');

const WECHSEL = [1950, 1954, 1961, 1966, 1983, 1989, 1995, 1998, 2006, 2009, 2014, 2017, 2022, 2026];
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
const se = a => Math.sqrt(a.reduce((x, y) => x + (y - avg(a)) ** 2, 0) / (a.length - 1) / a.length);

// 1. Längen
const laengen = WECHSEL.slice(1).map((y, i) => y - WECHSEL[i]);
const sd = Math.sqrt(laengen.reduce((a, b) => a + (b - avg(laengen)) ** 2, 0) / (laengen.length - 1));
console.log('1. Ära-Längen', laengen.join(','), '· Ø', avg(laengen).toFixed(1), '· σ', sd.toFixed(1));

// 2. Jahr in der Ära, relativ zum Ära-Mittel
const jeAera = {};
for (let y = 1950; y <= 2025; y++) {
    const t = truth[y]; if (!t || t.weakThirdGapPct == null) continue;
    const start = WECHSEL.filter(w => w <= y).pop();
    (jeAera[start] = jeAera[start] || []).push({ k: y - start, g: t.weakThirdGapPct, d: t.dnfRate });
}
const rel = {};
for (const l of Object.values(jeAera)) {
    const mg = avg(l.map(x => x.g)), md = avg(l.map(x => x.d));
    for (const x of l) { const k = Math.min(x.k, 6); (rel[k] = rel[k] || { g: [], d: [] }); rel[k].g.push(x.g / mg); rel[k].d.push(x.d / md); }
}
console.log('2. Jahr in Ära | Quali-Abstand schwaches Drittel rel. | DNF rel. | n');
for (const [k, v] of Object.entries(rel))
    console.log('   ' + (k === '6' ? '6+' : k).padEnd(4), '        ', avg(v.g).toFixed(2), '                          ', avg(v.d).toFixed(2), '  ', v.g.length);

// 3./4. Teamreihenfolge und Meister
const grid = L('f1db-races-starting-grid-positions.json'), races = L('f1db-races.json'), cs = L('f1db-races-constructor-standings.json');
const indy = new Set(races.filter(x => x.circuitId === 'indianapolis' && x.year <= 1960).map(x => x.id));
const s = {}, n = {};
for (const x of grid) { if (indy.has(x.raceId) || !x.positionNumber) continue; const k = x.year + '|' + x.constructorId; s[k] = (s[k] || 0) + x.positionNumber; n[k] = (n[k] || 0) + 1; }
const mittel = {};
for (const k in s) { if (n[k] < 8) continue; const [y, c] = k.split('|'); (mittel[y] = mittel[y] || {})[c] = s[k] / n[k]; }
const rang = a => { const o = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = []; o.forEach(([, i], k) => r[i] = k); return r; };
const spear = (a, b) => { const ra = rang(a), rb = rang(b), m = a.length; const d2 = ra.reduce((acc, v, i) => acc + (v - rb[i]) ** 2, 0); return 1 - 6 * d2 / (m * (m * m - 1)); };
const W = new Set(WECHSEL.slice(1, -1));
const stab = { w: [], s: [] };
for (let y = 1951; y <= 2025; y++) {
    const A = mittel[y - 1], B = mittel[y]; if (!A || !B) continue;
    const c = Object.keys(B).filter(k => A[k] != null); if (c.length < 5) continue;
    stab[W.has(y) ? 'w' : 's'].push(spear(c.map(k => A[k]), c.map(k => B[k])));
}
console.log('3. Spearman Teamreihenfolge Vorjahr→Jahr: Wechsel', avg(stab.w).toFixed(3), '±' + se(stab.w).toFixed(3), 'n', stab.w.length,
    '| sonst', avg(stab.s).toFixed(3), '±' + se(stab.s).toFixed(3), 'n', stab.s.length);
const schnellst = {};
for (const [y, m] of Object.entries(mittel)) schnellst[y] = Object.entries(m).sort((a, b) => a[1] - b[1])[0][0];
const maxR = {}; for (const e of cs) if (!maxR[e.year] || e.round > maxR[e.year]) maxR[e.year] = e.round;
const meister = {}; for (const e of cs) if (e.round === maxR[e.year] && e.positionNumber === 1) meister[e.year] = e.constructorId;
const z = { w: [0, 0, 0, 0], s: [0, 0, 0, 0] };
for (let y = 1959; y <= 2025; y++) {
    const k = W.has(y) ? 'w' : 's';
    if (schnellst[y] && schnellst[y - 1]) { z[k][0]++; if (schnellst[y] !== schnellst[y - 1]) z[k][1]++; }
    if (meister[y] && meister[y - 1]) { z[k][2]++; if (meister[y] !== meister[y - 1]) z[k][3]++; }
}
for (const [k, v] of Object.entries(z))
    console.log('4. ' + (k === 'w' ? 'Wechseljahre' : 'sonst       '), 'schnellstes Team wechselt', v[1] + '/' + v[0], (v[1] / v[0] * 100).toFixed(0) + '%',
        '| Konstrukteurs-Meister wechselt', v[3] + '/' + v[2], (v[3] / v[2] * 100).toFixed(0) + '%');
