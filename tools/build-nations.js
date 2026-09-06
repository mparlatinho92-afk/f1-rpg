#!/usr/bin/env node
/**
 * build-nations.js — erzeugt data/nations.js
 *
 * Quelle: f1db-json-splitted/ (dieselbe Referenz, die auch DNQ-Meldeplan und
 * Meldelisten-Deckung nutzen). Zwei Zuordnungen, beide ueber den f1db-Slug:
 *   F1DB_DRIVER_NATIONS      915 Fahrer-Slugs      -> IOC-Code
 *   F1DB_CONSTRUCTOR_NATIONS 187 Konstrukteur-Slugs -> IOC-Code
 *
 * Warum ueberhaupt: die Nationen-Statistik zaehlt je Rennen, und der Renn-Scan
 * kennt nur Slugs. Der bisherige Weg (Name -> NAME_TO_IOC) traf Fahrer, aber
 * NIE Konstrukteure — CONSTRUCTOR_NATIONS in index.html hat nur 13 Sonderfaelle.
 *
 * ACHTUNG — f1db kennt keine DDR: alle 58 deutschen Fahrer stehen dort unter
 * "germany", auch Krakau und das Eisenacher Motorenwerk. Die Spieldaten
 * (SEASON_DATA, NAME_TO_IOC, CONSTRUCTOR_NATIONS) fuehren DDR aber getrennt und
 * haben deshalb im Spiel Vorrang; diese Tabellen fuellen nur Luecken.
 *
 * Aufruf: node tools/build-nations.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'f1db-json-splitted');
const OUT = path.join(__dirname, '..', 'data', 'nations.js');

const read = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));

const countries = read('f1db-countries.json');
const iocOf = {};
for (const c of countries) if (c.iocCode) iocOf[c.id] = c.iocCode;

const build = (rows, key, label) => {
    const map = {};
    let missing = 0;
    for (const r of rows) {
        const ioc = iocOf[r[key]];
        if (!ioc) { missing++; console.warn(`  ! ohne IOC-Code: ${r.id} (${r[key]})`); continue; }
        map[r.id] = ioc;
    }
    console.log(`${label}: ${Object.keys(map).length} Eintraege, ${missing} ohne Land`);
    return map;
};

const drivers = build(read('f1db-drivers.json'), 'nationalityCountryId', 'Fahrer');
const constructors = build(read('f1db-constructors.json'), 'countryId', 'Konstrukteure');

// Nicht-ASCII wuerde den Kodierungs-Waechter von manage-v beschaeftigen und hat
// in Slugs nichts zu suchen — lieber hier laut scheitern als still ausliefern.
for (const k of [...Object.keys(drivers), ...Object.keys(constructors)]) {
    if (!/^[a-z0-9-]+$/.test(k)) throw new Error(`Slug ist nicht ASCII-rein: ${k}`);
}

const line = (map) => JSON.stringify(map);
const out = `// GENERIERT von tools/build-nations.js — NICHT von Hand editieren.
// Quelle: f1db-json-splitted/ (f1db-drivers.json, f1db-constructors.json, f1db-countries.json)
// Stand: ${new Date().toISOString().slice(0, 10)}
//
// Slug -> IOC-Code. Wird von der Nationen-Statistik gelesen, um jedem Start im
// Renn-Scan ein Land zuzuordnen. Die Spieldaten haben Vorrang (DDR!), siehe
// nationOfDriverKey/nationOfTeamKey in index.html.
const F1DB_DRIVER_NATIONS = ${line(drivers)};
const F1DB_CONSTRUCTOR_NATIONS = ${line(constructors)};
`;

fs.writeFileSync(OUT, out, 'utf8');
console.log(`geschrieben: ${path.relative(path.join(__dirname, '..'), OUT)} (${(out.length / 1024).toFixed(1)} KB)`);
