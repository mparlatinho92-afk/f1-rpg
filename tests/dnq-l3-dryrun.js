// dnq-l3-dryrun.js — TROCKENLAUF fuer L3 (DNQ_MELDEPLAN.md Abschnitt 10)
// Aendert index.html NICHT. Gleiche Reihenfolge wie bei L1: erst messen, dann bauen.
//
// WAS DIE DIAGNOSE ERGAB (tests/dnq-venue-diagnosis.js, Stand v0.9.15.81 mit L1):
//   • Die Streuung sitzt komplett im SCHWANZ (Teil A: SD Schwanz 4,13 von 4,63 gesamt).
//   • Das Spiel hat den Schwanz in der richtigen GROESSE (Teil D: 9,1 gegen real 10,0)
//     und schickt ihn dank L1 schon auf die richtigen Strecken (Teil E: Korrelation
//     0,93 / 0,74 / 0,82 / 0,77) — nur mit zu kleinem AUSSCHLAG (SD 2,62 gegen 4,11).
//   • Real sind 36 % der Schwanz-Melder Landsleute des Streckenlandes, im Stammfeld
//     nur 13 % (Teil B). Im Spiel sind es 21,6 % bei einer Zufallserwartung von
//     17,1 % (Teil G) — der Schwanz wird also praktisch ungewichtet verteilt.
//   • Die Anreise-These ist WIDERLEGT: Uebersee-Rennen haben denselben Schwanz wie
//     europaeische (Teil B2, 9,0 gegen 10,0). Ein Kontinent-/Distanzfaktor waere falsch.
//
// DARAUS DER HEBEL: nicht eine Streckentabelle (die waere gegen dieselbe Referenz
// zirkulaer), sondern EIN Gewicht in der Streckenwahl des Privatiers — Rennen im
// eigenen Land zaehlen W-fach. Die Groesse des Ausschlags entsteht dann aus der
// Fahrerpopulation der Gastgebernation, nicht aus der Zielzahl: Italien/GB/D haben
// viele Privatiers (Monza, Aintree, Nuerburgring steigen), NL/B/CH wenige
// (Zandvoort, Spa, Bremgarten bleiben unten). Genau das ist das reale Muster.
//
// ERFOLGSMASS (Bauplan Abschnitt 10: NICHT Delta, das waere zirkulaer):
//   1. Landsmann-Anteil im Schwanz  → strukturell, unabhaengig von der Meldezahl
//   2. systematische Strecken-SD + Korrelation → trifft der Ausschlag die Groesse
//   3. Delta und DNQ nur als GEGENPROBE: duerfen sich nicht verschlechtern
//
//   node tests/dnq-l3-dryrun.js
'use strict';
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');

const BASE = path.join(__dirname, '..', 'f1db-json-splitted');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
const N = Number(process.env.N_RUNS || 25);
const WEIGHTS = (process.env.WEIGHTS || '1,2.5,5,10').split(',').map(Number);   // 1 = heutiger Zustand
const Y0 = Number(process.env.YEAR_FROM || 1950), Y1 = Number(process.env.YEAR_TO || 1989);
const DEC = [1950, 1960, 1970, 1980].filter(d => d + 9 >= Y0 && d <= Y1);
const CORE_SHARE = 0.6;

// ── Referenz ────────────────────────────────────────────────────────────────
const races = J('f1db-races.json');
const roundCircuit = {}, calOf = {};
for (const r of races.slice().sort((a, b) => a.round - b.round)) {
    const cid = r.grandPrixId === 'indianapolis' ? null : String(r.circuitId || '').toLowerCase();
    roundCircuit[`${r.year}_${r.round}`] = cid;
    if (cid) (calOf[r.year] = calOf[r.year] || []).push(cid);
}
const entered = {}, drvRaces = {}, startedAt = {};
for (const e of J('f1db-seasons-entrants-drivers.json')) {
    if (e.testDriver) continue;
    for (const rd of (e.rounds || [])) {
        const cid = roundCircuit[`${e.year}_${rd}`]; if (!cid) continue;
        ((entered[e.year] = entered[e.year] || {})[cid] = entered[e.year][cid] || new Set()).add(e.driverId);
    }
}
for (const y in entered) {
    const m = (drvRaces[y] = {});
    for (const cid in entered[y]) for (const d of entered[y][cid]) m[d] = (m[d] || 0) + 1;
}
for (const g of J('f1db-races-starting-grid-positions.json')) {
    const cid = roundCircuit[`${g.year}_${g.round}`]; if (!cid) continue;
    ((startedAt[g.year] = startedAt[g.year] || {})[cid] = startedAt[g.year][cid] || new Set()).add(g.driverId);
}
const circCountry = {}; for (const c of J('f1db-circuits.json')) circCountry[c.id] = c.countryId;
const drvNat = {}; for (const d of J('f1db-drivers.json')) drvNat[d.id] = d.nationalityCountryId;
// IOC-Code -> f1db-countryId. Das Spiel fuehrt IOC ("SUI", "GER", "NED"), f1db
// schluesselt auf eigene Ids. Ein Mapping ueber alpha3Code laesst genau die grossen
// Privatier-Nationen fallen (CHE/DEU/NLD != SUI/GER/NED) und macht den Hebel dort
// wirkungslos, wo er wirken soll. iocCode hat Vorrang, alpha3 ist nur Rueckfall.
const IOC2C = {};
for (const c of J('f1db-countries.json')) if (c.iocCode) IOC2C[c.iocCode.toUpperCase()] = c.id;
for (const c of J('f1db-countries.json')) {
    const a = c.alpha3Code && c.alpha3Code.toUpperCase();
    if (a && !IOC2C[a]) IOC2C[a] = c.id;
}
IOC2C.DDR = IOC2C.DDR || 'east-germany';       // Spiel nutzt DDR, f1db GDR/east-germany

const sd = a => { if (!a.length) return 0; const m = a.reduce((s, v) => s + v, 0) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;

// ── Spiel-Kontext ───────────────────────────────────────────────────────────
const ctx = getContext();
const { expandSeasonData, privateerEntersRace, applyConstructorCarCap,
        getGridSize, isIndyOnlyConstructor, convertEmojiToIOC } = ctx;
const ioc = v => { const s = String(v || ''); return s.length === 3 ? s.toUpperCase() : String(convertEmojiToIOC(s) || '').toUpperCase(); };
const landOf = v => IOC2C[ioc(v)];
function isIndyDriver(d, teams) {
    if (d.isIndyOnly) return true;
    const t = teams.find(x => x.id === d.team);
    return !!t && (isIndyOnlyConstructor(t.id) || isIndyOnlyConstructor(t.histId));
}

// ── Der Hebel ───────────────────────────────────────────────────────────────
// Zieht fuer jeden echten Privatier DIESELBE ANZAHL Rennen neu, nur gewichtet:
// Rennen im eigenen Land zaehlen W-fach. Anzahl und Kandidatenmenge bleiben
// unangetastet — der Hebel verschiebt WELCHE Rennen, nie WIE VIELE. Damit kann er
// das von L1 gesetzte Niveau strukturell nicht kippen.
//
// Kandidatenmenge = was der Fahrer heute ueberhaupt duerfte:
//   • Team hat einen Werksfahrer ohne Plan → volles Kalenderfeld
//   • sonst die Vereinigung der Teamplaene → rekonstruiert den Kleinstkonstrukteur-
//     Teamplan bzw. die von L1 erlaubten Strecken. Wer daraus zieht, kann weder den
//     Teamplan noch die Praesenz-Beschneidung verletzen.
// homeOnly-Fahrer bleiben unangetastet: die sind schon am Heimrennen.
function leverHomePull(s, year, W) {
    if (W <= 1) return;
    const cal = s.races.filter(r => !r.isIndy && r.circuitId);
    if (cal.length < 2) return;
    const ids = cal.map(r => r.circuitId.toLowerCase());
    const raceLand = {}; cal.forEach(r => { raceLand[r.circuitId.toLowerCase()] = landOf(r.country); });

    const byTeam = {};
    s.drivers.forEach(d => { if (d.team) (byTeam[d.team] = byTeam[d.team] || []).push(d); });
    const candOf = {};
    for (const tid in byTeam) {
        const list = byTeam[tid];
        if (list.some(d => !Array.isArray(d.scheduledRaces) && !(d.status && d.status !== 'active'))) { candOf[tid] = ids; continue; }
        const u = new Set();
        list.forEach(d => (d.scheduledRaces || []).forEach(c => u.add(c)));
        candOf[tid] = ids.filter(c => u.has(c));
    }

    for (const d of s.drivers) {
        if (d.homeOnly || !d.isPrivateer || !d.team) continue;
        if (d.status && d.status !== 'active') continue;
        if (!Array.isArray(d.scheduledRaces) || !d.scheduledRaces.length) continue;
        const cand = candOf[d.team] || ids;
        const n = d.scheduledRaces.length;
        if (n >= cand.length) continue;
        const land = landOf(d.nation);
        if (!land) continue;
        // gewichtetes Ziehen ohne Zuruecklegen
        const pool = cand.slice();
        const w = pool.map(c => raceLand[c] === land ? W : 1);
        const pick = [];
        for (let k = 0; k < n && pool.length; k++) {
            let tot = w.reduce((a, b) => a + b, 0), r = Math.random() * tot, i = 0;
            while (i < pool.length - 1 && (r -= w[i]) > 0) i++;
            pick.push(pool[i]); pool.splice(i, 1); w.splice(i, 1);
        }
        d.scheduledRaces = ids.filter(c => pick.includes(c));
    }
}

// ── Messung ─────────────────────────────────────────────────────────────────
function measure(year, W) {
    const perCirc = {}, perDnq = {}, sds = [];
    let tailN = 0, tailHome = 0, tailExp = 0, tailExpN = 0;
    for (let k = 0; k < N; k++) {
        const s = expandSeasonData(year); if (!s) return null;
        leverHomePull(s, year, W);
        const cal = s.races.filter(r => !r.isIndy && r.circuitId);
        if (cal.length < 2) return null;
        const lists = [], nRaces = {}, counts = [];
        for (const race of cal) {
            let a = s.drivers.filter(x => (!x.status || x.status === 'active') && x.team);
            a = a.filter(x => !isIndyDriver(x, s.teams));
            a = a.filter(x => privateerEntersRace(x, race));
            a = applyConstructorCarCap(a, s.teams, year);
            a.forEach(x => { nRaces[x.id] = (nRaces[x.id] || 0) + 1; });
            lists.push({ race, a }); counts.push(a.length);
            const cid = race.circuitId.toLowerCase();
            (perCirc[cid] = perCirc[cid] || []).push(a.length);
            (perDnq[cid] = perDnq[cid] || []).push(Math.max(0, a.length - getGridSize(year, race)));
        }
        sds.push(sd(counts));
        const pool = s.drivers.filter(x => (nRaces[x.id] || 0) > 0 && (nRaces[x.id] || 0) < CORE_SHARE * cal.length);
        for (const { race, a } of lists) {
            const land = landOf(race.country); if (!land) continue;
            const tail = a.filter(x => (nRaces[x.id] || 0) < CORE_SHARE * cal.length);
            tailN += tail.length;
            tailHome += tail.filter(x => landOf(x.nation) === land).length;
            if (pool.length) { tailExp += tail.length * pool.filter(x => landOf(x.nation) === land).length / pool.length; tailExpN += tail.length; }
        }
    }
    const avg = o => { const r = {}; for (const c in o) r[c] = mean(o[c]); return r; };
    return { perCirc: avg(perCirc), perDnq: avg(perDnq), sdRun: mean(sds),
             homeShare: tailN ? tailHome / tailN : 0, expShare: tailExpN ? tailExp / tailExpN : 0 };
}

// ── Sweep ───────────────────────────────────────────────────────────────────
const acc = {};   // W -> decade -> Kennzahlen
for (const W of WEIGHTS) {
    for (let y = Y0; y <= Y1; y++) {
        if (!entered[y] || !calOf[y] || !startedAt[y]) continue;
        const g = measure(y, W); if (!g) continue;
        const d = Math.floor(y / 10) * 10;
        const A = ((acc[W] = acc[W] || {})[d] = acc[W][d] || { hs: [], es: [], sdr: [], dg: 0, dr: 0, dn: 0, dq: [], dev: {} });
        A.hs.push(g.homeShare); A.es.push(g.expShare); A.sdr.push(g.sdRun);
        const cids = calOf[y].filter(c => entered[y][c] && g.perCirc[c] != null);
        if (cids.length < 2) continue;
        const rV = cids.map(c => entered[y][c].size), gV = cids.map(c => g.perCirc[c]);
        const rM = mean(rV), gM = mean(gV);
        cids.forEach((c, i) => {
            A.dg += gV[i]; A.dr += rV[i]; A.dn++;
            const E = (A.dev[c] = A.dev[c] || { r: [], g: [] });
            E.r.push(rV[i] - rM); E.g.push(gV[i] - gM);
        });
        A.dq.push(mean(cids.map(c => g.perDnq[c])));
    }
}

// reale Vergleichswerte je Dekade
const realRef = {};
for (const d of DEC) {
    const hs = { t: 0, h: 0 }, dev = {}, dq = [];
    for (let y = Math.max(d, Y0); y < Math.min(d + 10, Y1 + 1); y++) {
        if (!entered[y] || !calOf[y] || !startedAt[y]) continue;
        const calLen = calOf[y].length;
        const cids = calOf[y].filter(c => entered[y][c]);
        const vals = cids.map(c => entered[y][c].size), m = mean(vals);
        cids.forEach((c, i) => {
            const land = circCountry[c];
            for (const dr of entered[y][c]) {
                if ((drvRaces[y][dr] || 0) >= CORE_SHARE * calLen) continue;
                hs.t++; if (drvNat[dr] && land && drvNat[dr] === land) hs.h++;
            }
            const E = (dev[c] = dev[c] || []); E.push(vals[i] - m);
        });
        dq.push(mean(cids.map(c => Math.max(0, entered[y][c].size - ((startedAt[y][c] || { size: 0 }).size)))));
    }
    const rows = Object.keys(dev).filter(c => dev[c].length >= 3).map(c => mean(dev[c]));
    realRef[d] = { home: hs.h / hs.t, sdSys: sd(rows), dq: mean(dq), keys: new Set(Object.keys(dev).filter(c => dev[c].length >= 3)) };
}

const WLBL = WEIGHTS.map(w => String(w).padStart(5)).join('');
console.log(`\nL3-TROCKENLAUF — Heimrennen-Gewicht W in der Streckenwahl des Privatiers`);
console.log(`Ø ${N} Laeufe/Jahr, ${Y0}-${Y1}. W=1 ist der heutige Zustand (v0.9.15.81, mit L1).\n`);
console.log('        │ Landsmann-Anteil Schwanz  │ systemat. Streckenprofil │ Gegenprobe');
console.log(`Dekade  │ real ${WLBL} │ SD real →${WLBL} │ Korr je W, dann Δ / DNQ`);
console.log('─'.repeat(100));
for (const d of DEC) {
    const R = realRef[d];
    const hs = WEIGHTS.map(W => acc[W] && acc[W][d] ? (mean(acc[W][d].hs) * 100).toFixed(0) : '—');
    const sdsys = WEIGHTS.map(W => {
        const A = acc[W] && acc[W][d]; if (!A) return '—';
        const rows = Object.keys(A.dev).filter(c => A.dev[c].g.length >= 3).map(c => mean(A.dev[c].g));
        return sd(rows).toFixed(1);
    });
    const corr = WEIGHTS.map(W => {
        const A = acc[W] && acc[W][d]; if (!A) return '—';
        const ks = Object.keys(A.dev).filter(c => A.dev[c].g.length >= 3);
        const rA = ks.map(c => mean(A.dev[c].r)), gA = ks.map(c => mean(A.dev[c].g));
        const rM = mean(rA), gM = mean(gA);
        const cov = mean(ks.map((c, i) => (rA[i] - rM) * (gA[i] - gM)));
        return (sd(rA) && sd(gA)) ? (cov / (sd(rA) * sd(gA))).toFixed(2) : '—';
    });
    const dlt = WEIGHTS.map(W => { const A = acc[W] && acc[W][d]; return A ? ((A.dg - A.dr) / A.dn >= 0 ? '+' : '') + ((A.dg - A.dr) / A.dn).toFixed(1) : '—'; });
    const dq = WEIGHTS.map(W => { const A = acc[W] && acc[W][d]; return A ? mean(A.dq).toFixed(1) : '—'; });
    console.log(`${d}s   │ real ${(R.home * 100).toFixed(0)}% ${hs.map(v => String(v + '%').padStart(5)).join('')} │ ${R.sdSys.toFixed(1).padStart(4)} → ${sdsys.map(v => String(v).padStart(4)).join('')} │ ${corr.join(' ')}`);
    console.log(`        │                          │                          │ Δ ${dlt.join(' ')}  DNQ ${dq.join(' ')} (real ${R.dq.toFixed(1)})`);
}
// Streckendetails: WO genau der Ausschlag entsteht — noetig, um zu erkennen, ob ein
// Korrelationsabfall am Hebel liegt oder an einer Strecke, die er gar nicht erklaeren
// kann (Nuerburgring z. B. zog sein Riesenfeld ueber die Streckenkapazitaet an, nicht
// ueber deutsche Privatiers — dafuer ist getGridSize zustaendig, nicht L3).
if (process.env.DETAIL === '1') {
    const Wmax = WEIGHTS[WEIGHTS.length - 1];
    for (const d of DEC) {
        const A = acc[Wmax] && acc[Wmax][d], A1 = acc[WEIGHTS[0]] && acc[WEIGHTS[0]][d];
        if (!A || !A1) continue;
        console.log(`\n${d}s — Ø Abweichung vom Saison-Mittel je Strecke (real / W=${WEIGHTS[0]} / W=${Wmax})`);
        Object.keys(A.dev).filter(c => A.dev[c].g.length >= 3)
            .map(c => ({ c, r: mean(A.dev[c].r), g1: A1.dev[c] ? mean(A1.dev[c].g) : NaN, g2: mean(A.dev[c].g) }))
            .sort((a, b) => b.r - a.r)
            .forEach(x => console.log(`  ${x.c.padEnd(20)} ${x.r >= 0 ? '+' : ''}${x.r.toFixed(1).padStart(5)}  │ ${x.g1 >= 0 ? '+' : ''}${x.g1.toFixed(1).padStart(5)} → ${x.g2 >= 0 ? '+' : ''}${x.g2.toFixed(1).padStart(5)}`));
    }
}

console.log('\nLesart: Ziel ist der Landsmann-Anteil links (strukturell, nicht zirkulaer).');
console.log('Die Streckenprofil-SD muss dabei mitwachsen und die Korrelation halten.');
console.log('Δ und DNQ sind reine Gegenprobe — der Hebel verschiebt nur WELCHE Rennen.');
