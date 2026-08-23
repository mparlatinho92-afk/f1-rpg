// champion-followup.js — FAEHRT EIN WELTMEISTER DIE FOLGESAISON NOCH?
//
// Nutzer-Befund am Castellotti-Fall: „eine Banalitaet der Karriere. erst weltmeister
// dann danach nur noch sporadisch im einsatz." Vermutung des Nutzers: das erneuerte
// Meldesystem (markPrivateers nach realer Rennzahl + hasEarnedFullSeat, v0.9.16.15/.16)
// koennte das kuenftig verhindern.
//
// Genau das misst dieses Skript: je Saison den Champion merken und in der FOLGESAISON
// nachsehen, an wie vielen Rennen er meldet — absolut und als Anteil des Kalenders.
// Ausgewiesen wird auch, ob er ueberhaupt noch im Feld steht (Ruecktritt/Tod zaehlen
// nicht als Fehler, sie sind Teil der Erzaehlung).
//
//   node tests/champion-followup.js 1955 10 6      Startjahr, Sims, Saisons
'use strict';
const { getContext } = require('./sim-core');

const YEAR = Number(process.argv[2] || 1955);
const SIMS = Number(process.argv[3] || 10);
const SEASONS = Number(process.argv[4] || 6);

const ctx = getContext();
const faelle = [];

function championVonJetzt() {
    const st = ctx.GAME_STATE.driverStandings || {};
    let best = null;
    for (const id in st) {
        const s = st[id];
        if (!best || (s.points || 0) > (best.p || 0)) best = { id, p: s.points || 0, name: s.name };
    }
    return best && best.p > 0 ? best : null;
}

function meldungen(id, name) {
    const gs = ctx.GAME_STATE;
    const cal = (gs.races || []).filter(r => !r.isIndy && r.circuitId);
    // ⚠ NAMENSSUCHE, NICHT ID: Fahrer-IDs tragen einen Zeitstempel und wechseln,
    //   sobald ein Objekt neu erzeugt wird. Ueber die ID zaehlt man Fahrer als
    //   verschwunden, die laengst wieder im Feld stehen.
    const _n = String(name || '').toLowerCase().trim();
    const d = (gs.drivers || []).find(x => x.id === id)
           || (gs.drivers || []).find(x => String(x.name || '').toLowerCase().trim() === _n);
    if (!d) return { da: false, n: 0, kal: cal.length };
    if (d.status && d.status !== 'active') return { da: false, n: 0, kal: cal.length, status: d.status };
    return { da: true, n: cal.filter(r => ctx.privateerEntersRace(d, r)).length, kal: cal.length };
}

let ok = 0;
for (let s = 0; s < SIMS; s++) {
    try {
        ctx.initFromYear(YEAR);
        let vorChampion = null;
        for (let k = 0; k < SEASONS; k++) {
            if (vorChampion) {
                const m = meldungen(vorChampion.id, vorChampion.name);
                faelle.push({ jahr: ctx.GAME_STATE.currentYear, name: vorChampion.name, ...m });
            }
            // Saison fahren
            const races = ctx.GAME_STATE.races || [];
            for (let r = 0; r < races.length; r++) {
                const res = ctx.simulateRace(r);
                if (typeof ctx.applyRaceResults === 'function') ctx.applyRaceResults(res, r);
            }
            vorChampion = championVonJetzt();
            if (k === SEASONS - 1) break;
            const y = ctx.GAME_STATE.currentYear;
            if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
            if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
            if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
            if (typeof ctx.initReservePool === 'function') ctx.initReservePool(y + 1);
            if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(y + 1);
            if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        ok++;
    } catch (e) { if (s === 0) console.log('  (Sim 1 verworfen: ' + e.message.slice(0, 100) + ')'); }
}

console.log(`\nWELTMEISTER IN DER FOLGESAISON  |  ab ${YEAR}  |  ${ok}/${SIMS} Sims x ${SEASONS} Saisons\n`);
const imFeld = faelle.filter(f => f.da);
const weg = faelle.filter(f => !f.da);
const quote = f => f.kal ? f.n / f.kal : 0;
const voll = imFeld.filter(f => quote(f) >= 0.9).length;
const teil = imFeld.filter(f => quote(f) >= 0.4 && quote(f) < 0.9).length;
const spor = imFeld.filter(f => quote(f) < 0.4).length;

console.log(`Faelle gesamt: ${faelle.length}`);
console.log(`  nicht mehr im Feld (Ruecktritt/Tod): ${weg.length}`);
console.log(`  im Feld: ${imFeld.length}`);
console.log(`    volle Saison  (>= 90 %): ${voll}  (${Math.round(100 * voll / Math.max(imFeld.length, 1))} %)`);
console.log(`    Teilzeit    (40-89 %): ${teil}  (${Math.round(100 * teil / Math.max(imFeld.length, 1))} %)`);
console.log(`    SPORADISCH    (< 40 %): ${spor}  (${Math.round(100 * spor / Math.max(imFeld.length, 1))} %)  <- der gemeldete Fehler`);
if (spor) {
    console.log('\n  sporadische Faelle:');
    imFeld.filter(f => quote(f) < 0.4).slice(0, 12)
        .forEach(f => console.log(`    ${f.jahr}  ${String(f.name).padEnd(24)} ${f.n}/${f.kal} Rennen`));
}
