/**
 * meldezahl-verteilung.js — woran hängt die Zahl der Autos, die ein Konstrukteur bringt?
 *
 *   node tests/meldezahl-verteilung.js [von] [bis]
 *   node tests/meldezahl-verteilung.js 1950 1969
 *
 * Reine F1DB-Auswertung, kein Spielcode.
 *
 * Ziel: eine VERTEILUNG statt fester Werte. Feste Zahlen je Team und Jahr
 * ("Cooper 1961 = 12") scheiden aus zwei Gründen aus:
 *   - sie sind gescriptet, jeder Durchlauf saehe gleich aus
 *   - ab Simsaison 2 sind die Kader generiert; "Cooper 1961" gibt es dann nicht
 *     mehr. Die Meldezahl muss an Eigenschaften haengen, die im SPIELSTAND
 *     stehen (Aera, Teamstaerke), nicht an historischen Namen.
 *
 * Gemessen wird deshalb: P(Autos = n | Aera, Teamstaerke). Als Staerke-Proxy
 * dient der Rang des Konstrukteurs innerhalb seines Jahres nach mittlerer
 * Zielposition - das laesst sich im Spiel ueber den carSpeed-Rang abbilden.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const VON = parseInt(process.argv[2]) || 1950;
const BIS = parseInt(process.argv[3]) || 1969;

const F1DB = path.join(__dirname, '..', 'f1db-json-splitted');
const lade = f => JSON.parse(fs.readFileSync(path.join(F1DB, f), 'utf8'));
const races = lade('f1db-races.json');
const grids = lade('f1db-races-starting-grid-positions.json');
const ergs = lade('f1db-races-race-results.json');

const raceInfo = new Map();
for (const r of races) raceInfo.set(r.id, r);

/* Autos je Konstrukteur und Rennen */
const proRennenTeam = [];   // {jahr, raceId, team, autos}
const gridNach = new Map();
for (const x of grids) {
    if (!x.positionNumber) continue;
    const r = raceInfo.get(x.raceId);
    if (!r || r.year < VON || r.year > BIS) continue;
    const k = x.raceId + '|' + x.constructorId;
    gridNach.set(k, (gridNach.get(k) || 0) + 1);
}
for (const [k, autos] of gridNach) {
    const [raceId, team] = k.split('|');
    const r = raceInfo.get(+raceId);
    proRennenTeam.push({ jahr: r.year, raceId: +raceId, team, autos, circuit: r.circuitId });
}

/* Teamstärke je Jahr: mittlere Zielposition (kleiner = stärker) */
const posSumme = {};   // jahr|team -> {summe, n}
for (const e of ergs) {
    const r = raceInfo.get(e.raceId);
    if (!r || r.year < VON || r.year > BIS) continue;
    if (!e.positionNumber) continue;
    const k = r.year + '|' + e.constructorId;
    if (!posSumme[k]) posSumme[k] = { summe: 0, n: 0 };
    posSumme[k].summe += e.positionNumber;
    posSumme[k].n++;
}
// Rang innerhalb des Jahres bilden
const rangVon = {};   // jahr|team -> quartil 1..4
const jahre = [...new Set(proRennenTeam.map(x => x.jahr))];
for (const j of jahre) {
    const teams = Object.keys(posSumme).filter(k => k.startsWith(j + '|'))
        .map(k => ({ k, mp: posSumme[k].summe / posSumme[k].n }))
        .sort((a, b) => a.mp - b.mp);
    teams.forEach((t, i) => { rangVon[t.k] = Math.min(4, Math.floor(i / teams.length * 4) + 1); });
}

const mittel = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;

console.log('\n═══ Autos je Konstrukteur und Rennen, ' + VON + '–' + BIS + ' ═══');
console.log('(reine F1DB-Auswertung, ' + proRennenTeam.length + ' Team-Rennen-Paare)\n');

/* 1. Nach Ära */
console.log('Nach Jahrfünft:');
console.log('Zeitraum     Paare    Ø Autos   1 Auto %   3+ Autos %');
console.log('─'.repeat(58));
for (let a = Math.floor(VON / 5) * 5; a <= BIS; a += 5) {
    const g = proRennenTeam.filter(x => x.jahr >= a && x.jahr < a + 5);
    if (!g.length) continue;
    const eins = g.filter(x => x.autos === 1).length / g.length * 100;
    const drei = g.filter(x => x.autos >= 3).length / g.length * 100;
    console.log((a + '–' + (a + 4)).padEnd(13) + String(g.length).padStart(5) +
        mittel(g.map(x => x.autos)).toFixed(2).padStart(11) +
        eins.toFixed(1).padStart(11) + drei.toFixed(1).padStart(13));
}

/* 2. Nach Teamstärke */
console.log('\nNach Teamstärke (Quartil nach mittlerer Zielposition im Jahr):');
console.log('Stärke        Paare    Ø Autos   1 Auto %   3+ Autos %   max');
console.log('─'.repeat(66));
const namen = { 1: 'Q1 stärkste', 2: 'Q2', 3: 'Q3', 4: 'Q4 schwächste' };
for (let q = 1; q <= 4; q++) {
    const g = proRennenTeam.filter(x => rangVon[x.jahr + '|' + x.team] === q);
    if (!g.length) continue;
    const eins = g.filter(x => x.autos === 1).length / g.length * 100;
    const drei = g.filter(x => x.autos >= 3).length / g.length * 100;
    console.log(namen[q].padEnd(14) + String(g.length).padStart(5) +
        mittel(g.map(x => x.autos)).toFixed(2).padStart(11) +
        eins.toFixed(1).padStart(11) + drei.toFixed(1).padStart(13) +
        String(Math.max(...g.map(x => x.autos))).padStart(6));
}

/* 3. Volle Verteilung je Stärkequartil */
console.log('\nVerteilung P(Autos = n | Stärke):');
console.log('Stärke          1      2      3      4      5     6+');
console.log('─'.repeat(56));
for (let q = 1; q <= 4; q++) {
    const g = proRennenTeam.filter(x => rangVon[x.jahr + '|' + x.team] === q);
    if (!g.length) continue;
    let z = namen[q].padEnd(14);
    for (let n = 1; n <= 6; n++) {
        const anteil = (n === 6 ? g.filter(x => x.autos >= 6) : g.filter(x => x.autos === n)).length / g.length * 100;
        z += (anteil.toFixed(1) + '%').padStart(7);
    }
    console.log(z);
}

/* 3b. Volle Verteilung je Jahrfuenft - die Kurven fuer die Umsetzung */
console.log('');
console.log('Volle Verteilung je Jahrfünft (Prozent, ohne das schwächste Quartil):');
console.log('Zeitraum        1      2      3      4      5     6+     Ø');
console.log('─'.repeat(62));
for (let a = Math.floor(VON / 5) * 5; a <= BIS; a += 5) {
    const g = proRennenTeam.filter(x => x.jahr >= a && x.jahr < a + 5
        && rangVon[x.jahr + '|' + x.team] !== 4);
    if (g.length < 20) continue;
    let z = (a + '–' + (a + 4)).padEnd(12);
    for (let n = 1; n <= 6; n++) {
        const anteil = (n === 6 ? g.filter(x => x.autos >= 6) : g.filter(x => x.autos === n)).length / g.length * 100;
        z += anteil.toFixed(1).padStart(7);
    }
    z += mittel(g.map(x => x.autos)).toFixed(2).padStart(7);
    console.log(z);
}

/* 4. Streckeneffekt: dieselbe Saison, verschiedene Strecken */
console.log('\nStreckeneffekt (Ø Starter je Rennen, Extreme):');
const jeRennen = {};
for (const x of proRennenTeam) {
    jeRennen[x.raceId] = jeRennen[x.raceId] || { starter: 0, circuit: x.circuit, jahr: x.jahr };
    jeRennen[x.raceId].starter += x.autos;
}
const proCircuit = {};
for (const r of Object.values(jeRennen)) {
    (proCircuit[r.circuit] = proCircuit[r.circuit] || []).push(r.starter);
}
const sortiert = Object.entries(proCircuit).filter(([, v]) => v.length >= 3)
    .map(([c, v]) => ({ c, m: mittel(v), n: v.length })).sort((a, b) => b.m - a.m);
sortiert.slice(0, 4).forEach(x => console.log('  ' + x.c.padEnd(22) + x.m.toFixed(1).padStart(5) + '  (' + x.n + ' Rennen)'));
console.log('  ...');
sortiert.slice(-4).forEach(x => console.log('  ' + x.c.padEnd(22) + x.m.toFixed(1).padStart(5) + '  (' + x.n + ' Rennen)'));

console.log('\n▶ Für die Umsetzung: die Zeile "Verteilung P(Autos = n | Stärke)" ist die Kurve,');
console.log('  aus der gewürfelt werden muss - je Stärkequartil eine eigene, nicht ein');
console.log('  Zwei-Werte-Wurf für alle. Der Streckeneffekt kommt separat obendrauf.');
