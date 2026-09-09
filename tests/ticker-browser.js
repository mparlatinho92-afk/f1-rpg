/**
 * ticker-browser.js — faehrt den Live-Ticker im ECHTEN Browser.
 *
 *   node tests/ticker-browser.js [jahr]
 *
 * Noetig, weil sim-core den UI-Teil nur mit Stubs sieht: ein Fehler in
 * updateLivePositionsTable, addLiveEvent oder im Modal faellt dort nicht auf.
 * Nur Playwright mit 'pageerror' findet einen Skript-Tod - siehe
 * reference_silent_script_death.
 */
const { chromium } = require('playwright');
const path = require('path');

const HTML = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');
const JAHR = parseInt(process.argv[2]) || 1950;

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') fehler.push('CONSOLE: ' + m.text().slice(0, 200)); });

    await page.goto(HTML, { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    const lebt = await page.evaluate(() => ({
        renderAll: typeof renderAll,
        simulateRace: typeof simulateRace,
        startLiveRace: typeof window.startLiveRace,
        seasonData: typeof SEASON_DATA
    }));

    const lauf = await page.evaluate((jahr) => {
        try {
            initFromYear(jahr);
            GAME_STATE.liveTickerMode = true;
            const vorher = {
                punkte: Object.values(GAME_STATE.driverStandings || {}).reduce((s, d) => s + (d.points || 0), 0),
                rennen: GAME_STATE.currentRace,
                tote: (GAME_STATE.seasonDeaths || []).length
            };
            window.startLiveRace(0, false);
            const geplant = window.__liveState ? null : undefined;   // Getter existiert nur in sim-core
            window.startRaceSimulation();
            // Runden von Hand takten - der Timer waere zu langsam
            let n = 0;
            while (n++ < 800) {
                simulateLap();
                const fertig = document.getElementById('liveCloseButton');
                if (fertig && fertig.style.display === 'block') break;
            }
            window.closeLiveRace();
            const nachher = {
                punkte: Object.values(GAME_STATE.driverStandings || {}).reduce((s, d) => s + (d.points || 0), 0),
                rennen: GAME_STATE.currentRace,
                tote: (GAME_STATE.seasonDeaths || []).length,
                ergebnisse: (GAME_STATE.results || []).length
            };
            const r0 = (GAME_STATE.results || [])[0];
            return {
                ok: true, runden: n, vorher, nachher,
                sieger: r0 && r0.results ? (r0.results.find(x => x.position === 1) || {}).name : null,
                zeilen: r0 && r0.results ? r0.results.length : 0
            };
        } catch (e) { return { ok: false, err: e.message, stack: (e.stack || '').split('\n')[1] }; }
    }, JAHR);

    await browser.close();

    console.log('=== Live-Ticker im Browser, Saison ' + JAHR + ' ===\n');
    console.log('Skript angelegt : renderAll=' + lebt.renderAll + ', simulateRace=' + lebt.simulateRace +
        ', startLiveRace=' + lebt.startLiveRace + ', SEASON_DATA=' + lebt.seasonData);
    if (!lauf.ok) {
        console.log('\nFEHLER: ' + lauf.err + (lauf.stack ? '\n  ' + lauf.stack.trim() : ''));
    } else {
        console.log('Runden getaktet : ' + lauf.runden);
        console.log('Sieger          : ' + lauf.sieger);
        console.log('Ergebniszeilen  : ' + lauf.zeilen);
        console.log('Punkte vergeben : ' + lauf.vorher.punkte + ' -> ' + lauf.nachher.punkte);
        console.log('currentRace     : ' + lauf.vorher.rennen + ' -> ' + lauf.nachher.rennen);
        console.log('seasonDeaths    : ' + lauf.vorher.tote + ' -> ' + lauf.nachher.tote +
            '   (darf sich hoechstens um die Tode DIESES Rennens erhoehen, nicht doppelt)');
        console.log('results[]       : ' + lauf.nachher.ergebnisse);
    }
    console.log('\nSkriptfehler    : ' + (fehler.length ? '\n  ' + fehler.slice(0, 5).join('\n  ') : 'keine'));

    const gut = lauf.ok && !fehler.length && lauf.zeilen > 0 && lauf.nachher.punkte > lauf.vorher.punkte;
    console.log('\n' + (gut ? 'GRUEN - Ticker laeuft im Browser und wertet das Rennen.'
        : 'FEHLGESCHLAGEN'));
    process.exit(gut ? 0 : 1);
})();
