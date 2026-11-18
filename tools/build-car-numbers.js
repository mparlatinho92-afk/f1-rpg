// build-car-numbers.js — erzeugt data/car-numbers.js (18.11.2026)
//
// ECHTE KARRIERE-NUMMERN AB 2014 (Nutzer 18.11.2026): Ab 2014 fährt jeder Fahrer eine
// selbst gewählte, feste Nummer. Das Spiel vergibt sie in echten Jahren wie in echt;
// neue Fahrer nehmen, was frei ist, frei gewordene echte Nummern kommen wieder in den Topf.
//
// QUELLE: f1db-json-splitted/f1db-races-race-results.json, Feld `driverNumber` pro Rennen.
// `drivers.permanentNumber` taugt nicht: es kennt nur die aktuelle Nummer von ~30 Fahrern.
//
// REGELN:
//   • Je Fahrer und Jahr gilt die häufigste Nummer der Saison.
//   • Die 1 zählt nicht: das ist das Weltmeister-Recht, nicht die Karriere-Nummer
//     (Vettel 1 → 5, Verstappen 1 → 33/3, Norris 1 → 4).
//   • Ausgegeben werden nur Wechsel: { slug: [[abJahr, nummer], …] }.
//     Verstappen 33 ab 2015, 3 ab 2026 → [[2015,33],[2026,3]].
//   • Einzelrennen mit Fremdnummer (Vandoorne 47 als Ersatz 2016) gehen in der
//     Saisonmehrheit unter, wenn er im selben Jahr mehr Rennen mit seiner Nummer fuhr;
//     sonst ist die Ersatznummer seine Nummer dieses Jahres (so war es auch).
//
// Aufruf: node tools/build-car-numbers.js   (nach jedem F1DB-Update)
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const res = JSON.parse(fs.readFileSync(path.join(root, 'f1db-json-splitted', 'f1db-races-race-results.json'), 'utf8'));

const zaehl = {};   // slug → jahr → nummer → anzahl
for (const e of res) {
    if (e.year < 2014 || e.driverNumber == null || +e.driverNumber === 1) continue;
    const j = ((zaehl[e.driverId] ??= {})[e.year] ??= {});
    j[e.driverNumber] = (j[e.driverNumber] || 0) + 1;
}
const out = {};
for (const slug of Object.keys(zaehl).sort()) {
    const liste = [];
    for (const jahr of Object.keys(zaehl[slug]).map(Number).sort((a, b) => a - b)) {
        const nr = +Object.entries(zaehl[slug][jahr]).sort((a, b) => b[1] - a[1])[0][0];
        if (!liste.length || liste[liste.length - 1][1] !== nr) liste.push([jahr, nr]);
    }
    out[slug] = liste;
}
const kopf = `// data/car-numbers.js — GENERIERT von tools/build-car-numbers.js, nicht von Hand ändern.\n`
    + `// Echte Karriere-Nummern ab 2014: { slug: [[abJahr, nummer], …] }, ohne die Weltmeister-1.\n`;
fs.writeFileSync(path.join(root, 'data', 'car-numbers.js'), kopf + 'const REAL_CAR_NUMBERS = ' + JSON.stringify(out) + ';\n');
console.log(`data/car-numbers.js: ${Object.keys(out).length} Fahrer, ${Object.values(out).filter(l => l.length > 1).length} mit Nummernwechsel`);
for (const [s, l] of Object.entries(out)) if (l.length > 1) console.log('  ' + s + ' ' + JSON.stringify(l));
