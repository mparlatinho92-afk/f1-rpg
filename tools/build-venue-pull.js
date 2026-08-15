// build-venue-pull.js — erzeugt data/venue-pull.js
//
// PROBLEM: Das Spiel trifft die Melderzahl je SAISON, aber nicht ihre Verteilung ueber
// die STRECKEN. Gemessen 1955 (tests/mc-entries-dnq.js --strecken):
//   Monaco 20,0 gegen real 24 · Spa 18,6 gegen 16 · Zandvoort 17,6 gegen 16
// Streuung ueber die Strecken 2,4 gegen real 3,8 — das Feld ist zu gleichfoermig, und
// weil DNQ nur dort entsteht, wo besonders viele melden, fehlen damit auch die DNQ
// (1955er Start: 0,2-0,7 je Rennen gegen real 1,1-2,1).
//
// ZWEI EFFEKTE, DIE MAN TRENNEN MUSS. Der erste Anlauf hat sie vermischt und lieferte
// fuer Aintree 1,28 und Silverstone 1,22 — beide sehen wie Magneten aus, sind aber
// nur HEIMRENNEN: 8,8 bzw. 8,3 Landsleute je Rennen. Diesen Sog hat das Spiel laengst
// (`_homePullWeight`, Faktor 4 vor 1970); ihn hier nochmal einzubauen haette britische
// Rennen doppelt aufgeblasen. Rechnet man die Landsleute heraus, fallen die beiden auf
// 0,71 und 0,70 — und uebrig bleibt der ECHTE Streckensog:
//   nurburgring 1,44 · monza 1,27 · monaco 1,25   gegen   rouen 0,59 · spa 0,80
//
// GEMESSEN WIRD deshalb nur, was das Spiel noch nicht kennt: auswaertige Teilzeit-
// Melder je Strecke, ins Verhaeltnis zum Saisonmittel gesetzt. Vollsaison-Fahrer sind
// draussen (die melden ohnehin ueberall) und Landsleute auch.
//
// Aufruf:  node tools/build-venue-pull.js          (Trockenlauf)
//          node tools/build-venue-pull.js --write  (schreibt data/venue-pull.js)
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'f1db-json-splitted');
const OUT = path.join(ROOT, 'data', 'venue-pull.js');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
const WRITE = process.argv.includes('--write');

const MIN_JAHRE = 4;        // darunter ist der Faktor Rauschen -> 1.0 (kein Eintrag)
// Saisons, in denen Teilzeit-Melder kaum vorkommen, taugen nicht als Messgrundlage:
// ab den 1980ern stellen sie nur noch 3-13 % der Meldungen, ein einzelner Gaststarter
// verschiebt das Verhaeltnis dann um Faktor 2. Der erste Lauf ueber ALLE Jahre lieferte
// dadurch Bahrain 1,21 und Adelaide 1,27 (Streuung 0,43) — reines Rauschen, das den
// echten Nuerburgring-Sog von 1,44 auf 1,22 verwaessert hat.
const MIN_TEILZEIT_ANTEIL = 0.15;
const UNTEN = 0.55, OBEN = 1.5;
// AUSNAHMSLOS jedes Rennen — dieselbe Schwelle wie build-driver-starts.js. Sie muss
// dort und hier identisch sein: der Faktor wird auf genau die Fahrer angewandt, an
// denen er gemessen wurde. Mit 0,8 hier und 1 dort haette er die Fast-Stammfahrer
// (80-99 % der Saison) beschrieben, ohne sie je gesehen zu haben.
const VOLLSAISON = 1;

const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) ** 2))); };

// ── Kalender + Streckenland, Indy raus (gleiche Filterregel wie ueberall) ────
const land = {};
for (const c of J('f1db-circuits.json')) land[String(c.id).toLowerCase()] = c.countryId;
const rc = {};
for (const r of J('f1db-races.json')) {
    rc[`${r.year}_${r.round}`] =
        r.grandPrixId === 'indianapolis' ? null : String(r.circuitId || '').toLowerCase();
}
const nat = {};
for (const d of J('f1db-drivers.json')) nat[d.id] = d.nationalityCountryId || d.countryOfBirthCountryId;

// Jahr -> Fahrer -> Set(Strecke)
const T = {};
for (const e of J('f1db-seasons-entrants-drivers.json')) {
    if (e.testDriver) continue;
    for (const rd of (e.rounds || [])) {
        const c = rc[`${e.year}_${rd}`]; if (!c) continue;
        ((T[e.year] = T[e.year] || {})[e.driverId] = T[e.year][e.driverId] || new Set()).add(c);
    }
}

// NACH DEKADEN GESTAFFELT. Ein einziger Faktor je Strecke war messbar zu grob:
// Watkins Glen zog in den 1960ern 0,64 (Ueberseereise, die europaeischen Privatiers
// blieben weg) und in den 1970ern 1,29; der Nuerburgring 1,79 gegen 0,99; Monaco 1,66
// gegen 0,99. Der Mittelwert loescht genau die Streuung aus, die hier gesucht wird —
// gemessen blieb 1961 damit bei SD 2,3 gegen real 5,4 stehen (Zandvoort +5,5,
// Watkins Glen +7,3 Melder).
const MIN_JE_DEKADE = 3;
const R = {}, heim = {}, D = {};
for (const y of Object.keys(T).map(Number).sort((a, b) => a - b)) {
    const cal = new Set();
    for (const d in T[y]) for (const c of T[y][d]) cal.add(c);
    if (cal.size < 4) continue;

    let teil = 0, ges = 0;
    for (const d in T[y]) { ges += T[y][d].size; if (T[y][d].size / cal.size < VOLLSAISON) teil += T[y][d].size; }
    if (!ges || teil / ges < MIN_TEILZEIT_ANTEIL) continue;

    const P = {}, H = {};
    for (const c of cal) { P[c] = 0; H[c] = 0; }
    for (const d in T[y]) {
        if (T[y][d].size / cal.size >= VOLLSAISON) continue;      // Stammfahrer raus
        for (const c of T[y][d]) {
            if (nat[d] && land[c] && nat[d] === land[c]) { H[c]++; continue; }   // Heimrennen-Sog: schon im Spiel
            P[c]++;
        }
    }
    const m = mean(Object.values(P));
    if (m < 1) continue;      // Saison ohne nennenswerte Teilzeit-Melder sagt nichts
    const dek = Math.floor(y / 10) * 10;
    for (const c in P) {
        (R[c] = R[c] || []).push(P[c] / m);
        (heim[c] = heim[c] || []).push(H[c]);
        ((D[c] = D[c] || {})[dek] = D[c][dek] || []).push(P[c] / m);
    }
}

const kappe = v => Number(Math.max(UNTEN, Math.min(OBEN, v)).toFixed(2));
const out = {};
const zeilen = [];
for (const c of Object.keys(R)) {
    if (R[c].length < MIN_JAHRE) continue;
    const eintrag = { '*': kappe(mean(R[c])) };     // "*" = Rueckfall ohne eigene Dekade
    for (const dek of Object.keys(D[c])) {
        if (D[c][dek].length < MIN_JE_DEKADE) continue;
        eintrag[dek] = kappe(mean(D[c][dek]));
    }
    out[c] = eintrag;
    zeilen.push({ c, n: R[c].length, f: eintrag['*'], h: mean(heim[c]),
        dek: Object.keys(eintrag).filter(k => k !== '*').sort()
            .map(k => `${k.slice(2)}er ${eintrag[k].toFixed(2)}`).join('  ') });
}
zeilen.sort((a, b) => b.f - a.f);

console.log(`Strecken mit Faktor: ${zeilen.length} (mind. ${MIN_JAHRE} auswertbare Saisons)`);
console.log('\nStrecke                Saisons  Mittel  Ø Landsleute  je Dekade');
console.log('─'.repeat(84));
for (const z of zeilen) {
    console.log(`${z.c.padEnd(22)} ${String(z.n).padStart(6)}  ${z.f.toFixed(2).padStart(6)}  ${z.h.toFixed(1).padStart(11)}  ${z.dek}`);
}

const body = Object.keys(out).sort().map(c => {
    const e = out[c];
    const inner = Object.keys(e).sort().map(k => JSON.stringify(k) + ':' + e[k]).join(',');
    return JSON.stringify(c) + ':{' + inner + '}';
}).join(',\n            ');
const block = `        // VENUE_PULL — wie stark eine Strecke AUSWAERTIGE Teilzeit-Melder anzieht.
        // GENERIERT von tools/build-venue-pull.js — NICHT von Hand editieren.
        //
        // 1.0 = Saisondurchschnitt. Der Nuerburgring zog 1,4-mal so viele Gastmelder wie
        // ein Durchschnittsrennen, Rouen nur 0,6-mal. Damit entsteht die Streuung der
        // Meldelisten ueber die Strecken — und mit ihr die DNQ, die nur dort auftreten,
        // wo besonders viele melden.
        //
        // ⚠ Der HEIMRENNEN-Sog steckt NICHT drin (Landsleute sind herausgerechnet). Den
        //   hat das Spiel schon in _homePullWeight; beides zusammen zu messen haette die
        //   britischen Rennen doppelt gewichtet (Aintree schien 1,28 statt echter 0,71).
        // Aufbau: circuitId -> { "1950": Faktor, "1960": ..., "*": Mittel als Rueckfall }.
        // Nach DEKADEN gestaffelt, weil sich der Sog stark verschob: Watkins Glen 0,64
        // in den 1960ern (Ueberseereise) gegen 1,29 in den 1970ern.
        // Ab 1980 gilt ueberall 1.0 — dort sind Teilzeit-Melder so selten (3-13 % der
        // Meldungen), dass jeder Faktor Rauschen waere; die Streuung stimmt dort schon.
        // ${zeilen.length} Strecken, Faktoren gekappt auf ${UNTEN}-${OBEN}.
        const VENUE_PULL = {
            ${body}
        };
`;
console.log(`\nDateigroesse: ${(block.length / 1024).toFixed(1)} KB`);

if (!WRITE) { console.log('\nTrockenlauf — nichts geschrieben. Mit --write erzeugen.'); process.exit(0); }
fs.writeFileSync(OUT, block, 'utf8');
console.log(`\n${OUT} geschrieben.`);
