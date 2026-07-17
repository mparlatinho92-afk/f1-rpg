#!/usr/bin/env node
// Paket I — D3: Zipf-Exponent s je Nation/Kohorte aus ECHTEN Counts fitten.
// share(rank) ∝ rank^(-s)  →  log-log-Regression über die Top-RMAX je Bucket.
// Zweck: (1) Drift-Prüfung über die Zeit (Konzentration nimmt real ab),
//        (2) Kalibrierwert für die Rang-only-Quellen (GER ganz, GBR 1904–94,
//            ITA vor 1999).
//
// Aufruf: node zipf-calibrate.js   (liest ../data/cohorts-*.json)

const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname, '..', 'data');
const RMAX = 80;   // Fit-Tiefe: entspricht der Tiefe der Rang-only-Quellen (GER 80–300, GBR 100)

function fitBucket(shares) {
    // shares: absteigend sortierte Anteile der Top-RMAX
    const pts = shares.slice(0, RMAX).filter(s => s > 0)
        .map((s, i) => [Math.log(i + 1), Math.log(s)]);
    if (pts.length < 20) return null;
    const n = pts.length;
    const sx = pts.reduce((a, p) => a + p[0], 0), sy = pts.reduce((a, p) => a + p[1], 0);
    const sxx = pts.reduce((a, p) => a + p[0] * p[0], 0), sxy = pts.reduce((a, p) => a + p[0] * p[1], 0);
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    // R² des Fits
    const ybar = sy / n, b0 = ybar - slope * (sx / n);
    let ssr = 0, sst = 0;
    for (const [x, y] of pts) { const e = y - (b0 + slope * x); ssr += e * e; sst += (y - ybar) ** 2; }
    return { s: -slope, r2: 1 - ssr / sst, n };
}

const out = {};
for (const nat of ['USA', 'FRA', 'GBR', 'ITA']) {
    const d = JSON.parse(fs.readFileSync(path.join(DATA, `cohorts-${nat}.json`), 'utf8'));
    const rows = [];
    for (let i = 0; i < d.bucketStarts.length; i++) {
        if (!d.totals[i]) continue;
        const shares = Object.values(d.names).map(a => a[i] / d.totals[i]).filter(x => x > 0)
            .sort((a, b) => b - a);
        const f = fitBucket(shares);
        if (f) rows.push({ kohorte: d.bucketStarts[i], s: +f.s.toFixed(3), r2: +f.r2.toFixed(3) });
    }
    out[nat] = rows;
    console.log(`\n${nat}  (Fit-Tiefe Top-${RMAX}, log-log-OLS)`);
    console.table(rows);
}

// Ära-Mittel (für die Anwendung auf Rang-only-Quellen)
console.log('\nÄra-Mittelwerte von s:');
for (const nat in out) {
    const eras = { 'vor 1950': [1900, 1949], '1950-1979': [1950, 1979], '1980-2004': [1980, 2004], 'ab 2005': [2005, 2024] };
    const line = { nat };
    for (const [label, [a, b]] of Object.entries(eras)) {
        const v = out[nat].filter(r => r.kohorte >= a && r.kohorte <= b).map(r => r.s);
        line[label] = v.length ? +(v.reduce((x, y) => x + y, 0) / v.length).toFixed(3) : '—';
    }
    console.log(line);
}
fs.writeFileSync(path.join(DATA, 'zipf-fit.json'), JSON.stringify(out, null, 1));
console.log('\n-> data/zipf-fit.json');
