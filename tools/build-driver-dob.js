// build-driver-dob.js — erzeugt DRIVER_DOB fuer data/hist.js
//
// Rekord-Bauplan STATISTIK_FILTER_PLAN.md, Schritt 8. Alters-Rekorde ("juengster
// Sieger", "Alter beim ersten Titel") brauchen ein taggenaues Geburtsdatum. Im Spiel
// gab es bisher nur birthYear — und selbst das teils geschaetzt (firstYear - 25).
//
// Quelle: f1db-json-splitted/f1db-drivers.json (915/915 mit dateOfBirth, Format
// durchgaengig YYYY-MM-DD, gegen den Bestand geprueft).
//
// ZWEI Entscheidungen, die den Aufbau bestimmen:
//
// 1. Geschluesselt wird mit dem HIST_DRIVERS-Key, NICHT mit der F1DB-ID. Das Spiel
//    schlaegt ueber histId nach; eine Tabelle im F1DB-Schluesselraum haette an jeder
//    Fundstelle eine Umrechnung verlangt. Der Join nach F1DB passiert einmal hier.
//
// 2. Der Join ist case-insensitiv. 'john-Watson' steht mit grossem W in HIST_DRIVERS,
//    HIST_NAMES und HIST_SEASONS — der einzige Key mit Grossbuchstaben ueberhaupt.
//    F1DB kennt nur 'john-watson'. Ohne die Unempfindlichkeit fehlt genau ein Fahrer,
//    und zwar still.
//
// Aufruf:  node tools/build-driver-dob.js          (Trockenlauf, schreibt nichts)
//          node tools/build-driver-dob.js --write  (haengt an data/hist.js an)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HIST = path.join(ROOT, 'data', 'hist.js');
const SRC = path.join(ROOT, 'f1db-json-splitted', 'f1db-drivers.json');

// HIST_DRIVERS aus data/hist.js holen, ohne die Datei zu parsen: als Skript
// auswerten und nur die eine Tabelle herausreichen.
function loadHistDrivers() {
    const src = fs.readFileSync(HIST, 'utf8');
    const g = {};
    new Function('g', 'with(g){' + src + '; g.HIST_DRIVERS = HIST_DRIVERS;}')(g);
    return g.HIST_DRIVERS;
}

function main() {
    const write = process.argv.includes('--write');
    const histDrivers = loadHistDrivers();
    const f1db = JSON.parse(fs.readFileSync(SRC, 'utf8'));

    const byLower = new Map();
    for (const d of f1db) byLower.set(d.id.toLowerCase(), d);

    const dob = {};
    const missing = [];
    let ciJoins = 0;

    for (const key of Object.keys(histDrivers)) {
        const hit = byLower.get(key.toLowerCase());
        if (!hit || !hit.dateOfBirth) { missing.push(key); continue; }
        if (hit.id !== key) ciJoins++;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(hit.dateOfBirth)) {
            console.warn('  ! unerwartetes Datumsformat:', key, hit.dateOfBirth);
            continue;
        }
        dob[key] = hit.dateOfBirth;
    }

    const keys = Object.keys(dob).sort();
    console.log('HIST_DRIVERS:', Object.keys(histDrivers).length);
    console.log('Geburtsdaten gefunden:', keys.length);
    console.log('davon nur case-insensitiv gejoint:', ciJoins);
    console.log('ohne Datum:', missing.length, missing.length ? '-> ' + missing.join(', ') : '');

    // Kompakt in EINER Zeile, wie die uebrigen generierten Tabellen in hist.js.
    const body = keys.map(k => JSON.stringify(k) + ':' + JSON.stringify(dob[k])).join(',');
    const block = [
        '',
        '// DRIVER_DOB — taggenaue Geburtsdaten realer Fahrer (Rekord-Bauplan Schritt 8).',
        '// GENERIERT von tools/build-driver-dob.js — NICHT von Hand editieren.',
        '// Quelle: f1db-json-splitted/f1db-drivers.json. Schluessel = HIST_DRIVERS-Key',
        '// (nicht die F1DB-ID; \'john-Watson\' steht dort mit grossem W).',
        '// Abdeckung: ' + keys.length + '/' + Object.keys(histDrivers).length + ' realer Fahrer.',
        'const DRIVER_DOB = {' + body + '};',
        ''
    ].join('\n');

    console.log('Blockgroesse:', (block.length / 1024).toFixed(1) + ' KB');

    if (!write) {
        console.log('\nTrockenlauf — nichts geschrieben. Mit --write anhaengen.');
        console.log('Beispiel:', keys.slice(0, 3).map(k => k + '=' + dob[k]).join('  '));
        return;
    }

    let src = fs.readFileSync(HIST, 'utf8');
    // Wiederholbar: einen vorhandenen Block ersetzen statt anzuhaengen.
    const marker = /\n\/\/ DRIVER_DOB —[\s\S]*?\nconst DRIVER_DOB = \{[\s\S]*?\};\n/;
    src = marker.test(src) ? src.replace(marker, block) : src + block;
    fs.writeFileSync(HIST, src);
    console.log('\ndata/hist.js aktualisiert.');
}

main();
