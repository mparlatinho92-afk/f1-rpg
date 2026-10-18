#!/usr/bin/env node
/**
 * ausfallrunde-real.js — In welcher Runde fallen Fahrer real aus? F1DB, je Ära und Ausfallart.
 *
 * Für den Live-Ticker (reine Darstellung): Ob jemand ausfällt, entscheidet simulateRace, nur das
 * WANN ist frei. Dieses Werkzeug liefert die reale Verteilung als Anteil der Renndistanz.
 *
 * Aufruf: node tests/ausfallrunde-real.js
 *
 * Grundlage: race-results `laps` = vollendete Runden des Ausgefallenen, races `laps` = Rundenzahl des
 * Rennens (tatsächlich gefahren, bei Abbruch weniger als geplant). Anteil = laps / Rennrunden.
 *   0 Runden = in Runde 1 ausgefallen.
 * Unfall = accident/collision/spun off/spin (wie dnf-spreizung.js), sonst Technik/Sonstiges.
 * ⚠ Nur positionText "DNF". NC (nicht klassifiziert, fuhr aber bis zum Ende) und DSQ zählen nicht.
 * ⚠ Indy 500 (1950–60) ausgenommen.
 */
const fs = require('fs');
const path = require('path');

const DB = path.join(__dirname, '..', 'f1db-json-splitted');
const lade = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));
const races = lade('f1db-races.json');
const erg = lade('f1db-races-race-results.json');
const rennen = new Map(races.map(r => [r.id, r]));
const indy = new Set(races.filter(r => r.circuitId === 'indianapolis' && r.year <= 1960).map(r => r.id));
const UNFALL = /accident|collision|spun off|\bspin\b/i;

const AEREN = [[1950, 1959], [1960, 1969], [1970, 1979], [1980, 1989], [1990, 1999], [2000, 2009], [2010, 2019], [2020, 2024]];
// Klassen: Runde 1 (0 Runden vollendet), dann Anteil der Distanz in Zehnteln
const KLASSEN = ['R1', '<10%', '10–20', '20–30', '30–40', '40–50', '50–60', '60–70', '70–80', '80–90', '90+'];
const klasse = (laps, n) => laps === 0 ? 0 : Math.min(10, 1 + Math.floor(10 * laps / n));

console.log('AUSFALLRUNDE REAL — F1DB, nur DNF, Anteil der Renndistanz\n');
const zeile = (titel, l) => {
    const z = new Array(KLASSEN.length).fill(0);
    for (const e of l) z[klasse(e.laps, rennen.get(e.raceId).laps)]++;
    const med = l.map(e => e.laps / rennen.get(e.raceId).laps).sort((a, b) => a - b)[Math.floor(l.length / 2)];
    console.log('  ' + titel.padEnd(18) + String(l.length).padStart(5) + '  ' + z.map(v => (100 * v / l.length).toFixed(1).padStart(5)).join(' ')
        + '   Median ' + (100 * med).toFixed(0) + ' %');
};
console.log('  ' + 'Ära / Art'.padEnd(18) + '    n  ' + KLASSEN.map(k => k.padStart(5)).join(' '));
for (const [a, b] of AEREN) {
    const alle = erg.filter(e => e.year >= a && e.year <= b && e.positionText === 'DNF' && !indy.has(e.raceId));
    const mit = alle.filter(e => e.laps != null && rennen.get(e.raceId) && rennen.get(e.raceId).laps > 0);
    if (!mit.length) continue;
    console.log(`  ${a}–${b}: Runden erfasst bei ${mit.length} von ${alle.length} Ausfällen (${(100 * mit.length / alle.length).toFixed(1)} %)`);
    zeile('  alle', mit);
    zeile('  Unfall', mit.filter(e => UNFALL.test(e.reasonRetired || '')));
    zeile('  Technik/sonst', mit.filter(e => !UNFALL.test(e.reasonRetired || '')));
}
