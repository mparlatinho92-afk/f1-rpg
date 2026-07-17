#!/usr/bin/env node
// Paket I — D4-Baseline: effektive Vornamen-Poolgröße (Simpson 1/Σp²) je
// Ära-Fenster im HEUTIGEN Pool (data/names.js, Region 0 der 5 Split-Nationen),
// inkl. Laufzeit-Merge-Nachbildung: Tails gehen mit Gewicht 1 an mid+modern
// (ensureNamePoolsMerged, index.html ~L5066). NUR LESEND.
//
// Aufruf: node vorher-eff.js [pfad-zu-names.js]   (Default: ../../../data/names.js)

const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', '..', '..', 'data', 'names.js');
const src = fs.readFileSync(file, 'utf8');
const { NAME_POOLS_BY_NATION: POOLS, NAME_TAILS_BY_NATION: TAILS } =
    new Function(src + '; return { NAME_POOLS_BY_NATION, NAME_TAILS_BY_NATION };')();

const eff = arr => {
    const tot = arr.reduce((s, [, w]) => s + w, 0);
    return tot ? 1 / arr.reduce((s, [, w]) => s + (w / tot) ** 2, 0) : 0;
};

for (const nat of ['GER', 'GBR', 'USA', 'FRA', 'ITA']) {
    const r0 = POOLS[nat].regions[0];
    const tails = (TAILS && TAILS[nat] || []).filter(t => t.r === 0 && t.first)
        .flatMap(t => t.first.map(n => [n, 1]));
    const f = r0.first;
    const win = Array.isArray(f)
        ? { flach: f }
        : { early: f.early, mid: [...f.mid, ...tails], modern: [...f.modern, ...tails] };
    const out = {};
    const union = new Set();
    for (const [k, arr] of Object.entries(win)) {
        out[k] = `${arr.length} Namen / eff ${eff(arr).toFixed(0)}`;
        arr.forEach(([n]) => union.add(n));
    }
    console.log(nat, JSON.stringify(out), `Union ${union.size}`);
}
