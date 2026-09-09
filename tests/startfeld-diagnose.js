/**
 * startfeld-diagnose.js — woher kommt die Lücke im Startfeld?
 *
 *   node tests/startfeld-diagnose.js [jahr-von] [jahr-bis] [sims]
 *   node tests/startfeld-diagnose.js 1950 1959 3
 *
 * Das Spiel fährt mit ~19,8 Startern, real waren es ~22,7 (50er). Diese Diagnose
 * schlüsselt auf, WO die Autos fehlen, statt global zu kalibrieren:
 *
 *   - Kommen zu wenige KONSTRUKTEURE ins Rennen?
 *   - Oder bringen die vorhandenen zu wenige AUTOS mit?
 *   - Und bei welcher Teamgröße klafft es - unten (Kleinstkonstrukteure)
 *     oder oben (Cooper 1961 und ähnliche Großmelder)?
 *
 * Drei Quellen:
 *   1. tools/quellen/renn-meldungen.csv  - die Nutzer-Tabelle, Zielwert je Rennen
 *      ⚠ enthält 76 Summenzeilen mit "0,00" in der Circuit-Spalte - herausfiltern
 *   2. f1db-races-race-results.json      - reale Autos je Konstrukteur
 *   3. das Spiel über sim-core
 *
 * Streckenfixpunkte wie Indy (33 Starter) fallen dabei auf, weil sie in der
 * Liste als harte Zahl stehen.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const fs = require('fs');
const path = require('path');

const VON = parseInt(process.argv[2]) || 1950;
const BIS = parseInt(process.argv[3]) || 1959;
const SIMS = parseInt(process.argv[4]) || 3;

const ROOT = path.join(__dirname, '..');
const F1DB = path.join(ROOT, 'f1db-json-splitted');
const lade = f => JSON.parse(fs.readFileSync(path.join(F1DB, f), 'utf8'));

/* ═══ 1. Nutzer-Liste ═══ */
function ladeListe() {
    const roh = fs.readFileSync(path.join(ROOT, 'tools', 'quellen', 'renn-meldungen.csv'), 'utf8');
    const zeilen = roh.split(/\r?\n/).slice(1).filter(Boolean);
    const rennen = [], jahresSchnitt = [];
    for (const z of zeilen) {
        // ⚠ Die Datei enthaelt ZWEI Satzarten:
        //   Renn-Zeilen:   1950,1,great-britain,silverstone,21,0,21,21,0
        //   Summen-Zeilen: 1950,7,"21,86","0,00","21,86","21,71","0,14"   (Jahresschnitt)
        // Die Summenzeilen tragen Dezimalkommas IN Anfuehrungszeichen - ein naives
        // split(',') zerreisst sie und erfindet Strecken wie '86"' mit 86 Startern.
        if (z.includes('"')) {
            const zahlen = [...z.matchAll(/"([\d]+),([\d]+)"/g)].map(m => parseFloat(m[1] + '.' + m[2]));
            const f = z.split(',');
            const jahr = parseInt(f[0]);
            // Reihenfolge: Gemeldet, PreQuali, Quali, Starter, Differenz
            if (jahr && zahlen.length >= 4) jahresSchnitt.push({ jahr, gemeldet: zahlen[0], starter: zahlen[3] });
            continue;
        }
        const f = z.split(',');
        const jahr = parseInt(f[0]), runde = parseInt(f[1]);
        const circuit = (f[3] || '').trim();
        if (!jahr || !runde || !circuit || /^[\d.,]*$/.test(circuit)) continue;
        const gemeldet = parseInt(f[4]), starter = parseInt(f[7]);
        if (!Number.isFinite(starter) || starter <= 0) continue;
        rennen.push({ jahr, runde, circuit, gemeldet, starter });
    }
    return { rennen, jahresSchnitt };
}

/* ═══ 2. Reale Autos je Konstrukteur ═══ */
const races = lade('f1db-races.json');
const ergs = lade('f1db-races-race-results.json');
const grids = lade('f1db-races-starting-grid-positions.json');

const gridNach = new Map();
for (const x of grids) {
    if (!x.positionNumber) continue;
    if (!gridNach.has(x.raceId)) gridNach.set(x.raceId, []);
    gridNach.get(x.raceId).push(x);
}

/* ═══ 3. Spiel ═══ */
const { getContext } = require('./sim-core');
const ctx = getContext();

function spielJahr(jahr) {
    ctx.initFromYear(jahr);
    const proRennen = [];
    const anzahl = Math.min(ctx.GAME_STATE.races.length, 12);
    for (let i = 0; i < anzahl; i++) {
        try {
            if (ctx.applyGuestMoves) ctx.applyGuestMoves(i);
            if (ctx.simulateTraining) ctx.simulateTraining(i);
            ctx.simulateQualifying(i, false);
            const r = ctx.simulateRace(i, false);
            if (!r || !r.results) continue;
            const jeTeam = {};
            for (const x of r.results) {
                const t = x.teamName || x.team || '?';
                jeTeam[t] = (jeTeam[t] || 0) + 1;
            }
            proRennen.push({ starter: r.results.length, teams: Object.keys(jeTeam).length, jeTeam });
            ctx.applyRaceResults(r);
        } catch (_) { }
    }
    return proRennen;
}

/* ═══ Auswertung ═══ */
const _l = ladeListe();
const liste = _l.rennen.filter(x => x.jahr >= VON && x.jahr <= BIS);
const listeJahr = _l.jahresSchnitt.filter(x => x.jahr >= VON && x.jahr <= BIS);
const mittel = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;

// real je Rennen: Starter, Konstrukteure, Autos je Konstrukteur
const realRennen = [];
for (const r of races) {
    if (r.year < VON || r.year > BIS) continue;
    const g = gridNach.get(r.id);
    if (!g || !g.length) continue;
    const jeTeam = {};
    for (const x of g) jeTeam[x.constructorId] = (jeTeam[x.constructorId] || 0) + 1;
    realRennen.push({
        jahr: r.year, runde: r.round, circuit: r.circuitId,
        starter: g.length, teams: Object.keys(jeTeam).length, jeTeam
    });
}

// Spiel
const spielRennen = [];
for (let s = 0; s < SIMS; s++) {
    for (let j = VON; j <= BIS; j++) spielRennen.push(...spielJahr(j));
}

console.log('\n═══ Startfeld-Diagnose ' + VON + '–' + BIS + ' ═══\n');
console.log('Quelle                       Starter   Konstrukteure   Autos je Konstrukteur');
console.log('─'.repeat(76));
const zeile = (name, starter, teams) =>
    console.log(name.padEnd(28) + starter.toFixed(1).padStart(8) +
        teams.toFixed(1).padStart(16) + (teams ? (starter / teams) : 0).toFixed(2).padStart(24));

zeile('Nutzer-Liste je Rennen', mittel(liste.map(x => x.starter)), 0);
zeile('Nutzer-Liste Jahresschnitt', mittel(listeJahr.map(x => x.starter)), 0);
zeile('F1DB (Startaufstellung)', mittel(realRennen.map(x => x.starter)), mittel(realRennen.map(x => x.teams)));
zeile('Spiel', mittel(spielRennen.map(x => x.starter)), mittel(spielRennen.map(x => x.teams)));
console.log('─'.repeat(76));
console.log('Rennen: Liste ' + liste.length + ' Renn-Zeilen, ' + listeJahr.length + ' Jahreszeilen'
    + '  ·  F1DB ' + realRennen.length + '  ·  Spiel ' + spielRennen.length);
    + ''; 
/* Verteilung der Teamgrößen - hier zeigt sich die Spannweite */
function teamGroessen(rennen) {
    const v = {};
    for (const r of rennen) for (const n of Object.values(r.jeTeam)) v[Math.min(n, 6)] = (v[Math.min(n, 6)] || 0) + 1;
    const ges = Object.values(v).reduce((a, b) => a + b, 0) || 1;
    return { v, ges };
}
const tReal = teamGroessen(realRennen), tSpiel = teamGroessen(spielRennen);

console.log('\nWie viele AUTOS bringt ein Konstrukteur je Rennen mit?');
console.log('Autos      real %    Spiel %    Δ');
console.log('─'.repeat(44));
for (let n = 1; n <= 6; n++) {
    const a = (tReal.v[n] || 0) / tReal.ges * 100;
    const b = (tSpiel.v[n] || 0) / tSpiel.ges * 100;
    const lbl = n === 6 ? '6+' : String(n);
    console.log(lbl.padEnd(11) + a.toFixed(1).padStart(6) + b.toFixed(1).padStart(11) +
        ((b - a) >= 0 ? '  +' : '  ') + (b - a).toFixed(1));
}
console.log('─'.repeat(44));

/* Größte Melder real - trifft das Spiel die Spitze? */
const groessteReal = {}, groessteSpiel = {};
for (const r of realRennen) for (const [t, n] of Object.entries(r.jeTeam)) groessteReal[t] = Math.max(groessteReal[t] || 0, n);
for (const r of spielRennen) for (const [t, n] of Object.entries(r.jeTeam)) groessteSpiel[t] = Math.max(groessteSpiel[t] || 0, n);
const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ' ' + v);
console.log('\nGrößte Melder (max. Autos in einem Rennen):');
console.log('  real : ' + top(groessteReal).join(' · '));
console.log('  Spiel: ' + top(groessteSpiel).join(' · '));

/* Streckenfixpunkte aus der Liste */
console.log('\nStreckenfixpunkte laut Nutzer-Liste (Ausreißer nach oben und unten):');
const sortiert = liste.slice().sort((a, b) => b.starter - a.starter);
sortiert.slice(0, 3).forEach(x => console.log('  ' + x.jahr + ' ' + x.circuit.padEnd(18) + x.starter + ' Starter'));
console.log('  ...');
sortiert.slice(-3).forEach(x => console.log('  ' + x.jahr + ' ' + x.circuit.padEnd(18) + x.starter + ' Starter'));

const dStarter = mittel(spielRennen.map(x => x.starter)) - mittel(realRennen.map(x => x.starter));
const dTeams = mittel(spielRennen.map(x => x.teams)) - mittel(realRennen.map(x => x.teams));
console.log('\n▶ BEFUND');
console.log('  Starter       Δ ' + (dStarter >= 0 ? '+' : '') + dStarter.toFixed(1));
console.log('  Konstrukteure Δ ' + (dTeams >= 0 ? '+' : '') + dTeams.toFixed(1));
const proK_real = mittel(realRennen.map(x => x.starter)) / mittel(realRennen.map(x => x.teams));
const proK_spiel = mittel(spielRennen.map(x => x.starter)) / mittel(spielRennen.map(x => x.teams));
console.log('  Autos je Konstrukteur Δ ' + ((proK_spiel - proK_real) >= 0 ? '+' : '') + (proK_spiel - proK_real).toFixed(2));
console.log('');
if (Math.abs(dTeams) > 1.5 && Math.abs(proK_spiel - proK_real) < 0.2) {
    console.log('  → Es fehlen ganze KONSTRUKTEURE, nicht Autos je Team.');
} else if (Math.abs(dTeams) < 1.5 && Math.abs(proK_spiel - proK_real) > 0.15) {
    console.log('  → Die Konstrukteure sind da, bringen aber zu wenige AUTOS mit.');
} else {
    console.log('  → Beides trägt bei; die Tabelle oben zeigt, bei welcher Teamgröße.');
}
