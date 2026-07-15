/**
 * junior-seed-regen-stufe2.js
 * Stufe-2-Determinismus: races werden nicht mehr persistiert, sondern aus Snapshot+Seed
 * regeneriert. Dieser Test prüft, dass die Regeneration BYTE-IDENTISCHE races liefert wie
 * die Original-Sim – sonst driften Aggregat-Rebuilds (bestFinish/circuitIndex).
 *
 * Ausführen (gegen UNCOMMITTETE index.html):
 *   SIMCORE_FROM_INDEX=1 node tests/junior-seed-regen-stufe2.js
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = process.env.SIMCORE_FROM_INDEX || '1';
const { getContext } = require('./sim-core');
const ctx = getContext();

const S = (x) => JSON.stringify(x);
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name); } }

// ── Test-Fixtures: eine Serie mit Teams + ein Roster ──────────────────────
function makeSeries(id) {
    return {
        id, name: id.toUpperCase(),
        teams: [
            { id: 't0', strength: 88, reliability: 92 },
            { id: 't1', strength: 74, reliability: 80 },
            { id: 't2', strength: 61, reliability: 74 },
        ],
        // calendar bewusst weglassen → Sim würfelt ihn (salted) und friert ihn in heavy.calendar ein
    };
}
function makeDrivers(n) {
    const teams = ['t0', 't1', 't2'];
    const out = [];
    for (let i = 0; i < n; i++) {
        out.push({ id: 'd' + i, histId: 'd' + i, name: 'Fahrer ' + i, nation: 'GER',
            number: 2 + i, team: teams[i % 3], pace: 55 + ((i * 7) % 40),
            potential: 80, consistency: 60 + ((i * 5) % 35), rain: 50 + ((i * 11) % 45),
            age: 18 + (i % 8), debutYear: 2000, _retireAge: 30, contractEnd: 2002 });
    }
    return out;
}

// simuliert den Persist-Strip aus advanceJuniorWorld (races raus)
function strip(heavy) { const { races, ...rest } = heavy; return rest; }

console.log('\n=== Stufe 2: Regen-Determinismus ===');

// 1) Kern: Original-races == Regen-races (byte-identisch), Todes-Modus AUS
ctx.GAME_STATE.juniorDeaths = false;
{
    const series = makeSeries('f2'), drivers = makeDrivers(22), year = 2087;
    const seed = ctx._recapHash(12345 + '|f2|' + year);
    const sim = ctx._simulateJuniorSeriesSeason(series, drivers.map(d => ({ ...d })), 10, year, seed);
    const lean = strip(sim.heavy);
    ok('heavy enthält Regen-Kontext (teams/calendar/racesCount/deathsOn)',
        Array.isArray(lean.teams) && lean.teams.length === 3 && Array.isArray(lean.calendar)
        && lean.calendar.length === 10 && lean.racesCount === 10 && lean.deathsOn === false);
    ok('lean-Record hat KEINE races mehr', lean.races === undefined);
    const regen = ctx._regenJuniorRaces(year, lean);
    ok('Regen-races BYTE-IDENTISCH zur Original-Sim', S(regen) === S(sim.heavy.races));
    ok('Regen-standings-Punkte identisch (Champion-Anker hält)',
        S(Object.values(sim.heavy.standings).map(s => s.points)) ===
        S(Object.values(ctx._simulateJuniorSeriesSeason(
            { id: lean.seriesId, name: lean.seriesName, teams: lean.teams, calendar: lean.calendar.slice() },
            (lean.drivers || []).map(d => ({ ...d })), lean.racesCount, year, lean.seed, lean.deathsOn
        ).heavy.standings).map(s => s.points)));
}

// 2) Todes-Modus AN: races müssen ebenfalls exakt reproduzieren (2 Extra-rng-Draws)
ctx.GAME_STATE.juniorDeaths = true;
{
    const series = makeSeries('f3'), drivers = makeDrivers(24), year = 2090;
    const seed = ctx._recapHash(999 + '|f3|' + year);
    const sim = ctx._simulateJuniorSeriesSeason(series, drivers.map(d => ({ ...d })), 12, year, seed);
    const lean = strip(sim.heavy);
    ok('deathsOn im Snapshot eingefroren = true', lean.deathsOn === true);
    const regen = ctx._regenJuniorRaces(year, lean);
    ok('Regen-races identisch bei Todes-Modus AN', S(regen) === S(sim.heavy.races));
}

// 3) deathsOn verschiebt den rng-Strom → falscher Flag = andere races (Beweis, dass Snapshot nötig ist)
{
    const series = makeSeries('f2'), drivers = makeDrivers(22), year = 2091;
    const seed = ctx._recapHash(7 + '|f2|' + year);
    ctx.GAME_STATE.juniorDeaths = true;
    const withDeaths = ctx._simulateJuniorSeriesSeason(series, drivers.map(d => ({ ...d })), 10, year, seed, true);
    const withoutDeaths = ctx._simulateJuniorSeriesSeason(makeSeries('f2'), drivers.map(d => ({ ...d })), 10, year, seed, false);
    ok('Todes-Modus verschiebt races-Strom (Snapshot des Flags ist zwingend)',
        S(withDeaths.heavy.races) !== S(withoutDeaths.heavy.races));
}

// 4) Session-Cache: zweiter Aufruf liefert dieselbe Referenz (kein Neu-Würfeln)
{
    ctx.GAME_STATE.juniorDeaths = false;
    const series = makeSeries('f2'), drivers = makeDrivers(20), year = 2095;
    const seed = ctx._recapHash(42 + '|f2|' + year);
    const lean = strip(ctx._simulateJuniorSeriesSeason(series, drivers.map(d => ({ ...d })), 8, year, seed).heavy);
    const a = ctx._regenJuniorRaces(year, lean);
    const b = ctx._regenJuniorRaces(year, lean);
    ok('Cache: identische Referenz beim 2. Aufruf', a === b);
}

// 5) Alt-Save-Fallback: heavy MIT races → gibt races direkt zurück (keine Regen)
{
    const fake = { seriesId: 'f2', races: [{ round: 1, marker: 'ALTSAVE' }] };
    const r = ctx._regenJuniorRaces(2050, fake);
    ok('Alt-Save mit races → Fallback ohne Regen', r === fake.races && r[0].marker === 'ALTSAVE');
}

// 6) Anderer Seed → andere races (Negativ-Kontrolle)
{
    const drivers = makeDrivers(22), year = 2099;
    const a = ctx._simulateJuniorSeriesSeason(makeSeries('f2'), drivers.map(d => ({ ...d })), 10, year, 111).heavy.races;
    const b = ctx._simulateJuniorSeriesSeason(makeSeries('f2'), drivers.map(d => ({ ...d })), 10, year, 222).heavy.races;
    ok('Anderer Seed → andere races', S(a) !== S(b));
}

console.log(`\n=== Ergebnis: ${pass}/${pass + fail} grün ===`);
process.exit(fail ? 1 : 0);
