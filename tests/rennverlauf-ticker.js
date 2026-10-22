#!/usr/bin/env node
/**
 * rennverlauf-ticker.js — derselbe Rennverlauf wie rennverlauf-real.js, aber vom Live-Ticker.
 *
 *   node tests/rennverlauf-ticker.js [rennenJeJahr] [vonJahr] [bisJahr]
 *   node tests/rennverlauf-ticker.js 4            ← 1996–2024, je Jahr 4 Rennen
 *
 * Zeichnet nach jeder Ticker-Runde die Reihenfolge der Fahrer auf, die noch fahren, und rechnet
 * mit verlaufKennzahlen() aus rennverlauf-real.js — gleiche Rechnung, gleiche Tabellen.
 * Der Ticker ist reine Darstellung: am Ergebnis ändert sich nichts, nur am Weg dorthin.
 * ⚠ „ohne Dom" gibt es hier nicht: im Spiel ist das reale Dom-Team nicht zwingend vorn.
 *   Gegen die Real-Zeile „alle" vergleichen.
 * ⚠ Im Ticker fahren alle Ankommer die volle Distanz (keine Überrundung in den Rundendaten).
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');
const { verlaufKennzahlen, tabelle, profilTabelle, AEREN, spearman, avg } = require('./rennverlauf-real');

const [JE = 4, VON = 1996, BIS = 2024] = process.argv.slice(2).map(Number);
const ctx = getContext();

const alle = [];
let kaputt = 0;
process.stdout.write('Läuft ');
for (let jahr = VON; jahr <= BIS; jahr++) {
    ctx.initFromYear(jahr);
    const anzahl = ctx.GAME_STATE.races.length;
    for (let i = 0; i < JE; i++) {
        const idx = Math.floor((i + 0.5) * anzahl / JE);
        try {
            ctx.window.startLiveRace(idx, false);
            const L = ctx.window.__liveState;
            ctx.window.startRaceSimulation();
            const start = new Map(L().positions.map(p => [p.driver, p._startRang]));
            const laps = [];
            let schutz = 0;
            while (!L().finished && schutz++ < 800) {
                ctx.simulateLap();
                laps.push(L().positions.filter(p => !p.dnf).map(p => p.driver));
            }
            const k = verlaufKennzahlen(laps);
            if (k) {
                k.jahr = jahr;
                // Startrunde: Startplatz → Runde 1 unter den Fahrern, die Runde 1 überstehen (wie start-runde1-real.js)
                k.startR1 = spearman(laps[0].map(d => start.get(d)), laps[0].map((_, i) => i));
                k.rausR1 = 1 - laps[0].length / start.size;
                alle.push(k);
            }
        } catch (e) { if (!kaputt++) console.log('\nFEHLER ' + jahr + ' R' + idx + ': ' + e.message); }
    }
    process.stdout.write('.');
}
console.log(`\nRENNVERLAUF Ticker ${VON}–${BIS}: ${alle.length} Rennen` + (kaputt ? ` · ${kaputt} nicht lauffähig` : ''));
const jeAera = l => AEREN.map(([a, b]) => [`${a}–${b} Ticker`, l.filter(k => k.jahr >= a && k.jahr <= b)]);
tabelle('Verlauf je Ära', [...jeAera(alle), [`${VON}–${BIS} Ticker`, alle]]);
profilTabelle('Wann sich etwas tut', [...jeAera(alle), [`${VON}–${BIS} Ticker`, alle]]);
// Real (start-runde1-real.js, BEFUNDE 18.10.2026 (6)): 0,849 / 5,0 % · 0,852 / 4,2 % · 0,862 / 3,0 % · 0,866 / 3,0 % · 0,896 / 2,5 %
console.log('\n  Startrunde            Spearman Start→R1   raus in R1');
for (const [name, l] of [...jeAera(alle), [`${VON}–${BIS} Ticker`, alle]]) if (l.length)
    console.log(`  ${name.padEnd(20)}  ${avg(l.map(k => k.startR1)).toFixed(3).padStart(17)}   ${(100 * avg(l.map(k => k.rausR1))).toFixed(1).padStart(7)} %`);
