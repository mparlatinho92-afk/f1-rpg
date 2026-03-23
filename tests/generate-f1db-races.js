/**
 * generate-f1db-races.js
 * Generiert F1DB_RACES aus f1db-races.json neu.
 * Format: { raceId: [name, date, circuit, isIndy(0/1), scheduledLaps] }
 * Output: in Konsole (zum Einfügen in die HTML)
 *
 * Verwendung: node tests/generate-f1db-races.js
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const races = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../f1db-json-splitted/f1db-races.json'), 'utf8')
);

const out = {};
for (const r of races) {
    const isIndy = r.circuitId === 'indianapolis' ? 1 : 0;
    const laps   = r.scheduledLaps ?? r.laps ?? 60;
    out[String(r.id)] = [r.officialName, r.date, r.circuitId, isIndy, laps];
}

const json = JSON.stringify(out);
console.log(`// F1DB_RACES: {raceId: [name, date, circuit, isIndy(0/1), scheduledLaps]}`);
console.log(`const F1DB_RACES = ${json};`);
console.log(`\n// Einträge: ${Object.keys(out).length}`);
