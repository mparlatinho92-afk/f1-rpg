#!/usr/bin/env node
/**
 * pace-kurve-real.js — wie entwickelt sich die Pace eines ECHTEN Fahrers?
 *
 * `PACE_RATINGS[histId][jahr] = [cur_pace, potential, consistency, carSpeed]`
 * traegt fuer jeden realen Fahrer einen Pace-Wert PRO SAISON, abgeleitet aus
 * seinem Elo-Verlauf. Das ist die Kurve, die generierte Fahrer nachbilden
 * sollen — sie haben stattdessen einen fast konstanten Wert.
 *
 * Gibt aus, was `developDriverPace` treffen muss:
 *   - Pace im Karrierejahr 1, 2, 3 … relativ zum eigenen Karriere-Peak
 *   - absoluter Zuwachs vom Debuet bis zum Peak
 *   - in welchem Karrierejahr der Peak liegt
 *   - der Abbau danach
 *
 * Aufruf:  node tests/pace-kurve-real.js [minSaisons]
 *
 * ⚠ Nur Fahrer mit LUECKENLOSER Jahresfolge zaehlen fuer die Kurve: wer ein
 *   Jahr aussetzt, hat im naechsten Eintrag einen Rost-Effekt drin, der die
 *   Lernkurve verfaelschen wuerde.
 */
const fs = require('fs');
const path = require('path');

const MIN = Number(process.argv[2] || 5);
const ROOT = path.join(__dirname, '..');

// PACE_RATINGS aus data/f1db.js ziehen, ohne die 3,6 MB als Modul zu laden
const quelle = fs.readFileSync(path.join(ROOT, 'data', 'f1db.js'), 'utf8');
const start = quelle.indexOf('PACE_RATINGS=');
if (start < 0) { console.error('PACE_RATINGS nicht gefunden'); process.exit(1); }
const off = quelle.indexOf('{', start);
let tiefe = 0, ende = -1;
for (let i = off; i < quelle.length; i++) {
    const c = quelle[i];
    if (c === '{') tiefe++;
    else if (c === '}') { tiefe--; if (tiefe === 0) { ende = i + 1; break; } }
}
const PACE_RATINGS = JSON.parse(quelle.slice(off, ende));

const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };

const kurven = [];
for (const [id, jahre] of Object.entries(PACE_RATINGS)) {
    const ys = Object.keys(jahre).map(Number).sort((a, b) => a - b);
    if (ys.length < MIN) continue;
    // lueckenlos? sonst steckt ein Rost-Effekt drin
    if (ys[ys.length - 1] - ys[0] + 1 !== ys.length) continue;
    const paces = ys.map(y => jahre[String(y)][0]).filter(v => v > 0);
    if (paces.length !== ys.length) continue;
    kurven.push({ id, paces });
}

console.log('Reale Pace-Verlaeufe aus PACE_RATINGS');
console.log('n=' + kurven.length + ' Fahrer mit >=' + MIN + ' lueckenlosen Saisons\n');

// ── Verlauf je Karrierejahr, relativ zum eigenen Peak ───────────────────
const jahrRel = {}, jahrAbs = {};
for (const k of kurven) {
    const peak = Math.max(...k.paces);
    k.paces.forEach((p, i) => {
        (jahrRel[i + 1] = jahrRel[i + 1] || []).push(p / peak);
        (jahrAbs[i + 1] = jahrAbs[i + 1] || []).push(p);
    });
}
console.log('Karrierejahr →  Pace in % des eigenen Peaks   (n)');
for (let j = 1; j <= 14; j++) {
    if (!jahrRel[j] || jahrRel[j].length < 8) break;
    const bal = Math.round(avg(jahrRel[j]) * 40);
    console.log('  ' + String(j).padStart(2) + '.  '
        + (100 * avg(jahrRel[j])).toFixed(1).padStart(5) + ' %   Ø pace '
        + avg(jahrAbs[j]).toFixed(1).padStart(5) + '   '
        + '#'.repeat(Math.max(0, bal - 20)) + '   (n=' + jahrRel[j].length + ')');
}

// ── Debuet → Peak ───────────────────────────────────────────────────────
const zuwachs = [], peakJahr = [], debutRel = [], abbau = [];
for (const k of kurven) {
    const peak = Math.max(...k.paces);
    const pi = k.paces.indexOf(peak);
    zuwachs.push(peak - k.paces[0]);
    peakJahr.push(pi + 1);
    debutRel.push(k.paces[0] / peak);
    if (pi < k.paces.length - 1) abbau.push((peak - k.paces[k.paces.length - 1]) / (k.paces.length - 1 - pi));
}
console.log('\n── Debuet → Peak ──');
console.log('  absoluter Zuwachs Debuet→Peak:  Ø' + avg(zuwachs).toFixed(1) + '  Median ' + med(zuwachs) + ' Pace-Punkte');
console.log('  Peak liegt im Karrierejahr:     Ø' + avg(peakJahr).toFixed(1) + '  Median ' + med(peakJahr));
console.log('  Debuet-Pace in % des Peaks:     Ø' + (100 * avg(debutRel)).toFixed(1) + ' %');
console.log('  Abbau nach dem Peak:            Ø' + avg(abbau).toFixed(2) + ' Pace-Punkte pro Jahr');

// ── Anteil des Rest-Gaps, der je Karrierejahr geschlossen wird ──────────
// Genau die Groesse, die developDriverPace() als `anteil` braucht.
console.log('\n── Anteil des verbleibenden Gaps, der pro Jahr geschlossen wird ──');
console.log('   (Gap = Peak minus aktuelle Pace; das ist der Wert fuer developDriverPace)');
const anteilJ = {};
for (const k of kurven) {
    const peak = Math.max(...k.paces);
    const pi = k.paces.indexOf(peak);
    for (let i = 0; i < pi; i++) {
        const gap = peak - k.paces[i];
        if (gap <= 0) continue;
        const schritt = k.paces[i + 1] - k.paces[i];
        (anteilJ[i + 1] = anteilJ[i + 1] || []).push(Math.max(0, schritt / gap));
    }
}
for (let j = 1; j <= 10; j++) {
    if (!anteilJ[j] || anteilJ[j].length < 8) break;
    console.log('  nach Jahr ' + String(j).padStart(2) + ':  ' + (100 * avg(anteilJ[j])).toFixed(1).padStart(5)
        + ' %   (Median ' + (100 * med(anteilJ[j])).toFixed(1) + ' %, n=' + anteilJ[j].length + ')');
}
