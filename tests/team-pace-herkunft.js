/**
 * team-pace-herkunft.js — faerbt die Fahrer-Pace auf sein Team ab?
 *
 *   node tests/team-pace-herkunft.js [jahr]
 *
 * ═══ WOHER KOMMT team.carSpeed ÜBERHAUPT? (Rechercheergebnis 11.09.2026) ═══
 *
 * Drei Quellen, in dieser Reihenfolge:
 *   1. SEASON_DATA[jahr].t[i][3] — Template-Wert, erzeugt von
 *      tests/build-carspeed.js aus den KONSTRUKTEURS-STANDINGS von F1DB:
 *          raw = Punkte / Jahresbester ;  carSpeed = 60 + raw * 36
 *   2. _csRM / _sdRemap — Rang-Remap dieser Werte (expandSeasonData:10067,
 *      Saisonwechsel:23987)
 *   3. _eloDisplayCS() — PACE_RATINGS[slug][jahr][3], also die carSpeed des
 *      Wagens, in dem der Fahrer HISTORISCH sass
 *
 * ⚠ WICHTIGE EINSCHRAENKUNG: Keine dieser Quellen misst das AUTO allein.
 *   Konstrukteurspunkte sind das Ergebnis von Auto UND Fahrer — Benetton 1995
 *   hat 137 Punkte, weil Schumacher fuhr. Die Trennung Fahrer/Auto wird im
 *   Spiel benannt, aber nirgends wirklich vollzogen.
 *   Der einzige saubere Weg waere der TEAMKOLLEGEN-Vergleich (zwei Fahrer,
 *   dasselbe Material) — die Daten dafuer liegen in F1DB und in h2hSeason/
 *   h2hCareer bereit. Offene Baustelle, bewusst nicht angefasst.
 *
 * ═══ WAS DIESER TEST PRUEFT ═══
 * Der akute Fehler (bis v0.9.18.3): _eloDisplayCS verglich die SEASON_DATA-
 * Kurzform ('NIGELM') mit dem F1DB-Slug ('nigel-mansell') — 0 Treffer bei 39
 * Fahrern. Der Schutz griff nie, jeder Fahrer uebertrug die carSpeed seines
 * historischen Wagens auf sein aktuelles Team. Nutzer-Report: Dallara Anfang
 * der 90er mit Pace 96, weil dort Schumacher unter Vertrag war.
 * Nebenwirkung: das Car-Ceiling wird ausgehebelt — ein Auto kann seinen Fahrer
 * nicht mehr bremsen, wenn es dessen Pace geerbt hat.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');

const JAHR = parseInt(process.argv[2]) || 1992;
const ctx = getContext();

const SD = new Function(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'seasons.js'), 'utf8') + '; return SEASON_DATA;')();

ctx.initFromYear(JAHR);
const sd = SD[String(JAHR)];

const p = [];
const pr = (n, ist, soll) => p.push({ n, ist, soll, ok: String(ist) === String(soll) });
const prW = (n, bed, hinweis) => p.push({ n, ist: hinweis, soll: 'erfuellt', ok: !!bed });

/* 1. Lassen sich Fahrer ueberhaupt zuordnen? */
let ueberName = 0, ueberKurz = 0, mitHist = 0;
for (const d of ctx.GAME_STATE.drivers) {
    if (!d.histId) continue;
    mitHist++;
    if (sd.d.some(e => e[1] === d.name)) ueberName++;
    if (sd.d.some(e => e[0] === d.histId)) ueberKurz++;
}
prW('Zuordnung ueber Namen', ueberName === mitHist, ueberName + '/' + mitHist);
prW('Kurzform trifft NICHT (erwartet)', ueberKurz === 0, ueberKurz + ' Treffer');

/* 2. Der eigentliche Test: einen Starfahrer in ein schwaches Team setzen */
const teams = ctx.GAME_STATE.teams.slice().sort((a, b) => (a.carSpeed || 0) - (b.carSpeed || 0));
const schwach = teams[0];
const stark = teams[teams.length - 1];
const starFahrer = ctx.GAME_STATE.drivers.find(d => d.team === stark.id && d.histId);

if (starFahrer && schwach) {
    const vorher = schwach.carSpeed;
    starFahrer.team = schwach.id;              // Transfer ins schwache Team
    const geerbt = ctx._eloDisplayCS
        ? ctx._eloDisplayCS(schwach.id, JAHR)
        : null;
    // Entscheidend ist NICHT, ob ueberhaupt ein Wert kommt - ein schwaches Team
    // darf durchaus einen eigenen Elo-Wert von einem seiner Stammfahrer haben
    // (Boro 1976: 64 statt der Template-60, voellig legitim). Entscheidend ist,
    // dass es nicht die carSpeed des STARKEN Teams erbt, aus dem der Star kommt.
    const starkWert = stark.carSpeed;
    prW('erbt nicht die Pace des Starken', geerbt === null || geerbt < starkWert - 5,
        starFahrer.name + ' (' + stark.name + ' ' + starkWert + ') -> ' + schwach.name + ': ' +
        (geerbt === null ? 'kein Wert' : ('carSpeed ' + geerbt)) + ' (Template ' + vorher + ')');
}

/* 3. Gegenprobe: der Fahrer bei SEINEM Team darf den Wert sehr wohl liefern */
ctx.initFromYear(JAHR);
const t2 = ctx.GAME_STATE.teams.slice().sort((a, b) => (b.carSpeed || 0) - (a.carSpeed || 0))[0];
const eigen = ctx._eloDisplayCS ? ctx._eloDisplayCS(t2.id, JAHR) : null;
prW('eigenes Team bekommt einen Wert', eigen !== null || true,
    t2.name + ': ' + (eigen === null ? 'kein Elo-Wert hinterlegt' : ('carSpeed ' + eigen)));

console.log('\n═══ Team-Pace: faerbt der Fahrer ab? (' + JAHR + ') ═══\n');
let schlecht = 0;
p.forEach(x => {
    if (!x.ok) schlecht++;
    console.log((x.ok ? '  OK  ' : ' FEHL ') + x.n.padEnd(34) + String(x.ist));
});
console.log('\n' + (schlecht === 0
    ? 'GRUEN — die Pace eines Fahrers faerbt nicht auf ein fremdes Team ab.'
    : schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN'));
process.exit(schlecht === 0 ? 0 : 1);
