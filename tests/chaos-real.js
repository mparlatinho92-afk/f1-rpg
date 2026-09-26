#!/usr/bin/env node
/**
 * chaos-real.js — wie sehr bringen reale Rennen die Reihenfolge durcheinander?
 *
 * Je Rennen: Spearman Startplatz → Zielplatz (nur gewertete), Sieg ab Startplatz 10,
 * punktet ein Team des schwachen Drittels (Drittel nach mittlerem Startplatz der Saison).
 * Gruppiert nach Ära und Wetter (Wiki-Infobox: trocken/teilweise/nass, aus
 * tools/quellen/wiki-stoerungen.json) sowie rote Flagge (tools/quellen/wiki-rote-flaggen.json).
 * Ergebnis 26.09.2026 (BEFUNDE.md „Störungen"): die Chaos-Rennen sind die TEILWEISE
 * nassen (11 % mit Spearman < 0,3 gegen 3,8 % trocken, Sieg ab P10 8,5 % gegen 2,8 %).
 *
 * Aufruf: node tests/chaos-real.js   (aus dem Projektordner; vorher tests/stoerungen-real.js
 *         und tests/rote-flaggen-real.js)
 * Quali-Regen bedingt auf Rennregen: tests/quali-regen-real.js
 */
const fs = require('fs');
const L = f => JSON.parse(fs.readFileSync('f1db-json-splitted/' + f, 'utf8'));
const e = JSON.parse(fs.readFileSync('tools/quellen/wiki-stoerungen.json', 'utf8'));
const rot = JSON.parse(fs.readFileSync('tools/quellen/wiki-rote-flaggen.json', 'utf8'));
const races = L('f1db-races.json'), rr = L('f1db-races-race-results.json'), grid = L('f1db-races-starting-grid-positions.json'), gpL = L('f1db-grands-prix.json');
const gpName = new Map(gpL.map(g => [g.id, g.fullName]));
const rotIds = new Set(races.filter(r => rot.some(x => x.gp === r.year + ' ' + gpName.get(r.grandPrixId))).map(r => r.id));
const G = {}; for (const g of grid) if (g.positionNumber) G[g.raceId + '|' + g.driverId] = g.positionNumber;
// Teamstärke: mittlerer Startplatz des Teams in der Saison → Drittel
const ts = {}, tn = {}; for (const g of grid) if (g.positionNumber) { const k = g.year + '|' + g.constructorId; ts[k] = (ts[k] || 0) + g.positionNumber; tn[k] = (tn[k] || 0) + 1; }
const drittel = {}; { const jahr = {}; for (const k in ts) { const [y, c] = k.split('|'); if (tn[k] >= 8) (jahr[y] = jahr[y] || []).push([c, ts[k] / tn[k]]); }
  for (const [y, l] of Object.entries(jahr)) { l.sort((a, b) => a[1] - b[1]); const n3 = Math.round(l.length / 3); l.forEach(([c], i) => drittel[y + '|' + c] = i < n3 ? 0 : i >= l.length - n3 ? 2 : 1); } }
const proRennen = {}; for (const x of rr) (proRennen[x.raceId] = proRennen[x.raceId] || []).push(x);
const rang = a => { const o = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = []; o.forEach(([, i], k) => r[i] = k); return r; };
const pear = (a, b) => { const ma = a.reduce((x, y) => x + y) / a.length, mb = b.reduce((x, y) => x + y) / b.length; let c = 0, va = 0, vb = 0; for (let i = 0; i < a.length; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return c / Math.sqrt(va * vb); };
const gruppen = {};
for (const r of races) {
  if (r.year > 2025 || (r.circuitId === 'indianapolis' && r.year <= 1960) || !e[r.id] || !e[r.id].regen.rennen) continue;
  const erg = (proRennen[r.id] || []).filter(x => /^\d+$/.test(x.positionText) && G[r.id + '|' + x.driverId]);
  if (erg.length < 6) continue;
  const sp = pear(rang(erg.map(x => G[r.id + '|' + x.driverId])), rang(erg.map(x => x.positionNumber)));
  const sieg = erg.find(x => x.positionNumber === 1); const siegGrid = sieg ? G[r.id + '|' + sieg.driverId] : null;
  const schwachPunkte = (proRennen[r.id] || []).some(x => +x.points > 0 && drittel[r.year + '|' + x.constructorId] === 2);
  const wetter = e[r.id].regen.rennen, aera = r.year < 1980 ? '1950–79' : r.year < 2000 ? '1980–99' : '2000–25';
  const regenAlle = wetter === 'trocken' ? 'trocken' : 'nass (teilw.+durchg.)';
  for (const k of [aera + ' ' + wetter, aera + ' alle', 'alle ' + wetter, 'alle alle', ...(wetter === 'trocken' ? [] : ['alle ' + regenAlle, aera + ' ' + regenAlle]), ...(rotIds.has(r.id) ? [aera + ' rote Flagge'] : [])]) {
    const g = gruppen[k] = gruppen[k] || { sp: [], s10: 0, sn: 0, schwach: 0, n: 0 };
    g.sp.push(sp); g.n++; if (siegGrid) { g.sn++; if (siegGrid >= 10) g.s10++; } if (schwachPunkte) g.schwach++;
  }
}
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
console.log('Gruppe                 |   n | Spearman Start→Ziel Median / 10%-Quantil | Anteil Rennen < 0,3 | Sieg ab P10 | schwaches Drittel punktet');
for (const k of Object.keys(gruppen).sort()) { const g = gruppen[k];
  console.log(k.padEnd(22), '|', String(g.n).padStart(4), '|', q(g.sp, 0.5).toFixed(2), '/', q(g.sp, 0.1).toFixed(2), '(Ø ' + (g.sp.reduce((a, b) => a + b, 0) / g.n).toFixed(3) + ')                |', (g.sp.filter(v => v < 0.3).length / g.n * 100).toFixed(1).padStart(5) + ' %', '        |', (g.s10 / g.sn * 100).toFixed(1).padStart(5) + ' %', '|', (g.schwach / g.n * 100).toFixed(1) + ' %'); }
