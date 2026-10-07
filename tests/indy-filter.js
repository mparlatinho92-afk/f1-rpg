/**
 * indy-filter.js — prüft den Indy-Filter der All-Time-Fahrerstatistik im Browser.
 *
 *   node tests/indy-filter.js
 *
 * „Nur Indy" = nur die elf Indy-500-Starts 1950–1960 (nicht der US-GP 2000–2007),
 * „Nur F1" = Karriere minus dieser Starts. Zwei Stände:
 *   A) Spielstart 2024: alles real aus F1DB (Vukovich, Ward, Fangio als Stichproben)
 *   B) Spielstart 1950, erste Saison im Spiel gefahren: der Indy-Anteil muss aus den
 *      simulierten Ergebnissen kommen, und applyRaceResults muss hasIndy setzen.
 */
const { chromium } = require('playwright');
const path = require('path');

const HTML = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
    await page.goto(HTML, { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    const lauf = () => page.evaluate(async () => {
        const zeilen = async (mode) => {
            stATSIndyFilter = mode; stATSSearch = ''; stATSPage = 0; stATSSortBy = 'races'; stATSSortDir = 'desc';
            _indyStatsMap();
            for (let i = 0; i < 100 && _indyStats.building; i++) await new Promise(r => setTimeout(r, 50));
            const n = Object.keys(GAME_STATE.allTimeStATS.drivers).length;
            const rows = [];
            for (let p = 0; p * STATS_PAGE_SIZE < n; p++) {
                stATSPage = p;
                const d = document.createElement('div'); d.innerHTML = renderAllTimeDrivers();
                for (const tr of d.querySelectorAll('tbody tr')) {
                    const td = [...tr.children].map(c => c.textContent.replace(/\s+/g, ' ').trim());
                    rows.push({ name: td[1].replace(/ \d+× WM$/, ''), titel: +td[2], siege: +td[3], poles: +td[4], rennen: +td[5], podien: +td[6], punkte: +td[7] });
                }
            }
            return rows;
        };
        const pick = (rows, ...namen) => namen.map(nm => rows.find(r => r.name.includes(nm)) || { name: nm, fehlt: true });
        const res = {};
        for (const mode of ['all', 'only', 'none']) {
            const rows = await zeilen(mode);
            res[mode] = { anzahl: rows.length, summeRennen: rows.reduce((s, r) => s + r.rennen, 0),
                          stichprobe: pick(rows, 'Vukovich', 'Rodger Ward', 'Fangio', 'Troy Ruttman') };
        }
        stATSIndyFilter = 'all';
        return res;
    });

    console.log('=== A) Spielstart 2024 (real aus F1DB) ===');
    console.log(JSON.stringify(await lauf(), null, 1));

    const b = await page.evaluate(() => {
        initFromYear(1950);
        const indyIdx = GAME_STATE.races.findIndex(r => istIndy500(r, 1950));
        for (let i = 0; i < GAME_STATE.races.length; i++) applyRaceResults(simulateRace(i, false));
        const indyRes = GAME_STATE.results.find(r => r.raceIndex === indyIdx);
        const starter = (indyRes?.results || []).filter(r => !r.dnpq).length;
        const ats = GAME_STATE.allTimeStATS.drivers;
        return { rennen: GAME_STATE.races.length, indyIdx, starter,
                 hasIndyGesetzt: Object.values(ats).filter(d => d.hasIndy).length };
    });
    console.log('\n=== B) Spielstart 1950, Saison 1950 im Spiel gefahren ===');
    console.log(JSON.stringify(b));
    const rb = await lauf();
    console.log(JSON.stringify({ only: { anzahl: rb.only.anzahl, summeRennen: rb.only.summeRennen },
                                 none: { anzahl: rb.none.anzahl, summeRennen: rb.none.summeRennen },
                                 all: { anzahl: rb.all.anzahl, summeRennen: rb.all.summeRennen } }));
    console.log('Erwartung B: only.summeRennen = Indy-Starter (' + b.starter + '), all = only + none');

    // C) dieselbe Saison archiviert: Ergebnisse liegen jetzt im Detail-Store
    await page.evaluate(async () => {
        window.confirm = () => true; window.alert = () => {};
        await processSeasonEndEvents();
        await startNewSeason();
    });
    await page.waitForTimeout(1500);
    const rc = await lauf();
    console.log('\n=== C) Saison 1950 archiviert, jetzt ' + await page.evaluate(() => GAME_STATE.currentYear) + ' ===');
    console.log(JSON.stringify({ only: { anzahl: rc.only.anzahl, summeRennen: rc.only.summeRennen },
                                 none: { anzahl: rc.none.anzahl, summeRennen: rc.none.summeRennen },
                                 all: { anzahl: rc.all.anzahl, summeRennen: rc.all.summeRennen } }));
    console.log('Erwartung C: only.summeRennen = ' + b.starter + ' wie in B');

    console.log(fehler.length ? '\nFEHLER:\n' + fehler.join('\n') : '\nKeine Seitenfehler.');
    await browser.close();
})();
