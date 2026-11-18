/**
 * fahrer-streuung.js — Streuung EINES Fahrers: Spiel gegen reale Saisons (18.11.2026)
 *
 * Anlass: Nutzer-Fund „Jackie Stewart zu konstant" (FIXES_OFFEN.md, Fahrer-Stats).
 * Je Jahr wird die echte Saison N-mal frisch simuliert (initFromYear, Training → Quali → Rennen,
 * wie monte-carlo.js) und die Rennergebnisse des Fahrers mit F1DB verglichen.
 *
 * Kennzahlen je Start: Sieg, Podium, Ausfall; unter den Zielankünften Mittel und Streuung (SD)
 * des Zielplatzes; dazu WM-Platz (Spiel: Mittel und Spanne über die Läufe).
 * ⚠ Real ist jede Saison EIN Wurf — vergleichbar sind die Summen über alle Jahre, nicht Einzeljahre.
 * ⚠ Ausfälle zählen nicht in die Platz-SD. Wer mehr ausfällt, streut also im Ergebnis mehr, als die SD zeigt.
 *
 * Aufruf: node tests/fahrer-streuung.js <histId> <vonJahr> <bisJahr> [Läufe=20]
 *         SIMCORE_FROM_INDEX=1 node tests/fahrer-streuung.js jackie-stewart 1965 1973 20
 */
'use strict';
const { getContext } = require('./sim-core');

const [histId = 'jackie-stewart', von = '1965', bis = '1973', laeufe = '20'] = process.argv.slice(2);
const VON = +von, BIS = +bis, N = +laeufe;

const ctx = getContext();
// F1DB-Konstanten sind im Sim-Kontext nicht erreichbar (const im Skript) → direkt aus data/f1db.js
const F1DB = require('vm').runInNewContext(require('fs').readFileSync(require('path').join(__dirname, '..', 'data', 'f1db.js'), 'utf8')
    + ';({ F1DB_RESULTS, F1DB_STANDINGS })', { window: {} });
const sd = a => { if (a.length < 2) return 0; const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
const mw = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const neu = () => ({ starts: 0, siege: 0, podium: 0, dnf: 0, plaetze: [] });
const buche = (z, pos, dnf) => { z.starts++; if (dnf) { z.dnf++; return; } z.plaetze.push(pos); if (pos === 1) z.siege++; if (pos <= 3) z.podium++; };

// ── Real aus F1DB ──────────────────────────────────────────────────────────
function real(jahr) {
    const z = neu();
    for (const [, , eintraege] of (F1DB.F1DB_RESULTS[String(jahr)] || [])) {
        for (const e of eintraege) {
            if (e[3] !== histId) continue;
            const txt = e[2];
            if (['DNQ', 'DNPQ', 'DNS', 'DNP', 'EX'].includes(txt)) continue;   // kein Start
            buche(z, e[1], e[1] == null);
        }
    }
    return z;
}
const wmReal = jahr => {
    const s = F1DB.F1DB_STANDINGS[String(jahr)];
    if (!s) return null;
    const liste = Array.isArray(s) ? s : Object.values(s);
    const t = liste.find(x => Array.isArray(x) && x[0] === histId);
    return t ? t[1] : null;
};

// ── Spiel ─────────────────────────────────────────────────────────────────
function spiel(jahr) {
    const z = neu(), wm = [];
    for (let l = 0; l < N; l++) {
        ctx.initFromYear(jahr);
        const G = ctx.GAME_STATE;
        const fahrer = d => d && (d.histId === histId);
        const races = G.races;
        for (let i = 0; i < races.length; i++) {
            const regen = Math.random() < (ctx.SIM_CONFIG?.rainProbability ?? 0.15);
            try {
                ctx.simulateTraining(i);
                ctx.simulateQualifying(i, regen);
                const res = ctx.simulateRace(i, regen);
                if (!res) continue;
                ctx.applyRaceResults(res);
                const r = res.results.find(x => fahrer(G.drivers.find(d => d.id === x.driver)));
                if (r) buche(z, r.position, !!(r.dnf || r.fatal));
            } catch (e) { /* Rennen überspringen wie monte-carlo.js */ }
        }
        const id = (G.drivers.find(fahrer) || {}).id;
        const tab = Object.entries(G.driverStandings || {}).sort((a, b) => (b[1].points || 0) - (a[1].points || 0));
        const p = tab.findIndex(([k]) => k === id);
        if (p >= 0) wm.push(p + 1);
    }
    return { z, wm };
}

const zeile = (z, faktor = 1) => {
    const s = z.starts || 1;
    return `${String(Math.round(z.starts / faktor)).padStart(3)} St · Sieg ${(100 * z.siege / s).toFixed(0).padStart(3)} % · Podium ${(100 * z.podium / s).toFixed(0).padStart(3)} % · DNF ${(100 * z.dnf / s).toFixed(0).padStart(3)} % · Ziel Ø ${mw(z.plaetze).toFixed(1).padStart(4)} SD ${sd(z.plaetze).toFixed(1).padStart(4)}`;
};

console.log(`FAHRER-STREUUNG ${histId} ${VON}–${BIS}, ${N} Läufe je Jahr`);
const sumR = neu(), sumS = neu(), wmAlleS = [], wmAlleR = [];
for (let j = VON; j <= BIS; j++) {
    const r = real(j), { z: s, wm } = spiel(j);
    if (!r.starts && !s.starts) continue;
    for (const k of ['starts', 'siege', 'podium', 'dnf']) { sumR[k] += r[k]; sumS[k] += s[k]; }
    sumR.plaetze.push(...r.plaetze); sumS.plaetze.push(...s.plaetze);
    const wr = wmReal(j); if (wr) wmAlleR.push(wr); wmAlleS.push(...wm);
    console.log(`${j}  real  ${zeile(r)}  WM ${wr ?? '?'}`);
    console.log(`      spiel ${zeile(s, N)}  WM Ø ${mw(wm).toFixed(1)} (${Math.min(...wm)}–${Math.max(...wm)})`);
}
console.log('──');
console.log(`Summe real  ${zeile(sumR)}  WM Ø ${mw(wmAlleR).toFixed(1)}`);
console.log(`Summe spiel ${zeile(sumS, N)}  WM Ø ${mw(wmAlleS).toFixed(1)}, Titel ${(100 * wmAlleS.filter(x => x === 1).length / (wmAlleS.length || 1)).toFixed(0)} % der Saisons`);
