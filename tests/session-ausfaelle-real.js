#!/usr/bin/env node
/**
 * session-ausfaelle-real.js — wie oft bleibt ein Fahrer in Qualifying und Training ohne
 * Zeit, verglichen mit der Ausfallquote im Rennen? (26.09.2026)
 *
 * „Ohne Zeit" = in F1DB keine Zeit in irgendeiner Quali-Runde oder positionText NC,
 * im Training ohne timeMillis je Session (FP-Daten erst ab 1986). EX/DSQ zählen nicht.
 * Dazu: ohne Quali-Zeit im nassen gegen trockenes Qualifying (Wiki, ab 2000) und der
 * mittlere relative Startplatz derer ohne Zeit (1 = letzter).
 * ⚠ In den 50ern fehlen in F1DB auch sonst Zeiten — dort ist „ohne Zeit" zum Teil
 *   Datenlücke, keine Panne.
 *
 * Aufruf: node tests/session-ausfaelle-real.js
 */
const fs = require('fs');
const L = f => JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'f1db-json-splitted', f), 'utf8'));
const races = L('f1db-races.json'); const indy = new Set(races.filter(r => r.circuitId === 'indianapolis' && r.year <= 1960).map(r => r.id));
const truth = require(require('path').join(__dirname, 'historical_truth.json'));
const wiki = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'tools', 'quellen', 'wiki-stoerungen.json'), 'utf8'));
const dek = y => Math.floor(y / 10) * 10;
const Z = {};
const z = (d) => Z[d] = Z[d] || { q: 0, qOhne: 0, fp: 0, fpOhne: 0, fpRennen: new Set(), qNass: 0, qNassOhne: 0, qTr: 0, qTrOhne: 0 };
// Qualifying: ohne jede Zeit oder NC
const qz = L('f1db-races-qualifying-results.json');
const zeitQ = x => x.timeMillis || x.q1Millis || x.q2Millis || x.q3Millis;
for (const x of qz) { if (indy.has(x.raceId) || /^(EX|DSQ)$/.test(x.positionText)) continue; const d = z(dek(x.year)); d.q++; const ohne = !zeitQ(x) || x.positionText === 'NC'; if (ohne) d.qOhne++;
  const w = wiki[x.raceId]; if (x.year >= 2000 && w) { if (w.regen.quali) { d.qNass++; if (ohne) d.qNassOhne++; } else { d.qTr++; if (ohne) d.qTrOhne++; } } }
// Training: je Session ohne Zeit
for (const n of [1, 2, 3, 4]) { const f = L('f1db-races-free-practice-' + n + '-results.json');
  for (const x of f) { if (indy.has(x.raceId)) continue; const d = z(dek(x.year)); d.fp++; if (!x.timeMillis) d.fpOhne++; } }
// Startplatz der Fahrer ohne Quali-Zeit
const grid = L('f1db-races-starting-grid-positions.json'); const G = {}; const n = {};
for (const g of grid) { if (g.positionNumber) { G[g.raceId + '|' + g.driverId] = g.positionNumber; n[g.raceId] = Math.max(n[g.raceId] || 0, g.positionNumber); } }
const rel = []; let gestartet = 0, ohneGes = 0;
for (const x of qz) { if (indy.has(x.raceId) || zeitQ(x) && x.positionText !== 'NC') continue; ohneGes++; const gp = G[x.raceId + '|' + x.driverId]; if (gp) { gestartet++; rel.push(gp / n[x.raceId]); } }
console.log('Dekade | Quali ohne Zeit | Training ohne Zeit (je Session) | Rennen DNF (ERA_DNF_RATES-Quelle)');
for (const [d, v] of Object.entries(Z)) { const dnf = Object.keys(truth).filter(y => dek(+y) === +d && truth[y].dnfRate != null).map(y => truth[y].dnfRate); const m = dnf.reduce((a, b) => a + b, 0) / dnf.length;
  console.log(' ' + d, '|', (v.qOhne / v.q * 100).toFixed(2).padStart(5) + ' % (n ' + v.q + ')', '|', v.fp ? (v.fpOhne / v.fp * 100).toFixed(2).padStart(5) + ' % (n ' + v.fp + ')' : '      –          ', '|', (m * 100).toFixed(1) + ' %'); }
let qn = 0, qno = 0, qt = 0, qto = 0; for (const v of Object.values(Z)) { qn += v.qNass; qno += v.qNassOhne; qt += v.qTr; qto += v.qTrOhne; }
console.log('Quali ohne Zeit ab 2000: nasse Quali', (qno / qn * 100).toFixed(2) + ' % (n ' + qn + ')', '· trockene', (qto / qt * 100).toFixed(2) + ' % (n ' + qt + ')');
const m = rel.reduce((a, b) => a + b, 0) / rel.length;
console.log('Ohne Quali-Zeit:', ohneGes, '· davon gestartet', gestartet, '· Ø Startplatz relativ zum Feld', m.toFixed(2), '(1 = letzter)');
