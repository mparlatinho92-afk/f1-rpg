#!/usr/bin/env node
/**
 * strafversetzung-real.js — Wie oft startet ein Fahrer real weiter hinten, als sein Quali-Platz hergibt?
 *
 * Hintergrund (BEFUNDE.md 18.10.2026 (7)): Im Spiel steht ein Spitzenfahrer fast nur durch schlechte Form
 * hinten, und die bremst ihn auch im Rennen. Real gibt es Gründe für einen schlechten Startplatz, die das
 * Renntempo nicht berühren. Dieses Werkzeug misst die, je Ära, aus F1DB.
 *
 * Aufruf: node tests/strafversetzung-real.js
 *
 * Arten (je Start, Indy 500 ausgenommen):
 *   strafe   F1DB-Feld gridPenalty gesetzt (erst ab 1996 erfasst; "SFB" = ans Ende gestellt)
 *   box      Start aus der Boxengasse (positionText "PL")
 *   rück≥3   Startplatz ≥ 3 hinter dem Quali-Platz, ohne gridPenalty (vor 1996 die einzige Spur)
 *   ohneQ    Startplatz, aber kein Quali-Platz (Zeit gestrichen, nicht gefahren)
 * ⚠ Rückversetzungen um 1–2 Plätze entstehen auch, wenn ein Fahrer davor Strafe bekommt und man aufrückt,
 *   oder durch Rundungen der Startaufstellung — deshalb erst ab 3.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'f1db-json-splitted');
const lade = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));
const grid = lade('f1db-races-starting-grid-positions.json');
const erg = lade('f1db-races-race-results.json');
const races = lade('f1db-races.json');
const indy = new Set(races.filter(r => r.circuitId === 'indianapolis' && r.year <= 1960).map(r => r.id));
const ziel = new Map(erg.map(e => [e.raceId + '|' + e.driverId, e.positionText]));

const PR = (() => { const c = { window: {} }; vm.createContext(c);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'f1db.js'), 'utf8').replace(/\bconst (\w+)\s*=/g, 'var $1 ='), c);
    return c.PACE_RATINGS || {}; })();
const top3 = {};
for (const y of new Set(grid.map(g => g.year))) {
    const ds = [...new Set(grid.filter(g => g.year === y).map(g => g.driverId))]
        .map(d => [d, PR[d] && PR[d][y] && PR[d][y][0]]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    top3[y] = new Set(ds.map(x => x[0]));
}

const art = g => {
    if (g.gridPenalty) return 'strafe';
    if (g.positionText === 'PL') return 'box';
    if (!g.qualificationPositionNumber) return 'ohneQ';
    if (g.positionNumber && g.positionNumber - g.qualificationPositionNumber >= 3) return 'rück≥3';
    return null;
};
const AEREN = [[1950, 1959], [1960, 1969], [1970, 1979], [1980, 1989], [1990, 1995], [1996, 2002], [2003, 2009],
               [2010, 2013], [2014, 2016], [2017, 2021], [2022, 2024]];
console.log('STARTPLATZ SCHLECHTER ALS DAS QUALI HERGIBT — F1DB, je Start in %\n');
console.log('  Ära        Starts  strafe   box  rück≥3  ohneQ   zusammen   Ø je Fahrer+Saison   Ø Plätze zurück   Top 3: Anteil / Starts / Siege');
for (const [a, b] of AEREN) {
    const l = grid.filter(g => g.year >= a && g.year <= b && !indy.has(g.raceId));
    const z = { strafe: 0, box: 0, 'rück≥3': 0, ohneQ: 0 }, rueck = [], fs_ = new Set();
    let t3n = 0, t3s = 0, t3sieg = 0;
    for (const g of l) {
        fs_.add(g.year + '|' + g.driverId);
        const x = art(g); if (!x) continue;
        z[x]++;
        if (g.positionNumber && g.qualificationPositionNumber) rueck.push(g.positionNumber - g.qualificationPositionNumber);
        if (top3[g.year] && top3[g.year].has(g.driverId)) { t3s++; if (ziel.get(g.raceId + '|' + g.driverId) === '1') t3sieg++; }
    }
    for (const g of l) if (top3[g.year] && top3[g.year].has(g.driverId)) t3n++;
    const sum = Object.values(z).reduce((x, y) => x + y, 0), p = n => (100 * n / l.length).toFixed(1).padStart(5);
    const avg = rueck.length ? rueck.reduce((x, y) => x + y, 0) / rueck.length : NaN;
    console.log(`  ${a}–${b}  ${String(l.length).padStart(6)}  ${p(z.strafe)} ${p(z.box)}  ${p(z['rück≥3'])}  ${p(z.ohneQ)}     ${p(sum)}`
        + `          ${(sum / fs_.size).toFixed(2).padStart(5)}               ${isNaN(avg) ? '   -' : avg.toFixed(1).padStart(4)}`
        + `          ${(100 * t3s / t3n).toFixed(1).padStart(5)} % / ${String(t3s).padStart(3)} / ${t3sieg}`);
}
