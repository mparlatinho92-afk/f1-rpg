#!/usr/bin/env node
// Paket I — D1: (a) Umschlagsrate der Vornamen zwischen Geburtskohorten,
// (b) Fit-Güte der Kurven-Bauform B (Gauß je Name: [peak, sigma, amplitude]).
//
// (a) Jaccard + gewichteter Overlap der Top-50 bei Lag 5/10/20 Jahren.
// (b) Je Name (Anteil-Zeitreihe über 5J-Buckets): Least-Squares-Gauß-Fit via
//     Grid-Search (peak×sigma, Amplitude closed-form). Danach optional zweite
//     Komponente auf dem Residuum → wie viele Namen brauchen 2 Komponenten?
//     Güte-Maß: massegewichtetes R².
//
// Aufruf: node analyze-turnover.js   (liest ../data/cohorts-*.json)

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const NATIONS = ['USA', 'FRA', 'GBR'];

function load(nat) {
    const d = JSON.parse(fs.readFileSync(path.join(DATA, `cohorts-${nat}.json`), 'utf8'));
    d.mid = d.bucketStarts.map(s => s + 2);       // Bucket-Mittenjahr
    d.share = {};
    for (const n in d.names) d.share[n] = d.names[n].map((c, i) => d.totals[i] ? c / d.totals[i] : 0);
    return d;
}

function topK(d, i, k) {
    return Object.keys(d.share).filter(n => d.share[n][i] > 0)
        .sort((a, b) => d.share[b][i] - d.share[a][i]).slice(0, k);
}

// ── (a) Umschlagsrate ────────────────────────────────────────────────────
function turnover(d, validFrom, validTo) {
    const rows = [];
    for (const lag of [1, 2, 4]) { // Buckets → 5/10/20 Jahre
        const j = [], wo = [];
        for (let i = 0; i < d.mid.length - lag; i++) {
            if (d.mid[i] < validFrom || d.mid[i + lag] > validTo) continue;
            const A = new Set(topK(d, i, 50)), B = new Set(topK(d, i + lag, 50));
            if (A.size < 50 || B.size < 50) continue;
            const inter = [...A].filter(x => B.has(x));
            j.push(inter.length / (A.size + B.size - inter.length));
            // gewichteter Overlap: Anteil der Kohorten-i-Top-50-Masse, die in i+lag Top-50 bleibt
            const massA = [...A].reduce((s, n) => s + d.share[n][i], 0);
            wo.push(inter.reduce((s, n) => s + d.share[n][i], 0) / massA);
        }
        const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
        rows.push({ lagJahre: lag * 5, jaccardTop50: +avg(j).toFixed(3), masseVerbleib: +avg(wo).toFixed(3), nPaare: j.length });
    }
    return rows;
}

// ── (b) Gauß-Fit ─────────────────────────────────────────────────────────
// Amplitude closed-form: a* = Σ(y·g)/Σ(g²) mit g = exp(-((t-p)/s)²/2)
function fitGauss(t, y, peaks, sigmas) {
    let best = null;
    for (const p of peaks) for (const s of sigmas) {
        let sg = 0, syg = 0;
        const g = t.map(tt => Math.exp(-(((tt - p) / s) ** 2) / 2));
        for (let i = 0; i < t.length; i++) { sg += g[i] * g[i]; syg += y[i] * g[i]; }
        const a = sg ? Math.max(0, syg / sg) : 0;
        let sse = 0;
        for (let i = 0; i < t.length; i++) { const e = y[i] - a * g[i]; sse += e * e; }
        if (!best || sse < best.sse) best = { p, s, a, sse };
    }
    return best;
}

function fitQuality(d, nat, validIdx) {
    const t = validIdx.map(i => d.mid[i]);
    const peaks = [];
    for (let p = t[0] - 30; p <= t[t.length - 1] + 30; p += 2) peaks.push(p);
    const sigmas = [4, 6, 8, 10, 13, 16, 20, 25, 30, 40, 55, 75];
    const res = { nat, names: 0, mass1: 0, massTot: 0, r2w1: 0, r2w2: 0, need2: 0, need2Mass: 0, worst: [] };
    for (const n in d.share) {
        const y = validIdx.map(i => d.share[n][i]);
        const mass = y.reduce((a, b) => a + b, 0);
        if (mass < 0.002) continue;                 // Kleinstserien: Fit sinnlos
        res.names++;
        const sst = y.reduce((a, b) => a + (b - mass / y.length) ** 2, 0);
        const f1 = fitGauss(t, y, peaks, sigmas);
        // 2. Komponente auf Residuum
        const resid = y.map((v, i) => v - f1.a * Math.exp(-(((t[i] - f1.p) / f1.s) ** 2) / 2));
        const f2 = fitGauss(t, resid, peaks, sigmas);
        const r2_1 = sst ? 1 - f1.sse / sst : 1;
        const r2_2 = sst ? 1 - f2.sse / sst : 1;   // f2.sse = SSE nach beiden Komponenten
        res.massTot += mass;
        res.r2w1 += mass * r2_1; res.r2w2 += mass * r2_2;
        if (r2_1 < 0.8 && r2_2 >= 0.8) { res.need2++; res.need2Mass += mass; }
        if (r2_1 < 0.6) res.worst.push([n, +r2_1.toFixed(2), +mass.toFixed(3)]);
    }
    res.r2w1 = +(res.r2w1 / res.massTot).toFixed(3);
    res.r2w2 = +(res.r2w2 / res.massTot).toFixed(3);
    res.need2MassPct = +(100 * res.need2Mass / res.massTot).toFixed(1);
    res.worst.sort((a, b) => b[2] - a[2]);
    res.worst = res.worst.slice(0, 12);
    delete res.massTot; delete res.mass1; delete res.need2Mass;
    return res;
}

for (const nat of NATIONS) {
    const d = load(nat);
    // GBR: nur 1996–2020 sind echte Counts
    const [vFrom, vTo] = nat === 'GBR' ? [1996, 2022] : [1900, 2022];
    const validIdx = d.mid.map((m, i) => [m, i]).filter(([m]) => m >= vFrom && m <= vTo).map(([, i]) => i);
    console.log(`\n════ ${nat} ════`);
    console.table(turnover(d, vFrom, vTo));
    if (validIdx.length >= 5) {
        const q = fitQuality(d, nat, validIdx);
        console.log(`Gauß-Fit (massegew. R²): 1 Komponente ${q.r2w1} | 2 Komponenten ${q.r2w2}`);
        console.log(`Namen mit Fit (Masse≥0.2%-Kohortenpunkte): ${q.names}; brauchen 2. Komponente: ${q.need2} (${q.need2MassPct}% der Masse)`);
        console.log('Schlechteste 1K-Fits (Name, R², Masse):', JSON.stringify(q.worst));
    } else {
        console.log('(zu wenige Count-Buckets für Fit-Test)');
    }
}
