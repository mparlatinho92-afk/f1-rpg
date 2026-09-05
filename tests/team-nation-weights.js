/**
 * team-nation-weights.js — vergleicht die Nationen-Gewichtung des Team-Generators
 * mit der Realität.
 *
 * Anlass (2026-09-05): Finnland kam beim Team-Erstellen auf 3,3 % — mehr als
 * Österreich oder Belgien. Verdacht: `pickNationMotorsport` ist an FAHRER-Nationen
 * kalibriert, wird aber für TEAM-Nationen benutzt. Finnland stellt Weltmeister,
 * aber kaum Rennställe.
 *
 * Referenz: f1db-constructors.json (187 Konstrukteure mit Land) — gewichtet nach
 * Renneinsätzen, damit ein Eintagsfliegen-Konstrukteur nicht so zählt wie Ferrari.
 *
 * Aufruf: SIMCORE_FROM_INDEX=1 node tests/team-nation-weights.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getContext } = require('./sim-core');

const WURZEL = path.join(__dirname, '..');
const konstrukteure = JSON.parse(
    fs.readFileSync(path.join(WURZEL, 'f1db-json-splitted/f1db-constructors.json'), 'utf8'));
const laender = JSON.parse(
    fs.readFileSync(path.join(WURZEL, 'f1db-json-splitted/f1db-countries.json'), 'utf8'));

// countryId -> IOC-Code. ACHTUNG: f1db führt DREI Codes je Land — alpha2 (DE),
// alpha3 (DEU) und iocCode (GER). Das Spiel rechnet durchgehend in IOC. Wer hier
// alpha3 nimmt, bekommt Deutschland zweimal: einmal als GER mit null
// Konstrukteuren, einmal als DEU mit 21. Genau das ist beim ersten Lauf passiert.
const ioc = {};
for (const l of laender) if (l.iocCode) ioc[l.id] = l.iocCode;

const nachAnzahl = {};
let sumA = 0;
for (const k of konstrukteure) {
    const code = ioc[k.countryId] || k.countryId;
    nachAnzahl[code] = (nachAnzahl[code] || 0) + 1; sumA++;
}

// Referenz MUSS dekadengenau sein. Die Gesamthistorie taugt nicht als Massstab
// fuer ein einzelnes Jahr: Deutschland stellt ueber alle Jahre 21 Konstrukteure,
// in den NEUNZIGERN aber fast keinen — gegen die Gesamtzahl gemessen sieht eine
// korrekte Ziehung dann faelschlich nach "zu schwach" aus.
const landVon = {};
for (const k of konstrukteure) landVon[k.id] = ioc[k.countryId] || null;
const indyOnly = (() => {
    const s = fs.readFileSync(path.join(WURZEL, 'data', 'hist.js'), 'utf8');
    const i = s.indexOf('const INDY_500_ONLY_CONSTRUCTORS');
    const a = s.indexOf('[', i), b = s.indexOf(']', a);
    return new Set(eval(s.slice(a, b + 1)));
})();
const nachEinsaetzen = {};
let sumE = 0;
{
    const jahre = JSON.parse(fs.readFileSync(
        path.join(WURZEL, 'f1db-json-splitted/f1db-seasons-constructors.json'), 'utf8'));
    const dek = Math.min(2020, Math.max(1950, Math.floor(
        parseInt(process.env.JAHR || '1990', 10) / 10) * 10));
    for (const z of jahre) {
        if (indyOnly.has(z.constructorId)) continue;
        if (Math.min(2020, Math.max(1950, Math.floor(z.year / 10) * 10)) !== dek) continue;
        const c = landVon[z.constructorId];
        if (!c) continue;
        nachEinsaetzen[c] = (nachEinsaetzen[c] || 0) + 1; sumE++;
    }
}

// Ist-Zustand aus dem Spiel
const ctx = getContext();
const run = e => vm.runInContext(e, ctx);
const N = 40000;
const JAHR = parseInt(process.env.JAHR || '1990', 10);
const gezogen = run(`(() => {
    const z = {};
    for (let i = 0; i < ${N}; i++) {
        const n = pickTeamNation(${JAHR});
        z[n] = (z[n] || 0) + 1;
    }
    return z;
})()`);
const alt = run(`(() => {
    const z = {};
    for (let i = 0; i < ${N}; i++) {
        const n = pickNationMotorsport(${JAHR}, true);
        z[n] = (z[n] || 0) + 1;
    }
    return z;
})()`);

const alle = new Set([...Object.keys(nachEinsaetzen), ...Object.keys(gezogen)]);
const zeilen = [...alle].map(c => ({
    c,
    neu: (gezogen[c] || 0) / N * 100,
    alt: (alt[c] || 0) / N * 100,
    real: (nachEinsaetzen[c] || 0) / sumE * 100,
    teams: nachAnzahl[c] || 0
})).sort((a, b) => b.neu - a.neu);

console.log('Konstrukteure in f1db: ' + sumA + ' aus ' + Object.keys(nachAnzahl).length
    + ' Ländern. Referenz-Dekade: ' + sumE + ' Konstrukteur-Saisons');
console.log('Ziehungen je Variante: ' + N.toLocaleString('de-DE') + ', Jahr ' + JAHR + '\n');
console.log('IOC    neu%    alt%   real%   Faktor  Konstrukteure');
for (const z of zeilen) {
    if (z.neu < 0.4 && z.alt < 0.4 && z.real < 0.4) continue;
    const f = z.real > 0.02 ? (z.neu / z.real) : Infinity;
    // Marke erst ab 1 % Ziehanteil: darunter ist der Faktor Rauschen, weil jedes
    // Land ohne Konstrukteur in dieser Dekade rechnerisch unendlich abweicht.
    const relevant = z.neu >= 1 || z.real >= 1;
    const marke = !relevant ? '' : (f >= 3 ? '  <<< zu stark' : (f <= 0.34 ? '  <<< zu schwach' : ''));
    console.log(z.c.padEnd(5)
        + z.neu.toFixed(1).padStart(6)
        + z.alt.toFixed(1).padStart(8)
        + z.real.toFixed(1).padStart(8)
        + (f === Infinity ? '       —' : ('  ×' + f.toFixed(1)).padStart(9))
        + String(z.teams).padStart(9) + marke);
}

console.log('\n--- Länder ohne je einen F1-Konstrukteur ---');
const nieAlt = zeilen.filter(z => z.teams === 0 && z.alt > 0.2);
const nieNeu = zeilen.filter(z => z.teams === 0 && z.neu > 0.2);
const summe = a => a.reduce((s, z) => s + z[a === nieAlt ? 'alt' : 'neu'], 0);
console.log('  vorher: ' + nieAlt.length + ' Länder, zusammen '
    + nieAlt.reduce((s, z) => s + z.alt, 0).toFixed(1) + ' % der Ziehungen');
console.log('  jetzt:  ' + nieNeu.length + ' Länder, zusammen '
    + nieNeu.reduce((s, z) => s + z.neu, 0).toFixed(1) + ' % der Ziehungen');
console.log('  (nicht null — ein exotisches Team soll möglich bleiben, nur selten)');
