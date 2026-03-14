'use strict';
// =============================================================
// test_double_transfer.js
// Prüft: Wird ein Fahrer in einer einzigen Offseason mehr als
// einmal transferiert? (Bug aus v0.9.8.1, gefixt in v0.9.8.2)
//
// Ausführen: node tests/test_double_transfer.js
// =============================================================

const ITERATIONS  = 500;
const NUM_TEAMS   = 10;
const NUM_DRIVERS = 20; // 2 pro Team

// ── Hilfsfunktionen ──────────────────────────────────────────

function rnd(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ── Mock-State erstellen ──────────────────────────────────────

function createState() {
    const teams = Array.from({ length: NUM_TEAMS }, (_, i) => ({
        id: `t${i}`, name: `Team ${i}`
    }));

    // Fahrer: je 2 pro Team, unterschiedliche Vertragsenden + Scores
    const drivers = [];
    teams.forEach((team, ti) => {
        for (let s = 0; s < 2; s++) {
            const score = rnd(10, 95);
            drivers.push({
                id:          `d${ti}_${s}`,
                name:        `Fahrer ${ti}-${s}`,
                team:        team.id,
                contractEnd: 2024 + rnd(0, 2),   // 2024 / 2025 / 2026
                pace:        rnd(50, 90),
                status:      'active',
                yearsInTeam: rnd(0, 6),
                score,                            // vorab berechneter Performance-Score
            });
        }
    });

    const teamStandings = {};
    teams.forEach((t, i) => { teamStandings[t.id] = { points: (NUM_TEAMS - i) * 50 }; });

    return {
        year:             2024,
        teams,
        drivers,
        teamStandings,
        reservePool:      [],
        pendingAssignments: [],
    };
}

// ── Kern-Transfer-Logik (Nachbau der HTML-Phasen) ─────────────
// Intentional: mit UND ohne _movedThisSeason-Flag simulierbar

function runOffseason(state, withFix) {
    const year    = state.year;
    const changes = [];

    const teamRanking = Object.entries(state.teamStandings)
        .map(([id, s]) => ({ id, points: s.points }))
        .sort((a, b) => b.points - a.points);

    const totalTeams  = teamRanking.length;
    const topCount    = Math.ceil(totalTeams * 0.3);
    const midCount    = Math.ceil(totalTeams * 0.7);

    // Flag zurücksetzen
    if (withFix) state.drivers.forEach(d => delete d._moved);

    function driversFor(teamId) {
        return state.drivers.filter(d => d.team === teamId && d.status === 'active');
    }

    function markMoved(driver) {
        if (withFix) driver._moved = true;
    }

    function teamRankOf(teamId) {
        return (teamRanking.findIndex(t => t.id === teamId) + 1) || 999;
    }

    function teamWithSpace(fromRank, toRank, excludeId) {
        for (let i = fromRank; i < toRank && i < teamRanking.length; i++) {
            const tid = teamRanking[i].id;
            if (tid === excludeId) continue;
            if (driversFor(tid).length < 2) return state.teams.find(t => t.id === tid);
        }
        return null;
    }

    function recordTransfer(driver, fromTeam, toTeamName, type) {
        changes.push({ driverId: driver.id, driverName: driver.name, type,
            fromTeam, toTeam: toTeamName });
    }

    // PHASE 1 – Vorzeitige Auflösung (Score < 25, ~15 % Chance)
    state.drivers
        .filter(d => d.status === 'active' && d.contractEnd > year)
        .forEach(driver => {
            if (driver.score >= 25 || Math.random() > 0.15) return;
            const oldTeam = state.teams.find(t => t.id === driver.team);
            driver.team        = null;
            driver.contractEnd = year;
            markMoved(driver);
            recordTransfer(driver, oldTeam?.name, 'Free Agent', 'released');
        });

    // PHASE 2 – Auslaufende Verträge (bereits in Phase 1 bewegte Fahrer überspringen)
    state.drivers
        .filter(d => d.status === 'active' && d.contractEnd <= year && !(withFix && d._moved))
        .forEach(driver => {
            const rank     = teamRankOf(driver.team);
            const isTop    = rank <= topCount;
            const isMid    = rank > topCount && rank <= midCount;
            const oldTeam  = state.teams.find(t => t.id === driver.team);
            const score    = driver.score;

            if (score >= 70) {
                // Aufstieg (35 %)
                if (!isTop && Math.random() < 0.35) {
                    const better = teamWithSpace(0, rank - 1, driver.team);
                    if (better) {
                        driver.team        = better.id;
                        driver.contractEnd = year + 1 + rnd(0, 1);
                        markMoved(driver);
                        recordTransfer(driver, oldTeam?.name, better.name, 'upgrade');
                        return;
                    }
                }
                driver.contractEnd = year + 2;
            } else if (score >= 50) {
                driver.contractEnd = year + 1 + rnd(0, 1);
            } else if (score >= 25) {
                // Abstieg (70 %)
                if (Math.random() < 0.70) {
                    const worse = teamWithSpace(rank, totalTeams, driver.team);
                    if (worse) {
                        driver.team        = worse.id;
                        driver.contractEnd = year + 1 + rnd(0, 1);
                        markMoved(driver);
                        recordTransfer(driver, oldTeam?.name, worse.name, 'downgrade');
                        return;
                    }
                }
                driver.contractEnd = year + 1;
            } else {
                // Entlassen
                driver.status      = 'dismissed';
                driver.contractEnd = year;
                markMoved(driver);
                recordTransfer(driver, oldTeam?.name, null, 'dismissed');
            }
        });

    // PHASE 3 – Leere Cockpits füllen (Abwerben)
    state.teams.forEach(team => {
        let slots = 2 - driversFor(team.id).length;
        if (slots <= 0) return;
        const myRank = teamRankOf(team.id);

        for (let i = 0; i < slots; i++) {
            // Kandidaten: aus unterem Tier, Vertrag läuft bald aus, Score ≥ 70
            const candidates = state.drivers.filter(d => {
                if (d.status !== 'active' || !d.team || d.team === team.id) return false;
                if (withFix && d._moved) return false;   // ← der Fix
                const dr = teamRankOf(d.team);
                if (dr <= myRank) return false;
                if (d.contractEnd > year + 1) return false;
                return d.score >= 70;
            });

            if (candidates.length === 0) continue;

            candidates.sort((a, b) => b.pace - a.pace);
            const picked  = candidates[0];
            const oldTeam = state.teams.find(t => t.id === picked.team);

            picked.team        = team.id;
            picked.contractEnd = year + 1 + rnd(0, 1);
            markMoved(picked);
            recordTransfer(picked, oldTeam?.name, team.name, 'poached');
        }
    });

    return changes;
}

// ── Test laufen lassen ─────────────────────────────────────────

function runTest(withFix) {
    let totalDoubles = 0;
    let maxDoubles   = 0;
    let doubleExamples = [];

    for (let i = 0; i < ITERATIONS; i++) {
        const state   = createState();
        const changes = runOffseason(state, withFix);

        // Zähle wie oft jeder Fahrer in changes vorkommt
        const counts = {};
        changes.forEach(c => { counts[c.driverId] = (counts[c.driverId] || 0) + 1; });

        Object.entries(counts).forEach(([id, n]) => {
            if (n > 1) {
                totalDoubles++;
                if (n > maxDoubles) maxDoubles = n;
                if (doubleExamples.length < 3) {
                    const all = changes.filter(c => c.driverId === id);
                    doubleExamples.push(`  ${all[0].driverName}: ` +
                        all.map(c => `${c.fromTeam} → ${c.toTeam ?? 'entlassen'} (${c.type})`).join(' | '));
                }
            }
        });
    }

    return { totalDoubles, maxDoubles, doubleExamples };
}

// ── Ausgabe ────────────────────────────────────────────────────

console.log(`\n=== Doppel-Transfer-Test (${ITERATIONS} Offseasons) ===\n`);

console.log('--- OHNE Fix (_movedThisSeason deaktiviert) ---');
const buggy = runTest(false);
console.log(`Doppel-Transfers gesamt : ${buggy.totalDoubles}`);
console.log(`Max. Transfers / Fahrer : ${buggy.maxDoubles}`);
if (buggy.doubleExamples.length > 0) {
    console.log('Beispiele:');
    buggy.doubleExamples.forEach(e => console.log(e));
}

console.log('');
console.log('--- MIT Fix (_movedThisSeason aktiv) ---');
const fixed = runTest(true);
console.log(`Doppel-Transfers gesamt : ${fixed.totalDoubles}`);
console.log(`Max. Transfers / Fahrer : ${fixed.maxDoubles}`);
if (fixed.totalDoubles === 0) {
    console.log('✅ Kein einziger Doppel-Transfer gefunden.');
} else {
    console.log('❌ Fix funktioniert NICHT:');
    fixed.doubleExamples.forEach(e => console.log(e));
}

console.log('');
