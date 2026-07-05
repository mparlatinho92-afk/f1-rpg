// Analytische Validierung der v3-Pools — repliziert die Laufzeit-Mathematik
// (ensureNamePoolsMerged + pickNameRegion + weightedPick) EXAKT und berechnet
// erwartete Verteilungen ohne Sampling-Rauschen.
// Aufruf: node validate-names-v3.js
'use strict';
const fs = require('fs');
const N = require('../../data/names.js');
const BASELINE = require('./baseline-namestats-2024.json');

// DECADE_NATION_POOLS live aus index.html ziehen (immer synchron)
const html = fs.readFileSync('../../index.html', 'utf8');
const m = html.match(/const DECADE_NATION_POOLS = (\{[\s\S]*?\n\s*\});/);
if (!m) { console.error('DECADE_NATION_POOLS nicht gefunden'); process.exit(1); }
const DECADES = eval('(' + m[1] + ')');

// ── Laufzeit-Merge replizieren (Tails → Gewicht 1) ──────────────────────────
const POOLS = JSON.parse(JSON.stringify(N.NAME_POOLS_BY_NATION));
for (const nat in N.NAME_TAILS_BY_NATION) {
    const pool = POOLS[nat];
    if (!pool) continue;
    for (const tail of N.NAME_TAILS_BY_NATION[nat]) {
        const region = pool.regions[tail.r];
        if (!region) continue;
        if (tail.last) for (const nm of tail.last) region.last.push([nm, 1]);
        if (tail.first) {
            if (Array.isArray(region.first)) for (const nm of tail.first) region.first.push([nm, 1]);
            else for (const nm of tail.first) { region.first.mid.push([nm, 1]); region.first.modern.push([nm, 1]); }
        }
    }
}

// P(name) je Nation+Jahr — exakt wie pickPooledName (ohne Dedup)
function dist(nation, year, kind) {
    const pool = POOLS[nation] || POOLS[N.NATION_NAME_FALLBACK[nation]] || POOLS.INT;
    const avail = pool.regions.filter(r => !r.minYear || year >= r.minYear);
    const list = avail.length ? avail : pool.regions;
    const totalW = list.reduce((s, r) => s + (r.w || 0), 0);
    const era = year < 1975 ? 'early' : year < 2010 ? 'mid' : 'modern';
    const out = new Map();
    for (const r of list) {
        const pr = (r.w || 0) / totalW;
        const arr = kind === 'last' ? r.last : (Array.isArray(r.first) ? r.first : (r.first[era] || r.first.mid));
        const sum = arr.reduce((s, e) => s + e[1], 0);
        for (const [n, w] of arr) out.set(n, (out.get(n) || 0) + pr * w / sum);
    }
    return out;
}

// ── 1) Kapazität (Galaxie-Metrik): distinkte Kombinationen je Nation ────────
console.log('— Kapazität (Jahr 2024: Vornamen modern × Nachnamen, je Nation) —');
let capRows = [];
for (const nat of Object.keys(POOLS)) {
    const f = dist(nat, 2024, 'first').size, l = dist(nat, 2024, 'last').size;
    capRows.push([nat, f, l, f * l]);
}
capRows.sort((a, b) => b[3] - a[3]);
for (const [nat, f, l, c] of capRows) console.log(`${nat}: ${f} first × ${l} last = ${c.toLocaleString('de-DE')} Kombos`);
const totalCap = capRows.reduce((s, r) => s + r[3], 0);
console.log(`GESAMT: ${totalCap.toLocaleString('de-DE')} distinkte Kombos (nur modern-Fenster)\n`);

// ── 2) Kopf-Klumpung je Nation vs. Baseline (v2) ────────────────────────────
console.log('— Kopf-Anteile Nachnamen (Top-3-Namen, % innerhalb Nation, 2024) — v3 vs. Baseline(v2)');
for (const nat of ['GBR', 'GER', 'USA', 'ITA', 'FRA', 'BRA', 'JPN', 'FIN']) {
    const d = [...dist(nat, 2024, 'last').entries()].sort((a, b) => b[1] - a[1]);
    const v3 = d.slice(0, 3).map(([n, p]) => `${n} ${(p * 100).toFixed(2)}%`).join(', ');
    const base = BASELINE.byNation[nat];
    let v2 = '(keine Baseline)';
    if (base && base.last) {
        const bl = Object.entries(base.last).sort((a, b) => b[1] - a[1]);
        v2 = bl.slice(0, 3).map(([n, c]) => `${n} ${(c / base.total * 100).toFixed(2)}%`).join(', ');
    }
    console.log(`${nat}\n  v3: ${v3}\n  v2: ${v2}`);
}

// ── 3) Smith:Müller über die Ären (mit aktuellem DECADE_NATION_POOLS) ───────
console.log('\n— Erwartete Namens-Häufigkeit pro 1000 Fahrer (via DECADE_NATION_POOLS) —');
function expectedPer1000(decadeKey, year, names) {
    const weights = DECADES[decadeKey].weights;
    const res = {};
    for (const name of names) res[name] = 0;
    for (const [nat, p] of Object.entries(weights)) {
        const d = dist(nat, year, 'last');
        for (const name of names) res[name] += p * (d.get(name) || 0) * 1000;
    }
    return res;
}
const watch = ['Smith', 'Johnson', 'Müller', 'Schmidt', 'Silva', 'Rossi', 'Martin', 'García'];
let blended = {};
const decades = [[1950, 1955], [1960, 1965], [1970, 1972], [1980, 1985], [1990, 1995], [2000, 2005], [2010, 2015], [2020, 2024]];
for (const [dec, yr] of decades) {
    const e = expectedPer1000(dec, yr, watch);
    for (const n of watch) blended[n] = (blended[n] || 0) + e[n] / decades.length;
}
console.log('Ären-Mix (1950er–2020er gleichgewichtet), pro 1000 Fahrer:');
for (const n of watch) console.log(`  ${n}: ${blended[n].toFixed(1)}`);
console.log(`  → Smith:Müller = ${(blended['Smith'] / blended['Müller']).toFixed(1)}:1 (v2-Ist laut Brief: ~32:1)`);
const e2020 = expectedPer1000(2020, 2024, watch);
console.log('Nur 2020er (Jahr 2024), pro 1000:', watch.map(n => `${n} ${e2020[n].toFixed(1)}`).join(', '));

// ── 4) Tail-Abdeckung: Anteil der Wahrscheinlichkeitsmasse im Long-Tail ─────
console.log('\n— Tail-Masse (Anteil der Picks außerhalb der Top-20-Nachnamen, 2024) —');
for (const nat of ['GBR', 'GER', 'USA', 'ITA', 'JPN', 'NOR', 'KOR']) {
    const d = [...dist(nat, 2024, 'last').values()].sort((a, b) => b - a);
    const head = d.slice(0, 20).reduce((s, p) => s + p, 0);
    console.log(`${nat}: Top-20 = ${(head * 100).toFixed(1)}% | Tail (${d.length - 20} Namen) = ${((1 - head) * 100).toFixed(1)}%`);
}

// ── 5) Schema-/Integritäts-Gegenprobe nach Merge ────────────────────────────
let issues = 0;
for (const [nat, pool] of Object.entries(POOLS)) {
    for (const r of pool.regions) {
        for (const [n, w] of r.last) if (typeof n !== 'string' || !(w > 0)) issues++;
        const fa = Array.isArray(r.first) ? { f: r.first } : r.first;
        for (const arr of Object.values(fa)) for (const [n, w] of arr) if (typeof n !== 'string' || !(w > 0)) issues++;
    }
}
console.log(`\nIntegrität nach Laufzeit-Merge: ${issues === 0 ? 'OK' : issues + ' PROBLEME'}`);
