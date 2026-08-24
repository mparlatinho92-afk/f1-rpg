// phantom-guard.js — ERKENNT DIE PRUEFUNG EINE PHANTOM-TABELLE? UND NUR DIESE?
//
// Anlass: im Stand des Nutzers (F1RPG_2046_R0_2026-08-23) trugen 5 von 96 Saisons eine
// WM-Tabelle, die nicht zu ihrer eigenen Saison gehoert. 1955 hatte 141 Eintraege bei
// 46 Fahrern und 45 Ergebnis-IDs — mit Duplikaten (Moss und Hawthorn doppelt), fremden
// Indy-Fahrern (Rodger Ward, Pat O'Connor) und Eugenio Castellotti als Weltmeister mit
// 25 Punkten, ohne ein einziges Rennergebnis.
//
// ⚠⚠ DIE TEUERSTE LEHRE DIESER RUNDE — PRUEFRICHTUNG:
// Bis .17.4 zaehlte `rebuiltStandingsIfBroken`, wie viele ERGEBNIS-Eintraege in der Tabelle
// stehen. Das ist die falsche Richtung: eine Tabelle kann alle echten Fahrer enthalten UND
// beliebig viele fremde obendrauf. In allen fuenf kaputten Saisons ergab diese Rechnung
// 100 % — die Reparatur loeste also NIE aus, obwohl sie eigens dafuer gebaut war.
// Richtig ist die Gegenrichtung: ein Tabellen-Eintrag MIT PUNKTEN muss ein Rennergebnis
// haben. Punkte ohne Rennen sind logisch unmoeglich. Gemessen: 91 von 96 Saisons haben
// 0 % solcher Geister, die fuenf kaputten 39-55 %.
//
// ⚠ ZWEITE LEHRE — ORT DER REPARATUR:
// Ein Entwurf rechnete die Tabelle beim ARCHIVIEREN neu. Die Gegenprobe unten hat das
// gestoppt: eine intakte Saison wurde dabei veraendert (84 -> 97 Eintraege). Direkt nach
// dem letzten Rennen sind 0 % der Punkte-Eintraege ohne Ergebnis — bis zum Archivieren
// haben checkCareerEnds/initReservePool/processTeamChanges den Kader aber weitergedreht,
// waehrend die Ergebnisse die alten IDs tragen. Die Reparatur gehoert deshalb ans LESEN
// archivierter Saisons, wo Kader und Ergebnisse zusammen eingefroren sind; beim
// Archivieren steht nur noch eine Log-Warnung.
//
//   node tests/phantom-guard.js
'use strict';
const { getContext } = require('./sim-core');
const ctx = getContext();
const f = ctx.rebuiltStandingsIfBroken;

if (typeof f !== 'function') { console.log('❌ rebuiltStandingsIfBroken nicht erreichbar'); process.exit(1); }

let fehler = 0;
const pruefe = (name, erwartet, ist) => {
    const ok = erwartet === ist;
    if (!ok) fehler++;
    console.log(`  ${ok ? '✅' : '❌'} ${name.padEnd(52)} erwartet ${erwartet}, ist ${ist}`);
};

// ── Fall 1: gesunde Tabelle — muss UNVERAENDERT durchlaufen ────────────────────
{
    const drivers = [{ id: 'a', name: 'Stirling Moss' }, { id: 'b', name: 'Mike Hawthorn' }];
    const results = [{ res: [{ d: 'a', p: 1, pt: 8, tmn: 'Maserati' }, { d: 'b', p: 2, pt: 6, tmn: 'Ferrari' }] }];
    const st = { a: { name: 'Stirling Moss', points: 8, wins: 1 }, b: { name: 'Mike Hawthorn', points: 6, wins: 0 } };
    pruefe('gesunde Tabelle bleibt dasselbe Objekt', true, f(results, drivers, st) === st);
}

// ── Fall 2: IDs laufen auseinander, Namen passen — NICHT anfassen ──────────────
// Fahrer-IDs tragen einen Zeitstempel. Ohne Namensbruecke wuerde hier faelschlich
// repariert, obwohl die Saison voellig gesund ist.
{
    const drivers = [{ id: 'neu-1', name: 'Stirling Moss' }];
    const results = [{ res: [{ d: 'neu-1', p: 1, pt: 8, tmn: 'Maserati' }] }];
    const st = { 'alt-999': { name: 'Stirling Moss', points: 8, wins: 1 } };
    pruefe('nur ID-Wechsel (Name passt) bleibt unveraendert', true, f(results, drivers, st) === st);
}

// ── Fall 3: Phantom-Champion ohne Rennergebnis — MUSS repariert werden ─────────
{
    const drivers = [{ id: 'a', name: 'Stirling Moss' }];
    const results = [{ res: [{ d: 'a', p: 1, pt: 8, tmn: 'Maserati' }] }];
    const st = {
        a: { name: 'Stirling Moss', points: 8, wins: 1 },
        ALBERT: { name: 'Eugenio Castellotti', team: 'Connaught', points: 25, wins: 2, podiums: 3 },
        JERRYH: { name: 'Mike Hawthorn', team: 'Gordini', points: 16, wins: 1 },
    };
    const r = f(results, drivers, st);
    pruefe('Phantom-Tabelle wird neu gerechnet', true, r !== st);
    pruefe('  Phantome verworfen', 1, Object.keys(r).length);
    pruefe('  Fuehrender ist der echte Fahrer', 'Stirling Moss', Object.values(r)[0].name);
}

// ── Fall 4: lueckenhafte Bruecke — im Zweifel NICHT anfassen ───────────────────
// Loest der Kader die Ergebnis-IDs nicht auf, ist jeder „Geist" nur eine Luecke.
{
    const drivers = [];                                   // kein Kader → nichts aufloesbar
    const results = [{ res: [{ d: 'x', p: 1, pt: 8 }] }];
    const st = { ALBERT: { name: 'Eugenio Castellotti', points: 25, wins: 2 } };
    pruefe('ohne aufloesbaren Kader wird nicht repariert', true, f(results, drivers, st) === st);
}

// ── Fall 5: Poles ueberleben die Neurechnung ──────────────────────────────────
// Das `res`-Format kennt keinen Startplatz. Ohne Ruecksicherung wuerde die Spalte
// bei jeder Reparatur auf 0 fallen — Datenverlust durch den Fix selbst.
{
    const drivers = [{ id: 'a', name: 'Stirling Moss' }];
    const results = [{ res: [{ d: 'a', p: 1, pt: 8 }] }];
    const st = {
        a: { name: 'Stirling Moss', points: 8, wins: 1, poles: 4 },
        ALBERT: { name: 'Eugenio Castellotti', points: 25, wins: 2 },
    };
    const r = f(results, drivers, st);
    pruefe('Poles bleiben ueber die Namensbruecke erhalten', 4, Object.values(r)[0].poles);
}

console.log('');
console.log(fehler === 0
    ? '✅ Alle Faelle bestanden — die Pruefung trifft Phantome und nur Phantome.'
    : `❌ ${fehler} Fall/Faelle fehlgeschlagen.`);
process.exit(fehler === 0 ? 0 : 1);
