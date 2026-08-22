// data-sync-check.js — SIND TEST UND SPIEL SYNCHRON?
//
// Anlass (2026-08-22): `data/home-only.js` kam in v0.9.16.6 dazu, wurde in index.html
// und manage-v.ps1 eingetragen — und in der handgepflegten Liste von sim-core.js
// vergessen. Folge: HOME_ONLY_CONSTRUCTORS und HOME_ONLY_DRIVERS waren in ALLEN
// Messungen undefiniert. Ein Fix konnte im Spiel wirken und im Test unsichtbar bleiben,
// und die Abnahme lief trotzdem „gruen".
//
// Dieses Skript prueft dreierlei:
//   1. Laden index.html und manage-v.ps1 dieselben Datendateien?
//   2. Kommt aus JEDER Datendatei ihre Leitkonstante im Testkontext an?
//   3. Sind die Funktionen da, ueber die das Spiel auf diese Daten zugreift?
//
// ⚠ `const` haengt NICHT am globalen Objekt — `ctx.SEASON_DATA` ist immer undefined,
//   auch wenn alles stimmt. Geprueft wird deshalb im SKRIPT-Scope via runInContext.
//   (Aus demselben Grund ist die Startmeldung „SEASON_DATA: undefined" harmlos.)
//
//   node tests/data-sync-check.js                 gegen den letzten Monolithen
//   SIMCORE_FROM_INDEX=1 node tests/data-sync-check.js   gegen die Arbeitskopie
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getContext } = require('./sim-core');

const ROOT = path.join(__dirname, '..');

// ── 1. Dateilisten vergleichen ─────────────────────────────────────────────
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const idx = [...html.matchAll(/^[ \t]*<script src="(data\/[^"]+\.js)"><\/script>[ \t]*$/gm)].map(m => m[1]);
const mv = fs.readFileSync(path.join(ROOT, 'manage-v.ps1'), 'utf8');
const mvList = [...(((mv.match(/\$DataFiles = @\(([^)]*)\)/) || [])[1]) || '')
    .matchAll(/"(data\/[^"]+)"/g)].map(m => m[1]);

const fehltMv = idx.filter(x => !mvList.includes(x));
const zuvielMv = mvList.filter(x => !idx.includes(x));
console.log(`\nDATEILISTEN\n  index.html: ${idx.length} · manage-v.ps1: ${mvList.length}`);
console.log(`  nur in index.html: ${fehltMv.join(', ') || '—'}`);
console.log(`  nur in manage-v:   ${zuvielMv.join(', ') || '—'}`);
console.log('  sim-core liest die Tags aus index.html → per Konstruktion synchron');

// ── 2. Leitkonstante je Datendatei ─────────────────────────────────────────
// Eine Konstante, die es NUR in dieser Datei gibt. Fehlt sie, wurde die Datei
// nicht geladen — egal wie gruen der Rest aussieht.
const LEIT = {
    'data/f1db.js':            ['F1DB_RESULTS', 'HOME_ONLY_ENTRIES', 'INDY_500_ONLY_DRIVERS'],
    'data/hist.js':            ['HIST_SEASONS', 'NATIONALITY_ONLY_CONSTRUCTORS', 'LOYAL_OWNER_DRIVERS'],
    'data/seasons.js':         ['SEASON_DATA'],
    'data/names.js':           ['NAME_POOLS_BY_NATION', 'NATION_NAME_FALLBACK'],
    'data/era-first-names.js': ['ERA_FIRST_NAMES'],
    'data/circuit-layouts.js': ['CIRCUIT_LAYOUTS'],
    'data/presence.js':        ['TEAM_PRESENCE'],
    'data/guest-entries.js':   ['GUEST_ENTRIES'],
    'data/driver-starts.js':   ['DRIVER_STARTS'],
    'data/venue-pull.js':      ['VENUE_PULL'],
    'data/race-grid.js':       ['RACE_GRID'],
    'data/home-only.js':       ['HOME_ONLY_DRIVERS', 'HOME_ONLY_CONSTRUCTORS',
                                'SINGLE_DRIVER_CONSTRUCTORS', 'HOME_NATION_ALIAS'],
};
// Zugriffs-Funktionen: die Bruecke zwischen Spiel und Daten.
const FUNKTIONEN = ['getTeamPresence', 'homeOnlyConstructorNations', 'isSingleSeatConstructor',
                    'getNationalityOnlyNations', 'privateerEntersRace', 'applyCuratedHomeOnly',
                    'getGridSize', 'simulateRace'];

const ctx = getContext();
const probe = expr => { try { return vm.runInContext(expr, ctx); } catch (e) { return 'FEHLER: ' + e.message; } };

let fehlend = 0;
console.log('\nKONSTANTEN JE DATENDATEI');
for (const datei of idx) {
    const namen = LEIT[datei];
    if (!namen) { console.log(`  ${datei.padEnd(26)} ⚠ keine Leitkonstante hinterlegt — Pruefung unvollstaendig`); continue; }
    let zeileOk = true;
    const teile = namen.map(n => {
        const t = probe(`typeof ${n}`);
        if (t === 'undefined' || String(t).startsWith('FEHLER')) { fehlend++; zeileOk = false; return `${n}=FEHLT`; }
        const groesse = probe(`(()=>{try{return Object.keys(${n}).length}catch(e){return '?'}})()`);
        return `${n}(${groesse})`;
    });
    console.log(`  ${zeileOk ? '✓' : '✗'} ${datei.padEnd(26)} ${teile.join('  ')}`);
}

console.log('\nZUGRIFFS-FUNKTIONEN');
const fehlFn = FUNKTIONEN.filter(f => probe(`typeof ${f}`) !== 'function');
console.log('  ' + FUNKTIONEN.map(f => (probe(`typeof ${f}`) === 'function' ? '✓ ' : '✗ ') + f).join('   '));

const ok = fehlend === 0 && !fehlMv() && fehlFn.length === 0;
function fehlMv() { return fehltMv.length > 0 || zuvielMv.length > 0; }
console.log(`\n${ok ? '✅ Test und Spiel sind synchron.' : '❌ NICHT synchron — siehe ✗ oben.'}`);
process.exit(ok ? 0 : 1);
