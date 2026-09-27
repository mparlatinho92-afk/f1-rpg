#!/usr/bin/env node
/**
 * talent-real.js — wie weit trägt ein starker Fahrer ein schwaches Auto? (Realität, F1DB)
 *
 * Je Rennstart: Team-Drittel (mittlerer Startplatz des Teams in der Saison) × Fahrer-Drittel
 * (PACE_RATINGS[histId][jahr][0] — Elo RELATIV ZUM TEAMKOLLEGEN, also ohne Auto — gedrittelt
 * innerhalb der Saison). Ausgewertet: Sieg, Podium, Top 10 im Ziel, Punkte, Ausfall.
 * Nutzer-Bild (26.09.2026): „Minardi 2001 Alonso ist stark, aber nicht stark genug für
 * Punkte" — Talent soll im schwachen Auto sichtbar sein, ohne es an die Spitze zu tragen.
 *
 * ⚠ Top 10 heißt Zielplatz ≤ 10 (gewertet), nicht Punkteplatz — in den alten Ären gab es
 *   nur 5–6 Punkteplätze, dort ist Top 10 das aussagekräftigere Maß.
 * ⚠ PACE_RATINGS entstehen aus Ergebnissen (Elo). Das Fahrer-Drittel ist deshalb nicht
 *   völlig unabhängig vom Ergebnis — aber vom Auto, weil relativ zum Teamkollegen.
 *
 * Aufruf: node tests/talent-real.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const L = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'f1db-json-splitted', f), 'utf8'));
const ctx = { window: {}, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'f1db.js'), 'utf8').replace(/\bconst (\w+)\s*=/g, 'var $1 ='), ctx);
const PR = ctx.PACE_RATINGS;

const races = L('f1db-races.json');
const indy = new Set(races.filter(r => r.circuitId === 'indianapolis' && r.year <= 1960).map(r => r.id));
const rr = L('f1db-races-race-results.json'), grid = L('f1db-races-starting-grid-positions.json');

// Team-Drittel je Saison
const ts = {}, tn = {};
for (const g of grid) if (g.positionNumber && !indy.has(g.raceId)) { const k = g.year + '|' + g.constructorId; ts[k] = (ts[k] || 0) + g.positionNumber; tn[k] = (tn[k] || 0) + 1; }
const teamDrittel = {};
{ const jahr = {}; for (const k in ts) { const [y, c] = k.split('|'); if (tn[k] >= 8) (jahr[y] = jahr[y] || []).push([c, ts[k] / tn[k]]); }
  for (const [y, l] of Object.entries(jahr)) { l.sort((a, b) => a[1] - b[1]); const n3 = Math.round(l.length / 3); l.forEach(([c], i) => teamDrittel[y + '|' + c] = i < n3 ? 0 : i >= l.length - n3 ? 2 : 1); } }

// Fahrer-Drittel je Saison nach PACE_RATINGS (nur Fahrer mit Wert)
const fahrerDrittel = {};
{ const jahr = {};
  for (const x of rr) { if (indy.has(x.raceId)) continue; const p = PR[x.driverId] && PR[x.driverId][x.year]; if (p && p[0] > 0) (jahr[x.year] = jahr[x.year] || new Map()).set(x.driverId, p[0]); }
  for (const [y, m] of Object.entries(jahr)) { const l = [...m.entries()].sort((a, b) => b[1] - a[1]); const n3 = Math.round(l.length / 3); l.forEach(([d], i) => fahrerDrittel[y + '|' + d] = i < n3 ? 0 : i >= l.length - n3 ? 2 : 1); } }

const Z = {};
for (const x of rr) {
    if (indy.has(x.raceId) || /^(DNQ|DNPQ|DNS|DNP|EX|WD)$/.test(x.positionText)) continue;
    const t = teamDrittel[x.year + '|' + x.constructorId], f = fahrerDrittel[x.year + '|' + x.driverId];
    if (t === undefined || f === undefined) continue;
    const z = Z[t + '|' + f] = Z[t + '|' + f] || { n: 0, sieg: 0, podium: 0, top10: 0, punkte: 0, aus: 0 };
    z.n++;
    const pos = /^\d+$/.test(x.positionText) ? +x.positionText : null;
    if (pos === 1) z.sieg++; if (pos && pos <= 3) z.podium++; if (pos && pos <= 10) z.top10++;
    if (+x.points > 0) z.punkte++; if (!pos) z.aus++;
}
const N = ['stark', 'mittel', 'schwach'];
console.log('Je Rennstart: Sieg / Podium / Top 10 / Punkte   (Ausfall)');
for (let t = 0; t < 3; t++) {
    console.log('\nAuto ' + N[t] + ':');
    for (let f = 0; f < 3; f++) { const z = Z[t + '|' + f]; if (!z) continue;
        const p = v => (v / z.n * 100).toFixed(1).padStart(5) + ' %';
        console.log('  Fahrer ' + N[f].padEnd(8), p(z.sieg), '/', p(z.podium), '/', p(z.top10), '/', p(z.punkte), '  (' + p(z.aus).trim() + ')  n ' + z.n); }
}
