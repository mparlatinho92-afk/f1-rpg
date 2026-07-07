// ============================================================================
// Paket G – Driver-Market-Realismus-Korpus (Fable, 2026-07-07)
// Aufruf: node derive-market-corpus.js   (aus fable-deliverables/paketG-driver-market/)
// Schreibt: whitelist-rookies-top3.json, expectation-curve.json, corpus-raw.json
// Datenbasis: F1DB (f1db-json-splitted/), komplette Saisons 1950–2025 (2026 verworfen).
//
// D1: Rookies, die bei einem Team debütierten, das in der VORSAISON Top-3 der
//     Konstrukteurs-WM war (Grenzfälle P4–P5 separat; vor 1958 Pseudo-Rang aus
//     aggregierten Punkten, geflaggt). Indy-500-Starts begründen kein Debüt.
// D2: Amtierende WDC → Auto-Qualität in N+1 (Top-3 / Mittelfeld / Backmarker).
// D3: Erwartungskurve je Konstrukteurs-WM-Rang (1990–2025): Median/P25/P75 der
//     klassifizierten Zielpositionen + Ø Punkte/Start (MODERNES 25er-Schema auf
//     alle Starts inkl. DNF=0 → era-unabhängig vergleichbar) + Teamkollegen-Delta.
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const J = f => require(path.join(ROOT, 'f1db-json-splitted', 'f1db-' + f + '.json'));

const races = J('races'), results = J('races-race-results'), drivers = J('drivers'),
    constructors = J('constructors'), conStandings = J('seasons-constructor-standings'),
    drvStandings = J('seasons-driver-standings'), chrono = J('constructors-chronology');

const LAST = 2025;
const driverName = new Map(drivers.map(d => [d.id, d.name]));
const conName = new Map(constructors.map(c => [c.id, c.name]));
const indyRaceIds = new Set(races.filter(r => r.grandPrixId && r.grandPrixId.includes('indianapolis')).map(r => r.id));
const roundsPerYear = {};
for (const r of races) if (r.year <= LAST) roundsPerYear[r.year] = Math.max(roundsPerYear[r.year] || 0, r.round);

const rows = results.filter(r => r.year <= LAST && !indyRaceIds.has(r.raceId));

// ── Konstrukteurs-Ränge ──
// ACHTUNG: F1DB-Standings sind je Konstrukteur+MOTOR-Kombi (Lotus-Climax ≠ Lotus-BRM).
// Team-Rang = Punkte aller Kombis eines Konstrukteurs aggregiert, dann re-ranken
// (Tie-Break: beste Kombi-Position). 1950–1957 Pseudo-Rang über Ergebnis-Punkte (geflaggt).
const rankByConYear = new Map();   // 'con|year' -> rank
const teamsPerYear = {};           // year -> Anzahl gewerteter Konstrukteure
{
    const agg = {};                // year -> con -> {pts, bestPos}
    for (const s of conStandings) {
        if (s.year > LAST || s.positionNumber == null) continue;   // EX (McLaren 2007) fällt raus
        const a = (agg[s.year] = agg[s.year] || {});
        const e = (a[s.constructorId] = a[s.constructorId] || { pts: 0, bestPos: 99 });
        e.pts += s.points || 0;
        e.bestPos = Math.min(e.bestPos, s.positionNumber);
    }
    for (const y in agg) {
        const order = Object.entries(agg[y]).sort((a, b) => b[1].pts - a[1].pts || a[1].bestPos - b[1].bestPos);
        order.forEach(([con], i) => rankByConYear.set(con + '|' + y, i + 1));
        teamsPerYear[y] = order.length;
    }
}
for (let y = 1950; y <= 1957; y++) {
    const pts = {};
    for (const r of rows) if (r.year === y) pts[r.constructorId] = (pts[r.constructorId] || 0) + (r.points || 0);
    const order = Object.entries(pts).sort((a, b) => b[1] - a[1]);
    order.forEach(([con], i) => rankByConYear.set(con + '|' + y, i + 1));
    teamsPerYear[y] = order.length;
}

// Chronologie: Kette auflösen (z.B. racing-bulls 2024 ← alphatauri 2023)
function chainMate(conId, year, targetYear) {
    const row = chrono.find(c => c.constructorId === conId && year >= c.yearFrom && year <= (c.yearTo || LAST));
    if (!row) return conId;
    const mate = chrono.find(c => c.parentConstructorId === row.parentConstructorId && targetYear >= c.yearFrom && targetYear <= (c.yearTo || LAST));
    return mate ? mate.constructorId : conId;
}
function rankOf(conId, year) {
    let r = rankByConYear.get(conId + '|' + year);
    if (r == null) r = rankByConYear.get(chainMate(conId, year + 1, year) + '|' + year);   // Rename-Fallback (Aufruf meist mit Debütjahr-1)
    return r == null ? null : r;
}
function chainRoot(conId, year) {
    const row = chrono.find(c => c.constructorId === conId && year >= c.yearFrom && year <= (c.yearTo || LAST));
    return row ? row.parentConstructorId : conId;
}

// ── Fahrer-Basisdaten: Debütjahr, Starts je (Fahrer,Jahr,Team) ──
const firstYear = new Map(), startsByDrvYearCon = new Map(), startsByDrvYear = new Map();
for (const r of rows) {
    if (!firstYear.has(r.driverId) || r.year < firstYear.get(r.driverId)) firstYear.set(r.driverId, r.year);
    const k1 = r.driverId + '|' + r.year + '|' + r.constructorId;
    startsByDrvYearCon.set(k1, (startsByDrvYearCon.get(k1) || 0) + 1);
    const k2 = r.driverId + '|' + r.year;
    startsByDrvYear.set(k2, (startsByDrvYear.get(k2) || 0) + 1);
}
function mainTeam(drvId, year) {
    let best = null, bestN = -1;
    for (const [k, n] of startsByDrvYearCon) {
        const [d, y, c] = k.split('|');
        if (d === drvId && +y === year && n > bestN) { best = c; bestN = n; }
    }
    return best;
}

// ════ D1: Rookie-bei-Top-3-Whitelist ════
// erstes Team der Rookie-Saison (chronologisch) — für "Debüt bei X, dann Y"-Hinweis
const firstTeamOfYear = new Map();   // 'drv|year' -> {con, round}
for (const r of rows) {
    const k = r.driverId + '|' + r.year;
    const cur = firstTeamOfYear.get(k);
    if (!cur || r.round < cur.round) firstTeamOfYear.set(k, { con: r.constructorId, round: r.round });
}
const whitelist = [];
for (const [drv, y0] of firstYear) {
    if (y0 === 1950 || y0 > LAST) continue;             // 1950 = Gründungsjahr, alle "Rookies"
    const team = mainTeam(drv, y0);
    const prevRank = rankOf(team, y0 - 1);
    if (prevRank == null || prevRank > 5) continue;
    const starts = startsByDrvYear.get(drv + '|' + y0) || 0;
    const partial = starts < Math.max(2, Math.round(0.3 * roundsPerYear[y0]));
    const first = firstTeamOfYear.get(drv + '|' + y0).con;
    const notes = [];
    if (partial) notes.push('Teilsaison/Ersatz-Debüt');
    if (first !== team) notes.push('Debüt bei ' + (conName.get(first) || first) + ', Saison-Hauptteam ' + (conName.get(team) || team));
    whitelist.push({
        driver: driverName.get(drv) || drv,
        debutYear: y0,
        team: conName.get(team) || team,
        prevSeasonConstructorRank: prevRank,
        borderline: prevRank > 3,
        preConstructorsEra: y0 <= 1958,
        customerChassisEra: y0 <= 1980,
        starts, seasonRounds: roundsPerYear[y0],
        note: notes.join(' | ')
    });
}
whitelist.sort((a, b) => a.debutYear - b.debutYear || a.prevSeasonConstructorRank - b.prevSeasonConstructorRank);
fs.writeFileSync(path.join(__dirname, 'whitelist-rookies-top3.json'), JSON.stringify(whitelist, null, 1));
const strict = whitelist.filter(w => !w.borderline && !w.preConstructorsEra && !w.note);
console.log(`D1: ${whitelist.length} Fälle gesamt | strikt (Top-3, ab 1959, volle Saison): ${strict.length}`);
for (const w of whitelist.filter(w => !w.preConstructorsEra)) console.log(`  ${w.debutYear} ${w.driver} @ ${w.team} (Vorsaison P${w.prevSeasonConstructorRank})${w.borderline ? ' [P4-P5]' : ''}${w.note ? ' [' + w.note + ']' : ''}`);

// ════ D2: Champion → Auto in N+1 ════
const champs = drvStandings.filter(s => s.positionNumber === 1 && s.year <= LAST - 1).sort((a, b) => a.year - b.year);
const champRows = [];
for (const c of champs) {
    const y = c.year, y1 = y + 1;
    const teamN = mainTeam(c.driverId, y), teamN1 = mainTeam(c.driverId, y1);
    if (!teamN1) {
        champRows.push({ champion: driverName.get(c.driverId), titleYear: y, teamN: conName.get(teamN), teamN1: null, rankN1: null, category: 'nicht angetreten', switched: null, preConstructorsEra: y1 < 1959 });
        continue;
    }
    const rankN1 = rankOf(teamN1, y1);
    const n = teamsPerYear[y1] || 10;
    const midMax = Math.ceil(0.7 * n);
    const category = rankN1 == null ? 'unbekannt' : (rankN1 <= 3 ? 'Top-3' : (rankN1 <= midMax ? 'Mittelfeld' : 'Backmarker'));
    champRows.push({
        champion: driverName.get(c.driverId), titleYear: y,
        teamN: conName.get(teamN), teamN1: conName.get(teamN1), rankN1, teamsN1: n,
        category, switched: chainRoot(teamN, y) !== chainRoot(teamN1, y1),
        preConstructorsEra: y1 < 1959
    });
}
console.log('\nD2: Champion → N+1');
const cats = {};
for (const r of champRows) { cats[r.category] = (cats[r.category] || 0) + 1; if (r.category !== 'Top-3') console.log(`  ${r.titleYear} ${r.champion}: ${r.teamN} → ${r.teamN1 || '—'} (P${r.rankN1 ?? '—'}/${r.teamsN1 ?? '—'}) ${r.category}${r.switched ? ' [Wechsel]' : ''}${r.preConstructorsEra ? ' [vor-1959]' : ''}`); }
console.log('  Verteilung:', JSON.stringify(cats), '| gesamt:', champRows.length);
const switchers = champRows.filter(r => r.switched);
console.log('  Team-Wechsler nach Titel:', switchers.map(r => `${r.titleYear} ${r.champion} (${r.teamN}→${r.teamN1}, P${r.rankN1})`).join('; '));

// ════ D3: Erwartungskurve 1990–2025 ════
const MODERN_PTS = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };
const byRank = {};   // rank -> {pos:[], pts:[], starts, dnf}
const FROM = 1990;
for (const r of rows) {
    if (r.year < FROM) continue;
    const rank = rankByConYear.get(r.constructorId + '|' + r.year);
    if (rank == null) continue;                        // z.B. McLaren 2007 (EX) — ausgeschlossen
    const b = byRank[rank] = byRank[rank] || { pos: [], pts: 0, starts: 0, dnf: 0 };
    b.starts++;
    if (r.positionNumber != null) { b.pos.push(r.positionNumber); b.pts += MODERN_PTS[r.positionNumber] || 0; }
    else b.dnf++;
}
function q(sorted, p) { const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo); }
const curve = [];
for (const rank of Object.keys(byRank).map(Number).sort((a, b) => a - b)) {
    const b = byRank[rank]; b.pos.sort((x, y) => x - y);
    curve.push({
        carRank: rank,
        medianPos: q(b.pos, 0.5), p25: q(b.pos, 0.25), p75: q(b.pos, 0.75),
        avgPoints: +(b.pts / b.starts).toFixed(2),
        finishRate: +(b.pos.length / b.starts).toFixed(3),
        nStarts: b.starts, thin: b.starts < 300
    });
}
console.log('\nD3: Erwartungskurve (1990–2025, klassifizierte Zielpositionen, Punkte = modernes Schema auf alle Starts):');
for (const c of curve) console.log(`  R${String(c.carRank).padStart(2)}: median ${c.medianPos} [${c.p25}–${c.p75}] | ØPkt/Start ${c.avgPoints} | Finish ${(c.finishRate * 100).toFixed(0)}% | n=${c.nStarts}${c.thin ? ' (DÜNN)' : ''}`);

// Teamkollegen-Delta: beide Autos desselben Teams klassifiziert
const byRaceCon = new Map();
for (const r of rows) {
    if (r.year < FROM) continue;
    const k = r.raceId + '|' + r.constructorId;
    (byRaceCon.get(k) || byRaceCon.set(k, []).get(k)).push(r);
}
const deltas = [], deltasByBucket = { 'Top-3': [], 'Mittelfeld': [], 'Backmarker': [] };
for (const [k, arr] of byRaceCon) {
    if (arr.length !== 2) continue;
    const [a, b] = arr;
    if (a.positionNumber == null || b.positionNumber == null) continue;
    const d = Math.abs(a.positionNumber - b.positionNumber);
    deltas.push(d);
    const rank = rankByConYear.get(a.constructorId + '|' + a.year);
    if (rank != null) {
        const n = teamsPerYear[a.year], midMax = Math.ceil(0.7 * n);
        deltasByBucket[rank <= 3 ? 'Top-3' : rank <= midMax ? 'Mittelfeld' : 'Backmarker'].push(d);
    }
}
deltas.sort((a, b) => a - b);
const tmDelta = { median: q(deltas, 0.5), mean: +(deltas.reduce((s, x) => s + x, 0) / deltas.length).toFixed(2), n: deltas.length, buckets: {} };
for (const k in deltasByBucket) { const arr = deltasByBucket[k].sort((a, b) => a - b); tmDelta.buckets[k] = { median: q(arr, 0.5), mean: +(arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(2), n: arr.length }; }
console.log('\nTeamkollegen-Delta (beide klassifiziert):', JSON.stringify(tmDelta));

fs.writeFileSync(path.join(__dirname, 'expectation-curve.json'), JSON.stringify({
    meta: { source: 'F1DB f1db-json-splitted, Saisons ' + FROM + '–' + LAST, positions: 'nur klassifizierte Ergebnisse', points: 'modernes 25-18-15-…-1-Schema auf ALLE Starts (DNF=0), era-unabhängig', generated: '2026-07-07' },
    curve, teammateDelta: tmDelta
}, null, 1));
fs.writeFileSync(path.join(__dirname, 'corpus-raw.json'), JSON.stringify({ champions: champRows }, null, 1));
console.log('\nGeschrieben: whitelist-rookies-top3.json, expectation-curve.json, corpus-raw.json');
