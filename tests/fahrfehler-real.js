/**
 * fahrfehler-real.js — Fahrfehler OHNE Ausfall messen (✚ „Fahrfehler-Mechanik“, Nutzer 23.11.2026)
 *
 * „Dreherhäufigkeit ist nicht direkt messbar“ — F1DB kennt nur Ausfälle. Die jolpica-Runden (1996–2024,
 * tests/jolpica-data/runden-YYYY.json) enthalten die Reihenfolge nach jeder Runde. Ein Fahrfehler (Dreher,
 * Ausritt, Verbremser) zeigt sich als PLÖTZLICHER Platzverlust in EINER Runde:
 *   • Verlust ≥ VERLUST Plätze von Runde n−1 auf n,
 *   • kein eigener Boxenstopp in Runde n oder n−1 (F1DB races-pit-stops; die Box kostet in Runde n oder n+1),
 *   • nicht Runde 1 (Startgetümmel), Fahrer fährt danach noch ≥ 2 Runden (kein Ausfall in derselben Runde).
 * ⚠ Unschärfe: auch ein Plattfuß oder ein Defekt mit Weiterfahrt sieht so aus; ein Fehler, der nur 1–2 Plätze
 *   kostet, bleibt unsichtbar. Gemessen wird also „sichtbarer Zwischenfall ohne Ausfall“, Obergrenze für Fahrfehler.
 *
 * Ausgabe: Anteil der Rennen mit ≥ 1 Zwischenfall je Fahrer, je Ära; Verteilung der Verlustgröße; Zusammenhang mit
 * der neuen Konstanz (tests/output/konstanz-f1db.json) — trifft es inkonstante Fahrer öfter?
 *
 * Aufruf: node tests/fahrfehler-real.js [VERLUST=3]
 */
'use strict';
const fs = require('fs'), path = require('path');
const VERLUST = +(process.argv[2] || 3);
const root = path.join(__dirname, '..');
const J = f => JSON.parse(fs.readFileSync(path.join(root, 'f1db-json-splitted', `f1db-${f}.json`), 'utf8'));
const f1drv = J('drivers'), pits = J('races-pit-stops');
const KON = JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'konstanz-f1db.json'), 'utf8'));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const nachDob = {};
for (const d of f1drv) if (d.dateOfBirth) (nachDob[d.dateOfBirth] ??= []).push(d);
const slugVon = info => {
    const k = nachDob[info.dob] || [];
    return (k.find(d => norm(d.lastName) === norm(info.family)) || k.find(d => norm(d.lastName).includes(norm(info.family).slice(0, 4))) || k[0] || {}).id;
};
const boxe = {};   // jahr|runde|slug → Set(lap)
for (const p of pits) (boxe[`${p.year}|${p.round}|${p.driverId}`] ??= new Set()).add(p.lap);

const st = {};   // slug|jahr → { rennen, mitFehler, fehler }
const groessen = {}, proAera = {};
for (let jahr = 1996; jahr <= 2024; jahr++) {
    const datei = path.join(__dirname, 'jolpica-data', `runden-${jahr}.json`);
    if (!fs.existsSync(datei)) continue;
    const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
    const slug = {}; for (const [jid, info] of Object.entries(d.drivers || {})) slug[jid] = slugVon(info);
    for (const r of d.races || []) {
        const ids = r.ids, laps = r.laps || [];
        const posIn = laps.map(l => { const m = {}; l.forEach((idx, p) => { m[idx] = p + 1; }); return m; });
        for (let i = 0; i < ids.length; i++) {
            const s = slug[ids[i]]; if (!s) continue;
            const box = boxe[`${jahr}|${r.round}|${s}`] || new Set();
            let letzte = 0; for (let n = 0; n < laps.length; n++) if (posIn[n][i] != null) letzte = n;
            if (letzte < 5) continue;   // kaum gefahren
            const e = st[`${s}|${jahr}`] ??= { rennen: 0, mitFehler: 0, fehler: 0 };
            e.rennen++;
            let hier = 0;
            for (let n = 2; n <= letzte - 2; n++) {   // laps[0] = Startaufstellung/Runde 1 → ab Runde 2
                const a = posIn[n - 1][i], b = posIn[n][i];
                if (a == null || b == null) continue;
                if (box.has(n) || box.has(n + 1) || box.has(n - 1)) continue;
                if (b - a >= VERLUST) { hier++; groessen[b - a] = (groessen[b - a] || 0) + 1; }
            }
            if (hier) { e.mitFehler++; e.fehler += hier; }
            const ae = Math.floor(jahr / 10) * 10 + 'er', a2 = proAera[ae] ??= { rennen: 0, mit: 0 };
            a2.rennen++; if (hier) a2.mit++;
        }
    }
}
const summe = Object.values(st).reduce((a, e) => ({ r: a.r + e.rennen, m: a.m + e.mitFehler, f: a.f + e.fehler }), { r: 0, m: 0, f: 0 });
console.log(`FAHRFEHLER OHNE AUSFALL 1996–2024 (Verlust ≥ ${VERLUST} Plätze in einer Runde, ohne Box, nicht Runde 1)`);
console.log(`  Fahrer-Rennen ${summe.r} · mit Zwischenfall ${(100 * summe.m / summe.r).toFixed(1)} % · Zwischenfälle je Rennen ${(summe.f / summe.r).toFixed(3)}`);
for (const [a, v] of Object.entries(proAera)) console.log(`  ${a}: ${(100 * v.mit / v.rennen).toFixed(1)} % der Fahrer-Rennen (n ${v.rennen})`);
console.log('  Verlustgröße: ' + Object.entries(groessen).sort((a, b) => a[0] - b[0]).map(([g, n]) => `${g}:${n}`).join(' '));
// Zusammenhang mit der neuen Konstanz
const gr = {};
for (const [k, e] of Object.entries(st)) {
    const [s, j] = k.split('|'); const kv = KON.fahrer[s]?.[j]?.K; if (kv == null || e.rennen < 8) continue;
    const g = kv >= 88 ? 'K ≥ 88' : kv >= 82 ? 'K 82–87' : kv >= 76 ? 'K 76–81' : kv >= 70 ? 'K 70–75' : 'K < 70';
    const x = gr[g] ??= { r: 0, m: 0, n: 0 }; x.r += e.rennen; x.m += e.mitFehler; x.n++;
}
console.log('  nach Konstanz (F1DB, Saisons mit ≥ 8 Rennen):');
for (const g of ['K < 70', 'K 70–75', 'K 76–81', 'K 82–87', 'K ≥ 88']) if (gr[g]) console.log(`    ${g.padEnd(8)} ${String(gr[g].n).padStart(4)} Saisons · Zwischenfall in ${(100 * gr[g].m / gr[g].r).toFixed(1)} % der Rennen`);
const top = Object.entries(st).filter(([, e]) => e.rennen >= 12).map(([k, e]) => [k, 100 * e.mitFehler / e.rennen]).sort((a, b) => b[1] - a[1]);
console.log('  häufigste Saisons: ' + top.slice(0, 8).map(([k, v]) => `${k} ${v.toFixed(0)} %`).join(', '));
console.log('  seltenste Saisons: ' + top.slice(-6).map(([k, v]) => `${k} ${v.toFixed(0)} %`).join(', '));

// ── Erfahrung (25.11.2026): Zwischenfälle je Karrierejahr, gegen das eigene Mittel desselben Fahrers ─────────────
// Karrierejahr wie tests/konstanz-karriere.js (Zahl der F1DB-Saisons mit Ergebnis bis einschließlich dieser).
// „eigen“ = Fahrer mit ≥ 3 Saisons à ≥ 8 Rennen; dämpft die Auslese (wer oft dreht, fliegt früh).
{
    const kj = {}; for (const [s, jj] of Object.entries(KON.fahrer)) Object.keys(jj).map(Number).sort((a, b) => a - b).forEach((j, i) => { kj[s + '|' + j] = i + 1; });
    const eig = {};
    for (const [k, e] of Object.entries(st)) { if (e.rennen < 8) continue; const s = k.split('|')[0]; const x = eig[s] ??= { r: 0, m: 0, n: 0 }; x.r += e.rennen; x.m += e.mitFehler; x.n++; }
    const STUFEN = [[1, 1], [2, 2], [3, 3], [4, 5], [6, 8], [9, 12], [13, 99]];
    console.log('\n  nach Karrierejahr (Saisons ≥ 8 Rennen): Feld % · eigen Pp  [1996–2009 | 2010–2024]');
    for (const [von, bis] of STUFEN) {
        const teil = [[1996, 2009], [2010, 2024]].map(([a, b]) => {
            let r = 0, m = 0, er = 0, ed = 0, n = 0;
            for (const [k, e] of Object.entries(st)) {
                const [s, j] = k.split('|'); const t = kj[k];
                if (e.rennen < 8 || t == null || t < von || t > bis || +j < a || +j > b) continue;
                n++; r += e.rennen; m += e.mitFehler;
                if (eig[s].n >= 3) { er += e.rennen; ed += e.mitFehler - e.rennen * eig[s].m / eig[s].r; }
            }
            return `n ${String(n).padStart(3)} · ${(100 * m / r).toFixed(1).padStart(4)} % · ${(ed >= 0 ? '+' : '') + (100 * ed / er).toFixed(1)}`;
        });
        console.log(`    ${(bis >= 99 ? von + '+' : von === bis ? '' + von : von + '–' + bis).padStart(5)}   ${teil.join('  |  ')}`);
    }
}
