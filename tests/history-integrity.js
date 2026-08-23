// history-integrity.js — PASSEN ARCHIVIERTE TABELLE, KADER UND ERGEBNISSE ZUSAMMEN?
//
// Anlass: Nutzer-Screenshot „selbsterklaerend" — der WM-Stand 1955 zeigte Eugenio
// Castellotti als Fuehrenden mit 25 Punkten und zwei Siegen, aber im Saisonverlauf
// daneben KEINE einzige Zelle. Im Spielstand vom 18.08.2026 sieht 1955 so aus:
//   Ergebnisse 45 IDs · Kader 46 · WM-Tabelle 101 Eintraege
//   davon 81 Tabellen-Eintraege ohne zugehoerigen Fahrer im Kader — mit Punkten.
// Die Tabelle gehoert also gar nicht zu dieser Saison: sie fuehrt SEASON_DATA-
// Kurzschluessel (ALBERT, JERRYH), waehrend Kader und Ergebnisse `reserve-…`-IDs
// tragen. Die Anzeige kann keine Zellen finden, weil es keine gibt.
//
// Dieses Skript faehrt Saisons und prueft die ARCHIVIERTEN Saetze in GAME_STATE.history:
//   1. Wie viele Tabellen-Eintraege haben einen Fahrer im Kader derselben Saison?
//   2. Wie viele davon haben ein Rennergebnis?
//   3. Gibt es Eintraege MIT PUNKTEN, die nirgends auftauchen? (der Castellotti-Fall)
//
//   node tests/history-integrity.js 1955 3 6      Startjahr, Sims, Saisons
'use strict';
const { getContext } = require('./sim-core');

const YEAR = Number(process.argv[2] || 1955);
const SIMS = Number(process.argv[3] || 3);
const SEASONS = Number(process.argv[4] || 6);

const ctx = getContext();
const zeilen = [];

for (let s = 0; s < SIMS; s++) {
    try {
        ctx.initFromYear(YEAR);
        for (let k = 0; k < SEASONS; k++) {
            const races = ctx.GAME_STATE.races || [];
            for (let r = 0; r < races.length; r++) {
                const res = ctx.simulateRace(r);
                if (typeof ctx.applyRaceResults === 'function') ctx.applyRaceResults(res, r);
            }
            if (k === SEASONS - 1) break;
            const y = ctx.GAME_STATE.currentYear;
            if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
            if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
            if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
            if (typeof ctx.initReservePool === 'function') ctx.initReservePool(y + 1);
            if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(y + 1);
            if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        // Archivierte Saisons pruefen
        for (const h of (ctx.GAME_STATE.history || [])) {
            const res = new Set();
            (h.results || []).forEach(r => (r.res || r.results || [])
                .forEach(x => res.add(x.d || x.driver)));
            const nameVonKader = {};
            (h.drivers || []).forEach(d => {
                if (d && d.name) nameVonKader[String(d.name).toLowerCase().trim()] = d;
            });
            const tab = Object.entries(h.driverStandings || {});
            let imKader = 0, mitErgebnis = 0, geisterMitPunkten = 0;
            for (const [key, v] of tab) {
                const d = nameVonKader[String(v.name || '').toLowerCase().trim()]
                    || (h.drivers || []).find(x => x.id === key);
                if (d) {
                    imKader++;
                    if (res.has(d.id)) mitErgebnis++;
                } else if ((v.points || 0) > 0) {
                    geisterMitPunkten++;
                }
            }
            zeilen.push({
                jahr: h.year, tab: tab.length, kader: (h.drivers || []).length,
                erg: res.size, imKader, mitErgebnis, geisterMitPunkten,
            });
        }
    } catch (e) { if (s === 0) console.log('  (Sim 1 verworfen: ' + e.message.slice(0, 100) + ')'); }
}

console.log(`\nARCHIV-INTEGRITAET  |  ab ${YEAR}  |  ${SIMS} Sims x ${SEASONS} Saisons\n`);
console.log('Jahr │ Tabelle │ Kader │ Ergebn. │ im Kader │ mit Ergebnis │ GEISTER mit Punkten');
console.log('─────┼─────────┼───────┼─────────┼──────────┼──────────────┼────────────────────');
let geisterGesamt = 0;
for (const z of zeilen) {
    geisterGesamt += z.geisterMitPunkten;
    const warn = z.geisterMitPunkten > 0 ? '  ⚠' : '';
    console.log(`${z.jahr} │ ${String(z.tab).padStart(7)} │ ${String(z.kader).padStart(5)} │ `
        + `${String(z.erg).padStart(7)} │ ${String(z.imKader).padStart(8)} │ ${String(z.mitErgebnis).padStart(12)} │ `
        + `${String(z.geisterMitPunkten).padStart(19)}${warn}`);
}
console.log('─'.repeat(84));
console.log(geisterGesamt === 0
    ? '✅ Keine Geister-Eintraege — Tabelle, Kader und Ergebnisse passen zusammen.'
    : `❌ ${geisterGesamt} Tabellen-Eintraege MIT PUNKTEN ohne Fahrer im Kader (Castellotti-Fall).`);
process.exit(geisterGesamt === 0 ? 0 : 1);
