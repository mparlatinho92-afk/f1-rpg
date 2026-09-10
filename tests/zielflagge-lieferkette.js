/**
 * zielflagge-lieferkette.js — der ganze Weg: RPG rechnet, ZIELFLAGGE animiert.
 *
 *   node tests/zielflagge-lieferkette.js [jahr]
 *
 * ZIELFLAGGE ist ein Live-Ticker in 3D:
 *     simulateRace()  ->  Sofort-Sim | Live-Ticker | ZIELFLAGGE
 * Weil es ausserhalb des Dokuments liegt, kann es simulateRace nicht rufen -
 * es bekommt das Ergebnis GELIEFERT. Dieser Test prueft die Kette:
 *
 *   1. Das RPG baut die Lieferung (baueZielflaggeLieferung) und PARKT das
 *      Ergebnis, damit spaeter nicht zweimal gewuerfelt wird.
 *   2. Ein regulaerer Rennstart verwendet das geparkte Ergebnis unveraendert.
 *      ⚠ Das ist die kritische Stelle: simulateRace hat Nebenwirkungen (Tode,
 *      Ersatzfahrer). Ein zweiter Wurf wuerde sie doppelt ausloesen und die
 *      exportierte Datei nachtraeglich zur Luege machen.
 *   3. Die Lieferung ist gueltiges NDJSON mit core- und rennen-Zeile.
 *
 * Ob ZIELFLAGGE die Lieferung dann exakt abnimmt, prueft
 * zielflagge/test-lieferung.js.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');

const JAHR = parseInt(process.argv[2]) || 1988;
const ctx = getContext();

const p = [];
const pr = (name, ist, soll) => p.push({ name, ist, soll, ok: String(ist) === String(soll) });
const prWahr = (name, bed, hinweis) => p.push({ name, ist: hinweis, soll: 'erfuellt', ok: !!bed });

ctx.initFromYear(JAHR);
const raceIndex = 0;

/* ── 1. Lieferung bauen ── */
let lief = null, fehler = null;
try { lief = ctx.window.baueZielflaggeLieferung(raceIndex); }
catch (e) { fehler = e.message; }

pr('Lieferung gebaut', !!lief, true);
if (fehler) console.log('FEHLER: ' + fehler);

if (lief) {
    const zeilen = lief.text.split('\n').filter(Boolean);
    pr('NDJSON-Zeilen', zeilen.length, 3);
    let kopf = null, core = null, rennen = null;
    try {
        kopf = JSON.parse(zeilen[0]); core = JSON.parse(zeilen[1]); rennen = JSON.parse(zeilen[2]);
    } catch (e) { pr('Zeilen parsebar', 'FEHLER ' + e.message, 'ok'); }

    if (kopf && core && rennen) {
        pr('Kopf-Format', kopf._format, 'f1rpg-ndjson');
        pr('core-Zeile', core._t, 'core');
        pr('core.state vorhanden', !!core.state, true);
        pr('rennen-Zeile', rennen._t, 'rennen');
        prWahr('Teams mitgeliefert', (core.state.teams || []).length > 5, (core.state.teams || []).length + ' Teams');
        prWahr('Fahrer mitgeliefert', (core.state.drivers || []).length > 10, (core.state.drivers || []).length + ' Fahrer');
        prWahr('Ergebnis mitgeliefert', (rennen.results || []).length > 10, (rennen.results || []).length + ' Zeilen');
        prWahr('Startaufstellung mitgeliefert', (rennen.grid || []).length > 5, (rennen.grid || []).length + ' Grid-Plaetze');
        prWahr('keine Historie (schlank)', !core.state.history, Math.round(lief.text.length / 1024) + ' KB');

        // Jeder Fahrer im Ergebnis muss auch im Kader stehen, sonst kann
        // ZIELFLAGGE ihn nicht darstellen.
        const kader = new Set((core.state.drivers || []).map(d => d.id));
        const fehlend = (rennen.results || []).filter(r => !kader.has(r.driver));
        pr('Ergebnis-Fahrer alle im Kader', fehlend.length, 0);
        if (fehlend.length) console.log('   fehlen: ' + fehlend.slice(0, 5).map(x => x.name).join(', '));
    }

    /* ── 2. Ist das Ergebnis geparkt, und wird es verwendet? ── */
    const geparkt = ctx.GAME_STATE.pendingRaceResult;
    prWahr('Ergebnis geparkt', geparkt && geparkt.raceIndex === raceIndex,
        geparkt ? ('Rennen ' + geparkt.raceIndex) : 'nichts geparkt');

    if (geparkt) {
        const sollSieger = (geparkt.result.results.find(r => r.position === 1) || {}).name;
        // Regulaerer Rennstart - muss das geparkte Ergebnis nehmen
        const zweit = ctx.rennenErgebnisFuer(raceIndex, false);
        const istSieger = (zweit.results.find(r => r.position === 1) || {}).name;
        pr('Rennstart nutzt geparktes Ergebnis', istSieger, sollSieger);
        prWahr('Parkplatz danach leer', !ctx.GAME_STATE.pendingRaceResult, 'einmalig verwendbar');

        // Und danach wird wieder normal gewuerfelt
        const dritt = ctx.rennenErgebnisFuer(raceIndex, false);
        prWahr('danach wieder frisch gerechnet', !!dritt && !!dritt.results,
            (dritt.results.find(r => r.position === 1) || {}).name);
    }
}

console.log('\n═══ Lieferkette RPG → ZIELFLAGGE (' + JAHR + ') ═══\n');
let schlecht = 0;
p.forEach(x => {
    if (!x.ok) schlecht++;
    console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(34) + 'ist=' + String(x.ist).padEnd(16) + 'soll=' + x.soll);
});
if (lief) console.log('\nDatei: ' + lief.dateiname + '  (' + Math.round(lief.text.length / 1024) + ' KB, ' + lief.fahrer + ' Fahrer)');
console.log('\n' + (schlecht === 0
    ? 'GRUEN — das RPG liefert, das Ergebnis ist geparkt und wird genau einmal verwendet.'
    : schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN'));
process.exit(schlecht === 0 ? 0 : 1);
