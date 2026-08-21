// roster-drift.js — DUENNT DER KADER UEBER DIE SAISONS AUS?
//
// NUTZER-BEFUND (2026-08-20): „egal ob Saison 3, 4, 5 oder Startjahr — das Delta
// sollte einigermassen gleich sein. Generierte Fahrer oder die Erzaehlung an sich
// sollen doch nicht den Mantel der Anzahl Meldungen beeinflussen."
// Das trifft zu: wie viele Wagen je Rennen antreten, haengt am Regelwerk und an der
// Struktur der Teams, nicht daran, WER faehrt. Gemessen mit mc-entries-dnq stieg der
// Anteil der Ein-Auto-Team-Rennen aber ueber die Kette:
//   ab 1955  12 → 22 → 14 → 19 → 33 %
//   ab 1983  17 → 20 → 31 → 21 → 21 %
//   ab 2005   1 →  2 →  4 →  3 %      (stabil — dort greift _minCarsPerConstructor)
//
// Dieses Skript zeigt WARUM, indem es je Saison der Kette die Kaderstruktur zaehlt,
// statt nur das Ergebnis:
//   • Teams, und wie viele aktive Fahrer sie im Kader haben
//   • wie viele davon Werksfahrer sind (scheduledRaces === null → jedes Rennen)
//   • wie viele einen Teilzeitplan tragen, und wie lang der im Schnitt ist
//   • Teams mit nur EINEM Fahrer im Kader (Sitzfueller hat versagt)
// Damit laesst sich trennen, ob der Kader SCHRUMPFT oder ob die PLAENE duenner werden.
//
//   node tests/roster-drift.js 1983 8 5      Startjahr, Sims, Saisons
'use strict';
const path = require('path');
const { getContext } = require('./sim-core');

const YEAR = Number(process.argv[2] || 1983);
const SIMS = Number(process.argv[3] || 8);
const SEASONS = Number(process.argv[4] || 5);

const ctx = getContext();
const acc = [];   // je Saisonindex ein Akkumulator

function messen(k) {
    const a = acc[k] = acc[k] || {
        jahr: 0, teams: 0, fahrer: 0, werks: 0, teilzeit: 0,
        planSumme: 0, planZahl: 0, einFahrerTeams: 0, kalender: 0, sims: 0,
    };
    const gs = ctx.GAME_STATE;
    const cal = (gs.races || []).filter(r => !r.isIndy && r.circuitId);
    const aktiv = (gs.drivers || []).filter(d => !d.status || d.status === 'active');
    const proTeam = {};
    aktiv.forEach(d => { if (d.team) (proTeam[d.team] = proTeam[d.team] || []).push(d); });

    a.jahr = gs.currentYear;
    a.kalender += cal.length;
    a.sims++;

    // === WAS-WAERE-WENN: „wer meldet, meldet voll" ===
    // Reine Buchhaltung auf dem FERTIGEN Meldeplan, keine Aenderung am Spiel.
    // Fuer jedes Rennen und jedes Team: tritt es ueberhaupt an (>=1 Melder), wie
    // viele Wagen brächte es mit, wenn es sein volles Aufgebot stellte? Aufgebot =
    // Kadergroesse, gedeckelt durch Aera-Regel und _carsThisSeason. Teams, die gar
    // nicht antreten, bleiben unangetastet — ein Kleinstkonstrukteur darf weiter
    // eine Teilsaison fahren, er soll nur nicht mal mit einem und mal mit zwei
    // Wagen zum SELBEN Rennen kommen.
    const deckelEra = typeof ctx._maxCarsPerConstructor === 'function'
        ? ctx._maxCarsPerConstructor(gs.currentYear) : 99;
    const teamsById = {}; (gs.teams || []).forEach(t => { teamsById[t.id] = t; });
    for (const r of cal) {
        for (const tid in proTeam) {
            const kader = proTeam[tid];
            const melder = kader.filter(d => ctx.privateerEntersRace(d, r)).length;
            a.istMeldungen = (a.istMeldungen || 0) + melder;
            if (melder === 0) continue;                  // Team tritt nicht an
            const t = teamsById[tid];
            const deckel = Math.min(deckelEra, (t && t._carsThisSeason) || deckelEra, kader.length);
            if (melder < deckel) a.zusatz = (a.zusatz || 0) + (deckel - melder);
            if (melder === 1) a.einAuto = (a.einAuto || 0) + 1;
            a.teamRennen = (a.teamRennen || 0) + 1;
        }
    }
    for (const tid in proTeam) {
        const ds = proTeam[tid];
        a.teams++; a.fahrer += ds.length;
        if (ds.length === 1) a.einFahrerTeams++;
        // Die zwei Schnellsten sind die Werksfahrer im Sinne von markPrivateers —
        // sie muessten praktisch jedes Rennen des Teams melden.
        const top2 = ds.slice().sort((x, y) => (y.pace || 0) - (x.pace || 0)).slice(0, 2);
        a.hist = a.hist || { voll: 0, hoch: 0, mittel: 0, wenig: 0 };
        for (const d of ds) {
            if (Array.isArray(d.scheduledRaces)) {
                a.teilzeit++; a.planSumme += d.scheduledRaces.length; a.planZahl++;
            } else {
                a.werks++;
            }
            if (!top2.includes(d)) continue;
            const n = Array.isArray(d.scheduledRaces) ? d.scheduledRaces.length : cal.length;
            const q = cal.length ? n / cal.length : 0;
            if (q >= 0.99) a.hist.voll++;
            else if (q >= 0.85) a.hist.hoch++;
            else if (q >= 0.5) a.hist.mittel++;
            else a.hist.wenig++;
        }
    }
}

let ok = 0;
for (let s = 0; s < SIMS; s++) {
    try {
        ctx.initFromYear(YEAR);
        for (let k = 0; k < SEASONS; k++) {
            messen(k);
            if (k === SEASONS - 1) break;
            const y = ctx.GAME_STATE.currentYear;
            if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
            if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
            if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
            if (typeof ctx.initReservePool === 'function') ctx.initReservePool(y + 1);
            if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(y + 1);
            if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        ok++;
    } catch (e) { if (s === 0) console.log('  (Sim 1 verworfen: ' + e.message.slice(0, 90) + ')'); }
}

console.log(`\nKADER-DRIFT  |  ab ${YEAR}  |  ${ok}/${SIMS} Sims × ${SEASONS} Saisons\n`);
console.log('Sais │ Jahr │ Teams │ Ø Fahrer/Team │ Werksf. │ Teilzeit │ Ø Plan │ Ein-Fahrer-Teams');
console.log('─────┼──────┼───────┼───────────────┼─────────┼──────────┼────────┼─────────────────');
acc.forEach((a, k) => {
    if (!a.sims) return;
    const t = a.teams / a.sims, f = a.fahrer / a.teams;
    const anteilTZ = a.teilzeit / (a.werks + a.teilzeit);
    const plan = a.planZahl ? a.planSumme / a.planZahl : 0;
    const kal = a.kalender / a.sims;
    console.log(
        `  ${String(k + 1).padStart(2)} │ ${a.jahr} │ ${t.toFixed(1).padStart(5)} │ `
        + `${f.toFixed(2).padStart(13)} │ ${(Math.round(100 * (1 - anteilTZ)) + ' %').padStart(7)} │ `
        + `${(Math.round(100 * anteilTZ) + ' %').padStart(8)} │ ${plan.toFixed(1).padStart(6)} │ `
        + `${(Math.round(100 * a.einFahrerTeams / a.teams) + ' %').padStart(16)}   (Kalender ${kal.toFixed(0)})`
    );
});
console.log('\nWAS-WAERE-WENN „wer meldet, meldet voll" (reine Rechnung, kein Eingriff):');
console.log('Sais │ Jahr │ Meld./Rennen │ + Zusatz │ = neu │ Ein-Auto-Team-Rennen');
console.log('─────┼──────┼──────────────┼──────────┼───────┼─────────────────────');
acc.forEach((a, k) => {
    if (!a.sims || !a.teamRennen) return;
    const rennen = a.kalender;                       // Rennen ueber alle Sims
    const ist = a.istMeldungen / rennen;
    const plus = (a.zusatz || 0) / rennen;
    console.log(
        `  ${String(k + 1).padStart(2)} │ ${a.jahr} │ ${ist.toFixed(1).padStart(12)} │ `
        + `${('+' + plus.toFixed(1)).padStart(8)} │ ${(ist + plus).toFixed(1).padStart(5)} │ `
        + `${(Math.round(100 * (a.einAuto || 0) / a.teamRennen) + ' %').padStart(20)}`
    );
});

console.log('\nDie ZWEI SCHNELLSTEN je Team (= Werksfahrer laut markPrivateers), nach Planlaenge:');
console.log('Sais │ Jahr │ 100 % │ 85-99 % │ 50-84 % │ < 50 %');
console.log('─────┼──────┼───────┼─────────┼─────────┼────────');
acc.forEach((a, k) => {
    if (!a.sims || !a.hist) return;
    const h = a.hist, g = h.voll + h.hoch + h.mittel + h.wenig;
    const p = n => (Math.round(100 * n / g) + ' %').padStart(6);
    console.log(`  ${String(k + 1).padStart(2)} │ ${a.jahr} │${p(h.voll)} │ ${p(h.hoch).padStart(8)} │ ${p(h.mittel).padStart(8)} │ ${p(h.wenig).padStart(7)}`);
});
console.log('\nØ Plan = mittlere Zahl geplanter Rennen der Teilzeit-Fahrer.');
console.log('Ein-Fahrer-Teams = Anteil der Teams, die nur EINEN aktiven Fahrer im Kader haben.');
