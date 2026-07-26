// dnq-lever-dryrun.js
// TROCKENLAUF (keine index.html-Änderung): wie viel schließt jeder Hebel vom
// Melde-Überschuss der klassischen Ära? Jeder Hebel ist eine Transformation, die
// NACH expandSeasonData auf die Fahrer/Teams angewandt wird — die echte Melde-
// Pipeline (privateerEntersRace + applyConstructorCarCap) misst danach.
//
//   node tests/dnq-lever-dryrun.js
//
// Hebel:
//   L1  Per-Saison-Präsenz aus F1DB — jedes Team meldet nur an seinen REALEN Runden
//       (entrants-drivers). Datenexakt. Teamname→constructorId 100% gemappt (geprüft).
//   L2  Schwächeres Team = weniger Meldungen — Werksfahrer schwacher Teams fahren
//       eine Teilsaison (Anteil aus carSpeed). Plausibel, EINE gewählte Kurve (tunebar).
//   L1+L2 kombiniert.
// Lever 3 (Per-Venue) ist gegen die Referenz zirkulär → statt Δ die VARIATIONS-Lücke
//   (Streckenstreuung Spiel vs. real), damit sichtbar ist was er adressieren würde.
'use strict';
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');

const BASE = path.join(__dirname, '..', 'f1db-json-splitted');
const N = 150;
const SWEEP = []; for (let y = 1950; y <= 1989; y++) SWEEP.push(y);

// ── Referenz ────────────────────────────────────────────────────────────────
const races = JSON.parse(fs.readFileSync(path.join(BASE, 'f1db-races.json'), 'utf8'));
const sed = JSON.parse(fs.readFileSync(path.join(BASE, 'f1db-seasons-entrants-drivers.json'), 'utf8'));
const constructors = JSON.parse(fs.readFileSync(path.join(BASE, 'f1db-constructors.json'), 'utf8'));

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const nameToCid = {};
for (const c of constructors) { nameToCid[norm(c.name)] = c.id; nameToCid[norm(c.fullName)] = c.id; }

const roundKey = {};                         // `${y}_${r}` → circuitId (null wenn Indy)
for (const r of races) roundKey[`${r.year}_${r.round}`] = r.grandPrixId === 'indianapolis' ? null : r.circuitId.toLowerCase();

// realEntered[year][circuitId] = distinct Fahrerzahl ; realTeamRounds[year][cid][circuitId]=1
const realEntered = {};
const realTeamRounds = {};                    // year → constructorId → Set(circuitId)
for (const e of sed) {
    if (e.testDriver) continue;
    for (const rd of e.rounds) {
        const cid = roundKey[`${e.year}_${rd}`];
        if (!cid) continue;
        ((realEntered[e.year] = realEntered[e.year] || {})[cid] = realEntered[e.year][cid] || new Set()).add(e.driverId);
        const T = (realTeamRounds[e.year] = realTeamRounds[e.year] || {});
        (T[e.constructorId] = T[e.constructorId] || new Set()).add(cid);
    }
}

// ── Spiel-Kontext ────────────────────────────────────────────────────────────
const ctx = getContext();
const { expandSeasonData, privateerEntersRace, applyConstructorCarCap, isIndyOnlyConstructor } = ctx;

function isIndyDriver(d, teams) {
    if (d.isIndyOnly) return true;
    const t = teams.find(x => x.id === d.team);
    return !!t && (isIndyOnlyConstructor(t.id) || isIndyOnlyConstructor(t.histId));
}

// ── Hebel-Transformationen (mutieren die Saison in-place) ────────────────────
function calCircuits(s) {
    return s.races.filter(r => !r.isIndy && r.circuitId).map(r => r.circuitId.toLowerCase());
}

// L1: jedes Team auf seine realen Runden beschränken
function leverPresence(s, year) {
    const cal = new Set(calCircuits(s));
    for (const t of s.teams) {
        if (t.isIndyOnly) continue;
        const cid = nameToCid[norm(t.histId)] || nameToCid[norm(t.name)];
        const real = cid && realTeamRounds[year] && realTeamRounds[year][cid];
        if (!real || !real.size) continue;                 // kein positiver Datensatz → nicht anfassen
        const allowed = [...real].filter(c => cal.has(c)); // nur Runden im Spiel-Kalender
        const allowedSet = new Set(allowed);
        for (const d of s.drivers) {
            if (d.team !== t.id) continue;
            if (Array.isArray(d.scheduledRaces)) d.scheduledRaces = d.scheduledRaces.filter(c => allowedSet.has(c));
            else d.scheduledRaces = allowed.slice();        // Werksfahrer: auf reale Runden
        }
    }
}

// L2: Werksfahrer schwacher Teams fahren Teilsaison (Anteil aus carSpeed)
// Kurve (tunebar): stärkstes Team 1.0, schwächstes 0.6, linear in carSpeed.
function leverWeakTeam(s, year) {
    const cal = calCircuits(s);
    const teams = s.teams.filter(t => !t.isIndyOnly);
    const cs = teams.map(t => t.carSpeed || 60);
    const mn = Math.min(...cs), mx = Math.max(...cs);
    const shareOf = t => mx === mn ? 1 : 0.60 + 0.40 * ((t.carSpeed || 60) - mn) / (mx - mn);
    for (const t of teams) {
        const share = shareOf(t);
        if (share >= 0.999) continue;
        const n = Math.max(1, Math.min(cal.length, Math.round(cal.length * share)));
        // zufällige Teilsaison (nur Niveau-Effekt; echte Variation käme über ferne Rennen)
        for (const d of s.drivers) {
            if (d.team !== t.id || d.isPrivateer) continue;   // nur Werksfahrer
            const idx = cal.map((_, i) => i);
            for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
            d.scheduledRaces = idx.slice(0, n).map(i => cal[i]);
        }
    }
}

// ── Messung: entries pro circuit, Ø über N, mit optionalem Transform ─────────
function measure(year, N, transform) {
    const acc = {}; let ok = 0;
    for (let k = 0; k < N; k++) {
        const s = expandSeasonData(year); if (!s) return null;
        if (transform) transform(s, year);
        ok++;
        for (const race of s.races) {
            if (race.isIndy) continue;
            let a = s.drivers.filter(d => (!d.status || d.status === 'active') && d.team);
            a = a.filter(d => !isIndyDriver(d, s.teams));
            a = a.filter(d => privateerEntersRace(d, race));
            a = applyConstructorCarCap(a, s.teams, year);
            const cid = (race.circuitId || '').toLowerCase();
            acc[cid] = (acc[cid] || 0) + a.length;
        }
    }
    const res = {}; for (const c in acc) res[c] = acc[c] / ok;
    return res;
}

// ── Dekaden-Aggregat: Δ (Spiel−real) je Hebel ────────────────────────────────
const LEVERS = [
    ['Baseline', null],
    ['L1 Präsenz', leverPresence],
    ['L2 Schwach', leverWeakTeam],
    ['L1+L2', (s, y) => { leverPresence(s, y); leverWeakTeam(s, y); }],
];
const dec = {};   // decade → leverName → {g,r,n}
const varGap = {}; // decade → {gSd, rSd, n}  (Streckenstreuung für Lever-3-Kontext)

for (const year of SWEEP) {
    if (!realEntered[year]) continue;
    const d = Math.floor(year / 10) * 10;
    for (const [name, fn] of LEVERS) {
        const game = measure(year, N, fn);
        const D = ((dec[d] = dec[d] || {})[name] = dec[d][name] || { g: 0, r: 0, n: 0 });
        for (const cid in realEntered[year]) {
            if (game[cid] == null) continue;
            D.g += game[cid]; D.r += realEntered[year][cid].size; D.n++;
        }
    }
    // Variations-Lücke: Standardabweichung der Meldezahl über Strecken (Baseline vs real)
    const gb = measure(year, N, null);
    const gArr = [], rArr = [];
    for (const cid in realEntered[year]) { if (gb[cid] == null) continue; gArr.push(gb[cid]); rArr.push(realEntered[year][cid].size); }
    const sd = a => { const m = a.reduce((s, v) => s + v, 0) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
    const V = (varGap[d] = varGap[d] || { g: 0, r: 0, n: 0 });
    V.g += sd(gArr); V.r += sd(rArr); V.n++;
}

console.log(`Δ MELDUNGEN je Dekade (Spiel − real), Ø ${N} Läufe/Jahr — kleiner ist besser\n`);
console.log('Dekade │ Baseline │ L1 Präsenz │ L2 Schwach │ L1+L2');
console.log('─'.repeat(58));
for (const d of [1950, 1960, 1970, 1980]) {
    const D = dec[d]; if (!D) continue;
    const f = n => { const x = D[n]; return ((x.g - x.r) / x.n >= 0 ? '+' : '') + ((x.g - x.r) / x.n).toFixed(1); };
    console.log(`${d}s  │ ${f('Baseline').padStart(7)}  │ ${f('L1 Präsenz').padStart(9)}  │ ${f('L2 Schwach').padStart(9)}  │ ${f('L1+L2').padStart(6)}`);
}

console.log(`\nVARIATIONS-Lücke (Std.abw. der Meldezahl über Strecken) — Kontext für Lever 3`);
console.log('Dekade │ Spiel-SD │ real-SD  (real > Spiel = flache Spiel-Variation)');
console.log('─'.repeat(58));
for (const d of [1950, 1960, 1970, 1980]) {
    const V = varGap[d]; if (!V) continue;
    console.log(`${d}s  │ ${(V.g / V.n).toFixed(1).padStart(7)}  │ ${(V.r / V.n).toFixed(1).padStart(6)}`);
}
