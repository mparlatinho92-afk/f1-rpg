/**
 * sim-config-apply.js
 * Überträgt finale Balancing-Werte aus einer JSON-Config in index.html.
 *
 * Verwendung:
 *   node tests/sim-config-apply.js tests/sim-config-result.json
 *
 * Format sim-config-result.json:
 *   { "qualiVarianceBase": 8, "privateerActivityMult": 0.7, ... }
 *
 * Nur geänderte Werte angeben – Rest bleibt auf Defaults.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const configPath = process.argv[2];
if (!configPath) {
    console.error('Verwendung: node tests/sim-config-apply.js <config.json>');
    process.exit(1);
}

const config  = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const patches = [
    {
        key: 'qualiVarianceBase',
        pattern: /(const _qHalfVar = )([\d.]+)( \+ \(100 - _qConsVal\) \* 0\.07;)/,
        replace: (v) => `$1${v}$3`,
    },
    {
        key: 'trainVarianceBase',
        pattern: /(const _halfVar = )([\d.]+)( \+ \(100 - _consVal\) \* 0\.09;)/,
        replace: (v) => `$1${v}$3`,
    },
    {
        key: 'raceBadDayMin',
        pattern: /(performance -= )([\d.]+)( \+ Math\.random\(\) \* [\d.]+;)/,
        replace: (v) => `$1${v}$3`,
    },
    {
        key: 'raceBadDayRange',
        pattern: /(performance -= [\d.]+ \+ Math\.random\(\) \* )([\d.]+)(;)/,
        replace: (v) => `$1${v}$3`,
    },
    {
        key: 'privateerActivityMult',
        // Multiplier existiert noch nicht in index.html → Zeile einfügen
        pattern: /(eraBase)(?: \* [\d.]+)?( \+ \(Math\.random\(\) \* 0\.20 - 0\.10\))/,
        replace: (v) => v === 1.0 ? `$1$2` : `$1 * ${v}$2`,
    },
];

let changed = 0;
for (const p of patches) {
    const val = config[p.key];
    if (val === undefined) continue;
    const before = html;
    html = html.replace(p.pattern, p.replace(val));
    if (html !== before) {
        console.log(`✓ ${p.key} → ${val}`);
        changed++;
    } else {
        console.warn(`⚠ ${p.key}: Pattern nicht gefunden – übersprungen`);
    }
}

if (changed > 0) {
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`\n${changed} Änderung(en) in index.html geschrieben.`);
    console.log('Danach: ./manage-v.ps1 -NewVersion "..." -CommitMsg "Balancing: ..."');
} else {
    console.log('Keine Änderungen vorgenommen.');
}
