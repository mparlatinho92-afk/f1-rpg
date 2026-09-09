/**
 * ticker-paritaet.js — beweist die Pfad-Parität direkt statt statistisch.
 *
 *   node tests/ticker-paritaet.js [jahr] [rennen] [laeufe]
 *   node tests/ticker-paritaet.js 1950 0 40
 *   node tests/ticker-paritaet.js --alle 25        quer durch alle Ären
 *
 * Der Monte-Carlo-Vergleich (ticker-vs-sim.js) kann nur VERTEILUNGEN gegenüber-
 * stellen, weil beide Pfade unabhängig würfeln. Hier wird schärfer geprüft:
 * Seit dem Umbau holt der Ticker sein Ergebnis von simulateRace und animiert nur
 * noch dorthin. Also MUSS seine Endreihenfolge Fahrer für Fahrer identisch sein
 * mit dem geplanten Ergebnis - nicht ähnlich, sondern gleich.
 *
 * Geprüft wird je Rennen:
 *   1. Reihenfolge der gewerteten Fahrer   (Position für Position)
 *   2. Menge der Ausfälle                  (wer, nicht nur wie viele)
 *   3. Sieger
 * Eine einzige Abweichung ist ein Fehler - hier gibt es keine Toleranz.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');

const args = process.argv.slice(2);
const ALLE = args.includes('--alle');
const rest = args.filter(a => !a.startsWith('--'));
const JAHR = ALLE ? null : (parseInt(rest[0]) || 1950);
const RENNEN = ALLE ? 0 : (parseInt(rest[1]) || 0);
const N = parseInt(ALLE ? rest[0] : rest[2]) || 40;

const JAHRE = [1950, 1958, 1965, 1972, 1979, 1986, 1993, 2001, 2010, 2021];
const ctx = getContext();

function einLauf(jahr, rennen) {
    ctx.initFromYear(jahr);
    const anzahl = ctx.GAME_STATE.races.length;
    const idx = Math.min(rennen, anzahl - 1);

    ctx.window.startLiveRace(idx, false);
    const L = ctx.window.__liveState;
    const geplant = L().plannedResult;
    if (!geplant || !geplant.results) return { fehler: 'kein plannedResult - Umbau nicht aktiv?' };

    ctx.window.startRaceSimulation();
    let schutz = 0;
    while (!L().finished && schutz++ < 800) ctx.simulateLap();
    const st = L();

    // Was der Ticker am Ende zeigt
    const tickerGewertet = st.positions.filter(p => !p.dnf).map(p => p.driver);
    const tickerRaus = new Set(st.positions.filter(p => p.dnf).map(p => p.driver));

    // Was simulateRace beschlossen hatte
    const planGewertet = geplant.results.filter(r => !r.dnf)
        .sort((a, b) => a.position - b.position).map(r => r.driver);
    const planRaus = new Set(geplant.results.filter(r => r.dnf).map(r => r.driver));

    const abw = [];
    if (tickerGewertet.length !== planGewertet.length) {
        abw.push('Anzahl gewerteter Fahrer: Ticker ' + tickerGewertet.length + ', Plan ' + planGewertet.length);
    }
    const n = Math.min(tickerGewertet.length, planGewertet.length);
    for (let i = 0; i < n; i++) {
        if (tickerGewertet[i] !== planGewertet[i]) {
            abw.push('P' + (i + 1) + ': Ticker ' + tickerGewertet[i] + ', Plan ' + planGewertet[i]);
            if (abw.length > 4) break;
        }
    }
    for (const d of planRaus) if (!tickerRaus.has(d)) abw.push('faellt im Plan aus, im Ticker nicht: ' + d);
    for (const d of tickerRaus) if (!planRaus.has(d)) abw.push('faellt im Ticker aus, im Plan nicht: ' + d);

    return {
        abw: abw.slice(0, 6),
        gewertet: planGewertet.length,
        ausfaelle: planRaus.size,
        sieger: planGewertet[0] || null,
        tickerSieger: tickerGewertet[0] || null
    };
}

console.log('═══ Pfad-Parität: zeigt der Ticker exakt das geplante Ergebnis? ═══\n');
let gut = 0, schlecht = 0, kaputt = 0;
const beispiele = [];

const laeufe = [];
if (ALLE) { for (let i = 0; i < N; i++) laeufe.push([JAHRE[i % JAHRE.length], i % 4]); }
else { for (let i = 0; i < N; i++) laeufe.push([JAHR, RENNEN]); }

process.stdout.write('Laeuft');
for (const [jahr, rennen] of laeufe) {
    let r;
    try { r = einLauf(jahr, rennen); }
    catch (e) { kaputt++; if (kaputt === 1) console.log('\nFEHLER: ' + e.message); continue; }
    if (r.fehler) { kaputt++; if (kaputt === 1) console.log('\n' + r.fehler); continue; }
    if (r.abw.length === 0) gut++;
    else {
        schlecht++;
        if (beispiele.length < 3) beispiele.push({ jahr, rennen, abw: r.abw, sieger: r.sieger, tickerSieger: r.tickerSieger });
    }
    process.stdout.write(r.abw.length === 0 ? '.' : 'X');
}
console.log('\n');

console.log('Rennen geprueft   : ' + (gut + schlecht));
console.log('  identisch       : ' + gut);
console.log('  abweichend      : ' + schlecht);
if (kaputt) console.log('  nicht lauffaehig: ' + kaputt);
if (beispiele.length) {
    console.log('\nAbweichungen:');
    beispiele.forEach(b => {
        console.log('  ' + b.jahr + ' Rennen ' + b.rennen + ':');
        b.abw.forEach(a => console.log('     ' + a));
    });
}
console.log('\n' + (schlecht === 0 && kaputt === 0
    ? 'PARITÄT ERFÜLLT - der Ticker zeigt exakt das Ergebnis von simulateRace.'
    : 'PARITÄT VERLETZT - der Ticker weicht vom geplanten Ergebnis ab.'));
process.exit(schlecht === 0 && kaputt === 0 ? 0 : 1);
