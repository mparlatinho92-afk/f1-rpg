/**
 * Testet Pole-to-Win-Ratio im Live-Ticker-Modus via Playwright.
 * Verwendung: node tests/pole-to-win-live.mjs [N]
 */
import { chromium } from 'playwright';
import http from 'node:http';

const N = parseInt(process.argv[2] || '40');

async function checkPort(port) {
    return new Promise(r => {
        let body = '';
        const req = http.get(`http://localhost:${port}/`, res => {
            res.on('data', d => { body += d; if (body.includes('F1 RPG')) { res.destroy(); r(port); } });
            res.on('end', () => r(body.includes('F1 RPG') ? port : 0));
            res.on('error', () => r(0));
        });
        req.on('error', () => r(0));
        req.setTimeout(2000, () => r(0));
    });
}

const port = (await checkPort(3333)) || (await checkPort(3000)) || (await checkPort(5000));
if (!port) { console.error('Kein F1 RPG Server gefunden. npx serve . --listen 3333 starten.'); process.exit(1); }

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'networkidle', timeout: 30000 });
console.log(`Geladen. Starte ${N} Live-Ticker-Rennen...`);

const result = await page.evaluate(async (N) => {
    let poleWins = 0, total = 0;
    const byPos = {};

    for (let sim = 0; sim < N; sim++) {
        initFromYear(2024);
        const ri = sim % GAME_STATE.races.length;
        const isRain = Math.random() < 0.12;
        simulateTraining(ri);
        simulateQualifying(ri, isRain);
        const q = GAME_STATE.qualifyingResults.find(x => x.raceIndex === ri);
        if (!q || !q.results.length) continue;
        const pole = q.results[0].driver;

        // Live-Ticker-State manuell aufbauen (ohne UI)
        const race = GAME_STATE.races[ri];
        const laps = race.laps || 50;
        const base = getCircuitBaseTime(race.circuitId, 2024, 'race') || 90;
        const gridGap = base * 0.015;

        const activeDrivers = GAME_STATE.drivers.filter(d => (!d.status || d.status === 'active') && d.team);
        liveRaceState = {
            active: true, paused: false, speed: 999, currentLap: 0, totalLaps: laps,
            positions: [], events: [], raceIndex: ri, isRain, intervalId: null, finished: false, qualiResult: q
        };
        liveRaceState.positions = activeDrivers.map((drv, idx) => {
            const team = GAME_STATE.teams.find(t => t.id === drv.team);
            const qp = q.results.findIndex(r => r.driver === drv.id) + 1 || idx + 1;
            const cv = isRain ? (drv.rain ?? 75) : (drv.consistency ?? 75);
            return {
                driver: drv.id, name: drv.name, team: drv.team,
                teamName: team ? team.name : '', totalTime: (qp - 1) * gridGap,
                gap: 0, tyreLaps: 0, hasPitted: false, isPitting: false,
                dnf: false, dnfType: null, dnfReason: null, fatal: false,
                qualiPos: qp, isGoodDay: Math.random() < (cv / 100)
            };
        });

        // Alle Runden simulieren
        for (let lap = 1; lap <= laps; lap++) {
            liveRaceState.currentLap = lap;
            simulateLap();
        }

        const finished = liveRaceState.positions.filter(p => !p.dnf && !p.fatal)
            .sort((a, b) => a.totalTime - b.totalTime);
        if (!finished.length) continue;

        const winner = finished[0].driver;
        const winnerQPos = q.results.findIndex(r => r.driver === winner) + 1 || 99;
        byPos[winnerQPos] = (byPos[winnerQPos] || 0) + 1;
        if (pole === winner) poleWins++;
        total++;
    }

    return { total, poleWins, ratio: (poleWins / total * 100).toFixed(1), byPos };
}, N);

await browser.close();

console.log(`\n=== POLE-TO-WIN | Live Ticker | 2024 | ${N} Rennen ===`);
console.log(`Gesamt Rennen:  ${result.total}`);
console.log(`Pole-to-Win:    ${result.poleWins} (${result.ratio}%)  [Ziel: ~35-45%]`);
const top5 = [1,2,3,4,5].map(p => `P${p}=${((result.byPos[p]||0)/result.total*100).toFixed(1)}%`);
console.log(`Sieger P1-P5:   ${top5.join('  ')}`);
