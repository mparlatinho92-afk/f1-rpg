/**
 * Komprimiert f1db-races-race-results.json → F1DB_RACE_MS
 * Format: { raceId: { driverId: [gapMs, timeMs] } }
 * Nur Einträge wo gapMs ODER timeMs nicht null.
 * Trailing-null-Trimming: [gapMs, timeMs] → [gapMs] wenn timeMs null.
 * Output: f1db-race-ms-compressed.js
 */
const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../f1db-json-splitted/f1db-races-race-results.json'), 'utf8'));

const out = {};
let kept = 0;

for (const e of raw) {
    const gapMs  = e.gapMillis  ?? null;
    const timeMs = e.timeMillis ?? null;
    if (gapMs === null && timeMs === null) continue;

    const rid = String(e.raceId);
    if (!out[rid]) out[rid] = {};

    // [gapMs, timeMs] – trailing null trimmen
    const entry = timeMs !== null ? [gapMs, timeMs] : [gapMs];
    out[rid][e.driverId] = entry;
    kept++;
}

const json = JSON.stringify(out);
const outPath = path.join(__dirname, '../f1db-race-ms-compressed.js');
fs.writeFileSync(outPath, `const F1DB_RACE_MS=${json};\nfunction getF1DBRaceMs(raceId,driverId){const r=F1DB_RACE_MS[String(raceId)];return r?r[driverId]||null:null;}\n`);

console.log('Einträge behalten:', kept, '/', raw.length);
console.log('Output-Größe:', (json.length / 1024).toFixed(0), 'KB');
console.log('Gespeichert:', outPath);
