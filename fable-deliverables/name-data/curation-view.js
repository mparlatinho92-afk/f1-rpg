// Kompakt-Ansicht für die Pool-Kuration: pro Land Top-N Namen mit 1–5-Bucket.
// Bucket: r = count/max je Land; r>=0.5→5, >=0.2→4, >=0.08→3, >=0.02→2, sonst 1
// Aufruf: node curation-view.js fore_agg.csv 35 [LÄNDER,KOMMA-GETRENNT]
const fs = require('fs');
const [,, file, topNArg = '35', onlyArg] = process.argv;
const TOP_N = parseInt(topNArg, 10);
const only = onlyArg ? new Set(onlyArg.split(',')) : null;

const byC = new Map();
const lines = fs.readFileSync(file, 'utf8').split('\n');
for (let i = 1; i < lines.length; i++) {
    const line = lines[i]; if (!line) continue;
    const m = line.match(/^([A-Z]{2}),"(.*)",(\d+)$/); if (!m) continue;
    const [, c, name, cnt] = m;
    if (only && !only.has(c)) continue;
    if (!byC.has(c)) byC.set(c, []);
    byC.get(c).push([name, parseInt(cnt, 10)]);
}
for (const c of [...byC.keys()].sort()) {
    const arr = byC.get(c); // bereits count-desc sortiert aus Aggregat
    const max = arr[0][1];
    const bucket = (n) => { const r = n / max; return r >= 0.5 ? 5 : r >= 0.2 ? 4 : r >= 0.08 ? 3 : r >= 0.02 ? 2 : 1; };
    console.log(c + ': ' + arr.slice(0, TOP_N).map(([n, cnt]) => `${n}:${bucket(cnt)}`).join(' '));
}
