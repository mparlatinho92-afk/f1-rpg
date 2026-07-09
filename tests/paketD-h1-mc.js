/**
 * paketD-h1-mc.js — Neuvalidierung Paket-D HOCH#1 (Backmarker-Überkalibrierung)
 * gegen die AKTUELLE index.html (Car-Ceiling v0.9.14.45 + Paket E).
 *
 * Regressionsanker (Paket D / Roadmap): Neues Spiel 2001, 5 Saisons →
 *   - Minardi 0–4 P/Jahr, Arrows 0–2 P/Jahr
 *   - Titel (WDC & WCC) bei Ferrari/McLaren/Williams
 *   - kein Team-Rang-Sprung >3 Plätze/Jahr
 *   - Backmarker (unteres WM-Drittel) holen praktisch keine Siege; Punkte-Quote realistisch
 *
 * Verwendung: node tests/paketD-h1-mc.js [sims]   (default 12)
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');

const N = parseInt(process.argv[2]) || 12;
const START = 2001, END = 2005;
console.log(`\n═══ Paket-D HOCH#1 Neuvalidierung | ${START}–${END} | ${N} Sims ═══\n`);

const ctx = getContext();

function simulateSeason(c) {
    const races = c.GAME_STATE.races;
    for (let i = 0; i < races.length; i++) {
        const rain = Math.random() < 0.15;
        try {
            if (c.simulateTraining) c.simulateTraining(i);
            c.simulateQualifying(i, rain);
            const r = c.simulateRace(i, rain);
            if (r) c.applyRaceResults(r);
        } catch (_) {}
    }
}
const teamName = id => (ctx.GAME_STATE.teams.find(t => t.id === id) || {}).name || id;
function wccRanked() {
    return Object.entries(ctx.GAME_STATE.teamStandings || {})
        .map(([id, s]) => ({ id, name: teamName(id), points: s.points || 0, wins: s.wins || 0 }))
        .sort((a, b) => b.points - a.points);
}
function findTeamPts(rank, sub) {
    const t = rank.find(x => (x.name || '').toLowerCase().includes(sub));
    return t ? t.points : null;
}

const minardiPts = [], arrowsPts = [];
const minByIdx = [[], [], [], [], []];   // Minardi-Punkte je Saison-Index (0=2001 feste Daten)
const minCsByIdx = [[], [], [], [], []]; // Minardi-carSpeed je Saison-Index
const diagTop3 = [[], [], [], [], []], diagSpread = [[], [], [], [], []], diagMinPace = [[], [], [], [], []];
const wccChamps = {}, wdcChamps = {};
let backmarkerWins = 0, backmarkerTeamSeasons = 0, backmarkerScoringSeasons = 0;
const rankJumps = [];
let maxJump = 0, maxJumpDesc = '';
let okSims = 0, errSims = 0;

for (let sim = 0; sim < N; sim++) {
    try {
        ctx.initFromYear(START);
        let prevRankById = null;
        for (let year = START; year <= END; year++) {
            simulateSeason(ctx);
            const rank = wccRanked();
            const nTeams = rank.length;
            const thirdStart = Math.ceil(nTeams * 0.67);

            // Champions
            const wcc = rank[0];
            if (wcc && wcc.points > 0) wccChamps[wcc.name] = (wccChamps[wcc.name] || 0) + 1;
            const wdc = Object.entries(ctx.GAME_STATE.driverStandings || {})
                .map(([id, s]) => ({ id, points: s.points || 0 })).sort((a, b) => b.points - a.points)[0];
            if (wdc && wdc.points > 0) {
                const dTeam = (ctx.GAME_STATE.drivers.find(d => d.id === wdc.id) || {}).team;
                wdcChamps[teamName(dTeam)] = (wdcChamps[teamName(dTeam)] || 0) + 1;
            }

            // Minardi / Arrows
            const mp = findTeamPts(rank, 'minardi'); if (mp !== null) minardiPts.push(mp);
            const ap = findTeamPts(rank, 'arrows');  if (ap !== null) arrowsPts.push(ap);
            const yi = year - START;
            if (mp !== null && yi < 5) {
                minByIdx[yi].push(mp);
                const mt = ctx.GAME_STATE.teams.find(t => (t.name || '').toLowerCase().includes('minardi'));
                if (mt) {
                    minCsByIdx[yi].push(mt.carSpeed || 0);
                    // Diagnostik: Top-3-carSpeed-Ø + Minardi-Fahrer-Pace-Ø + Feld-Spread
                    const csSorted = ctx.GAME_STATE.teams.map(t => t.carSpeed || 0).sort((a, b) => b - a);
                    const top3 = csSorted.slice(0, 3).reduce((x, y) => x + y, 0) / 3;
                    diagTop3[yi].push(top3);
                    diagSpread[yi].push(csSorted[0] - csSorted[csSorted.length - 1]);
                    const mDrv = ctx.GAME_STATE.drivers.filter(d => d.team === mt.id);
                    if (mDrv.length) diagMinPace[yi].push(mDrv.reduce((x, d) => x + (d.currentPace || d.pace || 0), 0) / mDrv.length);
                }
            }

            // Backmarker (unteres Drittel)
            rank.forEach((t, i) => {
                if (i >= thirdStart) {
                    backmarkerTeamSeasons++;
                    if (t.wins > 0) backmarkerWins++;
                    if (t.points > 0) backmarkerScoringSeasons++;
                }
            });

            // Rang-Sprünge ggü. Vorjahr
            const rankById = {}; rank.forEach((t, i) => { rankById[t.id] = i + 1; });
            if (prevRankById) {
                for (const id in rankById) {
                    if (prevRankById[id] != null) {
                        const jump = Math.abs(rankById[id] - prevRankById[id]);
                        rankJumps.push(jump);
                        if (jump > maxJump) { maxJump = jump; maxJumpDesc = `${teamName(id)} P${prevRankById[id]}→P${rankById[id]} (${year - 1}→${year})`; }
                    }
                }
            }
            prevRankById = rankById;

            if (year >= END) break;
            if (ctx.updateDriverCareerScores) ctx.updateDriverCareerScores();
            if (ctx.updateDriverReputations) ctx.updateDriverReputations();
            if (ctx.processDriverPaceDevelopment) ctx.processDriverPaceDevelopment();
            if (ctx.checkCareerEnds) ctx.checkCareerEnds();
            if (ctx.initReservePool) ctx.initReservePool(year + 1);
            if (ctx._injectNewSeasonDrivers) ctx._injectNewSeasonDrivers(year + 1);
            if (ctx.processTeamChanges) ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        okSims++;
    } catch (e) { errSims++; if (errSims <= 3) console.log('  Fehler:', e.message); }
}

const stat = a => a.length ? { min: Math.min(...a), max: Math.max(...a), avg: (a.reduce((x, y) => x + y, 0) / a.length) } : null;
const fmt = s => s ? `min ${s.min} · Ø ${s.avg.toFixed(1)} · max ${s.max}` : '–';
const top = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ');
const jStat = stat(rankJumps);

console.log(`${okSims}/${N} Sims ok.\n`);
console.log('── BACKMARKER-PUNKTE (Ziel: Minardi 0–4, Arrows 0–2) ──');
console.log(`  Minardi P/Jahr:  ${fmt(stat(minardiPts))}`);
console.log(`  Arrows  P/Jahr:  ${fmt(stat(arrowsPts))}`);
console.log('  Minardi je Saison-Index (0=2001 feste Daten):');
for (let i = 0; i < 5; i++) {
    const ps = stat(minByIdx[i]), cs = stat(minCsByIdx[i]);
    const t3 = stat(diagTop3[i]), sp = stat(diagSpread[i]), mpc = stat(diagMinPace[i]);
    console.log(`    Jahr ${START + i}: Pkt ${fmt(ps)}  |  MinCS ${cs ? cs.avg.toFixed(0) : '–'} · Top3-CS ${t3 ? t3.avg.toFixed(0) : '–'} · Spread ${sp ? sp.avg.toFixed(0) : '–'} · MinFahrerPace ${mpc ? mpc.avg.toFixed(0) : '–'}`);
}
console.log('\n── TITEL (Ziel: Ferrari/McLaren/Williams) ──');
console.log(`  WCC: ${top(wccChamps)}`);
console.log(`  WDC-Team: ${top(wdcChamps)}`);
console.log('\n── BACKMARKER (unteres WM-Drittel) ──');
console.log(`  Team-Saisons: ${backmarkerTeamSeasons}`);
console.log(`  mit Sieg:     ${backmarkerWins}  (${(backmarkerWins / backmarkerTeamSeasons * 100).toFixed(1)}%)  ← Ziel ~0`);
console.log(`  mit Punkten:  ${backmarkerScoringSeasons}  (${(backmarkerScoringSeasons / backmarkerTeamSeasons * 100).toFixed(1)}%)  ← real ~15–25%`);
console.log('\n── TEAM-RANG-VOLATILITÄT (Ziel: Sprünge ≤3) ──');
console.log(`  Rang-Delta/Jahr: ${fmt(jStat)}`);
console.log(`  Sprünge >3: ${rankJumps.filter(j => j > 3).length}/${rankJumps.length}  (${(rankJumps.filter(j => j > 3).length / rankJumps.length * 100).toFixed(1)}%)`);
console.log(`  größter Sprung: ${maxJump}  (${maxJumpDesc})`);
console.log();
