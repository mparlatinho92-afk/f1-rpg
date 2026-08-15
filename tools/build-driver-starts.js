// build-driver-starts.js — erzeugt data/driver-starts.js
//
// PROBLEM: `markPrivateers` macht die zwei Schnellsten je Team zu Werksfahrern und
// alle anderen zu Privatiers. Die ANZAHL der Rennen wird daraus abgeleitet — also
// aus dem PACE-RANG. Real haengt beides nicht zusammen: Arturo Merzario war 1974 bei
// Iso-Marlboro der Dritte und fuhr trotzdem alle 15 Rennen (Spiel: 3,3).
//
// Gemessen mit tests/driver-participation.js, Spiel gegen real:
//   1995: Teilzeit 2 statt 12, Gaststarter 0 statt 4 — in der Moderne kennt das
//         Spiel ueberhaupt keine Teilzeitfahrer mehr (Mansell 17,0 statt 2)
//   1955: Teilzeit 30 statt 21, Gaststarter 11 statt 18 — zu viele mittellange
//         Einsaetze, zu wenige echte Einmal-Starter
//
// DIESE TABELLE HAELT NUR DIE ANZAHL, NICHT DIE STRECKEN. Welche Rennen ein Fahrer
// faehrt, bleibt emergent (`_pickPrivateerRaces` mit Heimrennen-Sog und Ballung) —
// nur WIE VIELE kommt aus den Daten. Das ist die Trennung, die der Nutzer wollte:
// „emergent statt geskriptet waere die bewegung wohin es geht".
//
// JEDER reale Melder bekommt einen Eintrag, Vollsaison als 0. Nur so heisst
// "kein Eintrag" eindeutig "hat real gar nicht gemeldet" — sonst bekaeme ein vom
// Spiel eingefuegter Pool-Fahrer faelschlich eine volle Saison zugestanden.
//
// Aufruf:  node tools/build-driver-starts.js          (Trockenlauf)
//          node tools/build-driver-starts.js --write  (schreibt data/driver-starts.js)
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'f1db-json-splitted');
const OUT = path.join(ROOT, 'data', 'driver-starts.js');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
const WRITE = process.argv.includes('--write');
const VOLLSAISON = 0.8;          // ab hier gilt ein Fahrer als Stammfahrer

// ── Kalender, Indy raus (gleiche Filterregel wie build-presence.js) ─────────
const roundCircuit = {}, calOf = {};
for (const r of J('f1db-races.json')) {
    const cid = r.grandPrixId === 'indianapolis' ? null : String(r.circuitId || '').toLowerCase();
    roundCircuit[`${r.year}_${r.round}`] = cid;
    if (cid) (calOf[r.year] = calOf[r.year] || new Set()).add(cid);
}

// year -> driverId -> Set(circuit), ueber ALLE Konstrukteure zusammengefasst
const teilnahme = {};
for (const e of J('f1db-seasons-entrants-drivers.json')) {
    if (e.testDriver) continue;
    for (const rd of (e.rounds || [])) {
        const cid = roundCircuit[`${e.year}_${rd}`];
        if (!cid) continue;
        ((teilnahme[e.year] = teilnahme[e.year] || {})[e.driverId] =
            teilnahme[e.year][e.driverId] || new Set()).add(cid);
    }
}

const out = {};
let eintraege = 0, uebersprungen = 0;
const proDekade = {};
for (const y of Object.keys(teilnahme).map(Number).sort((a, b) => a - b)) {
    const cal = calOf[y];
    if (!cal || !cal.size) continue;

    // VOLLSTAENDIGKEITS-WAECHTER wie in build-presence.js: fuer eine noch nicht
    // gefahrene Saison kennt F1DB nur die ersten Runden — dort saehe JEDER Fahrer
    // wie ein Gaststarter aus, und das Spiel wuerde ihm entsprechend wenige Rennen
    // zugestehen. Regel: an jeder Kalenderstrecke muss irgendwer gemeldet haben.
    const gesehen = new Set();
    for (const d of Object.keys(teilnahme[y])) for (const c of teilnahme[y][d]) gesehen.add(c);
    if (gesehen.size < cal.size) { uebersprungen++; continue; }

    // JEDER reale Melder bekommt einen Eintrag — Vollsaison als 0.
    // Warum nicht nur die Teilzeitler: „kein Eintrag" muss eindeutig „hat real gar
    // nicht gemeldet" heissen. Sonst bekaeme ein vom Spiel eingefuegter Pool-Fahrer,
    // den es real nie gab, faelschlich eine volle Saison zugestanden.
    const row = {};
    for (const dId of Object.keys(teilnahme[y])) {
        const n = teilnahme[y][dId].size;
        const voll = n / cal.size >= VOLLSAISON;
        // EIN-RENNEN-MELDER bekommen die STRECKE dazu, nicht nur die Zahl. Sonst
        // verstreut das Spiel sie ueber den Kalender und die grossen Sonderfelder
        // verschwinden: am Nuerburgring meldeten 1952/53 sechzehn bzw. fuenfzehn
        // Fahrer, die sonst kein einziges WM-Rennen fuhren (F2-Feld im selben Rennen),
        // Ende der 1960er nochmals zehn je Saison. Gemessener Ueberhang gegenueber
        // dem Saisonmittel: 1952 +7,7 · 1953 +9,8 · 1966 +9,8 · 1969 +8,7.
        // Fuer viele dieser Fahrer IST dieses eine Rennen die ganze Karriere — die
        // Strecke ist dann genauso Teil der Wahrheit wie die Anzahl.
        row[dId] = voll ? 0 : (n === 1 ? [...teilnahme[y][dId]][0] : n);   // 0 = volle Saison
        if (!voll) {
            eintraege++;
            const dek = Math.floor(y / 10) * 10;
            proDekade[dek] = (proDekade[dek] || 0) + 1;
        }
    }
    if (Object.keys(row).length) out[y] = row;
}

const jahre = Object.keys(out).map(Number).sort((a, b) => a - b);
console.log(`Saisons:            ${jahre.length} (${Math.min(...jahre)}-${Math.max(...jahre)})`);
console.log(`Teilzeit-Eintraege: ${eintraege}`);
console.log(`Je Dekade:`, Object.keys(proDekade).sort().map(d => `${d}s:${proDekade[d]}`).join('  '));
if (uebersprungen) console.log(`Unvollstaendige Saisons uebersprungen: ${uebersprungen}`);

const body = jahre.map(y => {
    const inner = Object.keys(out[y]).sort()
        .map(d => JSON.stringify(d) + ':' + JSON.stringify(out[y][d])).join(',');
    return y + ':{' + inner + '}';
}).join(',\n            ');

const block = `        // DRIVER_STARTS — wie viele Rennen ein Fahrer in dieser Saison real MELDETE.
        // GENERIERT von tools/build-driver-starts.js — NICHT von Hand editieren.
        //
        // Bei zwei oder mehr Rennen steht hier NUR DIE ANZAHL — welche es werden,
        // bleibt emergent (_pickPrivateerRaces mit Heimrennen-Sog, Streckensog und
        // Ballung). Nur der EIN-RENNEN-Fall traegt die Strecke mit, weil dort sonst
        // die grossen Sonderfelder verschwinden (Nuerburgring 1952/53 und Ende der
        // 1960er: F2-Wagen im selben Rennen, +8 bis +10 Melder ueber dem Saisonmittel)
        // — und weil dieses eine Rennen fuer viele die gesamte Karriere ist.
        //
        // Aufbau: Jahr -> driverId (HIST_SEASONS-Slug) -> Anzahl Rennen. Indy raus.
        //   0        = volle Saison (>= ${VOLLSAISON * 100} % des Kalenders)
        //   n > 0    = genau so viele Rennen (WELCHE, entscheidet das Spiel)
        //   "strecke" = genau EIN Rennen, und zwar dieses (circuitId)
        //   fehlt    = hat in dieser Saison real GAR NICHT gemeldet -> das Spiel
        //              entscheidet selbst (generierte Fahrer, Pool-Auffueller)
        // ${eintraege} Teilzeit-Faelle ueber ${jahre.length} Saisons.
        const DRIVER_STARTS = {
            ${body}
        };
`;

console.log(`Dateigroesse:       ${(block.length / 1024).toFixed(1)} KB`);

if (!WRITE) {
    const b = out[1974];
    if (b) {
        const proben = ['arturo-merzario', 'peter-gethin', 'jochen-mass', 'carlos-pace', 'tim-schenken'];
        console.log('\nStichprobe 1974 (Kalender: ' + calOf[1974].size + ' Rennen):');
        for (const p of proben) {
            const v = b[p];
            console.log(`  ${p.padEnd(20)} ${v === 0 ? 'volle Saison'
                : typeof v === 'string' ? 'ein Rennen: ' + v
                : v !== undefined ? v + ' Rennen' : 'real NICHT gemeldet'}`);
        }
    }
    console.log('\nTrockenlauf — nichts geschrieben. Mit --write erzeugen.');
    process.exit(0);
}

fs.writeFileSync(OUT, block, 'utf8');
console.log(`\n${OUT} geschrieben.`);
