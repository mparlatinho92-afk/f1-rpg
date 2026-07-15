/**
 * junior-spine-stufe4prep.js
 * Stufe-4-Prep: heavy.spine = notable-Teilnehmer (Anker-Identitäten) einer Saison.
 * Prüft _juniorSeasonSpine: nur notable histIds, Filler ausgeschlossen, Reihenfolge stabil.
 *
 * Ausführen:  SIMCORE_FROM_INDEX=1 node tests/junior-spine-stufe4prep.js
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = process.env.SIMCORE_FROM_INDEX || '1';
const { getContext } = require('./sim-core');
const ctx = getContext();

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name); } }
const S = (x) => JSON.stringify(x);

console.log('\n=== Stufe-4-Prep: heavy.spine ===');

const drivers = [
    { id: 'a', histId: 'a' }, { id: 'b', histId: 'b' },
    { id: 'c', histId: 'c' }, { id: 'd', histId: 'd' },
];
const at = {
    a: { notable: true },      // Anker
    b: { notable: false },     // Filler
    c: {},                     // Filler (Flag fehlt)
    d: { notable: true },      // Anker
    // 'e' existiert nicht in at → Filler
};

ok('spine enthält genau die notable histIds (Reihenfolge = Roster)', S(ctx._juniorSeasonSpine(drivers, at)) === S(['a', 'd']));
ok('Filler (notable:false / kein Eintrag) ausgeschlossen', !ctx._juniorSeasonSpine(drivers, at).includes('b') && !ctx._juniorSeasonSpine(drivers, at).includes('c'));
ok('leeres allTimeStats → leere spine', S(ctx._juniorSeasonSpine(drivers, {})) === S([]));
ok('leere drivers → leere spine', S(ctx._juniorSeasonSpine([], at)) === S([]));
ok('undefined-robust', S(ctx._juniorSeasonSpine(undefined, undefined)) === S([]));

// Integration mit _foldJuniorAggregates: nach dem Falten stimmen die Anker
{
    const jw = { series: [{ id: 'f3', level: 3 }], allTimeStats: {}, circuitIndex: {} };
    ctx.GAME_STATE.juniorWorld = jw;
    const standings = {}, drvArr = [];
    [['champ', 100, 3], ['winner', 60, 1], ['filler', 10, 0]].forEach(([id, points, wins]) => {
        standings[id] = { id, histId: id, name: id, points, wins, podiums: 0, poles: 0, dnfs: 0, fastestLaps: 0 };
        drvArr.push({ id, histId: id, name: id, nation: 'GER' });
    });
    ctx._foldJuniorAggregates(jw, { seriesId: 'f3', standings, drivers: drvArr, races: [] });
    const spine = ctx._juniorSeasonSpine(drvArr, jw.allTimeStats);
    ok('Nach Fold: F3-Champion + Sieger sind Spine, Filler nicht', S(spine) === S(['champ', 'winner']));
}

console.log(`\n=== Ergebnis: ${pass}/${pass + fail} grün ===`);
process.exit(fail ? 1 : 0);
