// season-data-coverage.js — Deckt SEASON_DATA jeden realen Konstrukteur und Fahrer ab?
//
// ZIEL (Nutzer-Vorgabe 2026-08-09):
//   1. Jeder Konstrukteur soll alle seine historischen Saisons melden koennen.
//   2. Jeder Fahrer moeglichst auch.
//   3. Ein Fahrer gehoert zu dem Team, bei dem er die MEHRHEIT der Rennen fuhr —
//      aber die Minderheits-Meldung geht nicht verloren: fuhr jemand 10 Rennen bei
//      Ferrari und 1 beim Kleinstkonstrukteur, bekommt der Kleine dieses eine Rennen.
//   4. Die ANZAHL der Mid-Season-Bewegungen soll der Realitaet folgen; wohin sie
//      gehen, bleibt emergent (aber skill-gebremst — kein Ian Ashley bei McLaren).
//
// PROBLEM heute: SEASON_DATA fuehrt pro Fahrer und Saison genau EIN Team (`d[2]`).
// Ein Konstrukteur verschwindet dadurch komplett, wenn alle seine Fahrer im selben
// Jahr noch woanders fuhren — und die Auswahl folgt nicht einmal der Rennzahl:
// Tim Schenken 1974 steht bei Lotus (1 Rennen) statt bei Trojan (8).
//
//   node tests/season-data-coverage.js            → Uebersicht + Aera-Aggregat
//   node tests/season-data-coverage.js 1974       → ein Jahr im Detail
//   node tests/season-data-coverage.js --fehlend  → alle fehlenden Konstrukteure
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'f1db-json-splitted');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));

const args = process.argv.slice(2);
const DETAIL = args.map(Number).filter(Boolean);
const SHOW_MISSING = args.includes('--fehlend');

// ── SEASON_DATA aus der Datei holen (Browser-Datei ohne Export) ─────────────
const SD = (() => {
    const src = fs.readFileSync(path.join(ROOT, 'data', 'seasons.js'), 'utf8');
    const g = {};
    new Function('g', 'with(g){' + src + '; g.SD = SEASON_DATA;}')(g);
    return g.SD;
})();

// ── Referenz ────────────────────────────────────────────────────────────────
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const nameToCid = {}, cidName = {};
for (const c of J('f1db-constructors.json')) {
    nameToCid[norm(c.name)] = c.id; nameToCid[norm(c.fullName)] = c.id; cidName[c.id] = c.name;
}
const drvName = {};
for (const d of J('f1db-drivers.json')) drvName[d.id] = d.name;

// Indy raus — anderes Starterfeld, gleiche Regel wie in allen Melde-Skripten.
const isF1Round = {};
for (const r of J('f1db-races.json')) isF1Round[`${r.year}_${r.round}`] = r.grandPrixId !== 'indianapolis';

// year -> driverId -> constructorId -> Rennen ; und year -> constructorId -> Wagen
const drvTeams = {}, ctorCars = {};
for (const e of J('f1db-seasons-entrants-drivers.json')) {
    if (e.testDriver) continue;
    let n = 0;
    for (const rd of (e.rounds || [])) if (isF1Round[`${e.year}_${rd}`]) n++;
    if (!n) continue;
    const D = (drvTeams[e.year] = drvTeams[e.year] || {});
    (D[e.driverId] = D[e.driverId] || {});
    D[e.driverId][e.constructorId] = (D[e.driverId][e.constructorId] || 0) + n;
    (ctorCars[e.year] = ctorCars[e.year] || {});
    ctorCars[e.year][e.constructorId] = (ctorCars[e.year][e.constructorId] || 0) + n;
}

const mehrheit = teams => Object.keys(teams).sort((a, b) => teams[b] - teams[a])[0];

// ── Auswertung je Jahr ──────────────────────────────────────────────────────
const rows = [];
for (let y = 1950; y <= 2025; y++) {
    const sd = SD[String(y)];
    if (!sd || !sd.t || !drvTeams[y]) continue;

    // JAHRES-BEWUSSTE Zuordnung. Ein globaler Name->Id-Index reicht nicht:
    //   • f1db fuehrt ZWEI Konstrukteure namens „Lotus" (`lotus` = Chapman,
    //     `lotus-f1` = Enstone ab 2012). Global gemappt landete das Template-Team
    //     „Lotus F1" nirgends und 2012–2015 sahen wie Luecken aus — bei vollen
    //     Saisons mit Raeikkoenen und Grosjean.
    //   • Teams werden umbenannt: 2025 heisst der Rennstall im Template „RB",
    //     bei f1db aber `racing-bulls`.
    // Deshalb: erst die Konstrukteure suchen, die IN DIESEM JAHR gefahren sind, und
    // gegen deren Name UND Id abgleichen; Umbenennungen ueber eine kleine Aliasliste.
    const RENAME = { rb: 'racing-bulls', racingbulls: 'rb' };
    const jahresKandidaten = {};
    for (const c of Object.keys(ctorCars[y])) {
        jahresKandidaten[norm(cidName[c] || c)] = c;
        jahresKandidaten[norm(c)] = c;
    }
    const mapTeam = name => {
        const k = norm(name);
        if (jahresKandidaten[k]) return jahresKandidaten[k];
        if (RENAME[k] && jahresKandidaten[norm(RENAME[k])]) return jahresKandidaten[norm(RENAME[k])];
        return nameToCid[k] || null;          // Rueckfall: global (Team fuhr dieses Jahr gar nicht)
    };
    const tmplCtor = new Set(sd.t.map(t => mapTeam(t[1])).filter(Boolean));
    const tmplCtorById = {};
    sd.t.forEach(t => { const c = mapTeam(t[1]); if (c) tmplCtorById[t[0]] = c; });
    const tmplDrvTeam = {};                      // Fahrername -> constructorId laut Template
    (sd.d || []).forEach(d => { if (d[1]) tmplDrvTeam[d[1].toLowerCase().trim()] = tmplCtorById[d[2]] || null; });

    const realCtor = Object.keys(ctorCars[y]).filter(c => ctorCars[y][c] > 0);
    const fehlend = realCtor.filter(c => !tmplCtor.has(c));

    // Fahrer mit mehreren Teams + ob das Template die Mehrheit traf
    let multi = 0, falschesTeam = 0, minderheitRennen = 0;
    const falschListe = [];
    for (const dId of Object.keys(drvTeams[y])) {
        const teams = drvTeams[y][dId];
        const nT = Object.keys(teams).length;
        if (nT > 1) {
            multi++;
            minderheitRennen += Object.values(teams).reduce((s, v) => s + v, 0) - teams[mehrheit(teams)];
        }
        const tmpl = tmplDrvTeam[String(drvName[dId] || '').toLowerCase().trim()];
        if (tmpl === undefined) continue;        // Fahrer nicht im Template
        const maj = mehrheit(teams);
        if (tmpl && tmpl !== maj) {
            falschesTeam++;
            if (falschListe.length < 4) falschListe.push(
                `${drvName[dId]}: ${cidName[tmpl] || tmpl} statt ${cidName[maj] || maj}(${teams[maj]})`);
        }
    }

    // Konstrukteure, fuer die KEIN Fahrer die Mehrheit dort hatte → brauchen die
    // Bewegungs-/Gastmechanik, ein Stammfahrer allein reicht nicht.
    const ohneStamm = realCtor.filter(c =>
        !Object.keys(drvTeams[y]).some(d => mehrheit(drvTeams[y][d]) === c));

    rows.push({ y, realCtor: realCtor.length, tmplCtor: tmplCtor.size, fehlend,
        realDrv: Object.keys(drvTeams[y]).length, tmplDrv: (sd.d || []).length,
        multi, minderheitRennen, falschesTeam, falschListe, ohneStamm });
}

// ── Detailmodus ─────────────────────────────────────────────────────────────
if (DETAIL.length) {
    for (const y of DETAIL) {
        const r = rows.find(x => x.y === y);
        if (!r) { console.log(`\n${y}: keine Daten`); continue; }
        console.log(`\n${'═'.repeat(76)}\n${y}`);
        console.log(`Konstrukteure real ${r.realCtor} · im Template ${r.tmplCtor} · fehlend ${r.fehlend.length}`);
        if (r.fehlend.length) console.log(`  fehlen: ${r.fehlend.map(c => `${cidName[c] || c}(${ctorCars[y][c]} Wagen)`).join(' · ')}`);
        if (r.ohneStamm.length) console.log(`  ohne Mehrheits-Stammfahrer: ${r.ohneStamm.map(c => cidName[c] || c).join(' · ')}`);
        console.log(`Fahrer real ${r.realDrv} · im Template ${r.tmplDrv}`);
        console.log(`Mehrfach-Team-Fahrer: ${r.multi} · davon Minderheits-Rennen gesamt: ${r.minderheitRennen}`);
        console.log(`Template greift das FALSCHE Team: ${r.falschesTeam}`);
        r.falschListe.forEach(x => console.log(`  ${x}`));
    }
    if (!SHOW_MISSING) process.exit(0);
}

// ── Fehlende Konstrukteure vollstaendig ─────────────────────────────────────
if (SHOW_MISSING) {
    console.log('\nFEHLENDE KONSTRUKTEURE (real gefahren, nicht im Template)');
    console.log('Jahr │ Konstrukteur          │ Wagen │ Fahrer (Rennen dort / gesamt in der Saison)');
    console.log('─'.repeat(96));
    for (const r of rows) {
        for (const c of r.fehlend) {
            const fahrer = Object.keys(drvTeams[r.y])
                .filter(d => drvTeams[r.y][d][c])
                .map(d => {
                    const t = drvTeams[r.y][d];
                    const ges = Object.values(t).reduce((s, v) => s + v, 0);
                    return `${drvName[d] || d} (${t[c]}/${ges})`;
                });
            console.log(`${r.y} │ ${(cidName[c] || c).padEnd(21).slice(0, 21)} │ ${String(ctorCars[r.y][c]).padStart(5)} │ ${fahrer.join(' · ')}`);
        }
    }

    // Die harten Faelle: kein einziger Fahrer hatte hier seine Mehrheit. Ein
    // „Stammfahrer nach Mehrheit"-Ansatz rettet diese Konstrukteure NICHT — sie
    // brauchen die Konfliktregel (Fahrer X fuhr 10 Rennen bei Ferrari und eins
    // hier; das eine Rennen gehoert trotzdem hierher).
    console.log('\nKONSTRUKTEUR-SAISONS OHNE MEHRHEITS-STAMMFAHRER');
    console.log('Jahr │ Konstrukteur          │ Wagen │ im Template? │ Fahrer (hier/gesamt)');
    console.log('─'.repeat(96));
    let n = 0;
    for (const r of rows) {
        for (const c of r.ohneStamm) {
            n++;
            const fahrer = Object.keys(drvTeams[r.y]).filter(d => drvTeams[r.y][d][c]).map(d => {
                const t = drvTeams[r.y][d];
                return `${drvName[d] || d} (${t[c]}/${Object.values(t).reduce((s, v) => s + v, 0)})`;
            });
            console.log(`${r.y} │ ${(cidName[c] || c).padEnd(21).slice(0, 21)} │ ${String(ctorCars[r.y][c]).padStart(5)} │ ` +
                `${(r.fehlend.includes(c) ? 'NEIN' : 'ja').padStart(12)} │ ${fahrer.join(' · ')}`);
        }
    }
    console.log(`\n${n} Konstrukteur-Saisons. Sie sind der Pruefstein fuer die Konfliktregel.`);
    process.exit(0);
}

// ── Uebersicht ──────────────────────────────────────────────────────────────
console.log(`\nSEASON_DATA-DECKUNG gegen F1DB  (${rows.length} Saisons, Indy ausgeschlossen)\n`);
console.log('Dekade │ Konstrukteure    │ Fahrer           │ Mehrfach-Team-Fahrer │ Template trifft');
console.log('       │ real  Tmpl fehlt │ real  Tmpl fehlt │  Anzahl  Minderh.-Rn │ falsches Team');
console.log('─'.repeat(96));
const dec = {};
for (const r of rows) {
    const d = Math.floor(r.y / 10) * 10;
    const D = (dec[d] = dec[d] || { rc: 0, tc: 0, f: 0, rd: 0, td: 0, m: 0, mr: 0, ft: 0, n: 0 });
    D.rc += r.realCtor; D.tc += r.tmplCtor; D.f += r.fehlend.length;
    D.rd += r.realDrv; D.td += r.tmplDrv;
    D.m += r.multi; D.mr += r.minderheitRennen; D.ft += r.falschesTeam; D.n++;
}
const f1 = (v, w) => v.toFixed(1).padStart(w);
for (const d of Object.keys(dec).sort()) {
    const D = dec[d];
    console.log(`${d}s  │ ${f1(D.rc / D.n, 5)} ${f1(D.tc / D.n, 5)} ${String(D.f).padStart(5)} │ ` +
        `${f1(D.rd / D.n, 5)} ${f1(D.td / D.n, 5)} ${String(Math.max(0, Math.round(D.rd - D.td))).padStart(5)} │ ` +
        `${f1(D.m / D.n, 7)} ${f1(D.mr / D.n, 13)} │ ${f1(D.ft / D.n, 8)} je Saison`);
}
const T = rows.reduce((s, r) => ({ f: s.f + r.fehlend.length, ft: s.ft + r.falschesTeam,
    m: s.m + r.multi, os: s.os + r.ohneStamm.length }), { f: 0, ft: 0, m: 0, os: 0 });
console.log(`\nGesamt: ${T.f} fehlende Konstrukteure · ${T.ft} Fahrer im falschen Team · ` +
    `${T.m} Mehrfach-Team-Fahrer-Saisons · ${T.os} Konstrukteur-Saisons ohne Mehrheits-Stammfahrer`);
console.log(`Jahre ganz ohne fehlenden Konstrukteur: ${rows.filter(r => !r.fehlend.length).length} von ${rows.length}`);
console.log(`\n„Minderh.-Rn" = Rennen, die ein Fahrer NICHT bei seinem Mehrheitsteam fuhr.`);
console.log(`Das ist die Menge, die bei „ein Team je Fahrer" verlorengeht — und zugleich`);
console.log(`die Zielgroesse fuer die Zahl der Mid-Season-Bewegungen.`);
