/**
 * ticker-wetter-meldungen.js — Paket 1b: erscheinen Regen- und Rotflaggen-Meldungen im Ticker?
 *
 *   node tests/ticker-wetter-meldungen.js [jahr]
 *
 * Echter Browser (Playwright, pageerror), weil addLiveEvent in sim-core nur ein Stub ist.
 * Erzwingt je Rennen regenArt + roteFlagge im geplanten Ergebnis (abwechselnd teilweise /
 * durchgehend nass), fährt alle Runden und zählt, welche Pools feuern und ob Platzhalter
 * unaufgelöst stehen bleiben. Das Ergebnis selbst wird dabei nicht angefasst.
 */
const { chromium } = require('playwright');
const path = require('path');
const HTML = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');
const JAHR = parseInt(process.argv[2]) || 1985;

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
    await page.goto(HTML, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const erg = await page.evaluate((jahr) => {
        initFromYear(jahr);
        const alle = [];
        for (let i = 0; i < 6; i++) {
            window.startLiveRace(i, true);
            const durch = i % 2 === 1;
            liveRaceState.plannedResult.regenArt = durch ? 'durchgehend' : 'teilweise';
            liveRaceState.plannedResult.roteFlagge = true;
            liveRaceState.wetterPlan = _tickerWetterPlan(liveRaceState.plannedResult, liveRaceState.totalLaps);
            const feedEl = document.getElementById('liveEventsFeed');
            feedEl.innerHTML = '';
            // Der Feed hält nur 20 Zeilen: mitschreiben statt am Ende lesen.
            const mo = new MutationObserver(m => m.forEach(r => r.addedNodes.forEach(n => alle.push(n.textContent))));
            mo.observe(feedEl, { childList: true });
            // Start wie der Start-Button, ohne dessen Intervall
            addLiveEvent(liveLine('start', { fieldSize: liveRaceState.positions.length, totalLaps: liveRaceState.totalLaps, year: jahr }), 'positive');
            if (liveRaceState.plannedResult.regenArt === 'durchgehend')
                addLiveEvent(liveLine('wet_start', { fieldSize: liveRaceState.positions.length, totalLaps: liveRaceState.totalLaps, year: jahr }), 'warning');
            liveRaceState.active = true;
            while (liveRaceState.currentLap < liveRaceState.totalLaps && liveRaceState.active) simulateLap();
            liveRaceState.active = false;
            mo.takeRecords().forEach(r => r.addedNodes.forEach(n => alle.push(n.textContent)));
            mo.disconnect();
        }
        return alle;
    }, JAHR);
    await browser.close();
    const ARTEN = ['🌧', '☀', '🟥', '🟢'];
    const wetter = erg.filter(z => ARTEN.some(a => z.startsWith(a)));
    const zaehl = ARTEN.map(a => a + ' ' + wetter.filter(z => z.startsWith(a)).length).join('  ');
    const offen = erg.filter(z => /\{\w+\}/.test(z));
    console.log('Jahr ' + JAHR + ' — Feed-Zeilen gesamt ' + erg.length + ', davon Wetter/Rot: ' + zaehl);
    console.log('Stichprobe:\n  ' + wetter.slice(0, 14).join('\n  '));
    console.log('unaufgelöste Platzhalter: ' + (offen.length ? offen.join(' | ') : 'keine'));
    console.log(fehler.length ? fehler.join('\n') : 'keine pageerror');
})();
