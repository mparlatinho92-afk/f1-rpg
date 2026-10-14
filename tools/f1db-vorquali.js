// Erzeugt F1DB_PREQUALIFYING in data/f1db.js aus f1db-json-splitted/f1db-races-pre-qualifying-results.json.
//   node tools/f1db-vorquali.js
// Format wie F1DB_QUALIFYING: { raceId: [[pos, driverId, timeMs], ...] } — 79 Rennen 1977–1992.
// Gebraucht fuer das Head-to-Head echter Jahre: ein DNPQ steht hinter allen Quali-Teilnehmern,
// zwei DNPQ werden nach ihrem Vorquali-Platz verglichen (Nutzer-Regel 14.10.2026).
// Laeuft idempotent: eine vorhandene Zeile wird ersetzt.
const fs = require('fs');
const path = require('path');
const wurzel = path.join(__dirname, '..');
const quelle = require(path.join(wurzel, 'f1db-json-splitted', 'f1db-races-pre-qualifying-results.json'));
const ziel = path.join(wurzel, 'data', 'f1db.js');

const je = {};
for (const e of quelle) {
    const zeile = [e.positionNumber ?? null, e.driverId];
    if (e.timeMillis != null) zeile.push(e.timeMillis);
    (je[e.raceId] = je[e.raceId] || []).push([e.positionDisplayOrder, zeile]);
}
for (const k of Object.keys(je)) je[k] = je[k].sort((a, b) => a[0] - b[0]).map(x => x[1]);

const zeile = '        const F1DB_PREQUALIFYING=' + JSON.stringify(je) + ';';
let s = fs.readFileSync(ziel, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
const vorhanden = /^ *const F1DB_PREQUALIFYING=.*$/m;
if (vorhanden.test(s)) s = s.replace(vorhanden, zeile);
else {
    const m = s.match(/^ *const F1DB_QUALIFYING=.*$/m);
    if (!m) throw new Error('F1DB_QUALIFYING nicht gefunden');
    const ende = m.index + m[0].length;
    s = s.slice(0, ende) + nl + zeile + s.slice(ende);
}
fs.writeFileSync(ziel, s);
console.log(`F1DB_PREQUALIFYING: ${Object.keys(je).length} Rennen, ${quelle.length} Eintraege, ${zeile.length} Zeichen`);
