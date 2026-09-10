/**
 * strecken-meldemuster.js — welche Strecken weichen systematisch vom Feld ab?
 *
 *   node tests/strecken-meldemuster.js [von] [bis] [minRennen]
 *   node tests/strecken-meldemuster.js 1950 1975 3
 *
 * Reine F1DB-Auswertung, kein Spielcode.
 *
 * Bekannt sind Indianapolis (33 per Reglement), Monaco (Starterlimit),
 * Argentinien (Ueberseereise) und die Nordschleife (grosses Feld). Dieser Test
 * sucht die UEBRIGEN: je Strecke die mittlere Abweichung vom jeweiligen
 * JAHRESSCHNITT - so faellt der Aera-Trend heraus und nur der Streckeneffekt
 * bleibt uebrig.
 *
 * Wichtig: ein Muster kann zeitlich begrenzt sein (Monaco deckelte 1958-71,
 * 1972-74 nicht). Deshalb laesst sich der Zeitraum eingrenzen.
 *
 * ⚠⚠ DIESE ZAHLEN SIND NICHT VENUE_PULL. Gemessen wird hier der GESAMTEFFEKT auf
 * die Starterzahl - Heimsog und Streckensog zusammen. data/venue-pull.js enthaelt
 * dagegen NUR den Sog auf AUSWAERTIGE Melder, der Heimsog steckt getrennt in
 * _homePullWeight. Deshalb steht Aintree hier im Plus (+3,1: viele britische
 * Melder), im VENUE_PULL aber bei 0,59. Beides ist richtig, es sind verschiedene
 * Groessen - nie gegeneinander rechnen.
 *
 * Befund 09.09.2026 (1950-1975): alle auffaelligen Strecken sind in VENUE_PULL
 * bereits erfasst und dort nach Dekaden gestaffelt. Monaco zeigt das Muster am
 * klarsten - hoher Sog (1950er: 1,47) bei hartem Deckel (16), daraus entstehen
 * die realen 11 DNQ. Neu gefunden wurde KEINE Luecke.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const VON = parseInt(process.argv[2]) || 1950;
const BIS = parseInt(process.argv[3]) || 1975;
const MIN = parseInt(process.argv[4]) || 3;

const F1DB = path.join(__dirname, '..', 'f1db-json-splitted');
const lade = f => JSON.parse(fs.readFileSync(path.join(F1DB, f), 'utf8'));
const races = lade('f1db-races.json');
const grids = lade('f1db-races-starting-grid-positions.json');

const starterVon = new Map();
for (const x of grids) {
    if (!x.positionNumber) continue;
    starterVon.set(x.raceId, (starterVon.get(x.raceId) || 0) + 1);
}

const proRennen = [];
for (const r of races) {
    if (r.year < VON || r.year > BIS) continue;
    const st = starterVon.get(r.id);
    if (!st) continue;
    proRennen.push({ jahr: r.year, circuit: r.circuitId, gp: r.grandPrixId, starter: st, name: r.officialName });
}

// Jahresschnitt bilden
const jahrSchnitt = {};
for (const p of proRennen) {
    (jahrSchnitt[p.jahr] = jahrSchnitt[p.jahr] || []).push(p.starter);
}
for (const j in jahrSchnitt) {
    const a = jahrSchnitt[j];
    jahrSchnitt[j] = a.reduce((s, x) => s + x, 0) / a.length;
}

// Abweichung je Strecke
const proCircuit = {};
for (const p of proRennen) {
    const abw = p.starter - jahrSchnitt[p.jahr];
    (proCircuit[p.circuit] = proCircuit[p.circuit] || []).push({ abw, jahr: p.jahr, starter: p.starter });
}

const mittel = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const rows = Object.entries(proCircuit)
    .filter(([, v]) => v.length >= MIN)
    .map(([c, v]) => ({
        c, n: v.length,
        abw: mittel(v.map(x => x.abw)),
        starter: mittel(v.map(x => x.starter)),
        von: Math.min(...v.map(x => x.jahr)), bis: Math.max(...v.map(x => x.jahr)),
        // Streuung: ein FESTES Feld (Reglement) hat kaum Streuung
        spanne: Math.max(...v.map(x => x.starter)) - Math.min(...v.map(x => x.starter))
    }))
    .sort((a, b) => b.abw - a.abw);

console.log('\n═══ Streckeneffekt ' + VON + '–' + BIS + ' ═══');
console.log('Abweichung vom JAHRESSCHNITT (der Ära-Trend ist herausgerechnet)');
console.log('mind. ' + MIN + ' Rennen je Strecke, ' + proRennen.length + ' Rennen gesamt\n');
console.log('Strecke                 Rennen   Ø Starter   Δ Schnitt   Spanne   Zeitraum');
console.log('─'.repeat(78));
const zeig = r => console.log(r.c.padEnd(24) + String(r.n).padStart(5) +
    r.starter.toFixed(1).padStart(12) + ((r.abw >= 0 ? '+' : '') + r.abw.toFixed(1)).padStart(12) +
    String(r.spanne).padStart(9) + ('  ' + r.von + '–' + r.bis).padStart(12));

console.log('▲ MEHR Melder als üblich');
rows.filter(r => r.abw > 1.5).forEach(zeig);
console.log('\n▼ WENIGER Melder als üblich');
rows.filter(r => r.abw < -1.5).reverse().forEach(zeig);

console.log('\n' + '─'.repeat(78));
console.log('Lesehilfe:');
console.log('  Kleine Spanne bei starkem Δ  → festes Feld, wahrscheinlich REGLEMENT');
console.log('  Große Spanne bei starkem Δ   → schwankend, eher Anreise/Interesse');
