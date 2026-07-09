/**
 * balancing-server.js
 * Starten: node tests/balancing-server.js
 * Dann:    http://localhost:3001
 *
 * Worker-Pool: Beim Start werden N_WORKERS Worker-Threads erzeugt, die den
 * Spielcode einmalig laden und dann für alle kontinuierlichen Simulationen
 * wiederverwendet werden (kein Reload zwischen Requests).
 * → Server-Neustart = einmaliger Load-Cost für alle Worker zusammen.
 *
 * Umgebungsvariable: SIM_WORKERS=4  (default: 4)
 */
'use strict';
const { Worker, isMainThread, parentPort } = require('worker_threads');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const { getContextWithConfig } = require('./sim-core');

const PORT      = 3001;
const DB        = path.join(__dirname, '..', 'f1db-json-splitted');
const N_WORKERS = parseInt(process.env.SIM_WORKERS || '4');

// ── Historical Truth laden ────────────────────────────────────────────────
const truthPath = path.join(__dirname, 'historical_truth.json');
const TRUTH = fs.existsSync(truthPath) ? JSON.parse(fs.readFileSync(truthPath, 'utf8')) : {};

// ── F1DB Echtdaten laden + aufbereiten ────────────────────────────────────
function loadF1DB() {
    try {
        const raceResults  = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races-race-results.json'),      'utf8'));
        const qualiResults = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races-qualifying-results.json'),'utf8'));
        const races        = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races.json'),                   'utf8'));
        const drivers      = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-drivers.json'),                 'utf8'));
        const driverStandingsRaw = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races-driver-standings.json'), 'utf8'));
        const constructors = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-constructors.json'), 'utf8'));
        const constructorStandingsRaw = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-seasons-constructor-standings.json'), 'utf8'));
        return { raceResults, qualiResults, races, drivers, driverStandingsRaw, constructors, constructorStandingsRaw };
    } catch(e) {
        console.warn('[f1db] Laden fehlgeschlagen:', e.message);
        return null;
    }
}

function buildRealData(f1db) {
    if (!f1db) return {};
    const { raceResults, qualiResults, races, drivers, driverStandingsRaw, constructors, constructorStandingsRaw } = f1db;

    const driverNames = {};
    for (const d of drivers) driverNames[d.id] = d.name;

    const raceLookup = {};
    for (const r of races) raceLookup[r.id] = r;

    const racesByYear = {};
    for (const r of races) {
        if (!racesByYear[r.year]) racesByYear[r.year] = [];
        racesByYear[r.year].push(r);
    }
    for (const y of Object.keys(racesByYear))
        racesByYear[y].sort((a, b) => a.round - b.round);

    const wins = {};
    for (const r of raceResults) {
        if (r.positionNumber !== 1 || r.sharedCar) continue;
        if (!wins[r.year]) wins[r.year] = {};
        wins[r.year][r.driverId] = (wins[r.year][r.driverId] || 0) + 1;
    }

    const poles = {};
    for (const q of qualiResults) {
        if (q.positionNumber !== 1) continue;
        const race = raceLookup[q.raceId];
        if (!race || race.circuitId === 'indianapolis') continue;
        if (!poles[q.year]) poles[q.year] = {};
        poles[q.year][q.driverId] = (poles[q.year][q.driverId] || 0) + 1;
    }

    const gridByRace = {};
    for (const r of raceResults) {
        if (!gridByRace[r.year]) gridByRace[r.year] = {};
        if (!gridByRace[r.year][r.raceId]) gridByRace[r.year][r.raceId] = 0;
        gridByRace[r.year][r.raceId]++;
    }
    const gridAvg = {}, gridTotal = {};
    for (const [year, rMap] of Object.entries(gridByRace)) {
        const counts = Object.values(rMap);
        gridAvg[year] = counts.reduce((a,b)=>a+b,0) / counts.length;
        const dSet = new Set(raceResults.filter(r => r.year == year).map(r => r.driverId));
        gridTotal[year] = dSet.size;
    }

    const driverRaceCount = {};
    for (const r of raceResults) {
        const key = `${r.year}:${r.driverId}`;
        driverRaceCount[key] = (driverRaceCount[key] || 0) + 1;
    }
    const privateerAvgPerRace = {};
    for (const [year, yearRaces] of Object.entries(racesByYear)) {
        const raceCount = yearRaces.length;
        if (!raceCount) continue;
        const threshold = Math.max(2, Math.round(raceCount * 0.35));
        let privCount = 0;
        for (const d of drivers) {
            const n = driverRaceCount[`${year}:${d.id}`] || 0;
            if (n > 0 && n <= threshold) privCount += n;
        }
        privateerAvgPerRace[year] = +(privCount / raceCount).toFixed(1);
    }

    const matrix = {};
    for (const [year, yearRaces] of Object.entries(racesByYear)) {
        matrix[year] = yearRaces
            .filter(race => race.circuitId !== 'indianapolis')
            .map(race => {
                const res = raceResults
                    .filter(r => r.raceId === race.id && !r.sharedCar)
                    .sort((a,b) => (a.positionDisplayOrder||99) - (b.positionDisplayOrder||99))
                    .map(r => ({
                        driverId: r.driverId,
                        pos: r.positionNumber,
                        dnf: !!r.reasonRetired
                    }));
                return { round: race.round, name: race.name, circuitId: race.circuitId, results: res };
            });
    }

    const maxRoundPerYear = {};
    for (const r of races) {
        if (!maxRoundPerYear[r.year] || r.round > maxRoundPerYear[r.year])
            maxRoundPerYear[r.year] = r.round;
    }
    const finalStandings = {};
    for (const e of (driverStandingsRaw || [])) {
        if (e.round !== maxRoundPerYear[e.year]) continue;
        if (!finalStandings[e.year]) finalStandings[e.year] = [];
        finalStandings[e.year].push({ driverId: e.driverId, pos: e.positionNumber, pts: e.points });
    }
    for (const y of Object.keys(finalStandings))
        finalStandings[y].sort((a, b) => a.pos - b.pos);

    // Ø Quali-Position pro Fahrer pro Jahr (Indy ausgeschlossen)
    const avgQualiPos = {};
    for (const [year, yearRaces] of Object.entries(racesByYear)) {
        const driverQPos = {};
        for (const race of yearRaces) {
            if (race.circuitId === 'indianapolis') continue;
            const qRes = qualiResults
                .filter(r => r.raceId === race.id && r.positionNumber != null && !r.sharedCar)
                .sort((a, b) => a.positionNumber - b.positionNumber);
            qRes.forEach(r => {
                if (!driverQPos[r.driverId]) driverQPos[r.driverId] = [];
                driverQPos[r.driverId].push(r.positionNumber);
            });
        }
        avgQualiPos[year] = {};
        for (const [dId, positions] of Object.entries(driverQPos)) {
            if (positions.length < 1) continue;
            avgQualiPos[year][dId] = +(positions.reduce((a,b)=>a+b,0) / positions.length).toFixed(1);
        }
    }

    // Konstrukteurs-Endstände: name → { pos, pts } pro Jahr
    const constructorNames = {};
    for (const c of (constructors || [])) constructorNames[c.id] = c.name;
    const finalTeamStandings = {};
    for (const e of (constructorStandingsRaw || [])) {
        if (!finalTeamStandings[e.year]) finalTeamStandings[e.year] = {};
        const name = constructorNames[e.constructorId] || e.constructorId;
        finalTeamStandings[e.year][name] = { pos: e.positionNumber, pts: e.points };
        finalTeamStandings[e.year][e.constructorId] = { pos: e.positionNumber, pts: e.points }; // Fallback per id
    }

    return { wins, poles, gridAvg, gridTotal, privateerAvgPerRace, matrix, driverNames, racesByYear, finalStandings, avgQualiPos, finalTeamStandings };
}

const F1DB = loadF1DB();
const REAL = buildRealData(F1DB);

// ── ID-Auflösung: Sim-ID → f1db-ID über Display-Name ──────────────────────
const _nameToF1db = {};
let   _nameToF1dbBuilt = false;
function resolveToF1dbId(id, displayName) {
    if (!_nameToF1dbBuilt && REAL.driverNames) {
        for (const [fId, fName] of Object.entries(REAL.driverNames))
            _nameToF1db[(fName||'').toLowerCase()] = fId;
        _nameToF1dbBuilt = true;
    }
    if (REAL.driverNames?.[id]) return id;
    const dn = (displayName || id).toLowerCase();
    return _nameToF1db[dn] || id;
}

// ── Eine Saison simulieren ────────────────────────────────────────────────
// skipTraining=true überspringt simulateTraining() → ~15-20% schneller
// collectQuali=true sammelt Quali-Positionen pro Fahrer (alle Rennen)
function simulateSeason(c, year, collectMatrix, skipTraining, collectQuali) {
    const races      = c.GAME_STATE.races;
    const drivers    = c.GAME_STATE.drivers || [];
    const privateers = drivers.filter(d => d.isPrivateer);
    const privateerIds = new Set(privateers.map(d => d.id));

    let totalStarts = 0, totalDNFs = 0;
    let privateerEntries = 0, privateerMax = 0;
    let privateerDNQs = 0, allDNQs = 0;
    const gridSizes = [];
    const poleWinners = {}, raceWinners = {};
    const matrix = collectMatrix ? [] : null;
    const qualiPositions = collectQuali ? {} : null;

    for (let i = 0; i < races.length; i++) {
        const isRain = Math.random() < (c.SIM_CONFIG?.rainProbability ?? 0.15);
        try {
            if (!skipTraining) c.simulateTraining(i);
            const qRes = c.simulateQualifying(i, isRain);
            const rRes = c.simulateRace(i, isRain);
            if (!rRes) continue;
            c.applyRaceResults(rRes);

            const isIndy = races[i].isIndy || (races[i].name && races[i].name.includes('Indianapolis'));
            if (isIndy) continue;

            if (qRes?.results?.[0]) {
                const pid = qRes.results[0].driver;
                poleWinners[pid] = (poleWinners[pid] || 0) + 1;
            }
            if (qRes?.results) {
                gridSizes.push(qRes.results.length);
                for (const r of qRes.results)
                    if (privateerIds.has(r.driver)) privateerEntries++;
            }
            if (qualiPositions && qRes?.results) {
                qRes.results.forEach((r, idx) => {
                    if (!qualiPositions[r.driver]) qualiPositions[r.driver] = [];
                    qualiPositions[r.driver].push(idx + 1);
                });
            }
            privateerMax += privateers.length;

            for (const dnqId of (rRes.dnq || [])) {
                allDNQs++;
                if (privateerIds.has(dnqId)) privateerDNQs++;
            }

            if (rRes.results?.[0]) {
                const wid = rRes.results[0].driver;
                raceWinners[wid] = (raceWinners[wid] || 0) + 1;
            }
            for (const r of rRes.results) {
                totalStarts++;
                if (r.dnf || r.fatal) totalDNFs++;
            }

            if (matrix !== null) {
                const entry = { raceIdx: i, name: races[i].name || `R${i+1}`, driverPositions: {} };
                for (const r of rRes.results)
                    entry.driverPositions[r.driver] = r.dnf ? null : r.position;
                matrix.push(entry);
            }
        } catch(_) {}
    }

    const standings = Object.entries(c.GAME_STATE.driverStandings)
        .map(([id, s]) => ({ id, name: s.name, points: s.points, wins: s.wins, team: s.team }))
        .sort((a, b) => b.points - a.points);

    const teamStandings = Object.entries(c.GAME_STATE.teamStandings)
        .map(([id, s]) => ({ id, name: s.name, points: s.points, wins: s.wins }))
        .sort((a, b) => b.points - a.points);

    const teamNameMap = {};
    for (const t of (c.GAME_STATE.teams || []))
        teamNameMap[t.id] = t.name || t.id;

    const nameMap = {};
    standings.forEach(d => { nameMap[d.id] = d.name; });

    return {
        champion: standings[0] || null,
        championTeam: teamStandings[0] || null,
        standings: standings.slice(0, 10),
        nameMap,
        teamNameMap,
        poleWinners,
        raceWinners,
        dnfRate: totalStarts > 0 ? totalDNFs / totalStarts * 100 : 0,
        avgGridSize: gridSizes.length ? gridSizes.reduce((a,b)=>a+b,0)/gridSizes.length : 0,
        privateerEntryRate: privateerMax > 0 ? privateerEntries / privateerMax : 0,
        privateerDNQShare: allDNQs > 0 ? privateerDNQs / allDNQs : 0,
        privateerPerRace: gridSizes.length > 0
            ? privateerEntries / gridSizes.length : 0,
        matrix,
        qualiPositions,
    };
}

// ── Terminal-Fortschrittsanzeige ──────────────────────────────────────────
function printProgress(label, cur, total) {
    const pct  = total > 0 ? Math.round(cur / total * 100) : 0;
    const filled = Math.round(pct / 5);
    const bar  = '█'.repeat(filled) + '░'.repeat(20 - filled);
    process.stdout.write(`\r  \x1b[36m${label}\x1b[0m  [${bar}] ${String(cur).padStart(String(total).length)}/${total}  ${String(pct).padStart(3)}%   `);
}
function clearProgress() { process.stdout.write('\r' + ' '.repeat(72) + '\r'); }

// ── N Saisons für ein Jahr simulieren (historischer Modus) ────────────────
function runYear(ctx, year, N) {
    const champions = {}, championTeams = {}, poleLeaders = {}, winLeaders = {};
    const dnfRates = [], gridSizes = [], champPoints = [];
    const privEntryRates = [], privDNQShares = [], privPerRace = [];
    const simWins  = {};
    const simPoles = {};

    for (let i = 0; i < N; i++) {
        printProgress(year, i + 1, N);
        try {
            ctx.initFromYear(year);
            const s = simulateSeason(ctx, year);

            if (s.champion) {
                const id = s.champion.id;
                if (!champions[id]) champions[id] = { name: s.champion.name, count: 0 };
                champions[id].count++;
                champPoints.push(s.champion.points);
            }
            if (s.championTeam) {
                const id = s.championTeam.id;
                if (!championTeams[id]) championTeams[id] = { name: s.championTeam.name, count: 0 };
                championTeams[id].count++;
            }
            for (const [id, cnt] of Object.entries(s.poleWinners)) {
                if (!poleLeaders[id]) poleLeaders[id] = { name: s.nameMap[id] || id, count: 0 };
                poleLeaders[id].count += cnt;
                simPoles[id] = (simPoles[id] || 0) + cnt;
            }
            for (const [id, cnt] of Object.entries(s.raceWinners)) {
                if (!winLeaders[id]) winLeaders[id] = { name: s.nameMap[id] || id, count: 0 };
                winLeaders[id].count += cnt;
                simWins[id] = (simWins[id] || 0) + cnt;
            }
            dnfRates.push(s.dnfRate);
            gridSizes.push(s.avgGridSize);
            privEntryRates.push(s.privateerEntryRate);
            privDNQShares.push(s.privateerDNQShare);
            privPerRace.push(s.privateerPerRace);
        } catch(_) {}
    }

    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

    const champList = Object.entries(champions)
        .map(([id,v]) => ({ id, name: v.name, count: v.count, pct: +(v.count/N*100).toFixed(1) }))
        .sort((a,b) => b.count - a.count).slice(0, 8);

    const teamDistrib = Object.entries(championTeams)
        .map(([id,v]) => ({ id, name: v.name, count: v.count, pct: +(v.count/N*100).toFixed(1) }))
        .sort((a,b) => b.count - a.count).slice(0, 5);

    const poleList = Object.entries(poleLeaders)
        .map(([id,v]) => ({ id, name: v.name, count: v.count }))
        .sort((a,b) => b.count - a.count).slice(0, 8);

    const winList = Object.entries(winLeaders)
        .map(([id,v]) => ({ id, name: v.name, count: v.count }))
        .sort((a,b) => b.count - a.count).slice(0, 8);

    const truth     = TRUTH[year] || null;
    const realWins  = REAL.wins?.[year]  || {};
    const realPoles = REAL.poles?.[year] || {};
    const realGridAvg      = REAL.gridAvg?.[year]             ?? null;
    const realGridTotal    = REAL.gridTotal?.[year]           ?? null;
    const realPrivPerRace  = REAL.privateerAvgPerRace?.[year] ?? null;

    const simWinsAvg = {};
    for (const [k, v] of Object.entries(simWins)) {
        const fid = resolveToF1dbId(k, (winLeaders[k] || poleLeaders[k])?.name);
        simWinsAvg[fid] = +((simWinsAvg[fid] || 0) + v / N).toFixed(2);
    }
    const simPolesAvg = {};
    for (const [k, v] of Object.entries(simPoles)) {
        const fid = resolveToF1dbId(k, (winLeaders[k] || poleLeaders[k])?.name);
        simPolesAvg[fid] = +((simPolesAvg[fid] || 0) + v / N).toFixed(2);
    }

    clearProgress();
    const realChamp = truth?.champion || null;
    const realChampEntry = champList.find(c =>
        c.id === realChamp || c.name?.toLowerCase().includes(realChamp?.toLowerCase?.() || '___'));
    const realChampPct = realChampEntry?.pct ?? 0;
    const realityCheck = realChampPct >= 20 ? 'ok' : realChampPct >= 10 ? 'warn' : 'fail';

    return {
        year, N,
        champions: champList, poles: poleList, wins: winList,
        teamDistrib,
        realChamp, realChampPct, realityCheck,
        avgDNFRate:            +avg(dnfRates).toFixed(1),
        avgGridSize:           +avg(gridSizes).toFixed(1),
        avgChampPoints:        +avg(champPoints).toFixed(0),
        avgPrivateerEntryRate: +(avg(privEntryRates)*100).toFixed(1),
        avgPrivateerDNQShare:  +(avg(privDNQShares)*100).toFixed(1),
        avgPrivateerPerRace:   +avg(privPerRace).toFixed(1),
        realGridAvg:           realGridAvg !== null ? +realGridAvg.toFixed(1) : null,
        realGridTotal,
        realPrivPerRace,
        realWins, realPoles,
        simWinsAvg, simPolesAvg,
        truth,
    };
}

// ── Multi-Saison historisch: N Sims pro Jahr unabhängig (initFromYear) ────
function runMultiSeason(ctx, startYear, numSeasons, N) {
    const seasonResults = [];
    for (let y = startYear; y < startYear + numSeasons; y++) {
        const yr = parseInt(y);
        try {
            const r = runYear(ctx, yr, N);
            const numRaces = (REAL.racesByYear?.[yr] || []).filter(rc => rc.circuitId !== 'indianapolis').length || 1;
            const topSimPole = r.poles[0]
                ? { id: r.poles[0].id, name: r.poles[0].name, avgPoles: +(r.simPolesAvg[r.poles[0].id] ?? 0).toFixed(1), pct: +(r.simPolesAvg[r.poles[0].id] / numRaces * 100).toFixed(0) }
                : null;
            const realPolesYear = REAL.poles?.[yr] || {};
            const realPoleEntry = Object.entries(realPolesYear).sort((a,b) => b[1]-a[1])[0];
            const realPoleLeader = realPoleEntry
                ? { id: realPoleEntry[0], name: REAL.driverNames?.[realPoleEntry[0]] || realPoleEntry[0], poles: realPoleEntry[1] }
                : null;
            const realPoleSimAvg = realPoleLeader ? (r.simPolesAvg[realPoleLeader.id] ?? 0) : 0;
            const realPolePct = +(realPoleSimAvg / numRaces * 100).toFixed(0);
            const winsPerTeam = TRUTH[yr]?.winsPerTeam || {};
            const realTopTeamEntry = Object.entries(winsPerTeam).sort((a,b) => b[1]-a[1])[0];
            const realTopTeam = realTopTeamEntry ? { id: realTopTeamEntry[0], wins: realTopTeamEntry[1] } : null;
            seasonResults.push({
                year: yr,
                realChamp: r.realChamp,
                topChamp: r.champions[0] || null,
                realChampPct: r.realChampPct,
                realityCheck: r.realityCheck,
                champDistrib: r.champions.slice(0, 5),
                teamDistrib: r.teamDistrib,
                realTopTeam,
                avgDNFRate: r.avgDNFRate,
                avgGridSize: r.avgGridSize,
                realGridAvg: r.realGridAvg,
                topSimPole, realPoleLeader, realPolePct, numRaces,
            });
        } catch(_) {}
    }
    return { startYear, numSeasons, N, mode: 'historical', seasons: seasonResults };
}

// ── Kontinuierlich: N Runs → Rohdaten (für Worker-Merging) ───────────────
// Gibt { seasonData: { year: { champions, poleLeaders, dnfRates, gridSizes } } } zurück
function runContinuousPartial(ctx, startYear, numSeasons, N, skipTraining) {
    const seasonData = {};
    for (let y = startYear; y < startYear + numSeasons; y++)
        seasonData[y] = { champions: {}, championTeams: {}, poleLeaders: {}, dnfRates: [], gridSizes: [], driverStats: {}, teamStats: {} };

    for (let run = 0; run < N; run++) {
        try {
            ctx.initFromYear(startYear);
            for (let s = 0; s < numSeasons; s++) {
                const year = ctx.GAME_STATE.currentYear;
                const sim  = simulateSeason(ctx, year, false, skipTraining);
                const d    = seasonData[year];
                if (d && sim.champion) {
                    const rawId = sim.champion.id;
                    const id    = resolveToF1dbId(rawId, sim.champion.name);
                    const name  = sim.champion.name;
                    if (!d.champions[id]) d.champions[id] = { name, count: 0 };
                    d.champions[id].count++;
                }
                if (d && sim.championTeam) {
                    const id   = sim.championTeam.id;
                    const name = sim.championTeam.name;
                    if (!d.championTeams[id]) d.championTeams[id] = { name, count: 0 };
                    d.championTeams[id].count++;
                }
                if (d) {
                    d.dnfRates.push(sim.dnfRate);
                    d.gridSizes.push(sim.avgGridSize);
                    // Pole-Winners akkumulieren
                    for (const [rawId, cnt] of Object.entries(sim.poleWinners || {})) {
                        const id   = resolveToF1dbId(rawId, sim.nameMap?.[rawId]);
                        const name = sim.nameMap?.[rawId] || rawId;
                        if (!d.poleLeaders[id]) d.poleLeaders[id] = { name, count: 0 };
                        d.poleLeaders[id].count += cnt;
                    }
                    // Alle Fahrer-Standings akkumulieren (für Fahrer-Entwicklung aus Sim)
                    const allStandings = Object.entries(ctx.GAME_STATE.driverStandings)
                        .map(([id, s]) => ({ id, name: s.name, points: s.points, team: s.team }))
                        .sort((a, b) => b.points - a.points);
                    const teamNameMap = {};
                    for (const t of (ctx.GAME_STATE.teams || [])) teamNameMap[t.id] = t.name || t.id;
                    for (let rank = 0; rank < allStandings.length; rank++) {
                        const dr  = allStandings[rank];
                        const dId = resolveToF1dbId(dr.id, dr.name);
                        if (!d.driverStats[dId]) d.driverStats[dId] = { name: dr.name, posArr: [], ptsArr: [], teamCounts: {} };
                        d.driverStats[dId].posArr.push(rank + 1);
                        d.driverStats[dId].ptsArr.push(dr.points);
                        const tm = teamNameMap[dr.team] || dr.team || '?';
                        d.driverStats[dId].teamCounts[tm] = (d.driverStats[dId].teamCounts[tm] || 0) + 1;
                    }
                    // Team-Standings akkumulieren
                    const allTeams = Object.entries(ctx.GAME_STATE.teamStandings)
                        .map(([id, s]) => ({ id, name: s.name, points: s.points }))
                        .sort((a, b) => b.points - a.points);
                    for (let rank = 0; rank < allTeams.length; rank++) {
                        const tm = allTeams[rank];
                        if (!d.teamStats[tm.id]) d.teamStats[tm.id] = { name: tm.name, posArr: [], ptsArr: [] };
                        d.teamStats[tm.id].posArr.push(rank + 1);
                        d.teamStats[tm.id].ptsArr.push(tm.points);
                    }
                }
                if (s < numSeasons - 1) {
                    try { ctx.startNewSeason(); } catch(_) { break; }
                }
            }
        } catch(_) {}
    }

    return { seasonData };
}

// ── Rohdaten mehrerer Worker zusammenführen → finale Multi-Saison-Antwort ─
function aggregateContinuous(startYear, numSeasons, N_total, partials, seasonDataRef, paceRatingsRef) {
    const merged = {};
    for (let y = startYear; y < startYear + numSeasons; y++)
        merged[y] = { champions: {}, championTeams: {}, poleLeaders: {}, dnfRates: [], gridSizes: [], driverStats: {}, teamStats: {} };

    for (const partial of partials) {
        for (const [yStr, d] of Object.entries(partial.seasonData)) {
            const y = parseInt(yStr);
            if (!merged[y]) continue;
            for (const [id, v] of Object.entries(d.champions)) {
                if (!merged[y].champions[id]) merged[y].champions[id] = { name: v.name, count: 0 };
                merged[y].champions[id].count += v.count;
            }
            for (const [id, v] of Object.entries(d.championTeams || {})) {
                if (!merged[y].championTeams[id]) merged[y].championTeams[id] = { name: v.name, count: 0 };
                merged[y].championTeams[id].count += v.count;
            }
            for (const [id, v] of Object.entries(d.poleLeaders || {})) {
                if (!merged[y].poleLeaders[id]) merged[y].poleLeaders[id] = { name: v.name, count: 0 };
                merged[y].poleLeaders[id].count += v.count;
            }
            merged[y].dnfRates.push(...d.dnfRates);
            merged[y].gridSizes.push(...d.gridSizes);
            for (const [dId, v] of Object.entries(d.driverStats || {})) {
                if (!merged[y].driverStats[dId]) merged[y].driverStats[dId] = { name: v.name, posArr: [], ptsArr: [], teamCounts: {} };
                merged[y].driverStats[dId].posArr.push(...v.posArr);
                merged[y].driverStats[dId].ptsArr.push(...v.ptsArr);
                for (const [tm, cnt] of Object.entries(v.teamCounts || {})) {
                    merged[y].driverStats[dId].teamCounts[tm] = (merged[y].driverStats[dId].teamCounts[tm] || 0) + cnt;
                }
            }
            for (const [tId, v] of Object.entries(d.teamStats || {})) {
                if (!merged[y].teamStats[tId]) merged[y].teamStats[tId] = { name: v.name, posArr: [], ptsArr: [] };
                merged[y].teamStats[tId].posArr.push(...v.posArr);
                merged[y].teamStats[tId].ptsArr.push(...v.ptsArr);
            }
        }
    }

    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const seasons = [];
    for (let y = startYear; y < startYear + numSeasons; y++) {
        const d = merged[y];
        if (!d) continue;
        const champList = Object.entries(d.champions)
            .map(([id, v]) => ({ id, name: v.name, count: v.count, pct: +(v.count/N_total*100).toFixed(1) }))
            .sort((a,b) => b.count - a.count).slice(0, 6);
        const truth = TRUTH[y] || null;
        const realChamp = truth?.champion || null;
        const realEntry = champList.find(c => c.id === realChamp ||
            c.name?.toLowerCase().includes((realChamp||'').replace(/-/g,' ')));
        const realChampPct = realEntry?.pct ?? 0;
        const realityCheck = realChampPct >= 20 ? 'ok' : realChampPct >= 10 ? 'warn' : 'fail';

        // Quali/Pole-Leader
        const numRaces = (REAL.racesByYear?.[y] || []).filter(r => r.circuitId !== 'indianapolis').length || 1;
        const poleList = Object.entries(d.poleLeaders)
            .map(([id, v]) => ({ id, name: v.name, avgPoles: +(v.count / N_total).toFixed(1), pct: +(v.count / N_total / numRaces * 100).toFixed(0) }))
            .sort((a, b) => b.avgPoles - a.avgPoles);
        const topSimPole = poleList[0] || null;
        const realPolesYear = REAL.poles?.[y] || {};
        const realPoleEntry = Object.entries(realPolesYear).sort((a,b) => b[1]-a[1])[0];
        const realPoleLeader = realPoleEntry
            ? { id: realPoleEntry[0], name: REAL.driverNames?.[realPoleEntry[0]] || realPoleEntry[0], poles: realPoleEntry[1] }
            : null;
        const realPoleSimEntry = realPoleLeader ? poleList.find(p => p.id === realPoleLeader.id) : null;
        const realPolePct = realPoleSimEntry?.pct ?? 0;

        const teamDistrib = Object.entries(d.championTeams)
            .map(([id, v]) => ({ id, name: v.name, count: v.count, pct: +(v.count/N_total*100).toFixed(1) }))
            .sort((a,b) => b.count - a.count).slice(0, 5);

        // Fahrer-Daten für Extraktion (Ø Pos/Pkt + häufigstes Team + simPace)
        const driverData = {};
        for (const [dId, v] of Object.entries(d.driverStats || {})) {
            const topTeam = Object.entries(v.teamCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || '?';
            const _pr = paceRatingsRef?.[dId]?.[String(y)];
            driverData[dId] = {
                name: v.name,
                avgPos: v.posArr.length ? +(v.posArr.reduce((a,b)=>a+b,0)/v.posArr.length).toFixed(1) : null,
                avgPts: v.ptsArr.length ? +(v.ptsArr.reduce((a,b)=>a+b,0)/v.ptsArr.length).toFixed(1) : null,
                topTeam, appearances: v.posArr.length,
                simPace: _pr ? _pr[0] : null
            };
        }
        // Team-Daten für Extraktion
        const teamData = {};
        for (const [tId, v] of Object.entries(d.teamStats || {})) {
            teamData[tId] = {
                name: v.name,
                avgPos: v.posArr.length ? +(v.posArr.reduce((a,b)=>a+b,0)/v.posArr.length).toFixed(1) : null,
                avgPts: v.ptsArr.length ? +(v.ptsArr.reduce((a,b)=>a+b,0)/v.ptsArr.length).toFixed(1) : null,
                appearances: v.posArr.length
            };
        }
        // Echte Fahrer-Standings für Vergleich
        const realStandings = (REAL.finalStandings?.[y] || []).slice(0, 30).map(e => ({
            driverId: e.driverId, name: REAL.driverNames?.[e.driverId] || e.driverId, pos: e.pos, pts: e.pts
        }));

        // SEASON_DATA carSpeeds als Referenz (roh, vor Remapping) – id → carSpeed
        const sdTeamSpeeds = {};
        const _sdY = (seasonDataRef?.[String(y)] || seasonDataRef?.[y]);
        if (_sdY?.t) for (const t of _sdY.t) {
            sdTeamSpeeds[t[0]] = t[3]; // by ID (z.B. "FER") – zuverlässig
            sdTeamSpeeds[t[1]] = t[3]; // by Name – Fallback
        }

        const realTeamStandings = REAL.finalTeamStandings?.[y] || {};
        seasons.push({
            year: y, realChamp, topChamp: champList[0] || null,
            realChampPct, realityCheck, champDistrib: champList,
            teamDistrib, driverData, teamData, realStandings,
            avgDNFRate:  +avg(d.dnfRates).toFixed(1),
            avgGridSize: +avg(d.gridSizes).toFixed(1),
            realGridAvg: REAL.gridAvg?.[y] ?? null,
            topSimPole, realPoleLeader, realPolePct, numRaces,
            sdTeamSpeeds, realTeamStandings,
        });
    }

    // Alle Fahrer-/Team-Namen aggregieren (für Autocomplete)
    // Seasons sind chronologisch → letzter Name gewinnt (z.B. Jaguar→Red Bull, BAR→Honda→Brawn)
    const allDriverNames = {}, allTeamNames = {};
    for (const s of seasons) {
        for (const [id, v] of Object.entries(s.driverData || {})) allDriverNames[id] = v.name;
        for (const [id, v] of Object.entries(s.teamData   || {})) allTeamNames[id]  = v.name;
    }
    return { startYear, numSeasons, N: N_total, mode: 'continuous', seasons, allDriverNames, allTeamNames };
}

// ── Fahrer-Entwicklung: Fahrer über mehrere Jahre tracken ─────────────────
function runDriverDev(ctx, driverQuery, startYear, numSeasons, N) {
    const q = driverQuery.toLowerCase().trim();
    const seasons = [];

    for (let y = startYear; y < startYear + numSeasons; y++) {
        const yr = parseInt(y);
        let found = false;
        const posArr = [], ptsArr = [], teamCounts = {};
        let driverName = null;
        let simPace = null; // currentPace aus GAME_STATE (Saison-Startwert)

        for (let i = 0; i < N; i++) {
            printProgress(`${q} ${yr}`, i + 1, N);
            try {
                ctx.initFromYear(yr);
                // currentPace einmalig aus GAME_STATE lesen (vor Sim, deterministisch)
                if (simPace === null) {
                    const _dr = (ctx.GAME_STATE.drivers || []).find(d =>
                        d.id?.toLowerCase().includes(q) ||
                        (d.name || '').toLowerCase().includes(q));
                    if (_dr) simPace = _dr.currentPace ?? null;
                }
                simulateSeason(ctx, yr);

                // Alle Fahrer aus vollständigen Standings (nicht nur Top 10)
                const allStandings = Object.entries(ctx.GAME_STATE.driverStandings)
                    .map(([id, s]) => ({ id, name: s.name, points: s.points, team: s.team }))
                    .sort((a, b) => b.points - a.points);
                const match = allStandings.find(d =>
                    d.id.includes(q) || (d.name || '').toLowerCase().includes(q)
                );
                if (!match) continue;
                found = true;
                driverName = match.name;
                const pos = allStandings.findIndex(d => d.id === match.id) + 1;
                posArr.push(pos);
                ptsArr.push(match.points);
                const teamNameMap = {};
                for (const t of (ctx.GAME_STATE.teams || [])) teamNameMap[t.id] = t.name || t.id;
                const teamName = teamNameMap[match.team] || match.team || '?';
                teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
            } catch(_) {}
        }

        if (!found) {
            seasons.push({ year: yr, present: false });
            continue;
        }

        const avgPos = posArr.length ? +(posArr.reduce((a,b)=>a+b,0)/posArr.length).toFixed(1) : null;
        const avgPts = ptsArr.length ? +(ptsArr.reduce((a,b)=>a+b,0)/ptsArr.length).toFixed(1) : null;
        const topTeam = Object.entries(teamCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || '?';
        const realChamp = TRUTH[yr]?.champion || null;
        const isChamp = realChamp && realChamp.includes(q);

        clearProgress();
        const realEntry = (REAL.finalStandings?.[yr] || []).find(e => {
            const eName = (REAL.driverNames[e.driverId] || '').toLowerCase();
            return e.driverId.includes(q) || eName.includes(q);
        });
        const realPos = realEntry?.pos ?? null;
        const realPts = realEntry?.pts ?? null;
        const deltaPos = avgPos !== null && realPos !== null ? +(avgPos - realPos).toFixed(1) : null;
        const deltaPts = avgPts !== null && realPts !== null ? +(avgPts - realPts).toFixed(1) : null;

        seasons.push({ year: yr, present: true, driverName, avgPos, avgPts, team: topTeam,
                       appearances: posArr.length, isChamp, realPos, realPts, deltaPos, deltaPts, realPace: simPace });
    }

    return { driverQuery, startYear, numSeasons, N, seasons };
}

// ── Ausreißer: Fahrer mit größter Sim-vs-Real-Abweichung ─────────────────
function runOutliers(ctx, years, N) {
    const entries = [];

    for (const yr of years) {
        const year = parseInt(yr);
        const realStandings = REAL.finalStandings?.[year] || [];
        if (!realStandings.length) continue;

        const numRaces = (REAL.racesByYear?.[year] || [])
            .filter(r => r.circuitId !== 'indianapolis').length;

        // Akkumulate pos/pts/qualiPos pro Sim-Driver-ID
        const posMap = {}, ptsMap = {}, qualiPosMap = {}, nameMap2 = {};

        for (let i = 0; i < N; i++) {
            printProgress(`Ausreißer ${year}`, i + 1, N);
            try {
                ctx.initFromYear(year);
                const sim = simulateSeason(ctx, year, false, false, true);

                const standings = Object.entries(ctx.GAME_STATE.driverStandings)
                    .map(([id, s]) => ({ id, name: s.name, points: s.points }))
                    .sort((a, b) => b.points - a.points);

                standings.forEach((d, idx) => {
                    if (!posMap[d.id]) { posMap[d.id] = []; ptsMap[d.id] = []; }
                    posMap[d.id].push(idx + 1);
                    ptsMap[d.id].push(d.points);
                    nameMap2[d.id] = d.name;
                });

                // Quali-Positionen aggregieren (Ø über alle Rennen dieser Sim)
                if (sim.qualiPositions) {
                    for (const [dId, positions] of Object.entries(sim.qualiPositions)) {
                        if (!qualiPosMap[dId]) qualiPosMap[dId] = [];
                        const avgQ = positions.reduce((a, b) => a + b, 0) / positions.length;
                        qualiPosMap[dId].push(avgQ);
                    }
                }
            } catch(_) {}
        }

        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const minAppearances = Math.max(1, Math.round(N * 0.3));

        for (const realEntry of realStandings) {
            const realId = realEntry.driverId;
            const realName = (REAL.driverNames?.[realId] || realId).toLowerCase();

            // Match Sim-ID → Real-ID via direkter ID oder Name
            let simId = null;
            if (posMap[realId] && posMap[realId].length >= minAppearances) {
                simId = realId;
            } else {
                for (const [sid, sname] of Object.entries(nameMap2)) {
                    if ((sname || '').toLowerCase() === realName) { simId = sid; break; }
                }
            }
            if (!simId || !posMap[simId] || posMap[simId].length < minAppearances) continue;

            const avgPos          = +(avg(posMap[simId])).toFixed(1);
            const avgPts          = +(avg(ptsMap[simId])).toFixed(1);
            const realPos         = realEntry.pos;
            const realPts         = realEntry.pts;
            const deltaPos        = +(avgPos - realPos).toFixed(1);
            const deltaPts        = +(avgPts - realPts).toFixed(1);
            const avgPtsPerRace   = numRaces > 0 ? +(avgPts  / numRaces).toFixed(2) : null;
            const realPtsPerRace  = numRaces > 0 ? +(realPts / numRaces).toFixed(2) : null;
            const deltaPtsPerRace = (avgPtsPerRace !== null && realPtsPerRace !== null)
                ? +(avgPtsPerRace - realPtsPerRace).toFixed(2) : null;

            // Quali-Positionen
            const avgSimQPos  = qualiPosMap[simId]?.length
                ? +(avg(qualiPosMap[simId])).toFixed(1) : null;
            const realQPos    = REAL.avgQualiPos?.[year]?.[resolveToF1dbId(simId, nameMap2[simId])] ?? null;
            const deltaQPos   = (avgSimQPos !== null && realQPos !== null)
                ? +(avgSimQPos - realQPos).toFixed(1) : null;

            entries.push({
                driverId: simId,
                name: nameMap2[simId] || REAL.driverNames?.[realId] || realId,
                year, avgPos, realPos, deltaPos,
                avgPts, realPts, deltaPts,
                numRaces, avgPtsPerRace, realPtsPerRace, deltaPtsPerRace,
                avgSimQPos, realQPos, deltaQPos,
                appearances: posMap[simId].length,
            });
        }
        clearProgress();
    }

    return { years, N, entries };
}

// ── Saisonmatrix: race-by-race Positionen, Sim vs. Real ──────────────────
function runSeasonMatrix(ctx, year, N) {
    ctx.initFromYear(year);
    const races = ctx.GAME_STATE.races.filter(r => !r.isIndy && !(r.name || '').includes('Indianapolis'));
    const raceNames = races.map(r => r.name || r.circuitId || `R${r.round || ''}`);

    const simData = {};
    const nameMap = {};

    for (let i = 0; i < N; i++) {
        printProgress(`Matrix ${year}`, i + 1, N);
        try {
            ctx.initFromYear(year);
            const s = simulateSeason(ctx, year, true);
            Object.assign(nameMap, s.nameMap);
            if (!s.matrix) continue;
            for (const entry of s.matrix) {
                const ri = entry.raceIdx;
                if (!simData[ri]) simData[ri] = {};
                for (const [dId, pos] of Object.entries(entry.driverPositions)) {
                    if (!simData[ri][dId]) simData[ri][dId] = { sum: 0, count: 0, dnfs: 0 };
                    if (pos === null) simData[ri][dId].dnfs++;
                    else { simData[ri][dId].sum += pos; simData[ri][dId].count++; }
                }
            }
        } catch(_) {}
    }
    clearProgress();

    const simMatrix = {};
    for (const [ri, drivers] of Object.entries(simData)) {
        simMatrix[ri] = {};
        for (const [dId, d] of Object.entries(drivers)) {
            simMatrix[ri][dId] = {
                avg: d.count > 0 ? +(d.sum / d.count).toFixed(1) : null,
                dnfPct: +((d.dnfs / N) * 100).toFixed(0),
                appPct: +(((d.count + d.dnfs) / N) * 100).toFixed(0),
            };
        }
    }

    const driverScore = {};
    for (const rDrivers of Object.values(simMatrix)) {
        for (const [dId, d] of Object.entries(rDrivers)) {
            if (d.avg !== null) {
                if (!driverScore[dId]) driverScore[dId] = { sum: 0, count: 0 };
                driverScore[dId].sum += d.avg;
                driverScore[dId].count++;
            }
        }
    }
    const topDriverIds = Object.entries(driverScore)
        .map(([id, d]) => ({ id, avg: d.sum / d.count, count: d.count }))
        .filter(d => d.count >= Math.max(1, races.length * 0.3))
        .sort((a,b) => a.avg - b.avg)
        .slice(0, 16)
        .map(x => x.id);

    const realMatrix = REAL.matrix?.[year] || [];

    return {
        year, N,
        raceNames,
        topDriverIds,
        driverNames: nameMap,
        realDriverNames: REAL.driverNames || {},
        simMatrix,
        realMatrix,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ── WORKER-BRANCH: Läuft in Worker-Threads (nicht im Main-Thread) ─────────
// ═══════════════════════════════════════════════════════════════════════════
if (!isMainThread) {
    // Spielcode einmalig laden (Worker-Startup, danach gecacht)
    try {
        getContextWithConfig({});
        console.log('[worker] Bereit (Spielcode + F1DB geladen)');
    } catch(e) {
        console.error('[worker] Startup-Fehler:', e.message);
    }

    parentPort.on('message', ({ jobId, type, payload }) => {
        try {
            const { config, startYear, numSeasons, N, skipTraining } = payload;
            const ctx = getContextWithConfig(config || {});
            let result;

            if (type === 'continuous') {
                result = runContinuousPartial(ctx, parseInt(startYear), parseInt(numSeasons), parseInt(N), !!skipTraining);
            } else {
                throw new Error(`Unbekannter Job-Typ: ${type}`);
            }

            parentPort.postMessage({ jobId, result });
        } catch(e) {
            parentPort.postMessage({ jobId, error: e.message });
        }
    });

    // Worker-Modul endet hier – kein HTTP-Server, kein Pool
    return;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── MAIN-THREAD: Worker-Pool + HTTP-Server ────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const F1DB_MAIN = F1DB; // nur für Log-Ausgaben
console.log('[f1db] Geladen: ' + Object.keys(REAL.wins||{}).length + ' Jahre mit Echtdaten');

// ── Worker-Pool ───────────────────────────────────────────────────────────
const _workers = [];
const _pendingJobs = new Map();  // jobId → { resolve, reject }
let _jobCounter     = 0;
let _roundRobin     = 0;

function initWorkerPool() {
    const actualWorkers = Math.min(N_WORKERS, require('os').cpus().length);
    for (let i = 0; i < actualWorkers; i++) {
        const w = new Worker(__filename);  // lädt diese Datei – nimmt Worker-Branch
        w.on('message', ({ jobId, result, error }) => {
            const job = _pendingJobs.get(jobId);
            if (!job) return;
            _pendingJobs.delete(jobId);
            if (error) job.reject(new Error(error));
            else job.resolve(result);
        });
        w.on('error', e => console.error(`[pool] Worker-Fehler: ${e.message}`));
        w.on('exit', code => {
            if (code !== 0) console.error(`[pool] Worker beendet mit Code ${code}`);
        });
        _workers.push(w);
    }
    console.log(`[pool] ${actualWorkers} Worker gestartet (laden Spielcode im Hintergrund)`);
}

function dispatchToWorker(type, payload) {
    return new Promise((resolve, reject) => {
        const jobId = ++_jobCounter;
        _pendingJobs.set(jobId, { resolve, reject });
        const worker = _workers[_roundRobin % _workers.length];
        _roundRobin++;
        worker.postMessage({ jobId, type, payload });
    });
}

// N Runs gleichmäßig auf alle Worker verteilen, Ergebnisse zusammenführen
async function runContinuousWithWorkers(startYear, numSeasons, N, config, skipTraining) {
    const W = _workers.length;
    const baseN = Math.floor(N / W);
    const extra = N % W;
    const jobs = [];

    for (let i = 0; i < W; i++) {
        const workerN = baseN + (i < extra ? 1 : 0);
        if (workerN <= 0) continue;
        jobs.push(dispatchToWorker('continuous', { config, startYear, numSeasons, N: workerN, skipTraining }));
    }

    const partials = await Promise.all(jobs);
    const _ctx = getContextWithConfig({});
    return aggregateContinuous(parseInt(startYear), parseInt(numSeasons), N, partials, _ctx.SEASON_DATA, _ctx.PACE_RATINGS);
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────
function readBody(req) {
    return new Promise(resolve => {
        let body = '';
        req.on('data', d => { body += d; });
        req.on('end', () => resolve(body));
    });
}

function sendJSON(res, data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const json = JSON.stringify(data, (k, v) => v === undefined ? null : v);
    res.end(json);
}

function sendError(res, msg) {
    console.error('[sim] Fehler:', msg);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: msg }));
}

// ── HTTP-Server ───────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {

    // Static: balancing.html
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        const html = fs.readFileSync(path.join(__dirname, 'balancing.html'), 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    }

    if (req.method !== 'POST') { res.writeHead(404); res.end('Not found'); return; }

    let body;
    try { body = await readBody(req); } catch(e) { sendError(res, e.message); return; }

    // ── POST /simulate (Einzelsaison, N Jahre) ──────────────────────────
    if (req.url === '/simulate') {
        try {
            const { years, N, config } = JSON.parse(body);
            const ctx = getContextWithConfig(config || {});
            const results = [];
            for (const year of years) {
                console.log(`[sim] Jahr ${year}, N=${N}...`);
                results.push(runYear(ctx, parseInt(year), parseInt(N)));
            }
            sendJSON(res, results);
        } catch(e) { sendError(res, e.message); }
        return;
    }

    // ── POST /simulate-multiseason ──────────────────────────────────────
    if (req.url === '/simulate-multiseason') {
        try {
            const { startYear, numSeasons, N, config, mode, skipTraining } = JSON.parse(body);
            console.log(`[sim] Multi-Saison ${startYear}–${parseInt(startYear)+parseInt(numSeasons)-1}, N=${N}, Modus=${mode||'historical'}${skipTraining?' +skipTraining':''}...`);
            let result;
            if (mode === 'continuous') {
                result = await runContinuousWithWorkers(
                    parseInt(startYear), parseInt(numSeasons), parseInt(N),
                    config || {}, !!skipTraining
                );
            } else {
                const ctx = getContextWithConfig(config || {});
                result = runMultiSeason(ctx, parseInt(startYear), parseInt(numSeasons), parseInt(N));
            }
            sendJSON(res, result);
        } catch(e) { sendError(res, e.message); }
        return;
    }

    // ── POST /simulate-driver ───────────────────────────────────────────
    if (req.url === '/simulate-driver') {
        try {
            const { driverQuery, startYear, numSeasons, N, config } = JSON.parse(body);
            const ctx = getContextWithConfig(config || {});
            console.log(`[sim] Fahrer "${driverQuery}" ${startYear}–${parseInt(startYear)+parseInt(numSeasons)-1}, N=${N}...`);
            const result = runDriverDev(ctx, driverQuery, parseInt(startYear), parseInt(numSeasons), parseInt(N));
            sendJSON(res, result);
        } catch(e) { sendError(res, e.message); }
        return;
    }

    // ── POST /season-matrix ─────────────────────────────────────────────
    if (req.url === '/season-matrix') {
        try {
            const { year, N, config } = JSON.parse(body);
            const ctx = getContextWithConfig(config || {});
            console.log(`[sim] Saisonmatrix ${year}, N=${N}...`);
            const result = runSeasonMatrix(ctx, parseInt(year), parseInt(N));
            sendJSON(res, result);
        } catch(e) { sendError(res, e.message); }
        return;
    }

    // ── POST /simulate-outliers ─────────────────────────────────────────
    if (req.url === '/simulate-outliers') {
        try {
            const { years, N, config } = JSON.parse(body);
            const ctx = getContextWithConfig(config || {});
            console.log(`[sim] Ausreißer: ${years.length} Jahr(e), N=${N}…`);
            const result = runOutliers(ctx, years, parseInt(N));
            sendJSON(res, result);
        } catch(e) { sendError(res, e.message); }
        return;
    }

    // ── POST /save-config ───────────────────────────────────────────────
    if (req.url === '/save-config') {
        try {
            const savePath = path.join(__dirname, 'sim-config-result.json');
            fs.writeFileSync(savePath, body, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ saved: savePath }));
        } catch(e) { sendError(res, e.message); }
        return;
    }

    // ── GET /driver-names ───────────────────────────────────────────────
    if (req.url === '/driver-names' && req.method === 'GET') {
        sendJSON(res, REAL.driverNames || {});
        return;
    }

    // ── GET /team-names ─────────────────────────────────────────────────
    if (req.url === '/team-names' && req.method === 'GET') {
        try {
            const _ctx = getContextWithConfig({});
            const teamNames = {};
            for (const [, yr] of Object.entries(_ctx.SEASON_DATA || {})) {
                for (const t of (yr.t || [])) {
                    if (t[0] && t[1]) teamNames[t[0]] = t[1];
                }
            }
            sendJSON(res, teamNames);
        } catch(_) { sendJSON(res, {}); }
        return;
    }

    res.writeHead(404); res.end('Not found');
});

initWorkerPool();

server.listen(PORT, () => {
    console.log(`\n🏎  F1 RPG Balancing-Tool  →  http://localhost:${PORT}\n`);
    console.log(`   Historical Truth: ${Object.keys(TRUTH).length} Jahre`);
    console.log(`   F1DB Echtdaten:   ${Object.keys(REAL.wins||{}).length} Jahre mit Siegen`);
    console.log(`   Worker-Pool:      ${_workers.length} Threads (${_workers.length}× Parallelität für Kontinuierlich)\n`);
});
