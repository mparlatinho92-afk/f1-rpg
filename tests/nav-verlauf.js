/**
 * nav-verlauf.js — prüft Zurück/Vor (Navigations-Verlauf) im echten Browser.
 *
 *   node tests/nav-verlauf.js
 *
 * Ablauf wie beim Klicken: Tab Wertung → Jahr 2023 → Red Bull → Verstappen →
 * Rennen. Danach Browser-Zurück (page.goBack = Alt+←/Maustaste 4) Schritt für
 * Schritt und wieder vor. Geprüft wird, welches Fenster oben liegt und welches Jahr
 * bzw. welcher Tab angezeigt wird.
 */
const { chromium } = require('playwright');
const path = require('path');

const HTML = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') fehler.push('CONSOLE: ' + m.text().slice(0, 200)); });

    await page.goto(HTML, { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    const zustand = () => page.evaluate(() => {
        const ids = ['driverProfileModal', 'teamProfileModal', 'raceDetailModal', 'circuitGPProfileModal', 'ruleDetailModal'];
        const offen = ids.map(id => document.getElementById(id))
            .filter(el => el && el.style.display !== 'none')
            .sort((a, b) => (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0))
            .map(el => el.id.replace('Modal', ''));
        const titel = id => (document.getElementById(id)?.textContent || '').trim().slice(0, 40);
        return `tab=${currentTab} jahr=${viewingHistoricalYear || 'aktuell'} fenster=[${offen.join(' > ')}]` +
            (offen.length ? ` oben="${titel(offen[offen.length - 1] === 'raceDetail' ? 'raceDetailTitle' : offen[offen.length - 1] + 'Title')}"` : '');
    });
    const warte = () => page.waitForTimeout(400);
    const log = [];
    const schritt = async (name, fn) => { await fn(); await warte(); log.push(name.padEnd(22) + await zustand()); };

    await schritt('Start', async () => {});
    await schritt('Tab Wertung', () => page.evaluate(() => switchTab('standings')));
    await schritt('Jahr 2023', () => page.evaluate(() => openYearStandings(2023, 'teams')));
    await schritt('Red Bull', () => page.evaluate(() => openTeamProfile('red-bull')));
    await schritt('Verstappen', () => page.evaluate(() => openDriverProfile('max-verstappen')));
    const raceId = await page.evaluate(() => (getF1DBYear(2023) || [])[0]?.raceId);
    await schritt('Rennen ' + raceId, () => page.evaluate(id => openHistoricalRaceModal(id), raceId));
    for (let i = 0; i < 5; i++) await schritt('← zurück', () => page.goBack());
    for (let i = 0; i < 5; i++) await schritt('→ vor', () => page.goForward());
    await schritt('← zurück', () => page.goBack());
    await schritt('Button ◀', () => page.click('#navBackBtn'));
    await schritt('Button ▶', () => page.click('#navFwdBtn'));
    const knoepfe = await page.evaluate(() => ({ zurueck: !document.getElementById('navBackBtn').disabled, vor: !document.getElementById('navFwdBtn').disabled, eintraege: _nav.entries.length, idx: _nav.idx }));

    console.log(log.join('\n'));
    console.log('\nKnöpfe:', JSON.stringify(knoepfe));
    console.log(fehler.length ? '\nFEHLER:\n' + fehler.join('\n') : '\nKeine Seitenfehler.');
    await browser.close();
})();
