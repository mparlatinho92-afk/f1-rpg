/**
 * hist-debut-quali.js – erstes Jahr in HIST_DRIVERS (Feld 6) = erste Meldung zur Qualifikation.
 *
 * Nutzer-Regel 15.11.2026: Freitagsfahrer sind keine Debuetanten. Ab der ersten Meldung fuer die
 * Qualifikation ODER Vorqualifikation gilt das Debuet – auch wenn der Fahrer sie nicht besteht
 * (DNQ, DNPQ) oder nicht startet (DNS).
 * Vorher stand dort das erste Jahr als Meldeteilnehmer ueberhaupt (seasons-entrants), also auch
 * Freitagstrainings: Antonelli 2024 statt 2025, Sutil 2006 statt 2007.
 *
 * Quelle: f1db-json-splitted – races-qualifying-results (alle Jahre ab 1950), races-pre-qualifying-results
 * und race-results ohne DNP (dort stehen DNQ/DNPQ). Wer nie zur (Vor-)Quali gemeldet war, bekommt null.
 *
 * Aufruf: node tools/hist-debut-quali.js          Bericht, schreibt nichts
 *         node tools/hist-debut-quali.js --schreiben   Feld 6 in data/hist.js ersetzen
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const F = n => require(path.join(ROOT, 'f1db-json-splitted', n));

const erst = {};
const merke = (id, y) => { if (id && (erst[id] == null || y < erst[id])) erst[id] = y; };
F('f1db-races-qualifying-results.json').forEach(x => merke(x.driverId, x.year));
F('f1db-races-pre-qualifying-results.json').forEach(x => merke(x.driverId, x.year));
F('f1db-races-race-results.json').forEach(x => { if (x.positionText !== 'DNP') merke(x.driverId, x.year); });

const datei = path.join(ROOT, 'data', 'hist.js');
let src = fs.readFileSync(datei, 'utf8');
const anfang = src.indexOf('const HIST_DRIVERS = {');
// Blockende ist die erste Zeile "};" (danach folgt HIST_NAMES). Nicht nach "        };" suchen:
// das trifft erst HIST_TEAMS weiter unten, deren Feld 6 etwas anderes bedeutet.
const ende = src.indexOf('\n};', anfang);
if (ende < 0) throw new Error('Ende von HIST_DRIVERS nicht gefunden');
const block = src.slice(anfang, ende);
const zeile = /^"([^"]+)":\[([^\]]*)\],?$/gm;
const aend = [];
const neu = block.replace(zeile, (all, id, felder) => {
    const f = felder.split(',').map(s => s.trim());
    const alt = f[6] === 'null' ? null : Number(f[6]);
    const soll = erst[id] ?? null;
    if (alt === soll) return all;
    aend.push({ id, alt, soll, starts: Number(f[4]) });
    f[6] = soll == null ? 'null' : String(soll);
    return all.replace('[' + felder + ']', '[' + f.join(', ') + ']');
});
console.log(`${aend.length} Aenderungen in HIST_DRIVERS Feld 6 (erstes Jahr):`);
aend.forEach(a => console.log(`  ${a.id.padEnd(28)} ${a.alt} -> ${a.soll}   (Starts ${a.starts})`));
if (process.argv.includes('--schreiben')) {
    fs.writeFileSync(datei, src.slice(0, anfang) + neu + src.slice(ende));
    console.log('geschrieben: data/hist.js');
}
