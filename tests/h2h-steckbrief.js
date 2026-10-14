/**
 * h2h-steckbrief.js — prüft die Head-to-Head-Tabelle im Fahrer-Steckbrief im echten Browser.
 *
 *   node tests/h2h-steckbrief.js [startjahr=1958] [saisons=2]
 *   node tests/h2h-steckbrief.js --stand <export.json>   echter Spielstand (NDJSON-Export) statt Simulation
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

const fs = require('fs');
const STAND = process.argv[2] === '--stand' ? process.argv[3] : null;
const STAND_TEXT = STAND ? fs.readFileSync(STAND, 'utf8') : null;
// Startjahr eines Spielstands = erste archivierte Saison
const START = STAND ? Number((STAND_TEXT.match(/"_t":"season","d":\{[^\n]*?"year":(\d{4})/) || [])[1])
    : (parseInt(process.argv[2]) || 1958);
const SAISONS = parseInt(process.argv[3]) || 2;

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push(e.message));
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href, { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    const r = await page.evaluate(async ({ START, SAISONS, STAND_TEXT }) => {
        window.alert = () => {}; window.confirm = () => true;
        if (STAND_TEXT) await _importNdjson(new File([STAND_TEXT], 'stand.json'));
        else {
            initFromYear(START);
            for (let s = 0; s < SAISONS; s++) { simulateSeasonRaces(); processSeasonEndEvents(); startNewSeason(); await new Promise(z => setTimeout(z, 300)); }
            for (let i = 0; i < 3; i++) selectRaceMode('classic');
        }

        // Kandidaten: alle, die in einer simulierten Saison ein Rennen bestritten
        const ids = new Set();
        for (const h of GAME_STATE.history) {
            if (!h.results) Object.assign(h, await getHistoryDetail(h.year) || {});
            for (const race of h.results || []) for (const e of race.res || []) ids.add(e.d);
        }
        for (const race of GAME_STATE.results || []) for (const e of race.results || []) ids.add(e.driver);

        const pruef = { ohneTabelleFalsch: [], ohneTabelleIndy: 0, profile: 0, mitTabelle: 0, selbst: [], summe: [], gegenprobe: { gleich: 0, abweichend: [] , teilmenge: 0 }, sortiert: null, beispiele: [] };
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

        // Echte Jahre vor dem Spielstart (v0.9.21.10): Umwandler + Rechenfunktion gegen eine schlichte,
        // getrennt geschriebene Zaehlung direkt aus F1DB_RESULTS. Teamkollege = selber Konstrukteur, Indy 500 nie.
        const NICHT = new Set(['DNQ', 'DNPQ', 'DNS', 'DNP', 'EX']);
        const echt = { fahrer: 0, paare: 0, abweichend: [], indyPaare: 0 };
        const saisonen = {};
        for (let y = 1950; y < START; y++) saisonen[y] = f1dbSaisonFuerH2H(y);
        const slugs = new Set();
        for (let y = 1950; y < START; y++) for (const [, , es] of F1DB_RESULTS[y] || []) for (const e of es) slugs.add(e[3]);
        for (const slug of slugs) {
            const soll = {};
            for (let y = 1950; y < START; y++) for (const [raceId, , es] of F1DB_RESULTS[y] || []) {
                const ich = es.filter(e => e[3] === slug);
                if (!ich.length) continue;
                if (isIndy500RaceId(raceId)) { for (const e of es) if (e[3] !== slug && e[4] === ich[0][4]) echt.indyPaare++; continue; }
                // bester eigener Eintrag (geteiltes Auto), dann jeder andere Fahrer desselben Konstrukteurs
                const gut = x => x[1] != null ? x[1] : 1000 - (x[5] || 0);
                const best = (arr) => arr.slice().sort((a, b) => gut(a) - gut(b))[0];
                const a = best(ich);
                // Quali-Stufe je Fahrer als [Stufe, Wert] (Nutzer-Regel 14.10.2026): 0 = Platz in F1DB_QUALIFYING,
                // 1 = ohne Platz mit Zeit (nicht EX), 2 = DNQ ohne Eintrag, 3 = DNPQ nach Vorquali-Platz; sonst kein Duell
                const ql = getF1DBQualifying(raceId) || [], vq = getF1DBPreQualifying(raceId) || [];
                const qStufe = (id, st) => {
                    const q = ql.find(x => x[1] === id && x[0] != null);
                    if (q) return [0, q[0]];
                    const z = ql.find(x => x[1] === id);
                    const t = z && (z[6] || z[5] || z[4] || z[2]);
                    if (t && st !== "EX") return [1, t];
                    if (st === "DNQ") return [2, 0];
                    if (st === "DNPQ") { const v = vq.find(x => x[1] === id && x[0] != null); return [3, v ? v[0] : Infinity]; }
                    return null;
                };
                const andere = {};
                // erst je Fahrer den besten Eintrag, DANN den Konstrukteur vergleichen: Moss fuhr in Aintree 1961 seinen
                // Lotus (DNF) und uebernahm danach Fairmans Ferguson (DSQ) — er startete im Lotus, war also kein Kollege
                for (const e of es) if (e[3] !== slug) andere[e[3]] = andere[e[3]] ? best([andere[e[3]], e]) : e;
                for (const k of Object.keys(andere)) if (andere[k][4] !== a[4]) delete andere[k];
                for (const [k, b] of Object.entries(andere)) {
                    const z = soll[k] || (soll[k] = [0, 0, 0, 0]);
                    if (!NICHT.has(a[2]) && !NICHT.has(b[2])) {
                        // klassifiziert schlaegt nicht klassifiziert, sonst Platz, sonst Runden
                        const vor = (a[1] != null && b[1] != null) ? a[1] < b[1] : (a[1] != null) ? true : (b[1] != null) ? false : (a[5] || 0) > (b[5] || 0);
                        const gleich = (a[1] != null && a[1] === b[1]) || (a[1] == null && b[1] == null && (a[5] || 0) === (b[5] || 0));
                        if (!gleich) { if (vor) z[0]++; else z[1]++; }
                    }
                    const qa = qStufe(slug, a[2]), qb = qStufe(k, b[2]);
                    if (qa && qb && (qa[0] !== qb[0] || qa[1] !== qb[1])) { if (qa[0] < qb[0] || (qa[0] === qb[0] && qa[1] < qb[1])) z[2]++; else z[3]++; }
                }
            }
            const ist = teamkollegenDuelle(Object.values(saisonen).filter(Boolean), new Set([slug]), slug, null).paare;
            echt.fahrer++;
            for (const [k, z] of Object.entries(soll)) {
                echt.paare++;
                const i = ist[k] ? [ist[k].rW, ist[k].rL, ist[k].qW, ist[k].qL] : [0, 0, 0, 0];
                if (i.join() !== z.join()) echt.abweichend.push(slug + ' vs ' + k + ': ist ' + i + ' soll ' + z);
            }
            for (const k of Object.keys(ist)) if (!soll[k]) echt.abweichend.push(slug + ' vs ' + k + ': ist da, soll fehlen');
        }

        let n = 0;
        for (const id of ids) {
            if (!STAND_TEXT && n++ >= 60) break;       // Laufzeit begrenzen; ein Spielstand wird komplett geprueft
            await openDriverProfile(id);
            pruef.profile++;
            const h4 = [...document.querySelectorAll('h4')].find(x => x.textContent.includes('Head-to-Head Teamkollegen'));
            const card = h4 && h4.closest('.card');
            if (!card) {
                // ohne Tabelle ist nur richtig, wenn der Fahrer nie ausserhalb des Indy 500 einen Konstrukteurskollegen hatte
                const rennen = [...GAME_STATE.history.map(h => ({ y: h.year, R: h.results || [], races: h.races || [] })),
                    { y: GAME_STATE.currentYear, R: (GAME_STATE.results || []).map(x => ({ ri: x.raceIndex, res: x.results.map(e => ({ d: e.driver, tmn: e.teamName })) })), races: GAME_STATE.races }];
                const kollege = rennen.some(s => s.R.some(x => {
                    if (istIndy500(s.races[x.ri ?? x.raceIndex], s.y)) return false;
                    const ich = (x.res || []).find(e => e.d === id);
                    return ich && (x.res || []).some(e => e.d !== id && e.tmn === ich.tmn);
                }));
                if (kollege) pruef.ohneTabelleFalsch.push(nameVon(id)); else pruef.ohneTabelleIndy++;
                closeDriverProfile(); continue;
            }
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
                let [rW, rL] = rT.includes(':') ? rT.split(':').map(Number) : [0, 0];
                let [qW, qL] = qT.includes(':') ? qT.split(':').map(Number) : [0, 0];
                // Die Tabelle enthaelt auch die echten Jahre vor dem Spielstart, der Zaehler nur simulierte Rennen:
                // den echten Anteil abziehen (er ist oben separat gegen F1DB nachgezaehlt)
                // IDs tragen einen Zeitstempel: der Fahrer kann in den Ergebnissen unter einer aelteren ID stehen
                const selbstHist = (GAME_STATE.drivers.find(d => d.id === id) || (GAME_STATE.reservePool || []).find(d => d.id === id)
                    || GAME_STATE.history.flatMap(h => h.drivers || []).find(d => d.id === id) || {}).histId;
                const echtTeil = selbstHist && anderer.histId
                    ? teamkollegenDuelle(Object.values(saisonen).filter(Boolean), new Set([selbstHist]), selbstHist, null).paare[anderer.histId] : null;
                if (echtTeil) { rW -= echtTeil.rW; rL -= echtTeil.rL; qW -= echtTeil.qW; qL -= echtTeil.qL; }
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
        pruef.echt = echt;
        return pruef;
    }, { START, SAISONS, STAND_TEXT });

    console.log(STAND ? `Spielstand ${STAND}, Start ${START}` : `Start ${START}, ${SAISONS} Saisons + 3 Rennen`);
    console.log(`Steckbriefe geöffnet: ${r.profile}, mit H2H-Tabelle: ${r.mitTabelle}`);
    console.log(`Ohne Tabelle: ${r.ohneTabelleIndy} ohne Konstrukteurskollegen außerhalb des Indy 500 (richtig), ${r.ohneTabelleFalsch.length ? 'FEHLER ' + r.ohneTabelleFalsch.join(', ') : '0 mit Kollegen (richtig)'}`);
    console.log(`Selbst als Teamkollege: ${r.selbst.length ? 'FEHLER ' + r.selbst.join(', ') : 'keiner'}`);
    console.log(`„Gegen alle" ≠ Summe: ${r.summe.length ? 'FEHLER ' + r.summe.join('; ') : 'keine'}`);
    console.log(`Gegenprobe Zähler: ${r.gegenprobe.gleich} Paare stimmen (Rennen exakt, Quali ≥), ${r.gegenprobe.teilmenge} 3+-Paare als Obermenge, ${r.gegenprobe.abweichend.length} abweichend`);
    r.gegenprobe.abweichend.slice(0, 10).forEach(x => console.log('   ' + x));
    console.log(`Echte Jahre 1950–${START - 1}: ${r.echt.fahrer} Fahrer, ${r.echt.paare} Konstrukteurs-Paare gegen Nachzählung, ${r.echt.abweichend.length} abweichend; Indy-500-Kontakte übersprungen: ${r.echt.indyPaare}`);
    r.echt.abweichend.slice(0, 10).forEach(x => console.log('   ' + x));
    console.log(`Sortieren nach %: ${r.sortiert ?? 'nicht geprüft (keine Tabelle mit 3+ Zeilen)'}`);
    r.beispiele.forEach(b => console.log('Beispiel: ' + b));
    console.log(`pageerror: ${fehler.length ? fehler.join(' | ') : 'keine'}`);
    await browser.close();
    const ok = !fehler.length && !r.ohneTabelleFalsch.length && !r.echt.abweichend.length && !r.selbst.length && !r.summe.length && !r.gegenprobe.abweichend.length && !String(r.sortiert).startsWith('FALSCH');
    console.log(ok ? 'BESTANDEN' : 'NICHT BESTANDEN');
    process.exit(ok ? 0 : 1);
})();
