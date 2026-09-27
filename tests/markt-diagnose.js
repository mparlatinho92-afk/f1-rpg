#!/usr/bin/env node
/**
 * markt-diagnose.js — WARUM bleiben oder gehen Fahrer? (28.09.2026)
 *
 * Ergänzt markt-abgang.js (das zählt nur, WER geht) um die Mechanik dahinter:
 *   - schwaches Drittel (mittlerer Startplatz): wie viele Stammfahrer haben einen auslaufenden
 *     Vertrag, mit welchem Bewertungsband (teamEntscheidungsWert), wie viele davon geschützt
 *     (≤ 3 Karrierejahre oder Rohdiamant)
 *   - Wechsel je Saison nach Art (seasonTransfers type + typeText)
 *   - Nicht-Verlängerungen aus dem Marktvergleich je Auto-Drittel und ihr Median-Alter
 * Fand 28.09.2026: 63 von 94 auslaufenden Verträgen im schwachen Drittel waren nur wegen
 * „jung" geschützt; der Marktvergleich mit Potenzial holte 3,8 Pool-Rookies je Saison.
 *
 * Aufruf: node tests/markt-diagnose.js [startjahr] [saisons] [laeufe]   (misst index.html)
 *         node tests/markt-diagnose.js 2005 8 3
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = process.env.SIMCORE_FROM_INDEX || '1';
const { getContext } = require('./sim-core');
const START = Number(process.argv[2] || 2005), S = Number(process.argv[3] || 8), N = Number(process.argv[4] || 3);
const c = getContext();

const z = { stamm: 0, auslauf: 0, band: {}, typen: {}, marktDrittel: [0, 0, 0], marktAlter: [] };
for (let l = 0; l < N; l++) {
    c.initFromYear(START);
    for (let s = 0; s < S; s++) {
        const gs = c.GAME_STATE;
        c.simulateSeasonRaces();
        const n = gs.results.length, starts = {}, gridSum = {}, gridN = {};
        for (const r of gs.results) for (const e of r.results) {
            starts[e.driver] = (starts[e.driver] || 0) + 1;
            if (e.qualiPos > 0) { gridSum[e.team] = (gridSum[e.team] || 0) + e.qualiPos; gridN[e.team] = (gridN[e.team] || 0) + 1; }
        }
        const tl = Object.keys(gridSum).filter(t => gridN[t] >= 8).sort((a, b) => gridSum[a] / gridN[a] - gridSum[b] / gridN[b]);
        const schwach = new Set(tl.slice(tl.length - Math.round(tl.length / 3)));
        for (const d of gs.drivers.filter(d => d.team && schwach.has(d.team) && starts[d.id] >= n / 2 && (!d.status || d.status === 'active'))) {
            z.stamm++;
            if (!(d.contractEnd && d.contractEnd <= gs.currentYear)) continue;
            z.auslauf++;
            const ev = c.evaluateDriverPerformance(d.id); if (!ev) continue;
            const b = c.bewertungsBand(c.teamEntscheidungsWert(d, ev.score)) + (ev.schutz ? ' (geschützt)' : '');
            z.band[b] = (z.band[b] || 0) + 1;
        }
        // Auto-Drittel nach carSpeed für die Nicht-Verlängerungen
        const autoRang = gs.teams.filter(t => t.carSpeed > 0).sort((a, b) => b.carSpeed - a.carSpeed);
        c.processSeasonEndEvents();
        for (const t of gs.seasonTransfers || []) {
            const k = t.type + (t.typeText ? ': ' + t.typeText : '');
            z.typen[k] = (z.typen[k] || 0) + 1;
            if (t.type === 'released' && /Markt|langsam/.test(t.typeText || '')) {
                const d = gs.drivers.find(x => x.name === t.driverName), tm = autoRang.find(x => x.name === t.fromTeam);
                if (tm) z.marktDrittel[Math.floor(3 * autoRang.indexOf(tm) / autoRang.length)]++;
                if (d && d.birthYear) z.marktAlter.push(gs.currentYear - d.birthYear);
            }
        }
        c.startNewSeason();
    }
}
console.log('DIAGNOSE ' + START + '+' + S + ' × ' + N);
console.log('Schwaches Drittel: Stammfahrer-Saisons ' + z.stamm + ' · Vertrag läuft aus ' + z.auslauf + ' (' + (z.auslauf / z.stamm * 100).toFixed(0) + ' %)');
console.log('  Band bei Auslauf: ' + Object.entries(z.band).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
const ma = z.marktAlter.sort((a, b) => a - b);
console.log('Marktvergleich: Nicht-Verlängerungen je Auto-Drittel stark/mittel/schwach ' + z.marktDrittel.join('/') + (ma.length ? ' · Median-Alter ' + ma[Math.floor(ma.length / 2)] : ''));
console.log('Wechsel je Saison nach Art:');
for (const [k, v] of Object.entries(z.typen).sort((a, b) => b[1] - a[1])) console.log('  ' + (v / (S * N)).toFixed(2).padStart(6) + '  ' + k);
