/**
 * konstanz-karriere.js — Hebt Erfahrung die Konstanz? Messung aus F1DB (25.11.2026)
 *
 * Liest tests/output/konstanz-f1db.json (tools/build-consistency.js, Rohwert je Saison = roh, ungeglättet) und
 * f1db-drivers.json (Geburtsdatum). Drei Sichten je Karrierejahr bzw. Alter, getrennt nach Ära:
 *   • Feld-Mittel     — Ø roh aller Fahrer dieses Karrierejahrs (⚠ Auslese: wer schwach ist, fliegt raus)
 *   • eigen K / F     — Abweichung vom eigenen Karriere-Mittel DESSELBEN Fahrers (≥ 3 Saisons), K und Fehler-%;
 *                       dämpft die Auslese. Unten zusätzlich das Folgejahr-Δ je Karrierejahr mit Standardfehler
 *   • Bestandteile    — Fehler-Ausfälle (absolut) und Einbrüche (gegen den Teamkollegen, relativ) je Rennen
 * ⚠ Messfalle: der Einbruch ist relativ zum Teamkollegen — reifen beide gleich, hebt sich das auf. Absolut ist nur
 *   der Fehler-Ausfall. Karrierejahr = Zahl der F1-Saisons mit Ergebnis bis einschließlich dieser.
 *
 * Aufruf: node tests/konstanz-karriere.js [minN=5]
 */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const MIN_N = +(process.argv[2] || 5);
const KON = JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'konstanz-f1db.json'), 'utf8'));
const geb = {};
for (const d of JSON.parse(fs.readFileSync(path.join(root, 'f1db-json-splitted', 'f1db-drivers.json'), 'utf8')))
    if (d.dateOfBirth) geb[d.id] = +d.dateOfBirth.slice(0, 4);

const AERA = [[1950, 1969], [1970, 1989], [1990, 2009], [2010, 2026]];
const KJ = [[1, 1], [2, 2], [3, 3], [4, 5], [6, 8], [9, 12], [13, 99]];
const ALT = [[17, 22], [23, 25], [26, 28], [29, 31], [32, 34], [35, 37], [38, 99]];
const aeraVon = j => AERA.findIndex(([a, b]) => j >= a && j <= b);

const zeilen = [];   // { slug, jahr, kj, alter, roh, n, fehler, einbruch }
for (const [slug, jj] of Object.entries(KON.fahrer)) {
    const jahre = Object.keys(jj).map(Number).sort((a, b) => a - b);
    jahre.forEach((j, i) => {
        const v = jj[j];
        zeilen.push({ slug, jahr: j, kj: i + 1, alter: geb[slug] ? j - geb[slug] : null, roh: v.roh, n: v.n,
            fehler: v.fehler + 0.5 * v.koll, einbruch: v.einbruch, naechstes: jj[j + 1] ? { roh: jj[j + 1].roh, n: jj[j + 1].n } : null });
    });
}
const pad = (s, l) => String(s).padStart(l);

// Fahrer-eigenes Mittel (Saisons ≥ MIN_N, Fahrer mit ≥ 3 solchen Saisons) → Abweichung je Saison ohne Auslese-Effekt
const eigen = {};
for (const r of zeilen) if (r.n >= MIN_N && r.roh != null) { const e = eigen[r.slug] ??= { s: 0, n: 0, f: 0, k: 0 }; e.s += r.roh * r.n; e.f += r.fehler; e.n += r.n; e.k++; }
for (const e of Object.values(eigen)) { e.roh = e.s / e.n; e.fq = e.f / e.n; }
function tabelle(titel, feld, stufen) {
    console.log(`
${titel} (Saisons mit ≥ ${MIN_N} gezählten Rennen; „eigen“ = gegen das Mittel desselben Fahrers, ≥ 3 Saisons)`);
    console.log('  Stufe     ' + AERA.map(([a, b]) => `| ${a}–${String(b).slice(2)}:  n  Feld eigenK Fehl% eigenF`).join(' '));
    for (const [von, bis] of stufen) {
        let zeile = `  ${pad(bis >= 99 ? von + '+' : von === bis ? von : von + '–' + bis, 6)}    `;
        AERA.forEach((_, e) => {
            const z = zeilen.filter(r => aeraVon(r.jahr) === e && r[feld] != null && r[feld] >= von && r[feld] <= bis && r.n >= MIN_N && r.roh != null);
            const N = z.reduce((s, r) => s + r.n, 0);
            const feldK = z.reduce((s, r) => s + r.roh * r.n, 0) / N, fe = 100 * z.reduce((s, r) => s + r.fehler, 0) / N;
            const ze = z.filter(r => eigen[r.slug].k >= 3), NE = ze.reduce((s, r) => s + r.n, 0);
            const eK = ze.reduce((s, r) => s + (r.roh - eigen[r.slug].roh) * r.n, 0) / NE;
            const eF = 100 * ze.reduce((s, r) => s + (r.fehler - eigen[r.slug].fq * r.n), 0) / NE;
            const f = (x, plus) => isFinite(x) ? (plus && x >= 0 ? '+' : '') + x.toFixed(1) : '–';
            zeile += `| ${pad(z.length, 9)} ${pad(f(feldK), 5)} ${pad(f(eK, 1), 6)} ${pad(f(fe), 5)} ${pad(f(eF, 1), 6)} `;
        });
        console.log(zeile);
    }
}
console.log(`KONSTANZ NACH KARRIEREJAHR UND ALTER — F1DB-Messung Schwelle ${KON.schwelle}, Rampe ${KON.rampe ?? '–'}, Norm ${KON.norm ?? 'median'}`);
tabelle('KARRIEREJAHR', 'kj', KJ);
tabelle('ALTER', 'alter', ALT);

// Gesamt über alle Ären: Folgejahr-Δ je Karrierejahr einzeln (1→2, 2→3 …), mit Fehlerbalken
console.log('\nFOLGEJAHR-Δ JE KARRIEREJAHR, alle Ären (Ø roh[t+1] − roh[t], ± Standardfehler)');
for (let t = 1; t <= 14; t++) {
    const zd = zeilen.filter(r => r.kj === t && r.n >= MIN_N && r.roh != null && r.naechstes && r.naechstes.n >= MIN_N && r.naechstes.roh != null);
    if (zd.length < 10) continue;
    const d = zd.map(r => r.naechstes.roh - r.roh), m = d.reduce((s, x) => s + x, 0) / d.length;
    const se = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (d.length - 1) / d.length);
    console.log(`  ${pad(t, 2)} → ${pad(t + 1, 2)}: n ${pad(zd.length, 4)} · Δ ${(m >= 0 ? '+' : '') + m.toFixed(1)} ± ${se.toFixed(1)}`);
}
