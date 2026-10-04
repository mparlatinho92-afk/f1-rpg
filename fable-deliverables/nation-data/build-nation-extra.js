// ============================================================================
// build-nation-extra.js — Ergänzungs-Nationen für Junior-Welt und F1 (2026-10-04)
//
// Die Einsteiger-Verteilung INTAKE_NATION_SHARES (Paket H, index.html) kennt nur 59 Nationen. Für 41 weitere
// gibt es inzwischen Namens-Pools (Wellen 3–8), die nie gezogen wurden. Nutzer-Entscheid: erst die Junior-Welt
// (viele Serien, Testplattform für die Masse an Fahrern) profitiert; die F1 bleibt unangetastet, bis die
// Junior→F1-Brücke gebaut ist.
//
// Quelle: wikidata-cardrivers-norally-raw.json — dieselbe Abfrage wie build-nation-freq.js, aber OHNE Rallye
//   (Berufe rally driver / rally raid / rallycross, Sportarten rallying / rally raid / rallycross). Nutzer:
//   Rallye ist skandinavien-, Motorrad südeuropa-, US-Motorsport USA-lastig; Rundstrecke (GT, Formel, Touring)
//   ist gleichmäßiger verteilt. Motorrad war schon in der Ursprungsabfrage ausgeschlossen.
//   10.636 Fahrer (statt 12.207 mit Rallye). Uganda/Sambia/Madagaskar/Namibia fallen dadurch ganz weg.
//   WDQS-Abfrage:
//   SELECT ?c ?cLabel (SAMPLE(?iocv) AS ?ioc) ?decade (COUNT(DISTINCT ?p) AS ?n) WHERE {
//     { ?p wdt:P106/wdt:P279* wd:Q10349745 . } UNION { ?p wdt:P106 wd:Q378622 . }
//     MINUS { ?p wdt:P106 ?ro . VALUES ?ro { wd:Q10842936 wd:Q55441806 wd:Q55594106 } }
//     MINUS { ?p wdt:P641 ?rs . VALUES ?rs { wd:Q7856 wd:Q569205 wd:Q599204 } }
//     ?p wdt:P27 ?c . ?p wdt:P569 ?dob . OPTIONAL { ?c wdt:P984 ?iocv . }
//     BIND(FLOOR(YEAR(?dob)/10)*10 AS ?decade) FILTER(YEAR(?dob) >= 1880 && YEAR(?dob) <= 2012)
//     SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } GROUP BY ?c ?cLabel ?decade
//
// Rechnung je Debüt-Dekade (Geburt + 20, wie build-nation-freq.js):
//   Anteil = Fahrer der Nation / Fahrer der 59 Stamm-Nationen OHNE USA (US-Motorsport/NASCAR bläht die USA auf;
//   relativ zu ihr wären alle Kleinen zu klein). Glättung über fünf Dekaden 1–2–3–2–1 (s. KERNEL): die Zahlen sind
//   klein (1–15 Fahrer in 70 Jahren), sonst füllte ein einzelner Fahrer eine Dekade und ließe die nächste leer.
//   Aufgenommen werden nur Nationen mit Namens-Pool ODER Rückfall in data/names.js (sonst INT-Platzhalter).
//   Im Spiel: Gewicht = Anteil × Summe der jeweiligen Tabelle ohne USA (_mergeNationExtra, alle drei pickNation*).
//
// Aufruf: node build-nation-extra.js  → ../../data/nation-extra.js
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

// Mapping wie build-nation-freq.js (IOC-Alt-Codes, historische Staaten ohne P984)
const src = fs.readFileSync(path.join(__dirname, 'build-nation-freq.js'), 'utf8');
const grab = n => { const i = src.indexOf('const ' + n + ' ='); return eval('(' + src.slice(src.indexOf('{', i), src.indexOf('};', i) + 1) + ')'); };
const IOC_NORM = grab('IOC_NORM'), LABEL_MAP = grab('LABEL_MAP');
// IOC-Code ≠ Spiel-Code: Saudi-Arabien führt das Spiel als SAU (Stamm-Nation)
const GAME_CODE = { KSA: 'SAU' };

const raw = require('./wikidata-cardrivers-norally-raw.json').results.bindings;
const by = {};
for (const b of raw) {
    let ioc = (b.ioc && b.ioc.value) || LABEL_MAP[b.cLabel.value];
    if (!ioc) continue;
    ioc = IOC_NORM[ioc] || ioc; ioc = GAME_CODE[ioc] || ioc;
    const d = +b.decade.value + 20;
    (by[d] = by[d] || {})[ioc] = (by[d][ioc] || 0) + +b.n.value;
}

const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const i0 = idx.indexOf('const INTAKE_NATION_SHARES = {');
const master = new Set(idx.slice(i0, idx.indexOf('};', i0)).match(/\b[A-Z]{3}(?=:)/g));
const names = require(path.join(ROOT, 'data', 'names.js'));
const hasNames = n => !!(names.NAME_POOLS_BY_NATION[n] || names.NATION_NAME_FALLBACK[n]);

const DEC = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
const rawShare = {};
for (const d of [1930, 1940, ...DEC]) {
    const t = by[d] || {};
    const ref = Object.entries(t).filter(([k]) => master.has(k) && k !== 'USA').reduce((s, [, v]) => s + v, 0);
    rawShare[d] = {};
    for (const [k, v] of Object.entries(t)) if (!master.has(k) && hasNames(k) && ref) rawShare[d][k] = v / ref;
}
// Glättung über FÜNF Dekaden, Gewichte 1–2–3–2–1 (Nutzer-Entscheid 04.10.2026: ein einzelner prominenter Fahrer soll
// kein Jahrzehnt aufblähen — vgl. Thailand/Albon in den Paket-H-Tabellen; Barbados 2020er = praktisch nur Zane Maloney).
// Vorher 1/4–1/2–1/4 über drei Dekaden. Am Rand (1950, 2020) nur über die vorhandenen Dekaden 1930–2020 renormiert;
// die Debüt-Dekade 2030 (Geburt 2010–2012) ist unvollständig und zählt nicht.
const KERNEL = [[-20, 1], [-10, 2], [0, 3], [10, 2], [20, 1]];
const out = {}, total = {};
for (const d of DEC) {
    out[d] = {};
    const parts = KERNEL.filter(([o]) => rawShare[d + o]);
    const wsum = parts.reduce((s, [, w]) => s + w, 0);
    const keys = new Set(parts.flatMap(([o]) => Object.keys(rawShare[d + o])));
    for (const k of keys) {
        const s = parts.reduce((t, [o, w]) => t + w * (rawShare[d + o][k] || 0), 0) / wsum;
        if (s > 0) { out[d][k] = +s.toFixed(5); total[k] = (total[k] || 0) + s; }
    }
}
const nats = Object.keys(total).sort((a, b) => total[b] - total[a]);
let js = `// GENERIERT von fable-deliverables/nation-data/build-nation-extra.js — NICHT von Hand editieren.
// Ergänzungs-Nationen für Junior-Welt und F1 (_mergeNationExtra in allen drei pickNation*): Nationen mit Namens-Pool,
// die die 59 Stamm-Nationen von Paket H nicht kennen. Anteil je Debüt-Dekade relativ zu den Stamm-Nationen ohne USA,
// aus Wikidata-Rundstreckenfahrern ohne Rallye/Motorrad, über fünf Dekaden geglättet (Nutzer-Entscheid 04.10.2026).
// Stand: ${new Date().toISOString().slice(0, 10)} · ${nats.length} Nationen
const INTAKE_NATION_EXTRA = {
`;
for (const d of DEC) js += `    ${d}: { ${Object.entries(out[d]).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(',')} },\n`;
js += `};
if (typeof module !== 'undefined') module.exports = { INTAKE_NATION_EXTRA };
`;
fs.writeFileSync(path.join(ROOT, 'data', 'nation-extra.js'), js);
console.log(`data/nation-extra.js: ${nats.length} Nationen`);
console.log('Summe der Ergänzungsanteile je Dekade (relativ zu Stamm ohne USA): ' + DEC.map(d => d + ' ' + (100 * Object.values(out[d]).reduce((s, v) => s + v, 0)).toFixed(1) + '%').join(' · '));
console.log('Größte: ' + nats.slice(0, 12).map(k => k + ' ' + (100 * total[k] / DEC.length).toFixed(2) + '%').join(', ') + ' (Ø je Dekade)');
