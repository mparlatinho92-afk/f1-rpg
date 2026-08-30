#!/usr/bin/env node
/**
 * KONSTRUKTEURS-PRAESENZ: STUERZT EIN TEAM UEBER NACHT AB?
 *
 * Zwei Regeln, beide auf Nutzer-Wunsch (v0.9.17.25):
 *   1. Wer im Feld steht, meldet mindestens EIN Rennen. Ein Konstrukteur ohne jede
 *      Meldung stand vorher trotzdem in der Konstrukteurs-Wertung.
 *   2. Der Absturz vom Vollprogramm (>= 80 % des Kalenders) auf <= 50 % darf vorkommen,
 *      aber nur so oft wie in echt. F1DB (TEAM_PRESENCE, 685 Uebergaenge): 1,5 %.
 *      Im Spielstand des Nutzers waren es 4,8 % — dreimal zu viel.
 *
 * Gezaehlt werden NUR Teams, die im Folgejahr noch im Feld stehen — ein echter Ausstieg
 * (Alfa Romeo nach 1951, Talbot Lago, Veritas) ist kein Absturz. Diese Unterscheidung
 * kostete beim ersten Messversuch eine Fehldiagnose: ohne sie sah es nach 30 Aussetzern
 * aus, tatsaechlich waren es null.
 *
 *   node tests/constructor-presence.js            1950, 20 Saisons
 *   node tests/constructor-presence.js 1970 15
 *
 * ⚠ Gegen UNCOMMITTETE index.html-Aenderungen:  SIMCORE_FROM_INDEX=1 node tests/...
 */
const { getContext } = require('./sim-core');
const vm = require('vm'), fs = require('fs'), path = require('path');
// TEAM_PRESENCE direkt aus der Quelle - `const` haengt nicht am VM-Objekt.
const _pctx = {}; vm.createContext(_pctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'presence.js'), 'utf8')
    + '; globalThis._P = TEAM_PRESENCE;', _pctx);
const PRESENCE = _pctx._P;
// ⚠ Ein Einbruch, den die WIRKLICHKEIT vorschreibt, ist kein Fehler. Fuehrt
// TEAM_PRESENCE fuer dieses Team und Jahr eine kurze Streckenliste, dann hat der
// Rennstall real eine Teilsaison bestritten - das Spiel bildet ihn korrekt ab.
// Ohne diese Ausnahme misst der Pruefer gegen genau die Daten, denen das Spiel folgt.
const _realeTeilsaison = (jahr, name) => {
    const j = PRESENCE[jahr]; if (!j) return false;
    const key = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const v = j[key];
    return Array.isArray(v);
};

const START = parseInt(process.argv[2]) || 1950;
const SEASONS = parseInt(process.argv[3]) || 20;
const ctx = getContext();
ctx.log = function () {};

console.log(`\nKONSTRUKTEURS-PRAESENZ  |  ab ${START}  |  ${SEASONS} Saisons\n`);
ctx.initFromYear(START);

const anteil = {}, imFeld = {};
for (let k = 0; k < SEASONS; k++) {
    const jahr = ctx.GAME_STATE.currentYear, n = (ctx.GAME_STATE.races || []).length;
    for (let i = 0; i < n; i++) {
        ctx.applyGuestMoves && ctx.applyGuestMoves(i);
        ctx.simulateTraining(i); ctx.simulateQualifying(i, false);
        ctx.applyRaceResults(ctx.simulateRace(i, false));
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
    const gp = (h.results || []).filter(r => !/Indianapolis/i.test(r.rn || ''));
    const dabei = {};
    for (const r of gp) {
        const g = new Set();
        for (const e of (r.res || [])) if (e.tmn) g.add(String(e.tmn).toLowerCase());
        for (const tn of Object.values(r.tms || {})) if (tn) g.add(String(tn).toLowerCase());
        for (const t of g) dabei[t] = (dabei[t] || 0) + 1;
    }
    anteil[jahr] = {};
    for (const [t, c] of Object.entries(dabei)) anteil[jahr][t] = c / (gp.length || 1);
    // Der Name kommt aus der WERTUNGSZEILE - h.teams ist ein schweres Feld und oft leer.
    imFeld[jahr] = new Set(Object.values(h.teamStandings || {}).map(v => v && v.name).filter(Boolean).map(x => String(x).toLowerCase()));
    // Konstrukteur in der Wertung, aber ohne jede Meldung?
    // ⚠ Gegen ALLE Rennen pruefen, nicht gegen `dabei` — das zaehlt bewusst ohne Indy,
    // und Indy-Rennstaelle (Trevis, Ewing, Meskowski) saehen dort immer nach Phantom aus.
    // Kostete beim ersten Lauf drei Fehlalarme.
    const dabeiAlle = new Set();
    for (const r of (h.results || [])) {
        for (const e of (r.res || [])) if (e.tmn) dabeiAlle.add(String(e.tmn).toLowerCase());
        for (const tn of Object.values(r.tms || {})) if (tn) dabeiAlle.add(String(tn).toLowerCase());
    }
    for (const [tid, v] of Object.entries(h.teamStandings || {})) {
        const nm = String((v && v.name) || '').toLowerCase();
        if (nm && !dabeiAlle.has(nm)) console.log(`   ⚠ ${jahr}: ${v.name} steht in der Wertung, hat aber nie gemeldet`);
    }
}

const jahre = Object.keys(anteil).map(Number).sort((a, b) => a - b);
let ges = 0, absturz = 0, aus = 0;
const bsp = [];
for (let i = 1; i < jahre.length; i++) {
    const j = jahre[i], v = anteil[jahre[i - 1]], n = anteil[j];
    for (const [t, a] of Object.entries(v)) {
        if (a < 0.8) continue;
        if (!imFeld[j] || !imFeld[j].has(t)) continue;   // ausgestiegen zaehlt nicht
        if (_realeTeilsaison(j, t)) continue;            // real eine Teilsaison - kein Fehler
        ges++;
        const b = n[t];
        if (b === undefined) { aus++; bsp.push(`${j} ${t}: ${Math.round(a * 100)} % -> KEINE Meldung`); }
        else if (b <= 0.5) { absturz++; if (bsp.length < 12) bsp.push(`${j} ${t}: ${Math.round(a * 100)} % -> ${Math.round(b * 100)} %`); }
    }
}
console.log(`\nVollprogramm-Teams, im Folgejahr noch im Feld: ${ges}`);
console.log(`  ${aus ? '❌' : '✅'} setzen komplett aus:      ${aus}`);
const q = ges ? (100 * absturz / ges).toFixed(1) : '0.0';
console.log(`  ${absturz / (ges || 1) > 0.035 ? '⚠' : '✅'} Absturz auf <= 50 %:      ${absturz}  (${q} % · real 1,5 %)`);
bsp.forEach(b => console.log('     · ' + b));
console.log('');
process.exit(aus === 0 ? 0 : 1);
