// Monte Carlo für den Fahrermarkt — misst, was die Landsmann-Multiplikatoren
// in processTeamChanges TATSÄCHLICH an Landsmann-Anteil produzieren.
//
// WARUM DIESER TEST EXISTIERT (2026-07-19):
// Die Multiplikatoren in processTeamChanges sind SCORE-Gewichte in einer
// gewichteten Zufallsauswahl, KEINE Ergebnis-Faktoren. Sie wurden aus den
// F1DB-Zielfaktoren zurückgerechnet (Faktor = m/(m·p + 1 − p)), aber nie
// gegengemessen — p, der Landsmann-Anteil unter den Kandidaten, ist im echten
// Spiel weder konstant noch bekannt. Dieser Test schließt die Lücke.
//
// Er repliziert NICHT den ganzen Transfermarkt (der braucht GAME_STATE im
// Browser), sondern isoliert genau den Schritt, der den Effekt erzeugt:
// Kandidatenliste -> Score -> gewichtete Ziehung.
//
//   node tests/transfer-mc.js
'use strict';
const fs = require('fs');
const path = require('path');

// ── Zielwerte aus F1DB (3.562 Fahrer-Konstrukteur-Paare, gegen die
//    Zufallserwartung aus den Randverteilungen gerechnet) ────────────────────
const ZIEL = {
    top:        1.44,
    mittelfeld: 1.66,
    backmarker: 2.24,
    kleinstCtr: 3.30   // "ohne Konstrukteurswertung", n=1298
};

// ── Multiplikatoren aus index.html ziehen (kein Copy-Paste-Drift) ───────────
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function mult(label, re) {
    const m = html.match(re);
    if (!m) throw new Error('Multiplikator nicht gefunden: ' + label);
    return parseFloat(m[1]);
}
const M = {
    kleinstCtr: mult('smallCtor',  /team\._smallCtor \? ([\d.]+)/),
    top:        mult('isTopTeam',  /isTopTeam\s*\?\s*([\d.]+)\s*\/\/ Ziel/),
    mittelfeld: mult('isMidTeam',  /isMidTeam\s*\?\s*([\d.]+)\s*\/\/ Ziel/),
    // praezise fassen: ein loses /: 0; \/\/ Backmarker/ trifft eine fruehere
    // Stelle im File und liefert stillschweigend 0
    backmarker: mult('backmarker', /:\s+([\d.]+);\s+\/\/ Backmarker, Ziel/)
};

// ── Nationen-Verteilung der Kandidaten ─────────────────────────────────────
// Aus DECADE_NATION_POOLS von index.html, damit der Landsmann-Anteil p unter
// den Kandidaten realistisch ist und nicht geraten. p ist die Stellschraube,
// an der die Umrechnung Multiplikator->Faktor hängt.
function nationPool(decade) {
    const i = html.indexOf('const DECADE_NATION_POOLS = {');
    const seg = html.slice(i, html.indexOf('};', i));
    const line = seg.split('\n').find(l => l.trim().startsWith(decade + ':'));
    if (!line) throw new Error('Dekade nicht gefunden: ' + decade);
    const out = [];
    line.replace(/'([A-Z]{3})':([\d.]+)/g, (_, nat, w) => { out.push([nat, +w]); });
    if (!out.length) throw new Error('Keine Gewichte in Dekade ' + decade);
    return out;
}
function pick(pool) {
    const tot = pool.reduce((s, x) => s + x[1], 0);
    let r = Math.random() * tot;
    for (const [n, w] of pool) { r -= w; if (r <= 0) return n; }
    return pool[pool.length - 1][0];
}

// ── Der eigentliche Auswahlschritt, wie in processTeamChanges ──────────────
// Kandidaten bekommen einen Basis-Score aus dem Pace-Fit (dort 5..~100);
// Landsleute werden mit m multipliziert; dann gewichtete Ziehung.
function drawOnce(pool, homeNation, m, nCands) {
    const cands = [];
    for (let i = 0; i < nCands; i++) {
        const nat = pick(pool);
        // Basis-Score wie im Spiel: Pace-Fit um einen Tier-Zielwert herum.
        // Streuung 5..100 nachgebildet; die genaue Form ist unkritisch, weil
        // der Landsmann-Bonus multiplikativ auf denselben Score wirkt.
        const base = Math.max(5, 100 - Math.abs((Math.random() - 0.5) * 40) * 3);
        cands.push({ nat, score: base * (nat === homeNation ? m : 1) });
    }
    const tot = cands.reduce((s, c) => s + c.score, 0);
    let r = Math.random() * tot;
    for (const c of cands) { r -= c.score; if (r <= 0) return c.nat === homeNation; }
    return cands[cands.length - 1].nat === homeNation;
}

// Basisrate: wie oft würde ein Landsmann OHNE Bonus gezogen? (= Zufallserwartung)
function baseline(pool, homeNation, nCands, N) {
    let hit = 0;
    for (let k = 0; k < N; k++) if (drawOnce(pool, homeNation, 1.0, nCands)) hit++;
    return hit / N;
}

const N = 40000;
const DEKADEN = [1950, 1960, 1970, 1980, 1990, 2010];
// Heimatnationen der Konstrukteure — nach realer F1-Verteilung gewichtet
const HOME = ['GBR', 'ITA', 'FRA', 'GER', 'USA'];
const CANDS = 12;   // typische Kandidatenzahl pro freiem Cockpit

let fail = 0;
console.log('Landsmann-Faktor: Multiplikator -> tatsaechlicher Faktor');
console.log('(N=' + N + ' Ziehungen je Zelle, ' + CANDS + ' Kandidaten pro Cockpit)');
console.log('');
console.log('Klasse       | Mult | Faktor gemessen (je Dekade)                  | Ziel | Ø     | Status');

for (const klasse of ['top', 'mittelfeld', 'backmarker', 'kleinstCtr']) {
    const m = M[klasse];
    const facs = [];
    for (const dec of DEKADEN) {
        const pool = nationPool(dec);
        // über die Konstrukteurs-Heimatnationen mitteln
        let f = 0;
        for (const home of HOME) {
            const b = baseline(pool, home, CANDS, N / 4);
            let hit = 0;
            for (let k = 0; k < N / 4; k++) if (drawOnce(pool, home, m, CANDS)) hit++;
            f += (hit / (N / 4)) / (b || 1e-9);
        }
        facs.push(f / HOME.length);
    }
    const avg = facs.reduce((a, b) => a + b, 0) / facs.length;
    const ziel = ZIEL[klasse];
    const ok = Math.abs(avg - ziel) <= 0.35;      // Toleranz: 0,35 Faktorpunkte
    if (!ok) fail++;
    console.log(
        klasse.padEnd(12) + ' | ' + String(m).padStart(4) + ' | ' +
        facs.map(x => x.toFixed(2) + 'x').join(' ') + ' | ' +
        ziel.toFixed(2) + ' | ' + avg.toFixed(2) + 'x | ' + (ok ? 'OK' : 'ABWEICHUNG')
    );
}

console.log('');
console.log('Gemessen wird der AUSWAHLSCHRITT isoliert — genau das, was die Multiplikatoren');
console.log('steuern. Retention, Vertraege und Abwerbung kommen nicht vor.');
console.log('');
console.log('WICHTIG (Vollmarkt-Messung 2026-07-19, 100 Saisons / 2.297 Fahrer-Team-Paare');
console.log('via initFromYear + runSeasonHeadless im Browser): der BESTANDS-Faktor im');
console.log('laufenden Spiel liegt bei nur 1,15-1,31x statt der F1DB-Zielwerte 1,44-3,30x,');
console.log('und die Tier-Differenzierung verschwindet fast. Gegenprobe: Multiplikatoren');
console.log('auf 3,0/5,0/9,0/20,0 verdrei- bis versechsfacht -> Bestand nur 1,33/1,35/');
console.log('1,66/1,35. Der Hiring-Bonus kann den Bestand also NICHT erreichen, weil der');
console.log('Bestand von RETENTION dominiert wird, nicht von Neuverpflichtungen.');
console.log('Deshalb bleiben die Werte auf den Auswahlschritt kalibriert (dieser Test);');
console.log('die Bestandsluecke ist ein eigenes Thema (Grundungs-Ara der Teams).');
console.log('');
console.log(fail ? `FEHLER: ${fail} Abweichung(en)` : 'ALLE CHECKS GRÜN');
process.exit(fail ? 1 : 0);
