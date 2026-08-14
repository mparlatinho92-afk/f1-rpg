// midseason-moves.js — Wie viel Fahrer-Bewegung passiert MITTEN in der Saison?
//
// WOZU: Stufe 3 der Meldelisten-Deckung. Stufe 1+2 holen die Bewegung fuer Saisons
// MIT Daten aus F1DB (`GUEST_ENTRIES`). Fuer alles danach — fortgesetzte Saisons mit
// generiertem Kader — gibt es keine Daten, und bisher auch keine Bewegung: die
// Abwerbe-Mechanik feuert nur, wenn ein Sitz FREI wird (Tod, Entlassung), waehrend
// real 6-7 Fahrer je Saison das Team wechselten, meist ohne Vakanz.
//
// MASSZAHL (identisch zu tests/season-data-coverage.js, damit beide vergleichbar sind)
//   Mehrfach-Fahrer   = Fahrer, die in dieser Saison fuer >1 Team meldeten
//   Minderheits-Rennen= Meldungen abzueglich der beim staerksten Team des Fahrers.
//                       Wer 10x Ferrari und 1x Kleinkonstrukteur faehrt, liefert 1.
//                       Das ist die Zahl, die die Ziel-Kurve unten beschreibt.
//
// ⚠ Das Team wird VOR `applyRaceResults` abgelesen — danach hat der Fahrer sein Team
//   wegen genau dieses Rennens womoeglich schon verloren (Vertragsende, Tod). Der
//   Fehler kostete in mc-entries-dnq.js 2,6 Phantom-Eintraege je Saison.
//
// AUFRUF
//   node tests/midseason-moves.js 1974 10            (10 Sims, nur Saison 1)
//   node tests/midseason-moves.js 2021 5 --saisons=7 (fortgesetzter Fall)
//   node tests/midseason-moves.js --real             (nur die Referenzkurve)
//   SIMCORE_FROM_INDEX=1 davorsetzen, um die unkommittete index.html zu messen.
'use strict';
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const num = argv.filter(a => /^\d+$/.test(a)).map(Number);
const opt = k => { const a = argv.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : null; };
const YEAR = num[0] || 1974;
const SIMS = num[1] || 10;
const SEASONS = Number(opt('saisons') || 1);
const NUR_REAL = argv.includes('--real');
const DETAIL = argv.includes('--detail');

const BASE = path.join(__dirname, '..', 'f1db-json-splitted');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
const f1 = (v, w = 5) => v.toFixed(1).padStart(w);

// ── Referenz aus F1DB: Bewegung je Saison ───────────────────────────────────
// Indy ausgeschlossen wie ueberall — anderes Starterfeld, eigene Regeln.
const roundCircuit = {};
for (const r of J('f1db-races.json')) {
    roundCircuit[`${r.year}_${r.round}`] =
        r.grandPrixId === 'indianapolis' ? null : String(r.circuitId || '').toLowerCase();
}
const realJahr = {};   // Jahr -> { multi, minderheit, fahrer }
{
    // Jahr -> Fahrer -> Konstrukteur -> Set(Strecke). Ueber die Strecke entdoppelt,
    // weil ein Fahrer in F1DB je Runde mehrere Eintraege haben kann.
    const T = {};
    for (const e of J('f1db-seasons-entrants-drivers.json')) {
        if (e.testDriver) continue;
        for (const rd of (e.rounds || [])) {
            const cid = roundCircuit[`${e.year}_${rd}`]; if (!cid) continue;
            const D = (T[e.year] = T[e.year] || {})[e.driverId] = T[e.year][e.driverId] || {};
            (D[e.constructorId] = D[e.constructorId] || new Set()).add(cid);
        }
    }
    for (const y of Object.keys(T)) {
        let multi = 0, minderheit = 0, fahrer = 0;
        for (const d of Object.keys(T[y])) {
            const n = Object.values(T[y][d]).map(s => s.size);
            fahrer++;
            if (n.length < 2) continue;
            multi++;
            minderheit += n.reduce((s, v) => s + v, 0) - Math.max(...n);
        }
        realJahr[y] = { multi, minderheit, fahrer };
    }
}

function dekadenTabelle(quelle, titel) {
    const D = {};
    for (const y of Object.keys(quelle).map(Number).sort((a, b) => a - b)) {
        const k = Math.floor(y / 10) * 10;
        (D[k] = D[k] || { m: [], mr: [] });
        D[k].m.push(quelle[y].multi); D[k].mr.push(quelle[y].minderheit);
    }
    console.log(`\n${titel}`);
    console.log('Dekade │ Ø Wechsler │ Ø Minderheits-Rennen');
    console.log('─'.repeat(48));
    for (const k of Object.keys(D).map(Number).sort((a, b) => a - b)) {
        console.log(`${String(k).padStart(6)} │ ${f1(mean(D[k].m), 10)} │ ${f1(mean(D[k].mr), 20)}`);
    }
    return D;
}

if (NUR_REAL) {
    dekadenTabelle(realJahr, 'REAL (F1DB, Indy raus) — Bewegung je Saison');
    process.exit(0);
}

// ── Spiel messen ────────────────────────────────────────────────────────────
const { getContext } = require('./sim-core');
const ctx = getContext();

const spielJahr = {};   // Jahr -> Liste je Sim
function runSeason() {
    const y = ctx.GAME_STATE.currentYear;
    const races = ctx.GAME_STATE.races || [];
    const proFahrer = {};   // driverId -> teamName -> Rennen
    let ohneTeam = 0;
    const namen = {};

    let tName = {}, dTeam = {}, dName = {};
    const refresh = () => {
        tName = {}; dTeam = {}; dName = {};
        for (const t of (ctx.GAME_STATE.teams || [])) tName[t.id] = t.name || t.id;
        for (const d of (ctx.GAME_STATE.drivers || [])) { dTeam[d.id] = d.team || null; dName[d.id] = d.name; }
    };

    for (let i = 0; i < races.length; i++) {
        const race = races[i];
        let result = null;
        try {
            // [SYNC Rennwochenende] Gastauftritte VOR der Meldeliste — im Spiel steht
            // der Aufruf an allen drei Stellen vor simulateTraining. Fehlt er hier,
            // misst das Skript NULL Bewegung, obwohl GUEST_ENTRIES sie liefert.
            if (typeof ctx.applyGuestMoves === 'function') ctx.applyGuestMoves(i);
            ctx.simulateTraining(i);
            const isRain = Math.random() < (ctx.SIM_CONFIG?.rainProbability ?? 0.15);
            ctx.simulateQualifying(i, isRain);
            result = ctx.simulateRace(i, isRain);
            if (!result) continue;
            refresh();                    // Team ABLESEN, bevor die Folgen greifen
            ctx.applyRaceResults(result);
        } catch (e) { continue; }
        if (race.isIndy || (race.name && race.name.includes('Indianapolis'))) continue;

        const alle = [...(result.results || []).map(r => r.driver),
                      ...(result.dnq || []), ...(result.dnpq || [])];
        for (const id of alle) {
            // Meldungen OHNE Team zaehlen nicht als Bewegung — sonst sieht jede
            // Luecke in der Kaderaufloesung wie ein Teamwechsel aus.
            if (!dTeam[id]) { ohneTeam++; continue; }
            const tm = tName[dTeam[id]] || dTeam[id];
            namen[id] = dName[id] || id;
            const P = proFahrer[id] = proFahrer[id] || {};
            P[tm] = (P[tm] || 0) + 1;
        }
    }

    let multi = 0, minderheit = 0;
    const wechsler = [];
    for (const id of Object.keys(proFahrer)) {
        const n = Object.values(proFahrer[id]);
        if (n.length < 2) continue;
        multi++;
        const m = n.reduce((s, v) => s + v, 0) - Math.max(...n);
        minderheit += m;
        wechsler.push(`${namen[id]} (${Object.entries(proFahrer[id]).map(([t, c]) => `${t}:${c}`).join(', ')})`);
    }
    // Wie viele Bewegungs-Rennen hat das MODELL geplant? Der Rest kommt aus den
    // Daten (GUEST_ENTRIES) oder aus regulaeren KI-Transfers. Ohne diese Spalte
    // laesst sich ein Ueberschuss nicht zuordnen.
    let geplant = 0;
    const mm = ctx.GAME_STATE._modelMoves;
    if (mm && mm.year === y) for (const id in (mm.plan || {})) geplant += (mm.plan[id].circuits || []).length;
    const ziel = (mm && mm.year === y) ? (mm.ziel || 0) : 0;
    let ist = 0;
    if (mm && mm.year === y) for (const k in (mm.zaehler || {})) ist += Math.min(mm.zaehler[k].h || 0, mm.zaehler[k].w || 0);
    (spielJahr[y] = spielJahr[y] || []).push({ multi, minderheit, wechsler, geplant, ohneTeam, ziel, ist });
}

console.log(`\n${'='.repeat(74)}`);
console.log(`  MID-SEASON-BEWEGUNG  |  ab ${YEAR}  |  ${SIMS} Sims x ${SEASONS} Saison(en)`);
console.log(`${'='.repeat(74)}`);

let ok = 0;
const step = Math.max(1, Math.floor(SIMS / 10));
for (let s = 0; s < SIMS; s++) {
    if (s % step === 0) process.stdout.write(`  ${Math.round(s / SIMS * 100)}%... `);
    try {
        ctx.initFromYear(YEAR);
        for (let k = 0; k < SEASONS; k++) {
            runSeason();
            if (k === SEASONS - 1) break;
            // Saison-Uebergang: EXAKT die Kette aus monte-carlo-multi.js.
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
    } catch (e) { /* Sim verwerfen */ }
}
console.log('100%\n');
if (!ok) { console.log('Kein Durchlauf erfolgreich — Jahr pruefen.'); process.exit(1); }

// Dekaden-Mittel der Realitaet — DAS ist die Zielgroesse des Modells. Der Vergleich
// mit dem einzelnen realen Jahr sagt ab Saison 2 wenig: 1976 hatte real 24 Bewegungs-
// rennen, 1988 null. Das Modell zieht um den Dekaden-Erwartungswert.
const realDekade = {};
{
    const D = {};
    for (const y of Object.keys(realJahr).map(Number)) {
        const k = Math.floor(y / 10) * 10;
        (D[k] = D[k] || []).push(realJahr[y].minderheit);
    }
    for (const k of Object.keys(D)) realDekade[k] = mean(D[k]);
}

console.log(`BEWEGUNG JE SAISON  (${ok} erfolgreiche Sims)`);
console.log('Jahr │ Ø Wechsler │ real │ Ø Minderh.-Rennen │ real │ Dekade │  Δ Dek. │ Modell geplant');
console.log('─'.repeat(92));
const jahre = Object.keys(spielJahr).map(Number).sort((a, b) => a - b);
let spielSum = [], dekSum = [];
for (const y of jahre) {
    const L = spielJahr[y];
    const gm = mean(L.map(x => x.multi)), gr = mean(L.map(x => x.minderheit));
    const R = realJahr[y];
    const dk = realDekade[Math.floor(y / 10) * 10];
    spielSum.push(gr); if (dk !== undefined) dekSum.push(dk);
    console.log(`${y} │ ${f1(gm, 10)} │ ${R ? f1(R.multi, 4) : '   —'} │ ${f1(gr, 17)} │ ${R ? f1(R.minderheit, 4) : '   —'} │ ${dk !== undefined ? f1(dk, 6) : '     —'} │ ${dk !== undefined ? f1(gr - dk, 7) : '      —'} │ ${f1(mean(L.map(x => x.geplant || 0)), 14)}`);
}
console.log('─'.repeat(92));
console.log(`Mittel ueber alle gezeigten Saisons: Spiel ${mean(spielSum).toFixed(1)} · Dekaden-Ziel ${mean(dekSum).toFixed(1)}`);
console.log(`Regelkreis: Ø Soll ${mean(jahre.map(y => mean(spielJahr[y].map(x => x.ziel || 0)))).toFixed(1)} · Ø Ist-Zaehler ${mean(jahre.map(y => mean(spielJahr[y].map(x => x.ist || 0)))).toFixed(1)}`);
console.log(`Meldungen ohne aufloesbares Team (nicht als Bewegung gezaehlt): ${mean(jahre.map(y => mean(spielJahr[y].map(x => x.ohneTeam || 0)))).toFixed(1)} je Saison`);

if (DETAIL) {
    console.log('\nWECHSLER im ersten Durchlauf:');
    for (const y of jahre) {
        const w = (spielJahr[y][0] || {}).wechsler || [];
        console.log(`  ${y}: ${w.length ? w.join(' · ') : '(keine)'}`);
    }
}

dekadenTabelle(realJahr, 'REAL (F1DB, Indy raus) — Zielkurve je Dekade');
console.log('\nHinweis: ab Saison 2 ist der Kader generiert — verglichen wird das NIVEAU,');
console.log('nicht die Identitaet einzelner Fahrer.');
