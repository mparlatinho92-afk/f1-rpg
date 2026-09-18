#!/usr/bin/env node
/**
 * vakuum-verteilung.js — wertet einen vakuum-batch-Vollauf aus.
 *
 * Bei 75 Saisons ist die Tabelle nicht mehr lesbar, und genau dort entsteht der
 * Fehler: Man pickt sich drei auffällige Jahre heraus und nennt sie „Ausreißer",
 * ohne zu wissen, wie der Rest verteilt ist. Dieses Skript beantwortet:
 *   - Wie breit streut die Abweichung wirklich?
 *   - Sind die auffälligen Jahre Einzelfälle oder die Spitze einer Gruppe?
 *   - Gibt es Muster nach Ära, Feldgröße oder Renn-Deckung?
 *
 * Aufruf:  node tests/vakuum-verteilung.js tests/output/vakuum-alle.txt
 */
const fs = require('fs');

const DATEI = process.argv[2] || 'tests/output/vakuum-alle.txt';
const text = fs.readFileSync(DATEI, 'utf8');

const zeilen = [];
for (const z of text.split(/\r?\n/)) {
    // "  1965     10  |     16   21.5    +5.5      |   9.39     0.655    96.0 % ⚠"
    const m = z.match(/^\s{2}(\d{4})\s+(\d+)\s+\|\s+(\d+)\s+([\d.]+)\s+([+-][\d.]+)\s+\|\s+([\d.]+)\s+([-\d.]+)\s+([\d.]+)\s*%/);
    if (m) zeilen.push({
        jahr: +m[1], rennen: +m[2], ziel: +m[3], ist: +m[4],
        diff: +m[5], abw: +m[6], sp: +m[7], deck: +m[8]
    });
}
if (!zeilen.length) { console.error('Keine Datenzeilen in ' + DATEI); process.exit(1); }

const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const med = a => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const sd = a => { const m = avg(a); return Math.sqrt(avg(a.map(x => (x - m) ** 2))); };

const diffs = zeilen.map(z => z.diff);
const betrag = diffs.map(Math.abs);

console.log('VAKUUM-VOLLAUF: ' + zeilen.length + ' Saisons (' + zeilen[0].jahr + '-' + zeilen[zeilen.length - 1].jahr + ')\n');

console.log('── Punktefahrer-Abweichung ──');
console.log('  Ø Betrag ' + avg(betrag).toFixed(2) + '   Median ' + med(betrag).toFixed(1)
    + '   Standardabw. ' + sd(diffs).toFixed(2));
console.log('  vorzeichenbehaftet Ø ' + (avg(diffs) >= 0 ? '+' : '') + avg(diffs).toFixed(2)
    + '   (nahe 0 = kein systematischer Drall)');

// Histogramm
const stufen = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 6], [6, 99]];
console.log('\n  Betrag der Abweichung:');
for (const [von, bis] of stufen) {
    const n = betrag.filter(v => v >= von && v < bis).length;
    const label = bis === 99 ? '6+   ' : (von + '-' + bis + '  ');
    console.log('   ' + label + ' ' + String(n).padStart(3) + '  '
        + '█'.repeat(Math.round(n / zeilen.length * 60))
        + ' ' + (100 * n / zeilen.length).toFixed(0) + ' %');
}

// Sind die "Ausreisser" Einzelfaelle?
const sortiert = [...zeilen].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
console.log('\n  Die zehn groessten Abweichungen:');
for (const z of sortiert.slice(0, 10)) {
    console.log('   ' + z.jahr + '  Ziel ' + String(z.ziel).padStart(2) + '  Ist '
        + z.ist.toFixed(1).padStart(5) + '  ' + (z.diff >= 0 ? '+' : '') + z.diff.toFixed(1).padStart(5)
        + '   Sp ' + z.sp.toFixed(3) + '   Deckung ' + z.deck.toFixed(1) + ' %'
        + (z.deck < 97 ? ' ⚠' : ''));
}

console.log('\n── Spearman ──');
const sps = zeilen.map(z => z.sp);
console.log('  Ø ' + avg(sps).toFixed(3) + '   Median ' + med(sps).toFixed(3)
    + '   schlechtester ' + Math.min(...sps).toFixed(3) + '   bester ' + Math.max(...sps).toFixed(3));

console.log('\n── nach Jahrzehnt ──');
console.log('  Dekade   n   Ø|Diff|   Ø Diff   Ø Spearman   Ø Deckung');
for (let d = 1950; d < 2030; d += 10) {
    const g = zeilen.filter(z => z.jahr >= d && z.jahr < d + 10);
    if (!g.length) continue;
    const b = g.map(z => Math.abs(z.diff));
    console.log('  ' + d + 'er ' + String(g.length).padStart(4)
        + avg(b).toFixed(2).padStart(9)
        + ((avg(g.map(z => z.diff)) >= 0 ? '+' : '') + avg(g.map(z => z.diff)).toFixed(2)).padStart(9)
        + avg(g.map(z => z.sp)).toFixed(3).padStart(13)
        + (avg(g.map(z => z.deck)).toFixed(1) + ' %').padStart(12));
}

// Korrelationen: haengt die Abweichung an etwas?
function korr(f, g) {
    const a = zeilen.map(f), b = zeilen.map(g), n = a.length;
    const ma = avg(a), mb = avg(b);
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
    return num / Math.sqrt(da * db);
}
console.log('\n── Woran haengt die Abweichung? ──');
console.log('  mit Jahr        ' + korr(z => z.jahr, z => Math.abs(z.diff)).toFixed(3));
console.log('  mit Rennzahl    ' + korr(z => z.rennen, z => Math.abs(z.diff)).toFixed(3));
console.log('  mit Ziel-Zahl   ' + korr(z => z.ziel, z => z.diff).toFixed(3)
    + '   (stark negativ = das Spiel zieht zur Mitte)');
console.log('  mit Deckung     ' + korr(z => z.deck, z => Math.abs(z.diff)).toFixed(3));
console.log('\n  Spearman mit Jahr ' + korr(z => z.jahr, z => z.sp).toFixed(3));
