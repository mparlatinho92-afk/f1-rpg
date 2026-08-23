// vanished-drivers.js — WOHIN VERSCHWINDEN FAHRER, DIE KEIN COCKPIT MEHR FINDEN?
//
// Nutzer-Vorgabe (2026-08-23): „man muss schon unterscheiden ob rücktritt oder nur noch
// sporadischer privateer-fahrer." Anlass war `tests/champion-followup.js`: von 15 Champions,
// die in der Folgesaison nicht mehr im Feld standen, liefen ALLE 15 unter „verschwunden" —
// keiner unter `retired`, keiner unter `deceased`. Die Gesamtrate trifft die Realitaet
// exakt (13 % gegen 13 %), aber im Spiel ist nicht erkennbar, ob jemand aufgehoert hat
// oder nur kein Auto fand.
//
// Bevor daran etwas geaendert wird, muss die Frage beantwortet sein, WELCHE Art Fehler das
// ist. Zwei Moeglichkeiten mit ganz verschiedenen Hebeln:
//   (a) STATUS-Problem   — der Fahrer ist wirklich fort, bekommt aber kein `retired`.
//   (b) SICHTBARKEITS-Problem — er lebt im Reserve-Pool weiter, taucht in GAME_STATE.drivers
//       aber nicht auf. Dann fehlt nicht der Status, sondern die Anzeige.
//
// Bekannte Stellen, die ersatzlos entfernen (beide OHNE Status zu setzen):
//   index.html:8925   `_findZeroEntryDrivers` — Fahrer ohne Heimrennen im Kalender fliegen
//                     aus dem Template; laut Kommentar „kommen spaeter via initReservePool
//                     zurueck". Genau das prueft dieses Skript nach.
//   index.html:10785  Duplikat-Bereinigung — behaelt nur den Fahrer im schnelleren Auto.
//
// Gemessen wird jeder Fahrer, der von einer Saison zur naechsten aus GAME_STATE.drivers
// faellt — nicht nur Champions, damit die Datenlage traegt.
//
//   node tests/vanished-drivers.js 1955 6 8      Startjahr, Sims, Saisons
'use strict';
const { getContext } = require('./sim-core');

const YEAR = Number(process.argv[2] || 1955);
const SIMS = Number(process.argv[3] || 6);
const SEASONS = Number(process.argv[4] || 8);

const ctx = getContext();
const faelle = [];
const stationen = {};   // Schritt des Saisonwechsels → wie oft ein Champion dort verschwand

const norm = s => String(s || '').toLowerCase().trim();

function kaderBild() {
    const gs = ctx.GAME_STATE;
    const m = new Map();
    for (const d of (gs.drivers || [])) {
        // careerScores speichert Objekte, keine Zahlen — sonst steht hier [object Object].
        const _cs = (d.careerScores || []).slice(-1)[0];
        const score = (_cs && typeof _cs === 'object') ? (_cs.score ?? _cs.value ?? null) : (_cs ?? null);
        m.set(norm(d.name), { id: d.id, status: d.status || 'active', team: d.team || null,
                              name: d.name, score });
    }
    return m;
}

function poolNamen() {
    const gs = ctx.GAME_STATE;
    const s = new Set();
    for (const d of (gs.reservePool || [])) s.add(norm(d.name));
    return s;
}

let ok = 0;
for (let sim = 0; sim < SIMS; sim++) {
    try {
        ctx.initFromYear(YEAR);
        let vorher = null, vorChampion = null;
        for (let k = 0; k < SEASONS; k++) {
            if (vorher) {
                const jetzt = kaderBild();
                const pool = poolNamen();
                for (const [nm, alt] of vorher) {
                    if (jetzt.has(nm)) continue;                  // noch da → egal
                    if (alt.status !== 'active') continue;        // war schon vorher raus
                    faelle.push({
                        jahr: ctx.GAME_STATE.currentYear,
                        name: alt.name,
                        warChampion: vorChampion && norm(vorChampion) === nm,
                        imPool: pool.has(nm),
                        hatteTeam: !!alt.team,
                        score: alt.score,
                    });
                }
            }
            const races = ctx.GAME_STATE.races || [];
            for (let r = 0; r < races.length; r++) {
                const res = ctx.simulateRace(r);
                if (typeof ctx.applyRaceResults === 'function') ctx.applyRaceResults(res, r);
            }
            // Champion dieser Saison merken (fuer die Aufschluesselung)
            const st = ctx.GAME_STATE.driverStandings || {};
            let best = null;
            for (const id in st) if (!best || (st[id].points || 0) > (best.points || 0)) best = st[id];
            vorChampion = best && best.points > 0 ? best.name : null;

            vorher = kaderBild();
            if (k === SEASONS - 1) break;
            const y = ctx.GAME_STATE.currentYear;
            // ── AN WELCHER STATION VERSCHWINDET DER CHAMPION? ──────────────────────
            // Nach jedem Schritt des Saisonwechsels nachsehen, ob er noch im Kader steht.
            // Ohne diese Aufschluesselung bleibt nur die Beobachtung „irgendwo zwischen
            // zwei Saisons weg" — und daraus laesst sich keine Stelle reparieren.
            const _champNm = norm(vorChampion);
            const _da = () => !_champNm || (ctx.GAME_STATE.drivers || []).some(d => norm(d.name) === _champNm);
            const _station = (name, fn) => {
                if (typeof fn !== 'function') return;
                const vorSchritt = _da();
                fn();
                if (vorSchritt && !_da()) stationen[name] = (stationen[name] || 0) + 1;
            };
            _station('updateDriverCareerScores', ctx.updateDriverCareerScores);
            _station('processDriverPaceDevelopment', ctx.processDriverPaceDevelopment);
            _station('checkCareerEnds', ctx.checkCareerEnds);
            if (typeof ctx.initReservePool === 'function')
                _station('initReservePool', () => ctx.initReservePool(y + 1));
            if (typeof ctx._injectNewSeasonDrivers === 'function')
                _station('_injectNewSeasonDrivers', () => ctx._injectNewSeasonDrivers(y + 1));
            _station('processTeamChanges', ctx.processTeamChanges);
            _station('startNewSeason', ctx.startNewSeason);
        }
        ok++;
    } catch (e) { if (sim === 0) console.log('  (Sim 1 verworfen: ' + e.message.slice(0, 110) + ')'); }
}

const pct = (a, b) => b ? Math.round(100 * a / b) + ' %' : '–';
console.log(`\nSPURLOS VERSCHWUNDENE FAHRER  |  ab ${YEAR}  |  ${ok}/${SIMS} Sims x ${SEASONS} Saisons\n`);
console.log(`Faelle gesamt: ${faelle.length}`);
if (!faelle.length) {
    console.log('Keiner — jeder Abgang traegt einen Status. Dann ist Punkt 11 kein Status-Problem.');
    process.exit(0);
}
const imPool = faelle.filter(f => f.imPool);
const champs = faelle.filter(f => f.warChampion);
const mitTeam = faelle.filter(f => f.hatteTeam);
console.log(`  im Reserve-Pool wiedergefunden: ${imPool.length}  (${pct(imPool.length, faelle.length)})`);
console.log(`  hatten im Vorjahr ein Cockpit:  ${mitTeam.length}  (${pct(mitTeam.length, faelle.length)})`);
console.log(`  davon amtierende Champions:     ${champs.length}`);
console.log('');
console.log(imPool.length / faelle.length > 0.5
    ? '→ ueberwiegend SICHTBARKEIT: die Fahrer leben im Reserve-Pool weiter, tauchen aber\n'
      + '  nicht in GAME_STATE.drivers auf. Hebel ist die Anzeige, nicht der Status.'
    : '→ ueberwiegend STATUS: die Fahrer sind wirklich fort, ohne `retired` zu bekommen.\n'
      + '  Hebel ist ein sauberes Karriereende an der Stelle, die sie entfernt.');

const _st = Object.entries(stationen).sort((a, b) => b[1] - a[1]);
if (_st.length) {
    console.log('\n  Champion verschwand an dieser Station des Saisonwechsels:');
    _st.forEach(([n, c]) => console.log(`    ${String(n).padEnd(30)} ${c}×`));
} else {
    console.log('\n  Kein Champion verschwand waehrend des Saisonwechsels —');
    console.log('  dann passiert es INNERHALB der Saison (Duplikat-Bereinigung, Grid-Fueller).');
}

if (champs.length) {
    console.log('\n  verschwundene Champions:');
    champs.slice(0, 12).forEach(f => console.log(`    ${f.jahr}  ${String(f.name).padEnd(24)}`
        + ` Pool: ${f.imPool ? 'ja' : 'NEIN'} · Cockpit im Vorjahr: ${f.hatteTeam ? 'ja' : 'nein'}`
        + (f.score != null ? ` · letzter Score ${f.score}` : '')));
}
