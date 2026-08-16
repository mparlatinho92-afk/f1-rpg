// Prüft den rotierenden Zukunfts-Kalender gegen die Regeln aus dem Sheet und
// gegen die an F1DB gemessenen Zielwerte (tests/calendar-rotation-analysis.js).
//
//   node tests/calendar-rotation-check.js            20 Saisons, 8 Welten
//   node tests/calendar-rotation-check.js 40 20      40 Saisons, 20 Welten
//
// Immer mit SIMCORE_FROM_INDEX=1, sonst wird der alte Monolith gemessen.

const { getContext } = require('./sim-core');

const JAHRE = parseInt(process.argv[2] || '20', 10);
const WELTEN = parseInt(process.argv[3] || '8', 10);

const ctx = getContext();
const { buildFutureCalendar, futureCalendarInfo } = ctx;
const {
    pool: FUTURE_CIRCUIT_POOL, fixed: FUTURE_CAL_FIXED, countries: LAENDER,
    baseYear: FUTURE_CAL_BASE_YEAR, base: FUTURE_CAL_BASE
} = futureCalendarInfo();

const pool = new Map(FUTURE_CIRCUIT_POOL.map(p => [p.id, p]));
const land = id => LAENDER[id] || '?';
if (Object.values(LAENDER).some(l => l === '?')) {
    console.log('⚠ Länder unvollständig – Länderregel wird blind geprüft:',
        Object.entries(LAENDER).filter(([, l]) => l === '?').map(([id]) => id).join(', '));
}

const fehler = [];
const meldung = (w, y, txt) => fehler.push(`Welt ${w} / ${y}: ${txt}`);

let groessen = [], wechselNeu = [], wechselWeg = [], nullJahre = 0;
const doppelLandJahre = [], dreierJahre = [];
const einsatz = new Map();          // circuitId -> Anzahl Saisons
let monatMax = 0;

for (let w = 0; w < WELTEN; w++) {
    // Jede "Welt" ist ein eigener Kalender-Seed – wie verschiedene Spielstände.
    const seed = 1000 + w * 7919;
    let vorher = null;

    for (let y = FUTURE_CAL_BASE_YEAR; y <= FUTURE_CAL_BASE_YEAR + JAHRE; y++) {
        const races = buildFutureCalendar(y, seed);
        const ids = races.map(r => r.circuitId);

        // --- Determinismus: zweiter Aufruf muss identisch sein ---
        const nochmal = buildFutureCalendar(y, seed).map(r => r.circuitId).join(',');
        if (nochmal !== ids.join(',')) meldung(w, y, 'nicht deterministisch');

        // --- Größe ---
        if (ids.length < 22 || ids.length > 26) meldung(w, y, `Größe ${ids.length} außerhalb 22-26`);
        groessen.push(ids.length);

        // --- Fixstrecken ---
        FUTURE_CAL_FIXED.forEach(f => {
            if (ids.indexOf(f) < 0) meldung(w, y, `Fixstrecke ${f} fehlt`);
        });

        // --- Doppelte Strecke ---
        if (new Set(ids).size !== ids.length) meldung(w, y, 'Strecke doppelt im Kalender');

        // --- Länderregel ---
        const proLand = {};
        ids.forEach(id => { const l = land(id); proLand[l] = (proLand[l] || 0) + 1; });
        const ueber3 = Object.entries(proLand).filter(([, n]) => n > 3);
        const genau3 = Object.entries(proLand).filter(([, n]) => n === 3);
        const doppel = Object.entries(proLand).filter(([, n]) => n >= 2);
        if (ueber3.length) meldung(w, y, `Land mit >3 Rennen: ${ueber3.map(x => x[0] + '×' + x[1])}`);
        if (genau3.length > 1) meldung(w, y, `${genau3.length} Länder mit 3 Rennen (max 1 erlaubt)`);
        doppelLandJahre.push(doppel.length);
        dreierJahre.push(genau3.length);

        // --- GP-Name doppelt ---
        const gps = ids.map(id => (pool.get(id) || {}).gp);
        if (new Set(gps).size !== gps.length) meldung(w, y, 'GP-Name doppelt');

        // --- Monat im erlaubten Fenster + Sortierung ---
        let letzter = 0;
        races.forEach(r => {
            const p = pool.get(r.circuitId);
            if (p && p.months && p.months.indexOf(r.month) < 0) {
                meldung(w, y, `${r.circuitId} in Monat ${r.month}, Fenster ${p.months}`);
            }
            if (r.month < letzter) meldung(w, y, 'Kalender nicht chronologisch');
            letzter = r.month;
            if (!r.name || !r.laps || !r.country) meldung(w, y, `Feld fehlt bei ${r.circuitId}`);
        });
        const proMonat = {};
        races.forEach(r => { proMonat[r.month] = (proMonat[r.month] || 0) + 1; });
        monatMax = Math.max(monatMax, ...Object.values(proMonat));

        ids.forEach(id => einsatz.set(id, (einsatz.get(id) || 0) + 1));

        // --- Rotationsrate ---
        if (vorher) {
            const neu = ids.filter(i => vorher.indexOf(i) < 0);
            const weg = vorher.filter(i => ids.indexOf(i) < 0);
            wechselNeu.push(neu.length);
            wechselWeg.push(weg.length);
            if (!neu.length && !weg.length) nullJahre++;
            if (weg.length > 2) meldung(w, y, `${weg.length} Abgänge (max 2 erwartet)`);
            if (neu.length > 3) meldung(w, y, `${neu.length} Zugänge (max 3 erwartet)`);
        }
        vorher = ids;
    }
}

// --- Basisjahr muss der reale 2026er Kalender sein ---
const basis = buildFutureCalendar(FUTURE_CAL_BASE_YEAR, 4711).map(r => r.circuitId);
const basisFehlt = FUTURE_CAL_BASE.filter(id => basis.indexOf(id) < 0);
if (basisFehlt.length) fehler.push(`Basisjahr weicht ab, fehlt: ${basisFehlt}`);

const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length) : 0;
const saisons = WELTEN * (JAHRE + 1);

console.log();
console.log(`Rotierender Kalender – ${WELTEN} Welten × ${JAHRE + 1} Saisons = ${saisons} Kalender`);
console.log('='.repeat(70));
console.log(`Größe            Ø ${avg(groessen).toFixed(1)}   min ${Math.min(...groessen)}  max ${Math.max(...groessen)}      Ziel: Ø ~23, 22-26`);
console.log(`Zugänge/Jahr     Ø ${avg(wechselNeu).toFixed(2)}   max ${Math.max(...wechselNeu)}            Ziel: Ø 1,0-1,5`);
console.log(`Abgänge/Jahr     Ø ${avg(wechselWeg).toFixed(2)}   max ${Math.max(...wechselWeg)}            Ziel: Ø ~1,1`);
console.log(`Jahre ohne Wechsel  ${nullJahre} von ${wechselNeu.length}  (${Math.round(nullJahre / wechselNeu.length * 100)} %)   real: 2019 und 2025`);
console.log(`Länder mit 2+    Ø ${avg(doppelLandJahre).toFixed(2)}                  real letzte 10 J.: 1,50`);
console.log(`Länder mit 3     Ø ${avg(dreierJahre).toFixed(2)}   (max 1 erlaubt)`);
console.log(`Rennen im vollsten Monat: ${monatMax}`);

console.log();
console.log('Einsatzquote je Strecke (Anteil der Saisons):');
[...einsatz.entries()].sort((a, b) => b[1] - a[1]).forEach(([id, n]) => {
    const q = Math.round(n / saisons * 100);
    const bar = '#'.repeat(Math.round(q / 4));
    console.log(`  ${id.padEnd(20)} ${String(q).padStart(3)} %  ${bar}`);
});
const nie = FUTURE_CIRCUIT_POOL.filter(p => !einsatz.has(p.id));
if (nie.length) console.log(`  NIE eingesetzt: ${nie.map(p => p.id).join(', ')}`);

console.log();
if (fehler.length) {
    console.log(`✗ ${fehler.length} Regelverstöße:`);
    fehler.slice(0, 25).forEach(f => console.log('   ' + f));
    if (fehler.length > 25) console.log(`   … und ${fehler.length - 25} weitere`);
    process.exitCode = 1;
} else {
    console.log('✓ Keine Regelverstöße.');
}

// Beispielkalender zum Draufschauen
console.log();
[FUTURE_CAL_BASE_YEAR, FUTURE_CAL_BASE_YEAR + 1, FUTURE_CAL_BASE_YEAR + 5, FUTURE_CAL_BASE_YEAR + 15].forEach(y => {
    const races = buildFutureCalendar(y, 1000);
    console.log(`${y} (${races.length}): ` + races.map(r => `${r.circuit}/${r.month}`).join(', '));
    console.log();
});
