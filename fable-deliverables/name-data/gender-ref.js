// Geschlechter-Referenz für Länder ohne Geschlechtsangabe im Roh-Datensatz (TN, DZ, LY, LB, BH: nur "leer").
// Summiert M/F je Namensschlüssel über Länder MIT Angabe (arabisch + französisch für Maghreb-Schreibungen).
// Aufruf: node gender-ref.js   → w5_gender_ref.csv (key,M,F; nur Schlüssel mit M+F >= 20, die in w5_fore_u_agg/w5_sur_agg vorkommen). Gibt nur Zahlen aus.
const fs = require('fs'), rl = require('readline');
const REF = new Set(['EG','SA','AE','QA','OM','JO','IQ','KW','SY','PS','YE','MA','FR','BE','CA','CH']);
const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const m = new Map(); let n = 0;
const r = rl.createInterface({ input: fs.createReadStream(__dirname + '/F1 RPG Namenslisten & Namensgeneratoren/forenames.csv') });
r.on('line', l => {
    if (n++ === 0) return;
    const p = l.split(','); if (p.length < 4) return;
    const c = p[2].trim().toUpperCase(), g = p[1].trim().toUpperCase();
    if (!REF.has(c) || (g !== 'M' && g !== 'F')) return;
    const k = key(p[0].trim()); const e = m.get(k) || { M: 0, F: 0 };
    e[g] += (+p[3] || 0); m.set(k, e);
});
r.on('close', () => {
    // nur Schlüssel, die in den Welle-5-Aggregaten vorkommen (sonst ~4 MB fürs Repo)
    const need = new Set();
    for (const f of ['w5_fore_u_agg.csv', 'w5_sur_agg.csv']) {
        if (!fs.existsSync(__dirname + '/' + f)) continue;
        for (const l of fs.readFileSync(__dirname + '/' + f, 'utf8').split('\n')) { const x = l.match(/^[A-Z]{2},"(.*)",\d+$/); if (x) need.add(key(x[1].trim())); }
    }
    const rows = [...m.entries()].filter(([k, e]) => e.M + e.F >= 20 && (!need.size || need.has(k)));
    fs.writeFileSync(__dirname + '/w5_gender_ref.csv', 'key,M,F\n' + rows.map(([k, e]) => `"${k}",${e.M},${e.F}`).join('\n'));
    console.log('Referenz-Schlüssel', rows.length, 'davon überwiegend weiblich', rows.filter(([, e]) => e.F > e.M).length);
});
