// dnq-entry-composition.js — WORAUS besteht die Meldeliste?
//
// Die Melde-SUMME stimmt nach L1/L3 weitgehend (DNQ_MELDEPLAN.md). Offen sind zwei
// Fragen, die eine Summe nicht beantworten kann:
//   1. Hat das Spiel die EINMAL-MELDER (Lokalstarter, die real genau ein Rennen
//      fuhren)? Real 3,3 je Rennen in den 50ern — fehlen sie, ist die Liste zwar
//      gleich lang, aber falsch zusammengesetzt.
//   2. Melden die Teams mit der richtigen WAGENZAHL? Real fuhren Konstrukteure in
//      den 50ern im Schnitt 3,8 Autos je Rennen, ab 1986 exakt 2.
//   3. Halten sich homeOnly-Fahrer wirklich an ihr Heimrennen?
//
// Ohne diese drei kann die Summe stimmen und das Feld trotzdem falsch aussehen:
// 20 Melder aus 10 Teams x 2 sind etwas anderes als 20 Melder aus 6 Teams x 2 plus
// 8 Lokalstarter — und nur das zweite erzeugt historisch richtige DNQ.
//
//   node tests/dnq-entry-composition.js               → 1950-1989 je Dekade
//   node tests/dnq-entry-composition.js 1990 2025     → anderer Bereich
//
// ACHTUNG: misst den FRISCH-SAISON-Fall (expandSeasonData). Eine fortgesetzte
// Saison nach vielen Spieljahren ist ein anderes Regime — dort greifen
// fillGridEntries und die Kaderlogik, die hier gar nicht laufen.
'use strict';
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');

const BASE = path.join(__dirname, '..', 'f1db-json-splitted');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
const N = Number(process.env.N_RUNS || 40);
const args = process.argv.slice(2).map(Number).filter(Boolean);
const Y0 = args[0] || 1950, Y1 = args[1] || 1989;

// ── Referenz ────────────────────────────────────────────────────────────────
const roundCircuit = {}, calOf = {};
for (const r of J('f1db-races.json')) {
    const cid = r.grandPrixId === 'indianapolis' ? null : String(r.circuitId || '').toLowerCase();
    roundCircuit[`${r.year}_${r.round}`] = cid;
    if (cid) (calOf[r.year] = calOf[r.year] || new Set()).add(cid);
}
// year -> circuitId -> constructorId -> Set(driverId)
const byRace = {}, drvRaces = {};
for (const e of J('f1db-seasons-entrants-drivers.json')) {
    if (e.testDriver) continue;
    for (const rd of (e.rounds || [])) {
        const cid = roundCircuit[`${e.year}_${rd}`]; if (!cid) continue;
        const R = ((byRace[e.year] = byRace[e.year] || {})[cid] = byRace[e.year][cid] || {});
        (R[e.constructorId] = R[e.constructorId] || new Set()).add(e.driverId);
        const D = (drvRaces[e.year] = drvRaces[e.year] || {});
        (D[e.driverId] = D[e.driverId] || new Set()).add(cid);
    }
}

const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
const pct = (a, b) => b ? (a / b * 100).toFixed(0) + '%' : '—';

// ── Spiel ───────────────────────────────────────────────────────────────────
const ctx = getContext();
const { expandSeasonData, privateerEntersRace, applyConstructorCarCap, isIndyOnlyConstructor } = ctx;
function isIndyDriver(d, teams) {
    if (d.isIndyOnly) return true;
    const t = teams.find(x => x.id === d.team);
    return !!t && (isIndyOnlyConstructor(t.id) || isIndyOnlyConstructor(t.histId));
}

const DEC = {};
for (let y = Y0; y <= Y1; y++) {
    if (!byRace[y] || !calOf[y]) continue;
    const d = Math.floor(y / 10) * 10;
    const A = (DEC[d] = DEC[d] || {
        gCars: [], rCars: [], g1: 0, g2: 0, g3: 0, gT: 0, r1: 0, r2: 0, r3: 0, rT: 0,
        gOnce: [], rOnce: [], gTeams: [], rTeams: [], hoTot: 0, hoHome: 0, hoDrv: 0, hoZero: 0
    });

    // — real —
    for (const cid of calOf[y]) {
        const R = byRace[y][cid]; if (!R) continue;
        const sizes = Object.values(R).map(s => s.size);
        A.rCars.push(mean(sizes)); A.rTeams.push(sizes.length);
        sizes.forEach(n => { A.rT++; if (n === 1) A.r1++; else if (n === 2) A.r2++; else A.r3++; });
        let once = 0;
        for (const c in R) for (const dr of R[c]) if (drvRaces[y][dr].size === 1) once++;
        A.rOnce.push(once);
    }

    // — Spiel —
    for (let k = 0; k < N; k++) {
        const s = expandSeasonData(y); if (!s) break;
        const cal = s.races.filter(r => !r.isIndy && r.circuitId);
        if (!cal.length) break;
        const lists = [], nRaces = {};
        for (const race of cal) {
            let a = s.drivers.filter(x => (!x.status || x.status === 'active') && x.team);
            a = a.filter(x => !isIndyDriver(x, s.teams));
            a = a.filter(x => privateerEntersRace(x, race));
            a = applyConstructorCarCap(a, s.teams, y);
            a.forEach(x => { nRaces[x.id] = (nRaces[x.id] || 0) + 1; });
            lists.push(a);
        }
        for (const a of lists) {
            const per = {};
            a.forEach(x => { per[x.team] = (per[x.team] || 0) + 1; });
            const sizes = Object.values(per);
            A.gCars.push(mean(sizes)); A.gTeams.push(sizes.length);
            sizes.forEach(n => { A.gT++; if (n === 1) A.g1++; else if (n === 2) A.g2++; else A.g3++; });
            A.gOnce.push(a.filter(x => nRaces[x.id] === 1).length);
        }
        // homeOnly-Treue: melden sie NUR in ihrem Heimatland?
        const homeDrv = s.drivers.filter(x => x.homeOnly && x.team && (!x.status || x.status === 'active'));
        for (const x of homeDrv) {
            A.hoDrv++;
            const hc = new Set((x.homeCircuits || []).map(c => String(c).toLowerCase()));
            let tot = 0, home = 0;
            for (let i = 0; i < cal.length; i++) {
                if (!lists[i].includes(x)) continue;
                tot++; if (hc.has(cal[i].circuitId.toLowerCase())) home++;
            }
            A.hoTot += tot; A.hoHome += home;
            if (!tot) A.hoZero++;
        }
    }
}

console.log(`\nZUSAMMENSETZUNG DER MELDELISTE — Spiel gegen real, Ø ${N} Laeufe/Jahr, ${Y0}-${Y1}`);
console.log('FRISCH-SAISON-FALL (expandSeasonData) — fortgesetzte Saisons sind ein anderes Regime!\n');
console.log('Dekade │ Ø Autos je Team │ Anteil Team-Rennen mit 1 / 2 / 3+ Autos │ Ø Teams');
console.log('       │  Spiel    real  │      Spiel       │       real          │ Spiel/real');
console.log('─'.repeat(96));
for (const d of Object.keys(DEC).sort()) {
    const A = DEC[d];
    console.log(`${d}s  │ ${mean(A.gCars).toFixed(2).padStart(6)}  ${mean(A.rCars).toFixed(2).padStart(6)}  │ ${pct(A.g1, A.gT).padStart(5)} ${pct(A.g2, A.gT).padStart(5)} ${pct(A.g3, A.gT).padStart(5)}    │ ${pct(A.r1, A.rT).padStart(5)} ${pct(A.r2, A.rT).padStart(5)} ${pct(A.r3, A.rT).padStart(5)}      │ ${mean(A.gTeams).toFixed(1)}/${mean(A.rTeams).toFixed(1)}`);
}

console.log('\nEINMAL-MELDER je Rennen (Fahrer mit genau EINER Meldung in der Saison)');
console.log('Dekade │ Spiel │ real │ Luecke');
console.log('─'.repeat(48));
for (const d of Object.keys(DEC).sort()) {
    const A = DEC[d];
    console.log(`${d}s  │ ${mean(A.gOnce).toFixed(1).padStart(5)} │ ${mean(A.rOnce).toFixed(1).padStart(4)} │ ${(mean(A.gOnce) - mean(A.rOnce)).toFixed(1).padStart(5)}`);
}

console.log('\nhomeOnly-TREUE (melden sie ausschliesslich im eigenen Land?)');
console.log('Dekade │ homeOnly-Fahrer/Lauf │ Meldungen davon daheim │ ohne jede Meldung');
console.log('─'.repeat(80));
for (const d of Object.keys(DEC).sort()) {
    const A = DEC[d];
    if (!A.hoDrv) { console.log(`${d}s  │ ${'0'.padStart(20)} │ ${'—'.padStart(22)} │ —`); continue; }
    console.log(`${d}s  │ ${(A.hoDrv / N / 10).toFixed(1).padStart(20)} │ ${pct(A.hoHome, A.hoTot).padStart(22)} │ ${pct(A.hoZero, A.hoDrv)}`);
}
