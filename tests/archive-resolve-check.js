#!/usr/bin/env node
/**
 * ARCHIV-AUFLOESBARKEIT
 *
 * Invariante: wer in einer archivierten Saison in IRGENDEINER Liste steht — Rennergebnis,
 * Qualifying, DNQ, DNS, DNPQ —, muss im Kader dieser Saison auffindbar sein. Sonst zeigt
 * die Oberflaeche die rohe ID ("reserve-ELMERG-1788030777105-707") und die WM-Tabelle
 * bekommt eine Zeile ohne Fahrer.
 *
 * Bis v0.9.17.18 wurden Gastfahrer beim Archivieren NUR aus den Rennergebnissen
 * nachgetragen. Wer sich nicht qualifiziert hat, steht dort nie — im Spielstand des
 * Nutzers waren dadurch 51 von 257 DNQ-Eintraegen nicht aufloesbar.
 *
 *   node tests/archive-resolve-check.js              1955, 3 Saisons
 *   node tests/archive-resolve-check.js 1950 5
 *
 * ⚠ Gegen UNCOMMITTETE index.html-Aenderungen:  SIMCORE_FROM_INDEX=1 node tests/...
 */
const { getContext } = require('./sim-core');

const START   = parseInt(process.argv[2]) || 1955;
const SEASONS = parseInt(process.argv[3]) || 3;
const ctx = getContext();

function pruefe(h) {
    const known = new Set((h.drivers || []).map(d => d.id));
    // Zweite Invariante: wer gefahren ist ODER am Wochenende teilnahm, braucht eine
    // WM-Tabellenzeile. Fehlt sie, verschwindet er aus der Ergebnis-Matrix - die baut
    // ihre Zeilen aus driverStandings. So fehlte Senna 1994 mit 100 Punkten komplett.
    const inTab = new Set(Object.keys(h.driverStandings || {}));
    const out = { kader: (h.drivers || []).length, quali: [0, 0], dnq: [0, 0], dns: [0, 0], dnpq: [0, 0], res: [0, 0], ohneTabelle: new Set() };
    const zaehl = (feld, id) => {
        out[feld][1]++;
        if (!known.has(id)) out[feld][0]++;
        if (id && feld !== 'quali' && !inTab.has(id)) out.ohneTabelle.add(id);
    };
    for (const q of (h.qualifyingResults || [])) {
        for (const r of (q.results || q.res || [])) zaehl('quali', r.driver || r.d);
    }
    for (const r of (h.results || [])) {
        for (const e of (r.results || r.res || [])) zaehl('res', e.driver || e.d);
        for (const id of (r.dnq  || [])) zaehl('dnq', id);
        for (const id of (r.dns  || [])) zaehl('dns', id);
        for (const id of (r.dnpq || [])) zaehl('dnpq', id);
    }
    return out;
}

console.log(`\nARCHIV-AUFLOESBARKEIT  |  ab ${START}  |  ${SEASONS} Saisons\n`);
ctx.initFromYear(START);
let fehlerGesamt = 0;
for (let k = 0; k < SEASONS; k++) {
    const jahr = ctx.GAME_STATE.currentYear;
    const n = (ctx.GAME_STATE.races || []).length;
    for (let i = 0; i < n; i++) {
        if (typeof ctx.applyGuestMoves === 'function') ctx.applyGuestMoves(i);
        ctx.simulateTraining(i);
        const regen = Math.random() < (ctx.SIM_CONFIG?.rainProbability ?? 0.15);
        ctx.simulateQualifying(i, regen);
        ctx.applyRaceResults(ctx.simulateRace(i, regen));
    }
    if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
    if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
    if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
    if (typeof ctx.initReservePool === 'function') ctx.initReservePool(jahr + 1);
    if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(jahr + 1);
    if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();
    ctx.startNewSeason();

    const h = (ctx.GAME_STATE.history || []).find(x => x.year === jahr);
    if (!h) { console.log(`${jahr}: NICHT ARCHIVIERT`); continue; }
    const r = pruefe(h);
    const zeile = ['res', 'quali', 'dnq', 'dns', 'dnpq']
        .map(f => `${f} ${r[f][0]}/${r[f][1]}`).join(' · ');
    const summe = ['res', 'quali', 'dnq', 'dns', 'dnpq'].reduce((a, f) => a + r[f][0], 0) + r.ohneTabelle.size;
    fehlerGesamt += summe;
    const fehltTab = r.ohneTabelle.size ? `  ohne Tabellenzeile ${r.ohneTabelle.size}` : '';
    console.log(`${jahr} │ Kader ${String(r.kader).padStart(3)} │ ${zeile}${fehltTab}${summe ? '   <== ' + summe + ' FEHLER' : ''}`);
}
console.log(`\n${fehlerGesamt === 0 ? 'OK: alles aufloesbar und in der Tabelle.' : 'FEHLER: ' + fehlerGesamt + ' Eintraege ohne Kader-Fahrer oder ohne Tabellenzeile.'}`);
console.log('Format: nicht-aufloesbar / gesamt\n');
process.exit(fehlerGesamt === 0 ? 0 : 1);
