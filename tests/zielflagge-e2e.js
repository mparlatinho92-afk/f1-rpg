/**
 * zielflagge-e2e.js — die ganze Kette in einem Lauf: RPG rechnet, ZIELFLAGGE animiert.
 *
 *   node tests/zielflagge-e2e.js [jahr] [rennen]
 *
 * Die einzige Pruefung, die BEIDE Haelften zusammen faehrt:
 *   zielflagge-lieferkette.js  prueft nur die RPG-Seite (baut sie korrekt?)
 *   zielflagge/test-lieferung.js  prueft nur die ZIELFLAGGE-Seite (mit synthetischen Daten)
 *   dieser Test                 verbindet sie mit einer ECHTEN Lieferung
 *
 * Architektur: simulateRace() -> Sofort-Sim | Live-Ticker | ZIELFLAGGE.
 * ZIELFLAGGE ist kein dritter Modus, sondern ein Live-Ticker in 3D. Die Zahlen
 * entstehen in EINER Engine; ZIELFLAGGE darf nur noch animieren.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const fs = require('fs');
const path = require('path');
const os = require('os');

const JAHR = parseInt(process.argv[2]) || 1988;
const RENNEN = parseInt(process.argv[3]) || 0;
const TMP = path.join(os.tmpdir(), 'zf-e2e-' + process.pid + '.json');

(async () => {
    /* ── 1. RPG: Rennen rechnen und liefern ── */
    const { getContext } = require('./sim-core');
    const ctx = getContext();
    ctx.initFromYear(JAHR);
    const lief = ctx.window.baueZielflaggeLieferung(RENNEN);
    if (!lief) { console.log('FEHLER: Lieferung liess sich nicht bauen'); process.exit(1); }
    fs.writeFileSync(TMP, lief.text, 'utf8');

    const zeilen = lief.text.split('\n').filter(Boolean);
    const rennen = JSON.parse(zeilen[2]);
    const sieger = (rennen.results.find(r => r.position === 1) || {}).name;
    const soll = rennen.results.filter(r => !r.dnf)
        .sort((a, b) => a.position - b.position).map(r => r.driver);
    const sollDnf = rennen.results.filter(r => r.dnf).map(r => r.driver).sort();

    /* ── 2. ZIELFLAGGE: Lieferung laden und animieren ── */
    const { chromium } = require('playwright');
    const b = await chromium.launch();
    const p = await b.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///' + path.join(__dirname, '..', 'zielflagge', 'index.html').replace(/\\/g, '/'),
        { waitUntil: 'load' });
    await p.waitForTimeout(900);

    const r = await p.evaluate(txt => {
        try {
            const res = parseImportedText(txt);
            applyImportResult(res);
            if (!state.lieferung) return { err: 'Lieferung nicht als solche erkannt' };
            state.playerDriverId = DRIVERS[0].id;
            state.laps = 10;
            startRace();
            if (!aiSim || !aiSim.ausLieferung) return { err: 'Animation kam NICHT aus der Lieferung' };
            const ist = state.starters
                .filter(d => d.id !== state.playerDriverId && !aiSim.retired[d.id])
                .map(d => ({ id: d.id, t: aiSim.cumulative[d.id] }))
                .sort((a, b) => a.t - b.t).map(x => x.id);
            const raus = state.starters
                .filter(d => d.id !== state.playerDriverId && aiSim.retired[d.id])
                .map(d => d.id).sort();
            return { ist, raus, spieler: state.playerDriverId, starter: state.starters.length, quelle: res.quelle };
        } catch (e) { return { err: e.message }; }
    }, lief.text);
    await b.close();
    try { fs.unlinkSync(TMP); } catch (_) { }

    /* ── 3. Vergleich ── */
    const p2 = [];
    const pr = (n, ist, soll) => p2.push({ n, ist, soll, ok: String(ist) === String(soll) });

    if (r.err) {
        console.log('\n═══ Lieferkette Ende zu Ende ═══\n');
        console.log('FEHLER in ZIELFLAGGE: ' + r.err);
        process.exit(1);
    }

    const sollOhne = soll.filter(id => id !== r.spieler);
    const sollDnfOhne = sollDnf.filter(id => id !== r.spieler);
    let abw = 0;
    for (let i = 0; i < Math.min(r.ist.length, sollOhne.length); i++) {
        if (r.ist[i] !== sollOhne[i]) abw++;
    }

    pr('Lieferung erkannt', /Spielstand/.test(r.quelle || ''), true);
    pr('Animation aus der Lieferung', true, true);
    pr('Starterzahl', r.starter, rennen.results.length);
    pr('gewertete Fahrer', r.ist.length, sollOhne.length);
    pr('Reihenfolge identisch', abw, 0);
    pr('Ausfaelle identisch', r.raus.join(','), sollDnfOhne.join(','));
    pr('keine Skriptfehler', errs.length, 0);

    console.log('\n═══ Lieferkette Ende zu Ende: ' + JAHR + ', Rennen ' + (RENNEN + 1) + ' ═══\n');
    console.log('RPG rechnet   : ' + rennen.rennName + ' — Sieger ' + sieger);
    console.log('Lieferung     : ' + Math.round(lief.text.length / 1024) + ' KB, ' +
        rennen.results.length + ' Fahrer, ' + sollDnf.length + ' Ausfaelle\n');
    let schlecht = 0;
    p2.forEach(x => {
        if (!x.ok) schlecht++;
        console.log((x.ok ? '  OK  ' : ' FEHL ') + x.n.padEnd(30) + 'ist=' + String(x.ist).padEnd(14) + 'soll=' + x.soll);
    });
    if (errs.length) console.log('\nSkriptfehler:\n  ' + errs.join('\n  '));
    console.log('\n' + (schlecht === 0
        ? 'GRUEN — das RPG rechnet, ZIELFLAGGE animiert exakt dorthin.'
        : schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN'));
    process.exit(schlecht === 0 ? 0 : 1);
})();
