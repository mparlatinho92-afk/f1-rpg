#!/usr/bin/env node
/**
 * markt-ab.js — verhält sich der Fahrermarkt noch realistisch? (27.09.2026)
 *
 * Simuliert fortgesetzte Saisons (Saisonwechsel wie im Spiel) und zählt je Saison:
 *   - Wechsel nach Art (GAME_STATE.seasonTransfers[].type)
 *   - Anteil der Stammfahrer (≥ halbe Saison), die zur neuen Saison das Team wechseln
 *   - Rücktritte, Ø Karrieredauer der Zurückgetretenen
 *   - Sortierung: Korrelation Fahrer-Tempo ↔ Auto-Stärke (landen die Guten in guten Autos?)
 * Vergleich: F1DB-Teamwechselquote je Dekade (realer Anteil der Stammfahrer, deren
 * Hauptteam sich zum Vorjahr ändert).
 *
 * Aufruf:  node tests/markt-ab.js [startjahr] [saisons] [laeufe]
 *          ohne SIMCORE_FROM_INDEX = letzter Monolith (vorher), mit = index.html (nachher)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');
const START = Number(process.argv[2] || 1975), SAISONS = Number(process.argv[3] || 12), LAEUFE = Number(process.argv[4] || 3);

// ── Realer Vergleich: Teamwechselquote je Dekade ──
const L = f => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'f1db-json-splitted', f), 'utf8'));
const rr = L('f1db-races-race-results.json'), races = L('f1db-races.json');
const indy = new Set(races.filter(r => r.circuitId === 'indianapolis' && r.year <= 1960).map(r => r.id));
const rennenJeJahr = {}; for (const r of races) if (!indy.has(r.id)) rennenJeJahr[r.year] = (rennenJeJahr[r.year] || 0) + 1;
const haupt = {};   // jahr|fahrer → { team: starts }
for (const x of rr) { if (indy.has(x.raceId) || /^(DNQ|DNPQ|EX|WD)$/.test(x.positionText)) continue;
    const k = x.year + '|' + x.driverId; (haupt[k] = haupt[k] || {})[x.constructorId] = (haupt[k][x.constructorId] || 0) + 1; }
const hauptteam = k => { const h = haupt[k]; if (!h) return null; const [t, n] = Object.entries(h).sort((a, b) => b[1] - a[1])[0]; return { t, n }; };
const realQuote = {};
for (const k of Object.keys(haupt)) { const [y, d] = k.split('|'); const a = hauptteam(k), b = hauptteam((+y + 1) + '|' + d);
    if (!a || !b || a.n < rennenJeJahr[y] / 2) continue; const dk = Math.floor(y / 10) * 10;
    const q = realQuote[dk] = realQuote[dk] || [0, 0]; q[0]++; if (a.t !== b.t) q[1]++; }

// ── Spiel ──
const ctx = getContext();
const pear = (a, b) => { const ma = a.reduce((x, y) => x + y) / a.length, mb = b.reduce((x, y) => x + y) / b.length; let c = 0, va = 0, vb = 0; for (let i = 0; i < a.length; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return c / Math.sqrt(va * vb); };
const typen = {}; let saisonen = 0, stamm = 0, wechsel = 0, ruecktritte = 0; const karriere = [], sortierung = [];
for (let l = 0; l < LAEUFE; l++) {
    ctx.initFromYear(START);
    for (let s = 0; s < SAISONS; s++) {
        const gs = ctx.GAME_STATE;
        ctx.simulateSeasonRaces();
        const n = (gs.results || []).length;
        const starts = {}; for (const r of gs.results) for (const e of r.results) starts[e.driver] = (starts[e.driver] || 0) + 1;
        const teamVorher = new Map(gs.drivers.filter(d => d.team && starts[d.id] >= n / 2).map(d => [d.histId || d.name, d.team]));
        // Sortierung: Tempo ↔ carSpeed der Stammfahrer
        const st = gs.drivers.filter(d => d.team && starts[d.id] >= n / 2);
        const tempo = st.map(d => d.currentPace || d.pace || 70), auto = st.map(d => ((gs.teams.find(t => t.id === d.team) || {}).carSpeed) || 60);
        if (st.length > 5) sortierung.push(pear(tempo, auto));
        const vorRuecktritt = new Set(gs.drivers.filter(d => d.status === 'retired').map(d => d.id));
        if (ctx.checkCareerEnds) ctx.checkCareerEnds();
        if (ctx.initReservePool) ctx.initReservePool(gs.currentYear + 1);
        if (ctx._injectNewSeasonDrivers) ctx._injectNewSeasonDrivers(gs.currentYear + 1);
        if (ctx.processTeamChanges) ctx.processTeamChanges();
        for (const t of gs.seasonTransfers || []) typen[t.type] = (typen[t.type] || 0) + 1;
        for (const d of gs.drivers) if (d.status === 'retired' && !vorRuecktritt.has(d.id)) { ruecktritte++; if (d.firstYear || d.debutYear) karriere.push(gs.currentYear - (d.firstYear || d.debutYear)); }
        ctx.startNewSeason();
        for (const [key, alt] of teamVorher) { const d = ctx.GAME_STATE.drivers.find(x => (x.histId || x.name) === key && (!x.status || x.status === 'active'));
            if (!d) continue; stamm++; if (d.team !== alt) wechsel++; }
        saisonen++;
    }
}
const m = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
console.log('MARKT ' + START + '+' + SAISONS + ' × ' + LAEUFE + ' Läufe · Quelle: ' + (process.env.SIMCORE_FROM_INDEX ? 'index.html' : 'Monolith'));
console.log('  Teamwechsel Stammfahrer: ' + (wechsel / stamm * 100).toFixed(1) + ' % je Saison (n ' + stamm + ')');
const dk = Math.floor(START / 10) * 10;
console.log('  real (F1DB) ' + [dk, dk + 10].map(d => d + 'er ' + (realQuote[d] ? (realQuote[d][1] / realQuote[d][0] * 100).toFixed(1) + ' %' : '–')).join(' · '));
console.log('  Rücktritte je Saison: ' + (ruecktritte / saisonen).toFixed(1) + ' · Ø Karriere bis Rücktritt ' + m(karriere).toFixed(1) + ' Jahre');
console.log('  Sortierung r(Tempo, Auto): ' + m(sortierung).toFixed(3));
console.log('  Wechsel je Saison nach Art: ' + Object.entries(typen).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + (v / saisonen).toFixed(1)).join(' · '));
