/**
 * h2h-steckbrief.js — prüft die Head-to-Head-Tabelle im Fahrer-Steckbrief im echten Browser.
 *
 *   node tests/h2h-steckbrief.js [startjahr=1958] [saisons=2]
 *
 * Simuliert N Saisons + 3 Rennen, öffnet den Steckbrief JEDES Fahrers, der in einer simulierten
 * Saison gemeldet war, und prüft:
 *  - kein Fahrer steht als sein eigener Teamkollege in der Tabelle (Graham-Hill-Fall)
 *  - Zeile „Gegen alle" = Summe der Zeilen (Rennen und Quali)
 *  - Gegenprobe gegen eine UNABHÄNGIGE Quelle: der Duell-Zähler `trackTeammateDuels` (h2hHistory)
 *    zählt Zweier-Teams live mit. Für Paare, die nie in einem 3+-Team zusammen fuhren, müssen
 *    die Renn-Bilanz identisch sein. Die Quali-Bilanz darf GRÖSSER sein: der Zähler wertet die Quali
 *    nur, wenn beide auch starteten — die Tabelle zählt auch das Ausqualifizieren eines Teamkollegen,
 *    der dann DNQ war (gemessen 14.10.2026: Behra vs Flockhart 1958, BRM). In 3+-Teams zählt der Zähler bewusst nicht
 *    (Nutzer-Entscheid 14.10.2026: Ansehen bleibt unberührt) — dort nur Teilmengen-Prüfung.
 *  - Sortieren über den Spaltenkopf „%" ordnet absteigend
 * Dazu pageerror: ein Skript-Tod fällt nur hier auf (reference_silent_script_death).
 * Der Steckbrief ist async — ohne await meldet ein try/catch „kein Fehler", obwohl er fliegt.
 */
const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

const START = parseInt(process.argv[2]) || 1958;
const SAISONS = parseInt(process.argv[3]) || 2;

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push(e.message));
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href, { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    const r = await page.evaluate(async ({ START, SAISONS }) => {
        window.alert = () => {}; window.confirm = () => true;
        initFromYear(START);
        for (let s = 0; s < SAISONS; s++) { simulateSeasonRaces(); processSeasonEndEvents(); startNewSeason(); await new Promise(z => setTimeout(z, 300)); }
        for (let i = 0; i < 3; i++) selectRaceMode('classic');

        // Kandidaten: alle, die in einer simulierten Saison ein Rennen bestritten
        const ids = new Set();
        for (const h of GAME_STATE.history) {
            if (!h.results) Object.assign(h, await getHistoryDetail(h.year) || {});
            for (const race of h.results || []) for (const e of race.res || []) ids.add(e.d);
        }
        for (const race of GAME_STATE.results || []) for (const e of race.results || []) ids.add(e.driver);

        const pruef = { profile: 0, mitTabelle: 0, selbst: [], summe: [], gegenprobe: { gleich: 0, abweichend: [] , teilmenge: 0 }, sortiert: null, beispiele: [] };
        const nameVon = id => {
            for (const h of GAME_STATE.history) { const d = (h.drivers || []).find(x => x.id === id); if (d) return d.name; }
            const d = GAME_STATE.drivers.find(x => x.id === id) || (GAME_STATE.reservePool || []).find(x => x.id === id);
            return d ? d.name : id;
        };
        // 3+-Teams je Rennen: Paare, die dort zusammen fuhren, kennt der Zähler nicht
        const inDreierTeam = new Set();
        const alleRennen = [...GAME_STATE.history.flatMap(h => (h.results || []).map(x => (x.res || []).map(e => ({ d: e.d, tm: e.tmn })))),
            ...(GAME_STATE.results || []).map(x => (x.results || []).map(e => ({ d: e.driver, tm: e.teamName })))];
        for (const res of alleRennen) {
            const jeTeam = {};
            for (const e of res) (jeTeam[e.tm] = jeTeam[e.tm] || []).push(e.d);
            for (const ds of Object.values(jeTeam)) if (ds.length > 2) for (const a of ds) for (const b of ds) if (a !== b) inDreierTeam.add(a + '|' + b);
        }

        let n = 0;
        for (const id of ids) {
            if (n++ >= 60) break;                       // Laufzeit begrenzen
            await openDriverProfile(id);
            pruef.profile++;
            const h4 = [...document.querySelectorAll('h4')].find(x => x.textContent.includes('Head-to-Head Teamkollegen'));
            const card = h4 && h4.closest('.card');
            if (!card) { closeDriverProfile(); continue; }
            const zeilen = [...card.querySelectorAll('tbody tr:not([data-fest])')];
            if (zeilen.length) pruef.mitTabelle++;
            const eigenerName = nameVon(id);
            for (const z of zeilen) if (z.dataset.name === eigenerName) pruef.selbst.push(eigenerName);
            const gesamt = card.querySelector('tbody tr[data-fest] td:nth-child(2)');
            if (gesamt && gesamt.textContent.includes(':')) {
                const [w, l] = gesamt.textContent.split(':').map(Number);
                const summe = zeilen.reduce((a, z) => {
                    const t = z.children[1].textContent;
                    if (t.includes(':')) { const [x, y] = t.split(':').map(Number); a[0] += x; a[1] += y; }
                    return a;
                }, [0, 0]);
                if (summe[0] !== w || summe[1] !== l) pruef.summe.push(eigenerName + ': ' + summe.join(':') + ' vs ' + w + ':' + l);
            }
            // Gegenprobe gegen h2hHistory (nur über die Zeilen, deren Teamkollege eine aktuelle ID hat)
            for (const z of zeilen) {
                const anderer = GAME_STATE.drivers.find(d => d.name === z.dataset.name) || (GAME_STATE.reservePool || []).find(d => d.name === z.dataset.name);
                if (!anderer) continue;
                const hist = getH2HHistory(id, anderer.id);
                if (!hist) continue;
                const rT = z.children[1].textContent, qT = z.children[2].textContent;
                const [rW, rL] = rT.includes(':') ? rT.split(':').map(Number) : [0, 0];
                const [qW, qL] = qT.includes(':') ? qT.split(':').map(Number) : [0, 0];
                if (inDreierTeam.has(id + '|' + anderer.id)) {
                    if (rW >= hist.rW && rL >= hist.rL && qW >= hist.qW && qL >= hist.qL) pruef.gegenprobe.teilmenge++;
                    else pruef.gegenprobe.abweichend.push(eigenerName + ' vs ' + z.dataset.name + ' (3+): Tabelle ' + [rW, rL, qW, qL] + ' Zähler ' + [hist.rW, hist.rL, hist.qW, hist.qL]);
                } else if (rW === hist.rW && rL === hist.rL && qW >= hist.qW && qL >= hist.qL) pruef.gegenprobe.gleich++;
                else pruef.gegenprobe.abweichend.push(eigenerName + ' vs ' + z.dataset.name + ': Tabelle ' + [rW, rL, qW, qL] + ' Zähler ' + [hist.rW, hist.rL, hist.qW, hist.qL]);
            }
            // Sortieren nach % einmal prüfen, an einer Tabelle mit mindestens 3 Zeilen
            if (pruef.sortiert === null && zeilen.length >= 3) {
                const th = [...card.querySelectorAll('th')].find(t => t.textContent.trim() === '%');
                sortiereH2H(th, 'pct');
                const werte = [...card.querySelectorAll('tbody tr:not([data-fest])')].map(z => z.dataset.pct === '' ? -1 : Number(z.dataset.pct));
                pruef.sortiert = werte.every((v, i) => i === 0 || werte[i - 1] >= v) ? 'ok: ' + werte.join(' ≥ ') : 'FALSCH: ' + werte.join(', ');
            }
            if (pruef.beispiele.length < 3 && zeilen.length >= 2) pruef.beispiele.push(card.innerText.split('\n').filter(Boolean).slice(0, 12).join(' | '));
            closeDriverProfile();
        }
        return pruef;
    }, { START, SAISONS });

    console.log(`Start ${START}, ${SAISONS} Saisons + 3 Rennen`);
    console.log(`Steckbriefe geöffnet: ${r.profile}, mit H2H-Tabelle: ${r.mitTabelle}`);
    console.log(`Selbst als Teamkollege: ${r.selbst.length ? 'FEHLER ' + r.selbst.join(', ') : 'keiner'}`);
    console.log(`„Gegen alle" ≠ Summe: ${r.summe.length ? 'FEHLER ' + r.summe.join('; ') : 'keine'}`);
    console.log(`Gegenprobe Zähler: ${r.gegenprobe.gleich} Paare stimmen (Rennen exakt, Quali ≥), ${r.gegenprobe.teilmenge} 3+-Paare als Obermenge, ${r.gegenprobe.abweichend.length} abweichend`);
    r.gegenprobe.abweichend.slice(0, 10).forEach(x => console.log('   ' + x));
    console.log(`Sortieren nach %: ${r.sortiert ?? 'nicht geprüft (keine Tabelle mit 3+ Zeilen)'}`);
    r.beispiele.forEach(b => console.log('Beispiel: ' + b));
    console.log(`pageerror: ${fehler.length ? fehler.join(' | ') : 'keine'}`);
    await browser.close();
    const ok = !fehler.length && !r.selbst.length && !r.summe.length && !r.gegenprobe.abweichend.length && !String(r.sortiert).startsWith('FALSCH');
    console.log(ok ? 'BESTANDEN' : 'NICHT BESTANDEN');
    process.exit(ok ? 0 : 1);
})();
