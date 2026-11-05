// gast-haengt.js — Bleibt ein Gastspiel über das Saisonende hängen? Entlässt das Gastteam
// einen Fahrer, der ihm gar nicht gehört?
//
// ANLASS (Spielstand 1980–88, 05.11.2026): Piquet war im letzten Rennen 1981 Gast bei Ligier
// (DNS), `applyGuestMoves` holt Gäste erst beim NÄCHSTEN Rennen zurück — nach dem Finale gibt
// es keins. Er ging als Ligier-Fahrer in den Transfermarkt und fuhr 1982 dort, ohne Chronik-
// Eintrag; die Karriere-Historie zeigte 1981 „Brabham / Ligier". Connolly (Stamm ATS) wurde
// als Gast von Lotus mitten in der Saison entlassen.
//
// MASSZAHLEN je Saison
//   haengt   = Fahrer mit `_guestFrom` aus DIESEM Jahr nach dem letzten Rennen (vor dem Saisonwechsel)
//   still    = davon nach processSeasonEndEvents noch beim Gastteam, ohne Saisonende-Transfer (der Fehler)
//   gastRaus = Entlassungen mitten in der Saison, deren Opfer gerade Gast war
//
// AUFRUF   SIMCORE_FROM_INDEX=1 node tests/gast-haengt.js 1980 6 --saisons=4
'use strict';
const argv = process.argv.slice(2);
const num = argv.filter(a => /^\d+$/.test(a)).map(Number);
const opt = k => { const a = argv.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : null; };
const YEAR = num[0] || 1980, SIMS = num[1] || 6, SEASONS = Number(opt('saisons') || 4);

const { getContext } = require('./sim-core');
const ctx = getContext();
const G = () => ctx.GAME_STATE;
let saisons = 0, haengt = 0, still = 0, gastRaus = 0, gastSumme = 0;
const beispiele = [];

for (let s = 0; s < SIMS; s++) {
    try {
        ctx.initFromYear(YEAR);
        for (let k = 0; k < SEASONS; k++) {
            const y = G().currentYear, races = G().races || [];
            const gesehen = new Set();
            for (let i = 0; i < races.length; i++) {
                try {
                    ctx.applyGuestMoves(i);
                    const gaeste = new Set((G().drivers || []).filter(d => d._guestFrom && d._guestYear === y).map(d => d.id));
                    gaeste.forEach(id => gesehen.add(id));
                    ctx.simulateTraining(i);
                    const rain = Math.random() < 0.15;
                    ctx.simulateQualifying(i, rain);
                    const r = ctx.simulateRace(i, rain);
                    if (!r) continue;
                    const vorher = (G().seasonRetirements || []).length;
                    ctx.applyRaceResults(r);
                    for (const e of (G().seasonRetirements || []).slice(vorher))
                        if (e.type === 'dismissed' && e.midSeason && gaeste.has(e.driver)) {
                            gastRaus++;
                            if (beispiele.length < 8) beispiele.push(`${y} R${i + 1} entlassen als Gast: ${e.name} (${e.fromTeam})`);
                        }
                } catch (e) { if (!globalThis._f) { globalThis._f = 1; console.log("Rennfehler:", e.stack.split(/\n/).slice(0,3).join(" | ")); } }
            }
            gastSumme += gesehen.size;
            const offen = [];
            for (const d of (G().drivers || [])) if (d._guestFrom && d._guestYear === y) {
                haengt++; offen.push([d, d._guestFrom, d.team]);
                const tn = id => ((G().teams || []).find(t => t.id === id) || {}).name || id;
                if (beispiele.length < 8) beispiele.push(`${y} hängt: ${d.name} Stamm ${tn(d._guestFrom)}, steht bei ${tn(d.team)}`);
            }
            saisons++;
            if (k === SEASONS - 1) break;
            ctx.processSeasonEndEvents();
            // Nach dem Saisonende: steht der Gast noch beim Gastteam, OHNE dass ein Transfer ihn
            // dorthin gebracht hat? Das ist der eigentliche Fehler (stiller Wechsel).
            for (const [d, stamm, gast] of offen) {
                const tr = (G().seasonTransfers || []).some(e => e.driverId === d.id && !e.midSeason);
                if (d.team === gast && !tr) still++;
            }
            ctx.startNewSeason();
        }
    } catch (e) { console.log('Sim verworfen:', e.message); }
}
console.log(`ab ${YEAR}, ${SIMS} Sims x ${SEASONS} Saisons = ${saisons} Saisons`);
console.log(`Gastfahrer je Saison: ${(gastSumme / saisons).toFixed(1)}`);
console.log(`hängt nach dem Finale: ${haengt} (${(haengt / saisons).toFixed(2)} je Saison)`);
console.log(`davon nach dem Saisonende still beim Gastteam (ohne Transfer): ${still}`);
console.log(`Gast mitten in der Saison entlassen: ${gastRaus} (${(gastRaus / saisons).toFixed(2)} je Saison)`);
beispiele.forEach(b => console.log('  ' + b));
