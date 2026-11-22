/**
 * streuung-feld.js — Streuung des Zielplatzes im GANZEN Feld, Spiel gegen F1DB (22.11.2026)
 *
 * Frage (Nutzer 22.11.2026): Streuen nur bestimmte Fahrer zu wenig (Stewart, Clark, Prost …) oder jeder mit
 * passenden Werten, auch generierte? simulateRace kennt Identität nur über PACE_RATINGS[histId] (Pace des Jahres);
 * Konstanz, Auto, Erfahrung, Startplatz wirken für alle gleich. Dieses Werkzeug misst beides:
 *
 *   1. KLON: ein echter Fahrer einmal normal, einmal „generiert" — histId entfernt, driver.pace = seine
 *      PACE_RATINGS-Pace des Jahres. Gleiche Werte → gleiche Verteilung heißt: es liegt an den Werten.
 *   2. FELD: je Fahrer-Saison (≥ 5 Zielankünfte real UND im Spiel) Zielplatz-SD Spiel vs. real, gruppiert nach
 *      Konstanz und nach realem Ø-Zielplatz (Spitze ≤ 4, Mitte 4–8, hinten > 8).
 *
 * ⚠ Real ist jede Saison EIN Wurf, die SD einer Saison schwankt stark — nur Gruppenmittel vergleichen.
 * ⚠ Ausfälle zählen nicht in die SD (wie tests/fahrer-streuung.js).
 * ⚠ Zielplatz hängt an der Feldgröße: Gruppen nach realem Ø-Platz, nicht nach Pace.
 *
 * Aufruf: SIMCORE_FROM_INDEX=1 node tests/streuung-feld.js [vonJahr=1960] [bisJahr=2010] [Schritt=5] [Läufe=8] [klonId=jackie-stewart] [klonJahr=1969]
 */
'use strict';
const { getContext } = require('./sim-core');
const [von = '1960', bis = '2010', schritt = '5', laeufe = '8', klonId = 'jackie-stewart', klonJahr = '1969'] = process.argv.slice(2);
const ctx = getContext();
const F1DB = require('vm').runInNewContext(require('fs').readFileSync(require('path').join(__dirname, '..', 'data', 'f1db.js'), 'utf8')
    + ';({ F1DB_RESULTS, PACE_RATINGS: typeof PACE_RATINGS !== "undefined" ? PACE_RATINGS : null })', { window: {} });
const sd = a => { if (a.length < 2) return NaN; const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
const mw = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;

function realZiele(jahr) {   // slug → [Zielplätze]
    const z = {};
    for (const [, , e] of (F1DB.F1DB_RESULTS[String(jahr)] || []))
        for (const x of e) if (x[1] != null && x[3]) (z[x[3]] ??= []).push(x[1]);
    return z;
}
function saison(jahr, vorRennen) {   // ein Spiel-Lauf → Map driverId → {d, ziele, starts, siege}
    ctx.initFromYear(jahr);
    const G = ctx.GAME_STATE;
    if (vorRennen) vorRennen(G);
    const out = new Map();
    for (let i = 0; i < G.races.length; i++) {
        const regen = Math.random() < (ctx.SIM_CONFIG?.rainProbability ?? 0.15);
        try {
            ctx.simulateTraining(i); ctx.simulateQualifying(i, regen);
            const res = ctx.simulateRace(i, regen); if (!res) continue;
            ctx.applyRaceResults(res);
            for (const r of res.results) {
                const d = G.drivers.find(x => x.id === r.driver); if (!d) continue;
                const o = out.get(d.id) || { d, ziele: [], starts: 0, siege: 0, podien: 0 }; out.set(d.id, o);
                o.starts++; if (r.dnf || r.fatal) continue;
                o.ziele.push(r.position); if (r.position === 1) o.siege++; if (r.position <= 3) o.podien++;
            }
        } catch (e) { /* wie monte-carlo.js */ }
    }
    return out;
}

// ── 1. Klon-Test ──────────────────────────────────────────────────────────
{
    const J = +klonJahr, N = +laeufe * 3;
    // ⚠ Echte Fahrer haben ZWEI Paces: Quali/Training nehmen driver.pace (Vorlage), simulateRace nimmt
    //   PACE_RATINGS[histId][Jahr]. Ein Klon hat nur eine → zwei Klone: Vorlage-Pace und Renn-Pace.
    const lauf = klon => {
        const z = [], s = { st: 0, sg: 0, pd: 0 };
        for (let l = 0; l < N; l++) {
            let id = null;
            const r = saison(J, G => {
                const d = G.drivers.find(x => x.histId === klonId); if (!d) return; id = d.id;
                if (klon) {
                    const pr = F1DB.PACE_RATINGS?.[klonId]?.[String(J)];
                    if (klon === 'renn' && pr && pr[0] > 0) d.pace = pr[0];
                    d.histId = null; d.name = 'Klon ' + d.name;
                }
            });
            const o = id && r.get(id); if (!o) continue;
            z.push(...o.ziele); s.st += o.starts; s.sg += o.siege; s.pd += o.podien;
        }
        return `Ziel Ø ${mw(z).toFixed(2)} SD ${sd(z).toFixed(2)} · Sieg ${(100 * s.sg / s.st).toFixed(0)} % · Podium ${(100 * s.pd / s.st).toFixed(0)} % (${s.st} Starts)`;
    };

    const pr = F1DB.PACE_RATINGS?.[klonId]?.[String(J)] || [];
    console.log(`KLON-TEST ${klonId} ${J}, ${N} Läufe je Variante (Renn-Pace PACE_RATINGS ${pr[0]})`);
    console.log('  echt                    ' + lauf(false));
    console.log('  Klon mit Vorlage-Pace   ' + lauf('vorlage'));
    console.log('  Klon mit Renn-Pace      ' + lauf('renn'));
}

// ── 2. Feldvergleich ──────────────────────────────────────────────────────
const gruppen = {};
const buche = (k, s, r) => { const g = gruppen[k] ??= { s: [], r: [], n: 0 }; g.s.push(s); g.r.push(r); g.n++; };
for (let j = +von; j <= +bis; j += +schritt) {
    const real = realZiele(j);
    const spiel = {};   // histId → {ziele, kon}
    for (let l = 0; l < +laeufe; l++)
        for (const o of saison(j).values()) {
            if (!o.d.histId) continue;
            const e = spiel[o.d.histId] ??= { ziele: [], kon: o.d.consistency ?? 75 };
            e.ziele.push(...o.ziele);
        }
    for (const [h, e] of Object.entries(spiel)) {
        const r = real[h]; if (!r || r.length < 5 || e.ziele.length < 5 * +laeufe) continue;
        const sS = sd(e.ziele), sR = sd(r), m = mw(r);
        const stufe = m <= 4 ? 'Spitze (real Ø ≤ 4)' : m <= 8 ? 'Mitte (real Ø 4–8)' : 'hinten (real Ø > 8)';
        const kon = e.kon >= 90 ? 'Konstanz ≥ 90' : e.kon >= 80 ? 'Konstanz 80–89' : 'Konstanz < 80';
        buche(stufe, sS, sR); buche(kon, sS, sR); buche(stufe + ' · ' + kon, sS, sR);
    }
    process.stderr.write(j + ' ');
}
console.log(`\nFELD ${von}–${bis} alle ${schritt} Jahre, ${laeufe} Läufe: Zielplatz-SD je Fahrer-Saison, Gruppenmittel`);
for (const k of Object.keys(gruppen).sort()) {
    const g = gruppen[k];
    console.log(`  ${k.padEnd(42)} n ${String(g.n).padStart(3)} · Spiel ${mw(g.s).toFixed(2)} · real ${mw(g.r).toFixed(2)} · Verhältnis ${(mw(g.s) / mw(g.r)).toFixed(2)}`);
}
