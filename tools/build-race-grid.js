// build-race-grid.js — erzeugt data/race-grid.js aus tools/quellen/renn-meldungen.csv
//
// ZWEI PROBLEME, EINE QUELLE.
//
// 1. GRID_SIZES haelt EINEN Wert je Jahr — den realen Ø Starter. Real schwankt die
//    Starterzahl je Rennen massiv, und in rund der Haelfte der Rennen liegt sie
//    UEBER diesem Mittel:
//      1958  Ø 18,9  Spanne 10-25  Deckel 19  ->  5 von 10 Rennen darueber
//      1961  Ø 23,1  Spanne 15-32  Deckel 24  ->  4 von  8
//      1969  Ø 16,8  Spanne 13-22  Deckel 17  ->  4 von 11
//    Seit v0.9.15.93 ballen sich die Melder korrekt an den grossen Rennen — und
//    stossen dort an einen Deckel, den es real nicht gab. Folge: DNQ 3,3 / 3,7 / 1,7
//    gegen real 1,8 / 2,1 / 0,5. Ausnahmen gab es bisher nur fuer Monaco und die
//    Nordschleife, beide von Hand.
//
// 2. PRE_QUAL_DATA modelliert die Vor-Qualifikation mit pool/through/PROB je Jahr —
//    einer Wuerfelwahrscheinlichkeit, weil die rennscharfe Information fehlte. Die
//    Tabelle hat sie: 1978 setzte die Vor-Quali erst ab Runde 4 ein (0,0,0,8,8,…),
//    1989 lief sie an allen 16 Wochenenden.
//
// QUELLE: Tabelle des Nutzers, im Repo unter tools/quellen/renn-meldungen.csv.
//   Spalten: Jahr, Runde, Grand Prix ID, Circuit ID, Gemeldet, Pre-Qualy, Qualy, Starter
//     Gemeldet G = Meldeliste · Pre-Qualy P = wie viele in die Vor-Quali MUSSTEN
//     Qualy Q    = wie viele ins Qualifying kamen   -> DNPQ = G - Q
//     Starter S                                      -> DNQ  = Q - S
//   Daraus: pool = P, through = Q - (G - P), also wie viele AUS DEM POOL durchkamen.
//
// GEPRUEFT gegen F1DB: Starter in 1149 von 1149 Rennen identisch, circuitId ohne eine
// einzige Abweichung. Die Meldespalte weicht in 13 Rennen um >=3 ab (Tabelle meist
// niedriger; Monaco 1958 vermerkt der Nutzer selbst als unvollstaendig) — sie wird
// hier NICHT uebernommen, das Spiel erzeugt seine Meldeliste selbst.
//
// ⚠ ZWEI FALLEN IN DER CSV:
//   - Von 1225 Zeilen sind nur 1149 Rennen. Je Saison folgt eine SUMMENZEILE, deren
//     Circuit-Spalte eine deutsche Dezimalzahl traegt ("0,00"). Filter: /^[a-z]/.
//   - Genau diese Felder tragen Kommas in Anfuehrungszeichen — ein Split auf ","
//     zerlegt die Zeile falsch. Deshalb der echte Parser unten.
//
// Aufruf:  node tools/build-race-grid.js          (Trockenlauf)
//          node tools/build-race-grid.js --write  (schreibt data/race-grid.js)
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'tools', 'quellen', 'renn-meldungen.csv');
const OUT = path.join(ROOT, 'data', 'race-grid.js');
const WRITE = process.argv.includes('--write');

function parseCsv(t) {
    const rows = []; let f = '', row = [], q = false;
    for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
        else if (c === '"') q = true;
        else if (c === ',') { row.push(f); f = ''; }
        else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
        else if (c !== '\r') f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
}

const roh = parseCsv(fs.readFileSync(SRC, 'utf8')).slice(1);
const rennen = roh.filter(r => /^\d{4}$/.test(r[0]) && /^[a-z]/.test(r[3] || ''));
const summen = roh.filter(r => /^\d{4}$/.test(r[0])).length - rennen.length;

const out = {};
let mitVorQuali = 0, doppelt = 0, indy = 0;
for (const r of rennen) {
    const [jahr, , gp, cid] = r;
    // Indy raus wie ueberall: anderes Starterfeld (33), eigene Regeln, eigener Deckel
    // im Spiel (INDY_GRID_SIZE). Ein Eintrag hier wuerde ihn ueberschreiben.
    if (gp === 'indianapolis') { indy++; continue; }
    const G = +r[4], P = +r[5] || 0, Q = +r[6], S = +r[7];
    if (!S) continue;
    const zeile = out[jahr] = out[jahr] || {};
    // Vier Strecken tragen zwei Rennen im selben Jahr (Spielberg/Silverstone/Bahrain
    // 2020, Spielberg 2021) — alle vier mit IDENTISCHEN Zahlen (20/0/20/20). Der
    // Schluessel circuitId verliert dadurch nichts.
    if (zeile[cid] !== undefined) { doppelt++; continue; }
    if (P > 0) { zeile[cid] = [S, P, Math.max(0, Q - (G - P))]; mitVorQuali++; }
    else zeile[cid] = S;
}

const jahre = Object.keys(out).map(Number).sort((a, b) => a - b);
console.log(`Rennzeilen:            ${rennen.length}  (Summenzeilen aussortiert: ${summen})`);
console.log(`Uebernommen:           ${jahre.reduce((s, y) => s + Object.keys(out[y]).length, 0)} Rennen in ${jahre.length} Saisons`);
console.log(`Davon mit Vor-Quali:   ${mitVorQuali}`);
console.log(`Indy uebersprungen:    ${indy}  ·  Doppelstrecken zusammengefasst: ${doppelt}`);

const body = jahre.map(y => {
    const z = out[y];
    const inner = Object.keys(z).sort().map(c => JSON.stringify(c) + ':' + JSON.stringify(z[c])).join(',');
    return y + ':{' + inner + '}';
}).join(',\n            ');

const block = `        // RACE_GRID — Starterzahl und Vor-Qualifikation JE EINZELNEM RENNEN.
        // GENERIERT von tools/build-race-grid.js aus tools/quellen/renn-meldungen.csv.
        // NICHT von Hand editieren.
        //
        // Aufbau: Jahr -> circuitId ->
        //   Zahl        = so viele Starter, keine Vor-Qualifikation
        //   [S, P, T]   = S Starter · P Wagen mussten in die Vor-Quali · T kamen durch
        //
        // WOZU: GRID_SIZES haelt nur EINEN Wert je Jahr (den Ø Starter). Real schwankte
        // die Starterzahl stark — 1961 zwischen 15 und 32 — und lag in rund der Haelfte
        // der Rennen ueber dem Jahresmittel. Seit v0.9.15.93 melden die Fahrer korrekt
        // geballt an den grossen Rennen und scheiterten dort an einem Deckel, den es
        // real nicht gab (DNQ 1961: 3,7 gegen real 2,1).
        //
        // Die Vor-Quali stand vorher in PRE_QUAL_DATA mit einer WAHRSCHEINLICHKEIT je
        // Jahr, weil die rennscharfe Information fehlte. Hier steht sie: 1978 lief sie
        // erst ab Runde 4, 1989 an allen 16 Wochenenden.
        //
        // Indy ist ausgeschlossen (eigener Deckel INDY_GRID_SIZE = 33).
        // ${jahre.reduce((s, y) => s + Object.keys(out[y]).length, 0)} Rennen, ${jahre[0]}-${jahre[jahre.length - 1]}, davon ${mitVorQuali} mit Vor-Qualifikation.
        const RACE_GRID = {
            ${body}
        };
`;

console.log(`Dateigroesse:          ${(block.length / 1024).toFixed(1)} KB`);

if (!WRITE) {
    console.log('\nProbe 1961:', JSON.stringify(out[1961]));
    console.log('\nProbe 1989:', JSON.stringify(out[1989]));
    console.log('\nTrockenlauf — nichts geschrieben. Mit --write erzeugen.');
    process.exit(0);
}
fs.writeFileSync(OUT, block, 'utf8');
console.log(`\n${OUT} geschrieben.`);
