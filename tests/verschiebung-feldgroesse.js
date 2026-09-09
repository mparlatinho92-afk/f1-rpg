/**
 * verschiebung-feldgroesse.js — haengt die Grid→Ziel-Verschiebung an der Feldgroesse?
 *
 *   node tests/verschiebung-feldgroesse.js [aera-von] [aera-bis]
 *   node tests/verschiebung-feldgroesse.js 1950 1959
 *
 * Hintergrund: ticker-vs-sim.js meldet, dass das Spiel das Feld weniger
 * durchmischt als die Realitaet (5,51 gegen 6,14 Plaetze). Das Spiel hat aber
 * auch ein KLEINERES Feld (19,8 gegen 22,7 Starter). In einem kleineren Feld
 * sind grosse Spruenge rein rechnerisch unmoeglich - wer von P18 startet, kann
 * hoechstens 17 Plaetze gutmachen.
 *
 * Bevor man an der Engine dreht, muss also geklaert sein, ob der Unterschied
 * ueberhaupt vom Modell kommt oder nur von der Feldgroesse. Gemessen wird die
 * reale Verschiebung, aufgeschluesselt nach Starterzahl - reine F1DB-Auswertung,
 * ohne Spielcode.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const VON = parseInt(process.argv[2]) || 1950;
const BIS = parseInt(process.argv[3]) || 1959;

const F1DB = path.join(__dirname, '..', 'f1db-json-splitted');
const lade = f => JSON.parse(fs.readFileSync(path.join(F1DB, f), 'utf8'));
const races = lade('f1db-races.json');
const grids = lade('f1db-races-starting-grid-positions.json');
const ergs = lade('f1db-races-race-results.json');

const gridNach = new Map();
for (const x of grids) {
    if (!x.positionNumber) continue;
    if (!gridNach.has(x.raceId)) gridNach.set(x.raceId, new Map());
    gridNach.get(x.raceId).set(x.driverId, x.positionNumber);
}
const ergNach = new Map();
for (const r of ergs) {
    if (!ergNach.has(r.raceId)) ergNach.set(r.raceId, []);
    ergNach.get(r.raceId).push(r);
}

const proRennen = [];
for (const r of races) {
    if (r.year < VON || r.year > BIS) continue;
    const g = gridNach.get(r.id), e = ergNach.get(r.id);
    if (!g || !e) continue;
    const paare = [];
    for (const x of e) {
        const gp = g.get(x.driverId);
        if (!gp) continue;
        paare.push({ grid: gp, ziel: (x.positionNumber === null || x.positionNumber === undefined) ? null : x.positionNumber });
    }
    if (paare.length < 5) continue;
    const gewertet = paare.filter(p => p.ziel !== null);
    if (!gewertet.length) continue;
    const versch = gewertet.map(p => Math.abs(p.grid - p.ziel));
    proRennen.push({
        jahr: r.year, name: r.officialName,
        starter: paare.length,
        gewertet: gewertet.length,
        dnfQuote: (paare.length - gewertet.length) / paare.length,
        versch: versch.reduce((a, b) => a + b, 0) / versch.length,
        // auf die Feldgroesse normiert: wie viel vom maximal Moeglichen?
        normiert: (versch.reduce((a, b) => a + b, 0) / versch.length) / paare.length
    });
}

const mittel = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;

console.log('═══ Grid→Ziel-Verschiebung nach Startfeldgröße, ' + VON + '–' + BIS + ' ═══\n');
console.log('Rennen ausgewertet: ' + proRennen.length + '   (reine F1DB-Auswertung, kein Spielcode)\n');

const klassen = [[0, 15], [16, 18], [19, 21], [22, 24], [25, 99]];
console.log('Starter      Rennen   Ø Verschiebung   Ø DNF-Quote   normiert (Versch./Starter)');
console.log('─'.repeat(80));
for (const [von, bis] of klassen) {
    const g = proRennen.filter(x => x.starter >= von && x.starter <= bis);
    if (!g.length) continue;
    const lbl = bis === 99 ? (von + '+') : (von + '–' + bis);
    console.log(lbl.padEnd(13) + String(g.length).padStart(6) +
        mittel(g.map(x => x.versch)).toFixed(2).padStart(17) +
        (mittel(g.map(x => x.dnfQuote)) * 100).toFixed(1).padStart(13) + ' %' +
        mittel(g.map(x => x.normiert)).toFixed(3).padStart(15));
}
console.log('─'.repeat(80));
console.log('gesamt'.padEnd(13) + String(proRennen.length).padStart(6) +
    mittel(proRennen.map(x => x.versch)).toFixed(2).padStart(17) +
    (mittel(proRennen.map(x => x.dnfQuote)) * 100).toFixed(1).padStart(13) + ' %' +
    mittel(proRennen.map(x => x.normiert)).toFixed(3).padStart(15));

/* Korrelation Starterzahl ↔ Verschiebung */
const xs = proRennen.map(p => p.starter), ys = proRennen.map(p => p.versch);
const mx = mittel(xs), my = mittel(ys);
let sxy = 0, sxx = 0, syy = 0;
for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
}
const r = sxy / Math.sqrt(sxx * syy);
const steigung = sxy / sxx;

console.log('\nKorrelation Starterzahl ↔ Verschiebung : r = ' + r.toFixed(3));
console.log('Steigung                               : ' + steigung.toFixed(3) + ' Plaetze je zusaetzlichem Starter');
console.log('');

/* ═══ Vergleich mit dem Spiel ═══
   ACHTUNG: ticker-vs-sim.js mittelt ueber alle FAHRER-PAARE (grosse Rennen
   wiegen schwerer -> 6,14), dieses Skript oben ueber RENNEN-Mittelwerte
   (jedes Rennen gleich -> 5,11). Beides ist richtig, aber man darf sie nicht
   mischen. Fuer den Spielvergleich wird deshalb die Paar-Mittelung genutzt -
   dieselbe, die ticker-vs-sim.js verwendet. */
function paarMittelung(rennen) {
    let summe = 0, n = 0;
    for (const p of rennen) { summe += p.versch * p.gewertet; n += p.gewertet; }
    return n ? summe / n : null;
}
const SPIEL_STARTER = 19.8, SPIEL_VERSCH = 5.51;

// Reale Rennen mit vergleichbarer Feldgroesse - direkter Vergleich ohne Regression
const nahe = proRennen.filter(p => p.starter >= 18 && p.starter <= 22);
const naheWert = paarMittelung(nahe);
console.log('');
console.log('═══ Gleiche Feldgröße vergleichen (Paar-Mittelung wie ticker-vs-sim) ═══');
console.log('Real, nur Rennen mit 18–22 Startern : ' + nahe.length + ' Rennen, Ø ' +
    (naheWert === null ? '–' : naheWert.toFixed(2)) + ' Plätze');
console.log('Spiel (19,8 Starter)                : ' + SPIEL_VERSCH.toFixed(2) + ' Plätze');
console.log('Alle realen Rennen (Paar-Mittelung) : ' + paarMittelung(proRennen).toFixed(2) + ' Plätze');

const erwartet = naheWert !== null ? naheWert : (my + steigung * (SPIEL_STARTER - mx));
console.log('');
const rest = SPIEL_VERSCH - erwartet;
console.log('Rest nach Herausrechnen der Feldgröße     : ' + (rest >= 0 ? '+' : '') + rest.toFixed(2) + ' Plätze');
console.log('');
if (Math.abs(rest) < 0.25) {
    console.log('→ Der Unterschied erklärt sich WEITGEHEND aus der kleineren Feldgröße.');
    console.log('  An der Engine ist nichts zu korrigieren; der Hebel ist das Startfeld.');
} else if (rest < 0) {
    console.log('→ Das Spiel mischt auch bei gleicher Feldgröße ZU WENIG durch (' + rest.toFixed(2) + ').');
    console.log('  Ein echter Modellbefund, nicht nur ein Feldgrößen-Artefakt.');
} else {
    console.log('→ Das Spiel mischt bei gleicher Feldgröße sogar STÄRKER durch (+' + rest.toFixed(2) + ').');
}
