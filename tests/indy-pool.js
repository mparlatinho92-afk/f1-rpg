#!/usr/bin/env node
/**
 * INDY-POOL UEBER EINE FORTGESETZTE PARTIE
 *
 * Frage: traegt der Vorrat an Indy-only-Fahrern eine echte Partie von 1950 bis 1960,
 * oder versiegt er? mc-entries-dnq.js klammert Indianapolis komplett aus und kann das
 * nicht beantworten.
 *
 * Hintergrund: `careerOk` in initReservePool laesst beim Spielstart nur Fahrer zu, die
 * im Startjahr oder spaeter noch in SEASON_DATA stehen. Das Indy 500 verlaesst die WM
 * nach 1960 und verschwindet damit aus SEASON_DATA — fuer einen Start 1960 bleiben
 * null Indy-Fahrer im Pool. Bei Start 1950 greift der Filter grosszuegig (103 von 108),
 * aber ab der zweiten Saison sind neue Fahrer GENERIERT und nie Indy-only. Der Vorrat
 * kann also nur schrumpfen. Genau das misst dieses Skript.
 *
 *   node tests/indy-pool.js                    1950, 3 Sims, 11 Saisons
 *   node tests/indy-pool.js 1950 5 11          explizit
 *
 * ⚠ Gegen UNCOMMITTETE Aenderungen in index.html:
 *   SIMCORE_FROM_INDEX=1 node tests/indy-pool.js
 *   Ohne das laedt sim-core den letzten Monolithen — also den Stand VOR deiner Aenderung.
 */
const { getContext } = require('./sim-core');

const START   = parseInt(process.argv[2]) || 1950;
const SIMS    = parseInt(process.argv[3]) || 3;
const SEASONS = parseInt(process.argv[4]) || 11;

const ctx = getContext();
const istIndy = (d) => !!d && (d.isIndyOnly ||
    (typeof ctx.isIndyOnlyDriver === 'function' && ctx.isIndyOnlyDriver(d.histId || d.id)));
const lebt = (d) => d && d.status !== 'deceased' && d.status !== 'dead';

const acc = {};   // Jahr -> Sammelwerte
function add(jahr, feld, wert) {
    acc[jahr] = acc[jahr] || { n: 0 };
    acc[jahr][feld] = (acc[jahr][feld] || 0) + wert;
}

function messePool(jahr) {
    const kader = (ctx.GAME_STATE.drivers || []).filter(istIndy);
    const pool  = (ctx.GAME_STATE.reservePool || []).filter(istIndy);
    add(jahr, 'kader', kader.length);
    add(jahr, 'poolAktiv', pool.filter(d => lebt(d) && (!d.status || d.status === 'active')).length);
    add(jahr, 'poolRent',  pool.filter(d => lebt(d) && d.status === 'retired').length);
    // ⚠ NICHT den Pool nach Toten durchsuchen: initReservePool raeumt sie zu Beginn
    //   JEDER Saison heraus (v0.9.15.96), die Spalte waere strukturell immer 0.
    //   Gezaehlt wird stattdessen, wer in dieser Saison gestorben ist — inklusive der
    //   Nicht-WM-Tode auf AAA-, Midget- und Sprint-Car-Rennen (NONWM_INDY_VENUES).
    acc[jahr].n++;
}

function zaehleTote(jahr) {
    const tote = (ctx.GAME_STATE.seasonDeaths || []);
    let indy = 0, rest = 0;
    for (const t of tote) {
        const hid = t.histId || t.driver || '';
        if (typeof ctx.isIndyOnlyDriver === 'function' && ctx.isIndyOnlyDriver(hid)) indy++;
        else rest++;
    }
    add(jahr, 'toteIndy', indy);
    add(jahr, 'toteRest', rest);
}

function fahreSaison() {
    const jahr = ctx.GAME_STATE.currentYear;
    const races = ctx.GAME_STATE.races || [];
    messePool(jahr);
    for (let i = 0; i < races.length; i++) {
        if (typeof ctx.applyGuestMoves === 'function') ctx.applyGuestMoves(i);
        ctx.simulateTraining(i);
        const regen = Math.random() < (ctx.SIM_CONFIG?.rainProbability ?? 0.15);
        const q = ctx.simulateQualifying(i, regen);
        const r = ctx.simulateRace(i, regen);
        if (races[i].isIndy) {
            add(jahr, 'melder',  (q && q.results ? q.results.length : 0));
            add(jahr, 'starter', (r.results || []).length);
            add(jahr, 'dnq',     (r.dnq || []).length);
            add(jahr, 'dns',     (r.dns || []).length);
            add(jahr, 'indyRennen', 1);
        }
        ctx.applyRaceResults(r);
    }
    zaehleTote(jahr);
}

console.log(`\n${'═'.repeat(74)}`);
console.log(`  INDY-POOL  |  Start ${START}  |  ${SIMS} Sims × ${SEASONS} Saisons`);
console.log(`${'═'.repeat(74)}\n`);

let ok = 0;
for (let s = 0; s < SIMS; s++) {
    process.stdout.write(`  Sim ${s + 1}/${SIMS} ... `);
    try {
        ctx.initFromYear(START);
        for (let k = 0; k < SEASONS; k++) {
            fahreSaison();
            if (k === SEASONS - 1) break;
            // Saison-Uebergang: exakt die Kette aus mc-entries-dnq.js / monte-carlo-multi.js
            const y = ctx.GAME_STATE.currentYear;
            if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
            if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
            if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
            if (typeof ctx.initReservePool === 'function') ctx.initReservePool(y + 1);
            if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(y + 1);
            if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        ok++;
        console.log('fertig');
    } catch (e) {
        console.log('Abbruch: ' + (e.message || e));
    }
}
if (!ok) { console.log('\nKein Durchlauf erfolgreich.'); process.exit(1); }

const M = (j, f) => acc[j] && acc[j].n ? (acc[j][f] || 0) / acc[j].n : 0;
const R = (j, f) => acc[j] && acc[j].indyRennen ? (acc[j][f] || 0) / acc[j].indyRennen : null;
const p = (v, w) => String(v).padStart(w);

console.log(`\nINDY-FAHRER IM BESTAND  (Mittel aus ${ok} Sims, gemessen am Saisonanfang)`);
console.log('Jahr │ Kader │ Pool aktiv │ Pool Rent │ verfuegbar │ Tote Indy │ Tote uebrige');
console.log('─'.repeat(84));
const jahre = Object.keys(acc).map(Number).sort((a, b) => a - b);
for (const j of jahre) {
    const verf = M(j, 'kader') + M(j, 'poolAktiv') + M(j, 'poolRent');
    console.log(`${j} │ ${p(M(j,'kader').toFixed(1),5)} │ ${p(M(j,'poolAktiv').toFixed(1),10)} │ ${p(M(j,'poolRent').toFixed(1),9)} │ ${p(verf.toFixed(1),10)} │ ${p(M(j,'toteIndy').toFixed(1),9)} │ ${p(M(j,'toteRest').toFixed(1),12)}`);
}

console.log(`\nINDY 500  (Mittel je gefahrenem Indy-Rennen)`);
console.log('Jahr │ Melder │ Starter │ DNQ │ DNS │ Starter+DNS');
console.log('─'.repeat(56));
for (const j of jahre) {
    if (!acc[j].indyRennen) { console.log(`${j} │   — kein Indy im Kalender`); continue; }
    const st = R(j, 'starter'), dns = R(j, 'dns');
    console.log(`${j} │ ${p(R(j,'melder').toFixed(1),6)} │ ${p(st.toFixed(1),7)} │ ${p(R(j,'dnq').toFixed(1),3)} │ ${p(dns.toFixed(1),3)} │ ${p((st+dns).toFixed(1),11)}`);
}

console.log(`\nReal (Wikipedia): 33 Starter, dazu 20 bis 40 Gescheiterte je Jahr.`);
console.log(`F1DB kennt davon nichts — dort steht fuer jedes Jahr 33/33/33, weil die`);
console.log(`WM-Statistik bei Indy nur die Qualifizierten fuehrt.`);
console.log(`Ziel im Spiel: 43-48 Melder, 33 Starter inkl. DNS, Rest DNQ.\n`);
