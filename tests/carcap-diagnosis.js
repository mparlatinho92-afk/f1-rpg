// carcap-diagnosis.js — WO entsteht das dritte Auto?
//
// Offener Befund (project_venue_pull_and_single_entries): 2005 melden 3,4 % der
// Teams DREI Wagen, obwohl `_maxCarsPerConstructor(2005)` = 2 und
// `applyConstructorCarCap` nachweislich kappt. Die Luecke liegt irgendwo zwischen
// dem Deckel und der fertigen Ergebnisliste.
//
// Dieses Skript legt drei Messpunkte je Rennen nebeneinander:
//   [A] VOR dem Deckel     — Eingabe von applyConstructorCarCap (Wrapper)
//   [B] NACH dem Deckel    — Rueckgabe von applyConstructorCarCap (Wrapper)
//   [C] Ergebnisliste      — Starter + DNQ + DNPQ aus simulateRace
// Bleibt [B] sauber und [C] nicht, kommt der dritte Wagen NACH dem Deckel dazu.
//
// Der Wrapper haengt sich an die Kontext-Global (`ctx.applyConstructorCarCap`) —
// Top-Level-Funktionen der HTML liegen dort, und simulateRace loest sie ueber die
// Scope-Kette darueber auf. `globalThis`-Sonden funktionieren NICHT (eigener
// vm-Kontext), siehe Messfalle im Themen-Memo.
//
// AUFRUF
//   node tests/carcap-diagnosis.js 2005 5
//   node tests/carcap-diagnosis.js 2005 5 --alle     (jede Verletzung einzeln)
//   SIMCORE_FROM_INDEX=1 davorsetzen fuer die unkommittete index.html.
'use strict';
const { getContext } = require('./sim-core');

const argv = process.argv.slice(2);
const num = argv.filter(a => /^\d+$/.test(a)).map(Number);
const YEAR = num[0] || 2005;
const SIMS = num[1] || 5;
const ALLE = argv.includes('--alle');

const ctx = getContext();

// Fehlt eine der beiden Funktionen im Kontext, sind die Top-Level-Funktionen der
// HTML nicht als Globals sichtbar — dann misst das Skript nichts und darf nicht
// stillschweigend „0 Verletzungen" melden.
for (const fn of ['applyConstructorCarCap', '_maxCarsPerConstructor', 'simulateRace']) {
    if (typeof ctx[fn] !== 'function') {
        console.log(`ABBRUCH: ${fn} ist im sim-core-Kontext nicht sichtbar.`);
        process.exit(1);
    }
}

// ── Messpunkte A und B: Wrapper um den Deckel ───────────────────────────────
// Die letzte Deckel-Rechnung des laufenden Rennens wird hier abgelegt und nach
// simulateRace ausgelesen. simulateTraining/-Qualifying rufen denselben Deckel,
// deshalb zaehlt nur der LETZTE Aufruf vor der Auswertung (= der aus simulateRace).
let letzterDeckel = null;
const _origCap = ctx.applyConstructorCarCap;
ctx.applyConstructorCarCap = function (drivers, teams, year) {
    const vorher = {};
    drivers.forEach(d => { if (d.team) vorher[d.team] = (vorher[d.team] || 0) + 1; });
    const out = _origCap.call(this, drivers, teams, year);
    const nachher = {};
    out.forEach(d => { if (d.team) nachher[d.team] = (nachher[d.team] || 0) + 1; });
    letzterDeckel = { vorher, nachher, deckel: ctx._maxCarsPerConstructor(year) };
    return out;
};

// ── Sammelbehaelter ─────────────────────────────────────────────────────────
const stat = {
    rennen: 0,
    ueberVorDeckel: 0,      // Teams mit > Deckel VOR dem Kappen  [A]
    ueberNachDeckel: 0,     // Teams mit > Deckel NACH dem Kappen [B]  -> muss 0 sein
    ueberImErgebnis: 0,     // Teams mit > Deckel in der Ergebnisliste [C]
    teamsGesamt: 0,
    verteilung: {},         // Wagenzahl -> wie oft
    gaeste: 0,              // Ergebniszeilen mit isGuest
    quellen: {},            // Woher kam der ueberzaehlige Wagen: Start/DNQ/DNPQ/Gast
};
const faelle = [];

function pc(a, b) { return b ? (a / b * 100).toFixed(1) + ' %' : '-'; }

for (let s = 0; s < SIMS; s++) {
    process.stdout.write(`  Sim ${s + 1}/${SIMS}... `);
    try {
        ctx.initFromYear(YEAR);
    } catch (e) { console.log(`Start fehlgeschlagen: ${e.message}`); continue; }

    const races = ctx.GAME_STATE.races || [];
    for (let i = 0; i < races.length; i++) {
        const race = races[i];
        if (race.isIndy || (race.name || '').includes('Indianapolis')) continue;
        let result = null;
        letzterDeckel = null;
        try {
            if (typeof ctx.applyGuestMoves === 'function') ctx.applyGuestMoves(i);
            ctx.simulateTraining(i);
            ctx.simulateQualifying(i, false);
            result = ctx.simulateRace(i, false);
        } catch (e) { continue; }
        if (!result) continue;

        // Kader JETZT einlesen — vor applyRaceResults, das schon Sitzverluste nachzieht.
        const dName = {}, dTeam = {};
        for (const d of (ctx.GAME_STATE.drivers || [])) { dName[d.id] = d.name; dTeam[d.id] = d.team || null; }
        const tName = {};
        for (const t of (ctx.GAME_STATE.teams || [])) tName[t.id] = t.name;

        const deckel = ctx._maxCarsPerConstructor(ctx.GAME_STATE.currentYear);
        stat.rennen++;

        // [C] Ergebnisliste. Starter tragen ihr Team SELBST (r.team) — DNQ/DNPQ sind
        // nur Ids und muessen ueber den Kader aufgeloest werden.
        const carsOf = {};                       // teamId -> [{name, kind, gast}]
        const push = (tid, eintrag) => { if (tid) (carsOf[tid] = carsOf[tid] || []).push(eintrag); };
        (result.results || []).forEach(r => {
            push(r.team, { name: r.name || dName[r.driver] || r.driver, kind: 'Start', gast: !!r.isGuest });
            if (r.isGuest) stat.gaeste++;
        });
        (result.dnq || []).forEach(id => push(dTeam[id], { name: dName[id] || id, kind: 'DNQ', gast: false }));
        (result.dnpq || []).forEach(id => push(dTeam[id], { name: dName[id] || id, kind: 'DNPQ', gast: false }));

        for (const tid in carsOf) {
            const n = carsOf[tid].length;
            stat.teamsGesamt++;
            stat.verteilung[n] = (stat.verteilung[n] || 0) + 1;
            if (n <= deckel) continue;
            stat.ueberImErgebnis++;
            // Der ueberzaehlige Wagen: welche Sorte Eintrag ist ueber dem Deckel?
            carsOf[tid].slice(deckel).forEach(e => {
                const k = e.gast ? 'Grid-Fueller' : e.kind;
                stat.quellen[k] = (stat.quellen[k] || 0) + 1;
            });
            faelle.push({
                sim: s + 1, rennen: race.name || race.circuitId,
                team: tName[tid] || tid,
                nachDeckel: letzterDeckel ? (letzterDeckel.nachher[tid] || 0) : null,
                vorDeckel: letzterDeckel ? (letzterDeckel.vorher[tid] || 0) : null,
                fahrer: carsOf[tid],
            });
        }

        // [A]/[B] aus dem Wrapper
        if (letzterDeckel) {
            for (const tid in letzterDeckel.vorher) if (letzterDeckel.vorher[tid] > letzterDeckel.deckel) stat.ueberVorDeckel++;
            for (const tid in letzterDeckel.nachher) if (letzterDeckel.nachher[tid] > letzterDeckel.deckel) stat.ueberNachDeckel++;
        }

        try { ctx.applyRaceResults(result); } catch (e) { /* egal, wir messen die Meldung */ }
    }
    console.log('fertig');
}

// ── Bericht ─────────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(78)}`);
console.log(`  WAGEN JE KONSTRUKTEUR — ${YEAR}, ${SIMS} Sims, ${stat.rennen} Rennen`);
console.log(`${'='.repeat(78)}`);
console.log(`Deckel laut _maxCarsPerConstructor: ${ctx._maxCarsPerConstructor(YEAR)}\n`);

console.log(`[A] Teams ueber Deckel VOR  applyConstructorCarCap : ${stat.ueberVorDeckel}`);
console.log(`[B] Teams ueber Deckel NACH applyConstructorCarCap : ${stat.ueberNachDeckel}   <- muss 0 sein`);
console.log(`[C] Teams ueber Deckel in der ERGEBNISLISTE        : ${stat.ueberImErgebnis}  (${pc(stat.ueberImErgebnis, stat.teamsGesamt)} aller ${stat.teamsGesamt} Team-Meldungen)\n`);

console.log('Verteilung Wagen je Team und Rennen:');
Object.keys(stat.verteilung).map(Number).sort((a, b) => a - b)
    .forEach(n => console.log(`  ${n} Wagen: ${String(stat.verteilung[n]).padStart(6)}  ${pc(stat.verteilung[n], stat.teamsGesamt)}`));

console.log(`\nGrid-Fueller-Eintraege insgesamt: ${stat.gaeste}`);

if (stat.ueberImErgebnis) {
    console.log('\nSorte des ueberzaehligen Eintrags:');
    Object.entries(stat.quellen).sort((a, b) => b[1] - a[1])
        .forEach(([k, v]) => console.log(`  ${k.padEnd(14)} ${String(v).padStart(5)}`));

    console.log('\nFAELLE' + (ALLE ? '' : ' (erste 15 — alle mit --alle)'));
    console.log('-'.repeat(78));
    (ALLE ? faelle : faelle.slice(0, 15)).forEach(f => {
        console.log(`Sim ${f.sim} | ${String(f.rennen).slice(0, 30).padEnd(30)} | ${f.team}`);
        console.log(`   Deckel-Wrapper: vorher ${f.vorDeckel} -> nachher ${f.nachDeckel} | Ergebnis ${f.fahrer.length}`);
        f.fahrer.forEach(e => console.log(`   - ${e.name.padEnd(24)} ${e.kind}${e.gast ? ' (Grid-Fueller)' : ''}`));
    });
    if (!ALLE && faelle.length > 15) console.log(`... ${faelle.length - 15} weitere mit --alle`);
} else {
    console.log('\nKeine Verletzung — der Deckel haelt bis in die Ergebnisliste.');
}

console.log(`\nLESART: [B] > 0 = der Deckel selbst rechnet falsch. [B] = 0 und [C] > 0 =`);
console.log(`der dritte Wagen kommt NACH dem Deckel dazu (Grid-Fueller, Gastzug, Kaderwechsel).`);
