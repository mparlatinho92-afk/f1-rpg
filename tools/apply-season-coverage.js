// apply-season-coverage.js — Stufe 1 der Meldelisten-Deckung
//
// ZWEI Eingriffe in data/seasons.js, beide aus F1DB abgeleitet:
//
//   1. MEHRHEITSREGEL — ein Fahrer gehoert zu dem Konstrukteur, bei dem er in
//      dieser Saison die MEISTEN Rennen fuhr. Heute stimmt das bei 116 Fahrer-
//      Saisons nicht: Tim Schenken 1974 steht bei Lotus (1 Rennen) statt bei
//      Trojan (8).
//   2. FEHLENDE KONSTRUKTEURE — 17 Teams zwischen 1952 und 1991 fehlen ganz,
//      weil ihre Fahrer dem jeweils anderen Team zugeschlagen wurden. Ohne
//      Team-Zeile koennen sie nie melden (Trojan: 8 Wagen, Theodore 1981: 15).
//
// NICHT Teil dieses Skripts ist die Konfliktregel (ein Fahrer fuhr 10 Rennen bei
// Ferrari und eines beim Kleinstkonstrukteur — das eine gehoert trotzdem dorthin).
// Sie braucht eine Nebentabelle, weil SEASON_DATA nur EIN Team je Fahrer kennt;
// das ist Stufe 2. 15 Konstrukteur-Saisons haengen daran.
//
// TEXTUELLE, NICHT STRUKTURELLE AENDERUNG: das Skript serialisiert die Datei
// NICHT neu. Es ersetzt gezielt die Team-Id im Fahrer-Eintrag und haengt Team-
// Zeilen an die `t:[...]`-Liste an. Ein Neuschreiben haette 238 KB umformatiert
// und jeden Diff unlesbar gemacht.
//
// Aufruf:  node tools/apply-season-coverage.js          (Trockenlauf)
//          node tools/apply-season-coverage.js --write  (schreibt, mit Backup)
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SEASONS = path.join(ROOT, 'data', 'seasons.js');
const BASE = path.join(ROOT, 'f1db-json-splitted');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
const WRITE = process.argv.includes('--write');

// ── Quellen ─────────────────────────────────────────────────────────────────
let src = fs.readFileSync(SEASONS, 'utf8');
const SD = (() => { const g = {}; new Function('g', 'with(g){' + src + '; g.SD = SEASON_DATA;}')(g); return g.SD; })();

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const cidName = {}, nameToCid = {};
for (const c of J('f1db-constructors.json')) { cidName[c.id] = c.name; nameToCid[norm(c.name)] = c.id; nameToCid[norm(c.fullName)] = c.id; }
const drvName = {};
for (const d of J('f1db-drivers.json')) drvName[d.id] = d.name;

const isF1 = {};
for (const r of J('f1db-races.json')) isF1[`${r.year}_${r.round}`] = r.grandPrixId !== 'indianapolis';

const drvTeams = {}, ctorCars = {};
for (const e of J('f1db-seasons-entrants-drivers.json')) {
    if (e.testDriver) continue;
    let n = 0; for (const rd of (e.rounds || [])) if (isF1[`${e.year}_${rd}`]) n++;
    if (!n) continue;
    ((drvTeams[e.year] = drvTeams[e.year] || {})[e.driverId] = drvTeams[e.year][e.driverId] || {});
    // {n, letzte}: die letzte Runde entscheidet den Gleichstand (s. mehrheit unten)
    const E = (drvTeams[e.year][e.driverId][e.constructorId] =
        drvTeams[e.year][e.driverId][e.constructorId] || { n: 0, letzte: 0 });
    E.n += n;
    for (const rd of (e.rounds || [])) if (isF1[`${e.year}_${rd}`] && rd > E.letzte) E.letzte = rd;
    (ctorCars[e.year] = ctorCars[e.year] || {});
    ctorCars[e.year][e.constructorId] = (ctorCars[e.year][e.constructorId] || 0) + n;
}
const standing = {};
for (const s of J('f1db-seasons-constructor-standings.json'))
    (standing[s.year] = standing[s.year] || {})[s.constructorId] = s;

// MEHRHEIT = meiste Rennen; bei GLEICHSTAND das Team der SPAETEREN Rennen (Saison-Endteam).
// ⚠ DIESELBE Regel steht in tools/build-guest-entries.js — weichen sie voneinander ab,
// klebt der Fahrer beim Gastteam und seine andere Haelfte faellt weg (Carlos Pace 1974).
const mehrheit = t => Object.keys(t).sort((a, b) => t[b].n - t[a].n || t[b].letzte - t[a].letzte || a.localeCompare(b))[0];
const RENAME = { rb: 'racing-bulls' };

// ── Planung je Jahr ─────────────────────────────────────────────────────────
const plan = [];      // {y, neueTeams:[], moves:[]}
for (let y = 1950; y <= 2025; y++) {
    const sd = SD[String(y)];
    if (!sd || !sd.t || !drvTeams[y]) continue;

    // jahres-bewusste Zuordnung (globaler Namensindex verwechselt Lotus/Lotus F1)
    const kand = {};
    for (const c of Object.keys(ctorCars[y])) { kand[norm(cidName[c] || c)] = c; kand[norm(c)] = c; }
    const mapTeam = n => { const k = norm(n); return kand[k] || (RENAME[k] && kand[norm(RENAME[k])]) || nameToCid[k] || null; };

    const cidToTid = {};                       // constructorId -> Template-Team-Id
    sd.t.forEach(t => { const c = mapTeam(t[1]); if (c) cidToTid[c] = t[0]; });
    const belegteTid = new Set(sd.t.map(t => t[0]));

    // 1. fehlende Konstrukteure
    const fehlend = Object.keys(ctorCars[y]).filter(c => ctorCars[y][c] > 0 && !cidToTid[c]);
    const paces = sd.t.map(t => t[3]).filter(v => typeof v === 'number');
    const minPace = paces.length ? Math.min(...paces) : 70;
    const minTeam = sd.t.slice().sort((a, b) => a[3] - b[3])[0] || [null, null, null, 70, 60, 62];

    const neueTeams = [];
    fehlend.sort((a, b) => (ctorCars[y][b] - ctorCars[y][a]));
    fehlend.forEach((c, i) => {
        // Team-Id: drei Buchstaben aus dem Namen, Kollisionen aufloesen
        const clean = (cidName[c] || c).toUpperCase().replace(/[^A-Z]/g, '');
        let tid = clean.slice(0, 3) || 'XXX';
        let k = 0;
        while (belegteTid.has(tid)) { tid = clean.slice(0, 2) + (clean[2 + (++k)] || String(k)); }
        belegteTid.add(tid);
        // Einordnung: wer in der Wertung stand, kommt an seine Position; alle
        // anderen ans Tabellenende. Alle 17 liegen ohnehin unten (bestes: P8).
        const st = (standing[y] || {})[c];
        const pace = st
            ? Math.max(52, Math.round(minPace + Math.max(0, (standing[y] && Object.keys(standing[y]).length || 1) - st.positionNumber)))
            : Math.max(52, minPace - 1 - i);
        neueTeams.push({ cid: c, tid, name: cidName[c] || c,
            zeile: `['${tid}','${(cidName[c] || c).replace(/'/g, "\\'")}','#888888',${pace},${Math.max(50, minTeam[4] - 2)},${Math.max(50, minTeam[5] - 2)}]`,
            wagen: ctorCars[y][c], platz: st ? st.positionNumber : null });
        cidToTid[c] = tid;
    });

    // 2. Fahrer auf ihr Mehrheitsteam umhaengen
    const moves = [];
    const tmplByName = {};
    (sd.d || []).forEach(d => { if (d[1]) tmplByName[d[1].toLowerCase().trim()] = d; });
    for (const dId of Object.keys(drvTeams[y])) {
        const nm = String(drvName[dId] || '').toLowerCase().trim();
        const d = tmplByName[nm];
        if (!d) continue;                        // Fahrer nicht im Template
        const maj = mehrheit(drvTeams[y][dId]);
        const soll = cidToTid[maj];
        if (!soll || soll === d[2]) continue;
        moves.push({ shortId: d[0], name: d[1], von: d[2], nach: soll,
            rennen: drvTeams[y][dId][maj].n, team: cidName[maj] || maj });
    }

    if (neueTeams.length || moves.length) plan.push({ y, neueTeams, moves });
}

// ── Textuelle Anwendung ─────────────────────────────────────────────────────
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let okTeams = 0, okMoves = 0, fehler = [];

for (const p of plan) {
    // Jahres-Zeile isolieren: jedes Jahr steht auf einer eigenen Zeile.
    const re = new RegExp(`^'${p.y}':\\{[\\s\\S]*?$`, 'm');
    const m = src.match(re);
    if (!m) { fehler.push(`${p.y}: Jahreszeile nicht gefunden`); continue; }
    let zeile = m[0];
    const vorher = zeile;

    // a) Team-Zeilen vor dem Ende der t-Liste einfuegen
    for (const t of p.neueTeams) {
        const idx = zeile.indexOf('],d:[') >= 0 ? zeile.indexOf('],d:[') : zeile.indexOf('], d:[');
        if (idx < 0) { fehler.push(`${p.y}: t/d-Grenze nicht gefunden`); continue; }
        zeile = zeile.slice(0, idx) + ',' + t.zeile + zeile.slice(idx);
        okTeams++;
    }

    // b) Team-Id im Fahrer-Eintrag ersetzen — nur beim passenden Fahrer
    for (const mv of p.moves) {
        const rx = new RegExp(`(\\['${esc(mv.shortId)}',\\s*'${esc(mv.name)}',\\s*')${esc(mv.von)}(')`);
        if (!rx.test(zeile)) { fehler.push(`${p.y}: ${mv.name} nicht eindeutig gefunden`); continue; }
        zeile = zeile.replace(rx, `$1${mv.nach}$2`);
        okMoves++;
    }

    if (zeile !== vorher) src = src.replace(vorher, zeile);
}

// ── Bericht ─────────────────────────────────────────────────────────────────
console.log(`\nSTUFE 1 — Mehrheitsregel + fehlende Konstrukteure\n`);
console.log('Jahr │ neue Teams                        │ Fahrer umgehaengt');
console.log('─'.repeat(92));
for (const p of plan) {
    const t = p.neueTeams.map(x => `${x.name}(${x.tid}, ${x.wagen} Wagen${x.platz ? ', P' + x.platz : ''})`).join(' · ') || '—';
    console.log(`${p.y} │ ${t.padEnd(33).slice(0, 33)} │ ${p.moves.length}`);
    p.moves.slice(0, 3).forEach(mv => console.log(`     │ ${' '.repeat(33)} │   ${mv.name} → ${mv.team} (${mv.rennen} Rennen)`));
    if (p.moves.length > 3) console.log(`     │ ${' '.repeat(33)} │   … ${p.moves.length - 3} weitere`);
}
console.log(`\nTeams eingefuegt: ${okTeams} · Fahrer umgehaengt: ${okMoves}`);
if (fehler.length) { console.log(`\n⚠ ${fehler.length} Stellen NICHT angewendet:`); fehler.slice(0, 15).forEach(f => console.log('   ' + f)); }

if (!WRITE) { console.log('\nTrockenlauf — nichts geschrieben. Mit --write anwenden.'); process.exit(0); }
fs.writeFileSync(SEASONS + '.bak', fs.readFileSync(SEASONS));
fs.writeFileSync(SEASONS, src, 'utf8');
console.log(`\ndata/seasons.js geschrieben (Backup: data/seasons.js.bak).`);
