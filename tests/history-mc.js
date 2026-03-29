'use strict';
/**
 * history-mc.js
 * Multi-Saison Monte-Carlo: für jedes Jahr in historical_truth.json
 * werden N Simulationen gefahren (historische Lineups, Elo-Pace).
 * Ausgabe: kompakte Jahres-Tabelle mit Champion-Trefferquote.
 *
 * Aufruf: node tests/history-mc.js [startYear] [endYear] [N=10]
 * Beispiel: node tests/history-mc.js 1950 2024 10
 */

const fs   = require('fs');
const path = require('path');
const { getContext } = require('./sim-core.js');

// ── Argumente ────────────────────────────────────────────────────────────────
const startYear = parseInt(process.argv[2]) || 1950;
const endYear   = parseInt(process.argv[3]) || 2024;
const N         = parseInt(process.argv[4]) || 10;

const TRUTH_FILE = path.join(__dirname, 'historical_truth.json');
if (!fs.existsSync(TRUTH_FILE)) {
    console.error('historical_truth.json fehlt – bitte zuerst: node tests/generate-truth.js');
    process.exit(1);
}
const truth = JSON.parse(fs.readFileSync(TRUTH_FILE, 'utf8'));

// ── Kontext (einmalig laden, teuer) ─────────────────────────────────────────
console.log('Lade Spielkontext …');
const ctx = getContext();
console.log(`Kontext geladen. Simuliere ${startYear}–${endYear}, ${N} Sims/Jahr.\n`);

// ── Hilfsfunktionen (analog monte-carlo.js) ─────────────────────────────────
function resetAndInit(c, y) {
    c.initFromYear(y);
}

/** Simuliert eine Saison, gibt nur Champion + TopTeam zurück. */
function runSeason(c) {
    const races = c.GAME_STATE.races;
    for (let i = 0; i < races.length; i++) {
        const isRain = Math.random() < 0.15;
        try {
            c.simulateTraining(i);
            c.simulateQualifying(i, isRain);
            const result = c.simulateRace(i, isRain);
            if (result) c.applyRaceResults(result);
        } catch (e) { /* Rennen überspringen */ }
    }
}

function getChampion(c) {
    const st = c.GAME_STATE.driverStandings;
    let best = null;
    for (const [id, s] of Object.entries(st)) {
        if (!best || s.points > best.points) best = { id, points: s.points };
    }
    return best;
}

function getTopTeam(c) {
    const st = c.GAME_STATE.teamStandings;
    let best = null;
    for (const [id, s] of Object.entries(st)) {
        if (!best || s.points > best.points) best = { id, points: s.points };
    }
    return best;
}

// ── ANSI-Farben ──────────────────────────────────────────────────────────────
const G  = '\x1b[32m';  // grün
const Y  = '\x1b[33m';  // gelb
const R  = '\x1b[31m';  // rot
const DIM = '\x1b[2m';  // dimmed
const RST = '\x1b[0m';  // reset

function colorPct(pct) {
    const s = `${pct}%`.padStart(4);
    if (pct >= 25) return `${G}${s}${RST}`;
    if (pct >= 10) return `${Y}${s}${RST}`;
    return `${R}${s}${RST}`;
}

// ── Jahre simulieren ─────────────────────────────────────────────────────────
const years = Object.keys(truth)
    .map(Number)
    .filter(y => y >= startYear && y <= endYear)
    .sort((a, b) => a - b);

console.log(`${'Jahr'.padEnd(5)} ${'Real-Champion'.padEnd(24)} ${'Champ%'.padEnd(8)} ${'Real-Team'.padEnd(22)} ${'Team%'.padEnd(8)} Status`);
console.log('─'.repeat(82));

let totalYears = 0, champOk = 0, teamOk = 0;

// Sammle Jahres-Ergebnisse für Zusammenfassung
const summary = [];

for (const year of years) {
    const t = truth[year];
    if (!t || !t.champion) continue;

    // Ermittle realen Konstrukteur-Champion (Team mit meisten Siegen)
    const realTeam = t.winsPerTeam
        ? Object.entries(t.winsPerTeam).sort(([,a],[,b]) => b - a)[0]?.[0]
        : null;

    // Namenslookup: Slug/Name → Game-ID (nach initFromYear)
    // wird nach erstem run gesetzt
    let realChampGameId = null;
    let realTeamGameId  = null;

    function resolveIds() {
        const drivers = ctx.GAME_STATE.drivers || [];
        const teams   = ctx.GAME_STATE.teams   || [];
        if (!realChampGameId && t.championName) {
            const needle = t.championName.toLowerCase();
            const lastName = needle.split(' ').pop();
            let d = drivers.find(d => d.name && d.name.toLowerCase() === needle);
            if (!d) d = drivers.find(d => d.name && d.name.toLowerCase().includes(lastName));
            realChampGameId = d ? d.id : null;
        }
        if (!realTeamGameId && t.championTeamName) {
            const needle = t.championTeamName.toLowerCase();
            let tm = teams.find(t2 => t2.name && t2.name.toLowerCase().includes(needle));
            if (!tm) tm = teams.find(t2 => t2.name && needle.includes(t2.name.toLowerCase()));
            realTeamGameId = tm ? tm.id : null;
        }
    }

    // N Simulationen
    const champCount = {};
    const teamCount  = {};
    let runs = 0;

    process.stdout.write(`  ${year}… `);
    for (let sim = 0; sim < N; sim++) {
        try {
            resetAndInit(ctx, year);
            if (sim === 0) resolveIds();  // IDs einmalig nach erstem initFromYear setzen
            runSeason(ctx);
            const ch = getChampion(ctx);
            const tt = getTopTeam(ctx);
            if (ch) champCount[ch.id] = (champCount[ch.id] || 0) + 1;
            if (tt) teamCount[tt.id]  = (teamCount[tt.id]  || 0) + 1;
            runs++;
        } catch (e) { /* Jahr überspringen */ }
    }

    if (runs === 0) {
        process.stdout.write(`\r  ${year} – FEHLER\n`);
        continue;
    }
    process.stdout.clearLine?.(0);
    process.stdout.cursorTo?.(0);

    const champPct = Math.round(((realChampGameId ? champCount[realChampGameId] || 0 : 0) / runs) * 100);
    const teamPct  = realTeamGameId ? Math.round(((teamCount[realTeamGameId] || 0) / runs) * 100) : null;

    // Sim-Champion (häufigster)
    const simChamp = Object.entries(champCount).sort(([,a],[,b]) => b - a)[0];
    const simTeam  = Object.entries(teamCount).sort(([,a],[,b]) => b - a)[0];

    const champOkYear = champPct >= 20;
    const teamOkYear  = teamPct == null || teamPct >= 20;

    const status = champOkYear && teamOkYear ? `${G}✓${RST}` : (champOkYear ? `${Y}~${RST}` : `${R}✗${RST}`);

    // Fahrernamen kürzen
    const realName = (t.championName || t.champion).split(' ').map((w, i, arr) =>
        i === arr.length - 1 ? w : w[0] + '.'
    ).join(' ');
    const teamLabel = realTeam ? realTeam.replace(/-/g, ' ') : '–';

    console.log(
        `${String(year).padEnd(5)} ` +
        `${realName.padEnd(24)} ` +
        `${colorPct(champPct).padEnd(8 + 9)} ` +  // +9 für ANSI-Escape
        `${teamLabel.padEnd(22)} ` +
        `${teamPct !== null ? colorPct(teamPct).padEnd(8 + 9) : '   –'.padEnd(8)} ` +
        status
    );

    totalYears++;
    if (champOkYear) champOk++;
    if (teamOkYear)  teamOk++;

    summary.push({ year, champPct, teamPct, champOk: champOkYear });
}

// ── Zusammenfassung ──────────────────────────────────────────────────────────
console.log('─'.repeat(82));
console.log(`\nJahre simuliert:   ${totalYears}`);
console.log(`Champion ≥ 20%:    ${champOk}/${totalYears} (${Math.round(champOk/totalYears*100)}%)`);
console.log(`Konstrukteur ≥ 20%: ${teamOk}/${totalYears} (${Math.round(teamOk/totalYears*100)}%)\n`);

// Schwächste Jahre (Warn-Liste)
const weak = summary.filter(s => !s.champOk).sort((a, b) => a.champPct - b.champPct);
if (weak.length > 0) {
    console.log(`${Y}Problematische Jahre (real Champion < 20%):${RST}`);
    for (const w of weak) {
        console.log(`  ${w.year}: ${w.champPct}%`);
    }
}
