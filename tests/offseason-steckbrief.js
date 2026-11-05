/**
 * offseason-steckbrief.js — Karriere-Historie zwischen Saisonende und Saisonstart.
 *
 *   node tests/offseason-steckbrief.js [startjahr=1980]
 *
 * Der Transfermarkt laeuft im Saisonende-Fenster (processSeasonEndEvents), archiviert wird
 * erst in startNewSeason. Dazwischen zeigte die Zeile der abgeschlossenen Saison das NEUE
 * Team (Nutzer 05.11.2026). Prueft fuer jeden Fahrer, der in dieser Saison ein Rennen fuhr
 * und dessen driver.team jetzt ein anderes ist: Team-Zelle der Saison-Zeile = Teams aus den
 * Rennergebnissen; das neue Team darf dort nicht stehen. Dazu (v0.9.21.31): Kopf zeigt das alte Team
 * und „ab <Jahr>: <neu>", Team-Steckbrief des NEUEN Teams führt ihn nicht in der Fahrerkarte der
 * abgeschlossenen Saison, Meldeliste (fahrerDerSaison) führt ihn beim alten Team. Dazu pageerror.
 */
const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');
const START = parseInt(process.argv[2]) || 1980;

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push(e.message));
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(async (START) => {
        window.alert = () => {}; window.confirm = () => true;
        initFromYear(START);
        simulateSeasonRaces();
        const y = GAME_STATE.currentYear;
        const rennTeams = {};
        for (const race of GAME_STATE.results || []) for (const e of race.results || [])
            (rennTeams[e.driver] = rennTeams[e.driver] || new Set()).add(e.teamName || teamDisplayName(e.team));
        for (const race of GAME_STATE.results || []) for (const [id, tn] of Object.entries(race.tms || {}))
            (rennTeams[id] = rennTeams[id] || new Set()).add(tn);   // DNQ/DNS: Team zur Rennzeit
        processSeasonEndEvents();      // = Saisonende-Fenster, Markt gelaufen, noch nicht archiviert
        const out = { jahr: y, gewechselt: 0, falsch: [], ok: 0, beispiele: [], kopf: [], teamkarte: [], melde: [] };
        for (const [id, set] of Object.entries(rennTeams)) {
            const d = GAME_STATE.drivers.find(x => x.id === id);
            if (!d || !d.team) continue;
            const neu = (GAME_STATE.teams.find(t => t.id === d.team) || {}).name;
            if (!neu || set.has(neu)) continue;
            out.gewechselt++;
            await openDriverProfile(id);
            const h4 = [...document.querySelectorAll('h4')].find(x => x.textContent.includes('Karriere-Historie'));
            const zeile = h4 && [...h4.closest('.card').querySelectorAll('tbody tr')]
                .find(tr => tr.querySelector('td').textContent.trim().replace('*', '') === String(y));
            const zelle = zeile ? zeile.querySelectorAll('td')[1].textContent.replace(/\s+/g, ' ').trim() : '(keine Zeile)';
            if (!zeile || zelle.includes(neu)) out.falsch.push(`${d.name}: Zeile "${zelle}", Rennen ${[...set].join('/')}, neu ${neu}`);
            else { out.ok++; if (out.beispiele.length < 3) out.beispiele.push(`${d.name}: ${zelle} (neu ${neu})`); }
            const kopf = [...document.querySelectorAll('#driverProfileModal .text-3xl')].find(x => x.textContent.includes(d.name))?.parentElement?.textContent.replace(/\s+/g, ' ') || '';
            if (!kopf.includes('ab ' + (y + 1) + ': ' + neu)) out.kopf.push(d.name + ': ' + kopf.slice(0, 90));
            if (typeof closeDriverProfile === 'function') closeDriverProfile();
            const md = fahrerDerSaison().find(x => x.id === id);
            const mdTeam = md && (GAME_STATE.teams.find(tt => tt.id === md.team) || {}).name;
            const rz = teamZurRennzeit(id);
            if ((md && !mdTeam) || (rz && !rz.id && !GAME_STATE.teams.some(tt => tt.name === rz.name))) out.ausgestiegen = (out.ausgestiegen || 0) + 1;   // altes Team am Saisonende ausgestiegen
            else if (!mdTeam || !set.has(mdTeam)) out.melde.push(d.name + ': Meldeliste ' + mdTeam );
            await openTeamProfile(d.team);
            const h = [...document.querySelectorAll('h4')].find(x => x.textContent.includes('Fahrer ' + y));
            const grid = h && h.parentElement.querySelector('.grid');
            if (grid && grid.textContent.includes(d.name)) out.teamkarte.push(d.name + ' in Fahrerkarte von ' + neu);
            if (typeof closeTeamProfile === 'function') closeTeamProfile();
        }
        return out;
    }, START);
    console.log(`Saison ${r.jahr}: ${r.gewechselt} Fahrer mit neuem Team, richtig ${r.ok}, falsch ${r.falsch.length}`);
    r.falsch.slice(0, 10).forEach(x => console.log('  FALSCH ' + x));
    console.log(`Kopf falsch ${r.kopf.length}, Team-Fahrerkarte falsch ${r.teamkarte.length}, Meldeliste falsch ${r.melde.length}, altes Team ausgestiegen ${r.ausgestiegen || 0}`);
    [...r.kopf, ...r.teamkarte, ...r.melde].slice(0, 8).forEach(x => console.log('  FALSCH ' + x));
    r.beispiele.forEach(x => console.log('  ok     ' + x));
    console.log(fehler.length ? 'pageerror: ' + fehler.slice(0, 3).join(' | ') : 'kein pageerror');
    await browser.close();
})();
