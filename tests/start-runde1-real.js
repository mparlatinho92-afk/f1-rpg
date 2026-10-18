#!/usr/bin/env node
/**
 * start-runde1-real.js — Startplatz → Position nach Runde 1 → Ziel, real 1996–2024.
 *
 * Trennt, was in der Startrunde passiert, von dem, was danach über das Tempo kommt.
 * Daten: F1DB (Startplatz, Ergebnis) + tests/jolpica-data/runde1-YYYY.json
 * (erst `node tests/scrape-jolpica-runde1.js` laufen lassen).
 *
 * Aufruf: node tests/start-runde1-real.js [vonJahr] [bisJahr]
 *
 * ⚠ jolpica nutzt Ergast-IDs ("villeneuve"), F1DB Slugs ("jacques-villeneuve").
 *   Zuordnung über Geburtsdatum + Nachname aus der Fahrerliste der Saison.
 * ⚠ Wer in Runde 1 ausfällt, fehlt in den Rundendaten (Position null).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'f1db-json-splitted');
const VON = Number(process.argv[2] || 1996), BIS = Number(process.argv[3] || 2024);

const lade = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));
const grid = lade('f1db-races-starting-grid-positions.json').filter(g => g.year >= VON && g.year <= BIS);
const erg = lade('f1db-races-race-results.json').filter(e => e.year >= VON && e.year <= BIS);
const fahrer = lade('f1db-drivers.json');
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const nachGeburt = {};
for (const d of fahrer) (nachGeburt[d.dateOfBirth] = nachGeburt[d.dateOfBirth] || []).push(d);

// PACE_RATINGS ist mit const deklariert → als var in einen eigenen Kontext laden
const PR = (() => { const c = { window: {} }; vm.createContext(c);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'f1db.js'), 'utf8').replace(/\bconst (\w+)\s*=/g, 'var $1 ='), c);
    return c.PACE_RATINGS || {}; })();

const starts = [];   // { jahr, rd, f, g, l, z, pace }
let ohneZuordnung = 0, ohneRunde1 = 0;
for (let jahr = VON; jahr <= BIS; jahr++) {
    const datei = path.join(__dirname, 'jolpica-data', `runde1-${jahr}.json`);
    if (!fs.existsSync(datei)) continue;
    const j = JSON.parse(fs.readFileSync(datei, 'utf8'));
    // Ergast-ID → F1DB-Slug
    const zuF1db = {};
    for (const [eid, x] of Object.entries(j.drivers || {})) {
        const kand = nachGeburt[x.dob] || [];
        const t = kand.length === 1 ? kand[0] : kand.find(d => norm(d.lastName) === norm(x.family));
        if (t) zuF1db[eid] = t.id; else ohneZuordnung++;
    }
    const r1 = {};
    for (const r of j.races) { const m = {}; for (const [eid, p] of Object.entries(r.positions)) if (zuF1db[eid]) m[zuF1db[eid]] = p; r1[r.round] = m; }
    // Pace-Rang unter den Startern der Saison: 0 = Top 3, 1 = 4–8, 2 = Rest
    const jg = grid.filter(g => g.year === jahr);
    const pl = [...new Set(jg.map(g => g.driverId))].map(d => [d, PR[d] && PR[d][jahr] && PR[d][jahr][0]])
        .filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
    const pRang = new Map(pl.map(([d], i) => [d, i < 3 ? 0 : i < 8 ? 1 : 2]));
    const zielVon = new Map(erg.filter(e => e.year === jahr).map(e => [e.round + '|' + e.driverId,
        /^\d+$/.test(String(e.positionText || '')) ? Number(e.positionText) : null]));
    for (const g of jg) {
        if (!g.positionNumber || !r1[g.round]) { if (!r1[g.round]) ohneRunde1++; continue; }
        starts.push({ jahr, rd: g.round, f: g.driverId, g: g.positionNumber,
            l: r1[g.round][g.driverId] || null, z: zielVon.get(g.round + '|' + g.driverId) ?? null, pace: pRang.get(g.driverId) });
    }
}
if (!starts.length) { console.log('Keine Daten — erst node tests/scrape-jolpica-runde1.js'); process.exit(1); }
const rennen = new Set(starts.map(s => s.jahr + '|' + s.rd)).size;
console.log(`START → RUNDE 1 → ZIEL  real ${VON}–${BIS}: ${rennen} Rennen, ${starts.length} Starts`
    + (ohneZuordnung ? ` · ${ohneZuordnung} Ergast-IDs ohne F1DB-Fahrer` : ''));

const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const sd = a => { const m = avg(a); return Math.sqrt(avg(a.map(x => (x - m) ** 2))); };
const spearman = (xs, ys) => {   // Durchschnittsränge
    const rang = v => { const o = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = new Array(v.length);
        for (let i = 0; i < o.length;) { let k = i; while (k + 1 < o.length && o[k + 1][0] === o[i][0]) k++;
            for (let m = i; m <= k; m++) r[o[m][1]] = (i + k) / 2; i = k + 1; } return r; };
    const a = rang(xs), b = rang(ys), ma = avg(a), mb = avg(b);
    let n = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
    return n / Math.sqrt(da * db);
};

// 1) Spearman je Rennen
const je = {};
for (const s of starts) (je[s.jahr + '|' + s.rd] = je[s.jahr + '|' + s.rd] || []).push(s);
const sp = { gl: [], lz: [], gz: [] };
for (const l of Object.values(je)) {
    const a = l.filter(s => s.l), b = l.filter(s => s.l && s.z);
    if (a.length > 4) sp.gl.push(spearman(a.map(s => s.g), a.map(s => s.l)));
    if (b.length > 4) { sp.lz.push(spearman(b.map(s => s.l), b.map(s => s.z))); sp.gz.push(spearman(b.map(s => s.g), b.map(s => s.z))); }
}
console.log(`\n  Ø Spearman je Rennen: Start→Runde 1 ${avg(sp.gl).toFixed(3)} · Runde 1→Ziel ${avg(sp.lz).toFixed(3)} · Start→Ziel ${avg(sp.gz).toFixed(3)} (nur Zielankünfte)`);

// "danach": Rang nach Runde 1 UNTER DEN SPÄTEREN ZIELANKÜNFTEN minus Zielplatz — ohne diesen
// Bezug zählt jeder Ausfall eines Vordermanns als gewonnener Platz.
for (const l of Object.values(je)) {
    const b = l.filter(s => s.l && s.z).sort((x, y) => x.l - y.l);
    b.forEach((s, i) => s.danach = (i + 1) - s.z);
}

// 2) Startrunde je Startgruppe
const SG = s => s.g <= 3 ? 0 : s.g <= 9 ? 1 : 2, SN = ['P1–3', '4–9 ', '10+ '], PN = ['Top 3', '4–8  ', 'Rest '];
console.log('\n  Startrunde je Startplatz:    Ø Plätze gewonnen (Streuung)   raus in Runde 1');
for (let k = 0; k < 3; k++) {
    const l = starts.filter(s => SG(s) === k), d = l.filter(s => s.l).map(s => s.g - s.l);
    console.log(`    Start ${SN[k]}               ${avg(d).toFixed(2).padStart(6)} (${sd(d).toFixed(2)})              ${(100 * l.filter(s => !s.l).length / l.length).toFixed(1)} %   n ${l.length}`);
}

// 3) Pace × Start: Gewinn in Runde 1, Gewinn danach (nur Zielankünfte), Sieg
console.log('\n  Pace × Start:          Runde 1 Ø   danach Ø (unter Zielankünften)   Sieg %   Sieg, wenn nach R1 auf P4+ %');
for (let p = 0; p < 3; p++) for (let k = 0; k < 3; k++) {
    const l = starts.filter(s => s.pace === p && SG(s) === k); if (!l.length) continue;
    const r1 = l.filter(s => s.l).map(s => s.g - s.l), da = l.filter(s => s.danach !== undefined).map(s => s.danach);
    const hinten = l.filter(s => s.l >= 4);
    console.log(`    Pace ${PN[p]} Start ${SN[k]}  ${avg(r1).toFixed(2).padStart(6)}   ${avg(da).toFixed(2).padStart(7)}   ${(100 * l.filter(s => s.z === 1).length / l.length).toFixed(1).padStart(5)}`
        + `   ${hinten.length ? (100 * hinten.filter(s => s.z === 1).length / hinten.length).toFixed(1) : '-'} (n ${hinten.length})   n ${l.length}`);
}

// 4) Wo stand der Sieger nach Runde 1?
const sieger = starts.filter(s => s.z === 1);
const anteil = f => (100 * sieger.filter(f).length / sieger.length).toFixed(1);
console.log(`\n  Sieger nach Runde 1: führte ${anteil(s => s.l === 1)} % · P2–3 ${anteil(s => s.l >= 2 && s.l <= 3)} % · P4–9 ${anteil(s => s.l >= 4 && s.l <= 9)} % · P10+ ${anteil(s => s.l >= 10)} %`);
console.log(`  Sieger vom Start:    P1 ${anteil(s => s.g === 1)} % · P2–3 ${anteil(s => s.g >= 2 && s.g <= 3)} % · P4–9 ${anteil(s => s.g >= 4 && s.g <= 9)} % · P10+ ${anteil(s => s.g >= 10)} %`);
