// build-title-clinch.js — erzeugt TITLE_CLINCH fuer data/hist.js
//
// Rekord-Bauplan STATISTIK_FILTER_PLAN.md, Schritt 9a. Gesucht ist der Tag, an dem
// ein Titel rechnerisch feststand — nicht der Saisonschluss.
//
// WARUM NICHT GERECHNET: Fuer simulierte Saisons laesst sich das aus der Punktsumme
// herleiten, weil das Spiel keine Streichresultate kennt. Fuer die REALE Historie
// gilt das nicht — bis 1990 zaehlten je nach Saison nur die besten N Ergebnisse, eine
// naive Summenrechnung datiert den Titel falsch. F1DB liefert das Ergebnis aber
// fertig: f1db-races-driver-standings.json traegt pro Zeile championshipWon, und das
// steht AB dem Entscheidungsrennen auf true. Frueheste Runde mit true = Clinch.
// Es wird also abgelesen, nicht rekonstruiert.
//
// Aufruf:  node tools/build-title-clinch.js          (Trockenlauf)
//          node tools/build-title-clinch.js --write  (schreibt data/hist.js)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HIST = path.join(ROOT, 'data', 'hist.js');
const STANDINGS = path.join(ROOT, 'f1db-json-splitted', 'f1db-races-driver-standings.json');
const RACES = path.join(ROOT, 'f1db-json-splitted', 'f1db-races.json');

function main() {
    const write = process.argv.includes('--write');
    const standings = JSON.parse(fs.readFileSync(STANDINGS, 'utf8'));
    const races = JSON.parse(fs.readFileSync(RACES, 'utf8'));

    const raceById = new Map(races.map(r => [r.id, r]));
    const roundsPerYear = {};
    for (const r of races) roundsPerYear[r.year] = Math.max(roundsPerYear[r.year] || 0, r.round);

    // Frueheste Runde je Jahr, in der jemand championshipWon traegt.
    const best = {};
    for (const row of standings) {
        if (row.championshipWon !== true) continue;
        const cur = best[row.year];
        if (!cur || row.round < cur.round) {
            best[row.year] = { round: row.round, raceId: row.raceId, driverId: row.driverId };
        }
    }

    const years = Object.keys(best).map(Number).sort((a, b) => a - b);
    const clinch = {};
    for (const y of years) {
        const b = best[y];
        const race = raceById.get(b.raceId);
        clinch[y] = [b.raceId, (race && race.date) || null, b.driverId, b.round, roundsPerYear[y] || null];
    }

    console.log('Jahre mit Titel-Entscheidung:', years.length,
                years.length ? `(${years[0]}–${years[years.length - 1]})` : '');
    const luecken = [];
    for (let y = years[0]; y <= years[years.length - 1]; y++) if (!clinch[y]) luecken.push(y);
    console.log('Luecken:', luecken.length ? luecken.join(', ') : 'keine');
    console.log('ohne Datum:', years.filter(y => !clinch[y][1]).length);

    // Vorzeitig entschieden = Clinch-Runde vor der letzten Runde der Saison.
    const vorzeitig = years.filter(y => clinch[y][3] < clinch[y][4]);
    console.log('vorzeitig entschieden:', vorzeitig.length, 'von', years.length);

    console.log('\nStichproben (Plan-Referenz):');
    for (const y of [1992, 2002, 2004, 2013]) {
        if (clinch[y]) console.log(`  ${y}: ${clinch[y][2]}, Lauf ${clinch[y][3]}/${clinch[y][4]}, ${clinch[y][1]}`);
    }

    const body = years.map(y => y + ':' + JSON.stringify(clinch[y])).join(',');
    const block = [
        '',
        '// TITLE_CLINCH — Tag, an dem der Fahrertitel rechnerisch feststand (Bauplan 9a).',
        '// GENERIERT von tools/build-title-clinch.js — NICHT von Hand editieren.',
        '// Quelle: f1db-races-driver-standings.json, Feld championshipWon (ab dem',
        '// Entscheidungsrennen true). Streichresultate muessen NICHT rekonstruiert werden.',
        '// Format: { jahr: [raceId, "YYYY-MM-DD", driverId, runde, rundenGesamt] }',
        'const TITLE_CLINCH = {' + body + '};',
        ''
    ].join('\n');
    console.log('Blockgroesse:', (block.length / 1024).toFixed(1) + ' KB');

    if (!write) { console.log('\nTrockenlauf — nichts geschrieben. Mit --write anhaengen.'); return; }

    let src = fs.readFileSync(HIST, 'utf8');
    const marker = /\n\/\/ TITLE_CLINCH —[\s\S]*?\nconst TITLE_CLINCH = \{[\s\S]*?\};\n/;
    src = marker.test(src) ? src.replace(marker, block) : src + block;
    fs.writeFileSync(HIST, src);
    console.log('\ndata/hist.js aktualisiert.');
}

main();
