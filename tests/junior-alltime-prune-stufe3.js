/**
 * junior-alltime-prune-stufe3.js
 * Stufe 3: allTimeStats prunen (Aktiv-oder-notable-Retention) + serien-abhängige Notable-Latte.
 * Prüft: Notable-Setzung je Serie (F3 streng / F2 großzügig), Prunen (Flag/aktiv/notable),
 * Legacy-Migration, und dass ein spät gewinnender Filler seine volle Historie behält.
 *
 * Ausführen:  SIMCORE_FROM_INDEX=1 node tests/junior-alltime-prune-stufe3.js
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = process.env.SIMCORE_FROM_INDEX || '1';
const { getContext } = require('./sim-core');
const ctx = getContext();

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name); } }

// jw-Kontext für _juniorSeriesLevel (liest GAME_STATE.juniorWorld.series)
function freshJw(pruneFlag) {
    return { series: [{ id: 'f2', level: 2 }, { id: 'f3', level: 3 }], drivers: [], allTimeStats: {}, circuitIndex: {}, pruneAllTime: pruneFlag };
}
// heavy-Record bauen: drivers = [{id, wins, podiums, poles, points, ...}], racesLen Runden
function heavy(seriesId, drivers, racesLen) {
    const standings = {}, drvArr = [];
    drivers.forEach(d => {
        standings[d.id] = { id: d.id, histId: d.id, name: d.id, points: d.points || 0, wins: d.wins || 0, podiums: d.podiums || 0, poles: d.poles || 0, dnfs: d.dnfs || 0, fastestLaps: d.fl || 0 };
        drvArr.push({ id: d.id, histId: d.id, name: d.id, nation: 'GER' });
    });
    return { seriesId, standings, drivers: drvArr, races: Array.from({ length: racesLen || 0 }, () => ({ results: [] })) };
}

console.log('\n=== Stufe 3: Notable-Latte + Prunen ===');

// 1) Notable-Latte serien-abhängig
{
    const jw = freshJw(true);
    ctx.GAME_STATE.juniorWorld = jw;
    // F3 (streng): nur Champion + Sieger notable
    ctx._foldJuniorAggregates(jw, heavy('f3', [
        { id: 'f3champ', points: 100, wins: 3 },
        { id: 'f3win', points: 50, wins: 1 },
        { id: 'f3pod', points: 40, podiums: 5 },
        { id: 'f3pole', points: 30, poles: 2 },
        { id: 'f3zero', points: 5 },
    ], 10));
    const st = jw.allTimeStats;
    ok('F3 Champion notable', st.f3champ.notable === true);
    ok('F3 Sieger notable', st.f3win.notable === true);
    ok('F3 nur-Podest NICHT notable', !st.f3pod.notable);
    ok('F3 nur-Pole NICHT notable', !st.f3pole.notable);
    ok('F3 P14-Filler NICHT notable', !st.f3zero.notable);
    // F2 (großzügig): Podest + Pole reichen
    ctx._foldJuniorAggregates(jw, heavy('f2', [
        { id: 'f2champ', points: 100, wins: 3 },
        { id: 'f2pod', points: 40, podiums: 1 },
        { id: 'f2pole', points: 30, poles: 1 },
        { id: 'f2zero', points: 5 },
    ], 10));
    ok('F2 nur-Podest notable', st.f2pod.notable === true);
    ok('F2 nur-Pole notable', st.f2pole.notable === true);
    ok('F2 P14-Filler NICHT notable', !st.f2zero.notable);
}

// 2) Prunen: Flag aus → nichts; Flag an → nur Ruhestands-Filler weg
{
    const jw = freshJw(false);
    ctx.GAME_STATE.juniorWorld = jw;
    ctx._foldJuniorAggregates(jw, heavy('f3', [
        { id: 'winner', points: 100, wins: 2 },   // notable
        { id: 'activeFiller', points: 20 },        // filler, aktiv
        { id: 'retiredFiller', points: 15 },       // filler, im Ruhestand
    ], 10));
    jw.drivers = [{ histId: 'winner' }, { histId: 'activeFiller' }];   // retiredFiller NICHT aktiv
    const before = Object.keys(jw.allTimeStats).length;
    ok('Flag AUS → prune löscht nichts', ctx._pruneJuniorAllTime(jw) === 0 && Object.keys(jw.allTimeStats).length === before);
    jw.pruneAllTime = true;
    const pruned = ctx._pruneJuniorAllTime(jw);
    ok('Flag AN → genau 1 Ruhestands-Filler entfernt', pruned === 1);
    ok('notable (Sieger) bleibt', !!jw.allTimeStats.winner);
    ok('aktiver Filler bleibt', !!jw.allTimeStats.activeFiller);
    ok('Ruhestands-Filler gelöscht', !jw.allTimeStats.retiredFiller);
}

// 3) Legacy-Migration: Alt-Einträge ohne notable-Flag
{
    const jw = freshJw(true);
    ctx.GAME_STATE.juniorWorld = jw;
    jw.allTimeStats = {
        oldChamp: { titles: 2, wins: 5 },   // → notable via Ableitung
        oldWinner: { titles: 0, wins: 1 },  // → notable
        oldFiller: { titles: 0, wins: 0 },  // → nicht notable
    };
    jw.drivers = [];   // alle im Ruhestand
    const pruned = ctx._pruneJuniorAllTime(jw);
    ok('Legacy: Filler ohne Titel/Sieg entfernt', pruned === 1 && !jw.allTimeStats.oldFiller);
    ok('Legacy: alter Champion bleibt + Flag gesetzt', jw.allTimeStats.oldChamp && jw.allTimeStats.oldChamp.notable === true);
    ok('Legacy: alter Sieger bleibt + Flag gesetzt', jw.allTimeStats.oldWinner && jw.allTimeStats.oldWinner.notable === true);
}

// 4) Spät gewinnender Filler behält volle Historie (Aktiv-Retention → kein Backfill nötig)
{
    const jw = freshJw(true);
    ctx.GAME_STATE.juniorWorld = jw;
    jw.drivers = [{ histId: 'climber' }];   // aktiv
    ctx._foldJuniorAggregates(jw, heavy('f3', [{ id: 'climber', points: 20 }], 10));   // Saison 1: Filler
    ctx._pruneJuniorAllTime(jw);   // aktiv → bleibt
    ok('Saison 1: Eintrag existiert trotz Filler (aktiv)', !!jw.allTimeStats.climber && jw.allTimeStats.climber.starts === 10);
    ctx._foldJuniorAggregates(jw, heavy('f3', [{ id: 'climber', points: 90, wins: 2 }], 10));   // Saison 2: Sieg
    jw.drivers = [];   // jetzt im Ruhestand
    ctx._pruneJuniorAllTime(jw);
    ok('Saison 2: notable → bleibt nach Ruhestand', !!jw.allTimeStats.climber);
    ok('Volle Historie erhalten (starts=20, keine Lücke)', jw.allTimeStats.climber.starts === 20 && jw.allTimeStats.climber.wins === 2);
}

console.log(`\n=== Ergebnis: ${pass}/${pass + fail} grün ===`);
process.exit(fail ? 1 : 0);
