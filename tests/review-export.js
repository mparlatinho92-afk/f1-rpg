/**
 * review-export.js — prüft die Review-Exporte (🧾 Review-Export) im echten Browser.
 *
 *   node tests/review-export.js [startjahr=1975] [saisons=2]
 *
 * Baut einen Spielstand mit Junior-Welt, simuliert N Saisons + 3 Rennen, ruft jeden Teil und
 * das Paket mit download=false und prüft Gegenproben gegen den Spielstand:
 *  - Endstände: je Saison Fahrerpunkte = driverStandings, Weltmeister = history.champion
 *  - Rennen: Zahl der Rennen = archivierte + laufende Ergebnisse, jede Zeile hat Name + Team
 *  - Todesfälle: Summe = Einträge aller deaths-Listen
 *  - Kopf in jeder Datei, keine Laufzeit-ID als einziger Schlüssel (name ist gesetzt)
 *  - Download über den Button (Playwright 'download'-Ereignis)
 * Dazu pageerror: ein Skript-Tod fällt nur hier auf (reference_silent_script_death).
 */
const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

const START = parseInt(process.argv[2]) || 1975;
const SAISONS = parseInt(process.argv[3]) || 2;

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ acceptDownloads: true });
    const fehler = [];
    page.on('pageerror', e => fehler.push(e.message));
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href, { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    const r = await page.evaluate(async ({ START, SAISONS }) => {
        window.alert = () => {}; window.confirm = () => true;
        initFromYear(START);
        GAME_STATE.juniorMode = 'world';
        const jw = GAME_STATE.juniorWorld || (GAME_STATE.juniorWorld = _emptyJuniorWorld());
        jw.series = JUNIOR_LADDER_PRESETS.lean.series.map(s => ({ ...s, startYear: START, endYear: null }));
        await bootstrapJuniorWorld(START);
        for (let s = 0; s < SAISONS; s++) { simulateSeasonRaces(); processSeasonEndEvents(); startNewSeason(); await new Promise(z => setTimeout(z, 300)); }
        for (let i = 0; i < 3; i++) selectRaceMode('classic');

        const pruef = [];
        const ok = (name, bed, info) => pruef.push({ name, ok: !!bed, info: info === undefined ? '' : String(info) });
        const t0 = performance.now();
        const paket = await reviewExport('paket', false);
        const dauer = Math.round(performance.now() - t0);
        const T = paket.teile;
        const groesse = {};
        for (const [k, v] of Object.entries(T)) groesse[k] = JSON.stringify(v).length;

        // Kopf
        ok('Kopf: Version/Jahr/Saisons', paket.kopf.spielVersion === VERSION && paket.kopf.aktuellesJahr === GAME_STATE.currentYear
            && paket.kopf.simulierteSaisons === GAME_STATE.history.length, JSON.stringify(paket.kopf).slice(0, 120));
        // Endstände gegen driverStandings
        const end = T.endstaende.daten;
        ok('Endstände: Saisons = Archiv + laufend', end.length === GAME_STATE.history.length + 1, end.length);
        let punkteOk = true, wmOk = true;
        for (const h of GAME_STATE.history) {
            const e = end.find(x => x.jahr === h.year);
            const soll = Object.values(h.driverStandings || {}).reduce((s, d) => s + (d.points || 0), 0);
            const ist = e.fahrer.reduce((s, d) => s + d.punkte, 0);
            if (Math.abs(soll - ist) > 0.01) punkteOk = false;
            if (e.fahrer[0].name !== h.champion) wmOk = false;
        }
        ok('Endstände: Punktesumme je Saison = driverStandings', punkteOk);
        ok('Endstände: Rang 1 = Weltmeister der Historie', wmOk);
        // Drittel für jedes Team mit mindestens einer Meldung im Ergebnis (auch nur DNQ). Teams der
        // laufenden Saison ohne bisherige Meldung bleiben bewusst null – dort gibt es keine Daten.
        const gemeldet = new Set();
        for (const h of GAME_STATE.history) for (const rr of (h.results || [])) {
            (rr.res || []).forEach(x => gemeldet.add(h.year + '|' + x.tmn));
            Object.values(rr.tms || {}).forEach(t => gemeldet.add(h.year + '|' + t));
        }
        const ohne = end.filter(s => !s.laufend).flatMap(s => s.teams.filter(t => !t.drittel && gemeldet.has(s.jahr + '|' + t.name)).map(t => s.jahr + ' ' + t.name));
        ok('Endstände: Drittel für jedes gemeldete Team', ohne.length === 0, ohne.join(', ') || end.map(s => s.drittelBasis).join(','));
        // Rennen
        const ren = T.rennen.daten;
        const sollRennen = GAME_STATE.history.reduce((s, h) => s + (h.raceCount || 0), 0) + GAME_STATE.results.length;
        ok('Rennen: Anzahl = Archiv + laufend', ren.length === sollRennen, ren.length + ' / ' + sollRennen);
        ok('Rennen: jede Zeile mit Name + Team', ren.every(x => x.ergebnisse.every(e => e.name && e.team)));
        ok('Rennen: Quali-Platz meist vorhanden', ren.flatMap(x => x.ergebnisse).filter(e => e.qualiPlatz).length
            / ren.flatMap(x => x.ergebnisse).length > 0.9);
        ok('Rennen: Indy-Flags vorhanden', ren.every(x => typeof x.indy500 === 'boolean' && typeof x.indyGP === 'boolean'));
        // Gegenprobe: 1950–1960 genau EIN Indy 500 je Archivjahr, nie ein Indy GP (CLAUDE.md Indianapolis)
        const indyJahre = GAME_STATE.history.filter(h => h.year <= 1960).map(h => h.year);
        const indyFalsch = indyJahre.filter(y => ren.filter(x => x.jahr === y && x.indy500).length !== 1
            || ren.some(x => x.jahr === y && x.indyGP));
        if (indyJahre.length) ok('Rennen: je Jahr 1950–60 genau ein Indy 500, kein Indy GP', indyFalsch.length === 0,
            indyFalsch.join(',') || indyJahre.join(','));
        ok('Rennen: laufende Saison hat DNF-Grund-Feld', ren.filter(x => x.laufend).every(x => x.ergebnisse.every(e => 'dnfGrund' in e)));
        // Markt
        const markt = T.markt.daten;
        const sollMarkt = _allChronSeasons().reduce((s, c) => s + c.transfers.length + c.retirements.length, 0);
        ok('Markt: Einträge = Transfers + Abgänge', markt.length === sollMarkt, markt.length);
        ok('Markt: Namen gesetzt', markt.every(m => m.name));
        ok('Markt: Drittel meist gesetzt', markt.filter(m => m.drittelVon || m.drittelNach).length / Math.max(1, markt.length) > 0.5,
            markt.filter(m => m.drittelVon || m.drittelNach).length + '/' + markt.length);
        // Drei Fehler aus dem ersten echten Export (1950–2013, 12.10.2026):
        const ren_ = markt.filter(m => m.typ === 'renewal');
        ok('Markt: Verlängerung bleibt im Team (nachTeam = vonTeam)', ren_.every(m => m.nachTeam && m.nachTeam === m.vonTeam), ren_.length + ' renewal');
        ok('Markt: keine Platzhalter "-"/"Free Agent" als Team', markt.every(m => !['-', 'Free Agent'].includes(m.vonTeam) && !['-', 'Free Agent'].includes(m.nachTeam)));
        const dopp = markt.filter(m => m.art === 'transfer' && m.typ === 'dismissed');
        const abg = new Set(markt.filter(m => m.art === 'abgang' && m.typ === 'dismissed').map(m => m.jahr + '|' + m.name));
        ok('Markt: Entlassung doppelt → auchAlsAbgang gesetzt', dopp.every(m => m.auchAlsAbgang === abg.has(m.jahr + '|' + m.name)),
            dopp.filter(m => m.auchAlsAbgang).length + ' von ' + dopp.length + ' markiert');
        const ab = markt.filter(m => m.art === 'abgang');
        ok('Markt: Abgänge meist mit letztem Team', ab.filter(m => m.vonTeam).length / Math.max(1, ab.length) > 0.8,
            ab.filter(m => m.vonTeam).length + '/' + ab.length);
        // Bewertung
        ok('Bewertung: alle Kader-Fahrer drin', GAME_STATE.drivers.filter(d => d.careerScores).every(d =>
            T.bewertung.daten.some(b => (b.histId || b.name) === (d.histId || d.name))));
        // Tode
        const sollTote = _allChronSeasons().reduce((s, c) => s + c.deaths.length, 0);
        ok('Tode: Summe = alle deaths', T.tode.daten.summe.alle === sollTote, sollTote);
        // Rekorde + Weltmeister
        ok('Rekorde: sim und all vorhanden', T.rekorde.daten.rekorde.sim && T.rekorde.daten.rekorde.all,
            (T.rekorde.daten.rekorde.sim || []).length + ' / ' + (T.rekorde.daten.rekorde.all || []).length + ' Rekorde');
        ok('Weltmeister: = _championList', T.rekorde.daten.weltmeister.length === _championList().length, T.rekorde.daten.weltmeister.length);
        // Junior
        ok('Junior: Serien + Fahrer', T.junior.daten && T.junior.daten.serien.length > 0 && T.junior.daten.fahrer.length > 0,
            T.junior.daten && (T.junior.daten.serien.length + ' Serien, ' + T.junior.daten.fahrer.length + ' Fahrer'));
        // Steckbriefe
        const champ = GAME_STATE.history[0];
        const fb = T.fahrerSteckbrief.daten.find(f => f.name === champ.champion);
        ok('Fahrer-Steckbrief: Weltmeister hat Saison ' + champ.year, fb && fb.saisons.some(s => s.jahr === champ.year && s.rang === 1));
        ok('Team-Steckbrief: Konstrukteursmeister Rang 1', T.teamSteckbrief.daten.find(t => t.name === champ.teamChampion)?.saisons
            .some(s => s.jahr === champ.year && s.rang === 1), champ.teamChampion);
        // All-Time
        ok('All-Time Fahrer = allTimeStATS', T.allTimeFahrer.daten.length === Object.keys(GAME_STATE.allTimeStATS.drivers).length, T.allTimeFahrer.daten.length);
        ok('All-Time Teams = allTimeStATS', T.allTimeTeams.daten.length === Object.keys(GAME_STATE.allTimeStATS.teams).length, T.allTimeTeams.daten.length);
        ok('Reserve-Pool + Nationen im Paket', T.reservePool.daten && T.nationen.daten);
        // Einzelteil ohne Junior-Welt
        const vorher = GAME_STATE.juniorMode; GAME_STATE.juniorMode = 'off';
        const j = await reviewExport('junior', false);
        GAME_STATE.juniorMode = vorher;
        ok('Junior aus: daten null + Hinweis', j.daten === null && j.hinweise.some(h => /nicht aktiv/.test(h)));
        // Weltmeister-Tab rendert nach dem Refactor
        switchTab('stATS'); setStATSSubTab('champions');
        ok('Weltmeister-Tab rendert', document.getElementById('content').innerHTML.includes(champ.champion));
        return { pruef, dauer, groesse, gesamt: JSON.stringify(paket).length };
    }, { START, SAISONS });

    // Download über den Button
    let datei = null;
    try {
        await page.evaluate(() => openReviewExport());
        const [dl] = await Promise.all([
            page.waitForEvent('download', { timeout: 60000 }),
            page.click('#reviewExportModal button:has-text("Todesfälle")')
        ]);
        datei = dl.suggestedFilename();
    } catch (e) { datei = 'FEHLER: ' + e.message; }
    await browser.close();

    console.log(`=== Review-Export, Start ${START}, ${SAISONS} Saisons + 3 Rennen ===\n`);
    for (const p of r.pruef) console.log(`${p.ok ? '✅' : '❌'} ${p.name}${p.info ? '  (' + p.info + ')' : ''}`);
    console.log(`${/^f1rpg-review-todesfaelle-\d+\.json$/.test(datei) ? '✅' : '❌'} Download über Button  (${datei})`);
    console.log(`\nPaket: ${Math.round(r.gesamt / 1024)} KB in ${r.dauer} ms`);
    console.log('Teile (KB): ' + Object.entries(r.groesse).map(([k, v]) => `${k} ${Math.round(v / 1024)}`).join(' · '));
    console.log(fehler.length ? '\n❌ pageerror:\n  ' + fehler.join('\n  ') : '\n✅ keine pageerror');
    const durch = r.pruef.every(p => p.ok) && !fehler.length;
    process.exit(durch ? 0 : 1);
})();
