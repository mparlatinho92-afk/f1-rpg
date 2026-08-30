#!/usr/bin/env node
/**
 * MELDUNG OHNE WAGEN
 *
 * Invariante: wer sich zu einem Rennen meldet, hat einen Rennstall. Ohne den zeigt die
 * Meldeliste eine leere Team-Spalte und die Karriere-Historie ein "-", weil es schlicht
 * kein Team zu nennen gibt (Nutzer-Screenshots 1953 Silverstone: Burgess, Kling, Berger).
 *
 * URSACHE: keine der zehn Stellen, die `driver.team = null` setzt (Team zurueckgezogen,
 * Gruender gestorben, Landsmann-Regel, Indy-Regel, Entlassung), loescht `scheduledRaces`.
 * Der Fahrer meldete danach weiter — nur ohne Auto. Im Spielstand des Nutzers ueber
 * 49 Saisons: 148 von 2227 DNQ/DNS/DNPQ-Eintraegen, 6,6 %.
 * Seit v0.9.17.23 faellt die Entscheidung in `privateerEntersRace` — dem einzigen
 * Melde-Entscheider, also fuer jeden Pfad und den Live-Ticker zugleich.
 *
 *   node tests/entries-without-car.js              1950, 8 Saisons
 *   node tests/entries-without-car.js 1985 5
 *
 * ⚠ Gegen UNCOMMITTETE index.html-Aenderungen:  SIMCORE_FROM_INDEX=1 node tests/...
 */
const { getContext } = require('./sim-core');

const START   = parseInt(process.argv[2]) || 1950;
const SEASONS = parseInt(process.argv[3]) || 8;
const ctx = getContext();

console.log(`\nMELDUNG OHNE WAGEN  |  ab ${START}  |  ${SEASONS} Saisons\n`);
ctx.initFromYear(START);

let gesEintraege = 0, gesOhne = 0, gesKaderOhne = 0, gesArchiv = 0, gesArchivOhne = 0;
const bsp = [];

// ⚠ MESSFALLE: der archivierte Kader ist der Stand vom SAISONENDE. Wer im Maerz
// meldet und im Juli seinen Sitz verliert, steht dort ohne Rennstall und sieht wie
// ein Phantom aus. Gemessen wird deshalb DIREKT NACH JEDEM RENNEN gegen den
// lebenden GAME_STATE — nur der weiss, wer in diesem Moment einen Wagen hatte.
for (let k = 0; k < SEASONS; k++) {
    const jahr = ctx.GAME_STATE.currentYear;
    const n = (ctx.GAME_STATE.races || []).length;
    let eintraege = 0, ohne = 0, kaderOhne = 0;
    for (let i = 0; i < n; i++) {
        if (typeof ctx.applyGuestMoves === 'function') ctx.applyGuestMoves(i);
        ctx.simulateTraining(i);
        const regen = Math.random() < (ctx.SIM_CONFIG?.rainProbability ?? 0.15);
        ctx.simulateQualifying(i, regen);
        ctx.applyRaceResults(ctx.simulateRace(i, regen));

        const r = (ctx.GAME_STATE.results || []).find(x => x.raceIndex === i);
        if (!r) continue;
        const wagen = new Map();
        for (const d of (ctx.GAME_STATE.drivers || [])) wagen.set(d.id, d.team || null);
        for (const d of (ctx.GAME_STATE.reservePool || [])) if (!wagen.has(d.id)) wagen.set(d.id, d.team || null);
        const nameVon = id => (ctx.GAME_STATE.drivers || []).find(d => d.id === id)?.name || id;
        for (const id of [...(r.dnq || []), ...(r.dns || []), ...(r.dnpq || [])]) {
            eintraege++;
            if (wagen.get(id)) continue;
            ohne++;
            if (bsp.length < 8) bsp.push(`${jahr} ${r.raceName || 'Lauf ' + (i + 1)}: ${nameVon(id)}`);
        }
        for (const e of (r.results || [])) {
            eintraege++;
            const tm = e.team || e.tmn || wagen.get(e.driver || e.d);
            if (tm) continue;
            ohne++;
            if (bsp.length < 8) bsp.push(`${jahr} ${r.raceName || 'Lauf ' + (i + 1)}: ${nameVon(e.driver || e.d)} (gestartet!)`);
        }
    }
    kaderOhne = (ctx.GAME_STATE.drivers || []).filter(d => !d.team && (!d.status || d.status === 'active')).length;

    if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
    if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
    if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
    if (typeof ctx.initReservePool === 'function') ctx.initReservePool(jahr + 1);
    if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(jahr + 1);
    if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();
    ctx.startNewSeason();

    // ZWEITE PRUEFUNG: ist der Rennstall auch NACH dem Archivieren noch da? Bis
    // v0.9.17.23 speicherten dnq/dns/dnpq nur IDs — die Anzeige musste den Kader vom
    // Saisonende befragen und zeigte eine leere Spalte, sobald der Fahrer seinen Sitz
    // spaeter verlor. Seither faehrt `tms` den Namen mit.
    const h = (ctx.GAME_STATE.history || []).find(x => x.year === jahr);
    let aGes = 0, aOhne = 0;
    if (h) {
        const kad = new Map((h.drivers || []).map(d => [d.id, d]));
        for (const r of (h.results || [])) {
            for (const id of [...(r.dnq || []), ...(r.dns || []), ...(r.dnpq || [])]) {
                aGes++;
                if ((r.tms || {})[id]) continue;
                if (kad.get(id)?.team) continue;
                aOhne++;
            }
        }
    }
    gesArchiv += aGes; gesArchivOhne += aOhne;

    gesEintraege += eintraege; gesOhne += ohne; gesKaderOhne += kaderOhne;
    const flag = ohne ? `   <== ${ohne} OHNE WAGEN` : '';
    console.log(`${jahr} │ sitzlos im Kader ${String(kaderOhne).padStart(3)}`
        + ` │ Meldungen ${String(eintraege).padStart(4)}`
        + ` │ im Archiv ohne Team ${String(aOhne).padStart(3)}/${String(aGes).padStart(3)}${flag}`);
}

console.log('');
if (bsp.length) { console.log('Beispiele:'); bsp.forEach(b => console.log('   · ' + b)); console.log(''); }
const q = gesEintraege ? (100 * gesOhne / gesEintraege).toFixed(1) : '0.0';
console.log(gesOhne === 0
    ? `OK: 0 von ${gesEintraege} Meldungen ohne Rennstall. (${gesKaderOhne} sitzlose Kader-Fahrer melden korrekt nicht.)`
    : `FEHLER: ${gesOhne} von ${gesEintraege} Meldungen ohne Rennstall (${q} %).`);
console.log('');
const qa = gesArchiv ? (100 * gesArchivOhne / gesArchiv).toFixed(1) : '0.0';
console.log(gesArchivOhne === 0
    ? `OK: alle ${gesArchiv} archivierten Nichtqualifikations-Eintraege nennen ihren Rennstall.`
    : `FEHLER: ${gesArchivOhne} von ${gesArchiv} archivierten Eintraegen ohne Rennstall (${qa} %).`);
console.log('');
process.exit(gesOhne === 0 && gesArchivOhne === 0 ? 0 : 1);
