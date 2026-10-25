#!/usr/bin/env node
/**
 * build-rennkalender.js — Daten für das eigenständige Werkzeug rennkalender.html.
 *
 *   node tools/build-rennkalender.js [vonJahr] [bisJahr]     (Standard 1950–1985)
 *
 * Schritt 1: WM-Läufe aus F1DB (f1db-json-splitted/) mit Datum, Strecke, Koordinaten und allen
 * gemeldeten Fahrern (Starter, DNQ, DNPQ …). Zeitzone je Strecke = IANA-Zone des nächstgelegenen
 * Orts aus GeoNames cities500 (tools/quellen/geonames, CC BY 4.0) — so funktioniert dieselbe
 * Zuordnung später auch für Nicht-WM-Strecken. Sommerzeit rechnet der Browser (Intl, historisch).
 * Startzeiten hat F1DB vor 1985 keine einzige: das Werkzeug setzt 14 Uhr Ortszeit an.
 *
 * Ausgabe: rennkalender/daten-wm.js (const RK_WM = {...}), damit die Seite auch per file:// lädt.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const [VON = 1950, BIS = 1985] = process.argv.slice(2).map(Number);
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'f1db-json-splitted');
const lade = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));

const rennen = lade('f1db-races.json').filter(r => r.year >= VON && r.year <= BIS);
const rennIds = new Set(rennen.map(r => r.id));
const ergebnisse = lade('f1db-races-race-results.json').filter(e => rennIds.has(e.raceId));
const strecken = new Map(lade('f1db-circuits.json').map(c => [c.id, c]));
const laender = new Map(lade('f1db-countries.json').map(c => [c.id, c]));
const fahrer = new Map(lade('f1db-drivers.json').map(d => [d.id, d]));
const konstrukteure = new Map(lade('f1db-constructors.json').map(c => [c.id, c]));
const grandsPrix = new Map(lade('f1db-grands-prix.json').map(g => [g.id, g]));

// --- Zeitzone: nächster GeoNames-Ort (Spalten: 4 lat, 5 lon, 17 timezone) ---
const orte = [];
for (const z of fs.readFileSync(path.join(ROOT, 'tools/quellen/geonames/cities500.txt'), 'utf8').split('\n')) {
    const s = z.split('\t');
    if (s.length > 17 && s[17]) orte.push([+s[4], +s[5], s[17]]);
}
function zeitzone(lat, lon) {
    let best = null, bestD = Infinity;
    const cosLat = Math.cos(lat * Math.PI / 180);
    for (const [a, b, tz] of orte) {
        const d = (a - lat) ** 2 + ((b - lon) * cosLat) ** 2;
        if (d < bestD) { bestD = d; best = tz; }
    }
    return best;
}

const outStrecken = {}, outFahrer = {}, outTeams = {};
for (const id of new Set(rennen.map(r => r.circuitId))) {
    const c = strecken.get(id);
    outStrecken[id] = { name: c.fullName || c.name, ort: c.placeName, land: (laender.get(c.countryId) || {}).name || c.countryId,
        lat: c.latitude, lon: c.longitude, tz: zeitzone(c.latitude, c.longitude) };
}
const outRennen = rennen.sort((a, b) => a.date.localeCompare(b.date)).map(r => {
    const feld = ergebnisse.filter(e => e.raceId === r.id).sort((a, b) => a.positionDisplayOrder - b.positionDisplayOrder);
    for (const e of feld) {
        if (!outFahrer[e.driverId]) {
            const d = fahrer.get(e.driverId);
            outFahrer[e.driverId] = { n: d.name, nat: (laender.get(d.nationalityCountryId) || {}).alpha3Code || '' };
        }
        if (!outTeams[e.constructorId]) outTeams[e.constructorId] = (konstrukteure.get(e.constructorId) || {}).name || e.constructorId;
    }
    return { id: 'wm-' + r.id, serie: 'F1-WM', datum: r.date, name: (grandsPrix.get(r.grandPrixId) || {}).fullName || r.officialName,
        strecke: r.circuitId, feld: feld.map(e => [e.driverId, e.positionText, e.constructorId]) };
});

const kopf = `// GENERIERT von tools/build-rennkalender.js — nicht von Hand editieren.\n`
    + `// Quelle: F1DB (CC BY 4.0) ${VON}–${BIS}, Zeitzonen GeoNames cities500 (CC BY 4.0).\n`;
const ziel = path.join(ROOT, 'rennkalender', 'daten-wm.js');
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, kopf + 'const RK_WM = ' + JSON.stringify({ von: VON, bis: BIS, strecken: outStrecken,
    fahrer: outFahrer, teams: outTeams, rennen: outRennen }) + ';\n', 'utf8');

const zonen = {};
Object.values(outStrecken).forEach(s => { zonen[s.tz] = (zonen[s.tz] || 0) + 1; });
console.log(`${outRennen.length} Rennen, ${Object.keys(outStrecken).length} Strecken, ${Object.keys(outFahrer).length} Fahrer, `
    + `${ergebnisse.length} Meldungen → ${path.relative(ROOT, ziel)} (${(fs.statSync(ziel).size / 1024).toFixed(0)} KB)`);
console.log('Zeitzonen: ' + Object.entries(zonen).map(([z, n]) => `${z} ${n}`).join(' · '));
