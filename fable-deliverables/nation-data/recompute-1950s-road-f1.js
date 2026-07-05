// Neuberechnung DECADE_NATION_POOLS 1950/1960 OHNE Indy-500-Teilnehmer.
// Hintergrund: Indy 500 zählte 1950–1960 zur F1-WM, hat im Spiel aber einen
// EIGENEN Fahrer-Pool (generateDriver: isIndyTeam → hart 'USA'). Die bisherigen
// 1950/1960-Gewichte enthielten die Indy-Debütanten → USA massiv überzeichnet
// für normale (Road-)F1-Teams.
// Regeln: Indy-only-Fahrer (nur Indy-Starts) fliegen raus; Crossover-Fahrer
// (Road UND Indy, z.B. Ascari 1952) zählen als Road. Debüt = erstes WC-Rennen,
// hier: erstes ROAD-Rennen (Indy-Starts begründen kein Road-Debüt).
// Aufruf: node recompute-1950s-road-f1.js  (aus fable-deliverables/nation-data/)
'use strict';
const races = require('../../f1db-json-splitted/f1db-races.json');
const results = require('../../f1db-json-splitted/f1db-races-race-results.json');
const drivers = require('../../f1db-json-splitted/f1db-drivers.json');
const countries = require('../../f1db-json-splitted/f1db-countries.json');

const iocByCountry = new Map(countries.map(c => [c.id, c.iocCode || c.alpha3Code]));
const natByDriver = new Map(drivers.map(d => [d.id, iocByCountry.get(d.nationalityCountryId) || '???']));
const indyRaceIds = new Set(races.filter(r => r.grandPrixId && r.grandPrixId.includes('indianapolis')).map(r => r.id));

// je Fahrer: erstes Road-Jahr + ob je Road/Indy gefahren
const firstRoad = new Map(), everIndy = new Set(), everRoad = new Set();
for (const r of results) {
    if (indyRaceIds.has(r.raceId)) { everIndy.add(r.driverId); continue; }
    everRoad.add(r.driverId);
    if (!firstRoad.has(r.driverId) || r.year < firstRoad.get(r.driverId)) firstRoad.set(r.driverId, r.year);
}

// Kontrolle: Indy-only-Fahrer und deren Nationen
const indyOnly = [...everIndy].filter(d => !everRoad.has(d));
const indyNat = {};
for (const d of indyOnly) { const n = natByDriver.get(d); indyNat[n] = (indyNat[n] || 0) + 1; }
console.log(`Indy-only-Fahrer: ${indyOnly.length} | Nationen:`, JSON.stringify(indyNat));

// Road-Debüts je Dekade zählen
for (const dec of [1950, 1960]) {
    const byNat = {};
    let tot = 0;
    for (const [drv, yr] of firstRoad) {
        if (Math.floor(yr / 10) * 10 !== dec) continue;
        const n = natByDriver.get(drv);
        byNat[n] = (byNat[n] || 0) + 1;
        tot++;
    }
    const sorted = Object.entries(byNat).sort((a, b) => b[1] - a[1]);
    console.log(`\n${dec}er ROAD-F1-Debüts (n=${tot}):`);
    console.log(sorted.map(([n, c]) => `${n} ${c} (${(100 * c / tot).toFixed(1)}%)`).join(', '));
    // fertige weights-Zeile im DECADE_NATION_POOLS-Format
    const weights = sorted.map(([n, c]) => `'${n}':${(c / tot).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`).join(',');
    console.log(`${dec}: {weights: {${weights}}},`);
}
