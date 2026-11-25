/**
 * konstanz-dauerlauf.js — Konstanz im Feld über eine Saisonkette, vor allem nach dem Datenende (25.11.2026)
 *
 * Saisonwechsel wie im Spiel (Rennen, processSeasonEndEvents + startNewSeason). Ohne Rennen kein Debüt → jeder
 * generierte Fahrer bliebe Karrierejahr 1.
 * Je Saison: Median der Konstanz aller Fahrer mit Cockpit, getrennt real / generiert, und nach Karrierejahr
 * (getCareerYears + 1). Prüft die Erfahrungskurve (konstanzReife): Neulinge unten, Routiniers oben, kein Abbau,
 * Feld-Median stabil (Dauerlauf-Falle 23.11.2026: Feld 81 → 68 nach dem Datenende).
 *
 * Aufruf: SIMCORE_FROM_INDEX=1 node tests/konstanz-dauerlauf.js [Startjahr=2024] [Saisons=12] [Sims=3]
 */
'use strict';
const { getContext } = require('./sim-core');
const [JAHR = 2024, SAISONS = 12, SIMS = 3] = process.argv.slice(2).map(Number);
const ctx = getContext();
const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
const acc = [];
const verfolgt = {};   // histId → [K je Saison], reale Fahrer des Startfelds
for (let s = 0; s < SIMS; s++) {
    try {
        ctx.initFromYear(JAHR);
        for (let k = 0; k < SAISONS; k++) {
            const gs = ctx.GAME_STATE, y = gs.currentYear;
            const feld = (gs.drivers || []).filter(d => d.team && (!d.status || d.status === 'active') && d.consistency > 0);
            const a = acc[k] ??= { jahr: y, alle: [], real: [], gen: [], kj: {} };
            for (const d of feld) {
                a.alle.push(d.consistency);
                (ctx.konstanzFuer(d.histId, 2026, null) != null ? a.real : a.gen).push(d.consistency);
                const kj = ctx.getCareerYears(d, y) + 1, st = kj <= 1 ? '1' : kj <= 3 ? '2–3' : kj <= 5 ? '4–5' : '6+';
                (a.kj[st] ??= []).push(d.consistency);
                if (s === 0 && d.histId && (k === 0 || verfolgt[d.histId])) (verfolgt[d.histId] ??= [])[k] = d.consistency;
            }
            if (k === SAISONS - 1) break;
            // Rennen fahren: das Debüt (getF1DebutYear) entsteht erst durch Starts — ohne Rennen bliebe jeder Neuling Jahr 1
            for (let i = 0; i < gs.races.length; i++) {
                try { ctx.simulateTraining(i); ctx.simulateQualifying(i, false); const res = ctx.simulateRace(i, false); if (res) ctx.applyRaceResults(res); } catch (e) { /* wie konstanz-abgleich.js */ }
            }
            ctx.processSeasonEndEvents();
            ctx.startNewSeason();
        }
    } catch (e) { console.log('  (Sim verworfen: ' + e.message.slice(0, 100) + ')'); }
}
console.log(`KONSTANZ-DAUERLAUF ab ${JAHR}, ${SAISONS} Saisons, ${SIMS} Sims — Median (n)`);
console.log('  Jahr  Feld        real        generiert   | Karrierejahr 1 · 2–3 · 4–5 · 6+');
for (const a of acc) {
    const f = x => `${String(med(x)).padStart(3)} (${String(x.length).padStart(3)})`;
    console.log(`  ${a.jahr}  ${f(a.alle)}   ${f(a.real)}   ${f(a.gen)}   | ${['1', '2–3', '4–5', '6+'].map(s => a.kj[s] ? med(a.kj[s]) + '/' + a.kj[s].length : '–').join(' · ')}`);
}
const lang = Object.entries(verfolgt).filter(([, v]) => v.filter(x => x != null).length >= Math.min(8, SAISONS)).slice(0, 8);
console.log('\n  Verlauf realer Fahrer (Sim 1): ' + (lang.length ? '' : '—'));
for (const [h, v] of lang) console.log(`    ${h.padEnd(22)} ${v.map(x => x == null ? ' –' : String(x).padStart(3)).join('')}`);
