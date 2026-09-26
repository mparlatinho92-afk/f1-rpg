#!/usr/bin/env node
/**
 * quali-form-vs-punkte.js — taugt der echte Quali-Rückstand als carSpeed-Quelle?
 *
 * Vergleicht drei carSpeed-Verteilungen je Saison mit dem REALEN Punkteanteil der
 * Teams (Pearson, Mittel je Dekade):
 *   A   Rang-Pyramide wie im Spiel (Reihenfolge SEASON_DATA, ERA_TEAM_SPREAD, exp 1.4)
 *   B   Lage nach echtem Quali-Rückstand (Median je Team-Saison), Letzter = Boden
 *   B2  Reihenfolge aus SEASON_DATA, Abstände aus dem Quali
 * Ergebnis 26.09.2026: A 0,913 · B 0,790 · B2 0,834, A in jeder Dekade vorn → Variante B
 * verworfen (BEFUNDE.md „Variante B"). Analytisch, keine Simulation.
 * ⚠ SPREAD unten ist eine Kopie von ERA_TEAM_SPREAD — bei Änderung dort nachziehen.
 *
 * Aufruf: node tests/quali-form-vs-punkte.js   (aus dem Projektordner)
 */
const fs = require('fs'), vm = require('vm');
const L = f => JSON.parse(fs.readFileSync('f1db-json-splitted/' + f, 'utf8'));
const q = L('f1db-races-qualifying-results.json'), rr = L('f1db-races-race-results.json'), races = L('f1db-races.json');
const indy = new Set(races.filter(x => x.circuitId === 'indianapolis' && x.year <= 1960).map(x => x.id));
const med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const c = { window: {} }; vm.createContext(c);
vm.runInContext(fs.readFileSync('data/seasons.js', 'utf8').replace(/\bconst SEASON_DATA\b/, 'SEASON_DATA'), c);
const SD = c.SEASON_DATA || c.window.SEASON_DATA;
const SPREAD = { 1950: 36, 1960: 36, 1970: 36, 1980: 17, 1990: 33, 2000: 22, 2010: 26, 2020: 22 };
const spread = y => SPREAD[Math.min(2020, Math.floor(y / 10) * 10)];
// Quali-Rückstand je Team-Saison
const pr = {};
for (const x of q) { if (indy.has(x.raceId)) continue; const t = x.year >= 2006 ? x.q1Millis : (x.timeMillis || x.q1Millis); if (!t) continue;
  const r = pr[x.raceId] = pr[x.raceId] || { y: x.year, t: {} }; r.t[x.constructorId] = Math.min(r.t[x.constructorId] || Infinity, t); }
const gaps = {};
for (const r of Object.values(pr)) { const p = Math.min(...Object.values(r.t)); for (const [k, t] of Object.entries(r.t)) { const g = (t / p - 1) * 100; if (g <= 15) ((gaps[r.y] = gaps[r.y] || {})[k] = gaps[r.y][k] || []).push(g); } }
const starts = {}, pts = {};
for (const x of rr) { if (indy.has(x.raceId) || /^(DNQ|DNPQ|DNS|DNP|EX|WD)$/.test(x.positionText)) continue;
  (starts[x.year] = starts[x.year] || {})[x.constructorId] = (starts[x.year][x.constructorId] || 0) + 1;
  (pts[x.year] = pts[x.year] || {})[x.constructorId] = (pts[x.year][x.constructorId] || 0) + (+x.points || 0); }
const pearson = (a, b) => { const ma = a.reduce((x, y) => x + y) / a.length, mb = b.reduce((x, y) => x + y) / b.length; let cc = 0, va = 0, vb = 0; for (let i = 0; i < a.length; i++) { cc += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return va && vb ? cc / Math.sqrt(va * vb) : NaN; };
const dek = {}, beispiele = {};
for (let y = 1950; y <= 2025; y++) {
  if (!SD[y] || !gaps[y]) continue;
  // Teams mit SD-Eintrag, Quali-Daten und >= 8 Starts
  const t = [];
  for (const e of SD[y].t) { const id = Object.keys(gaps[y]).find(k => norm(k) === norm(e[0]) || norm(k) === norm(e[1]));
    if (id && (starts[y] || {})[id] >= 8 && e[3] > 0) t.push({ name: e[1], sd: e[3], gap: med(gaps[y][id]), pts: pts[y][id] || 0 }); }
  if (t.length < 5) continue;
  const max = Math.max(...t.map(x => x.sd)), S = spread(y), n = t.length;
  // A: Rang aus SD-Tempo, Pyramide exp 1.4 (wie im Spiel)
  [...t].sort((a, b) => b.sd - a.sd).forEach((x, i) => { const pos = 1 - i / (n - 1); x.A = max - S + Math.pow(pos, 1.4) * S; });
  // B: Form aus dem echten Rückstand, Maßstab aus A: Letzter (größter Rückstand) = Boden
  const gmax = Math.max(...t.map(x => x.gap));
  t.forEach(x => { x.B = max - S * (gmax > 0 ? x.gap / gmax : 0); });
  const gs = t.map(x => x.gap).sort((a, b) => a - b); [...t].sort((a, b) => b.sd - a.sd).forEach((x, i) => { x.B2 = max - S * (gmax > 0 ? gs[i] / gmax : 0); });
  const ges = t.reduce((a, x) => a + x.pts, 0) || 1;
  const anteil = t.map(x => x.pts / ges);
  const d = Math.floor(y / 10) * 10;
  (dek[d] = dek[d] || { A: [], B: [], B2: [] }); dek[d].B2.push(pearson(t.map(x => x.B2), anteil));
  dek[d].A.push(pearson(t.map(x => x.A), anteil)); dek[d].B.push(pearson(t.map(x => x.B), anteil));
  if ([1980, 1988, 1998, 2009, 2014].includes(y)) beispiele[y] = t.sort((a, b) => b.pts - a.pts).map(x => x.name + ' ' + x.A.toFixed(0) + '/' + x.B.toFixed(0) + ' (' + x.pts + 'P)');
}
const m = a => a.filter(Number.isFinite).reduce((x, y) => x + y, 0) / a.filter(Number.isFinite).length;
console.log('Dekade  r(carSpeed, realer Punkteanteil)   A Rang-Pyramide   B Quali-Form');
for (const [d, v] of Object.entries(dek)) console.log('  ' + d, '   A', m(v.A).toFixed(3), '  B', m(v.B).toFixed(3), '  B2 (SD-Reihenfolge, Quali-Abstaende)', m(v.B2).toFixed(3));
const alleA = Object.values(dek).flatMap(v => v.A), alleB = Object.values(dek).flatMap(v => v.B);
console.log('  alle   A', m(alleA).toFixed(3), '  B', m(alleB).toFixed(3), '  B2', m(Object.values(dek).flatMap(v => v.B2)).toFixed(3));
for (const [y, l] of Object.entries(beispiele)) console.log(y, '(A/B):', l.slice(0, 12).join(' · '));
