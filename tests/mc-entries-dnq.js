// mc-entries-dnq.js — Monte Carlo fuer MELDUNGEN, DNQ und Einzelauswahl
//
// WOZU, wenn es schon dnq-entrant-diagnosis.js gibt:
//   Jene Skripte messen den Melde-Zwischenstand aus `expandSeasonData` — also nur,
//   was VOR der Saison geplant wird. Dieses hier faehrt die **echte Renn-Pipeline**
//   (simulateTraining -> simulateQualifying -> simulateRace -> applyRaceResults),
//   sieht damit auch Vor-Qualifikation, Grid-Fueller und Ausfaelle, und kann
//   ueber `--saisons=N` in den FORTGESETZTEN Fall laufen.
//
//   Genau der ist bisher nirgends vermessen (DNQ_MELDEPLAN.md Abschnitt 14.3):
//   `fillGridEntries` und die Kaderlogik greifen erst dort, und laut Abschnitt 4.1
//   schrumpft der Kader ueber die Jahre auf exakt zwei Fahrer je Team. Ob die
//   Meldeliste dann noch stimmt, weiss niemand — dieses Skript beantwortet es.
//
// AUFRUF
//   node tests/mc-entries-dnq.js 1952 30
//   node tests/mc-entries-dnq.js 1975 20 --saisons=6        (fortgesetzter Fall)
//   node tests/mc-entries-dnq.js 1952 30 --strecken         (Tabelle je Strecke)
//   node tests/mc-entries-dnq.js 1965 20 --fahrer=Bonnier   (ein Fahrer im Detail)
//   node tests/mc-entries-dnq.js 1965 20 --team=Cooper      (ein Team im Detail)
//   SIMCORE_FROM_INDEX=1 davorsetzen, um die unkommittete index.html zu messen.
//
// DEFINITIONEN (bewusst wie in der F1DB-Referenz)
//   Meldung = Starter + DNQ + DNPQ. Wer in der Vor-Quali scheiterte, hat gemeldet.
//   Indy-Rennen sind ueberall ausgeschlossen — anderes Starterfeld, eigene Regeln.
//
// ⚠ In fortgesetzten Saisons ist der Kader GENERIERT. Der Vergleich gegen F1DB
//   trifft dort nur noch Niveau und Form, nicht die Identitaet einzelner Fahrer.
'use strict';
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');

// ── Argumente ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const num = argv.filter(a => /^\d+$/.test(a)).map(Number);
const opt = k => { const a = argv.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=').slice(1).join('=') : null; };
const YEAR = num[0] || 1952;
const SIMS = num[1] || 20;
const SEASONS = Number(opt('saisons') || 1);
const FAHRER = opt('fahrer');
const TEAM = opt('team');
const SHOW_TRACKS = argv.includes('--strecken');
const LISTE = argv.includes('--liste');

// ── Reale Referenz (F1DB) ───────────────────────────────────────────────────
const BASE = path.join(__dirname, '..', 'f1db-json-splitted');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
const roundCircuit = {};
for (const r of J('f1db-races.json')) {
    roundCircuit[`${r.year}_${r.round}`] =
        r.grandPrixId === 'indianapolis' ? null : String(r.circuitId || '').toLowerCase();
}
const realEnt = {}, realStart = {};
for (const e of J('f1db-seasons-entrants-drivers.json')) {
    if (e.testDriver) continue;
    for (const rd of (e.rounds || [])) {
        const cid = roundCircuit[`${e.year}_${rd}`]; if (!cid) continue;
        ((realEnt[e.year] = realEnt[e.year] || {})[cid] = realEnt[e.year][cid] || new Set()).add(e.driverId);
    }
}
for (const g of J('f1db-races-starting-grid-positions.json')) {
    const cid = roundCircuit[`${g.year}_${g.round}`]; if (!cid) continue;
    ((realStart[g.year] = realStart[g.year] || {})[cid] = realStart[g.year][cid] || new Set()).add(g.driverId);
}

// Reale Meldungen JE FAHRER und JE KONSTRUKTEUR — die Gesamtliste.
//   Fahrer      = Zahl der Runden, an denen er gemeldet war (Indy raus)
//   Konstrukteur= Summe der Wagen ueber alle Runden ("1974: 30 x McLaren")
const realDrv = {}, realTeam = {}, realDrvName = {};
{
    const seen = {};   // `${y}|${cid}|${constructor}` -> Set(driver), gegen Doppelzaehlung
    for (const e of J('f1db-seasons-entrants-drivers.json')) {
        if (e.testDriver) continue;
        for (const rd of (e.rounds || [])) {
            const cid = roundCircuit[`${e.year}_${rd}`]; if (!cid) continue;
            const dk = `${e.year}|${cid}|${e.driverId}`;
            if (!seen[dk]) { seen[dk] = 1; (realDrv[e.year] = realDrv[e.year] || {})[e.driverId] = (realDrv[e.year][e.driverId] || 0) + 1; }
            const tk = `${e.year}|${cid}|${e.constructorId}|${e.driverId}`;
            if (!seen[tk]) { seen[tk] = 1; (realTeam[e.year] = realTeam[e.year] || {})[e.constructorId] = (realTeam[e.year][e.constructorId] || 0) + 1; }
        }
    }
}
for (const d of J('f1db-drivers.json')) realDrvName[d.id] = d.name;

// Teamname -> F1DB-constructorId. Dieselbe Normalisierung wie in
// dnq-lever-dryrun.js (dort ueber 1950-89 zu 100 % gemappt, 0 Miss).
// Noetig, weil team.histId ein Anzeigename ist ("McLaren"), keine Slug-Id.
const normId = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const nameToCid = {}, cidName = {};
for (const c of J('f1db-constructors.json')) {
    nameToCid[normId(c.name)] = c.id; nameToCid[normId(c.fullName)] = c.id;
    cidName[c.id] = c.name;
}

const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
const sd = a => { if (!a.length) return 0; const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) ** 2))); };
const f1 = (v, w = 5) => v.toFixed(1).padStart(w);
const pc = (a, b) => b ? (a / b * 100).toFixed(0) + '%' : '—';

// ── Sammelbehaelter ─────────────────────────────────────────────────────────
// Jahr -> Kennzahlen; zusaetzlich Strecken-, Fahrer- und Teamsicht.
const perYear = {};
const perTrack = {};      // `${jahr}|${cid}` -> { ent:[], dnq:[], dnpq:[] }
// Schluessel enthalten das JAHR und eine zuordenbare Id, damit gegen F1DB
// verglichen werden kann: Fahrer ueber histId (exakt der F1DB-Slug), Teams ueber
// die Namensnormalisierung. Generierte ohne Entsprechung bekommen `gen:`.
const perDriver = {};     // `${jahr}|${key}` -> { name, hist, ent, starts, dnq, dnpq, teams:Set }
const perTeam = {};       // `${jahr}|${key}` -> { name, cid, raceEntries, cars, dnq, dnpq }
const detailRows = [];    // Zeilen fuer --fahrer / --team

function yearBucket(y) {
    return perYear[y] = perYear[y] || {
        ent: [], dnq: [], dnpq: [], starters: [], teamsPerRace: [],
        carsPerTeam: [], c1: 0, c2: 0, c3: 0, cT: 0, races: 0
    };
}

// ── Eine Saison durchsimulieren und auswerten ───────────────────────────────
function runSeason(ctx, simIdx) {
    const y = ctx.GAME_STATE.currentYear;
    const races = ctx.GAME_STATE.races || [];
    const B = yearBucket(y);

    // Fahrer- und Teamauflösung wird VOR JEDEM RENNEN neu gebaut, nicht einmal je
    // Saison: der Kader aendert sich waehrend der Saison (Grid-Fueller, Gastfahrer,
    // Nachverpflichtungen). Mit einer Momentaufnahme vom Saisonstart landeten diese
    // Meldungen faelschlich unter „(ohne Team)" — gemessen 32 je Saison in 1974.
    let dName = {}, dTeam = {}, dHist = {}, tName = {}, tKeyOf = {};
    const refreshRoster = () => {
        dName = {}; dTeam = {}; dHist = {}; tName = {}; tKeyOf = {};
        for (const t of (ctx.GAME_STATE.teams || [])) {
            tName[t.id] = t.name;
            // histId ist hier ein Anzeigename ("McLaren"), kein Slug — deshalb ueber
            // beide Formen gegen f1db-constructors auffloesen, wie im L1-Trockenlauf.
            tKeyOf[t.id] = nameToCid[normId(t.histId)] || nameToCid[normId(t.name)] || null;
        }
        for (const d of (ctx.GAME_STATE.drivers || [])) {
            dName[d.id] = d.name; dTeam[d.id] = d.team || null;
            // histId KLEINSCHREIBEN vor dem Abgleich: im Spiel steht „john-Watson"
            // mit grossem W, f1db kennt nur „john-watson". Ohne das erschien Watson
            // gleichzeitig als „meldet im Spiel NICHT" (real 15) UND als „nur im
            // Spiel" (14,1) — derselbe Fahrer auf beiden Seiten der Tabelle.
            dHist[d.id] = d.histId ? String(d.histId).toLowerCase() : null;
        }
    };

    for (let i = 0; i < races.length; i++) {
        const race = races[i];
        const isIndy = race.isIndy || (race.name && race.name.includes('Indianapolis'));
        let result = null;
        try {
            // [SYNC Rennwochenende] Gastauftritte VOR der Meldeliste — im Spiel steht
            // der Aufruf an allen drei Stellen vor simulateTraining. Fehlte er hier,
            // meldete das Skript die Gastfahrer beim falschen Team (bzw. gar nicht).
            if (typeof ctx.applyGuestMoves === 'function') ctx.applyGuestMoves(i);
            ctx.simulateTraining(i);
            const isRain = Math.random() < (ctx.SIM_CONFIG?.rainProbability ?? 0.15);
            ctx.simulateQualifying(i, isRain);
            result = ctx.simulateRace(i, isRain);
            if (!result) continue;
            // Kader ZWISCHEN Rennen und Auswertung einlesen: nach simulateRace steht
            // die Meldeliste fest, aber applyRaceResults zieht schon die FOLGEN nach
            // (Vertragsende, Tod, Teamwechsel). Wer danach eingelesen wird, hat sein
            // Team womoeglich wegen dieses Rennens verloren und landete faelschlich
            // unter „(ohne Team)" — gemessen 2,6 je Saison 1974 (Jabouille, Redman).
            refreshRoster();
            ctx.applyRaceResults(result);
        } catch (e) { continue; }
        if (isIndy) continue;

        const starters = result.results || [];
        const dnq = result.dnq || [];
        const dnpq = result.dnpq || [];
        const entries = starters.length + dnq.length + dnpq.length;
        const cid = String(race.circuitId || '').toLowerCase();

        B.ent.push(entries); B.dnq.push(dnq.length); B.dnpq.push(dnpq.length);
        B.starters.push(starters.length); B.races++;

        const T = perTrack[`${y}|${cid}`] = perTrack[`${y}|${cid}`] || { ent: [], dnq: [], dnpq: [] };
        T.ent.push(entries); T.dnq.push(dnq.length); T.dnpq.push(dnpq.length);

        // Fahrer- und Teamsicht
        const carsOf = {};                       // teamId -> Wagen in diesem Rennen
        const note = (id, kind) => {
            const nm = dName[id] || id;
            const tid = dTeam[id];
            const tm = tid ? (tName[tid] || tid) : '(ohne Team)';
            const dk = `${y}|${dHist[id] || 'gen:' + nm}`;
            const D = perDriver[dk] = perDriver[dk] || { name: nm, hist: dHist[id] || null, ent: 0, starts: 0, dnq: 0, dnpq: 0, teams: new Set() };
            D.ent++; D[kind]++; D.teams.add(tm);
            if (tid) carsOf[tid] = (carsOf[tid] || 0) + 1;
            const tk = `${y}|${tid ? (tKeyOf[tid] || 'gen:' + tm) : 'gen:ohne'}`;
            const TT = perTeam[tk] = perTeam[tk] || { name: tm, cid: tid ? tKeyOf[tid] : null, raceEntries: 0, cars: 0, dnq: 0, dnpq: 0 };
            TT.cars++; if (kind === 'dnq') TT.dnq++; if (kind === 'dnpq') TT.dnpq++;
            if (matches(nm, FAHRER) || matches(tm, TEAM)) {
                detailRows.push({ sim: simIdx, y, cid, nm, tm,
                    kind: kind === 'starts' ? 'Start' : kind.toUpperCase() });
            }
        };
        starters.forEach(r => note(r.driver, 'starts'));
        dnq.forEach(id => note(id, 'dnq'));
        dnpq.forEach(id => note(id, 'dnpq'));

        const sizes = Object.values(carsOf);
        B.teamsPerRace.push(sizes.length);
        B.carsPerTeam.push(mean(sizes));
        sizes.forEach(n => { B.cT++; if (n === 1) B.c1++; else if (n === 2) B.c2++; else B.c3++; });
        Object.keys(carsOf).forEach(tid => {
            const tk = `${y}|${tKeyOf[tid] || 'gen:' + (tName[tid] || tid)}`;
            if (perTeam[tk]) perTeam[tk].raceEntries++;
        });
    }
}
function matches(name, needle) {
    return !!needle && String(name).toLowerCase().includes(String(needle).toLowerCase());
}

// ── Hauptschleife ───────────────────────────────────────────────────────────
const ctx = getContext();
console.log(`\n${'═'.repeat(78)}`);
console.log(`  MC MELDUNGEN & DNQ  |  ab ${YEAR}  |  ${SIMS} Sims × ${SEASONS} Saison(en)`);
console.log(`  Volle Renn-Pipeline (Training → Quali → Rennen). Indy ausgeschlossen.`);
console.log(`${'═'.repeat(78)}\n`);

let okSims = 0;
const step = Math.max(1, Math.floor(SIMS / 10));
for (let s = 0; s < SIMS; s++) {
    if (s % step === 0) process.stdout.write(`  ${Math.round(s / SIMS * 100)}%... `);
    try {
        ctx.initFromYear(YEAR);
        for (let k = 0; k < SEASONS; k++) {
            runSeason(ctx, s);
            if (k === SEASONS - 1) break;
            // Saison-Uebergang: EXAKT die Kette aus monte-carlo-multi.js.
            // Nicht abkuerzen — sie ist dort gegen die Phase-4-Pruefungen verifiziert.
            const y = ctx.GAME_STATE.currentYear;
            if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
            if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
            if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
            if (typeof ctx.initReservePool === 'function') ctx.initReservePool(y + 1);
            if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(y + 1);
            if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        okSims++;
    } catch (e) { /* Sim verwerfen */ }
}
console.log(`100%\n`);
if (!okSims) { console.log('Kein Durchlauf erfolgreich — Jahr pruefen.'); process.exit(1); }

// ── Bericht: je Saisonjahr ──────────────────────────────────────────────────
console.log(`MELDUNGEN JE RENNEN  (${okSims} erfolgreiche Sims)`);
console.log('Jahr │ Ø Meld │  real │    Δ  │ Ø Starter │ Ø DNQ │ real │ Ø DNPQ │ SD Strecken¹');
console.log('─'.repeat(86));
const years = Object.keys(perYear).map(Number).sort((a, b) => a - b);
for (const y of years) {
    const B = perYear[y];
    const rEnt = [], rDnq = [];
    for (const cid in (realEnt[y] || {})) {
        rEnt.push(realEnt[y][cid].size);
        rDnq.push(Math.max(0, realEnt[y][cid].size - ((realStart[y] || {})[cid] || { size: 0 }).size));
    }
    // SD ueber die Strecken, SYSTEMATISCHER Anteil: erst je Strecke ueber die Sims
    // mitteln, dann die Streuung dieser Mittelwerte. Der Zufall mittelt sich dabei
    // weg — uebrig bleibt, wie stark die Strecke SELBST die Meldezahl treibt.
    // (Die Streuung einer EINZELNEN Saison ist groesser, weil Zufall dazukommt.)
    const trackMeans = Object.keys(perTrack).filter(k => k.startsWith(`${y}|`))
        .map(k => mean(perTrack[k].ent));
    const dText = rEnt.length ? ((mean(B.ent) - mean(rEnt) >= 0 ? '+' : '') + (mean(B.ent) - mean(rEnt)).toFixed(1)).padStart(5) : '    —';
    console.log(`${y} │ ${f1(mean(B.ent), 6)} │ ${rEnt.length ? f1(mean(rEnt)) : '    —'} │ ${dText} │ ${f1(mean(B.starters), 9)} │ ${f1(mean(B.dnq))} │ ${rDnq.length ? f1(mean(rDnq), 4) : '   —'} │ ${f1(mean(B.dnpq), 6)} │ ${f1(sd(trackMeans), 11)}`);
}

console.log(`\nWAGENZAHL JE KONSTRUKTEUR`);
console.log('Jahr │ Ø Autos/Team │ Ø Teams │ Anteil Team-Rennen mit 1 / 2 / 3+ Autos');
console.log('─'.repeat(78));
for (const y of years) {
    const B = perYear[y];
    console.log(`${y} │ ${f1(mean(B.carsPerTeam), 12)} │ ${f1(mean(B.teamsPerRace), 7)} │ ${pc(B.c1, B.cT).padStart(8)} ${pc(B.c2, B.cT).padStart(6)} ${pc(B.c3, B.cT).padStart(6)}`);
}

if (SHOW_TRACKS) {
    console.log(`\nJE STRECKE  (Ø ueber die Sims)`);
    console.log('Jahr Strecke              │ Ø Meld │ real │    Δ  │ Ø DNQ │ real');
    console.log('─'.repeat(78));
    for (const key of Object.keys(perTrack)) {
        const [ys, cid] = key.split('|');
        const T = perTrack[key], y = Number(ys);
        const rE = (realEnt[y] || {})[cid];
        const rD = rE ? Math.max(0, rE.size - (((realStart[y] || {})[cid]) || { size: 0 }).size) : null;
        const d = rE ? mean(T.ent) - rE.size : null;
        console.log(`${ys} ${cid.padEnd(20).slice(0, 20)} │ ${f1(mean(T.ent), 6)} │ ${rE ? String(rE.size).padStart(4) : '   —'} │ ${d === null ? '    —' : ((d >= 0 ? '+' : '') + d.toFixed(1)).padStart(5)} │ ${f1(mean(T.dnq))} │ ${rD === null ? '   —' : String(rD).padStart(4)}`);
    }
}

// ── Fahrer- und Teamsicht ───────────────────────────────────────────────────
const totalRaces = years.reduce((s, y) => s + perYear[y].races, 0);

// ── GESAMTLISTE: jede Meldung gegen F1DB ────────────────────────────────────
// „1974: 14x Ronnie Peterson, 30x McLaren" — Spiel gegen real, vollstaendig.
// Drei Sorten Zeile, und die dritte ist die interessante:
//   beide   → Δ zeigt, ob die Meldezahl stimmt
//   nur Spiel → erfunden bzw. generiert (in fortgesetzten Saisons normal)
//   nur real  → dieser Fahrer/Konstrukteur MELDET IM SPIEL GAR NICHT
for (const y of years) {
    const rD = realDrv[y] || {}, rT = realTeam[y] || {};
    const gD = {}, gT = {};
    for (const k in perDriver) if (k.startsWith(`${y}|`)) gD[k.slice(String(y).length + 1)] = perDriver[k];
    for (const k in perTeam) if (k.startsWith(`${y}|`)) gT[k.slice(String(y).length + 1)] = perTeam[k];

    const drvRows = [];
    for (const key in gD) drvRows.push({ name: gD[key].name, g: gD[key].ent / okSims, r: (gD[key].hist && rD[gD[key].hist] != null) ? rD[gD[key].hist] : null, D: gD[key] });
    for (const id in rD) if (!(id in gD)) drvRows.push({ name: realDrvName[id] || id, g: null, r: rD[id], D: null });

    const teamRows = [];
    for (const key in gT) teamRows.push({ name: gT[key].name, g: gT[key].cars / okSims, r: (gT[key].cid && rT[gT[key].cid] != null) ? rT[gT[key].cid] : null, T: gT[key] });
    for (const id in rT) if (!(id in gT)) teamRows.push({ name: cidName[id] || id, g: null, r: rT[id], T: null });

    // EINE Tabelle statt zweier: der Real-Vergleich steht in derselben Zeile wie
    // Start/DNQ. Frueher lagen die auffaelligen Fahrer-/Teamtabellen ohne real-Spalte
    // vorn und der Abgleich in einer leicht zu ueberlesenden Zeile — dadurch sah es
    // aus, als gaebe es gar keinen Vergleich.
    const bySize = (a, b) => (b.r ?? -1) - (a.r ?? -1) || (b.g ?? -1) - (a.g ?? -1);
    const dText = x => (x.g !== null && x.r !== null)
        ? ((x.g - x.r >= 0 ? '+' : '') + (x.g - x.r).toFixed(1)).padStart(5) : '    —';
    const tag = x => x.g === null ? ' ← meldet im Spiel NICHT' : x.r === null ? ' ← nur im Spiel' : '';
    // Ohne --liste gekuerzt, aber „meldet im Spiel NICHT" bleibt IMMER sichtbar —
    // das ist der wichtigste Befund und darf nicht der Kuerzung zum Opfer fallen.
    const cut = rows => {
        if (LISTE) return rows;
        const keep = rows.filter(x => x.g === null);
        const rest = rows.filter(x => x.g !== null).slice(0, 20);
        return rows.filter(x => keep.includes(x) || rest.includes(x));
    };

    console.log(`\nFAHRER-MELDUNGEN ${y} — Spiel (Ø ${okSims} Sims) gegen F1DB`);
    console.log('Fahrer                    │ Spiel │ real │   Δ   │ Start │  DNQ │ DNPQ');
    console.log('─'.repeat(92));
    drvRows.sort(bySize);
    cut(drvRows).forEach(x => {
        const D = x.D;
        console.log(`${x.name.padEnd(25).slice(0, 25)} │ ${x.g === null ? '    —' : f1(x.g)} │ ${x.r === null ? '   —' : String(x.r).padStart(4)} │ ${dText(x)} │ ` +
            `${D ? f1(D.starts / okSims) : '    —'} │ ${D ? f1(D.dnq / okSims, 4) : '   —'} │ ${D ? f1(D.dnpq / okSims, 4) : '   —'}${tag(x)}`);
    });
    if (!LISTE && drvRows.filter(x => x.g !== null).length > 20)
        console.log(`  … ${drvRows.filter(x => x.g !== null).length - 20} weitere — vollstaendig mit --liste`);

    console.log(`\nKONSTRUKTEUR-MELDUNGEN ${y} (Wagen ueber die Saison) — Spiel gegen F1DB`);
    console.log('Konstrukteur              │ Spiel │ real │   Δ   │ Rennen │ Ø Autos │  DNQ');
    console.log('─'.repeat(92));
    teamRows.sort(bySize);
    cut(teamRows).forEach(x => {
        const T = x.T;
        console.log(`${x.name.padEnd(25).slice(0, 25)} │ ${x.g === null ? '    —' : f1(x.g)} │ ${x.r === null ? '   —' : String(x.r).padStart(4)} │ ${dText(x)} │ ` +
            `${T ? f1(T.raceEntries / okSims, 6) : '     —'} │ ${T ? f1(T.raceEntries ? T.cars / T.raceEntries : 0, 7) : '      —'} │ ${T ? f1(T.dnq / okSims, 4) : '   —'}${tag(x)}`);
    });
    if (!LISTE && teamRows.filter(x => x.g !== null).length > 20)
        console.log(`  … ${teamRows.filter(x => x.g !== null).length - 20} weitere — vollstaendig mit --liste`);

    const sum = (rows, k) => rows.reduce((s, x) => s + (x[k] ?? 0), 0);
    const miss = drvRows.filter(x => x.g === null).length, extra = drvRows.filter(x => x.r === null).length;
    console.log(`\nSumme ${y}: Fahrer-Meldungen Spiel ${sum(drvRows, 'g').toFixed(0)} / real ${sum(drvRows, 'r')}` +
                ` · Konstrukteur-Wagen Spiel ${sum(teamRows, 'g').toFixed(0)} / real ${sum(teamRows, 'r')}`);
    console.log(`         ${drvRows.length - miss - extra} Fahrer in beiden · ${miss} nur real · ${extra} nur im Spiel`);
}

// ── Einzelauswahl ───────────────────────────────────────────────────────────
if (FAHRER || TEAM) {
    const label = FAHRER ? `Fahrer „${FAHRER}"` : `Team „${TEAM}"`;
    console.log(`\nEINZELAUSWAHL — ${label}`);
    if (!detailRows.length) {
        console.log('  Kein Treffer. Der Name wird als Teilstring gesucht (Gross/Klein egal).');
    } else {
        // Pro Fahrer+Strecke zusammenfassen: wie oft Start / DNQ / DNPQ ueber die Sims.
        const agg = {};
        for (const r of detailRows) {
            const k = `${r.nm}|${r.y}|${r.cid}`;
            const A = agg[k] = agg[k] || { nm: r.nm, tm: r.tm, y: r.y, cid: r.cid, Start: 0, DNQ: 0, DNPQ: 0 };
            A[r.kind]++;
        }
        console.log('Fahrer                 Jahr Strecke              │ Start │  DNQ │ DNPQ │ Meldequote');
        console.log('─'.repeat(92));
        Object.values(agg).sort((a, b) => a.nm.localeCompare(b.nm) || a.y - b.y || a.cid.localeCompare(b.cid))
            .forEach(A => {
                const tot = A.Start + A.DNQ + A.DNPQ;
                console.log(`${A.nm.padEnd(22).slice(0, 22)} ${A.y} ${A.cid.padEnd(20).slice(0, 20)} │ ${String(A.Start).padStart(5)} │ ${String(A.DNQ).padStart(4)} │ ${String(A.DNPQ).padStart(4)} │ ${pc(tot, okSims).padStart(10)}`);
            });
        console.log(`\n„Meldequote" = in wie viel Prozent der ${okSims} Sims der Fahrer dort ueberhaupt gemeldet hat.`);
    }
}

console.log(`\n${'─'.repeat(78)}`);
console.log(`Meldung = Starter + DNQ + DNPQ. Indy ausgeschlossen. ${totalRaces} Rennen ausgewertet.`);
if (SEASONS > 1) {
    console.log(`⚠ Ab der zweiten Saison ist der Kader GENERIERT — der real-Vergleich trifft`);
    console.log(`  dort Niveau und Form, nicht die Identitaet einzelner Fahrer.`);
}
