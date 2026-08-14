// driver-participation.js — WIE VIELE Rennen fährt ein Fahrer, Spiel gegen real?
//
// HINTERGRUND: `markPrivateers` macht die zwei Schnellsten je Team zu Werksfahrern
// (fahren alles) und ALLE anderen zu Privatiers (fahren sporadisch, Zahl aus
// `_drawPrivateerCount`). Rolle und Regelmaessigkeit haengen damit an EINEM Flag,
// und die Regelmaessigkeit wird aus dem PACE-RANG abgeleitet. Real hat das nichts
// miteinander zu tun: Arturo Merzario war 1974 bei Iso-Marlboro der Dritte im Team
// und fuhr trotzdem alle 15 Rennen — im Spiel meldet er 3,3-mal.
//
// Dieses Skript misst die VERTEILUNG der Teilnahme (Rennen / Kalenderlaenge) je
// Fahrer und Dekade, real gegen Spiel. Es beantwortet zwei Fragen:
//   1. Wie gross ist der Fehler wirklich, und wo sitzt er?
//   2. Wie viele Fahrer-Saisons muesste eine Datentabelle abdecken, und wie gross
//      waere sie? (Nur Teilzeit-Faelle sind interessant — Vollsaison ist der
//      Normalfall und traegt keine Information, genau wie bei data/presence.js.)
//
//   node tests/driver-participation.js              → Dekaden-Uebersicht (nur Daten)
//   node tests/driver-participation.js --game       → dazu die Spiel-Seite (sim-core)
//   node tests/driver-participation.js 1974         → ein Jahr im Detail
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'f1db-json-splitted');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
const args = process.argv.slice(2);
const DETAIL = args.map(Number).filter(Boolean);
const GAME = args.includes('--game');

// ── Kalender, Indy raus ─────────────────────────────────────────────────────
const roundCircuit = {}, calOf = {};
for (const r of J('f1db-races.json')) {
    const cid = r.grandPrixId === 'indianapolis' ? null : String(r.circuitId || '').toLowerCase();
    roundCircuit[`${r.year}_${r.round}`] = cid;
    if (cid) (calOf[r.year] = calOf[r.year] || new Set()).add(cid);
}
const drvName = {};
for (const d of J('f1db-drivers.json')) drvName[d.id] = d.name;

// year -> driverId -> Set(circuit)   (ueber ALLE Konstrukteure zusammen)
const real = {};
for (const e of J('f1db-seasons-entrants-drivers.json')) {
    if (e.testDriver) continue;
    for (const rd of (e.rounds || [])) {
        const cid = roundCircuit[`${e.year}_${rd}`];
        if (!cid) continue;
        ((real[e.year] = real[e.year] || {})[e.driverId] =
            real[e.year][e.driverId] || new Set()).add(cid);
    }
}

const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
const DEC = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

// ── Reale Verteilung ────────────────────────────────────────────────────────
// Klassen nach Kalenderanteil: Stamm >=80 %, Teilzeit 20-80 %, Gast <20 %
const klasse = q => q >= 0.8 ? 'stamm' : q >= 0.2 ? 'teilzeit' : 'gast';
const realDek = {};
let teilzeitSaisons = 0, alleSaisons = 0;
for (const y of Object.keys(real).map(Number).sort((a, b) => a - b)) {
    const cal = calOf[y]; if (!cal || !cal.size) continue;
    const d = Math.floor(y / 10) * 10;
    const D = (realDek[d] = realDek[d] || { stamm: 0, teilzeit: 0, gast: 0, n: 0, jahre: new Set() });
    D.jahre.add(y);
    for (const dId of Object.keys(real[y])) {
        const q = real[y][dId].size / cal.size;
        D[klasse(q)]++; D.n++;
        alleSaisons++;
        if (q < 0.8) teilzeitSaisons++;
    }
}

console.log('\nTEILNAHME REAL — Anteil der Fahrer je Klasse (Kalenderanteil)');
console.log('Dekade │ Stamm ≥80% │ Teilzeit 20-80% │ Gast <20% │ Fahrer-Saisons/Jahr');
console.log('─'.repeat(80));
for (const d of DEC) {
    const D = realDek[d]; if (!D) continue;
    const p = v => (v / D.n * 100).toFixed(0) + '%';
    console.log(`${d}s  │ ${p(D.stamm).padStart(10)} │ ${p(D.teilzeit).padStart(15)} │ ${p(D.gast).padStart(9)} │ ${(D.n / D.jahre.size).toFixed(1)}`);
}
console.log(`\nFahrer-Saisons gesamt: ${alleSaisons}, davon unter 80 % Kalenderanteil: ${teilzeitSaisons}`);
console.log(`→ eine Datentabelle muesste nur diese ${teilzeitSaisons} abdecken (Vollsaison ist der Normalfall`);
console.log(`  und traegt keine Information — dasselbe Prinzip wie data/presence.js).`);
const bytes = teilzeitSaisons * 22;   // grob: "histid":n, je Eintrag
console.log(`  Grobschaetzung Dateigroesse: ~${(bytes / 1024).toFixed(0)} KB`);

// ── Spiel-Seite ─────────────────────────────────────────────────────────────
if (!GAME && !DETAIL.length) process.exit(0);
const { getContext } = require('./sim-core');
const ctx = getContext();
const { expandSeasonData, privateerEntersRace, applyConstructorCarCap, isIndyOnlyConstructor } = ctx;
const N = Number(process.env.N_RUNS || 25);

function isIndyDriver(d, teams) {
    if (d.isIndyOnly) return true;
    const t = teams.find(x => x.id === d.team);
    return !!t && (isIndyOnlyConstructor(t.id) || isIndyOnlyConstructor(t.histId));
}

// Spiel: Meldungen je Fahrer (histId) ueber N Laeufe gemittelt
function spielTeilnahme(year) {
    const acc = {}; let ok = 0, calLen = 0;
    for (let k = 0; k < N; k++) {
        const s = expandSeasonData(year); if (!s) return null;
        const cal = s.races.filter(r => !r.isIndy && r.circuitId);
        if (!cal.length) return null;
        calLen = cal.length; ok++;
        for (const race of cal) {
            let a = s.drivers.filter(x => (!x.status || x.status === 'active') && x.team);
            a = a.filter(x => !isIndyDriver(x, s.teams));
            a = a.filter(x => privateerEntersRace(x, race));
            a = applyConstructorCarCap(a, s.teams, year);
            for (const x of a) {
                const h = String(x.histId || '').toLowerCase();
                if (h) acc[h] = (acc[h] || 0) + 1;
            }
        }
    }
    const res = {}; for (const h in acc) res[h] = acc[h] / ok;
    return { teilnahme: res, calLen };
}

const jahre = DETAIL.length ? DETAIL : [1955, 1965, 1974, 1985, 1995, 2005, 2015];
console.log(`\nSPIEL GEGEN REAL — Kalenderanteil je Fahrer (Ø ${N} Laeufe)`);
console.log('Jahr │ Stamm  Spiel/real │ Teilzeit Spiel/real │ Gast Spiel/real │ groesste Abweichungen');
console.log('─'.repeat(104));
for (const y of jahre) {
    const g = spielTeilnahme(y); if (!g || !real[y]) continue;
    const cal = calOf[y].size;
    const zaehl = { stamm: 0, teilzeit: 0, gast: 0 }, rz = { stamm: 0, teilzeit: 0, gast: 0 };
    const abw = [];
    for (const h in g.teilnahme) {
        zaehl[klasse(g.teilnahme[h] / g.calLen)]++;
        const r = real[y][h];
        if (r) abw.push({ h, spiel: g.teilnahme[h], real: r.size });
    }
    for (const dId of Object.keys(real[y])) rz[klasse(real[y][dId].size / cal)]++;
    const top = abw.sort((a, b) => Math.abs(b.spiel - b.real) - Math.abs(a.spiel - a.real)).slice(0, 3)
        .map(x => `${(drvName[x.h] || x.h).split(' ').pop()} ${x.spiel.toFixed(1)}/${x.real}`).join(' · ');
    console.log(`${y} │ ${String(zaehl.stamm).padStart(6)}/${String(rz.stamm).padStart(4)}      │ ${String(zaehl.teilzeit).padStart(8)}/${String(rz.teilzeit).padStart(4)}       │ ${String(zaehl.gast).padStart(4)}/${String(rz.gast).padStart(4)}      │ ${top}`);
}
