#!/usr/bin/env node
/**
 * ZIELKURVE FUER DIE WERKSFAHRER-KASKADE
 *
 * Nutzer-Wunsch (30.08.2026): „wenn ein team ohne werksfahrer dasteht, sollte es als
 * fallback jeden privateer in werksfahrer umwandeln. aber nicht immer, eher eine kaskade,
 * je wichtiger/staerker das team, desto seltener ist es dass ein team nur mit
 * teilzeitfahrern faehrt."
 *
 * Bevor das gebaut wird, braucht es die reale Zahl: WIE OFT bestreitet ein Konstrukteur
 * eine Saison ohne einen einzigen Stammfahrer — und wie haengt das an seiner Groesse?
 *
 * Quelle: f1db-seasons-entrants-drivers.json (Runden je Fahrer, Konstrukteur und Saison).
 * Testfahrer sind ausgeschlossen.
 *
 * DEFINITION Stammfahrer: bestreitet >= 80 % der Rennen, die SEIN KONSTRUKTEUR in dieser
 * Saison gefahren ist. Bewusst relativ zum Team, nicht zum Kalender: ein Kleinstkonstrukteur
 * faehrt fuenf von sechzehn Rennen, und wer alle fuenf faehrt, ist sein Stammfahrer.
 * Die kalenderbezogene Sicht steht als zweite Spalte daneben.
 *
 *   node tests/works-driver-reality.js
 *   node tests/works-driver-reality.js 1970 1985     (Zeitfenster)
 */
'use strict';
const ED = require('../f1db-json-splitted/f1db-seasons-entrants-drivers.json');

const VON = parseInt(process.argv[2]) || 1950;
const BIS = parseInt(process.argv[3]) || 2025;

// ── Runden je Saison (Kalenderlaenge) und je Konstrukteur ──────────────────────
const kalender = {};                 // jahr -> hoechste Rundennummer
const proTeam = {};                  // jahr|ctor -> { runden:Set, fahrer:{id:Set} }
// ⚠ Lebenszeit-Starts IMMER ueber alle Jahre, nie ueber das Zeitfenster: sonst
// verschieben sich die Groessenbaender mit dem Fenster und Ferrari faellt in
// 1950-1964 von „gross" nach „mittel" - die Gruppen bedeuten dann in jedem
// Aufruf etwas anderes.
const lebenszeitAlle = {};
for (const e of ED) {
    if (e.testDriver || !Array.isArray(e.rounds)) continue;
    const k = e.year + '|' + e.constructorId;
    (lebenszeitAlle[k] = lebenszeitAlle[k] || new Set());
    for (const x of e.rounds) lebenszeitAlle[k].add(x);
}
const lebenszeit = {};
for (const [k, set] of Object.entries(lebenszeitAlle)) {
    const ctor = k.split('|')[1];
    lebenszeit[ctor] = (lebenszeit[ctor] || 0) + set.size;
}

for (const e of ED) {
    if (e.testDriver) continue;
    if (e.year < VON || e.year > BIS) continue;
    const r = Array.isArray(e.rounds) ? e.rounds : [];
    if (!r.length) continue;
    kalender[e.year] = Math.max(kalender[e.year] || 0, ...r);
    const k = e.year + '|' + e.constructorId;
    const t = proTeam[k] || (proTeam[k] = { jahr: e.year, ctor: e.constructorId, runden: new Set(), fahrer: {} });
    for (const x of r) t.runden.add(x);
    (t.fahrer[e.driverId] = t.fahrer[e.driverId] || new Set());
    for (const x of r) t.fahrer[e.driverId].add(x);
}

const bandVon = n => n < 20 ? 'winzig (<20 Starts)'
    : n < 60 ? 'klein (20-59)'
    : n < 200 ? 'mittel (60-199)'
    : 'gross (200+)';

const dekade = j => (Math.floor(j / 10) * 10) + 'er';

function auswerten(gruppeVon, titel) {
    const g = {};
    for (const t of Object.values(proTeam)) {
        const teamRunden = t.runden.size;
        if (!teamRunden) continue;
        const kal = kalender[t.jahr] || teamRunden;
        let stammTeam = 0, stammKalender = 0;
        for (const rs of Object.values(t.fahrer)) {
            if (rs.size >= 0.8 * teamRunden) stammTeam++;
            if (rs.size >= 0.8 * kal) stammKalender++;
        }
        const key = gruppeVon(t);
        const o = g[key] || (g[key] = { n: 0, ohneStamm: 0, ohneVollzeit: 0, runden: 0, kal: 0 });
        o.n++; o.runden += teamRunden; o.kal += kal;
        if (!stammTeam) o.ohneStamm++;
        if (!stammKalender) o.ohneVollzeit++;
    }
    console.log('\n' + titel);
    console.log('Gruppe                    │ Team-Saisons │ ohne Stammfahrer │ ohne Vollzeitfahrer │ Ø Anteil Kalender');
    console.log('─'.repeat(104));
    const pct = (a, b) => b ? (100 * a / b).toFixed(1).padStart(5) + ' %' : '    – ';
    for (const [k, o] of Object.entries(g).sort((a, b) => b[1].n - a[1].n)) {
        console.log(k.padEnd(25) + ' │ ' + String(o.n).padStart(12)
            + ' │ ' + pct(o.ohneStamm, o.n).padStart(16)
            + ' │ ' + pct(o.ohneVollzeit, o.n).padStart(19)
            + ' │ ' + (100 * o.runden / o.kal).toFixed(1).padStart(13) + ' %');
    }
}

console.log(`\nWERKSFAHRER IN DER WIRKLICHKEIT  |  ${VON}-${BIS}  |  ${Object.keys(proTeam).length} Konstrukteur-Saisons`);
console.log('Stammfahrer  = >= 80 % der Rennen SEINES Teams   ·   Vollzeitfahrer = >= 80 % des Kalenders');

auswerten(t => bandVon(lebenszeit[t.ctor] || 0), 'NACH GROESSE DES KONSTRUKTEURS (Lebenszeit-Starts)');
auswerten(t => dekade(t.jahr), 'NACH DEKADE');
auswerten(t => dekade(t.jahr) + ' / ' + bandVon(lebenszeit[t.ctor] || 0).split(' ')[0], 'DEKADE x GROESSE');

// ── Dasselbe Mass im SPIEL: --spiel <startjahr> <saisons> ─────────────────────
// Definition und Auswertung liegen bewusst in DERSELBEN Datei wie die Referenz.
// Zwei Skripte mit zwei Definitionen sind die haeufigste Ursache fuer eine
// Scheindifferenz zwischen Spiel und Wirklichkeit.
if (process.argv.includes('--spiel')) {
    const i = process.argv.indexOf('--spiel');
    const START = parseInt(process.argv[i + 1]) || 1950;
    const SEASONS = parseInt(process.argv[i + 2]) || 15;
    const { getContext } = require('./sim-core');
    const ctx = getContext();
    ctx.log = function () {};
    ctx.initFromYear(START);
    const gruppen = {};
    for (let k = 0; k < SEASONS; k++) {
        const jahr = ctx.GAME_STATE.currentYear, n = (ctx.GAME_STATE.races || []).length;
        for (let r = 0; r < n; r++) {
            ctx.applyGuestMoves && ctx.applyGuestMoves(r);
            ctx.simulateTraining(r); ctx.simulateQualifying(r, false);
            ctx.applyRaceResults(ctx.simulateRace(r, false));
        }
        ctx.updateDriverCareerScores && ctx.updateDriverCareerScores();
        ctx.processDriverPaceDevelopment && ctx.processDriverPaceDevelopment();
        ctx.checkCareerEnds && ctx.checkCareerEnds();
        ctx.initReservePool && ctx.initReservePool(jahr + 1);
        ctx._injectNewSeasonDrivers && ctx._injectNewSeasonDrivers(jahr + 1);
        ctx.processTeamChanges && ctx.processTeamChanges();
        ctx.startNewSeason();
        const h = (ctx.GAME_STATE.history || []).find(x => x.year === jahr);
        if (!h) continue;
        // Runden je Team und Fahrer aus den archivierten Ergebnissen - GP und Indy,
        // genau wie die F1DB-Referenz (die Indy-Jahre 1950-60 stehen dort mit drin).
        const teams = {};
        for (const race of (h.results || [])) {
            const ri = race.ri ?? 0;
            for (const e of (race.res || [])) {
                if (!e.tmn || !e.d) continue;
                const key = String(e.tmn).toLowerCase();
                const t = teams[key] || (teams[key] = { runden: new Set(), fahrer: {} });
                t.runden.add(ri);
                (t.fahrer[e.d] = t.fahrer[e.d] || new Set()).add(ri);
            }
        }
        for (const [nm, t] of Object.entries(teams)) {
            const tr = t.runden.size; if (!tr) continue;
            const stamm = Object.values(t.fahrer).filter(rs => rs.size >= 0.8 * tr).length;
            // Groessen-Band aus der F1DB-Lebenszeit desselben Namens, sonst 'unbekannt'.
            const slug = nm.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const band = lebenszeit[slug] != null ? bandVon(lebenszeit[slug]) : 'unbekannt (generiert)';
            const o = gruppen[band] || (gruppen[band] = { n: 0, ohne: 0 });
            o.n++; if (!stamm) o.ohne++;
        }
    }
    console.log('');
    console.log('DASSELBE MASS IM SPIEL  |  ab ' + START + ', ' + SEASONS + ' Saisons');
    console.log('Gruppe                    │ Team-Saisons │ ohne Stammfahrer');
    console.log('─'.repeat(60));
    for (const [k, o] of Object.entries(gruppen).sort((a, b) => b[1].n - a[1].n)) {
        console.log(k.padEnd(25) + ' │ ' + String(o.n).padStart(12) + ' │ '
            + (o.n ? (100 * o.ohne / o.n).toFixed(1).padStart(6) + ' %' : '     – '));
    }
}
console.log('');
