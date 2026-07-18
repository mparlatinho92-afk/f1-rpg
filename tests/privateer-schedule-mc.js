// Monte Carlo: Privateer-Startzahlen gegen die F1DB-Messung.
// Referenz erzeugt aus f1db-json-splitted/f1db-races-race-results.json (Indy raus),
// Teilzeit-Fahrer = weniger als 80 % des Kalenders.
//   node tests/privateer-schedule-mc.js
'use strict';
const fs = require('fs');
const path = require('path');

// ── Funktionen aus index.html ziehen (kein Copy-Paste-Drift) ────────────────
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function grab(sig) {
    const i = html.indexOf(sig);
    if (i < 0) throw new Error('nicht gefunden: ' + sig);
    let d = 0;
    for (let k = html.indexOf('{', i); k < html.length; k++) {
        if (html[k] === '{') d++;
        else if (html[k] === '}') { d--; if (!d) return html.slice(i, k + 1); }
    }
}
const src = [
    html.slice(html.indexOf('const _PRIV_GUEST_SHARE'), html.indexOf('function _privGuestShare')),
    grab('function _privGuestShare'),
    grab('function _drawPrivateerCount'),
    grab("function _privClusterWindow"),
    grab("function _pickPrivateerRaces"),
    grab('function _homeOnlyEraRate'),
].join('\n');
// Indirekter eval: das Modul laeuft unter 'use strict', direkter eval wuerde die
// Deklarationen in seinem eigenen Scope einsperren.
(0, eval)(src);

// ── Referenz aus F1DB ───────────────────────────────────────────────────────
function reference() {
    const R = require('../f1db-json-splitted/f1db-races-race-results.json');
    const RA = require('../f1db-json-splitted/f1db-races.json');
    const indy = new Set(RA.filter(r => /indianapolis/i.test(r.circuitId || '')).map(r => r.id || r.raceId));
    const byYear = {}, seen = {};
    for (const x of R) {
        if (indy.has(x.raceId)) continue;
        (byYear[x.year] = byYear[x.year] || new Set()).add(x.raceId);
        const k = x.year + '|' + x.driverId;
        (seen[k] = seen[k] || new Set()).add(x.raceId);
    }
    const dec = {};
    for (const k in seen) {
        const y = +k.split('|')[0], d = Math.floor(y / 10) * 10;
        (dec[d] = dec[d] || []).push({ n: seen[k].size, tot: byYear[y].size });
    }
    const out = {};
    for (const d of [1950, 1960, 1970, 1980]) {
        const a = dec[d].filter(x => x.n < x.tot * 0.8);
        out[d] = {
            cal: Math.round(a.reduce((s, x) => s + x.tot, 0) / a.length),
            avg: a.reduce((s, x) => s + x.n, 0) / a.length,
            bins: [1, 2, 3, 4].map(n => a.filter(x => x.n === n).length / a.length)
                .concat([a.filter(x => x.n >= 5).length / a.length])
        };
    }
    return out;
}

// ── Simulation: homeOnly-Fahrer UND Startplan-Fahrer, wie im Spiel ──────────
// Wichtig: die Messung enthaelt BEIDE Sorten. homeOnly-Fahrer sind aus
// assignPrivateerSchedules ausgenommen, also muss der Vergleich die
// Gesamtpopulation nachbauen, sonst tunt man gegen die falsche Zielgroesse.
//
// ⚠ GRENZE DIESES TESTS (2026-07-18): die Fahrer-Population hier ist SYNTHETISCH —
// Pace gleichverteilt 35–70, Heimrennen-Verfuegbarkeit pauschal 45 %. Real sind
// Privateers schwaecher (Rang >=3 im Team) und in den 1960ern dominiert die
// KURATIERTE HOME_ONLY_ENTRIES-Liste den homeOnly-Anteil, nicht die Era-Rate.
// Dieser Test ist deshalb ein FORM- und Regressionscheck, keine Kalibrierung.
//
// Kalibriert wurde gegen den echten expandSeasonData-Lauf im Browser
// (skill "run", eval ueber privateerEntersRace). Stand v0.9.14.90:
//   Jahr | homeOnly-Anteil |  Ø    | 1/2/3/4/5+   | F1DB-Ziel
//   1955 |      13 %       | 2.09  | 47/22/15/10/6 | 52/18/10/10/9 (Ø2.09)
//   1965 |      45 %       | 2.15  | 60/14/ 7/ 4/14 | 55/13/10/ 4/18 (Ø2.37)
//   1975 |      18 %       | 3.85  | 41/ 9/ 8/ 8/34 | 36/14/10/ 8/31 (Ø3.61)
//   1985 |       0 %       | 5.61  | 25/13/ 4/ 3/55 | 24/14/ 8/ 7/47 (Ø4.89)
// Alle vier innerhalb ~8 Prozentpunkten. Bei Aenderungen an den Parametern
// DORT nachmessen, nicht nur hier.
function simulate(year, cal, N) {
    const races = Array.from({ length: cal }, (_, i) => ({ i }));
    const homeRate = _homeOnlyEraRate(year);
    const counts = [];
    for (let k = 0; k < N; k++) {
        // Pace-Verteilung der Privateers: Schwerpunkt unteres Mittelfeld
        const pace = 35 + Math.random() * 35;
        const paceFactor = pace <= 45 ? 1.25 : pace <= 55 ? 1.0 : pace <= 65 ? 0.55 : 0.2;
        // Anteil der Privateers mit Heimrennen im Kalender (grob: nicht jede Nation
        // faehrt daheim). 0.45 = Anteil der Fahrer aus Rennnationen jener Aeren.
        const hasHome = Math.random() < 0.45;
        if (hasHome && Math.random() < homeRate * paceFactor) {
            counts.push(Math.random() < 0.80 ? 1 : 0);   // 80 % Teilnahme am Heimrennen
        } else {
            counts.push(_drawPrivateerCount(year, cal));
        }
    }
    const started = counts.filter(n => n >= 1);
    return {
        avg: started.reduce((s, n) => s + n, 0) / started.length,
        bins: [1, 2, 3, 4].map(n => started.filter(x => x === n).length / started.length)
            .concat([started.filter(x => x >= 5).length / started.length])
    };
}

// ── Streuungs-Check: Ballung der gewaehlten Rennen ──────────────────────────
function spread(year, cal, N) {
    let sp = 0, ex = 0, m = 0;
    for (let k = 0; k < N; k++) {
        const n = 2 + Math.floor(Math.random() * 5);      // 2–6 Starts
        if (n >= cal) continue;
        const picked = _pickPrivateerRaces(n, Array.from({ length: cal }, (_, i) => ({ i })), year);
        sp += picked[picked.length - 1] - picked[0];
        ex += (n - 1) / (n + 1) * (cal - 1);
        m++;
    }
    return sp / ex;
}

const REF = reference();
const N = 60000;
const pct = x => (100 * x).toFixed(0).padStart(3) + '%';
let fail = 0;

console.log('Startzahl-Verteilung — Modell vs. F1DB (Teilzeit-Fahrer)');
console.log('Dek  |          |  Ø    |   1    2    3    4    5+');
for (const d of [1950, 1960, 1970, 1980]) {
    const r = REF[d], s = simulate(d + 5, r.cal, N);
    console.log(`${d} | F1DB     | ${r.avg.toFixed(2)} | ${r.bins.map(pct).join(' ')}`);
    console.log(`     | Modell   | ${s.avg.toFixed(2)} | ${s.bins.map(pct).join(' ')}`);
    // Toleranz 12 pp — bewusst weiter als die 8 pp des echten Saisonlaufs, weil die
    // synthetische Population (s.o.) systematisch danebenliegt. Enger gezogen wuerde
    // dieser Test zum Tuning gegen die falsche Zielgroesse verleiten.
    const dev = s.bins.map((v, i) => Math.abs(v - r.bins[i]));
    const worst = Math.max(...dev);
    const ok = worst <= 0.12 && Math.abs(s.avg - r.avg) <= 1.2;
    if (!ok) fail++;
    console.log(`     | ${ok ? 'OK' : 'ABWEICHUNG'}   | Δ Ø ${(s.avg - r.avg).toFixed(2)} | max Δ Bin ${(100 * worst).toFixed(0)} pp`);
    console.log('');
}

console.log('Ballung der Startrunden (Spannweite / Zufallserwartung)');
console.log('Dek  | F1DB  | Modell');
const REF_SPREAD = { 1950: 1.38, 1960: 0.94, 1970: 0.63, 1980: 0.42 };
for (const d of [1950, 1960, 1970, 1980]) {
    const m = spread(d + 5, REF[d].cal, 20000);
    const ok = Math.abs(m - REF_SPREAD[d]) <= 0.25;
    if (!ok) fail++;
    console.log(`${d} | ${REF_SPREAD[d].toFixed(2)}  | ${m.toFixed(2)}  ${ok ? 'OK' : 'ABWEICHUNG'}`);
}

console.log('');
console.log(fail ? `FEHLER: ${fail} Abweichung(en)` : 'ALLE CHECKS GRÜN');
process.exit(fail ? 1 : 0);
