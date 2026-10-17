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
//
// ARTEN (seit v0.9.21.14, Quoten-Modell BEWEGUNG_QUOTEN in index.html): jede Folge von
// Rennen ausserhalb des Mehrheits-Teams ist eine Episode —
//   Wechsel     = davor ODER danach beim Stammteam, nicht beides (kein Zurueck)
//   hin+zurueck = davor UND danach beim Stammteam
//   Debuet      = die Episode enthaelt das erste Rennen der Karriere
// gezaehlt je 100 Cockpit-Saisons (Cockpit = Melder je Rennen im Saisonmittel), damit die
// Zahl nicht an der Feldgroesse haengt. Spiel und F1DB laufen durch DIESELBE Funktion.
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

// Mehrheit wie in build-guest-entries.js: meiste Rennen, bei Gleichstand das Team der spaeteren.
function episoden(seq, debutIdx) {   // seq: [[ordnung, team], ...] sortiert; debutIdx: Index in seq oder -1
    const zahl = {}, letzte = {};
    seq.forEach(([, t], i) => { zahl[t] = (zahl[t] || 0) + 1; letzte[t] = i; });
    const teams = Object.keys(zahl);
    if (teams.length < 2) return [];
    const heim = teams.sort((a, b) => zahl[b] - zahl[a] || letzte[b] - letzte[a])[0];
    const out = []; let ep = null;
    seq.forEach(([, t], i) => {
        if (t === heim) { ep = null; return; }
        if (!ep || ep.t !== t) { ep = { t, von: i, bis: i }; out.push(ep); } else ep.bis = i;
    });
    return out.map(e => {
        const vor = seq.slice(0, e.von).some(x => x[1] === heim), nach = seq.slice(e.bis + 1).some(x => x[1] === heim);
        const typ = (debutIdx >= e.von && debutIdx <= e.bis) ? 'D' : (vor && nach) ? 'H' : 'W';
        return { typ, len: e.bis - e.von + 1 };
    });
}
const realArten = {};   // Jahr -> { W, H, D, cockpits }
{
    const S = {}, erst = {};
    const rc = {};
    for (const r of J('f1db-races.json')) if (r.grandPrixId !== 'indianapolis') rc[`${r.year}_${r.round}`] = true;
    for (const e of J('f1db-seasons-entrants-drivers.json')) {
        if (e.testDriver) continue;
        for (const rd of (e.rounds || [])) {
            if (!rc[`${e.year}_${rd}`]) continue;
            ((S[e.year] = S[e.year] || {})[e.driverId] = S[e.year][e.driverId] || {})[rd] = e.constructorId;
            const k = e.year * 100 + rd; if (!erst[e.driverId] || k < erst[e.driverId]) erst[e.driverId] = k;
        }
    }
    for (const y of Object.keys(S)) {
        const z = realArten[y] = { W: 0, H: 0, D: 0, cockpits: 0 }, proR = {};
        for (const d of Object.keys(S[y])) {
            const rs = Object.keys(S[y][d]).map(Number).sort((a, b) => a - b);
            rs.forEach(r => proR[r] = (proR[r] || 0) + 1);
            const seq = rs.map(r => [r, S[y][d][r]]);
            const di = Math.floor(erst[d] / 100) == y ? rs.indexOf(erst[d] % 100) : -1;
            for (const e of episoden(seq, di)) z[e.typ]++;
        }
        const v = Object.values(proR); z.cockpits = v.reduce((a, b) => a + b, 0) / (v.length || 1);
    }
}
function artenTabelle(quelle, jahre, titel) {
    const D = {};
    for (const y of jahre) {
        const q = quelle[y]; if (!q) continue;
        const k = Math.floor(y / 10) * 10, L = [].concat(q);
        const z = (D[k] = D[k] || { W: 0, H: 0, D: 0, c: 0 });
        for (const x of L) { z.W += x.W; z.H += x.H; z.D += x.D; z.c += x.cockpits; }
    }
    console.log(`
${titel}`);
    console.log('Dekade │ Wechsel │ hin+zurück │ Debüt woanders   (je 100 Cockpit-Saisons)');
    console.log('─'.repeat(64));
    for (const k of Object.keys(D).map(Number).sort((a, b) => a - b)) {
        const z = D[k], q = n => (100 * n / (z.c || 1)).toFixed(1).padStart(5);
        console.log(`${String(k).padStart(6)} │ ${q(z.W).padStart(7)} │ ${q(z.H).padStart(10)} │ ${q(z.D).padStart(8)}`);
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
    artenTabelle(realArten, Object.keys(realArten).map(Number), 'REAL (F1DB) — Arten je Dekade');
    process.exit(0);
}

// ── Spiel messen ────────────────────────────────────────────────────────────
const { getContext } = require('./sim-core');
const ctx = getContext();

const spielJahr = {};   // Jahr -> Liste je Sim
let gesehen = new Set();   // Fahrer, die in diesem Lauf schon gemeldet haben (Debuet-Erkennung)
function runSeason() {
    const y = ctx.GAME_STATE.currentYear;
    const races = ctx.GAME_STATE.races || [];
    const proFahrer = {};   // driverId -> teamName -> Rennen
    const folge = {};       // driverId -> [[rennen, teamName], ...]
    let melderSumme = 0, rennenGezaehlt = 0;
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
        melderSumme += alle.length; rennenGezaehlt++;
        for (const id of alle) {
            // Meldungen OHNE Team zaehlen nicht als Bewegung — sonst sieht jede
            // Luecke in der Kaderaufloesung wie ein Teamwechsel aus.
            if (!dTeam[id]) { ohneTeam++; continue; }
            const tm = tName[dTeam[id]] || dTeam[id];
            namen[id] = dName[id] || id;
            const P = proFahrer[id] = proFahrer[id] || {};
            P[tm] = (P[tm] || 0) + 1;
            (folge[id] = folge[id] || []).push([i, tm]);
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
    if (mm && mm.year === y) for (const id in (mm.plan || {})) geplant += (mm.plan[id].rennen || mm.plan[id].circuits || []).length;
    const ziel = (mm && mm.year === y) ? (mm.events || []).length : 0;   // gewuerfelte Ereignisse
    let ist = 0;
    if (mm && mm.year === y) for (const k in (mm.zaehler || {})) ist += Math.min(mm.zaehler[k].h || 0, mm.zaehler[k].w || 0);
    const arten = { W: 0, H: 0, D: 0, cockpits: rennenGezaehlt ? melderSumme / rennenGezaehlt : 0 };
    for (const id of Object.keys(folge)) {
        // Debuet: im Lauf noch nie gesehen und (Saison 1 eines historischen Starts) reales Debuetjahr
        const d = (ctx.GAME_STATE.drivers || []).find(x => x.id === id) || (ctx.GAME_STATE.reservePool || []).find(x => x.id === id);
        const dj = d && typeof ctx.getF1DebutYear === 'function' ? ctx.getF1DebutYear(d) : null;
        const neu = !gesehen.has(id) && (dj == null || dj >= y);
        for (const e of episoden(folge[id], neu ? 0 : -1)) arten[e.typ]++;
    }
    for (const id of Object.keys(folge)) gesehen.add(id);
    (spielJahr[y] = spielJahr[y] || []).push({ multi, minderheit, wechsler, geplant, ohneTeam, ziel, ist, arten });
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
        gesehen = new Set();
        for (let k = 0; k < SEASONS; k++) {
            runSeason();
            if (k === SEASONS - 1) break;
            // Saison-Uebergang: EXAKT die Kette aus monte-carlo-multi.js.
            const y = ctx.GAME_STATE.currentYear;
            // Saisonwechsel wie im Spiel (27.09.2026): die Hand-Kette lief doppelt, startNewSeason ruft
            // processSeasonEndEvents selbst noch einmal. Siehe tests/README.md „Saisonkette".
            ctx.processSeasonEndEvents();
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
console.log(`Quoten-Modell: Ø gewürfelte Ereignisse ${mean(jahre.map(y => mean(spielJahr[y].map(x => x.ziel || 0)))).toFixed(1)} · Ø Ist-Zaehler ${mean(jahre.map(y => mean(spielJahr[y].map(x => x.ist || 0)))).toFixed(1)}`);
console.log(`Meldungen ohne aufloesbares Team (nicht als Bewegung gezaehlt): ${mean(jahre.map(y => mean(spielJahr[y].map(x => x.ohneTeam || 0)))).toFixed(1)} je Saison`);

if (DETAIL) {
    console.log('\nWECHSLER im ersten Durchlauf:');
    for (const y of jahre) {
        const w = (spielJahr[y][0] || {}).wechsler || [];
        console.log(`  ${y}: ${w.length ? w.join(' · ') : '(keine)'}`);
    }
}

dekadenTabelle(realJahr, 'REAL (F1DB, Indy raus) — Zielkurve je Dekade');
{
    const sp = {};
    for (const y of jahre) sp[y] = spielJahr[y].map(x => x.arten);
    artenTabelle(sp, jahre, `SPIEL — Arten je Dekade (${ok} Sims)`);
    artenTabelle(realArten, jahre, 'REAL (F1DB) — dieselben Jahre');
}
console.log('\nHinweis: ab Saison 2 ist der Kader generiert — verglichen wird das NIVEAU,');
console.log('nicht die Identitaet einzelner Fahrer.');
