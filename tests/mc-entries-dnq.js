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

const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
const sd = a => { if (!a.length) return 0; const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) ** 2))); };
const f1 = (v, w = 5) => v.toFixed(1).padStart(w);
const pc = (a, b) => b ? (a / b * 100).toFixed(0) + '%' : '—';

// ── Sammelbehaelter ─────────────────────────────────────────────────────────
// Jahr -> Kennzahlen; zusaetzlich Strecken-, Fahrer- und Teamsicht.
const perYear = {};
const perTrack = {};      // `${jahr}|${cid}` -> { ent:[], dnq:[], dnpq:[] }
const perDriver = {};     // name -> { ent, starts, dnq, dnpq, teams:Set }
const perTeam = {};       // name -> { raceEntries, cars, dnq, races }
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

    const dName = {}, dTeam = {};
    for (const d of (ctx.GAME_STATE.drivers || [])) dName[d.id] = d.name;
    const tName = {};
    for (const t of (ctx.GAME_STATE.teams || [])) tName[t.id] = t.name;
    for (const d of (ctx.GAME_STATE.drivers || [])) dTeam[d.id] = tName[d.team] || '(ohne Team)';

    for (let i = 0; i < races.length; i++) {
        const race = races[i];
        const isIndy = race.isIndy || (race.name && race.name.includes('Indianapolis'));
        let result = null;
        try {
            ctx.simulateTraining(i);
            const isRain = Math.random() < (ctx.SIM_CONFIG?.rainProbability ?? 0.15);
            ctx.simulateQualifying(i, isRain);
            result = ctx.simulateRace(i, isRain);
            if (!result) continue;
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
        const carsOf = {};
        const note = (id, kind) => {
            const nm = dName[id] || id, tm = dTeam[id] || '(ohne Team)';
            const D = perDriver[nm] = perDriver[nm] || { ent: 0, starts: 0, dnq: 0, dnpq: 0, teams: new Set() };
            D.ent++; D[kind]++; D.teams.add(tm);
            carsOf[tm] = (carsOf[tm] || 0) + 1;
            const TT = perTeam[tm] = perTeam[tm] || { raceEntries: 0, cars: 0, dnq: 0, dnpq: 0 };
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
        Object.keys(carsOf).forEach(tm => { perTeam[tm].raceEntries++; });
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
console.log(`\nFAHRER — Top 15 nach Meldungen (Ø je Sim, ${okSims} Sims)`);
console.log('Fahrer                    │ Meld │ Start │  DNQ │ DNPQ │ DNQ-Quote │ Teams');
console.log('─'.repeat(86));
Object.entries(perDriver).sort((a, b) => b[1].ent - a[1].ent).slice(0, 15).forEach(([nm, D]) => {
    console.log(`${nm.padEnd(25).slice(0, 25)} │ ${f1(D.ent / okSims, 4)} │ ${f1(D.starts / okSims, 5)} │ ${f1(D.dnq / okSims, 4)} │ ${f1(D.dnpq / okSims, 4)} │ ${pc(D.dnq + D.dnpq, D.ent).padStart(9)} │ ${[...D.teams].slice(0, 2).join(', ')}`);
});

console.log(`\nTEAMS — nach Meldungen (Ø je Sim)`);
console.log('Team                      │ Rennen │ Ø Autos │ Meld │  DNQ │ DNQ-Quote');
console.log('─'.repeat(78));
Object.entries(perTeam).sort((a, b) => b[1].cars - a[1].cars).slice(0, 20).forEach(([nm, T]) => {
    console.log(`${nm.padEnd(25).slice(0, 25)} │ ${f1(T.raceEntries / okSims, 6)} │ ${f1(T.raceEntries ? T.cars / T.raceEntries : 0, 7)} │ ${f1(T.cars / okSims, 4)} │ ${f1(T.dnq / okSims, 4)} │ ${pc(T.dnq + T.dnpq, T.cars).padStart(9)}`);
});

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
