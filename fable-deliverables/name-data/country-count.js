// Zählt je Land Zeilen und Träger in den Roh-CSVs (forenames.csv / surnames.csv) — prüft vor einer
// neuen Namenswelle, welche Länder überhaupt im Datensatz stehen und wie dicht.
// Aufruf: node country-count.js UA,BY,KZ,SG   (ISO-2, kommagetrennt; Roh-CSVs liegen gitignored lokal)
// Befund 03.10.2026: country_codes.csv ist vollständig — was dort fehlt, fehlt auch roh (README).
const fs = require('fs'), rl = require('readline');
const DIR = __dirname + '/F1 RPG Namenslisten & Namensgeneratoren/';
const W = new Set((process.argv[2] || '').split(',').filter(Boolean));
if (!W.size) { console.error('usage: node country-count.js ISO2,ISO2,...'); process.exit(1); }
async function run(f) {
    const st = {}; let n = 0;
    for await (const l of rl.createInterface({ input: fs.createReadStream(DIR + f), crlfDelay: Infinity })) {
        if (n++ === 0) continue;
        const p = l.split(','); if (p.length < 4) continue;
        const c = p[2].trim().toUpperCase(); if (!W.has(c)) continue;
        const s = st[c] || (st[c] = { rows: 0, sum: 0, top: 0 }); const k = +p[3] || 0;
        s.rows++; s.sum += k; if (k > s.top) s.top = k;
    }
    return st;
}
(async () => {
    const fo = await run('forenames.csv'), su = await run('surnames.csv'), z = { rows: 0, sum: 0, top: 0 };
    console.log('Land  Vor:Zeilen   Träger    Top | Nach:Zeilen   Träger    Top');
    for (const c of [...W].sort()) {
        const a = fo[c] || z, b = su[c] || z;
        console.log(c.padEnd(5), String(a.rows).padStart(10), String(a.sum).padStart(9), String(a.top).padStart(6), '|', String(b.rows).padStart(10), String(b.sum).padStart(9), String(b.top).padStart(6));
    }
})();
