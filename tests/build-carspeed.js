'use strict';
/**
 * build-carspeed.js
 * Leitet Team-carSpeed aus F1DB-Konstrukteurs-Standings ab (Option A).
 * Unabhängig von Fahrer-Elo – rein auf Basis realer Konstrukteurs-Punkte.
 *
 * Formel pro Jahr:
 *   raw = pts / yearMax                          (0..1, relativ zum Jahresbesten)
 *   carSpeed = round(CS_MIN + raw * (CS_MAX - CS_MIN))
 * Dann globale Perzentile 5%/95% → Endskala 60–96 (identisch mit alter Skala)
 *
 * Aufruf: node tests/build-carspeed.js
 * Output: tests/carspeed_by_team.json
 */

const fs   = require('fs');
const path = require('path');

const CS_MIN = 60;
const CS_MAX = 96;

const STANDINGS_FILE = path.join(__dirname, '..', 'f1db-json-splitted', 'f1db-seasons-constructor-standings.json');
const OUT_FILE       = path.join(__dirname, 'carspeed_by_team.json');

const standings = JSON.parse(fs.readFileSync(STANDINGS_FILE, 'utf8'));

// ── Schritt 1: Jahresweise gruppieren ────────────────────────────────────
const byYear = {};
for (const r of standings) {
    if (!byYear[r.year]) byYear[r.year] = [];
    byYear[r.year].push({ team: r.constructorId, pts: r.points || 0 });
}

// ── Schritt 2: Pro Jahr normalisieren (relativ zum Jahresbesten) ─────────
// raw[team][year] = pts / yearMax
const raw = {};  // { teamSlug: { year: rawValue } }

for (const [year, entries] of Object.entries(byYear)) {
    const yearMax = Math.max(...entries.map(e => e.pts), 1);
    for (const e of entries) {
        if (!raw[e.team]) raw[e.team] = {};
        raw[e.team][year] = e.pts / yearMax;
    }
}

// ── Schritt 3: Globale Perzentile 5%/95% für finale Skalierung ──────────
const allRaw = Object.values(raw).flatMap(y => Object.values(y)).sort((a, b) => a - b);
const p5  = allRaw[Math.floor(allRaw.length * 0.05)];
const p95 = allRaw[Math.floor(allRaw.length * 0.95)];

function normalize(v) {
    const clamped = Math.max(p5, Math.min(p95, v));
    return Math.round(CS_MIN + ((clamped - p5) / (p95 - p5)) * (CS_MAX - CS_MIN));
}

// ── Schritt 4: Output aufbauen ───────────────────────────────────────────
const output = {};
for (const [team, years] of Object.entries(raw)) {
    output[team] = {};
    for (const [year, v] of Object.entries(years)) {
        output[team][year] = normalize(v);
    }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));

// ── Validierung ──────────────────────────────────────────────────────────
const checks = [
    ['mclaren',  '1988', 96],
    ['ferrari',  '1988', null],
    ['williams', '1992', null],
    ['ferrari',  '1979', null],
    ['ferrari',  '1980', null],
    ['williams', '1982', null],
    ['renault',  '1982', null],
    ['minardi',  '2002', 60],
    ['red-bull', '2023', 96],
];

console.log('\nValidierung:');
for (const [team, year, expected] of checks) {
    const val = output[team]?.[year] ?? '–';
    const ok  = expected === null ? '' : (val === expected ? ' ✓' : ` ✗ (erwartet ${expected})`);
    console.log(`  ${team.padEnd(18)} ${year}: ${String(val).padStart(3)}${ok}`);
}

// Ferrari 1979 vs 1980 Vergleich
const f79 = output['ferrari']?.['1979'];
const f80 = output['ferrari']?.['1980'];
console.log(`\nFerrari 1979→1980: ${f79} → ${f80} ${f79 > f80 ? '✓ (Rückgang korrekt)' : '⚠ (kein Rückgang)'}`);

const totalEntries = Object.values(output).reduce((s, y) => s + Object.keys(y).length, 0);
console.log(`\nOutput: ${Object.keys(output).length} Teams, ${totalEntries} Jahres-Einträge → ${OUT_FILE}`);
