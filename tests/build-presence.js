// build-presence.js — erzeugt data/presence.js (DNQ_MELDEPLAN.md, Stufe 1)
//
// PROBLEM: Das Spiel weiss nur „Team existiert in Saison X", nicht „Team ist an
// diesen Runden angetreten". Deshalb behandelt es Teams, die real eine halbe Saison
// fuhren, als ganzjaehrig praesent — der Kern des Melde-Ueberschusses (Befund A).
//
// QUELLE: f1db-seasons-entrants-drivers.json traegt `rounds` bereits fertig je
// Eintrag. Es wird nichts rekonstruiert, nur zusammengefasst.
//
// DREI ENTSCHEIDUNGEN, die das Format bestimmen:
//
// 1. GESPEICHERT WERDEN circuitIds, NICHT Rundennummern. `scheduledRaces` im Spiel
//    ist schon heute bewusst circuit-basiert (v0.9.15.11: „nicht Index, damit
//    Kalender-Edits nichts verschieben"). Rundennummern haetten diese Fragilitaet
//    wieder eingefuehrt und zusaetzlich eine Runde->Strecke-Tabelle im Spiel verlangt.
//
// 2. VOLLSAISON-TEAMS werden als `1` abgelegt, nicht als Streckenliste. Das ist der
//    haeufigste Fall und traegt keine Information — die Liste waere der Kalender.
//    Wichtig ist nur, dass `1` (bekannt, vollstaendig) von „Eintrag fehlt" (unbekannt)
//    unterscheidbar bleibt: fuer Unbekannte muss die bestehende Heuristik weiterlaufen,
//    fuer Vollsaison-Teams gerade NICHT.
//
// 3. ABDECKUNG 1950-2025. Kostet dank Punkt 2 fast nichts und erspart eine
//    Aera-Grenze als Sonderfall. Gemessener Anteil unvollstaendiger Team-Saisons:
//    1950er 75,7 % · 1970er 38,0 % · 1980er 18,2 % · ab 2016 exakt 0 %.
//
// Aufruf:  node tests/build-presence.js          (Trockenlauf)
//          node tests/build-presence.js --write  (schreibt data/presence.js)

'use strict';
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'f1db-json-splitted');
const OUT = path.join(__dirname, '..', 'data', 'presence.js');

const races = JSON.parse(fs.readFileSync(path.join(BASE, 'f1db-races.json'), 'utf8'));
const sed = JSON.parse(fs.readFileSync(path.join(BASE, 'f1db-seasons-entrants-drivers.json'), 'utf8'));

// Indy zaehlte 1950-60 zur WM, war aber ein anderes Starterfeld — dieselbe
// Filterregel wie in den Diagnose-Skripten, sonst gelten alle F1-Teams als
// „bei Runde 3 nicht angetreten".
const roundCircuit = {};                     // `${year}_${round}` -> circuitId | null (Indy)
const calendarOf = {};                       // year -> Set(circuitId), ohne Indy
for (const r of races) {
    const indy = r.grandPrixId === 'indianapolis';
    const cid = indy ? null : String(r.circuitId || '').toLowerCase();
    roundCircuit[`${r.year}_${r.round}`] = cid;
    if (cid) (calendarOf[r.year] = calendarOf[r.year] || new Set()).add(cid);
}

// year -> constructorId -> Set(circuitId)
const attended = {};
for (const e of sed) {
    if (e.testDriver) continue;
    for (const rd of (e.rounds || [])) {
        const cid = roundCircuit[`${e.year}_${rd}`];
        if (!cid) continue;
        const T = (attended[e.year] = attended[e.year] || {});
        (T[e.constructorId] = T[e.constructorId] || new Set()).add(cid);
    }
}

const out = {};
let full = 0, partial = 0, circuits = 0;
const perDecade = {};
const skipped = [];
for (const y of Object.keys(attended).map(Number).sort((a, b) => a - b)) {
    const cal = calendarOf[y];
    if (!cal || !cal.size) continue;

    // VOLLSTAENDIGKEITS-PRUEFUNG (Pflicht, nicht Kosmetik):
    // Fuer eine noch nicht gefahrene Saison kennt F1DB nur die ersten Runden. Ohne
    // diese Pruefung sieht dort JEDES Team wie ein Teilsaison-Team aus — im Stand
    // vom 2026-08 waeren das alle 11 Teams der Saison 2026 mit je 3 Rennen gewesen,
    // und das Spiel haette ihnen genau 3 Meldungen zugestanden.
    // Regel: irgendein Team muss an jeder Strecke des Kalenders gemeldet haben.
    // Fehlt auch nur eine, ist der Datensatz unvollstaendig und das ganze Jahr
    // unbrauchbar — lieber gar kein Eintrag (dann greift die bestehende Heuristik)
    // als ein falscher. Die Regel haelt sich von selbst aktuell, wenn F1DB nachzieht.
    const gesehen = new Set();
    for (const cid of Object.keys(attended[y])) for (const c of attended[y][cid]) gesehen.add(c);
    if (gesehen.size < cal.size) {
        skipped.push(`${y} (${gesehen.size}/${cal.size} Strecken belegt)`);
        continue;
    }

    const row = {};
    for (const cid of Object.keys(attended[y]).sort()) {
        const set = attended[y][cid];
        if (set.size >= cal.size) { row[cid] = 1; full++; }
        else {
            // Kalender-Reihenfolge beibehalten: leichter lesbar beim Nachprüfen.
            row[cid] = [...cal].filter(c => set.has(c));
            partial++; circuits += row[cid].length;
            const d = Math.floor(y / 10) * 10;
            perDecade[d] = (perDecade[d] || 0) + 1;
        }
    }
    out[y] = row;
}

const years = Object.keys(out).map(Number);
console.log(`Saisons:            ${years.length} (${Math.min(...years)}-${Math.max(...years)})`);
console.log(`Team-Saisons:       ${full + partial}  (${full} vollstaendig, ${partial} Teilsaison)`);
console.log(`Teilsaison-Anteil:  ${(partial / (full + partial) * 100).toFixed(1)} %`);
console.log(`Teilsaisons je Dekade:`, Object.keys(perDecade).sort()
    .map(d => `${d}s:${perDecade[d]}`).join('  '));

const body = years.sort((a, b) => a - b).map(y => {
    const row = out[y];
    const inner = Object.keys(row).map(cid => JSON.stringify(cid) + ':' +
        (row[cid] === 1 ? '1' : JSON.stringify(row[cid]))).join(',');
    return y + ':{' + inner + '}';
}).join(',\n            ');

const block = `        // TEAM_PRESENCE — an welchen Strecken ein Konstrukteur real angetreten ist.
        // GENERIERT von tests/build-presence.js — NICHT von Hand editieren.
        // Quelle: f1db-seasons-entrants-drivers.json (Feld \`rounds\`), Indy und
        // Testfahrer herausgefiltert.
        //
        // Werte:  1          = volle Saison (haeufigster Fall, traegt keine Information)
        //         [circuit…] = NUR diese Strecken (Teilsaison)
        //         Eintrag fehlt = UNBEKANNT -> bestehende Heuristik gilt weiter.
        // Die Unterscheidung zwischen 1 und „fehlt" ist tragend: fuer bekannte
        // Vollsaison-Teams darf markSmallConstructors NICHT mehr wuerfeln.
        //
        // Schluessel sind circuitIds (lowercase), passend zu driver.scheduledRaces.
        // ${full + partial} Team-Saisons, davon ${partial} Teilsaison.
        const TEAM_PRESENCE = {
            ${body}
        };
`;

console.log(`Dateigroesse:       ${(block.length / 1024).toFixed(1)} KB`);

if (!process.argv.includes('--write')) {
    console.log('\nTrockenlauf — nichts geschrieben. Mit --write erzeugen.');
    const bsp = out[1985];
    if (bsp) {
        const teil = Object.keys(bsp).filter(k => bsp[k] !== 1);
        console.log(`Stichprobe 1985: ${Object.keys(bsp).length} Teams, davon Teilsaison:`,
            teil.map(t => `${t}(${bsp[t].length})`).join(' ') || '—');
    }
    process.exit(0);
}

fs.writeFileSync(OUT, block);
console.log(`\n${OUT} geschrieben.`);
