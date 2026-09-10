/**
 * zielflagge-rundlauf.js — der geschlossene Kreis.
 *
 *   node tests/zielflagge-rundlauf.js [jahr]
 *
 *   1. RPG rechnet das Rennen und liefert es aus (Ergebnis wird geparkt)
 *   2. ZIELFLAGGE laedt die Lieferung, "faehrt" und erzeugt die Rueckgabe
 *   3. RPG liest die Rueckgabe ein und wertet
 *
 * Wertungsmodell "nur dein Slot ist frei": alles ausser dem eigenen Fahrer
 * stammt aus simulateRace. Faehrt der Spieler von P7 auf P4, rutschen die drei
 * dazwischen je einen Platz zurueck.
 *
 * Kritisch geprueft wird:
 *   - Punkte nach der AERA des Spiels, nicht nach ZIELFLAGGEs modernem Schema
 *     (1988: 9-6-4-3-2-1, nicht 25-18-15)
 *   - Todesfaelle ueberleben den Rundlauf. simulateRace hat sie beim Export
 *     bereits vollzogen; wuerde man die Wertung aus der duennen Rueckgabe neu
 *     bauen, waere der Tote im Kader tot, in der Wertung aber verschwunden.
 *   - Das Rennen wird genau EINMAL gewertet.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const path = require('path');

const JAHR = parseInt(process.argv[2]) || 1988;

(async () => {
    const { getContext } = require('./sim-core');
    const ctx = getContext();
    ctx.initFromYear(JAHR);

    const p = [];
    const pr = (n, ist, soll) => p.push({ n, ist, soll, ok: String(ist) === String(soll) });
    const prW = (n, bed, hinweis) => p.push({ n, ist: hinweis, soll: 'erfuellt', ok: !!bed });

    /* ── 1. RPG liefert ── */
    const lief = ctx.window.baueZielflaggeLieferung(0);
    prW('Lieferung gebaut', !!lief, lief ? Math.round(lief.text.length / 1024) + ' KB' : '-');
    if (!lief) { console.log('Abbruch'); process.exit(1); }

    const original = ctx.GAME_STATE.pendingRaceResult.result;
    const origSieger = (original.results.find(r => r.position === 1) || {}).name;
    const toteImRennen = original.results.filter(r => r.fatal).length;
    const punkteVorher = Object.values(ctx.GAME_STATE.driverStandings || {})
        .reduce((s, d) => s + (d.points || 0), 0);

    /* ── 2. ZIELFLAGGE faehrt ── */
    const { chromium } = require('playwright');
    const b = await chromium.launch();
    const page = await b.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file:///' + path.join(__dirname, '..', 'zielflagge', 'index.html').replace(/\\/g, '/'),
        { waitUntil: 'load' });
    await page.waitForTimeout(900);

    const zf = await page.evaluate(txt => {
        try {
            applyImportResult(parseImportedText(txt));
            if (!state.lieferung) return { err: 'Lieferung nicht erkannt' };
            // Ein Fahrer aus der hinteren Haelfte: nur dann ist "Plaetze gutmachen"
            // ueberhaupt moeglich. Wer von P2 startet und auf P3 landet, hat einen
            // verloren - das waere ein Fehler der Testannahme, nicht der Logik.
            state.laps = 6;
            {
                const vorlauf = (state.lieferung.grid || [])
                    .slice().sort((a, b) => a.position - b.position);
                const hinten = vorlauf[Math.floor(vorlauf.length * 0.7)];
                state.playerDriverId = (hinten && DRIVERS.some(d => d.id === hinten.driver))
                    ? hinten.driver : DRIVERS[DRIVERS.length - 1].id;
            }
            startRace();
            const startPlatz = state.grid.findIndex(q => q.id === state.playerDriverId) + 1;

            // "Fahren" simulieren: eine Zeit setzen, die den Spieler nach vorn bringt.
            // Etwas schneller als der Drittplatzierte der KI.
            const kiZeiten = state.starters.filter(d => d.id !== state.playerDriverId && !aiSim.retired[d.id])
                .map(d => aiSim.cumulative[d.id] * state.aiScale).sort((a, b) => a - b);
            const ziel = kiZeiten.length > 2 ? kiZeiten[2] - 0.5 : 1;
            player.finished = true;
            player.lap = state.laps;
            player.lapTimes = [ziel];
            player.bestLap = ziel / state.laps;
            finalizeAndShowResults();

            const rueck = buildRpgRueckgabe();
            const meiner = (state.finalClassification || []).find(e => e.isPlayer);
            return {
                rueck, startPlatz,
                zielPlatz: meiner ? meiner.pos : null,
                spielerId: state.playerDriverId
            };
        } catch (e) { return { err: e.message }; }
    }, lief.text);
    await b.close();

    if (zf.err) { console.log('FEHLER in ZIELFLAGGE: ' + zf.err); process.exit(1); }
    prW('Rueckgabe erzeugt', !!zf.rueck, zf.rueck ? zf.rueck.reihenfolge.length + ' Zeilen' : '-');
    prW('Spieler hat Plaetze gutgemacht', zf.zielPlatz < zf.startPlatz,
        'P' + zf.startPlatz + ' -> P' + zf.zielPlatz);
    pr('Rueckgabe ohne Punkte', zf.rueck.reihenfolge.every(x => x.points === undefined), true);

    /* ── 3. RPG uebernimmt ── */
    // ⚠ sim-core ersetzt GAME_STATE asynchron (Autoload-Timer), waehrend der
    //   Playwright-Teil laeuft - das geparkte Ergebnis ist danach weg. Im ECHTEN
    //   Spiel passiert das nicht: geprueft, dass pendingRaceResult die
    //   Serialisierung und sanitizeGameState uebersteht, also gespeichert und
    //   wieder geladen wird. Hier deshalb wiederherstellen, sonst testet man das
    //   Testwerkzeug statt der Logik.
    if (!ctx.GAME_STATE.pendingRaceResult) {
        ctx.GAME_STATE.pendingRaceResult = { raceIndex: 0, result: original, isRain: false };
        ctx.GAME_STATE.currentYear = JAHR;
    }
    const r = ctx.window.uebernehmeZielflaggeErgebnis(zf.rueck);
    prW('Uebernahme akzeptiert', r.ok, r.ok ? 'ok' : r.grund);

    if (r.ok) {
        prW('Spieler auf gefahrener Position', r.spieler && r.spieler.position === zf.zielPlatz,
            r.spieler ? ('P' + r.spieler.position) : '-');

        const erg = (ctx.GAME_STATE.results || []).slice(-1)[0];
        prW('Rennen gewertet', !!erg, erg ? 'ja' : 'nein');

        // Punkte nach Aera: 1988 gab es 9 fuer den Sieg, nicht 25
        const sollSieg = ctx.getPointsForPosition(1, JAHR);
        const sieger = erg && (erg.results || []).find(x => x.position === 1);
        pr('Punkte fuer den Sieg (Aera)', sieger ? sieger.points : '-', sollSieg);

        const punkteNachher = Object.values(ctx.GAME_STATE.driverStandings || {})
            .reduce((s, d) => s + (d.points || 0), 0);
        prW('Punkte vergeben', punkteNachher > punkteVorher, punkteVorher + ' -> ' + punkteNachher);

        // Todesfaelle muessen den Rundlauf ueberleben
        const toteNachher = (erg && (erg.results || []).filter(x => x.fatal).length) || 0;
        pr('Todesfaelle erhalten', toteNachher, toteImRennen);

        prW('Parkplatz geleert', !ctx.GAME_STATE.pendingRaceResult, 'genau einmal wertbar');
        pr('currentRace weitergerueckt', ctx.GAME_STATE.currentRace, 1);

        // Zweiter Versuch muss abgelehnt werden
        const r2 = ctx.window.uebernehmeZielflaggeErgebnis(zf.rueck);
        prW('zweite Uebernahme abgelehnt', !r2.ok, r2.ok ? 'WURDE ANGENOMMEN' : 'abgelehnt');
    }

    console.log('\n═══ Rundlauf RPG → ZIELFLAGGE → RPG (' + JAHR + ') ═══\n');
    console.log('RPG rechnet    : Sieger ' + origSieger + (toteImRennen ? ('  (' + toteImRennen + ' toedlich)') : ''));
    console.log('ZIELFLAGGE     : Spieler P' + zf.startPlatz + ' -> P' + zf.zielPlatz);
    if (r.ok) console.log('RPG wertet     : Sieger ' + r.sieger + ', ' + r.fahrer + ' Fahrer\n');
    let schlecht = 0;
    p.forEach(x => {
        if (!x.ok) schlecht++;
        console.log((x.ok ? '  OK  ' : ' FEHL ') + x.n.padEnd(32) + 'ist=' + String(x.ist).padEnd(18) + 'soll=' + x.soll);
    });
    if (errs.length) console.log('\nSkriptfehler ZIELFLAGGE:\n  ' + errs.join('\n  '));
    console.log('\n' + (schlecht === 0 && !errs.length
        ? 'GRUEN — der Kreis ist geschlossen.'
        : schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN'));
    process.exit(schlecht === 0 && !errs.length ? 0 : 1);
})();
