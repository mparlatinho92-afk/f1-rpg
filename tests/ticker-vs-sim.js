/**
 * ticker-vs-sim.js — Monte-Carlo-Vergleich der beiden Renn-Pfade.
 *
 *   node tests/ticker-vs-sim.js [jahr] [rennen] [laeufe]
 *   node tests/ticker-vs-sim.js 1950 0 500        Silverstone 1950, 500 Laeufe je Pfad
 *
 * Prueft die VERBINDLICHE Regel aus CLAUDE.md: klassische Simulation und
 * Live-Ticker muessen fuer dasselbe Rennen identische Ergebnisse liefern.
 * Der Ticker ist nur das "Wie" — die Zahlen entstehen in EINER Engine.
 *
 * Gemessen wird nicht ein einzelnes Rennen (beide wuerfeln), sondern die
 * VERTEILUNG ueber viele Laeufe: Siegquote je Fahrer, Podestquote, DNF-Rate,
 * mittlere Zielposition. Laufen die Pfade auseinander, zeigt sich das dort.
 *
 * Beide Pfade bekommen denselben Startzustand (initFromYear), damit der
 * Vergleich nicht an unterschiedlichen Kadern haengt.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');

const JAHR   = parseInt(process.argv[2]) || 1950;
const RENNEN = parseInt(process.argv[3]) || 0;
const N      = parseInt(process.argv[4]) || 200;

const ctx = getContext();

/* ---------- Pfad 1: klassische Simulation ---------- */
function laufSofort() {
    ctx.initFromYear(JAHR);
    if (ctx.applyGuestMoves) ctx.applyGuestMoves(RENNEN);
    if (ctx.simulateTraining) ctx.simulateTraining(RENNEN);
    ctx.simulateQualifying(RENNEN, false);
    const r = ctx.simulateRace(RENNEN, false);
    return r;
}

/* ---------- Pfad 2: Live-Ticker ---------- */
function laufTicker() {
    ctx.initFromYear(JAHR);
    ctx.window.startLiveRace(RENNEN, false);
    ctx.window.startRaceSimulation();
    const L = ctx.window.__liveState;
    let schutz = 0;
    while (!L().finished && schutz++ < 800) ctx.simulateLap();

    // Das Ergebnis wird aus liveRaceState.positions gelesen, NICHT aus dem
    // raceResult von finishLiveRace: dessen applyRaceResults-Aufruf liegt im
    // eigenen Scope und ist von aussen nicht abfangbar. positions ist am
    // Rennende bereits sortiert (Gefahrene nach totalTime, danach die Ausfaelle)
    // und traegt alles, was hier gemessen wird.
    const st = L();
    const gefahren = st.positions.filter(p => !p.dnf);
    const raus = st.positions.filter(p => p.dnf);
    const results = [];
    gefahren.forEach((p, i) => results.push({
        driver: p.driver, name: p.name, team: p.team,
        position: i + 1, dnf: false, points: 0
    }));
    raus.forEach(p => results.push({
        driver: p.driver, name: p.name, team: p.team,
        position: 99, dnf: true, points: 0
    }));
    return { results };
}

/* ---------- Auswertung ---------- */
function leer() { return { siege: {}, podeste: {}, punkte: {}, dnf: 0, starter: 0, laeufe: 0, posSumme: {}, posAnzahl: {} }; }

function zaehle(bag, rr) {
    if (!rr || !rr.results) return false;
    bag.laeufe++;
    const sortiert = rr.results.slice().sort((a, b) => (a.position || 99) - (b.position || 99));
    sortiert.forEach(r => {
        const name = r.name || r.driverName || r.driver;
        bag.starter++;
        if (r.dnf) { bag.dnf++; return; }
        if (r.position === 1) bag.siege[name] = (bag.siege[name] || 0) + 1;
        if (r.position <= 3) bag.podeste[name] = (bag.podeste[name] || 0) + 1;
        if (r.points) bag.punkte[name] = (bag.punkte[name] || 0) + r.points;
        if (r.position > 0 && r.position < 90) {
            bag.posSumme[name] = (bag.posSumme[name] || 0) + r.position;
            bag.posAnzahl[name] = (bag.posAnzahl[name] || 0) + 1;
        }
    });
    return true;
}

const a = leer(), b = leer();
let fehlerA = 0, fehlerB = 0;
process.stdout.write('Laeuft');
for (let i = 0; i < N; i++) {
    try { if (!zaehle(a, laufSofort())) fehlerA++; } catch (e) { fehlerA++; if (fehlerA === 1) console.log('\n[sofort] ' + e.message); }
    try { if (!zaehle(b, laufTicker())) fehlerB++; } catch (e) { fehlerB++; if (fehlerB === 1) console.log('\n[ticker] ' + e.message); }
    if (i % Math.max(1, Math.floor(N / 20)) === 0) process.stdout.write('.');
}
console.log('\n');

const race = ctx.GAME_STATE.races[RENNEN];
console.log('═══ Live-Ticker gegen Sofort-Simulation ═══');
console.log('Rennen : ' + (race ? race.name : '?') + ' ' + JAHR + ' (Index ' + RENNEN + ')');
console.log('Laeufe : ' + a.laeufe + ' sofort / ' + b.laeufe + ' ticker' +
            (fehlerA + fehlerB ? '   (Fehler: ' + fehlerA + '/' + fehlerB + ')' : ''));
console.log('');

const q = (bag, name) => bag.laeufe ? (bag.siege[name] || 0) / bag.laeufe * 100 : 0;
const qp = (bag, name) => bag.laeufe ? (bag.podeste[name] || 0) / bag.laeufe * 100 : 0;
const mp = (bag, name) => bag.posAnzahl[name] ? bag.posSumme[name] / bag.posAnzahl[name] : null;

const alle = [...new Set([...Object.keys(a.siege), ...Object.keys(b.siege),
                          ...Object.keys(a.podeste), ...Object.keys(b.podeste)])];
alle.sort((x, y) => (q(a, y) + qp(a, y) * 0.3) - (q(a, x) + qp(a, x) * 0.3));

console.log('Fahrer                      Siege %        Podest %       Ø Position');
console.log('                          sofort ticker  sofort ticker  sofort ticker   Δ');
console.log('─'.repeat(78));
let maxAbwSieg = 0, summeAbwSieg = 0, gezaehlt = 0;
alle.slice(0, 14).forEach(n => {
    const s1 = q(a, n), s2 = q(b, n), p1 = qp(a, n), p2 = qp(b, n);
    const m1 = mp(a, n), m2 = mp(b, n);
    const d = (m1 !== null && m2 !== null) ? (m2 - m1) : null;
    maxAbwSieg = Math.max(maxAbwSieg, Math.abs(s1 - s2));
    summeAbwSieg += Math.abs(s1 - s2); gezaehlt++;
    console.log(n.padEnd(24).slice(0, 24) +
        String(s1.toFixed(1)).padStart(7) + String(s2.toFixed(1)).padStart(7) + '  ' +
        String(p1.toFixed(1)).padStart(6) + String(p2.toFixed(1)).padStart(7) + '  ' +
        (m1 === null ? '     -' : m1.toFixed(1).padStart(6)) +
        (m2 === null ? '     -' : m2.toFixed(1).padStart(7)) +
        (d === null ? '' : (d >= 0 ? '  +' : '  ') + d.toFixed(1)));
});
console.log('─'.repeat(78));
const dnfA = a.starter ? a.dnf / a.starter * 100 : 0;
const dnfB = b.starter ? b.dnf / b.starter * 100 : 0;
console.log('DNF-Rate                  ' + dnfA.toFixed(1).padStart(5) + '%' + dnfB.toFixed(1).padStart(6) + '%' +
            '        Δ ' + (dnfB - dnfA).toFixed(1) + ' Punkte');
console.log('Starter je Rennen         ' + (a.laeufe ? (a.starter / a.laeufe).toFixed(1) : '-').padStart(6) +
            (b.laeufe ? (b.starter / b.laeufe).toFixed(1) : '-').padStart(7));
console.log('');
console.log('Groesste Abweichung Siegquote : ' + maxAbwSieg.toFixed(1) + ' Prozentpunkte');
console.log('Mittlere Abweichung Siegquote : ' + (gezaehlt ? (summeAbwSieg / gezaehlt).toFixed(1) : '-') + ' Prozentpunkte');
console.log('');
console.log(maxAbwSieg < 5
    ? 'Die Pfade liegen im Rahmen der Stichprobenstreuung.'
    : 'DIVERGENZ: die Pfade liefern unterschiedliche Verteilungen.');
