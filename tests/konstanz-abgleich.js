/**
 * konstanz-abgleich.js — KONSTANZ_MODELL A einstellen: Spiel-K = Eingabe-K (23.11.2026)
 *
 * Schaltet KONSTANZ_MODELL.aktiv per SIMCORE_PATCH ein (index.html bleibt aus), setzt je Fahrer die neue Konstanz
 * aus tests/output/konstanz-f1db.json (tools/build-consistency.js) und misst in den simulierten Rennen GENAU wie
 * dort: Einbruch = Zielplatz ≥ SCHWELLE schlechter gegen die Teamkollegen als der Paar-Median der Saison;
 * Unfall-Ausfall × 0,8 (real: Accident ganz, Collision halb); nicht messbare Zielankunft → Feld-Einbruchquote.
 *
 * Ziele (F1DB):
 *   • je Konstanz-Gruppe gemessenes Spiel-K ≈ Eingabe-K
 *   • Quali-Einbruch 14 % · Renn-Einbruch 13 % · Rennen nach Quali-Einbruch 27,5 % · ohne 10,7 % (1980–2025)
 * Danach prüfen: tests/streuung-feld.js (Gruppen ≈ 1,0), tests/vakuum-batch.js (Feldordnung, Dominator).
 *
 * Aufruf: SIMCORE_FROM_INDEX=1 node tests/konstanz-abgleich.js [von=1965] [bis=2015] [Schritt=10] [Läufe=4] [aus]
 *   Parameter per Umgebung: KM="rauschenRennen:6,rauschenQuali:11,schlechterTag:0.7,fahrerUnfall:0.8,qualiKopplung:2.1"
 *   Letztes Argument „aus" = altes Modell mit neuer Konstanz (Vergleich).
 */
'use strict';
const fs = require('fs'), path = require('path');
const [von = '1965', bis = '2015', schritt = '10', laeufe = '4', modus = ''] = process.argv.slice(2);
const KM = Object.fromEntries((process.env.KM || '').split(',').filter(Boolean).map(s => s.split(':')).map(([k, v]) => [k, +v]));
// Seit v0.9.21.44 ist das Modell im Code AN: Standard = Code wie er ist (+ Einstellwerte), „aus“ = altes Modell.
// ⚠ Im Objektliteral gewinnt der HINTERE gleichnamige Schlüssel → Einstellwerte ans Ende, sonst bleiben die Vorgaben
{
    const patches = modus === 'aus'
        ? ['const KONSTANZ_MODELL = { aktiv: true,~>const KONSTANZ_MODELL = { aktiv: false,']
        : Object.keys(KM).length ? ['qualiKopplung: 2.1 };~>qualiKopplung: 2.1' + Object.entries(KM).map(([k, v]) => `, ${k}: ${v}`).join('') + ' };'] : [];
    process.env.SIMCORE_PATCH = [process.env.SIMCORE_PATCH, ...patches].filter(Boolean).join('@@');
}
const { getContext } = require('./sim-core');
const ctx = getContext();
const KON = JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'konstanz-f1db.json'), 'utf8'));
const SCHWELLE = KON.schwelle;
const med = a => { const b = [...a].sort((x, y) => x - y), n = b.length; return n % 2 ? b[n >> 1] : (b[n / 2 - 1] + b[n / 2]) / 2; };
const mw = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
if (modus !== 'aus') {
    const m = ctx.KONSTANZ_MODELL || (() => { try { return ctx.eval?.('KONSTANZ_MODELL'); } catch (e) { return null; } })();
    console.log('KONSTANZ_MODELL:', JSON.stringify(m || '(nicht lesbar, Patch siehe oben)'));
}

// KSKAL=s: wörtliche Konstanz = Drehpunkt + s·(F1DB − Drehpunkt), begrenzt auf KMIN..KMAX (keine Hyper-Konstanz)
const SK = +(process.env.KSKAL || 1), DREH = +(process.env.KDREH || 84), KMIN = +(process.env.KMIN || 30), KMAX = +(process.env.KMAX || 97);
// KSKAL_UNTEN: eigene Steigung unterhalb des Drehpunkts (unbeständige Fahrer werden von der Teamkollegen-Messung stärker gestaucht)
const SKU = +(process.env.KSKAL_UNTEN || SK);
const wahr = k => Math.round(Math.max(KMIN, Math.min(KMAX, DREH + (k < DREH ? SKU : SK) * (k - DREH))));
const gruppen = {};   // Stufe → { ein: [K_ein], aus: Ausreißer, n }
let qN = 0, qE = 0, rN = 0, rE = 0, rNachQ = 0, nQ = 0, rOhneQ = 0, nOhneQ = 0, dnfN = 0, dnfS = 0, unfS = 0;
for (let j = +von; j <= +bis; j += +schritt) {
    for (let l = 0; l < +laeufe; l++) {
        ctx.initFromYear(j);
        const G = ctx.GAME_STATE;
        // KFIX=K: alle gleich · KPAAR=a,b: je Team abwechselnd a und b (Empfindlichkeit eines schlechten Tags)
        const paar = (process.env.KPAAR || '').split(',').map(Number), zaehler = {};
        for (const d of G.drivers) {
            const k = d.histId && KON.fahrer[d.histId]?.[String(j)]?.K;
            if (paar.length === 2) { const i = zaehler[d.team] = (zaehler[d.team] ?? -1) + 1; d.consistency = paar[i % 2]; }
            else d.consistency = process.env.KFIX ? +process.env.KFIX : wahr(k || Math.round(KON.feld));
            d._kF1db = k || Math.round(KON.feld);
        }
        const rennen = [];   // je Rennen: [{id, team, q, pos, dnf, unfall}]
        for (let i = 0; i < G.races.length; i++) {
            const regen = Math.random() < (ctx.SIM_CONFIG?.rainProbability ?? 0.15);
            try {
                ctx.simulateTraining(i);
                const qr = ctx.simulateQualifying(i, regen);
                const res = ctx.simulateRace(i, regen); if (!res) continue;
                ctx.applyRaceResults(res);
                const qPos = {}; (qr?.results || []).forEach((r, idx) => { qPos[r.driver] = r.position || idx + 1; });
                rennen.push(res.results.map(r => {
                    const d = G.drivers.find(x => x.id === r.driver);
                    return { id: r.driver, k: d?.consistency ?? 75, kF: d?._kF1db ?? d?.consistency ?? 75, team: d?.team || r.team, q: qPos[r.driver], pos: r.dnf ? null : r.position,
                        unfall: r.dnf && r.dnfType === 'accident' };
                }));
            } catch (e) { /* wie monte-carlo.js */ }
        }
        // Paar-Mediane (Ziel und Quali) dieser Saison
        const pz = {}, pq = {};
        for (const es of rennen) for (const a of es) for (const b of es) {
            if (a === b || a.team !== b.team) continue;
            if (a.pos != null && b.pos != null) (pz[a.id + '|' + b.id] ??= []).push(a.pos - b.pos);
            if (a.q && b.q) (pq[a.id + '|' + b.id] ??= []).push(a.q - b.q);
        }
        const mz = {}, mq = {};
        for (const k in pz) if (pz[k].length >= 3) mz[k] = med(pz[k]);
        for (const k in pq) if (pq[k].length >= 3) mq[k] = med(pq[k]);
        const stat = {};   // id → { k, n, aus, offen }
        for (const es of rennen) for (const a of es) {
            const kol = es.filter(b => b !== a && b.team === a.team); if (!kol.length) continue;
            const s = stat[a.id] ??= { k: a.kF, n: 0, aus: 0, offen: 0 };
            s.n++; dnfN++;
            if (a.pos == null) { if (a.unfall) { s.aus += 0.8; unfS++; } dnfS++; }
            // Einbrüche Ziel und Quali gegen die Kollegen
            const dz = kol.filter(b => a.pos != null && b.pos != null && mz[a.id + '|' + b.id] != null).map(b => a.pos - b.pos - mz[a.id + '|' + b.id]);
            const dq = kol.filter(b => a.q && b.q && mq[a.id + '|' + b.id] != null).map(b => a.q - b.q - mq[a.id + '|' + b.id]);
            const eQ = dq.length ? mw(dq) >= SCHWELLE : null, eR = dz.length ? mw(dz) >= SCHWELLE : null;
            if (a.pos != null) { if (eR == null) s.offen++; else if (eR) s.aus++; }
            if (eQ != null) { qN++; if (eQ) qE++; }
            if (eR != null) { rN++; if (eR) rE++; if (eQ === true) { nQ++; if (eR) rNachQ++; } else if (eQ === false) { nOhneQ++; if (eR) rOhneQ++; } }
        }
        const feldE = rE / Math.max(1, rN);
        for (const s of Object.values(stat)) {
            if (s.n < 5) continue;
            const kSpiel = 100 * (1 - (s.aus + s.offen * feldE) / s.n);
            const stufe = s.k >= 88 ? 'K ≥ 88' : s.k >= 82 ? 'K 82–87' : s.k >= 76 ? 'K 76–81' : s.k >= 70 ? 'K 70–75' : 'K < 70';
            const g = gruppen[stufe] ??= { ein: [], spiel: [] }; g.ein.push(s.k); g.spiel.push(kSpiel);
        }
    }
    process.stderr.write(j + ' ');
}
console.log(`\nKONSTANZ-ABGLEICH ${von}–${bis} alle ${schritt} J., ${laeufe} Läufe, Modell ${modus === 'aus' ? 'ALT' : 'A'} ${process.env.KM || '(Vorgaben)'} · Umrechnung s ${SK} (unten ${SKU}) um ${DREH}, ${KMIN}–${KMAX}`);
for (const k of ['K < 70', 'K 70–75', 'K 76–81', 'K 82–87', 'K ≥ 88']) {
    const g = gruppen[k]; if (!g) continue;
    console.log(`  ${k.padEnd(8)} n ${String(g.ein.length).padStart(4)} · F1DB Ø ${mw(g.ein).toFixed(1)} · Spiel gemessen Ø ${mw(g.spiel).toFixed(1)} · Differenz ${(mw(g.spiel) - mw(g.ein)).toFixed(1)}`);
}
console.log(`  Quali-Einbruch ${(100 * qE / qN).toFixed(1)} % (real 14) · Renn-Einbruch ${(100 * rE / rN).toFixed(1)} % (13) · nach Quali-Einbruch ${(100 * rNachQ / nQ).toFixed(1)} % (27,5) · ohne ${(100 * rOhneQ / nOhneQ).toFixed(1)} % (10,7)`);
console.log(`  Ausfälle ${(100 * dnfS / dnfN).toFixed(1)} % der Starts, davon Unfall ${(100 * unfS / dnfS).toFixed(1)} %`);
