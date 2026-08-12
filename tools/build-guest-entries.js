// build-guest-entries.js — erzeugt data/guest-entries.js (Deckungs-Fahrplan, Stufe 2)
//
// PROBLEM: SEASON_DATA fuehrt pro Fahrer und Saison genau EIN Team (`d[2]`). Stufe 1
// hat dieses eine Team auf den MEHRHEITS-Rennstall gesetzt — richtig, aber damit gehen
// alle Auftritte beim jeweils anderen Team verloren. Nutzer-Vorgabe 2026-08-09:
//
//   "falls ein fahrer 10 rennen bei ferrari fuhr und ein rennen beim
//    kleinst-konstrukteur, gibt es ein konflikt, dann gibt es trotzdem
//    dieses eine rennmeldung fuer den kleinst-konstrukteur"
//
// Diese Tabelle haelt genau diese Minderheits-Auftritte: Jahr -> Konstrukteur ->
// Fahrer -> Strecken. Sie ist die Gegenbuchung zur Mehrheitsregel.
//
// WARUM EINE NEBENTABELLE und kein zweites Team-Feld in SEASON_DATA: das Format ist
// an hunderten Stellen im Spiel verdrahtet. Eine schmale Zusatztabelle laesst es
// unberuehrt — dasselbe Muster wie data/presence.js bei L1.
//
// SCHLUESSEL wie bei presence.js: circuitIds (lowercase), nicht Rundennummern —
// `driver.scheduledRaces` ist seit v0.9.15.11 bewusst circuit-basiert, damit
// Kalender-Aenderungen nichts verschieben.
//
// Aufruf:  node tools/build-guest-entries.js          (Trockenlauf)
//          node tools/build-guest-entries.js --write  (schreibt data/guest-entries.js)
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'f1db-json-splitted');
const OUT = path.join(ROOT, 'data', 'guest-entries.js');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
const WRITE = process.argv.includes('--write');

// ── Kalender, Indy raus (gleiche Filterregel wie build-presence.js) ─────────
const roundCircuit = {}, calendarOf = {};
for (const r of J('f1db-races.json')) {
    const indy = r.grandPrixId === 'indianapolis';
    const cid = indy ? null : String(r.circuitId || '').toLowerCase();
    roundCircuit[`${r.year}_${r.round}`] = cid;
    if (cid) (calendarOf[r.year] = calendarOf[r.year] || new Set()).add(cid);
}

// ── Auftritte je Fahrer/Jahr/Konstrukteur ──────────────────────────────────
// year -> driverId -> constructorId -> Set(circuitId)
const auftritte = {};
for (const e of J('f1db-seasons-entrants-drivers.json')) {
    if (e.testDriver) continue;
    for (const rd of (e.rounds || [])) {
        const cid = roundCircuit[`${e.year}_${rd}`];
        if (!cid) continue;
        const Y = (auftritte[e.year] = auftritte[e.year] || {});
        const D = (Y[e.driverId] = Y[e.driverId] || {});
        (D[e.constructorId] = D[e.constructorId] || new Set()).add(cid);
    }
}

const drvName = {};
for (const d of J('f1db-drivers.json')) drvName[d.id] = d.name;
const cidName = {};
for (const c of J('f1db-constructors.json')) cidName[c.id] = c.name;

// ── Minderheits-Auftritte einsammeln ───────────────────────────────────────
const out = {};
let fahrerSaisons = 0, eintraege = 0, rennen = 0;
const proDekade = {};
const jahre = Object.keys(auftritte).map(Number).sort((a, b) => a - b);

for (const y of jahre) {
    // VOLLSTAENDIGKEITS-WAECHTER wie in build-presence.js: fuer eine noch nicht
    // gefahrene Saison kennt F1DB nur die ersten Runden. Ohne Pruefung entstuenden
    // dort Phantom-Gastauftritte. Regel: an jeder Kalenderstrecke muss irgendwer
    // gemeldet haben, sonst faellt das ganze Jahr raus.
    const cal = calendarOf[y];
    if (!cal || !cal.size) continue;
    const gesehen = new Set();
    for (const d of Object.keys(auftritte[y]))
        for (const c of Object.keys(auftritte[y][d]))
            for (const s of auftritte[y][d][c]) gesehen.add(s);
    if (gesehen.size < cal.size) continue;

    const row = {};
    for (const dId of Object.keys(auftritte[y])) {
        const teams = auftritte[y][dId];
        const keys = Object.keys(teams);
        if (keys.length < 2) continue;                    // nur ein Team → nichts zu tun
        fahrerSaisons++;
        // Mehrheit = meiste Rennen; bei Gleichstand das frueher gefahrene Team,
        // damit die Auswahl deterministisch ist (sonst wackelt die Datei je Lauf).
        const sortiert = keys.slice().sort((a, b) => teams[b].size - teams[a].size || a.localeCompare(b));
        const mehrheit = sortiert[0];
        for (const c of sortiert.slice(1)) {
            const strecken = [...cal].filter(s => teams[c].has(s));   // Kalenderreihenfolge
            if (!strecken.length) continue;
            (row[c] = row[c] || {})[dId] = strecken;
            eintraege++; rennen += strecken.length;
            const dek = Math.floor(y / 10) * 10;
            proDekade[dek] = (proDekade[dek] || 0) + strecken.length;
        }
    }
    if (Object.keys(row).length) out[y] = row;
}

const jahreOut = Object.keys(out).map(Number).sort((a, b) => a - b);
console.log(`Saisons mit Gastauftritten: ${jahreOut.length} (${Math.min(...jahreOut)}-${Math.max(...jahreOut)})`);
console.log(`Fahrer-Saisons mit mehr als einem Team: ${fahrerSaisons}`);
console.log(`Gast-Eintraege (Fahrer x Konstrukteur): ${eintraege}`);
console.log(`Gemeldete Rennen daraus insgesamt:      ${rennen}`);
console.log(`Rennen je Dekade:`, Object.keys(proDekade).sort().map(d => `${d}s:${proDekade[d]}`).join('  '));

const body = jahreOut.map(y => {
    const inner = Object.keys(out[y]).sort().map(c => {
        const f = Object.keys(out[y][c]).sort()
            .map(d => JSON.stringify(d) + ':' + JSON.stringify(out[y][c][d])).join(',');
        return JSON.stringify(c) + ':{' + f + '}';
    }).join(',');
    return y + ':{' + inner + '}';
}).join(',\n            ');

const block = `        // GUEST_ENTRIES — Auftritte eines Fahrers bei einem ANDEREN als seinem
        // Mehrheits-Rennstall derselben Saison.
        // GENERIERT von tools/build-guest-entries.js — NICHT von Hand editieren.
        //
        // Hintergrund: SEASON_DATA kennt nur EIN Team je Fahrer und Saison. Stufe 1 des
        // Deckungs-Fahrplans setzt das auf den Mehrheits-Rennstall; ohne diese Tabelle
        // gingen alle uebrigen Auftritte verloren — samt der Konstrukteure, die dadurch
        // ganz aus der Saison fielen (Trojan 1974 hing allein an Tim Schenken).
        //
        // Aufbau:  Jahr -> constructorId -> driverId -> [circuitId, ...]
        // Strecken in Kalenderreihenfolge, lowercase, Indy ausgeschlossen.
        // ${eintraege} Eintraege ueber ${jahreOut.length} Saisons, ${rennen} Meldungen.
        const GUEST_ENTRIES = {
            ${body}
        };
`;

console.log(`Dateigroesse: ${(block.length / 1024).toFixed(1)} KB`);

if (!WRITE) {
    const bsp = out[1974];
    if (bsp) {
        console.log(`\nStichprobe 1974:`);
        for (const c of Object.keys(bsp)) {
            for (const d of Object.keys(bsp[c])) {
                console.log(`  ${(cidName[c] || c).padEnd(16)} ${(drvName[d] || d).padEnd(20)} ${bsp[c][d].length} Rennen: ${bsp[c][d].join(', ')}`);
            }
        }
    }
    console.log('\nTrockenlauf — nichts geschrieben. Mit --write erzeugen.');
    process.exit(0);
}

fs.writeFileSync(OUT, block, 'utf8');
console.log(`\n${OUT} geschrieben.`);
