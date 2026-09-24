#!/usr/bin/env node
/**
 * dnf-spreizung.js — wie ungleich verteilen sich Ausfälle auf die Teams?
 *
 * ERA_DNF_RATES legt nur die Grundlinie je Jahr fest. Wie sie sich auf die
 * Teams verteilt, entscheidet in simulateRace die Formel
 *     dnf = Jahresrate × dnfTeamFaktor(Ø reliability, team.reliability)
 *     = Jahresrate × (1 + DNF_REL_SPREAD × (Ø rel − rel) / 100)
 * Dieses Werkzeug misst die ZIELKURVE dafür aus F1DB und hält die Formel
 * analytisch daneben. Kein Spiel-Lauf, keine Würfel: die Formel-Spalte ist
 * der Erwartungswert, den simulateRace für jedes Team ansetzt.
 *
 * Aufruf:  SIMCORE_FROM_INDEX=1 node tests/dnf-spreizung.js [--jahr 1989] [--min 8]
 *   --jahr  zusätzlich die Team-Tabelle eines Jahres
 *   --min   Mindest-Starts eines Teams im Jahr (Default 8)
 *
 * Kennzahlen je Ära:
 *   Spreizung   DNF(schwaches Drittel) − DNF(starkes Drittel), Prozentpunkte
 *   Faktor      DNF(schwach) / DNF(stark)
 *   r(rel)      Korrelation reliability ↔ reale DNF-Quote je Team-Saison
 *   r(rel,St)   Korrelation reliability ↔ Stärke: ist reliability nur ein
 *               zweiter Stärkewert?
 *   Unfall      Anteil Unfall/Kollision/Dreher an allen Ausfällen, und
 *               dessen eigene Spreizung — sagt, ob Auto oder Fahrer die
 *               Spreizung trägt (Spiel: ERA_DNF_ACCIDENT_SHARE je Jahr)
 *
 * ⚠ MESSFALLEN:
 *   - STÄRKE = mittlerer realer Startplatz des Teams, NICHT Punkte oder
 *     WM-Rang. Punkte hängen selbst an den Ausfällen: ein unzuverlässiges
 *     Team rutscht in der Wertung ab und landet dann im "schwachen" Drittel.
 *   - Nenner = echte Starter (DNQ/DNPQ/DNS/EX raus), Indy 500 1950–60 raus.
 *     F1DB führt dort alle Starter mit Platzziffer. Dieselbe Regel wie in
 *     generate-truth.js, sonst misst man wieder den Fehler vom 23.09.2026.
 *   - reliability kommt aus initFromYear, also genau so wie das Spiel sie
 *     nutzt. Teams ohne Treffer in GAME_STATE.teams zählen real mit, fehlen
 *     aber in r(rel) und in der Formel-Spalte — Deckung wird ausgewiesen.
 */
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const DETAIL = Number(arg('--jahr', 0));
const MIN = Number(arg('--min', 8));
const DB = path.join(__dirname, '..', 'f1db-json-splitted');
const lade = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const NICHT_GESTARTET = /^(DNQ|DNPQ|DNS|DNP|EX|WD)$/;
const UNFALL = /accident|collision|spun off|\bspin\b/i;   // wie generate-truth.js

const rennen = lade('f1db-races.json');
const indy500 = new Set(rennen.filter(r => r.circuitId === 'indianapolis' && r.year <= 1960).map(r => r.id));
const ergebnisse = lade('f1db-races-race-results.json');
const grid = lade('f1db-races-starting-grid-positions.json');

// ── Reale Team-Saisons ───────────────────────────────────────────────────
const saison = {};   // jahr -> constructorId -> {starts, dnf, unfall, gridSumme, gridN}
const eintrag = (y, c) => ((saison[y] = saison[y] || {})[c] = saison[y][c]
    || { starts: 0, dnf: 0, unfall: 0, gridSumme: 0, gridN: 0 });
for (const e of ergebnisse) {
    if (NICHT_GESTARTET.test(e.positionText) || indy500.has(e.raceId)) continue;
    const t = eintrag(e.year, e.constructorId);
    t.starts++;
    if (!/^\d+$/.test(e.positionText)) {
        t.dnf++;
        if (UNFALL.test(e.reasonRetired || '')) t.unfall++;
    }
}
for (const g of grid) {
    if (indy500.has(g.raceId) || !g.positionNumber) continue;
    const t = saison[g.year] && saison[g.year][g.constructorId];
    if (t) { t.gridSumme += g.positionNumber; t.gridN++; }
}

// ── Spielseite: reliability und Formel ───────────────────────────────────
const ctx = getContext();
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
function pearson(xs, ys) {
    if (xs.length < 3) return NaN;
    const mx = avg(xs), my = avg(ys);
    let c = 0, vx = 0, vy = 0;
    for (let i = 0; i < xs.length; i++) {
        c += (xs[i] - mx) * (ys[i] - my); vx += (xs[i] - mx) ** 2; vy += (ys[i] - my) ** 2;
    }
    return vx && vy ? c / Math.sqrt(vx * vy) : NaN;
}
// Summiert Ausfälle über Team-Saisons, gewichtet mit Starts
const quote = (liste, feld) => {
    const s = liste.reduce((a, t) => a + t.starts, 0);
    return s ? liste.reduce((a, t) => a + t[feld], 0) / s * 100 : NaN;
};

const jahre = [];
for (let y = 1950; y <= 2025; y++) {
    if (!saison[y]) continue;
    ctx.initFromYear(y);
    const gsTeams = ctx.GAME_STATE.teams || [];
    const zuordnung = new Map();
    for (const t of gsTeams) {
        if (t.histId) zuordnung.set(norm(t.histId), t);
        if (t.name) zuordnung.set(norm(t.name), t);
    }
    const avgRel = avg(gsTeams.map(t => t.reliability || 75));
    const basis = ctx.getEraDNFRate(y);

    const teams = Object.entries(saison[y])
        .filter(([, t]) => t.starts >= MIN && t.gridN)
        .map(([id, t]) => {
            const g = zuordnung.get(norm(id));
            const rel = g ? (g.reliability || 75) : null;
            // Erwartungswert der Formel aus simulateRace, ohne Spieler-Multiplikator
            const formel = rel == null ? null
                : Math.max(2, Math.min(99, basis * ctx.dnfTeamFaktor(avgRel, rel)));
            return { id, ...t, grid: t.gridSumme / t.gridN, rel, formel,
                     real: t.dnf / t.starts * 100 };
        })
        .sort((a, b) => a.grid - b.grid);
    if (teams.length < 3) continue;

    const n3 = Math.max(1, Math.round(teams.length / 3));
    const stark = teams.slice(0, n3), schwach = teams.slice(-n3);
    const mitRel = teams.filter(t => t.rel != null);
    const formelQuote = liste => {
        const l = liste.filter(t => t.formel != null);
        const s = l.reduce((a, t) => a + t.starts, 0);
        return s ? l.reduce((a, t) => a + t.formel * t.starts, 0) / s : NaN;
    };
    const dnfSumme = teams.reduce((a, t) => a + t.dnf, 0);
    jahre.push({
        y, teams,
        realStark: quote(stark, 'dnf'), realSchwach: quote(schwach, 'dnf'),
        unfStark: quote(stark, 'unfall'), unfSchwach: quote(schwach, 'unfall'),
        mechStark: quote(stark, 'dnf') - quote(stark, 'unfall'),
        mechSchwach: quote(schwach, 'dnf') - quote(schwach, 'unfall'),
        formStark: formelQuote(stark), formSchwach: formelQuote(schwach),
        rRel: pearson(mitRel.map(t => t.rel), mitRel.map(t => t.real)),
        rRelStaerke: pearson(mitRel.map(t => t.rel), mitRel.map(t => -t.grid)),
        unfallAnteil: dnfSumme ? teams.reduce((a, t) => a + t.unfall, 0) / dnfSumme * 100 : NaN,
        deckung: mitRel.length / teams.length * 100
    });
}

// ── Ausgabe je Ära ───────────────────────────────────────────────────────
const f = (v, n = 1) => Number.isFinite(v) ? v.toFixed(n) : '  –';
const p = (s, w) => String(s).padStart(w);
console.log('DNF-SPREIZUNG je Ära — F1DB gegen die Formel in simulateRace');
console.log('Stärke = mittlerer realer Startplatz · Drittel je Jahr · Teams ab ' + MIN + ' Starts\n');
console.log('  Ära    | real: stark schwach Spreiz Faktor | Formel: stark schwach Spreiz | r(rel)  r(rel,St) | Unfall-Anteil  Spreiz mech/Unfall | Deckung');
console.log('  ' + '─'.repeat(128));
const aeren = {};
for (const j of jahre) (aeren[Math.floor(j.y / 10) * 10] = aeren[Math.floor(j.y / 10) * 10] || []).push(j);
const zeile = (label, l) => {
    const m = k => avg(l.map(j => j[k]).filter(Number.isFinite));
    const rs = m('realStark'), rw = m('realSchwach'), fs_ = m('formStark'), fw = m('formSchwach');
    console.log('  ' + label.padEnd(6) + ' | ' + p(f(rs), 11) + p(f(rw), 8) + p(f(rw - rs), 7) + p(f(rw / rs, 2), 7)
        + '  | ' + p(f(fs_), 13) + p(f(fw), 8) + p(f(fw - fs_), 7)
        + ' | ' + p(f(m('rRel'), 2), 6) + p(f(m('rRelStaerke'), 2), 10)
        + ' | ' + p(f(m('unfallAnteil'), 0) + ' %', 13)
        + p(f(m('mechSchwach') - m('mechStark')), 11) + ' /' + p(f(m('unfSchwach') - m('unfStark')), 5)
        + ' | ' + p(f(m('deckung'), 0) + ' %', 7));
};
for (const [a, l] of Object.entries(aeren)) zeile(a + 'er', l);
console.log('  ' + '─'.repeat(128));
zeile('alle', jahre);
console.log('\n  Stark/schwach sind Jahresmittel, nicht über die Ära gepoolt.');
console.log('  mech/Unfall: Spreizung (schwach − stark) getrennt nach Ausfallart, in Prozentpunkten der Starts.');

if (DETAIL) {
    const j = jahre.find(x => x.y === DETAIL);
    if (!j) { console.log('\nKein Jahr ' + DETAIL); process.exit(0); }
    console.log('\nTEAMS ' + DETAIL + '  (Grundrate ' + ctx.getEraDNFRate(DETAIL) + ' %, nach Startplatz sortiert)');
    console.log('  Team                     Grid  Starts  real DNF  Unfall  reliability  Formel');
    for (const t of j.teams)
        console.log('  ' + t.id.padEnd(24) + p(f(t.grid), 6) + p(t.starts, 8) + p(f(t.real) + ' %', 10)
            + p(f(t.unfall / t.starts * 100) + ' %', 8) + p(t.rel == null ? '–' : t.rel, 13)
            + p(t.formel == null ? '–' : f(t.formel) + ' %', 9));
}
