// ============================================================================
// Paket J WELLE 3 — gen-era-curve-excludes.js: ERA_FIRST_EXCLUDE generieren
//
// PROBLEM: Die Paket-I-Kurven (data/era-first-names.js) basieren auf NATIONALEN
// Statistiken — Einwanderer-Vornamen sind ENTHALTEN (Header dort: „Routing →
// Paket J"). Zur Laufzeit zieht Region 0 aus der Kurve und umgeht damit alle
// Pool-Routen/-Bans: „Mehmet Schneider" (GER-Kurve Mehmet × r0-Schneider) und
// „Carlos Faure" (FRA-Kurve Carlos) lebten seit v0.9.14.82 an Paket J vorbei.
//
// LÖSUNG: Statische Ausschlussliste je Kurven-Nation = Kurven-Namen, die
//   (a) per ROUTE_FIRST exklusiv in eine Region ≠ 0 geroutet sind (Jose→USA r1,
//       Mehmet→GER r1) — geteilte Ziele ([0,1]) bleiben natürlich drin! — oder
//   (b) vom effektiven banFirst getroffen werden (BAN_FIRST + globale Guard):
//       FRA-Carlos (Iberisch-Ban), ITA-Ali (Guard).
// Ausgabe: paste-fertige Konstante für index.html (eraFirstArr filtert damit).
//
// Aufruf: node gen-era-curve-excludes.js   (nach jeder Kurven-/Routen-Änderung
// neu laufen lassen und die Konstante in index.html aktualisieren!)
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const RR = require('./region-routes.js');
const GF = require('./global-first-filters.js');

// era-first-names.js ist eine Browser-Datei (keine Exports) → als Skript laden
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'era-first-names.js'), 'utf8');
const ERA = new Function(src + '; return ERA_FIRST_NAMES;')();

// Effektive banFirst je Kurven-Nation (Kopie der Build-Logik build-names-v3.js):
// BAN_FIRST aus region-routes (ersetzt CFG-banFirst) + Guard. GBR/USA/ITA haben
// kein explizites banFirst (nur Routen/Guard).
const BANS = {
    GER: RR.BAN_FIRST.GER || [],
    GBR: [],
    USA: [],
    FRA: RR.BAN_FIRST.FRA || [],
    ITA: []
};

const out = {};
for (const nat of Object.keys(ERA)) {
    const routes = RR.ROUTE_FIRST[nat] || [];
    const guard = GF.makeFirstGuard(nat, routes);
    const bans = [...(BANS[nat] || []), ...(guard ? [guard] : [])];
    const excl = [];
    for (const name of Object.keys(ERA[nat])) {
        // (a) exklusiv nicht-r0 geroutet? (erster Treffer gewinnt, wie im Build)
        let routedAway = false;
        for (const [re, target] of routes) {
            if (!re.test(name)) continue;
            routedAway = Array.isArray(target) ? !target.includes(0) : target !== 0;
            break;
        }
        // (b) effektiv gebannt?
        const banned = bans.some(b => b.test(name));
        if (routedAway || banned) excl.push(name);
    }
    out[nat] = excl.sort();
}

console.log('// GENERIERT von fable-deliverables/paketJ-ethno-regionen/gen-era-curve-excludes.js');
console.log('// (Welle 3) — Kurven-Namen, die Region 0 nicht ziehen darf (geroutet/gebannt).');
console.log('const ERA_FIRST_EXCLUDE = {');
for (const [nat, list] of Object.entries(out)) {
    console.log(`    ${nat}: new Set(${JSON.stringify(list)}),`);
}
console.log('};');
console.error('\nStatistik: ' + Object.entries(out).map(([n, l]) => `${n}=${l.length}`).join(' '));
