#!/usr/bin/env node
/**
 * markt-real.js — wie bewegen sich Stammfahrer real zwischen den Saisons? (F1DB, 27.09.2026)
 *
 * Für jeden Stammfahrer (≥ halbe Saison im Hauptteam) nach Team-Drittel (mittlerer
 * Startplatz der Saison): bleibt im Team / wechselt nach OBEN / GLEICH / nach UNTEN (Drittel
 * des neuen Teams im Folgejahr) / weg aus der WM. Je Dekade und je Team-Drittel.
 * Bezug für die Spiel-Messung in tests/markt-ab.js (Frage des Nutzers: sind verdreifachte
 * Abwerbungen realistisch, und verlieren kleine Teams ihre Fahrer öfter?).
 * ⚠ „nach oben" ist der reale Gegenwert von Abwerbung/Upgrade, F1DB kennt keine Wechsel-Art.
 *
 * Aufruf: node tests/markt-real.js [--alter]
 *   --alter  zusätzlich: Anteil „weg" je Altersband und Team-Drittel, zwei Epochen (Zielgröße
 *            der Alterskurve in checkCareerEnds — freiwillig UND unfreiwillig zusammen)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const L = f => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'f1db-json-splitted', f), 'utf8'));
const rr = L('f1db-races-race-results.json'), races = L('f1db-races.json'), grid = L('f1db-races-starting-grid-positions.json');
const indy = new Set(races.filter(r => r.circuitId === 'indianapolis' && r.year <= 1960).map(r => r.id));
const rennen = {}; for (const r of races) if (!indy.has(r.id)) rennen[r.year] = (rennen[r.year] || 0) + 1;

// Team-Drittel je Saison nach mittlerem Startplatz
const ts = {}, tn = {};
for (const g of grid) if (g.positionNumber && !indy.has(g.raceId)) { const k = g.year + '|' + g.constructorId; ts[k] = (ts[k] || 0) + g.positionNumber; tn[k] = (tn[k] || 0) + 1; }
const drittel = {};
{ const j = {}; for (const k in ts) { const [y, c] = k.split('|'); if (tn[k] >= 8) (j[y] = j[y] || []).push([c, ts[k] / tn[k]]); }
  for (const [y, l] of Object.entries(j)) { l.sort((a, b) => a[1] - b[1]); const n3 = Math.round(l.length / 3); l.forEach(([c], i) => drittel[y + '|' + c] = i < n3 ? 0 : i >= l.length - n3 ? 2 : 1); } }
// Hauptteam je Fahrer-Saison
const starts = {};
for (const x of rr) { if (indy.has(x.raceId) || /^(DNQ|DNPQ|EX|WD)$/.test(x.positionText)) continue;
    const k = x.year + '|' + x.driverId; (starts[k] = starts[k] || {})[x.constructorId] = (starts[k][x.constructorId] || 0) + 1; }
const haupt = k => { const h = starts[k]; if (!h) return null; const [t, n] = Object.entries(h).sort((a, b) => b[1] - a[1])[0]; return { t, n }; };

const geb = {}; for (const d of L('f1db-drivers.json')) if (d.dateOfBirth) geb[d.id] = +d.dateOfBirth.slice(0, 4);
const BAND = a => a <= 27 ? '≤27' : a <= 31 ? '28–31' : a <= 35 ? '32–35' : '36+';
const ALT = {}, WEGALTER = {};   // epoche|drittel|band → [n, weg]; epoche → Alter der Verschwundenen
const Z = {};
for (const k of Object.keys(starts)) {
    const [y, d] = k.split('|'); const jahr = +y; if (jahr >= 2025) continue;
    const a = haupt(k); if (!a || a.n < rennen[jahr] / 2) continue;
    const td = drittel[jahr + '|' + a.t]; if (td === undefined) continue;
    const b = haupt((jahr + 1) + '|' + d);
    let erg;
    if (!b) erg = 'weg';
    else if (b.t === a.t) erg = 'bleibt';
    else { const nd = drittel[(jahr + 1) + '|' + b.t]; erg = nd === undefined ? 'unten' : nd < td ? 'oben' : nd > td ? 'unten' : 'gleich'; }
    if (geb[d]) { const k = (jahr < 1990 ? '1950–1989' : '1990–2024') + '|' + td + '|' + BAND(jahr - geb[d]); const a = ALT[k] = ALT[k] || [0, 0]; a[0]++; if (erg === 'weg') { a[1]++; (WEGALTER[k.split('|')[0]] = WEGALTER[k.split('|')[0]] || []).push(jahr - geb[d]); } }
    for (const gr of [Math.floor(jahr / 10) * 10 + '', 'alle']) {
        const z = Z[gr + '|' + td] = Z[gr + '|' + td] || { n: 0, bleibt: 0, oben: 0, gleich: 0, unten: 0, weg: 0 };
        z.n++; z[erg]++;
    }
}
const N = ['stark', 'mittel', 'schwach'];
const p = (z, k) => (z[k] / z.n * 100).toFixed(1).padStart(5) + ' %';
console.log('Stammfahrer zur nächsten Saison: bleibt / nach oben / gleich / nach unten / weg');
for (const gr of ['alle', '1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020']) {
    console.log('\n' + (gr === 'alle' ? 'alle Jahre' : gr + 'er'));
    for (let t = 0; t < 3; t++) { const z = Z[gr + '|' + t]; if (!z) continue;
        console.log('  Team ' + N[t].padEnd(8), p(z, 'bleibt'), '/', p(z, 'oben'), '/', p(z, 'gleich'), '/', p(z, 'unten'), '/', p(z, 'weg'), '  n ' + z.n); }
}

if (process.argv.includes('--alter')) {
    console.log('\nAnteil „weg" je Altersband (Alter im Saisonjahr), stark / mittel / schwach, n in Klammern:');
    for (const ep of ['1950–1989', '1990–2024']) { console.log('  ' + ep);
        for (const b of ['≤27', '28–31', '32–35', '36+']) console.log('    ' + b.padEnd(6) + [0, 1, 2].map(t => { const a = ALT[ep + '|' + t + '|' + b] || [0, 0]; return (a[0] ? (a[1] / a[0] * 100).toFixed(0).padStart(3) + ' %' : '   –') + (' (' + a[0] + ')').padEnd(7); }).join(' / '));
        const w = (WEGALTER[ep] || []).sort((x, y) => x - y); if (w.length) console.log('    Median-Alter der Verschwundenen: ' + w[Math.floor(w.length / 2)] + ' (n ' + w.length + ')'); }
}
